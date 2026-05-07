using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PodcastAPI.Data;
using PodcastAPI.Dto;
using System.Security.Claims;

namespace PodcastAPI.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class UserController(AppDbContext context) : ControllerBase
{
    [HttpGet("profile")]
    public async Task<ActionResult<ProfileDto>> GetProfile()
    {
        var userId = GetUserId();

        var user = await context.Users
            .Where(u => u.Id == userId)
            .Select(u => new ProfileDto
            {
                Id = u.Id,
                FullName = u.FullName,
                Email = u.Email,
                Age = u.Age,
                Occupation = u.Occupation,
                CreatedAt = u.CreatedAt
            })
            .FirstOrDefaultAsync();

        if (user == null)
            return NotFound(new { message = "User not found." });

        return Ok(user);
    }

    [HttpPut("profile")]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileDto updateDto)
    {
        var userId = GetUserId();
        var user = await context.Users.FindAsync(userId);

        if (user == null)
            return NotFound(new { message = "User not found." });

        user.FullName = updateDto.FullName;
        user.Age = updateDto.Age;
        user.Occupation = updateDto.Occupation;

        try
        {
            await context.SaveChangesAsync();
            return Ok(new { message = "Profile updated successfully." });
        }
        catch (Exception)
        {
            return StatusCode(500, new { message = "An error occurred while updating the profile." });
        }
    }

    private Guid GetUserId()
    {
        var claim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return Guid.TryParse(claim, out var userId) ? userId : Guid.Empty;
    }
}