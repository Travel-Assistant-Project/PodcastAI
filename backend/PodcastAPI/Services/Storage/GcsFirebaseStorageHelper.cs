using Google.Apis.Auth.OAuth2;
using Google.Cloud.Storage.V1;

namespace PodcastAPI.Services.Storage;

/// <summary>
/// Firebase Storage (GCS) için ortak istemci ve public URL oluşturma.
/// Profil fotoğrafı ve podcast kapak manifest'i burayı paylaşır.
/// </summary>
public static class GcsFirebaseStorageHelper
{
    private static StorageClient? _client;
    private static string? _boundCredentialPath;
    private static readonly object LockObj = new();

    public static StorageClient GetClient(string credentialPath)
    {
        lock (LockObj)
        {
            if (_client != null && string.Equals(_boundCredentialPath, credentialPath, StringComparison.Ordinal))
                return _client;

            var credential = GoogleCredential.FromFile(credentialPath);
            _client = StorageClient.Create(credential);
            _boundCredentialPath = credentialPath;
            return _client;
        }
    }

    /// <summary>Tarayıcı / React Native Image ile kullanılabilir genel URL (nesne Public Read olmalı).</summary>
    public static string BuildPublicUrl(string bucket, string objectName)
    {
        var segments = objectName.Replace('\\', '/').Split('/', StringSplitOptions.RemoveEmptyEntries);
        var encodedPath = string.Join("/", segments.Select(Uri.EscapeDataString));
        return $"https://storage.googleapis.com/{bucket}/{encodedPath}";
    }

    public static string ResolveCredentialPath(string contentRootPath, string credRaw)
    {
        if (string.IsNullOrWhiteSpace(credRaw))
            throw new InvalidOperationException("FIREBASE_CREDENTIALS_PATH tanımlı değil.");

        var credPath = Path.IsPathRooted(credRaw)
            ? credRaw
            : Path.Combine(contentRootPath, credRaw);

        if (!File.Exists(credPath))
            throw new InvalidOperationException($"Firebase credentials dosyası bulunamadı: {credPath}");

        return credPath;
    }
}
