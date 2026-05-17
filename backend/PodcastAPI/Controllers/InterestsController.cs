using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PodcastAPI.Data;
using PodcastAPI.Dto;
using System.Security.Claims;

namespace PodcastAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class InterestsController(AppDbContext db) : ControllerBase
{
    // GET: api/interests — tüm kategoriler (kayıt ekranı için)
    [HttpGet]
    public async Task<ActionResult<List<InterestDto>>> GetAll(CancellationToken cancellationToken)
    {
        var interests = await db.Interests
            .OrderBy(i => i.Id)
            .Select(i => new InterestDto
            {
                Id = i.Id,
                Name = i.Name,
                Description = i.Description
            })
            .ToListAsync(cancellationToken);

        return Ok(interests);
    }

    // GET: api/interests/my — oturum açmış kullanıcının seçili ilgi alanları
    [HttpGet("my")]
    [Authorize]
    public async Task<ActionResult<List<InterestDto>>> GetMyInterests(CancellationToken cancellationToken)
    {
        var raw = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!Guid.TryParse(raw, out var userId))
            return Unauthorized(new { message = "Invalid token." });

        var interests = await db.UserInterests
            .Where(ui => ui.UserId == userId)
            .Join(db.Interests, ui => ui.InterestId, i => i.Id,
                (ui, i) => new InterestDto { Id = i.Id, Name = i.Name, Description = i.Description })
            .OrderBy(i => i.Name)
            .ToListAsync(cancellationToken);

        return Ok(interests);
    }
}
