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
        Status = p.Status,
        Categories = string.IsNullOrWhiteSpace(p.CategoryName) ? new List<string>() : p.CategoryName.Split(PodcastConstants.CategorySeparator).ToList(),
        CreatedAt = p.CreatedAt,
        Transcript = string.IsNullOrWhiteSpace(p.TranscriptJson) ? new() : JsonSerializer.Deserialize<List<TranscriptSegmentDto>>(p.TranscriptJson, TranscriptJsonOptions) ?? new()
    };
}