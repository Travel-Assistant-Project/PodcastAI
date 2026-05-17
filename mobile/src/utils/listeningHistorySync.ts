import { recordListenNotesPlay, recordPlay } from '@/src/api/podcasts.api';

/** Mini player / arka planda çalarken AudioPlayer ekranı olmasa da kullanılacak snapshot. */
export type ListeningHistorySyncPayload = {
  podcastId: string;
  title: string;
  audioUrl: string;
  coverImageUrl?: string | null;
  listenNotesPodcastId?: string | null;
  listenNotesEpisodeId?: string | null;
  durationSecondsMeta?: number | null;
  categories?: string[] | null;
};

export async function persistListeningHistorySnapshot(
  payload: ListeningHistorySyncPayload | null,
  progressSeconds: number,
  isCompleted: boolean,
  observedDurationSec?: number | null,
): Promise<void> {
  if (!payload) return;

  const lnPod = payload.listenNotesPodcastId?.trim();
  const lnEp = payload.listenNotesEpisodeId?.trim();

  if (lnPod && lnEp) {
    const metaSec =
      payload.durationSecondsMeta != null && payload.durationSecondsMeta > 0
        ? payload.durationSecondsMeta
        : 0;
    const observed =
      observedDurationSec != null &&
      Number.isFinite(observedDurationSec) &&
      observedDurationSec > 0
        ? Math.floor(observedDurationSec)
        : 0;
    let durationSeconds: number | undefined;
    if (observed > 0 && metaSec > 0) durationSeconds = Math.max(observed, metaSec);
    else if (observed > 0) durationSeconds = observed;
    else if (metaSec > 0) durationSeconds = metaSec;

    await recordListenNotesPlay({
      listenNotesEpisodeId: lnEp,
      listenNotesPodcastId: lnPod,
      progressSeconds,
      isCompleted,
      durationSeconds,
      title: payload.title ?? undefined,
      audioUrl: payload.audioUrl ?? undefined,
      coverImageUrl: payload.coverImageUrl ?? undefined,
      categories: payload.categories?.length ? payload.categories : undefined,
    });
    return;
  }

  // LN kimliği eksikse yanlışlıkla POST /guid/play yapmayalım (LN stabil GUID podcasts tablosunda yok).
  if (lnPod && !lnEp) return;

  await recordPlay(payload.podcastId, { progressSeconds, isCompleted });
}
