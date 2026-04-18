using Microsoft.AspNetCore.Mvc;
using PodcastAPI.Dto;
using PodcastAPI.Models;
using PodcastAPI.Services;

namespace PodcastAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController(ITokenService tokenService) : ControllerBase
{
    // POST: api/auth/register
    [HttpPost("register")]
    public IActionResult Register([FromBody] UserRegisterDto registerDto)
    {
        // Sprint 1 Planı:
        // 1. Email kontrolü yapılacak.
        // 2. Şifre hash'lenecek.
        // 3. Veritabanına kaydedilecek.

        // Simüle edilmiş (Mock) kullanıcı verisi:
        var user = new User 
        { 
            Id = 1, 
            FullName = registerDto.FullName, 
            Email = registerDto.Email 
        };

        var token = tokenService.CreateToken(user);

        return Ok(new UserResponseDto 
        { 
            Id = user.Id,
            FullName = user.FullName,
            Email = user.Email,
            Token = token 
        });
    }

    // POST: api/auth/login
    [HttpPost("login")]
    public IActionResult Login([FromBody] UserLoginDto loginDto)
    {
        // Sprint 1 Planı:
        // Email ve PasswordHash doğrulaması burada yapılacak.
        
        // Veritabanından gelen kullanıcıyı simüle ediyoruz:
        var user = new User 
        { 
            Id = 1, 
            Email = loginDto.Email, 
            FullName = "Sina" 
        };

        var token = tokenService.CreateToken(user);

        // Hassas bilgileri (şifre vb.) içermeyen güvenli DTO dönüyoruz
        return Ok(new UserResponseDto 
        { 
            Id = user.Id, 
            FullName = user.FullName, 
            Email = user.Email, 
            Token = token 
        });
    }
}