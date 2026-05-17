using Hangfire;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PodcastAPI.Common;
using PodcastAPI.Data;
using PodcastAPI.Dto;
using PodcastAPI.Models;
using PodcastAPI.Services;
using PodcastAPI.Services.External;
using System.Security.Claims;
using System.Text.Json;

namespace PodcastAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class PodcastsController(
    AppDbContext db,
    IBackgroundJobClient backgroundJobClient,
    IExternalPodcastService externalPodcastService) : ControllerBase
{
    private static readonly JsonSerializerOptions TranscriptJsonOptions = new(JsonSerializerDefaults.Web);

    // POST: api/podcasts/generate - Kendi AI Podcast'ini üretir
    [HttpPost("generate")]
    public async Task<ActionResult> Generate([FromBody] GeneratePodcastRequestDto request)
    {
        if (!TryGetUserId(out var userId)) return Unauthorized(new { message = "Invalid token." });

        var podcast = new Podcast
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Tone = request.Tone.Trim().ToLowerInvariant(),
            SpeakerCount = request.SpeakerCount,
            Status = PodcastConstants.Status.Processing,
            CategoryName = string.Join(PodcastConstants.CategorySeparator, request.Categories),
            LearningMode = request.LearningMode,
            CefrLevel = request.LearningMode
                ? request.CefrLevel?.Trim().ToUpperInvariant()
                : null,
            CreatedAt = DateTime.UtcNow
        };

        db.Podcasts.Add(podcast);
        await db.SaveChangesAsync();

        backgroundJobClient.Enqueue<IPodcastGeneratorJob>(job => job.RunAsync(podcast.Id, request));

        return Accepted(new { podcastId = podcast.Id, status = podcast.Status });
    }

    // GET: api/podcasts/{id} - Podcast detayını getirir
    [HttpGet("{id:guid}")]
    public async Task<ActionResult<PodcastDetailDto>> GetById(Guid id)
    {
        if (!TryGetUserId(out var userId)) return Unauthorized(new { message = "Invalid token." });

        var podcast = await db.Podcasts.Include(p => p.Sources).FirstOrDefaultAsync(p => p.Id == id);
        if (podcast == null) return NotFound();
        if (podcast.UserId != userId) return Forbid();

        return Ok(ToDetailDto(podcast));
    }

    // GET: api/podcasts - Kullanıcının kendi ürettiği podcastleri listeler
    [HttpGet]
    public async Task<ActionResult<List<PodcastSummaryDto>>> GetAll()
    {
        if (!TryGetUserId(out var userId)) return Unauthorized(new { message = "Invalid token." });

        var podcasts = await db.Podcasts
            .AsNoTracking()
            .Where(p => p.UserId == userId)
            .OrderByDescending(p => p.CreatedAt)
            .ToListAsync();

        return Ok(podcasts.Select(ToSummaryDto).ToList());
    }

    [HttpGet("latest")]
    public async Task<ActionResult<PodcastSummaryDto>> GetLatest()
    {
        if (!TryGetUserId(out var userId)) return Unauthorized(new { message = "Invalid token." });

        var podcast = await db.Podcasts
            .AsNoTracking()
            .Where(p => p.UserId == userId)
            .OrderByDescending(p => p.CreatedAt)
            .FirstOrDefaultAsync();

        if (podcast == null) return NoContent();
        return Ok(ToSummaryDto(podcast));
    }

    [HttpGet("recommended")]
    public async Task<ActionResult<List<PodcastSummaryDto>>> GetRecommended()
    {
        if (!TryGetUserId(out var userId)) return Unauthorized(new { message = "Invalid token." });

        // Kullanıcının ilgi alanlarını çek
        var interestIds = await db.UserInterests
            .Where(ui => ui.UserId == userId)
            .Select(ui => ui.InterestId)
            .ToListAsync();

        var interestNames = await db.Interests
            .Where(i => interestIds.Contains(i.Id))
            .Select(i => i.Name.ToLower())
            .ToListAsync();

        // Tamamlanmış podcast'leri al, ilgi eşleşmesine göre skorla
        var completed = await db.Podcasts
            .AsNoTracking()
            .Where(p => p.UserId == userId && p.Status == PodcastConstants.Status.Completed)
            .OrderByDescending(p => p.CreatedAt)
            .Take(30)
            .ToListAsync();

        var recommended = completed
            .Select(p => new
            {
                Podcast = p,
                Score = interestNames.Count(interest =>
                    (p.CategoryName ?? "").Contains(interest, StringComparison.OrdinalIgnoreCase))
            })
            .OrderByDescending(x => x.Score)
            .ThenByDescending(x => x.Podcast.CreatedAt)
            .Take(6)
            .Select(x => ToSummaryDto(x.Podcast))
            .ToList();

        return Ok(recommended);
    }

    [HttpPost("{id:guid}/play")]
    public async Task<ActionResult> RecordPlay(Guid id, [FromBody] RecordPlayDto request)
    {
        if (!TryGetUserId(out var userId)) return Unauthorized(new { message = "Invalid token." });

        var podcastExists = await db.Podcasts.AnyAsync(p => p.Id == id && p.UserId == userId);
        if (!podcastExists) return NotFound();

        var history = await db.ListeningHistories
            .FirstOrDefaultAsync(h => h.UserId == userId && h.PodcastId == id);

        if (history == null)
        {
            history = new ListeningHistory { UserId = userId, PodcastId = id };
            db.ListeningHistories.Add(history);
        }

        history.ProgressSeconds = request.ProgressSeconds;
        history.IsCompleted = request.IsCompleted;
        history.LastListenedAt = DateTime.UtcNow;

        await db.SaveChangesAsync();
        return Ok();
    }

    [HttpGet("recently-played")]
    public async Task<ActionResult<List<RecentlyPlayedDto>>> GetRecentlyPlayed()
    {
        if (!TryGetUserId(out var userId)) return Unauthorized(new { message = "Invalid token." });

        var history = await db.ListeningHistories
            .AsNoTracking()
            .Include(h => h.Podcast)
            .Where(h => h.UserId == userId)
            .OrderByDescending(h => h.LastListenedAt)
            .Take(10)
            .Select(h => new RecentlyPlayedDto
            {
                PodcastId = h.PodcastId,
                Title = h.Podcast.Title,
                AudioUrl = h.Podcast.AudioUrl,
                ProgressSeconds = h.ProgressSeconds,
                IsCompleted = h.IsCompleted,
                LastListenedAt = h.LastListenedAt,
                DurationSeconds = h.Podcast.DurationSeconds,
                Categories = string.IsNullOrWhiteSpace(h.Podcast.CategoryName)
                    ? new List<string>()
                    : h.Podcast.CategoryName.Split(PodcastConstants.CategorySeparator, StringSplitOptions.RemoveEmptyEntries).ToList(),
                Status = h.Podcast.Status
            })
            .ToListAsync();

        return Ok(history);
    }

    // GET: api/podcasts/external/trending - Listen Notes üzerindeki popüler podcastleri getirir
    [HttpGet("external/trending")]
    public async Task<ActionResult<List<PodcastSummaryDto>>> GetExternalTrending([FromQuery] string? genreId)
    {
        var podcasts = await externalPodcastService.GetBestPodcastsAsync(genreId);
        return Ok(podcasts);
    }

    // GET: api/podcasts/external/recommended - Kullanıcının ilgi alanlarına göre dış API'dan tavsiye getirir
    [HttpGet("external/recommended")]
    public async Task<ActionResult<List<PodcastSummaryDto>>> GetExternalRecommended()
    {
        if (!TryGetUserId(out var userId)) return Unauthorized(new { message = "Invalid token." });

        // Kullanıcının ilgi alanlarını DB'den isim olarak çekiyoruz
        var userInterests = await db.UserInterests
            .Where(ui => ui.UserId == userId)
            .Join(db.Interests, ui => ui.InterestId, i => i.Id, (ui, i) => i.Name)
            .ToListAsync();

        if (!userInterests.Any())
        {
            // İlgi alanı yoksa genel trendleri döndür
            return Ok(await externalPodcastService.GetBestPodcastsAsync(null));
        }

        var recommendations = await externalPodcastService.SearchByInterestsAsync(userInterests);
        return Ok(recommendations);
    }

    private bool TryGetUserId(out Guid userId)
    {
        var raw = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return Guid.TryParse(raw, out userId);
    }

    private PodcastSummaryDto ToSummaryDto(Podcast p) => new()
    {
        Id = p.Id,
        Title = p.Title,
        AudioUrl = p.AudioUrl,
        DurationSeconds = p.DurationSeconds,
        Status = p.Status,
        Categories = string.IsNullOrWhiteSpace(p.CategoryName)
            ? new List<string>()
            : p.CategoryName.Split(PodcastConstants.CategorySeparator, StringSplitOptions.RemoveEmptyEntries).ToList(),
        CreatedAt = p.CreatedAt,
        LearningMode = p.LearningMode,
        CefrLevel = p.CefrLevel
    };

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
        Categories = string.IsNullOrWhiteSpace(p.CategoryName) ? new List<string>() : p.CategoryName.Split(PodcastConstants.CategorySeparator).ToList(),
        CefrLevel = p.CefrLevel,
        LearningMode = p.LearningMode,
        CreatedAt = p.CreatedAt,
        Sources = p.Sources.Select(s => new PodcastSourceDto
        {
            SourceName = s.SourceName,
            NewsTitle = s.NewsTitle,
            NewsUrl = s.NewsUrl,
            PublishedAt = s.PublishedAt
        }).ToList(),
        Transcript = string.IsNullOrWhiteSpace(p.TranscriptJson) ? new() : JsonSerializer.Deserialize<List<TranscriptSegmentDto>>(p.TranscriptJson, TranscriptJsonOptions) ?? new()
    };
}