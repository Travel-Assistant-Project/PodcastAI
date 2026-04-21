namespace PodcastAPI.Services.AiService.Models;

// ai-service'ın döndüğü sonuç (senkron MVP).
public class AiGenerateResponse
{
    public string? Title { get; set; }
    public string ScriptText { get; set; } = string.Empty;
    public string AudioUrl { get; set; } = string.Empty;
    public int DurationSeconds { get; set; }
    public List<AiNewsSource> Sources { get; set; } = new();
    public List<AiTranscriptSegment> Transcript { get; set; } = new();
}

public class AiNewsSource
{
    public string? SourceName { get; set; }
    public string? NewsTitle { get; set; }
    public string? NewsUrl { get; set; }
    public DateTime? PublishedAt { get; set; }
}

// Audio'nun belirli bir aralığında konuşulan tek satır.
// Frontend audio.currentTime * 1000 ile [StartMs, EndMs) aralığını eşleştirir.
public class AiTranscriptSegment
{
    public int Order { get; set; }
    public string Speaker { get; set; } = string.Empty;
    public string Text { get; set; } = string.Empty;
    public int StartMs { get; set; }
    public int EndMs { get; set; }
}
