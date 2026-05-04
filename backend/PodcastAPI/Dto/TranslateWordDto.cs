namespace PodcastAPI.Dto;

public class TranslateWordRequestDto
{
    public string Word { get; set; } = string.Empty;
    public string? ContextSentence { get; set; }
    public Guid? PodcastId { get; set; }
    public string SourceLang { get; set; } = "en";
    public string TargetLang { get; set; } = "tr";
}

public class TranslateWordResponseDto
{
    public string Word { get; set; } = string.Empty;
    public string Translation { get; set; } = string.Empty;
    public string? PartOfSpeech { get; set; }
    public string? ExampleEn { get; set; }
    public string? ExampleTr { get; set; }
    // Sonucun cache'ten mi yoksa AI servisinden mi geldiği — debug/UX için.
    public bool FromCache { get; set; }
}
