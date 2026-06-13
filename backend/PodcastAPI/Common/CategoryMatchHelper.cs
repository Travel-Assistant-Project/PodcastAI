namespace PodcastAPI.Common;

public static class CategoryMatchHelper
{
    private static readonly Dictionary<string, string[]> SlugAliases = new(StringComparer.OrdinalIgnoreCase)
    {
        ["technology"] = ["technology"],
        ["science"] = ["science"],
        ["economy"] = ["economy", "business"],
        ["health"] = ["health", "health & fitness"],
        ["world"] = ["world", "news", "government"],
        ["sports"] = ["sports"],
        ["entertainment"] = ["entertainment", "arts", "tv & film", "true crime", "comedy", "fiction"],
        ["finance"] = ["finance", "personal finance"],
        ["music"] = ["music"],
        ["ai"] = ["ai", "technology"],
    };

    private static readonly Dictionary<string, string> LabelToSlug = new(StringComparer.OrdinalIgnoreCase)
    {
        ["Technology"] = "technology",
        ["Science"] = "science",
        ["Business"] = "economy",
        ["Health"] = "health",
        ["World News"] = "world",
        ["Sports"] = "sports",
        ["Entertainment"] = "entertainment",
        ["Finance"] = "finance",
        ["Music"] = "music",
        ["AI"] = "ai",
    };

    public static bool MatchesCategoryBlob(string? categoryBlob, string categoryLabelOrSlug)
    {
        if (string.IsNullOrWhiteSpace(categoryBlob))
            return false;

        var categories = categoryBlob
            .Split(PodcastConstants.CategorySeparator, StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

        return MatchesCategories(categories, categoryLabelOrSlug);
    }

    public static bool MatchesCategories(IEnumerable<string> categories, string categoryLabelOrSlug)
    {
        var slug = ResolveSlug(categoryLabelOrSlug);
        if (slug == null)
            return false;

        var aliases = new HashSet<string>(StringComparer.OrdinalIgnoreCase) { slug };
        if (SlugAliases.TryGetValue(slug, out var extra))
        {
            foreach (var alias in extra)
                aliases.Add(alias);
        }

        if (LabelToSlug.TryGetValue(categoryLabelOrSlug.Trim(), out var fromLabel))
            aliases.Add(fromLabel);

        foreach (var raw in categories)
        {
            var normalized = raw.Trim();
            if (normalized.Length == 0 || normalized.Equals("podcast", StringComparison.OrdinalIgnoreCase))
                continue;

            var lower = normalized.ToLowerInvariant();
            foreach (var alias in aliases)
            {
                var aliasLower = alias.ToLowerInvariant();
                if (lower == aliasLower || lower.Contains(aliasLower) || aliasLower.Contains(lower))
                    return true;
            }
        }

        return false;
    }

    private static string? ResolveSlug(string categoryLabelOrSlug)
    {
        var key = categoryLabelOrSlug.Trim();
        if (key.Length == 0)
            return null;

        if (LabelToSlug.TryGetValue(key, out var fromLabel))
            return fromLabel;

        var lower = key.ToLowerInvariant();
        if (SlugAliases.ContainsKey(lower))
            return lower;

        var byLabel = LabelToSlug.FirstOrDefault(x =>
            x.Key.Equals(key, StringComparison.OrdinalIgnoreCase));
        if (!string.IsNullOrEmpty(byLabel.Value))
            return byLabel.Value;

        return lower;
    }
}
