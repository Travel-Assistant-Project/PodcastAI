namespace PodcastAPI.Models;

public class ListeningHistory
{
    public int Id { get; set; }
    public Guid UserId { get; set; }
    public Guid PodcastId { get; set; }
    public Podcast Podcast { get; set; } = null!;
    public int ProgressSeconds { get; set; }
    public bool IsCompleted { get; set; }
    public DateTime LastListenedAt { get; set; } = DateTime.UtcNow;
}
