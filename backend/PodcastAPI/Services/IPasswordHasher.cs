using PodcastAPI.Models;

namespace PodcastAPI.Services;

public interface IPasswordHasher
{
    string HashPassword(string password);
    bool Verify(User user, string password);
}
