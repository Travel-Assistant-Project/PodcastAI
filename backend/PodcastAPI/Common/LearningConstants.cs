namespace PodcastAPI.Common;

public static class LearningConstants
{
    public static class Mode
    {
        public const string Listen = "listen";
        public const string Learn = "learn";

        public static readonly IReadOnlySet<string> Allowed =
            new HashSet<string>(StringComparer.OrdinalIgnoreCase) { Listen, Learn };
    }

    public static readonly IReadOnlySet<string> AllowedCefrLevels =
        new HashSet<string>(StringComparer.OrdinalIgnoreCase)
        {
            "A1", "A2", "B1", "B2", "C1", "C2",
        };
}
