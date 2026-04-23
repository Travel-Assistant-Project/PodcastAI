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

        try
        {
            // Python AI servisine istek gönder
            var aiResponse = await aiServiceClient.GeneratePodcastAsync(new AiGenerateRequest
            {
                PodcastId = podcast.Id,
                Categories = request.Categories,
                Tone = podcast.Tone!,
                DurationMinutes = request.DurationMinutes,
                SpeakerCount = request.SpeakerCount,
                Language = "en"
            });

            // Gelen verileri podcast kaydına işle
            podcast.Title = aiResponse.Title;
            podcast.ScriptText = aiResponse.ScriptText;
            podcast.AudioUrl = aiResponse.AudioUrl;
            podcast.DurationSeconds = aiResponse.DurationSeconds;
            podcast.Status = PodcastConstants.Status.Completed;

            if (aiResponse.Transcript != null)
            {
                podcast.TranscriptJson = JsonSerializer.Serialize(aiResponse.Transcript, TranscriptJsonOptions);
            }

            // Haber kaynaklarını kaydet
            foreach (var s in aiResponse.Sources)
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
        catch (Exception ex)
        {
            logger.LogError(ex, "Podcast Job Error: {Id}", podcastId);
            podcast.Status = PodcastConstants.Status.Failed;
            await db.SaveChangesAsync();
            throw; // Hangfire'ın hatayı yakalayıp retry başlatması için gerekli
        }
    }
}