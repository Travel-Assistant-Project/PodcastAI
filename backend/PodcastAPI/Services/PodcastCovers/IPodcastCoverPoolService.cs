namespace PodcastAPI.Services.PodcastCovers;

/// Firebase podcast-covers klasörlerinden nesne anahtarlarını listeler (yalnızca podcast oluşturma için).
public interface IPodcastCoverPoolService
{
    Task<PodcastCoverPoolsSnapshot> GetPoolsSnapshotAsync(CancellationToken cancellationToken = default);
}
