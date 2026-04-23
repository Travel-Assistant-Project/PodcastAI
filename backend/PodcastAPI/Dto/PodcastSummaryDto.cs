namespace PodcastAPI.Dto;

public class PodcastSummaryDto
{
    public Guid Id { get; set; }
    public string? Title { get; set; }
    public string? AudioUrl { get; set; }
    public int? DurationSeconds { get; set; }
    public string? Status { get; set; }
    public List<string> Categories { get; set; } = new();
    public DateTime CreatedAt { get; set; }
}
