namespace PodcastAPI.Dto;

public class PodcastDetailDto
{
    public Guid Id { get; set; }
    public Guid? UserId { get; set; }
    public string? Title { get; set; }
    public string? ScriptText { get; set; }
    public string? AudioUrl { get; set; }
    public int? DurationSeconds { get; set; }
    public string? Tone { get; set; }
    public int SpeakerCount { get; set; }
    public string? Status { get; set; }
    public List<string> Categories { get; set; } = new();

    public string? CoverImageUrl { get; set; }

    public DateTime CreatedAt { get; set; }
    public List<PodcastSourceDto> Sources { get; set; } = new();
    public List<TranscriptSegmentDto> Transcript { get; set; } = new();
    public string? CefrLevel { get; set; }
    public bool LearningMode { get; set; }

    /// <summary>Oturum açmış kullanıcı için dinlenen süre (saniye); kayıt yoksa 0.</summary>
    public int ListeningProgressSeconds { get; set; }

    /// <summary>Kullanıcı bu bölümü tamamladıysa true.</summary>
    public bool ListeningCompleted { get; set; }

    /// <summary>Listen Notes podcast kimliği; yalnızca dış şovlarda dolu.</summary>
    public string? ListenNotesPodcastId { get; set; }

    /// <summary>Seçilen Listen Notes bölümü kimliği; yalnızca dış şovlarda dolu.</summary>
    public string? ListenNotesEpisodeId { get; set; }

    /// <summary>Dış şovlarda Listen Notes yayıncı metni.</summary>
    public string? Publisher { get; set; }
}
