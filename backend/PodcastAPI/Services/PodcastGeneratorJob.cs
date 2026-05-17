using Hangfire;
using Microsoft.EntityFrameworkCore;
using PodcastAPI.Common;
using PodcastAPI.Data;
using PodcastAPI.Dto;
using PodcastAPI.Models;
using PodcastAPI.Services.AiService;
using PodcastAPI.Services.AiService.Models;
using System.Text.Json;

namespace PodcastAPI.Services;

public class PodcastGeneratorJob(
    AppDbContext db,
    IAiServiceClient aiServiceClient,
    ILogger<PodcastGeneratorJob> logger) : IPodcastGeneratorJob
{
    private static readonly JsonSerializerOptions TranscriptJsonOptions = new(JsonSerializerDefaults.Web);

    // Hata durumunda 3 kez otomatik yeniden deneme yapar
    [AutomaticRetry(Attempts = 3, OnAttemptsExceeded = AttemptsExceededAction.Fail)]
    public async Task RunAsync(Guid podcastId, GeneratePodcastRequestDto request)
    {
        var podcast = await db.Podcasts.Include(p => p.Sources).FirstOrDefaultAsync(p => p.Id == podcastId);
        if (podcast == null) return;

        // Tamamlanmış kayıtta job tekrar tetiklenirse TTS'i yeniden çalıştırma
        if (podcast.Status == PodcastConstants.Status.Completed
            && !string.IsNullOrWhiteSpace(podcast.AudioUrl))
        {
            return;
        }

        var baseAiRequest = new AiGenerateRequest
        {
            PodcastId = podcast.Id,
            Categories = request.Categories,
            Tone = podcast.Tone!,
            DurationMinutes = request.DurationMinutes,
            SpeakerCount = request.SpeakerCount,
            Language = "en",
            LearningMode = podcast.LearningMode,
            CefrLevel = podcast.CefrLevel
        };

        try
        {
            // 1) Senaryo + başlık + kaynaklar — kullanıcı ön yüzde metni poll ederek okuyabilsin
            if (string.IsNullOrWhiteSpace(podcast.ScriptText))
            {
                var scriptPhase = await aiServiceClient.GenerateScriptPhaseAsync(baseAiRequest);

                podcast.Title = scriptPhase.Title;
                podcast.ScriptText = scriptPhase.ScriptText;

                foreach (var s in scriptPhase.Sources)
                {
                    podcast.Sources.Add(new PodcastSource
                    {
                        PodcastId = podcast.Id,
                        SourceName = s.SourceName,
                        NewsTitle = s.NewsTitle,
                        NewsUrl = s.NewsUrl,
                        PublishedAt = s.PublishedAt
                    });
                }

                await db.SaveChangesAsync();
            }

            // 2) TTS + zamanlı transcript (Hangfire retry: senaryo DB'de ise sadece bu adım çalışır)
            if (!string.IsNullOrWhiteSpace(podcast.AudioUrl))
            {
                podcast.Status = PodcastConstants.Status.Completed;
                podcast.FailedAt = null;
                await db.SaveChangesAsync();
                return;
            }

            var audioPhase = await aiServiceClient.FinalizePodcastAudioAsync(new AiPodcastAudioPhaseRequest
            {
                PodcastId = podcast.Id,
                ScriptText = podcast.ScriptText!,
                SpeakerCount = request.SpeakerCount,
                DurationMinutes = request.DurationMinutes,
                Language = "en",
                LearningMode = podcast.LearningMode,
                CefrLevel = podcast.CefrLevel
            });

            podcast.AudioUrl = audioPhase.AudioUrl;
            podcast.DurationSeconds = audioPhase.DurationSeconds;
            podcast.Status = PodcastConstants.Status.Completed;
            podcast.FailedAt = null;

            if (audioPhase.Transcript.Count > 0)
            {
                podcast.TranscriptJson = JsonSerializer.Serialize(audioPhase.Transcript, TranscriptJsonOptions);
            }

            await db.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Podcast Job Error: {Id}", podcastId);
            podcast.Status = PodcastConstants.Status.Failed;
            podcast.FailedAt = DateTime.UtcNow;
            await db.SaveChangesAsync();
            throw; // Hangfire'ın hatayı yakalayıp retry başlatması için gerekli
        }
    }
}
