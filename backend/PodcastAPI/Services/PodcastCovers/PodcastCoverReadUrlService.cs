using System.Net.Http;
using DotNetEnv;
using Google.Cloud.Storage.V1;
using PodcastAPI.Services.Storage;

namespace PodcastAPI.Services.PodcastCovers;

public class PodcastCoverReadUrlService(IWebHostEnvironment env) : IPodcastCoverReadUrlService
{
    private static readonly TimeSpan SignedUrlLifetime = TimeSpan.FromDays(7);

    public Task<string?> GetReadUrlAsync(string? objectKey, CancellationToken cancellationToken = default)
    {
        _ = cancellationToken;
        if (string.IsNullOrWhiteSpace(objectKey))
            return Task.FromResult<string?>(null);

        if (!IsTruthy(Env.GetString("USE_FIREBASE_PODCAST_COVERS")))
            return Task.FromResult<string?>(null);

        var bucket = Env.GetString("FIREBASE_STORAGE_BUCKET")?.Trim();
        var credRaw = Env.GetString("FIREBASE_CREDENTIALS_PATH")?.Trim();
        if (string.IsNullOrWhiteSpace(bucket) || string.IsNullOrWhiteSpace(credRaw))
            return Task.FromResult<string?>(null);

        string credPath;
        try
        {
            credPath = GcsFirebaseStorageHelper.ResolveCredentialPath(env.ContentRootPath, credRaw);
        }
        catch
        {
            return Task.FromResult<string?>(null);
        }

        var useUnsignedPublic = IsTruthy(Env.GetString("PODCAST_COVER_UNSIGNED_PUBLIC_URLS"));
        if (useUnsignedPublic)
            return Task.FromResult<string?>(GcsFirebaseStorageHelper.BuildPublicUrl(bucket, objectKey.Trim()));

        var signer = UrlSigner.FromCredentialFile(credPath);
        var url = signer.Sign(bucket, objectKey.Trim(), SignedUrlLifetime, HttpMethod.Get);
        return Task.FromResult<string?>(url);
    }

    private static bool IsTruthy(string? v) =>
        (bool.TryParse(v, out var b) && b)
        || string.Equals(v, "1", StringComparison.OrdinalIgnoreCase)
        || string.Equals(v, "yes", StringComparison.OrdinalIgnoreCase);
}
