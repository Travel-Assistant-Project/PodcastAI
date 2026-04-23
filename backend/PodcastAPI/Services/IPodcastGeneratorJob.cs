using PodcastAPI.Dto;

namespace PodcastAPI.Services;

public interface IPodcastGeneratorJob
{
    Task RunAsync(Guid podcastId, GeneratePodcastRequestDto request);
}