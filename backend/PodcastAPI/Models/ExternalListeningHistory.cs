namespace PodcastAPI.Models;

/// <summary>Listen Notes bölümü için kullanıcı dinleme konumu (podcasts tablosunda satır yok).</summary>
public class ExternalListeningHistory
{
    public int Id { get; set; }
    public Guid UserId { get; set; }
    public string ListenNotesEpisodeId { get; set; } = string.Empty;
    public string ListenNotesPodcastId { get; set; } = string.Empty;
    public string? Title { get; set; }
    public string? AudioUrl { get; set; }
    public int? DurationSeconds { get; set; }
    public string? CoverImageUrl { get; set; }
    /// <summary>Kategori/publisher bilgisi virgülle (CategorySeparator).</summary>
    public string? CategoryBlob { get; set; }
    public int ProgressSeconds { get; set; }
    public bool IsCompleted { get; set; }
    public DateTime LastListenedAt { get; set; } = DateTime.UtcNow;
}
