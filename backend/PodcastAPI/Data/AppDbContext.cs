using Microsoft.EntityFrameworkCore;
using PodcastAPI.Models;

namespace PodcastAPI.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<User> Users { get; set; }
    public DbSet<Interest> Interests { get; set; }
    public DbSet<UserInterest> UserInterests { get; set; }
    public DbSet<Podcast> Podcasts { get; set; }
    public DbSet<PodcastSource> PodcastSources { get; set; }
    public DbSet<Favorite> Favorites { get; set; }
    public DbSet<UserWord> UserWords { get; set; }
    public DbSet<WordTranslationCache> WordTranslationCache { get; set; }
    public DbSet<UserQuizAttempt> UserQuizAttempts { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // Users (mevcut)
        modelBuilder.Entity<User>(entity =>
        {
            entity.ToTable("users");
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.FullName).HasColumnName("fullname");
            entity.Property(e => e.Email).HasColumnName("email");
            entity.Property(e => e.PasswordHash).HasColumnName("passwordhash");
            entity.Property(e => e.Age).HasColumnName("age");
            entity.Property(e => e.Occupation).HasColumnName("job");
            entity.Property(e => e.PreferredMode).HasColumnName("preferredmode").HasMaxLength(10);
            entity.Property(e => e.CefrLevel).HasColumnName("cefrlevel").HasMaxLength(4);
            entity.Property(e => e.CreatedAt).HasColumnName("createdat");
        });

        // Interests
        modelBuilder.Entity<Interest>(entity =>
        {
            entity.ToTable("interests", t => t.ExcludeFromMigrations());
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.Name).HasColumnName("name").HasMaxLength(50).IsRequired();
            entity.Property(e => e.Description).HasColumnName("description");
            entity.HasIndex(e => e.Name).IsUnique();
        });

        // UserInterests (composite PK)
        modelBuilder.Entity<UserInterest>(entity =>
        {
            entity.ToTable("userinterests", t => t.ExcludeFromMigrations());
            entity.HasKey(e => new { e.UserId, e.InterestId });
            entity.Property(e => e.UserId).HasColumnName("userid");
            entity.Property(e => e.InterestId).HasColumnName("interestid");
        });

        // Podcasts
        modelBuilder.Entity<Podcast>(entity =>
        {
            entity.ToTable("podcasts", t => t.ExcludeFromMigrations());
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.UserId).HasColumnName("userid");
            entity.Property(e => e.Title).HasColumnName("title").HasMaxLength(255);
            entity.Property(e => e.ScriptText).HasColumnName("scripttext");
            entity.Property(e => e.AudioUrl).HasColumnName("audiourl");
            entity.Property(e => e.DurationSeconds).HasColumnName("durationseconds");
            entity.Property(e => e.Tone).HasColumnName("tone").HasMaxLength(20);
            entity.Property(e => e.SpeakerCount).HasColumnName("speakercount");
            entity.Property(e => e.Status).HasColumnName("status").HasMaxLength(20);
            entity.Property(e => e.CategoryName).HasColumnName("categoryname").HasMaxLength(50);
            entity.Property(e => e.CefrLevel).HasColumnName("cefrlevel").HasMaxLength(4);
            entity.Property(e => e.LearningMode).HasColumnName("learningmode");
            entity.Property(e => e.TranscriptJson)
                  .HasColumnName("transcriptjson")
                  .HasColumnType("jsonb");
            entity.Property(e => e.CreatedAt).HasColumnName("createdat");

            entity.HasMany(e => e.Sources)
                  .WithOne()
                  .HasForeignKey(s => s.PodcastId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // PodcastSources
        modelBuilder.Entity<PodcastSource>(entity =>
        {
            entity.ToTable("podcastsources", t => t.ExcludeFromMigrations());
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.PodcastId).HasColumnName("podcastid");
            entity.Property(e => e.SourceName).HasColumnName("sourcename").HasMaxLength(100);
            entity.Property(e => e.NewsTitle).HasColumnName("newstitle");
            entity.Property(e => e.NewsUrl).HasColumnName("newsurl");
            entity.Property(e => e.PublishedAt).HasColumnName("publishedat");
        });

        // Favorites (composite PK)
        modelBuilder.Entity<Favorite>(entity =>
{
    entity.ToTable("favorites"); // DB Script'teki tablo adı [cite: 933]
    entity.HasKey(e => new { e.UserId, e.PodcastId }); // Composite PK 

    entity.Property(e => e.UserId).HasColumnName("userid");
    entity.Property(e => e.PodcastId).HasColumnName("podcastid");
    entity.Property(e => e.CreatedAt).HasColumnName("createdat");

    // İlişki Tanımı
    entity.HasOne(e => e.Podcast)
          .WithMany()
          .HasForeignKey(e => e.PodcastId);
});

        // UserWords - kullanıcının kelime defteri
        modelBuilder.Entity<UserWord>(entity =>
        {
            entity.ToTable("userwords", t => t.ExcludeFromMigrations());
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.UserId).HasColumnName("userid");
            entity.Property(e => e.PodcastId).HasColumnName("podcastid");
            entity.Property(e => e.Word).HasColumnName("word").HasMaxLength(80).IsRequired();
            entity.Property(e => e.ContextSentence).HasColumnName("contextsentence");
            entity.Property(e => e.Translation).HasColumnName("translation");
            entity.Property(e => e.IsLearned).HasColumnName("islearned");
            entity.Property(e => e.LookupCount).HasColumnName("lookupcount");
            entity.Property(e => e.CreatedAt).HasColumnName("createdat");
            entity.Property(e => e.UpdatedAt).HasColumnName("updatedat");
            entity.HasIndex(e => new { e.UserId, e.Word }).IsUnique();
        });

        // WordTranslationCache - global çeviri cache'i
        modelBuilder.Entity<WordTranslationCache>(entity =>
        {
            entity.ToTable("wordtranslationcache", t => t.ExcludeFromMigrations());
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.Word).HasColumnName("word").HasMaxLength(80).IsRequired();
            entity.Property(e => e.SourceLang).HasColumnName("sourcelang").HasMaxLength(5);
            entity.Property(e => e.TargetLang).HasColumnName("targetlang").HasMaxLength(5);
            entity.Property(e => e.ContextHash).HasColumnName("contexthash").HasMaxLength(64);
            entity.Property(e => e.Translation).HasColumnName("translation").IsRequired();
            entity.Property(e => e.PartOfSpeech).HasColumnName("partofspeech").HasMaxLength(20);
            entity.Property(e => e.ExampleEn).HasColumnName("exampleen");
            entity.Property(e => e.ExampleTr).HasColumnName("exampletr");
            entity.Property(e => e.CreatedAt).HasColumnName("createdat");
        });

        // UserQuizAttempts - quiz iskeleti
        modelBuilder.Entity<UserQuizAttempt>(entity =>
        {
            entity.ToTable("userquizattempts", t => t.ExcludeFromMigrations());
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.UserId).HasColumnName("userid");
            entity.Property(e => e.PodcastId).HasColumnName("podcastid");
            entity.Property(e => e.QuestionsJson).HasColumnName("questionsjson").HasColumnType("jsonb");
            entity.Property(e => e.AnswersJson).HasColumnName("answersjson").HasColumnType("jsonb");
            entity.Property(e => e.Score).HasColumnName("score");
            entity.Property(e => e.CreatedAt).HasColumnName("createdat");
        });

    }
}
