using PodcastAPI.Dto;

namespace PodcastAPI.Services.External;

public interface IExternalPodcastService
{
    Task<List<PodcastSummaryDto>> GetBestPodcastsAsync(
        string? genreId,
        int page = 1,
        CancellationToken cancellationToken = default);

    Task<PodcastDetailDto?> GetPodcastDetailAsync(
        string listenNotesPodcastId,
        string? episodeId = null,
        CancellationToken cancellationToken = default);
}