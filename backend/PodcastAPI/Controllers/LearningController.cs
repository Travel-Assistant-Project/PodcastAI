using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PodcastAPI.Common;
using PodcastAPI.Data;
using PodcastAPI.Dto;
using PodcastAPI.Models;
using PodcastAPI.Services.AiService;
using PodcastAPI.Services.AiService.Models;

namespace PodcastAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class LearningController(
    AppDbContext db,
    IAiServiceClient aiServiceClient,
    ILogger<LearningController> logger) : ControllerBase
{
    [HttpPost("onboarding")]
    public async Task<IActionResult> Onboarding([FromBody] OnboardingDto dto)
    {
        if (!TryGetUserId(out var userId)) return Unauthorized(new { message = "Invalid token." });

        if (string.IsNullOrWhiteSpace(dto.PreferredMode)
            || !LearningConstants.Mode.Allowed.Contains(dto.PreferredMode))
        {
            return BadRequest(new { message = "PreferredMode 'listen' veya 'learn' olmalı." });
        }

        var mode = dto.PreferredMode.ToLowerInvariant();
        string? cefr = null;

        if (mode == LearningConstants.Mode.Learn)
        {
            if (string.IsNullOrWhiteSpace(dto.CefrLevel)
                || !LearningConstants.AllowedCefrLevels.Contains(dto.CefrLevel))
            {
                return BadRequest(new { message = "Öğrenme modunda CefrLevel zorunlu (A1..C2)." });
            }
            cefr = dto.CefrLevel.ToUpperInvariant();
        }

        var user = await db.Users.FirstOrDefaultAsync(u => u.Id == userId);
        if (user == null) return Unauthorized();

        user.PreferredMode = mode;
        user.CefrLevel = cefr;
        await db.SaveChangesAsync();

        return Ok(new { preferredMode = user.PreferredMode, cefrLevel = user.CefrLevel });
    }

    [HttpPost("translate-word")]
    public async Task<ActionResult<TranslateWordResponseDto>> TranslateWord([FromBody] TranslateWordRequestDto dto)
    {
        if (!TryGetUserId(out _)) return Unauthorized();

        var word = (dto.Word ?? string.Empty).Trim().ToLowerInvariant();
        if (string.IsNullOrWhiteSpace(word))
        {
            return BadRequest(new { message = "Word zorunludur." });
        }

        var sourceLang = string.IsNullOrWhiteSpace(dto.SourceLang) ? "en" : dto.SourceLang.ToLowerInvariant();
        var targetLang = string.IsNullOrWhiteSpace(dto.TargetLang) ? "tr" : dto.TargetLang.ToLowerInvariant();
        var contextHash = HashContext(dto.ContextSentence);

        // Cache lookup: aynı kelime + bağlam daha önce çevrildiyse AI servisi çağrılmaz.
        var cached = await db.WordTranslationCache.FirstOrDefaultAsync(c =>
            c.Word == word
            && c.SourceLang == sourceLang
            && c.TargetLang == targetLang
            && c.ContextHash == contextHash);

        if (cached != null)
        {
            return Ok(new TranslateWordResponseDto
            {
                Word = cached.Word,
                Translation = cached.Translation,
                PartOfSpeech = cached.PartOfSpeech,
                ExampleEn = cached.ExampleEn,
                ExampleTr = cached.ExampleTr,
                FromCache = true,
            });
        }

        AiTranslateWordResponse aiResp;
        try
        {
            aiResp = await aiServiceClient.TranslateWordAsync(new AiTranslateWordRequest
            {
                Word = word,
                ContextSentence = dto.ContextSentence,
                SourceLang = sourceLang,
                TargetLang = targetLang,
            });
        }
        catch (AiServiceException ex)
        {
            logger.LogError(ex, "Kelime çevirisi başarısız. Word={Word}", word);
            return StatusCode(StatusCodes.Status502BadGateway, new { message = "Çeviri servisi cevap vermedi." });
        }

        var entry = new WordTranslationCache
        {
            Word = word,
            SourceLang = sourceLang,
            TargetLang = targetLang,
            ContextHash = contextHash,
            Translation = aiResp.Translation,
            PartOfSpeech = aiResp.PartOfSpeech,
            ExampleEn = aiResp.ExampleEn,
            ExampleTr = aiResp.ExampleTr,
            CreatedAt = DateTime.UtcNow,
        };
        db.WordTranslationCache.Add(entry);
        try
        {
            await db.SaveChangesAsync();
        }
        catch (DbUpdateException)
        {
            // Yarış durumu: aynı anda başka bir istek aynı kaydı eklemiş olabilir; sorun değil.
            db.Entry(entry).State = EntityState.Detached;
        }

        return Ok(new TranslateWordResponseDto
        {
            Word = aiResp.Word,
            Translation = aiResp.Translation,
            PartOfSpeech = aiResp.PartOfSpeech,
            ExampleEn = aiResp.ExampleEn,
            ExampleTr = aiResp.ExampleTr,
            FromCache = false,
        });
    }

    [HttpPost("words")]
    public async Task<ActionResult<UserWordDto>> SaveWord([FromBody] SaveUserWordDto dto)
    {
        if (!TryGetUserId(out var userId)) return Unauthorized();

        var word = (dto.Word ?? string.Empty).Trim().ToLowerInvariant();
        if (string.IsNullOrWhiteSpace(word))
        {
            return BadRequest(new { message = "Word zorunludur." });
        }

        var existing = await db.UserWords.FirstOrDefaultAsync(w => w.UserId == userId && w.Word == word);
        if (existing != null)
        {
            existing.LookupCount += 1;
            existing.UpdatedAt = DateTime.UtcNow;
            // Daha güncel bağlam/çeviri varsa güncelle.
            if (!string.IsNullOrWhiteSpace(dto.ContextSentence))
                existing.ContextSentence = dto.ContextSentence;
            if (!string.IsNullOrWhiteSpace(dto.Translation))
                existing.Translation = dto.Translation;
            if (dto.PodcastId.HasValue)
                existing.PodcastId = dto.PodcastId;
            await db.SaveChangesAsync();
            return Ok(ToDto(existing));
        }

        var entry = new UserWord
        {
            UserId = userId,
            PodcastId = dto.PodcastId,
            Word = word,
            ContextSentence = dto.ContextSentence,
            Translation = dto.Translation,
            IsLearned = false,
            LookupCount = 1,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
        };
        db.UserWords.Add(entry);
        await db.SaveChangesAsync();
        return Ok(ToDto(entry));
    }

    [HttpGet("words")]
    public async Task<ActionResult<List<UserWordDto>>> GetWords([FromQuery] bool? onlyUnlearned)
    {
        if (!TryGetUserId(out var userId)) return Unauthorized();

        var query = db.UserWords.AsNoTracking().Where(w => w.UserId == userId);
        if (onlyUnlearned == true)
            query = query.Where(w => !w.IsLearned);

        var list = await query.OrderByDescending(w => w.UpdatedAt).Select(w => new UserWordDto
        {
            Id = w.Id,
            Word = w.Word,
            ContextSentence = w.ContextSentence,
            Translation = w.Translation,
            IsLearned = w.IsLearned,
            LookupCount = w.LookupCount,
            PodcastId = w.PodcastId,
            CreatedAt = w.CreatedAt,
        }).ToListAsync();

        return Ok(list);
    }

    [HttpPatch("words/{id:int}")]
    public async Task<ActionResult<UserWordDto>> UpdateWord(int id, [FromBody] UpdateUserWordDto dto)
    {
        if (!TryGetUserId(out var userId)) return Unauthorized();

        var entry = await db.UserWords.FirstOrDefaultAsync(w => w.Id == id && w.UserId == userId);
        if (entry == null) return NotFound();

        if (dto.IsLearned.HasValue)
        {
            entry.IsLearned = dto.IsLearned.Value;
            entry.UpdatedAt = DateTime.UtcNow;
        }
        await db.SaveChangesAsync();
        return Ok(ToDto(entry));
    }

    [HttpDelete("words/{id:int}")]
    public async Task<IActionResult> DeleteWord(int id)
    {
        if (!TryGetUserId(out var userId)) return Unauthorized();

        var entry = await db.UserWords.FirstOrDefaultAsync(w => w.Id == id && w.UserId == userId);
        if (entry == null) return NotFound();

        db.UserWords.Remove(entry);
        await db.SaveChangesAsync();
        return NoContent();
    }

    [HttpGet("progress")]
    public async Task<ActionResult<LearningProgressDto>> GetProgress()
    {
        if (!TryGetUserId(out var userId)) return Unauthorized();

        var totalWords = await db.UserWords.CountAsync(w => w.UserId == userId);
        var learnedWords = await db.UserWords.CountAsync(w => w.UserId == userId && w.IsLearned);
        var learningPodcasts = await db.Podcasts.CountAsync(p =>
            p.UserId == userId && p.LearningMode && p.Status == PodcastConstants.Status.Completed);
        var totalSeconds = await db.Podcasts
            .Where(p => p.UserId == userId && p.LearningMode && p.Status == PodcastConstants.Status.Completed)
            .Select(p => p.DurationSeconds ?? 0)
            .SumAsync();
        var user = await db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == userId);

        return Ok(new LearningProgressDto
        {
            TotalWords = totalWords,
            LearnedWords = learnedWords,
            LearningPodcastsCount = learningPodcasts,
            TotalListenSeconds = totalSeconds,
            CefrLevel = user?.CefrLevel,
        });
    }

    private static UserWordDto ToDto(UserWord w) => new()
    {
        Id = w.Id,
        Word = w.Word,
        ContextSentence = w.ContextSentence,
        Translation = w.Translation,
        IsLearned = w.IsLearned,
        LookupCount = w.LookupCount,
        PodcastId = w.PodcastId,
        CreatedAt = w.CreatedAt,
    };

    private static string? HashContext(string? sentence)
    {
        if (string.IsNullOrWhiteSpace(sentence)) return null;
        var normalized = sentence.Trim().ToLowerInvariant();
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(normalized));
        return Convert.ToHexString(bytes).ToLowerInvariant()[..32];
    }

    private bool TryGetUserId(out Guid userId)
    {
        var raw = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return Guid.TryParse(raw, out userId);
    }
}
