import type { Router } from 'expo-router';

import { RedirectToExploreError } from '@/src/api/apiError';
import { getApiErrorMessage } from '@/src/api/errorMessage';
import { showExploreRedirectPrompt } from '@/src/utils/exploreRedirectPrompt';

export function handlePodcastGenerateError(error: unknown, router: Router): boolean {
  if (error instanceof RedirectToExploreError) {
    showExploreRedirectPrompt({
      message: error.message,
      onConfirm: () => router.replace('/(tabs)/explore'),
    });
    return true;
  }

  return false;
}

export function getPodcastGenerateErrorMessage(error: unknown, fallbackMessage: string): string {
  return getApiErrorMessage(error, fallbackMessage);
}
