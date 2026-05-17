using PodcastAPI.Dto;
using PodcastAPI.Models.External;
using System.Net.Http.Json;

namespace PodcastAPI.Services.External;

public class ListenNotesService(HttpClient httpClient, ILogger<ListenNotesService> logger) : IExternalPodcastService
{
    public async Task<List<PodcastSummaryDto>> GetBestPodcastsAsync(string? genreId, int page = 1)
    {
        try
        {
            var url = $"best_podcasts?page={page}";
            if (!string.IsNullOrEmpty(genreId)) url += $"&genre_id={genreId}";

            var response = await httpClient.GetFromJsonAsync<ListenNotesResponse>(url);
            return response?.Podcasts.Select(MapToDto).ToList() ?? new();
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Listen Notes Trending fetch failed.");
            return new();
        }
    }

    public async Task<List<PodcastSummaryDto>> SearchByInterestsAsync(List<string> interests, int limit = 10)
    {
        if (interests == null || !interests.Any()) return new();

        try
        {
            var query = string.Join(" OR ", interests);
            var url = $"search?q={Uri.EscapeDataString(query)}&type=podcast&language=English";

            var response = await httpClient.GetFromJsonAsync<ListenNotesResponse>(url);
            return response?.Results.Take(limit).Select(MapToDto).ToList() ?? new();
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Listen Notes Search failed.");
            return new();
        }
    }

    private static PodcastSummaryDto MapToDto(ListenNotesPodcast item)
    {
        // pub_date_ms yoksa latest_pub_date_ms'e bak, o da yoksa bugünün tarihini atayarak 1970 hatasını önle
        long unixMs = item.PubDateMs > 0
            ? item.PubDateMs
            : (item.LatestPubDateMs > 0 ? item.LatestPubDateMs : DateTimeOffset.UtcNow.ToUnixTimeMilliseconds());

        return new PodcastSummaryDto
        {
            Id = Guid.NewGuid(),
            Title = item.Title,
            AudioUrl = string.IsNullOrEmpty(item.Audio) ? item.ListennotesUrl : item.Audio,
            DurationSeconds = item.AudioLengthSec,
            Status = "External",
            Categories = item.GenreIds.Select(id => id.ToString()).ToList(),
            CreatedAt = DateTimeOffset.FromUnixTimeMilliseconds(unixMs).UtcDateTime,
            LearningMode = false,
            CefrLevel = null
        };
    }
}