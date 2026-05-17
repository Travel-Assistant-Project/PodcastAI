namespace PodcastAPI.Services.PodcastCovers;

/// <summary>
/// Tek kategori: o klasörün havuzu. İki+ kategori: önce general (tek tema öne çıkmasın).
/// General boşsa sıradaki klasörler; podcast id ile deterministik indeks.
/// </summary>
public static class PodcastCoverPicker
{
    private static readonly Dictionary<string, string> CategoryAliases =
        new(StringComparer.OrdinalIgnoreCase)
        {
            ["technology"] = "technology",
            ["science"] = "science",
            ["economy"] = "economy",
            ["business"] = "economy",
            ["health"] = "health",
            ["world"] = "world",
            ["sports"] = "sports",
            ["entertainment"] = "entertainment",
            ["finance"] = "finance",
            ["music"] = "music",
            ["ai"] = "ai",
        };

    /// <summary>Kategori havuzundan tek bir nesne anahtarı veya URL dizisi öğesi seçer.</summary>
    public static string? PickFromPools(
        IReadOnlyDictionary<string, List<string>> poolsByCategory,
        IReadOnlyList<string> categories,
        Guid podcastId)
    {
        if (poolsByCategory.Count == 0)
            return null;

        var normalized = NormalizeCategories(categories);

        // Çoklu seçim: health+world gibi — ilk kategoriye kitlenmemek için genel podcast havuzu.
        if (normalized.Count >= 2 &&
            poolsByCategory.TryGetValue("general", out var generalForMulti) &&
            generalForMulti.Count > 0)
            return generalForMulti[Fnv1aMod(podcastId, generalForMulti.Count)];

        foreach (var slug in normalized)
        {
            if (!CategoryAliases.TryGetValue(slug, out var folder))
                continue;
            if (!poolsByCategory.TryGetValue(folder, out var pool) || pool.Count == 0)
                continue;
            return pool[Fnv1aMod(podcastId, pool.Count)];
        }

        if (poolsByCategory.TryGetValue("general", out var general) && general.Count > 0)
            return general[Fnv1aMod(podcastId, general.Count)];

        return null;
    }

    private static List<string> NormalizeCategories(IReadOnlyList<string> categories)
    {
        var seen = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        var list = new List<string>();
        foreach (var c in categories)
        {
            var s = c.Trim().ToLowerInvariant();
            if (s.Length == 0 || seen.Contains(s))
                continue;
            seen.Add(s);
            list.Add(s);
        }

        return list;
    }

    private static int Fnv1aMod(Guid podcastId, int poolLength)
    {
        var input = podcastId.ToString("D");
        unchecked
        {
            uint h = 2166136261;
            foreach (var ch in input)
            {
                h ^= ch;
                h *= 16777619;
            }

            return (int)(h % (uint)poolLength);
        }
    }
}
