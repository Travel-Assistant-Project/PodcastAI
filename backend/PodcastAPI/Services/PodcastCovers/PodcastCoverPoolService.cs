using DotNetEnv;
using Google.Cloud.Storage.V1;
using Microsoft.Extensions.Caching.Memory;
using PodcastAPI.Services.Storage;

namespace PodcastAPI.Services.PodcastCovers;

public class PodcastCoverPoolService(IMemoryCache cache, IWebHostEnvironment env) : IPodcastCoverPoolService
{
    private const string CacheKey = "podcast-cover-object-keys-v1";

    private static readonly TimeSpan CacheDuration = TimeSpan.FromMinutes(15);

    private static readonly string[] CoverCategoryFolders =
    [
        "general",
        "technology",
        "science",
        "economy",
        "health",
        "world",
        "sports",
        "entertainment",
        "finance",
        "music",
        "ai",
    ];

    private static readonly HashSet<string> ImageExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        ".jpg",
        ".jpeg",
        ".png",
        ".webp",
        ".gif",
    };

    public async Task<PodcastCoverPoolsSnapshot> GetPoolsSnapshotAsync(CancellationToken cancellationToken = default)
    {
        var cached = await cache
            .GetOrCreateAsync(
                CacheKey,
                async entry =>
                {
                    entry.AbsoluteExpirationRelativeToNow = CacheDuration;
                    return await BuildSnapshotAsync(cancellationToken).ConfigureAwait(false);
                })
            .ConfigureAwait(false);

        return cached
               ?? new PodcastCoverPoolsSnapshot(new Dictionary<string, List<string>>(StringComparer.OrdinalIgnoreCase));
    }

    private async Task<PodcastCoverPoolsSnapshot> BuildSnapshotAsync(CancellationToken cancellationToken)
    {
        var dict = new Dictionary<string, List<string>>(StringComparer.OrdinalIgnoreCase);

        if (!IsTruthy(Env.GetString("USE_FIREBASE_PODCAST_COVERS")))
            return new PodcastCoverPoolsSnapshot(dict);

        var bucket = Env.GetString("FIREBASE_STORAGE_BUCKET")?.Trim();
        var credRaw = Env.GetString("FIREBASE_CREDENTIALS_PATH")?.Trim();
        if (string.IsNullOrWhiteSpace(bucket) || string.IsNullOrWhiteSpace(credRaw))
            return new PodcastCoverPoolsSnapshot(dict);

        string credPath;
        try
        {
            credPath = GcsFirebaseStorageHelper.ResolveCredentialPath(env.ContentRootPath, credRaw);
        }
        catch
        {
            return new PodcastCoverPoolsSnapshot(dict);
        }

        var folder = (Env.GetString("FIREBASE_PODCAST_COVERS_FOLDER") ?? "podcast-covers").Trim().Trim('/');
        var client = GcsFirebaseStorageHelper.GetClient(credPath);

        foreach (var category in CoverCategoryFolders)
        {
            cancellationToken.ThrowIfCancellationRequested();
            var prefix = $"{folder}/{category}/";
            var names = await ListSortedImageObjectNamesAsync(client, bucket, prefix, cancellationToken)
                .ConfigureAwait(false);

            if (names.Count > 0)
                dict[category] = names;
        }

        return new PodcastCoverPoolsSnapshot(dict);
    }

    private static Task<List<string>> ListSortedImageObjectNamesAsync(
        StorageClient client,
        string bucket,
        string prefix,
        CancellationToken cancellationToken)
    {
        return Task.Run(
            () =>
            {
                var list = new List<string>();
                foreach (var obj in client.ListObjects(bucket, prefix))
                {
                    cancellationToken.ThrowIfCancellationRequested();

                    if (string.IsNullOrEmpty(obj.Name))
                        continue;

                    var name = obj.Name;
                    if (name.EndsWith("/", StringComparison.Ordinal))
                        continue;

                    var ext = Path.GetExtension(name);
                    if (!ImageExtensions.Contains(ext))
                        continue;

                    list.Add(name);
                }

                list.Sort(StringComparer.OrdinalIgnoreCase);
                return list;
            },
            cancellationToken);
    }

    private static bool IsTruthy(string? v) =>
        (bool.TryParse(v, out var b) && b)
        || string.Equals(v, "1", StringComparison.OrdinalIgnoreCase)
        || string.Equals(v, "yes", StringComparison.OrdinalIgnoreCase);
}
