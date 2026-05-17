namespace PodcastAPI.Services.PodcastCovers;

public interface IPodcastCoverReadUrlService
{
    /// <summary>Bucket içi nesne anahtarı için okuma URL üretir (imzalı veya public).</summary>
    Task<string?> GetReadUrlAsync(string? objectKey, CancellationToken cancellationToken = default);
}
