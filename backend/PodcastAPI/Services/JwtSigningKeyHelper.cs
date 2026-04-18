using System.Security.Cryptography;
using System.Text;
using Microsoft.IdentityModel.Tokens;

namespace PodcastAPI.Services;
public static class JwtSigningKeyHelper
{
    public static SymmetricSecurityKey CreateKey(string secret)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(secret));
        return new SymmetricSecurityKey(bytes);
    }
}
