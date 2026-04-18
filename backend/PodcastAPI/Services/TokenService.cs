using DotNetEnv;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using PodcastAPI.Models;

namespace PodcastAPI.Services;

public interface ITokenService
{
    string CreateToken(User user);
}

public class TokenService : ITokenService
{
    public string CreateToken(User user)
    {
        var key = JwtSigningKeyHelper.CreateKey(Env.GetString("JWT_SECRET"));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256Signature);

        // Kullanıcı bilgilerini token'a ekle
        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new(ClaimTypes.Email, user.Email),
            new(ClaimTypes.Name, user.FullName)
        };

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Expires = DateTime.UtcNow.AddDays(7),
            SigningCredentials = creds
        };

        var tokenHandler = new JwtSecurityTokenHandler();
        var token = tokenHandler.CreateToken(tokenDescriptor);

        return tokenHandler.WriteToken(token);
    }
}