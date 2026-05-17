using PodcastAPI.Services.AiService.Models;

namespace PodcastAPI.Services.AiService;

public interface IAiServiceClient
{
    Task<AiGenerateResponse> GeneratePodcastAsync(AiGenerateRequest request, CancellationToken cancellationToken = default);

    Task<AiPodcastScriptPhaseResponse> GenerateScriptPhaseAsync(
        AiGenerateRequest request,
        CancellationToken cancellationToken = default);

    Task<AiPodcastAudioPhaseResponse> FinalizePodcastAudioAsync(
        AiPodcastAudioPhaseRequest request,
        CancellationToken cancellationToken = default);

    Task<AiTranslateWordResponse> TranslateWordAsync(AiTranslateWordRequest request, CancellationToken cancellationToken = default);
}
