namespace PodcastAPI.Dto;

/// <summary>Mobil istemcinin favori durumunu senkron için kullandığı kimlik listeleri.</summary>
public class FavoriteKeysDto
{
    public List<Guid> PodcastIds { get; set; } = new();

    /// <summary>İleride Listen Notes favorileri eklenirse doldurulur; şimdilik boş.</summary>
    public List<string> ListenNotesPodcastIds { get; set; } = new();
}
