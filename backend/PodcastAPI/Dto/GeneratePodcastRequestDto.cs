namespace PodcastAPI.Dto;

public class GeneratePodcastRequestDto
{
    public List<string> Categories { get; set; } = new();

    public string Tone { get; set; } = string.Empty;

    public int DurationMinutes { get; set; }

    public int SpeakerCount { get; set; }
}
