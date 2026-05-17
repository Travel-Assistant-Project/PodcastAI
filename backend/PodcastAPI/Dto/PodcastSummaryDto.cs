namespace PodcastAPI.Dto;

public class PodcastSummaryDto
{
    public Guid Id { get; set; }
    public string? Title { get; set; }
    public string? AudioUrl { get; set; }
    public int? DurationSeconds { get; set; }
    public string? Status { get; set; }
    public List<string> Categories { get; set; } = new();

    /// <summary>Kapak görseli URL (oluşturulurken seçilen nesne için imzalı/public).</summary>
    public string? CoverImageUrl { get; set; }

    /// <summary>Dış kaynak (Listen Notes) podcast sayfası — mobilde tarayıcıda açılır.</summary>
    public string? ListenNotesUrl { get; set; }

    /// <summary>Dış podcast için yayıncı adı; kendi içeriklerinde boş olabilir.</summary>
    public string? Publisher { get; set; }

    /// <summary>Listen Notes dizin kimliği — detay ve oynatıcı için gerekli.</summary>
    public string? ListenNotesPodcastId { get; set; }

    public DateTime CreatedAt { get; set; }
    public bool LearningMode { get; set; }
    public string? CefrLevel { get; set; }
}
