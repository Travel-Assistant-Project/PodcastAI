using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PodcastAPI.Common;
using PodcastAPI.Data;
using PodcastAPI.Dto;
using PodcastAPI.Models;
using PodcastAPI.Services.External;
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

        var listenNotesPodcastIds = await db.ExternalFavorites
            .AsNoTracking()
            .Where(f => f.UserId == userId)
            .Select(f => f.ListenNotesPodcastId)
            .ToListAsync(cancellationToken);

        return Ok(new FavoriteKeysDto
        {
            PodcastIds = podcastIds,
            ListenNotesPodcastIds = listenNotesPodcastIds,
        });
    }

    [HttpGet]
    public async Task<ActionResult<List<PodcastSummaryDto>>> GetFavorites(CancellationToken cancellationToken)
    {
        if (!TryGetUserId(out var userId))
            return Unauthorized();

        var internalRows = await db.Favorites
            .AsNoTracking()
            .Where(f => f.UserId == userId)
            .Include(f => f.Podcast)
            .OrderByDescending(f => f.CreatedAt)
            .ToListAsync(cancellationToken);

        var externalRows = await db.ExternalFavorites
            .AsNoTracking()
            .Where(f => f.UserId == userId)
            .OrderByDescending(f => f.CreatedAt)
            .ToListAsync(cancellationToken);

        var merged = new List<(DateTime At, PodcastSummaryDto Dto)>(internalRows.Count + externalRows.Count);

        foreach (var row in internalRows)
            merged.Add((row.CreatedAt, await MapInternalFavoriteAsync(row.Podcast, row.CreatedAt, cancellationToken)));

        foreach (var row in externalRows)
            merged.Add((row.CreatedAt, MapExternalFavorite(row)));

        var list = merged
            .OrderByDescending(x => x.At)
            .Select(x => x.Dto)
            .ToList();

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

    [HttpPost("listen-notes")]
    public async Task<IActionResult> AddListenNotes([FromBody] ListenNotesFavoriteDto request)
    {
        if (!TryGetUserId(out var userId))
            return Unauthorized();

        var lnId = request.ListenNotesPodcastId?.Trim() ?? "";
        if (lnId.Length == 0)
            return BadRequest("listenNotesPodcastId is required.");

        var already = await db.ExternalFavorites.AnyAsync(f =>
            f.UserId == userId && f.ListenNotesPodcastId == lnId);
        if (already)
            return BadRequest("Bu podcast zaten favorilerinizde.");

        var categoryBlob = BuildCategoryBlob(request.Categories, request.Publisher);

        db.ExternalFavorites.Add(new ExternalFavorite
        {
            UserId = userId,
            ListenNotesPodcastId = lnId,
            Title = request.Title?.Trim(),
            AudioUrl = request.AudioUrl?.Trim(),
            DurationSeconds = request.DurationSeconds,
            CoverImageUrl = request.CoverImageUrl?.Trim(),
            Publisher = request.Publisher?.Trim(),
            CategoryBlob = categoryBlob,
            CreatedAt = DateTime.UtcNow,
        });

        await db.SaveChangesAsync();
        return Ok(new { message = "Favorilere eklendi." });
    }

    [HttpDelete("listen-notes/{listenNotesPodcastId}")]
    public async Task<IActionResult> RemoveListenNotes(string listenNotesPodcastId)
    {
        if (!TryGetUserId(out var userId))
            return Unauthorized();

        var lnId = listenNotesPodcastId?.Trim() ?? "";
        if (lnId.Length == 0)
            return BadRequest("listenNotesPodcastId is required.");

        var favorite = await db.ExternalFavorites.FirstOrDefaultAsync(f =>
            f.UserId == userId && f.ListenNotesPodcastId == lnId);
        if (favorite == null)
            return NotFound("Favori kaydı bulunamadı.");

        db.ExternalFavorites.Remove(favorite);
        await db.SaveChangesAsync();
        return Ok(new { message = "Favorilerden çıkarıldı." });
    }

    private static string? BuildCategoryBlob(IReadOnlyList<string>? categories, string? publisher)
    {
        var seen = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        var list = new List<string>();

        foreach (var raw in categories ?? [])
        {
            var t = raw?.Trim();
            if (string.IsNullOrEmpty(t) || !seen.Add(t)) continue;
            list.Add(t);
        }

        var pub = publisher?.Trim();
        if (!string.IsNullOrEmpty(pub) && seen.Add(pub))
            list.Add(pub);

        return list.Count > 0 ? string.Join(PodcastConstants.CategorySeparator, list) : null;
    }

    private static List<string> ParseCategoryBlob(string? blob)
    {
        if (string.IsNullOrWhiteSpace(blob))
            return new List<string>();

        return blob
            .Split(PodcastConstants.CategorySeparator, StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .ToList();
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

    private static PodcastSummaryDto MapExternalFavorite(ExternalFavorite row)
    {
        var categories = ParseCategoryBlob(row.CategoryBlob);

        return new PodcastSummaryDto
        {
            Id = ListenNotesService.StableListenNotesPodcastGuid(row.ListenNotesPodcastId),
            Title = row.Title,
            AudioUrl = row.AudioUrl,
            DurationSeconds = row.DurationSeconds,
            Status = "External",
            Categories = categories,
            CoverImageUrl = row.CoverImageUrl,
            ListenNotesUrl = null,
            Publisher = row.Publisher,
            ListenNotesPodcastId = row.ListenNotesPodcastId,
            CreatedAt = row.CreatedAt,
            LearningMode = false,
            CefrLevel = null,
        };
    }

    private bool TryGetUserId(out Guid userId)
    {
        var raw = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return Guid.TryParse(raw, out userId);
    }
}
