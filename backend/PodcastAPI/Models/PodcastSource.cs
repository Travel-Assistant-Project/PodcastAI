namespace PodcastAPI.Models;

public class PodcastSource
{
    public int Id { get; set; }
    public Guid PodcastId { get; set; }
    public string? SourceName { get; set; }
    public string? NewsTitle { get; set; }
    public string? NewsUrl { get; set; }
    public DateTime? PublishedAt { get; set; }
}
