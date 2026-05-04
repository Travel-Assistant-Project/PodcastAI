using System.Net.Http.Json;
using System.Text.Json;
using PodcastAPI.Services.AiService.Models;

namespace PodcastAPI.Services.AiService;

public class AiServiceClient(HttpClient httpClient, ILogger<AiServiceClient> logger) : IAiServiceClient
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    public async Task<AiGenerateResponse> GeneratePodcastAsync(
        AiGenerateRequest request,
        CancellationToken cancellationToken = default)
    {
        logger.LogInformation(
            "ai-service'e podcast üretim isteği gönderiliyor. PodcastId={PodcastId}, Categories={Categories}",
            request.PodcastId, string.Join(",", request.Categories));

        using var response = await httpClient.PostAsJsonAsync(
            "/internal/podcast/generate",
            request,
            JsonOptions,
            cancellationToken);

        if (!response.IsSuccessStatusCode)
        {
            var body = await response.Content.ReadAsStringAsync(cancellationToken);
            logger.LogError(
                "ai-service {StatusCode} döndürdü. PodcastId={PodcastId}, Body={Body}",
                (int)response.StatusCode, request.PodcastId, body);
            throw new AiServiceException(
                $"ai-service çağrısı başarısız ({(int)response.StatusCode}): {body}");
        }

        var result = await response.Content.ReadFromJsonAsync<AiGenerateResponse>(JsonOptions, cancellationToken);
        if (result is null)
        {
            throw new AiServiceException("ai-service boş cevap döndürdü.");
        }

        return result;
    }

    public async Task<AiTranslateWordResponse> TranslateWordAsync(
        AiTranslateWordRequest request,
        CancellationToken cancellationToken = default)
    {
        logger.LogInformation(
            "ai-service'e kelime çeviri isteği. Word={Word} HasContext={HasContext}",
            request.Word,
            !string.IsNullOrWhiteSpace(request.ContextSentence));

        using var response = await httpClient.PostAsJsonAsync(
            "/internal/translate/word",
            request,
            JsonOptions,
            cancellationToken);

        if (!response.IsSuccessStatusCode)
        {
            var body = await response.Content.ReadAsStringAsync(cancellationToken);
            logger.LogError(
                "ai-service translate/word {StatusCode}. Word={Word} Body={Body}",
                (int)response.StatusCode, request.Word, body);
            throw new AiServiceException(
                $"ai-service çeviri çağrısı başarısız ({(int)response.StatusCode}): {body}");
        }

        var result = await response.Content.ReadFromJsonAsync<AiTranslateWordResponse>(JsonOptions, cancellationToken);
        if (result is null)
        {
            throw new AiServiceException("ai-service çeviri için boş cevap döndürdü.");
        }
        return result;
    }
}

public class AiServiceException(string message) : Exception(message);
