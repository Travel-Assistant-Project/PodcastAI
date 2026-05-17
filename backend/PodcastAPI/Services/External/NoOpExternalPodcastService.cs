using PodcastAPI.Dto;

namespace PodcastAPI.Services.External;

/// <summary>Anahtar yok veya Listen Notes kullanılmıyorsa boş liste döner.</summary>
public sealed class NoOpExternalPodcastService : IExternalPodcastService
{
    public Task<List<PodcastSummaryDto>> GetBestPodcastsAsync(
        string? genreId,
        int page = 1,
        CancellationToken cancellationToken = default) =>
        Task.FromResult(new List<PodcastSummaryDto>());

    public Task<PodcastDetailDto?> GetPodcastDetailAsync(
        string listenNotesPodcastId,
        string? episodeId = null,
        CancellationToken cancellationToken = default) =>
        Task.FromResult<PodcastDetailDto?>(null);
}
