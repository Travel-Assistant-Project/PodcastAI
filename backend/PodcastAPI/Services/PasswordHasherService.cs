using Microsoft.AspNetCore.Identity;
using PodcastAPI.Models;

namespace PodcastAPI.Services;

public class PasswordHasherService : IPasswordHasher
{
    private readonly PasswordHasher<User> _hasher = new();

    public string HashPassword(string password)
    {
        return _hasher.HashPassword(new User(), password);
    }

    public bool Verify(User user, string password)
    {
        var result = _hasher.VerifyHashedPassword(user, user.PasswordHash, password);
        return result is PasswordVerificationResult.Success or PasswordVerificationResult.SuccessRehashNeeded;
    }
}
