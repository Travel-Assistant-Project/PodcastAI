namespace PodcastAPI.Models;

public class User
{
    public Guid Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public int? Age { get; set; }
    public string? Occupation { get; set; }

    // Onboarding sonrası seçilen mod: "listen" veya "learn". NULL = onboarding henüz yapılmadı. iptal edildi.
    public string? PreferredMode { get; set; }

    // Kullanıcının default İngilizce seviyesi (Create ekranındaki picker bunu önseçer). iptal edildi.
    public string? CefrLevel { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}