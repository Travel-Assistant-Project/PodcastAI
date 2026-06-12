using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PodcastAPI.Data;
using PodcastAPI.Dto;
using PodcastAPI.Services;
using PodcastAPI.Services.Storage;
using System.Security.Claims;

namespace PodcastAPI.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class UserController(
    AppDbContext context,
    IProfilePhotoStorage profilePhotoStorage,
    IPasswordHasher passwordHasher,
    IWebHostEnvironment env) : ControllerBase
{
    private static readonly HashSet<string> AllowedExtensions = new(StringComparer.OrdinalIgnoreCase)
        { ".jpg", ".jpeg", ".png", ".webp" };

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
                PhotoUrl = u.PhotoUrl,
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

        var email = updateDto.Email.Trim().ToLowerInvariant();
        if (await context.Users.AnyAsync(u => u.Email == email && u.Id != userId))
            return Conflict(new { message = "This email is already registered." });

        user.FullName = updateDto.FullName.Trim();
        user.Email = email;
        user.Age = updateDto.Age;
        user.Occupation = string.IsNullOrWhiteSpace(updateDto.Occupation)
            ? null
            : updateDto.Occupation.Trim();

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

    [HttpPut("password")]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDto changeDto)
    {
        var userId = GetUserId();
        var user = await context.Users.FindAsync(userId);

        if (user == null)
            return NotFound(new { message = "User not found." });

        if (!passwordHasher.Verify(user, changeDto.CurrentPassword))
            return BadRequest(new { message = "Current password is incorrect." });

        if (changeDto.CurrentPassword == changeDto.NewPassword)
            return BadRequest(new { message = "New password must be different from the current password." });

        user.PasswordHash = passwordHasher.HashPassword(changeDto.NewPassword);

        try
        {
            await context.SaveChangesAsync();
            return Ok(new { message = "Password updated successfully." });
        }
        catch (Exception)
        {
            return StatusCode(500, new { message = "An error occurred while updating the password." });
        }
    }

    [HttpPost("profile-photo")]
    [Consumes("multipart/form-data")]
    public async Task<ActionResult> UploadProfilePhoto(IFormFile photo)
    {
        if (photo == null || photo.Length == 0)
            return BadRequest(new { message = "No file provided." });

        if (photo.Length > 5 * 1024 * 1024)
            return BadRequest(new { message = "File size cannot exceed 5 MB." });

        var ext = Path.GetExtension(photo.FileName);
        if (!AllowedExtensions.Contains(ext))
            return BadRequest(new { message = "Only JPG, PNG and WebP files are allowed." });

        var userId = GetUserId();
        if (userId == Guid.Empty)
            return Unauthorized(new { message = "Invalid token." });

        var user = await context.Users.FindAsync(userId);
        if (user == null) return NotFound(new { message = "User not found." });

        try
        {
            TryDeleteLegacyLocalPhoto(user.PhotoUrl);
            var photoUrl = await profilePhotoStorage.SaveAsync(photo, userId, HttpContext.RequestAborted);
            user.PhotoUrl = photoUrl;
            await context.SaveChangesAsync();

            return Ok(new { photoUrl });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>Eski wwwroot tabanlı fotoğraf dosyasını sil (Firebase'e geçişte disk dolmasın).</summary>
    private void TryDeleteLegacyLocalPhoto(string? previousUrl)
    {
        if (string.IsNullOrWhiteSpace(previousUrl)) return;

        var marker = "/photos/";
        var idx = previousUrl.IndexOf(marker, StringComparison.OrdinalIgnoreCase);
        if (idx < 0) return;

        var fname = previousUrl[(idx + marker.Length)..];
        if (fname.Contains('/') || fname.Contains('\\')) return;

        var wwwroot = env.WebRootPath ?? Path.Combine(env.ContentRootPath, "wwwroot");
        var path = Path.Combine(wwwroot, "photos", fname);

        try
        {
            if (System.IO.File.Exists(path))
                System.IO.File.Delete(path);
        }
        catch
        {
            /* noop */
        }
    }

    private Guid GetUserId()
    {
        var claim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return Guid.TryParse(claim, out var userId) ? userId : Guid.Empty;
    }
}
