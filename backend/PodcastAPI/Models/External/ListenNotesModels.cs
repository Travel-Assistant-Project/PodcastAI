using System.Text.Json.Serialization;

namespace PodcastAPI.Models.External;

public class ListenNotesResponse
{
    [JsonPropertyName("podcasts")]
    public List<ListenNotesPodcast> Podcasts { get; set; } = new();

    [JsonPropertyName("results")]
    public List<ListenNotesPodcast> Results { get; set; } = new();
}

public class ListenNotesPodcast
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [JsonPropertyName("title")]
    public string Title { get; set; } = string.Empty;

    [JsonPropertyName("title_original")]
    public string TitleOriginal { get; set; } = string.Empty;

    [JsonPropertyName("publisher_original")]
    public string PublisherOriginal { get; set; } = string.Empty;

    /// <summary>Bazı uç noktalarda yalnızca <c>publisher</c> dolu gelir.</summary>
    [JsonPropertyName("publisher")]
    public string Publisher { get; set; } = string.Empty;

    [JsonPropertyName("listennotes_url")]
    public string ListennotesUrl { get; set; } = string.Empty;

    [JsonPropertyName("thumbnail")]
    public string Thumbnail { get; set; } = string.Empty;

    [JsonPropertyName("image")]
    public string Image { get; set; } = string.Empty;

    [JsonPropertyName("audio")]
    public string Audio { get; set; } = string.Empty;

    [JsonPropertyName("audio_length_sec")]
    public int AudioLengthSec { get; set; }

    [JsonPropertyName("genre_ids")]
    public List<int> GenreIds { get; set; } = new();

    [JsonPropertyName("pub_date_ms")]
    public long PubDateMs { get; set; }

    [JsonPropertyName("latest_pub_date_ms")]
    public long LatestPubDateMs { get; set; }

    public string ResolvedTitle
    {
        get
        {
            var primary = Title?.Trim() ?? "";
            if (!string.IsNullOrEmpty(primary)) return primary;
            return TitleOriginal?.Trim() ?? "";
        }
    }

    public string ResolvedPublisher =>
        string.IsNullOrWhiteSpace(PublisherOriginal?.Trim())
            ? Publisher?.Trim() ?? ""
            : PublisherOriginal.Trim();
}
