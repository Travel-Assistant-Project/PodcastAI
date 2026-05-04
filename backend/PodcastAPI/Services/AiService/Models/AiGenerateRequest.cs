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

    // Dil öğrenme modu meta'sı; ai-service bu bilgiyle hem CEFR-aware script üretir
    // hem de transcript'i hedef dile (Türkçe) çevirir.
    public bool LearningMode { get; set; }
    public string? CefrLevel { get; set; }
}

// /internal/translate/word payload'ı.
public class AiTranslateWordRequest
{
    public string Word { get; set; } = string.Empty;
    public string? ContextSentence { get; set; }
    public string SourceLang { get; set; } = "en";
    public string TargetLang { get; set; } = "tr";
}
