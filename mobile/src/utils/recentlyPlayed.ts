import type { RecentlyPlayed } from '@/src/api/podcasts.api';

export function formatRecentlyPlayedProgress(
  progressSeconds: number,
  durationSeconds?: number | null,
  isCompleted?: boolean,
): string {
  if (isCompleted) return 'Completed';
  const p = Math.max(0, progressSeconds);
  if (!durationSeconds || durationSeconds <= 0) {
    return p > 0 ? 'In progress' : 'Not started';
  }
  if (p <= 0) return 'Not started';
  const remaining = Math.max(0, durationSeconds - p);
  if (remaining <= 12) return 'Almost done';
  if (remaining < 60) return `${Math.round(remaining)}s left`;
  const mm = Math.floor(remaining / 60);
  const ss = Math.round(remaining % 60);
  return `${mm}:${ss.toString().padStart(2, '0')} left`;
}

export function recentlyPlayedProgressRatio(item: RecentlyPlayed): number {
  if (item.isCompleted) return 1;
  const p = Math.max(0, item.progressSeconds);
  const d = item.durationSeconds ?? 0;
  if (d <= 0) return p > 0 ? 0.04 : 0;
  if (p >= d - 3) return 1;
  return Math.min(1, Math.max(0, p / d));
}
