using System.Text.Json.Serialization;

namespace PodcastAPI.Models.External;

public class ListenNotesGenresEnvelope
{
    [JsonPropertyName("genres")]
    public List<ListenNotesGenreRow> Genres { get; set; } = new();
}

public class ListenNotesGenreRow
{
    [JsonPropertyName("id")]
    public int Id { get; set; }

    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;

    [JsonPropertyName("parent_id")]
    public int ParentId { get; set; }
}
