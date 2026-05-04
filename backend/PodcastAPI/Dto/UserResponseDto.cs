namespace PodcastAPI.Dto;

public class UserResponseDto
{
    public Guid Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Token { get; set; } = string.Empty;
    public string? PreferredMode { get; set; }
    public string? CefrLevel { get; set; }
}