namespace PodcastAPI.Models;

public class User
{
    public Guid Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public int? Age { get; set; }
    public string? Occupation { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}