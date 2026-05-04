using Hangfire;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PodcastAPI.Common;
using PodcastAPI.Data;
using PodcastAPI.Dto;
using PodcastAPI.Models;
using PodcastAPI.Services;
using System.Security.Claims;
using System.Text.Json;

namespace PodcastAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class PodcastsController(
    AppDbContext db,
    IBackgroundJobClient backgroundJobClient) : ControllerBase
{
    private static readonly JsonSerializerOptions TranscriptJsonOptions = new(JsonSerializerDefaults.Web);

    [HttpPost("generate")]
    public async Task<ActionResult> Generate([FromBody] GeneratePodcastRequestDto request)
    {
        if (!TryGetUserId(out var userId)) return Unauthorized(new { message = "Invalid token." });

        // İlk kaydı oluştur ve durumu 'processing'e çek
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

        // İşi Hangfire kuyruğuna ekle (Fire-and-Forget)
        backgroundJobClient.Enqueue<IPodcastGeneratorJob>(job => job.RunAsync(podcast.Id, request));

        // Kullanıcıya hemen cevap dön
        return Accepted(new { podcastId = podcast.Id, status = podcast.Status });
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<PodcastDetailDto>> GetById(Guid id)
    {
        if (!TryGetUserId(out var userId)) return Unauthorized(new { message = "Invalid token." });

        var podcast = await db.Podcasts.Include(p => p.Sources).FirstOrDefaultAsync(p => p.Id == id);
        if (podcast == null) return NotFound();
        if (podcast.UserId != userId) return Forbid();

        return Ok(ToDetailDto(podcast));
    }

    [HttpGet]
    public async Task<ActionResult<List<PodcastSummaryDto>>> GetAll()
    {
        if (!TryGetUserId(out var userId)) return Unauthorized(new { message = "Invalid token." });

        var podcasts = await db.Podcasts
            .AsNoTracking()
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
                CreatedAt = p.CreatedAt,
                LearningMode = p.LearningMode,
                CefrLevel = p.CefrLevel
            })
            .ToListAsync();

        return Ok(podcasts);
    }

    private bool TryGetUserId(out Guid userId)
    {
        var raw = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return Guid.TryParse(raw, out userId);
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