namespace PodcastAPI.Models;

public class Favorite
{
    public Guid UserId { get; set; }
    public Guid PodcastId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation Property: Favori listelenirken podcast detaylarına erişmek için.
    public virtual Podcast Podcast { get; set; } = null!;
}