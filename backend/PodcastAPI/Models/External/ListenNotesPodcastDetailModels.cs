using System.Text.Json.Serialization;

namespace PodcastAPI.Models.External;

/// <summary>GET /podcasts/{id} yanıt gövdesi (özet + son bölümler).</summary>
public class ListenNotesPodcastDetailResponse
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [JsonPropertyName("title")]
    public string Title { get; set; } = string.Empty;

    [JsonPropertyName("title_original")]
    public string TitleOriginal { get; set; } = string.Empty;

    [JsonPropertyName("publisher_original")]
    public string PublisherOriginal { get; set; } = string.Empty;

    [JsonPropertyName("publisher")]
    public string Publisher { get; set; } = string.Empty;

    [JsonPropertyName("description")]
    public string Description { get; set; } = string.Empty;

    [JsonPropertyName("image")]
    public string Image { get; set; } = string.Empty;

    [JsonPropertyName("thumbnail")]
    public string Thumbnail { get; set; } = string.Empty;

    [JsonPropertyName("listennotes_url")]
    public string ListennotesUrl { get; set; } = string.Empty;

    [JsonPropertyName("genre_ids")]
    public List<int> GenreIds { get; set; } = new();

    [JsonPropertyName("latest_pub_date_ms")]
    public long LatestPubDateMs { get; set; }

    [JsonPropertyName("episodes")]
    public List<ListenNotesEpisodeBrief> Episodes { get; set; } = new();

    public string ResolvedShowTitle =>
        string.IsNullOrWhiteSpace(Title) ? TitleOriginal.Trim() : Title.Trim();

    public string ResolvedPublisher =>
        string.IsNullOrWhiteSpace(PublisherOriginal?.Trim())
            ? Publisher?.Trim() ?? ""
            : PublisherOriginal.Trim();
}

public class ListenNotesEpisodeBrief
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [JsonPropertyName("title")]
    public string Title { get; set; } = string.Empty;

    [JsonPropertyName("title_original")]
    public string TitleOriginal { get; set; } = string.Empty;

    [JsonPropertyName("description_original")]
    public string DescriptionOriginal { get; set; } = string.Empty;

    [JsonPropertyName("audio")]
    public string Audio { get; set; } = string.Empty;

    [JsonPropertyName("audio_length_sec")]
    public int AudioLengthSec { get; set; }

    [JsonPropertyName("pub_date_ms")]
    public long PubDateMs { get; set; }

    [JsonPropertyName("listennotes_url")]
    public string ListennotesUrl { get; set; } = string.Empty;

    public string ResolvedEpisodeTitle =>
        string.IsNullOrWhiteSpace(Title) ? TitleOriginal.Trim() : Title.Trim();
}
