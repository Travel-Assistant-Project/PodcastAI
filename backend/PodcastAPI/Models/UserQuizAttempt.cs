namespace PodcastAPI.Models;

// Quiz iskeleti — şu an üretim/kayıt akışı yok, sadece şema hazır. (sonradan düşülünür)
// Faz 5'te podcast bittiğinde kullanıcının kelime defterinden mini quiz üretilince doldurulacak.
public class UserQuizAttempt
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid? UserId { get; set; }
    public Guid? PodcastId { get; set; }

    // [{word, options[], correctIndex}] şeklinde JSON.
    public string QuestionsJson { get; set; } = "[]";

    // [{word, selectedIndex, correct}]
    public string? AnswersJson { get; set; }

    public int? Score { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
