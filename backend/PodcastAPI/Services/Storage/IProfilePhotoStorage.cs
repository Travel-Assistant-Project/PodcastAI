namespace PodcastAPI.Services.Storage;

/// <summary>
/// Profil fotoğrafını kalıcı depoya yazar ve kullanıcıya gösterilecek mutlak URL döner.
/// Firebase kapalıysa wwwroot/photos kullanılır.
/// </summary>
public interface IProfilePhotoStorage
{
    Task<string> SaveAsync(IFormFile photo, Guid userId, CancellationToken cancellationToken = default);
}
