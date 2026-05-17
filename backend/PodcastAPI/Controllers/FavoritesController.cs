using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PodcastAPI.Common;
using PodcastAPI.Data;
using PodcastAPI.Dto;
using PodcastAPI.Models;
using PodcastAPI.Services.PodcastCovers;
using System.Security.Claims;

namespace PodcastAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class FavoritesController(AppDbContext db, IPodcastCoverDisplayUrlResolver podcastCoverDisplayUrlResolver)
    : ControllerBase
{
    [HttpGet("keys")]
    public async Task<ActionResult<FavoriteKeysDto>> GetFavoriteKeys(CancellationToken cancellationToken)
    {
        if (!TryGetUserId(out var userId))
            return Unauthorized();

        var podcastIds = await db.Favorites
            .AsNoTracking()
            .Where(f => f.UserId == userId)
            .Select(f => f.PodcastId)
            .ToListAsync(cancellationToken);

        return Ok(new FavoriteKeysDto
        {
            PodcastIds = podcastIds,
            ListenNotesPodcastIds = new List<string>(),
        });
    }

    [HttpGet]
    public async Task<ActionResult<List<PodcastSummaryDto>>> GetFavorites(CancellationToken cancellationToken)
    {
        if (!TryGetUserId(out var userId))
            return Unauthorized();

        var rows = await db.Favorites
            .AsNoTracking()
            .Where(f => f.UserId == userId)
            .Include(f => f.Podcast)
            .OrderByDescending(f => f.CreatedAt)
            .ToListAsync(cancellationToken);

        var list = new List<PodcastSummaryDto>(rows.Count);
        foreach (var row in rows)
            list.Add(await MapInternalFavoriteAsync(row.Podcast, row.CreatedAt, cancellationToken));

        return Ok(list);
    }

    [HttpPost("{podcastId:guid}")]
    public async Task<IActionResult> Add(Guid podcastId)
    {
        if (!TryGetUserId(out var userId))
            return Unauthorized();

        var exists = await db.Podcasts.AnyAsync(p => p.Id == podcastId);
        if (!exists)
            return NotFound("Podcast bulunamadı.");

        var already = await db.Favorites.AnyAsync(f => f.UserId == userId && f.PodcastId == podcastId);
        if (already)
            return BadRequest("Bu podcast zaten favorilerinizde.");

        db.Favorites.Add(new Favorite
        {
            UserId = userId,
            PodcastId = podcastId,
            CreatedAt = DateTime.UtcNow,
        });

        await db.SaveChangesAsync();
        return Ok(new { message = "Favorilere eklendi." });
    }

    [HttpDelete("{podcastId:guid}")]
    public async Task<IActionResult> Remove(Guid podcastId)
    {
        if (!TryGetUserId(out var userId))
            return Unauthorized();

        var favorite = await db.Favorites.FirstOrDefaultAsync(f => f.UserId == userId && f.PodcastId == podcastId);
        if (favorite == null)
            return NotFound("Favori kaydı bulunamadı.");

        db.Favorites.Remove(favorite);
        await db.SaveChangesAsync();
        return Ok(new { message = "Favorilerden çıkarıldı." });
    }

    private async Task<PodcastSummaryDto> MapInternalFavoriteAsync(
        Podcast p,
        DateTime favoritedAt,
        CancellationToken cancellationToken)
    {
        var categories = string.IsNullOrWhiteSpace(p.CategoryName)
            ? new List<string>()
            : p.CategoryName
                .Split(PodcastConstants.CategorySeparator, StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                .ToList();

        return new PodcastSummaryDto
        {
            Id = p.Id,
            Title = p.Title,
            AudioUrl = p.AudioUrl,
            DurationSeconds = p.DurationSeconds,
            Status = p.Status,
            Categories = categories,
            CoverImageUrl = await podcastCoverDisplayUrlResolver.ResolveForPodcastAsync(p, cancellationToken),
            ListenNotesUrl = null,
            Publisher = null,
            ListenNotesPodcastId = null,
            CreatedAt = favoritedAt,
            LearningMode = p.LearningMode,
            CefrLevel = p.CefrLevel,
        };
    }

    private bool TryGetUserId(out Guid userId)
    {
        var raw = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return Guid.TryParse(raw, out userId);
    }
}
