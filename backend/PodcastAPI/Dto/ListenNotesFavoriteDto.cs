namespace PodcastAPI.Dto;

public class ListenNotesFavoriteDto
{
    public string ListenNotesPodcastId { get; set; } = string.Empty;
    public string? Title { get; set; }
    public string? AudioUrl { get; set; }
    public int? DurationSeconds { get; set; }
    public string? CoverImageUrl { get; set; }
    public string? Publisher { get; set; }
    public List<string>? Categories { get; set; }
}
