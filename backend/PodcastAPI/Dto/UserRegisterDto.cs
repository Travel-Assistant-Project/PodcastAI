namespace PodcastAPI.Dto; 

public class UserRegisterDto
{
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public int? Age { get; set; }
    public string? Job { get; set; }
}