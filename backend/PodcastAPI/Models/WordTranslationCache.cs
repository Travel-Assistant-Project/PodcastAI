namespace PodcastAPI.Models;

// Global çeviri cache'i. Aynı kelime + bağlam (ContextHash) için ai-service'i
// tekrar tekrar çağırmamak adına burada saklanır.
public class WordTranslationCache
{
    public int Id { get; set; }

    public string Word { get; set; } = string.Empty;
    public string SourceLang { get; set; } = "en";
    public string TargetLang { get; set; } = "tr";

    // NULL = bağlamsız genel karşılık.
    public string? ContextHash { get; set; }

    public string Translation { get; set; } = string.Empty;
    public string? PartOfSpeech { get; set; }
    public string? ExampleEn { get; set; }
    public string? ExampleTr { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
