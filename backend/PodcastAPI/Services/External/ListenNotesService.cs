using Microsoft.Extensions.Caching.Memory;
using PodcastAPI.Common;
using PodcastAPI.Dto;
using PodcastAPI.Models.External;
using System.Collections.Concurrent;
using System.Collections.ObjectModel;
using System.Net.Http.Json;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;

namespace PodcastAPI.Services.External;

public class ListenNotesService(
    HttpClient httpClient,
    ILogger<ListenNotesService> logger,
    IMemoryCache cache) : IExternalPodcastService
{
    private static readonly TimeSpan FreshCacheTtl = TimeSpan.FromHours(1);
    private static readonly TimeSpan StaleCacheTtl = TimeSpan.FromDays(7);
    private static DateTime _rateLimitedUntilUtc = DateTime.MinValue;

    private static string BestPodcastsCacheKey(string? genreId) =>
        $"ln:best:{genreId?.Trim() ?? "all"}";

    private static string BestPodcastsStaleKey(string? genreId) =>
        $"ln:stale:best:{genreId?.Trim() ?? "all"}";
    private static readonly JsonSerializerOptions ListenNotesJsonOptions =
        new(JsonSerializerDefaults.Web);

    private static readonly ConcurrentDictionary<string, SemaphoreSlim> FetchGates = new();

    /// <summary>GET /genres yerine — her trending isteğinde ekstra API çağrısı yapmamak için.</summary>
    private static readonly IReadOnlyDictionary<int, string> GenreIdToName =
        new ReadOnlyDictionary<int, string>(new Dictionary<int, string>
        {
            [77] = "Sports",
            [88] = "Health",
            [93] = "Business",
            [99] = "World News",
            [100] = "Entertainment",
            [107] = "Science",
            [127] = "Technology",
            [134] = "Music",
            [144] = "Finance",
        });

    private static Task<IReadOnlyDictionary<int, string>> EnsureGenreNamesAsync(CancellationToken cancellationToken) =>
        Task.FromResult(GenreIdToName);

    /// <summary>
    /// Önce Listen Notes genre adları (genre_ids), sonra yayıncı; API ile genre çekimi uyumlu.
    /// </summary>
    private static List<string> BuildListenNotesCategories(
        IReadOnlyDictionary<int, string> genreNames,
        string? publisherOriginal,
        IReadOnlyList<int>? genreIds)
    {
        var seen = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        var list = new List<string>();

        void TryAdd(string? label)
        {
            var t = label?.Trim();
            if (string.IsNullOrEmpty(t)) return;
            if (!seen.Add(t)) return;
            list.Add(t);
        }

        foreach (var gid in genreIds ?? [])
        {
            if (genreNames.TryGetValue(gid, out var gn))
                TryAdd(gn);
        }

        TryAdd(publisherOriginal);

        if (list.Count == 0)
            list.Add("podcast");

        return list;
    }

    public async Task<List<PodcastSummaryDto>> GetBestPodcastsAsync(
        string? genreId,
        int page = 1,
        CancellationToken cancellationToken = default)
    {
        var cacheKey = BestPodcastsCacheKey(genreId);
        if (cache.TryGetValue(cacheKey, out List<PodcastSummaryDto>? fresh) && fresh is { Count: > 0 })
            return fresh;

        if (DateTime.UtcNow < _rateLimitedUntilUtc)
            return ResolveTrendingFallback(genreId, cacheKey);

        var gate = FetchGates.GetOrAdd(cacheKey, static _ => new SemaphoreSlim(1, 1));
        await gate.WaitAsync(cancellationToken);
        try
        {
            if (cache.TryGetValue(cacheKey, out List<PodcastSummaryDto>? cachedAfterWait) && cachedAfterWait is { Count: > 0 })
                return cachedAfterWait;

            if (DateTime.UtcNow < _rateLimitedUntilUtc)
                return ResolveTrendingFallback(genreId, cacheKey);

            try
            {
                var merged = await FetchBestPodcastsAsync(genreId, page, cancellationToken);
                if (merged.Count > 0)
                {
                    cache.Set(cacheKey, merged, FreshCacheTtl);
                    cache.Set(BestPodcastsStaleKey(genreId), merged, StaleCacheTtl);
                    return merged;
                }

                return ResolveTrendingFallback(genreId, cacheKey);
            }
            catch (Exception ex)
            {
                if (IsRateLimited(ex))
                {
                    _rateLimitedUntilUtc = DateTime.UtcNow.AddMinutes(30);
                    logger.LogWarning("Listen Notes rate-limited; pausing external fetches for 30 minutes.");
                }
                else
                {
                    logger.LogError(ex, "Listen Notes Trending fetch failed.");
                }

                return ResolveTrendingFallback(genreId, cacheKey);
            }
        }
        finally
        {
            gate.Release();
        }
    }

    private List<PodcastSummaryDto> ResolveTrendingFallback(string? genreId, string cacheKey)
    {
        if (cache.TryGetValue(BestPodcastsStaleKey(genreId), out List<PodcastSummaryDto>? stale) && stale is { Count: > 0 })
        {
            logger.LogInformation("Returning stale Listen Notes trending cache for {CacheKey}.", cacheKey);
            return stale;
        }

        if (!string.IsNullOrWhiteSpace(genreId)
            && cache.TryGetValue(BestPodcastsStaleKey(null), out List<PodcastSummaryDto>? globalStale)
            && globalStale is { Count: > 0 })
        {
            var filtered = FilterByGenreLabel(globalStale, genreId).Take(10).ToList();
            if (filtered.Count > 0)
                return filtered;
        }

        logger.LogWarning(
            "No Listen Notes trending data for {CacheKey}; quota may be exhausted (HTTP 429).",
            cacheKey);
        return [];
    }

    private static bool IsRateLimited(Exception ex) =>
        ex.Message.Contains("429", StringComparison.Ordinal);

    private static IEnumerable<PodcastSummaryDto> FilterByGenreLabel(
        IEnumerable<PodcastSummaryDto> items,
        string genreId)
    {
        if (!int.TryParse(genreId.Trim(), out var gid) || !GenreIdToName.TryGetValue(gid, out var label))
            yield break;

        foreach (var item in items)
        {
            if (item.Categories.Any(c => c.Contains(label, StringComparison.OrdinalIgnoreCase)))
                yield return item;
        }
    }

    private async Task<List<PodcastSummaryDto>> FetchBestPodcastsAsync(
        string? genreId,
        int page,
        CancellationToken cancellationToken)
    {
        var genres = await EnsureGenreNamesAsync(cancellationToken);
        var seenLnIds = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        var merged = new List<PodcastSummaryDto>();

        async Task FetchPageAsync(int pageNum, CancellationToken ct)
        {
            var url = $"best_podcasts?page={pageNum}";
            if (!string.IsNullOrEmpty(genreId)) url += $"&genre_id={genreId}";

            var response = await httpClient.GetFromJsonAsync<ListenNotesResponse>(
                url,
                ListenNotesJsonOptions,
                ct);

            foreach (var p in response?.Podcasts ?? Enumerable.Empty<ListenNotesPodcast>())
            {
                var id = p.Id?.Trim();
                if (string.IsNullOrEmpty(id) || !seenLnIds.Add(id))
                    continue;
                merged.Add(MapToDto(p, genres));
            }
        }

        await FetchPageAsync(page, cancellationToken);

        return merged;
    }

    public async Task<PodcastDetailDto?> GetPodcastDetailAsync(
        string listenNotesPodcastId,
        string? episodeId = null,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(listenNotesPodcastId))
            return null;

        var catalogDetail = ExternalPodcastCatalog.GetDetail(listenNotesPodcastId);
        if (DateTime.UtcNow < _rateLimitedUntilUtc)
            return catalogDetail;

        try
        {
            var genres = await EnsureGenreNamesAsync(cancellationToken);
            var url = $"podcasts/{Uri.EscapeDataString(listenNotesPodcastId.Trim())}";
            var detail = await httpClient.GetFromJsonAsync<ListenNotesPodcastDetailResponse>(
                url,
                ListenNotesJsonOptions,
                cancellationToken);
            if (detail == null || string.IsNullOrWhiteSpace(detail.Id))
                return catalogDetail;

            return MapPodcastDetailToDto(detail, episodeId, genres);
        }
        catch (Exception ex)
        {
            if (IsRateLimited(ex))
                _rateLimitedUntilUtc = DateTime.UtcNow.AddMinutes(10);

            logger.LogError(ex, "Listen Notes podcast detail fetch failed.");
            return catalogDetail;
        }
    }

    private static string StripHtml(string? html)
    {
        if (string.IsNullOrWhiteSpace(html))
            return string.Empty;

        var txt = Regex.Replace(html, "<.*?>", string.Empty, RegexOptions.Singleline);
        return Regex.Replace(txt, @"\s+", " ").Trim();
    }

    /// <summary>Listen Notes CDN'deki genel logo / statik placeholder görselleri gerçek kapak saymayız.</summary>
    private static bool IsListenNotesPlaceholderArt(string? url)
    {
        if (string.IsNullOrWhiteSpace(url)) return true;
        if (!Uri.TryCreate(url.Trim(), UriKind.Absolute, out var uri)) return false;
        if (!uri.Host.Contains("listennotes", StringComparison.OrdinalIgnoreCase)) return false;
        var path = uri.AbsolutePath.ToLowerInvariant();
        return path.Contains("/h/static/", StringComparison.Ordinal)
               || path.Contains("/static/images/", StringComparison.Ordinal);
    }

    /// <summary>Önce küçük resim, sonra büyük; placeholder olanları atlar.</summary>
    private static string? PickListenNotesCover(string? thumbnail, string? largeImage)
    {
        foreach (var raw in new[] { thumbnail?.Trim(), largeImage?.Trim() })
        {
            if (string.IsNullOrEmpty(raw)) continue;
            if (!IsListenNotesPlaceholderArt(raw)) return raw;
        }

        return null;
    }

    private static PodcastDetailDto MapPodcastDetailToDto(
        ListenNotesPodcastDetailResponse root,
        string? episodeId,
        IReadOnlyDictionary<int, string> genreNames)
    {
        var episodes = root.Episodes.Where(static e => e != null).ToList();

        ListenNotesEpisodeBrief? ep = null;
        var wantEpisode = episodeId?.Trim();
        if (!string.IsNullOrEmpty(wantEpisode))
            ep = episodes.FirstOrDefault(e =>
                string.Equals(e.Id?.Trim(), wantEpisode, StringComparison.Ordinal));

        ep ??= episodes.OrderByDescending(e => e.PubDateMs).FirstOrDefault();

        var thumb = root.Thumbnail?.Trim() ?? "";
        var large = root.Image?.Trim() ?? "";
        var cover = PickListenNotesCover(thumb, large);

        var publisherRaw = root.ResolvedPublisher;
        var publisher = string.IsNullOrWhiteSpace(publisherRaw) ? null : publisherRaw.Trim();
        var categories = BuildListenNotesCategories(genreNames, publisher, root.GenreIds);

        var audioUrl = "";
        int? durationSec = null;
        var pubMs = root.LatestPubDateMs;

        if (ep != null)
        {
            audioUrl = ep.Audio?.Trim() ?? "";
            if (string.IsNullOrEmpty(audioUrl))
                audioUrl = ep.ListennotesUrl?.Trim() ?? "";
            if (ep.AudioLengthSec > 0)
                durationSec = ep.AudioLengthSec;
            if (ep.PubDateMs > 0)
                pubMs = ep.PubDateMs;
        }

        var scriptParts = new List<string>();
        if (ep != null)
        {
            var et = ep.ResolvedEpisodeTitle;
            if (!string.IsNullOrWhiteSpace(et))
                scriptParts.Add(et);

            var desc = StripHtml(ep.DescriptionOriginal);
            if (!string.IsNullOrWhiteSpace(desc))
                scriptParts.Add(desc);
        }

        if (scriptParts.Count == 0)
        {
            var d = StripHtml(root.Description);
            if (!string.IsNullOrWhiteSpace(d))
                scriptParts.Add(d);
        }

        var scriptText = scriptParts.Count > 0 ? string.Join("\n\n", scriptParts) : null;

        var createdAt = pubMs > 0
            ? DateTimeOffset.FromUnixTimeMilliseconds(pubMs).UtcDateTime
            : DateTime.UtcNow;

        var hasAudio = !string.IsNullOrWhiteSpace(audioUrl);
        var status = hasAudio ? PodcastConstants.Status.Completed : PodcastConstants.Status.Failed;

        var sources = new List<PodcastSourceDto>();
        if (ep != null && !string.IsNullOrWhiteSpace(ep.ListennotesUrl))
        {
            sources.Add(new PodcastSourceDto
            {
                SourceName = "Listen Notes",
                NewsTitle = ep.ResolvedEpisodeTitle,
                NewsUrl = ep.ListennotesUrl.Trim(),
                PublishedAt = ep.PubDateMs > 0
                    ? DateTimeOffset.FromUnixTimeMilliseconds(ep.PubDateMs).UtcDateTime
                    : null,
            });
        }
        else if (!string.IsNullOrWhiteSpace(root.ListennotesUrl))
        {
            sources.Add(new PodcastSourceDto
            {
                SourceName = "Listen Notes",
                NewsTitle = root.ResolvedShowTitle,
                NewsUrl = root.ListennotesUrl.Trim(),
                PublishedAt = null,
            });
        }

        return new PodcastDetailDto
        {
            Id = StableListenNotesPodcastGuid(root.Id),
            UserId = null,
            Title = string.IsNullOrWhiteSpace(root.ResolvedShowTitle) ? "Podcast" : root.ResolvedShowTitle,
            ScriptText = scriptText,
            AudioUrl = hasAudio ? audioUrl : null,
            DurationSeconds = durationSec,
            Tone = null,
            SpeakerCount = 1,
            Status = status,
            Categories = categories,
            CoverImageUrl = cover,
            CefrLevel = null,
            LearningMode = false,
            CreatedAt = createdAt,
            Sources = sources,
            Transcript = new(),
            ListeningProgressSeconds = 0,
            ListeningCompleted = false,
            ListenNotesPodcastId = root.Id.Trim(),
            ListenNotesEpisodeId = ep?.Id?.Trim(),
            Publisher = publisher,
        };
    }

    /// <summary>Aynı Listen Notes podcast id için listeler / yenilemelerde sabit GUID.</summary>
    internal static Guid StableListenNotesPodcastGuid(string listenNotesPodcastId)
    {
        if (string.IsNullOrWhiteSpace(listenNotesPodcastId))
            return Guid.Empty;

        var bytes = MD5.HashData(Encoding.UTF8.GetBytes($"ln.pod:{listenNotesPodcastId.Trim()}"));
        return new Guid(bytes);
    }

    private static PodcastSummaryDto MapToDto(ListenNotesPodcast item, IReadOnlyDictionary<int, string> genreNames)
    {
        long unixMs = item.PubDateMs > 0
            ? item.PubDateMs
            : (item.LatestPubDateMs > 0 ? item.LatestPubDateMs : DateTimeOffset.UtcNow.ToUnixTimeMilliseconds());

        var listenUrl = item.ListennotesUrl?.Trim() ?? "";
        var thumb = item.Thumbnail?.Trim() ?? "";
        var largeImage = item.Image?.Trim() ?? "";
        var cover = PickListenNotesCover(thumb, largeImage);

        var publisherRaw = item.ResolvedPublisher;
        var publisher = string.IsNullOrWhiteSpace(publisherRaw) ? null : publisherRaw.Trim();
        var categories = BuildListenNotesCategories(genreNames, publisher, item.GenreIds);

        var playable = item.Audio?.Trim() ?? "";

        return new PodcastSummaryDto
        {
            Id = StableListenNotesPodcastGuid(item.Id),
            Title = string.IsNullOrEmpty(item.ResolvedTitle) ? "Podcast" : item.ResolvedTitle,
            AudioUrl = string.IsNullOrEmpty(playable) ? listenUrl : playable,
            DurationSeconds = item.AudioLengthSec > 0 ? item.AudioLengthSec : null,
            Status = "External",
            Categories = categories,
            CoverImageUrl = cover,
            ListenNotesUrl = string.IsNullOrEmpty(listenUrl) ? null : listenUrl,
            Publisher = string.IsNullOrEmpty(publisher) ? null : publisher,
            CreatedAt = DateTimeOffset.FromUnixTimeMilliseconds(unixMs).UtcDateTime,
            LearningMode = false,
            CefrLevel = null,
            ListenNotesPodcastId = item.Id.Trim(),
        };
    }
}
