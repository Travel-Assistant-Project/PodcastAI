using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PodcastAPI.Data;
using PodcastAPI.Dto;
using PodcastAPI.Models;
using PodcastAPI.Services;

namespace PodcastAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController(
    AppDbContext db,
    ITokenService tokenService,
    IPasswordHasher passwordHasher) : ControllerBase
{
    // POST: api/auth/register
    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] UserRegisterDto registerDto)
    {
        if (string.IsNullOrWhiteSpace(registerDto.FullName)
            || string.IsNullOrWhiteSpace(registerDto.Email)
            || string.IsNullOrWhiteSpace(registerDto.Password))
        {
            return BadRequest(new { message = "FullName, Email ve Password zorunludur." });
        }

        var email = registerDto.Email.Trim().ToLowerInvariant();
        if (await db.Users.AnyAsync(u => u.Email == email))
        {
            return Conflict(new { message = "Bu e-posta adresi zaten kayıtlı." });
        }

        var user = new User
        {
            Id = Guid.NewGuid(),
            FullName = registerDto.FullName.Trim(),
            Email = email,
            PasswordHash = passwordHasher.HashPassword(registerDto.Password),
            Age = registerDto.Age,
            Occupation = string.IsNullOrWhiteSpace(registerDto.Job) ? null : registerDto.Job.Trim(),
            CreatedAt = DateTime.UtcNow
        };

        db.Users.Add(user);
        await db.SaveChangesAsync();

        var token = tokenService.CreateToken(user);

        return Ok(new UserResponseDto
        {
            Id = user.Id,
            FullName = user.FullName,
            Email = user.Email,
            Token = token,
        });
    }

    // POST: api/auth/login
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] UserLoginDto loginDto)
    {
        if (string.IsNullOrWhiteSpace(loginDto.Email) || string.IsNullOrWhiteSpace(loginDto.Password))
        {
            return BadRequest(new { message = "Email ve Password zorunludur." });
        }

        var email = loginDto.Email.Trim().ToLowerInvariant();
        var user = await db.Users.FirstOrDefaultAsync(u => u.Email == email);
        if (user is null || !passwordHasher.Verify(user, loginDto.Password))
        {
            return Unauthorized(new { message = "E-posta veya şifre hatalı." });
        }

        var token = tokenService.CreateToken(user);

        return Ok(new UserResponseDto
        {
            Id = user.Id,
            FullName = user.FullName,
            Email = user.Email,
            Token = token,

        });
    }
}
