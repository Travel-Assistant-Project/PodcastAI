using System.Security.Claims;
using System.Text.Json;
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
public class PodcastsController(
    AppDbContext db,
    IAiServiceClient aiServiceClient,
    ILogger<PodcastsController> logger) : ControllerBase
{
    private static readonly JsonSerializerOptions TranscriptJsonOptions =
        new(JsonSerializerDefaults.Web);


    // POST: api/podcasts/generate
    [HttpPost("generate")]
    public async Task<ActionResult<PodcastDetailDto>> Generate(
        [FromBody] GeneratePodcastRequestDto request,
        CancellationToken cancellationToken)
    {
        if (!TryGetUserId(out var userId))
        {
            return Unauthorized(new { message = "Geçersiz token." });
        }

        // 1) Girdi doğrulama
        var validationError = await ValidateAsync(request, cancellationToken);
        if (validationError is not null)
        {
            return BadRequest(new { message = validationError });
        }

        var normalizedCategories = request.Categories
            .Select(c => c.Trim().ToLowerInvariant())
            .Distinct()
            .ToList();

        // 2) Processing kaydı oluştur
        var podcast = new Podcast
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Tone = request.Tone.Trim().ToLowerInvariant(),
            SpeakerCount = request.SpeakerCount,
            Status = PodcastConstants.Status.Processing,
            CategoryName = string.Join(PodcastConstants.CategorySeparator, normalizedCategories),
            CreatedAt = DateTime.UtcNow
        };

        db.Podcasts.Add(podcast);
        await db.SaveChangesAsync(cancellationToken);

        // 3) ai-service'i çağır
        AiGenerateResponse aiResponse;
        try
        {
            aiResponse = await aiServiceClient.GeneratePodcastAsync(new AiGenerateRequest
            {
                PodcastId = podcast.Id,
                Categories = normalizedCategories,
                Tone = podcast.Tone!,
                DurationMinutes = request.DurationMinutes,
                SpeakerCount = request.SpeakerCount,
                Language = "en"
            }, cancellationToken);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "ai-service podcast üretiminde başarısız. PodcastId={PodcastId}", podcast.Id);

            podcast.Status = PodcastConstants.Status.Failed;
            await db.SaveChangesAsync(CancellationToken.None);

            return StatusCode(StatusCodes.Status502BadGateway, new
            {
                message = "Podcast üretimi başarısız oldu.",
                podcastId = podcast.Id
            });
        }

        // 4) Sonucu DB'ye yaz
        podcast.Title = aiResponse.Title;
        podcast.ScriptText = aiResponse.ScriptText;
        podcast.AudioUrl = aiResponse.AudioUrl;
        podcast.DurationSeconds = aiResponse.DurationSeconds;
        podcast.Status = PodcastConstants.Status.Completed;
        podcast.TranscriptJson = SerializeTranscript(aiResponse.Transcript);

        foreach (var s in aiResponse.Sources)
        {
            podcast.Sources.Add(new PodcastSource
            {
                PodcastId = podcast.Id,
                SourceName = s.SourceName,
                NewsTitle = s.NewsTitle,
                NewsUrl = s.NewsUrl,
                PublishedAt = s.PublishedAt
            });
        }

        await db.SaveChangesAsync(cancellationToken);

        return Ok(ToDetailDto(podcast));
    }

    // GET: api/podcasts/{id}
    [HttpGet("{id:guid}")]
    public async Task<ActionResult<PodcastDetailDto>> GetById(Guid id, CancellationToken cancellationToken)
    {
        if (!TryGetUserId(out var userId))
        {
            return Unauthorized(new { message = "Geçersiz token." });
        }

        var podcast = await db.Podcasts
            .Include(p => p.Sources)
            .FirstOrDefaultAsync(p => p.Id == id, cancellationToken);

        if (podcast is null)
        {
            return NotFound(new { message = "Podcast bulunamadı." });
        }

        if (podcast.UserId != userId)
        {
            return Forbid();
        }

        return Ok(ToDetailDto(podcast));
    }

    // GET: api/podcasts
    [HttpGet]
    public async Task<ActionResult<List<PodcastSummaryDto>>> GetMine(CancellationToken cancellationToken)
    {
        if (!TryGetUserId(out var userId))
        {
            return Unauthorized(new { message = "Geçersiz token." });
        }

        var list = await db.Podcasts
            .Where(p => p.UserId == userId)
            .OrderByDescending(p => p.CreatedAt)
            .Select(p => new PodcastSummaryDto
            {
                Id = p.Id,
                Title = p.Title,
                AudioUrl = p.AudioUrl,
                DurationSeconds = p.DurationSeconds,
                Status = p.Status,
                Categories = string.IsNullOrWhiteSpace(p.CategoryName)
                    ? new List<string>()
                    : p.CategoryName.Split(PodcastConstants.CategorySeparator, StringSplitOptions.RemoveEmptyEntries).ToList(),
                CreatedAt = p.CreatedAt
            })
            .ToListAsync(cancellationToken);

        return Ok(list);
    }

    // --- helpers ---

    private bool TryGetUserId(out Guid userId)
    {
        var raw = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return Guid.TryParse(raw, out userId);
    }

    private async Task<string?> ValidateAsync(GeneratePodcastRequestDto request, CancellationToken cancellationToken)
    {
        if (request.Categories is null || request.Categories.Count == 0)
        {
            return "En az bir kategori seçmelisiniz.";
        }

        if (string.IsNullOrWhiteSpace(request.Tone) ||
            !PodcastConstants.Tone.Allowed.Contains(request.Tone.Trim()))
        {
            return $"Geçerli tone değerleri: {string.Join(", ", PodcastConstants.Tone.Allowed)}.";
        }

        if (!PodcastConstants.AllowedDurationMinutes.Contains(request.DurationMinutes))
        {
            return $"Geçerli süre değerleri (dk): {string.Join(", ", PodcastConstants.AllowedDurationMinutes)}.";
        }

        if (!PodcastConstants.AllowedSpeakerCounts.Contains(request.SpeakerCount))
        {
            return $"Geçerli sunucu sayıları: {string.Join(", ", PodcastConstants.AllowedSpeakerCounts)}.";
        }

        var requested = request.Categories
            .Where(c => !string.IsNullOrWhiteSpace(c))
            .Select(c => c.Trim().ToLowerInvariant())
            .Distinct()
            .ToList();

        if (requested.Count == 0)
        {
            return "En az bir kategori seçmelisiniz.";
        }

        var existing = await db.Interests
            .Where(i => requested.Contains(i.Name.ToLower()))
            .Select(i => i.Name.ToLower())
            .ToListAsync(cancellationToken);

        var unknown = requested.Except(existing).ToList();
        if (unknown.Count > 0)
        {
            return $"Bilinmeyen kategori(ler): {string.Join(", ", unknown)}.";
        }

        return null;
    }

    private PodcastDetailDto ToDetailDto(Podcast p) => new()
    {
        Id = p.Id,
        UserId = p.UserId,
        Title = p.Title,
        ScriptText = p.ScriptText,
        AudioUrl = p.AudioUrl,
        DurationSeconds = p.DurationSeconds,
        Tone = p.Tone,
        SpeakerCount = p.SpeakerCount,
        Status = p.Status,
        Categories = string.IsNullOrWhiteSpace(p.CategoryName)
            ? new List<string>()
            : p.CategoryName.Split(PodcastConstants.CategorySeparator, StringSplitOptions.RemoveEmptyEntries).ToList(),
        CreatedAt = p.CreatedAt,
        Sources = p.Sources.Select(s => new PodcastSourceDto
        {
            SourceName = s.SourceName,
            NewsTitle = s.NewsTitle,
            NewsUrl = s.NewsUrl,
            PublishedAt = s.PublishedAt
        }).ToList(),
        Transcript = DeserializeTranscript(p.TranscriptJson)
    };

    private static string? SerializeTranscript(List<AiTranscriptSegment>? segments)
    {
        if (segments is null || segments.Count == 0) return null;

        var dtos = segments
            .OrderBy(s => s.Order)
            .Select(s => new TranscriptSegmentDto
            {
                Order = s.Order,
                Speaker = s.Speaker,
                Text = s.Text,
                StartMs = s.StartMs,
                EndMs = s.EndMs,
            })
            .ToList();

        return JsonSerializer.Serialize(dtos, TranscriptJsonOptions);
    }

    private List<TranscriptSegmentDto> DeserializeTranscript(string? json)
    {
        if (string.IsNullOrWhiteSpace(json)) return new();

        try
        {
            return JsonSerializer.Deserialize<List<TranscriptSegmentDto>>(json, TranscriptJsonOptions)
                   ?? new List<TranscriptSegmentDto>();
        }
        catch (JsonException ex)
        {
            // Bozuk JSON podcast yüklenmesini engellemesin; sadece transcript boş döner.
            logger.LogWarning(ex, "TranscriptJson parse edilemedi.");
            return new();
        }
    }
}
