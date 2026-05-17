using DotNetEnv;
using Google.Cloud.Storage.V1;
using Microsoft.AspNetCore.Http;

namespace PodcastAPI.Services.Storage;

public class ProfilePhotoStorage(IWebHostEnvironment env, IHttpContextAccessor httpContextAccessor)
    : IProfilePhotoStorage
{
    private static readonly HashSet<string> AllowedExtensions = new(StringComparer.OrdinalIgnoreCase)
        { ".jpg", ".jpeg", ".png", ".webp" };

    /// <summary>
    /// Env (ai-service ile uyumlu): USE_FIREBASE_PROFILE_PHOTOS=true,
    /// FIREBASE_CREDENTIALS_PATH, FIREBASE_STORAGE_BUCKET,
    /// isteğe bağlı FIREBASE_PROFILE_FOLDER (varsayılan profile-photos).
    /// </summary>
    public async Task<string> SaveAsync(IFormFile photo, Guid userId, CancellationToken cancellationToken = default)
    {
        if (photo.Length == 0)
            throw new ArgumentException("Empty file.", nameof(photo));

        var ext = Path.GetExtension(photo.FileName);
        if (!AllowedExtensions.Contains(ext))
            throw new InvalidOperationException("Only JPG, PNG and WebP files are allowed.");

        var extLower = ext.ToLowerInvariant();

        var useFirebase = IsTruthy(Env.GetString("USE_FIREBASE_PROFILE_PHOTOS"));
        if (useFirebase)
            return await SaveToFirebaseAsync(photo, userId, extLower, cancellationToken);

        return await SaveToLocalWebRootAsync(photo, userId, extLower, cancellationToken);
    }

    private static bool IsTruthy(string? v) =>
        (bool.TryParse(v, out var b) && b)
        || string.Equals(v, "1", StringComparison.OrdinalIgnoreCase)
        || string.Equals(v, "yes", StringComparison.OrdinalIgnoreCase);

    private async Task<string> SaveToFirebaseAsync(
        IFormFile photo,
        Guid userId,
        string extLower,
        CancellationToken cancellationToken)
    {
        var bucket = Env.GetString("FIREBASE_STORAGE_BUCKET")?.Trim();
        if (string.IsNullOrWhiteSpace(bucket))
            throw new InvalidOperationException(
                "USE_FIREBASE_PROFILE_PHOTOS aktifken FIREBASE_STORAGE_BUCKET .env'de tanımlı olmalı.");

        var credRaw = Env.GetString("FIREBASE_CREDENTIALS_PATH")?.Trim();
        if (string.IsNullOrWhiteSpace(credRaw))
            throw new InvalidOperationException(
                "USE_FIREBASE_PROFILE_PHOTOS aktifken FIREBASE_CREDENTIALS_PATH .env'de tanımlı olmalı.");

        var credPath = GcsFirebaseStorageHelper.ResolveCredentialPath(env.ContentRootPath, credRaw);

        var folder = (Env.GetString("FIREBASE_PROFILE_FOLDER") ?? "profile-photos").Trim().Trim('/');
        var objectName = string.IsNullOrEmpty(folder)
            ? $"{userId:D}{extLower}"
            : $"{folder}/{userId:D}{extLower}";

        var contentType = extLower switch
        {
            ".png" => "image/png",
            ".webp" => "image/webp",
            _ => "image/jpeg",
        };

        var client = GcsFirebaseStorageHelper.GetClient(credPath);

        await using var stream = photo.OpenReadStream();
        await client.UploadObjectAsync(
            bucket,
            objectName,
            contentType,
            stream,
            new UploadObjectOptions { PredefinedAcl = PredefinedObjectAcl.PublicRead },
            cancellationToken);

        return GcsFirebaseStorageHelper.BuildPublicUrl(bucket, objectName);
    }

    private async Task<string> SaveToLocalWebRootAsync(
        IFormFile photo,
        Guid userId,
        string extLower,
        CancellationToken cancellationToken)
    {
        var wwwroot = env.WebRootPath ?? Path.Combine(env.ContentRootPath, "wwwroot");
        var photosDir = Path.Combine(wwwroot, "photos");
        Directory.CreateDirectory(photosDir);

        var filename = $"{userId:D}{extLower}";
        var filePath = Path.Combine(photosDir, filename);

        await using (var stream = new FileStream(filePath, FileMode.Create))
            await photo.CopyToAsync(stream, cancellationToken);

        var req = httpContextAccessor.HttpContext?.Request;
        if (req == null)
            throw new InvalidOperationException("HTTP isteği bağlamı yok; yerel fotoğraf URL'i oluşturulamıyor.");

        return $"{req.Scheme}://{req.Host}/photos/{filename}";
    }
}
