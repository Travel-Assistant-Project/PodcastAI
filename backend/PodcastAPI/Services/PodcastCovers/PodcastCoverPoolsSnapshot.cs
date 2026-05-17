namespace PodcastAPI.Services.PodcastCovers;

/// <summary>
/// Firebase podcast-covers altında sıralı nesne anahtarları (bucket içi tam path).
/// </summary>
public sealed record PodcastCoverPoolsSnapshot(
    IReadOnlyDictionary<string, List<string>> ObjectKeysByCategory);
