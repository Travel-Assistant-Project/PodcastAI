namespace PodcastAPI.Dto;

public class GeneratePodcastRequestDto
{
    public List<string> Categories { get; set; } = new();
    public string Tone { get; set; } = string.Empty;
    public int DurationMinutes { get; set; }
    public int SpeakerCount { get; set; }

    public bool LearningMode { get; set; }

    // 'A1' .. 'C2'. LearningMode false ise dikkate alınmaz
    public string? CefrLevel { get; set; }

    /// <summary>
    /// Issue #32 için ön hazırlık flag'i. 
    /// true gönderilirse günlük DB kontrolü (cache) bypass edilir ve yeniden oluşturma tetiklenir.
    /// </summary>
    public bool ForceRecreate { get; set; } = false;
}