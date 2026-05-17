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
using PodcastAPI.Services.PodcastCovers;
using System.Security.Claims;
using System.Text.Json;

namespace PodcastAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class PodcastsController(
    AppDbContext db,
    IBackgroundJobClient backgroundJobClient,
    IExternalPodcastService externalPodcastService,
    IPodcastCoverPoolService podcastCoverPoolService,
    IPodcastCoverDisplayUrlResolver podcastCoverDisplayUrlResolver) : ControllerBase
{
    private static readonly JsonSerializerOptions TranscriptJsonOptions = new(JsonSerializerDefaults.Web);

    /// <summary>Postgres/Npgsql sıklıkla Unspecified döner; karşılaştırmayı UTC ile sabitle.</summary>
    private static DateTime ToUtcAssumeStoredUtc(DateTime dt) =>
        dt.Kind switch
        {
            DateTimeKind.Utc => dt,
            DateTimeKind.Local => dt.ToUniversalTime(),
            _ => DateTime.SpecifyKind(dt, DateTimeKind.Utc),
        };

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

        var snapshot = await podcastCoverPoolService.GetPoolsSnapshotAsync(HttpContext.RequestAborted);
        podcast.CoverImageObjectKey = PodcastCoverPicker.PickFromPools(
            snapshot.ObjectKeysByCategory,
            request.Categories,
            podcast.Id);

        db.Podcasts.Add(podcast);
        await db.SaveChangesAsync();

        backgroundJobClient.Enqueue<IPodcastGeneratorJob>(job => job.RunAsync(podcast.Id, request));

        return Accepted(new { podcastId = podcast.Id, status = podcast.Status });
    }

    // GET: api/podcasts/listen-notes/{listenNotesPodcastId} — Listen Notes şov detayı + bölüm sesi (?episodeId= ile resume)
    [HttpGet("listen-notes/{listenNotesPodcastId}")]
    public async Task<ActionResult<PodcastDetailDto>> GetListenNotesPodcast(
        string listenNotesPodcastId,
        [FromQuery] string? episodeId,
        CancellationToken cancellationToken)
    {
        if (!TryGetUserId(out var userId))
            return Unauthorized(new { message = "Invalid token." });

        if (string.IsNullOrWhiteSpace(listenNotesPodcastId))
            return BadRequest(new { message = "Missing Listen Notes podcast id." });

        var dto = await externalPodcastService.GetPodcastDetailAsync(
            listenNotesPodcastId.Trim(),
            episodeId?.Trim(),
            HttpContext.RequestAborted);
        if (dto == null)
            return NotFound(new { message = "Podcast not found or Listen Notes unavailable." });

        if (!string.IsNullOrWhiteSpace(dto.ListenNotesEpisodeId))
        {
            var listening = await db.ExternalListeningHistories
                .AsNoTracking()
                .Where(h => h.UserId == userId && h.ListenNotesEpisodeId == dto.ListenNotesEpisodeId)
                .Select(h => new { h.ProgressSeconds, h.IsCompleted })
                .FirstOrDefaultAsync(cancellationToken);

            if (listening != null)
            {
                dto.ListeningProgressSeconds = listening.ProgressSeconds;
                dto.ListeningCompleted = listening.IsCompleted;
            }
        }

        return Ok(dto);
    }

    // GET: api/podcasts/{id} - Podcast detayını getirir
    [HttpGet("{id:guid}")]
    public async Task<ActionResult<PodcastDetailDto>> GetById(Guid id)
    {
        if (!TryGetUserId(out var userId)) return Unauthorized(new { message = "Invalid token." });

        var podcast = await db.Podcasts.Include(p => p.Sources).FirstOrDefaultAsync(p => p.Id == id);
        if (podcast == null) return NotFound();
        if (podcast.UserId != userId) return Forbid();

        var listening = await db.ListeningHistories
            .AsNoTracking()
            .Where(h => h.UserId == userId && h.PodcastId == id)
            .Select(h => new { h.ProgressSeconds, h.IsCompleted })
            .FirstOrDefaultAsync();

        var dto = await ToDetailDtoAsync(podcast, HttpContext.RequestAborted);
        if (listening != null)
        {
            dto.ListeningProgressSeconds = listening.ProgressSeconds;
            dto.ListeningCompleted = listening.IsCompleted;
        }

        return Ok(dto);
    }

    // GET: api/podcasts - Kullanıcının kendi ürettiği podcastleri listeler
    [HttpGet]
    public async Task<ActionResult<List<PodcastSummaryDto>>> GetAll(CancellationToken cancellationToken)
    {
        if (!TryGetUserId(out var userId)) return Unauthorized(new { message = "Invalid token." });

        var podcasts = await db.Podcasts
            .AsNoTracking()
            .Where(p => p.UserId == userId)
            .OrderByDescending(p => p.CreatedAt)
            .ToListAsync(cancellationToken);

        var list = new List<PodcastSummaryDto>(podcasts.Count);
        foreach (var p in podcasts)
            list.Add(await ToSummaryDtoAsync(p, cancellationToken));

        return Ok(list);
    }

    [HttpGet("latest")]
    public async Task<ActionResult<PodcastSummaryDto>> GetLatest(CancellationToken cancellationToken)
    {
        if (!TryGetUserId(out var userId)) return Unauthorized(new { message = "Invalid token." });

        var latest = await db.Podcasts
            .AsNoTracking()
            .Where(p => p.UserId == userId)
            .OrderByDescending(p => p.CreatedAt)
            .FirstOrDefaultAsync(cancellationToken);

        if (latest == null) return NoContent();

        var hero = latest;

        if (string.Equals(latest.Status, PodcastConstants.Status.Failed, StringComparison.OrdinalIgnoreCase))
        {
            var anchor = ToUtcAssumeStoredUtc(latest.FailedAt ?? latest.CreatedAt);
            if (DateTime.UtcNow - anchor >= TimeSpan.FromMinutes(5))
            {
                // Başarısız kayıt dışında en son tamamlanan bölüm (CreatedAt sıralaması bazen tz/kıyas yüzünden `< latest` ile kaçmasın).
                var prevCompleted = await db.Podcasts
                    .AsNoTracking()
                    .Where(p =>
                        p.UserId == userId
                        && p.Id != latest.Id
                        && p.Status != null
                        && p.Status.ToLower() == PodcastConstants.Status.Completed)
                    .OrderByDescending(p => p.CreatedAt)
                    .FirstOrDefaultAsync(cancellationToken);

                if (prevCompleted != null)
                    hero = prevCompleted;
            }
        }

        return Ok(await ToSummaryDtoAsync(hero, cancellationToken));
    }

    [HttpGet("recommended")]
    public async Task<ActionResult<List<PodcastSummaryDto>>> GetRecommended(CancellationToken cancellationToken)
    {
        if (!TryGetUserId(out var userId)) return Unauthorized(new { message = "Invalid token." });

        var external = DedupeExternal(
                await externalPodcastService.GetBestPodcastsAsync(null, cancellationToken: cancellationToken))
            .Take(10)
            .ToList();

        if (external.Count > 0)
            return Ok(external);

        var fallbackEntities = await db.Podcasts
            .AsNoTracking()
            .Where(p => p.UserId == userId && p.Status == PodcastConstants.Status.Completed)
            .OrderByDescending(p => p.CreatedAt)
            .Take(10)
            .ToListAsync(cancellationToken);

        var fallback = new List<PodcastSummaryDto>(fallbackEntities.Count);
        foreach (var p in fallbackEntities)
            fallback.Add(await ToSummaryDtoAsync(p, cancellationToken));

        return Ok(fallback);
    }

    private static List<PodcastSummaryDto> DedupeExternal(List<PodcastSummaryDto> items)
    {
        var seen = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        var result = new List<PodcastSummaryDto>();
        foreach (var x in items)
        {
            var key = x.ListenNotesUrl ?? x.AudioUrl ?? x.Title ?? "";
            if (string.IsNullOrWhiteSpace(key))
                continue;
            if (!seen.Add(key))
                continue;
            result.Add(x);
        }

        return result;
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

    [HttpPost("listen-notes/play")]
    public async Task<ActionResult> RecordListenNotesPlay([FromBody] ListenNotesPlayDto request, CancellationToken cancellationToken)
    {
        if (!TryGetUserId(out var userId)) return Unauthorized(new { message = "Invalid token." });

        var episodeId = request.ListenNotesEpisodeId?.Trim() ?? "";
        var podcastLnId = request.ListenNotesPodcastId?.Trim() ?? "";
        if (string.IsNullOrEmpty(episodeId) || string.IsNullOrEmpty(podcastLnId))
            return BadRequest(new { message = "listenNotesEpisodeId and listenNotesPodcastId are required." });

        var row = await db.ExternalListeningHistories
            .FirstOrDefaultAsync(h => h.UserId == userId && h.ListenNotesEpisodeId == episodeId, cancellationToken);

        if (row == null)
        {
            row = new ExternalListeningHistory
            {
                UserId = userId,
                ListenNotesEpisodeId = episodeId,
                ListenNotesPodcastId = podcastLnId,
            };
            db.ExternalListeningHistories.Add(row);
        }
        else if (!string.Equals(row.ListenNotesPodcastId, podcastLnId, StringComparison.Ordinal))
            row.ListenNotesPodcastId = podcastLnId;

        row.ProgressSeconds = Math.Max(0, request.ProgressSeconds);
        row.IsCompleted = request.IsCompleted;
        row.LastListenedAt = DateTime.UtcNow;

        if (!string.IsNullOrWhiteSpace(request.Title))
            row.Title = request.Title.Trim();
        if (!string.IsNullOrWhiteSpace(request.AudioUrl))
            row.AudioUrl = request.AudioUrl.Trim();
        if (request.DurationSeconds is > 0)
        {
            var prev = row.DurationSeconds ?? 0;
            row.DurationSeconds = Math.Max(prev, request.DurationSeconds.Value);
        }
        if (!string.IsNullOrWhiteSpace(request.CoverImageUrl))
            row.CoverImageUrl = request.CoverImageUrl.Trim();
        if (request.Categories is { Count: > 0 })
            row.CategoryBlob = string.Join(PodcastConstants.CategorySeparator, request.Categories);

        await db.SaveChangesAsync(cancellationToken);
        return Ok();
    }

    [HttpGet("recently-played")]
    public async Task<ActionResult<List<RecentlyPlayedDto>>> GetRecentlyPlayed(CancellationToken cancellationToken)
    {
        if (!TryGetUserId(out var userId)) return Unauthorized(new { message = "Invalid token." });

        const int takeEach = 40;
        var internalRows = await db.ListeningHistories
            .AsNoTracking()
            .Include(h => h.Podcast)
            .Where(h => h.UserId == userId)
            .OrderByDescending(h => h.LastListenedAt)
            .Take(takeEach)
            .ToListAsync(cancellationToken);

        var externalRows = await db.ExternalListeningHistories
            .AsNoTracking()
            .Where(h => h.UserId == userId)
            .OrderByDescending(h => h.LastListenedAt)
            .Take(takeEach)
            .ToListAsync(cancellationToken);

        var merged = new List<(DateTime At, RecentlyPlayedDto Dto)>();

        foreach (var h in internalRows)
        {
            var p = h.Podcast!;
            merged.Add((h.LastListenedAt, new RecentlyPlayedDto
            {
                PodcastId = h.PodcastId,
                Title = p.Title,
                AudioUrl = p.AudioUrl,
                ProgressSeconds = h.ProgressSeconds,
                IsCompleted = h.IsCompleted,
                LastListenedAt = h.LastListenedAt,
                DurationSeconds = p.DurationSeconds,
                Categories = string.IsNullOrWhiteSpace(p.CategoryName)
                    ? new List<string>()
                    : p.CategoryName.Split(PodcastConstants.CategorySeparator, StringSplitOptions.RemoveEmptyEntries).ToList(),
                CoverImageUrl = await podcastCoverDisplayUrlResolver.ResolveForPodcastAsync(p, cancellationToken),
                Status = p.Status,
                ListenNotesEpisodeId = null,
                ListenNotesPodcastId = null,
            }));
        }

        foreach (var e in externalRows)
        {
            var cats = string.IsNullOrWhiteSpace(e.CategoryBlob)
                ? new List<string>()
                : e.CategoryBlob.Split(PodcastConstants.CategorySeparator, StringSplitOptions.RemoveEmptyEntries).ToList();

            merged.Add((e.LastListenedAt, new RecentlyPlayedDto
            {
                PodcastId = ListenNotesService.StableListenNotesPodcastGuid(e.ListenNotesPodcastId),
                Title = string.IsNullOrWhiteSpace(e.Title) ? "Podcast" : e.Title,
                AudioUrl = e.AudioUrl,
                ProgressSeconds = e.ProgressSeconds,
                IsCompleted = e.IsCompleted,
                LastListenedAt = e.LastListenedAt,
                DurationSeconds = e.DurationSeconds,
                Categories = cats,
                CoverImageUrl = e.CoverImageUrl,
                Status = string.IsNullOrWhiteSpace(e.AudioUrl)
                    ? PodcastConstants.Status.Failed
                    : PodcastConstants.Status.Completed,
                ListenNotesEpisodeId = e.ListenNotesEpisodeId,
                ListenNotesPodcastId = e.ListenNotesPodcastId,
            }));
        }

        var history = merged
            .OrderByDescending(x => x.At)
            .Take(10)
            .Select(x => x.Dto)
            .ToList();

        return Ok(history);
    }

    // GET: api/podcasts/external/trending - Listen Notes üzerindeki popüler podcastleri getirir
    [HttpGet("external/trending")]
    public async Task<ActionResult<List<PodcastSummaryDto>>> GetExternalTrending([FromQuery] string? genreId)
    {
        var podcasts = await externalPodcastService.GetBestPodcastsAsync(genreId);
        return Ok(podcasts);
    }

    // GET: api/podcasts/external/recommended — Listen Notes global trending (best_podcasts); geriye uyumluluk için rota korunur.
    [HttpGet("external/recommended")]
    public async Task<ActionResult<List<PodcastSummaryDto>>> GetExternalRecommended(CancellationToken cancellationToken)
    {
        if (!TryGetUserId(out _)) return Unauthorized(new { message = "Invalid token." });

        var podcasts = await externalPodcastService.GetBestPodcastsAsync(null, cancellationToken: cancellationToken);
        return Ok(podcasts);
    }

    private bool TryGetUserId(out Guid userId)
    {
        var raw = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return Guid.TryParse(raw, out userId);
    }

    private async Task<PodcastSummaryDto> ToSummaryDtoAsync(Podcast p, CancellationToken cancellationToken) =>
        new()
        {
            Id = p.Id,
            Title = p.Title,
            AudioUrl = p.AudioUrl,
            DurationSeconds = p.DurationSeconds,
            Status = p.Status,
            Categories = string.IsNullOrWhiteSpace(p.CategoryName)
                ? new List<string>()
                : p.CategoryName.Split(PodcastConstants.CategorySeparator, StringSplitOptions.RemoveEmptyEntries).ToList(),
            CoverImageUrl = await podcastCoverDisplayUrlResolver.ResolveForPodcastAsync(p, cancellationToken),
            CreatedAt = p.CreatedAt,
            LearningMode = p.LearningMode,
            CefrLevel = p.CefrLevel,
        };

    private async Task<PodcastDetailDto> ToDetailDtoAsync(Podcast p, CancellationToken cancellationToken) =>
        new()
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
                : p.CategoryName.Split(PodcastConstants.CategorySeparator).ToList(),
            CoverImageUrl = await podcastCoverDisplayUrlResolver.ResolveForPodcastAsync(p, cancellationToken),
            CefrLevel = p.CefrLevel,
            LearningMode = p.LearningMode,
            CreatedAt = p.CreatedAt,
            Sources = p.Sources.Select(s => new PodcastSourceDto
            {
                SourceName = s.SourceName,
                NewsTitle = s.NewsTitle,
                NewsUrl = s.NewsUrl,
                PublishedAt = s.PublishedAt,
            }).ToList(),
            Transcript = string.IsNullOrWhiteSpace(p.TranscriptJson)
                ? new()
                : JsonSerializer.Deserialize<List<TranscriptSegmentDto>>(p.TranscriptJson, TranscriptJsonOptions) ?? new(),
            ListenNotesPodcastId = null,
            ListenNotesEpisodeId = null,
            Publisher = null,
        };
}