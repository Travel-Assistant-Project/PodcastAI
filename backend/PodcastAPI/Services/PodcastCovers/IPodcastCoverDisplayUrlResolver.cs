using PodcastAPI.Models;

namespace PodcastAPI.Services.PodcastCovers;

/// coverimageobjectkey için okuma URL üretir; anahtar yoksa null döner.
public interface IPodcastCoverDisplayUrlResolver
{
    Task<string?> ResolveForPodcastAsync(Podcast podcast, CancellationToken cancellationToken = default);
}
