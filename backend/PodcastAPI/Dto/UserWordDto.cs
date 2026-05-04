namespace PodcastAPI.Dto;

// POST /api/learning/words gövdesi: kullanıcının kelime defterine yeni kelime ekler.
public class SaveUserWordDto
{
    public string Word { get; set; } = string.Empty;
    public string? ContextSentence { get; set; }
    public string? Translation { get; set; }
    public Guid? PodcastId { get; set; }
}

// GET /api/learning/words sonucu.
public class UserWordDto
{
    public int Id { get; set; }
    public string Word { get; set; } = string.Empty;
    public string? ContextSentence { get; set; }
    public string? Translation { get; set; }
    public bool IsLearned { get; set; }
    public int LookupCount { get; set; }
    public Guid? PodcastId { get; set; }
    public DateTime CreatedAt { get; set; }
}

// PATCH /api/learning/words/{id} gövdesi.
public class UpdateUserWordDto
{
    public bool? IsLearned { get; set; }
}

// GET /api/learning/progress sonucu.
public class LearningProgressDto
{
    public int TotalWords { get; set; }
    public int LearnedWords { get; set; }
    public int LearningPodcastsCount { get; set; }
    public int TotalListenSeconds { get; set; }
    public string? CefrLevel { get; set; }
}
