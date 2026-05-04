namespace PodcastAPI.Models;

public class UserWord
{
    public int Id { get; set; }
    public Guid UserId { get; set; }
    public Guid? PodcastId { get; set; }

    // Lowercase saklanır.
    public string Word { get; set; } = string.Empty;

    public string? ContextSentence { get; set; }
    public string? Translation { get; set; }

    public bool IsLearned { get; set; }
    public int LookupCount { get; set; } = 1;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
