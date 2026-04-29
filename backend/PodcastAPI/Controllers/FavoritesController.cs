using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PodcastAPI.Data;
using PodcastAPI.Dto;
using PodcastAPI.Models;
using System.Security.Claims;

namespace PodcastAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize] // Sadece giriş yapmış kullanıcılar erişebilir
public class FavoritesController(AppDbContext db) : ControllerBase
{
    // GET: api/favorites - Kullanıcının favori podcastlerini listeler
    [HttpGet]
    public async Task<ActionResult<List<PodcastSummaryDto>>> GetFavorites()
    {
        if (!TryGetUserId(out var userId)) return Unauthorized();

        var favorites = await db.Favorites
            .Where(f => f.UserId == userId)
            .Include(f => f.Podcast) // Podcast bilgilerini çek
            .OrderByDescending(f => f.CreatedAt)
            .Select(f => new PodcastSummaryDto
            {
                Id = f.Podcast.Id,
                Title = f.Podcast.Title,
                AudioUrl = f.Podcast.AudioUrl,
                DurationSeconds = f.Podcast.DurationSeconds,
                Status = f.Podcast.Status,
                CreatedAt = f.Podcast.CreatedAt,
                Categories = string.IsNullOrWhiteSpace(f.Podcast.CategoryName)
                    ? new List<string>()
                    : f.Podcast.CategoryName.Split(',', StringSplitOptions.None).ToList()
            })
            .ToListAsync();

        return Ok(favorites);
    }

    // POST: api/favorites/{id} - Podcast'i favorilere ekler
    [HttpPost("{podcastId:guid}")]
    public async Task<IActionResult> Add(Guid podcastId)
    {
        if (!TryGetUserId(out var userId)) return Unauthorized();

        // Podcast var mı?
        var exists = await db.Podcasts.AnyAsync(p => p.Id == podcastId);
        if (!exists) return NotFound("Podcast bulunamadı.");

        // Zaten favoride mi?
        var alreadyFavorited = await db.Favorites.AnyAsync(f => f.UserId == userId && f.PodcastId == podcastId);
        if (alreadyFavorited) return BadRequest("Bu podcast zaten favorilerinizde.");

        var favorite = new Favorite
        {
            UserId = userId,
            PodcastId = podcastId,
            CreatedAt = DateTime.UtcNow
        };

        db.Favorites.Add(favorite);
        await db.SaveChangesAsync();

        return Ok(new { message = "Favorilere eklendi." });
    }

    // DELETE: api/favorites/{id} - Podcast'i favorilerden çıkarır
    [HttpDelete("{podcastId:guid}")]
    public async Task<IActionResult> Remove(Guid podcastId)
    {
        if (!TryGetUserId(out var userId)) return Unauthorized();

        var favorite = await db.Favorites.FirstOrDefaultAsync(f => f.UserId == userId && f.PodcastId == podcastId);
        if (favorite == null) return NotFound("Favori kaydı bulunamadı.");

        db.Favorites.Remove(favorite);
        await db.SaveChangesAsync();

        return Ok(new { message = "Favorilerden çıkarıldı." });
    }

    private bool TryGetUserId(out Guid userId)
    {
        var raw = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return Guid.TryParse(raw, out userId);
    }
}