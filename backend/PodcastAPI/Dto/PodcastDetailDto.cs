namespace PodcastAPI.Dto;

public class PodcastDetailDto
{
    public Guid Id { get; set; }
    public Guid? UserId { get; set; }
    public string? Title { get; set; }
    public string? ScriptText { get; set; }
    public string? AudioUrl { get; set; }
    public int? DurationSeconds { get; set; }
    public string? Tone { get; set; }
    public int SpeakerCount { get; set; }
    public string? Status { get; set; }
    public List<string> Categories { get; set; } = new();
    public DateTime CreatedAt { get; set; }
    public List<PodcastSourceDto> Sources { get; set; } = new();
    public List<TranscriptSegmentDto> Transcript { get; set; } = new();
    public string? CefrLevel { get; set; }
    public bool LearningMode { get; set; }
}
