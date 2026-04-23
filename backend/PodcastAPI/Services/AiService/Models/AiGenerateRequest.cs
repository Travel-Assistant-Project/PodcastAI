namespace PodcastAPI.Services.AiService.Models;

// ai-service /internal/podcast/generate endpoint'ine gönderilen payload.
public class AiGenerateRequest
{
    public Guid PodcastId { get; set; }
    public List<string> Categories { get; set; } = new();
    public string Tone { get; set; } = string.Empty;
    public int DurationMinutes { get; set; }
    public int SpeakerCount { get; set; }
    public string Language { get; set; } = "en";
}
