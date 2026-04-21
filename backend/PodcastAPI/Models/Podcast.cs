namespace PodcastAPI.Models;

public class Podcast
{
    public Guid Id { get; set; }
    public Guid? UserId { get; set; }
    public string? Title { get; set; }
    public string? ScriptText { get; set; }
    public string? AudioUrl { get; set; }
    public int? DurationSeconds { get; set; }
    public string? Tone { get; set; }
    public int SpeakerCount { get; set; } = 2;
    public string? Status { get; set; }

    // MVP: birden fazla kategori virgülle ayrılarak tutulur (ör. "teknoloji,spor").
    public string? CategoryName { get; set; }

    // Zaman damgalı transcript (List<TranscriptSegmentDto> JSON serialize edilerek tutulur).
    // Postgres'te jsonb kolonu; null ise henüz üretilmemiş demektir.
    public string? TranscriptJson { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public List<PodcastSource> Sources { get; set; } = new();
}
