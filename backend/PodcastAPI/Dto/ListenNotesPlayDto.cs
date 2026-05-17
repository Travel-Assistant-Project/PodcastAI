namespace PodcastAPI.Dto;

public class ListenNotesPlayDto
{
    public string ListenNotesEpisodeId { get; set; } = string.Empty;
    public string ListenNotesPodcastId { get; set; } = string.Empty;
    public int ProgressSeconds { get; set; }
    public bool IsCompleted { get; set; }
    public int? DurationSeconds { get; set; }
    public string? Title { get; set; }
    public string? AudioUrl { get; set; }
    public string? CoverImageUrl { get; set; }
    public List<string>? Categories { get; set; }
}
