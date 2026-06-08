using PodcastAPI.Common;
using PodcastAPI.Dto;

namespace PodcastAPI.Services.External;

/// <summary>
/// Yerel yedek katalog — Listen Notes rate-limit veya ağ hatasında trending/detay için.
/// </summary>
public static class ExternalPodcastCatalog
{
    private static readonly IReadOnlyDictionary<string, string> GenreIdToLabel =
        new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {
            ["127"] = "Technology",
            ["107"] = "Science",
            ["93"] = "Business",
            ["88"] = "Health",
            ["99"] = "World News",
            ["77"] = "Sports",
            ["100"] = "Entertainment",
            ["144"] = "Finance",
            ["134"] = "Music",
        };

    private sealed record CuratedPodcast(PodcastSummaryDto Summary, PodcastDetailDto Detail);

    private static readonly List<CuratedPodcast> Catalog = BuildCatalog();

    public static List<PodcastSummaryDto> GetSummaries(string? genreId, int max = 10)
    {
        IEnumerable<CuratedPodcast> query = Catalog;

        if (!string.IsNullOrWhiteSpace(genreId)
            && GenreIdToLabel.TryGetValue(genreId.Trim(), out var label))
        {
            query = query.Where(e =>
                e.Summary.Categories.Any(c =>
                    c.Contains(label, StringComparison.OrdinalIgnoreCase)));
        }

        return query.Select(e => e.Summary).Take(max).ToList();
    }

    public static PodcastDetailDto? GetDetail(string listenNotesPodcastId)
    {
        if (string.IsNullOrWhiteSpace(listenNotesPodcastId))
            return null;

        var key = listenNotesPodcastId.Trim();
        return Catalog.FirstOrDefault(e =>
                string.Equals(e.Summary.ListenNotesPodcastId, key, StringComparison.OrdinalIgnoreCase))
            ?.Detail;
    }

    private static List<CuratedPodcast> BuildCatalog()
    {
        var entries = new (string LnId, Guid Id, string Title, string Publisher, string Category, string? Cover)[]
        {
            ("4f18f0de-fd21-4af2-ae89-eeb19542e7c3", new Guid("6021e785-b397-9b01-1b1b-0debf26356d9"), "The Daily", "The New York Times", "World News", null),
            ("b2942240-4c77-4be3-b6b6-a2d5c843a36f", new Guid("db6f91df-4ae7-eb1e-648f-b10b9e62968a"), "TED Talks Daily", "TED", "Technology", null),
            ("22d5b560-01e3-40fb-ab46-e629b9968c40", new Guid("dbae2372-1cbf-e3a3-fb72-f0b4a28f5913"), "Stuff You Should Know", "iHeartPodcasts", "Science", null),
            ("7a633f6e-2d7b-48ef-8a49-f1fd45124a55", new Guid("bcceb796-225c-a47e-475a-5f5ecb63ef54"), "How I Built This", "NPR", "Business", null),
            ("6f6d31bc-eb6e-4130-a850-9a2d5fbfa0e4", new Guid("0c80508f-1110-4956-517d-df5085ab99b1"), "Hidden Brain", "NPR", "Health", null),
            ("42be484a-fafc-4d75-915b-59c1aea9e886", new Guid("6f5234b7-593c-d754-9273-2b540b6433d9"), "Science Vs", "Spotify Studios", "Science", null),
            ("73cb3bf0-df27-4aa9-aeeb-fe30f21e5abc", new Guid("66577cd3-72db-4498-4f89-1cfe6ae39666"), "Freakonomics Radio", "Freakonomics Radio + Stitcher", "Finance", null),
            ("98bc3aa3-9ad4-46eb-a88c-ae548551fe1d", new Guid("35ac530c-076b-31ed-798a-3654379fb16d"), "Planet Money", "NPR", "Finance", null),
            ("c7b33460-0f5e-4fc1-8c7f-5fe01d55b0b1", new Guid("edb183b8-699f-2b24-258c-a65e2678b75d"), "The Bill Simmons Podcast", "The Ringer", "Sports", null),
            ("e8bf79c8-7a43-4a4d-9428-268aa6217b63", new Guid("dded2b1f-c9dc-135f-a267-e85de9add28e"), "Song Exploder", "Hrishikesh Hirway", "Music", null),
            ("2bc39836-7723-4aa9-b815-17eb2d2e7f2e", new Guid("414392db-cc95-4697-fcbf-c1d91a4046af"), "SmartLess", "Jason Bateman, Sean Hayes, Will Arnett", "Entertainment", null),
        };

        var list = new List<CuratedPodcast>(entries.Length);
        foreach (var e in entries)
        {
            var lnUrl = $"https://www.listennotes.com/c/{e.LnId}/";
            var createdAt = DateTime.UtcNow.AddDays(-7);

            var summary = new PodcastSummaryDto
            {
                Id = e.Id,
                Title = e.Title,
                AudioUrl = lnUrl,
                DurationSeconds = null,
                Status = "External",
                Categories = new List<string> { e.Category },
                CoverImageUrl = e.Cover,
                ListenNotesUrl = lnUrl,
                Publisher = e.Publisher,
                ListenNotesPodcastId = e.LnId,
                CreatedAt = createdAt,
                LearningMode = false,
                CefrLevel = null,
            };

            var detail = new PodcastDetailDto
            {
                Id = e.Id,
                UserId = null,
                Title = e.Title,
                ScriptText = $"Curated fallback entry for {e.Title}. Listen Notes API is temporarily unavailable.",
                AudioUrl = null,
                DurationSeconds = null,
                Tone = null,
                SpeakerCount = 1,
                Status = PodcastConstants.Status.Failed,
                Categories = new List<string> { e.Category },
                CoverImageUrl = e.Cover,
                CreatedAt = createdAt,
                Sources = new List<PodcastSourceDto>
                {
                    new()
                    {
                        SourceName = "Listen Notes",
                        NewsTitle = e.Title,
                        NewsUrl = lnUrl,
                        PublishedAt = createdAt,
                    },
                },
                Transcript = new(),
                CefrLevel = null,
                LearningMode = false,
                ListeningProgressSeconds = 0,
                ListeningCompleted = false,
                ListenNotesPodcastId = e.LnId,
                ListenNotesEpisodeId = null,
                Publisher = e.Publisher,
            };

            list.Add(new CuratedPodcast(summary, detail));
        }

        return list;
    }
}
