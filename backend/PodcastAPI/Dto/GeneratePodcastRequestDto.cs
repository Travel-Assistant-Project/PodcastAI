namespace PodcastAPI.Dto;

public class GeneratePodcastRequestDto
{
    public List<string> Categories { get; set; } = new();

    public string Tone { get; set; } = string.Empty;

    public int DurationMinutes { get; set; }

    public int SpeakerCount { get; set; }

    // Dil öğrenme modu: True ise transcript Türkçe çevirisiyle birlikte üretilir,
    // CefrLevel script'in dil seviyesini belirler.
    public bool LearningMode { get; set; }

    // 'A1' .. 'C2'. LearningMode false ise dikkate alınmaz.
    public string? CefrLevel { get; set; }
}
