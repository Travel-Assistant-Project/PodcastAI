using PodcastAPI.Common;
using PodcastAPI.Dto;
using PodcastAPI.Models.External;
using System.Collections.ObjectModel;
using System.Net.Http.Json;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;

namespace PodcastAPI.Services.External;

public class ListenNotesService(HttpClient httpClient, ILogger<ListenNotesService> logger) : IExternalPodcastService
{
    private static readonly JsonSerializerOptions ListenNotesJsonOptions =
        new(JsonSerializerDefaults.Web);

    private static readonly SemaphoreSlim GenreMapGate = new(1, 1);
    private static IReadOnlyDictionary<int, string>? GenreIdToName;

    private static readonly IReadOnlyDictionary<int, string> EmptyGenreMap =
        new ReadOnlyDictionary<int, string>(new Dictionary<int, string>());

    private async Task<IReadOnlyDictionary<int, string>> EnsureGenreNamesAsync(CancellationToken cancellationToken)
    {
        if (GenreIdToName != null)
            return GenreIdToName;

        await GenreMapGate.WaitAsync(cancellationToken);
        try
        {
            if (GenreIdToName != null)
                return GenreIdToName;

            ListenNotesGenresEnvelope? env;
            try
            {
                env = await httpClient.GetFromJsonAsync<ListenNotesGenresEnvelope>(
                    "genres",
                    ListenNotesJsonOptions,
                    cancellationToken);
            }
            catch (Exception ex)
            {
                logger.LogWarning(ex, "Listen Notes genres fetch failed; using neutral podcast categories.");
                GenreIdToName = EmptyGenreMap;
                return GenreIdToName;
            }

            var dict = new Dictionary<int, string>();
            foreach (var g in env?.Genres ?? new List<ListenNotesGenreRow>())
            {
                if (g.Id == 0) continue;
                var name = g.Name?.Trim();
                if (string.IsNullOrEmpty(name)) continue;
                dict[g.Id] = name;
            }

            GenreIdToName = dict.Count > 0
                ? new ReadOnlyDictionary<int, string>(dict)
                : EmptyGenreMap;

            return GenreIdToName;
        }
        finally
        {
            GenreMapGate.Release();
        }
    }

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
        try
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

            // Ana sayfa trending için ~10 şov; tek sayfa yetmezse bir sayfa daha (genre filtresi yokken).
            if (string.IsNullOrEmpty(genreId) && page == 1 && merged.Count < 10)
                await FetchPageAsync(2, cancellationToken);

            return merged;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Listen Notes Trending fetch failed.");
            return new();
        }
    }

    public async Task<PodcastDetailDto?> GetPodcastDetailAsync(
        string listenNotesPodcastId,
        string? episodeId = null,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(listenNotesPodcastId))
            return null;

        try
        {
            var genres = await EnsureGenreNamesAsync(cancellationToken);
            var url = $"podcasts/{Uri.EscapeDataString(listenNotesPodcastId.Trim())}";
            var detail = await httpClient.GetFromJsonAsync<ListenNotesPodcastDetailResponse>(
                url,
                ListenNotesJsonOptions,
                cancellationToken);
            if (detail == null || string.IsNullOrWhiteSpace(detail.Id))
                return null;

            return MapPodcastDetailToDto(detail, episodeId, genres);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Listen Notes podcast detail fetch failed.");
            return null;
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
