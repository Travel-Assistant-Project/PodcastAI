using PodcastAPI.Dto;

namespace PodcastAPI.Services.External;

public interface IExternalPodcastService
{
    Task<List<PodcastSummaryDto>> GetBestPodcastsAsync(string? genreId, int page = 1);
    Task<List<PodcastSummaryDto>> SearchByInterestsAsync(List<string> interests, int limit = 10);
}