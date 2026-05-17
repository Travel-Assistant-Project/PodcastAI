namespace PodcastAPI.Services.AiService.Models;

/// ai-service /internal/podcast/script-phase cevabı — ses üretilmeden önce kullanıcıya gösterilen içerik.
public class AiPodcastScriptPhaseResponse
{
    public string? Title { get; set; }
    public string ScriptText { get; set; } = string.Empty;
    public List<AiNewsSource> Sources { get; set; } = new();
}

/// ai-service /internal/podcast/audio-phase isteği (senaryo hazırken TTS).
public class AiPodcastAudioPhaseRequest
{
    public Guid PodcastId { get; set; }
    public string ScriptText { get; set; } = string.Empty;
    public int SpeakerCount { get; set; }
    public int DurationMinutes { get; set; }
    public string Language { get; set; } = "en";
    public bool LearningMode { get; set; }
    public string? CefrLevel { get; set; }
}

/// ai-service /internal/podcast/audio-phase cevabı.
public class AiPodcastAudioPhaseResponse
{
    public string AudioUrl { get; set; } = string.Empty;
    public int DurationSeconds { get; set; }
    public List<AiTranscriptSegment> Transcript { get; set; } = new();
}
