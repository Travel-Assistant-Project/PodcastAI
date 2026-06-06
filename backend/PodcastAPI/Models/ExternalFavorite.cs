namespace PodcastAPI.Models;

/// <summary>Listen Notes şovları için favori (podcasts tablosunda satır yok).</summary>
public class ExternalFavorite
{
    public Guid UserId { get; set; }
    public string ListenNotesPodcastId { get; set; } = string.Empty;
    public string? Title { get; set; }
    public string? AudioUrl { get; set; }
    public int? DurationSeconds { get; set; }
    public string? CoverImageUrl { get; set; }
    public string? Publisher { get; set; }
    /// <summary>Kategori/publisher bilgisi virgülle (CategorySeparator).</summary>
    public string? CategoryBlob { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
