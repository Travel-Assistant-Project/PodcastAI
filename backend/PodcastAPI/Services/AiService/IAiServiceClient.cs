using PodcastAPI.Services.AiService.Models;

namespace PodcastAPI.Services.AiService;

public interface IAiServiceClient
{
    Task<AiGenerateResponse> GeneratePodcastAsync(AiGenerateRequest request, CancellationToken cancellationToken = default);
}
