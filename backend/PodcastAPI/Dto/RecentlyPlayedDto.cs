namespace PodcastAPI.Dto;

public class RecentlyPlayedDto
{
    public Guid PodcastId { get; set; }
    public string? Title { get; set; }
    public string? AudioUrl { get; set; }
    public int ProgressSeconds { get; set; }
    public bool IsCompleted { get; set; }
    public DateTime LastListenedAt { get; set; }
    public int? DurationSeconds { get; set; }
    public List<string> Categories { get; set; } = new();
    public string? Status { get; set; }
}
