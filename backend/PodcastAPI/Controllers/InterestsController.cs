using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PodcastAPI.Data;
using PodcastAPI.Dto;

namespace PodcastAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class InterestsController(AppDbContext db) : ControllerBase
{
    // GET: api/interests
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
}
