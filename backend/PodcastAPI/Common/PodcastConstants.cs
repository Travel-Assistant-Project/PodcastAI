namespace PodcastAPI.Common;

public static class PodcastConstants
{
    public static class Tone
    {
        public const string Formal = "formal";
        public const string Casual = "casual";
        public const string Fun = "fun";

        public static readonly IReadOnlySet<string> Allowed =
            new HashSet<string>(StringComparer.OrdinalIgnoreCase) { Formal, Casual, Fun };
    }

    public static class Status
    {
        public const string Pending = "pending";
        public const string Processing = "processing";
        public const string Completed = "completed";
        public const string Failed = "failed";
    }

    public static readonly IReadOnlySet<int> AllowedDurationMinutes =
        new HashSet<int> { 2, 5, 10 };

    public static readonly IReadOnlySet<int> AllowedSpeakerCounts =
        new HashSet<int> { 1, 2 };

    // Podcasts.CategoryName kolonunda birden fazla kategoriyi ayırmak için kullanılan ayraç.
    public const char CategorySeparator = ',';
}
