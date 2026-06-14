namespace PodcastAPI.Dto;

public class ErrorResponseDto
{
    public bool Success { get; set; } = false;
    public string Message { get; set; } = string.Empty;
    public string Action { get; set; } = string.Empty;
}