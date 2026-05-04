namespace PodcastAPI.Dto;

// Frontend'in podcast oynatılırken aktif satırı vurgulamak için kullandığı zaman damgalı satır.
// audio.currentTime * 1000 değeri [StartMs, EndMs) aralığına denk gelirse satır aktif sayılır.
public class TranscriptSegmentDto
{
    public int Order { get; set; }
    public string Speaker { get; set; } = string.Empty;
    public string Text { get; set; } = string.Empty;
    public int StartMs { get; set; }
    public int EndMs { get; set; }
    public string? TextTr { get; set; }
}
