using PodcastAPI.Models;

namespace PodcastAPI.Services.PodcastCovers;

public class PodcastCoverDisplayUrlResolver(IPodcastCoverReadUrlService readUrlService)
    : IPodcastCoverDisplayUrlResolver
{
    public Task<string?> ResolveForPodcastAsync(Podcast podcast, CancellationToken cancellationToken = default) =>
        readUrlService.GetReadUrlAsync(podcast.CoverImageObjectKey, cancellationToken);
}
