namespace PodcastAPI.Dto;

/// <summary>Mobil istemcinin favori durumunu senkron için kullandığı kimlik listeleri.</summary>
public class FavoriteKeysDto
{
    public List<Guid> PodcastIds { get; set; } = new();

    public List<string> ListenNotesPodcastIds { get; set; } = new();
}
