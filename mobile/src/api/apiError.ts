export type ApiAction = 'REDIRECT_TO_EXPLORE';

type ErrorResponseShape = {
  success?: boolean;
  Success?: boolean;
  message?: string;
  Message?: string;
  action?: ApiAction | string;
  Action?: ApiAction | string;
};

export type ErrorResponseDto = {
  success: false;
  message: string;
  action?: ApiAction | string;
};

export class RedirectToExploreError extends Error {
  readonly action = 'REDIRECT_TO_EXPLORE' as const;

  constructor(message: string) {
    super(message);
    this.name = 'RedirectToExploreError';
  }
}

function normalizeErrorResponseDto(data: ErrorResponseShape): ErrorResponseDto | null {
  const success = data.success ?? data.Success;
  if (success !== false) return null;

  const message = (data.message ?? data.Message ?? '').trim();
  const action = data.action ?? data.Action;

  return {
    success: false,
    message,
    action,
  };
}

export function isErrorResponseDto(data: unknown): data is ErrorResponseDto {
  if (typeof data !== 'object' || data === null) return false;
  return normalizeErrorResponseDto(data as ErrorResponseShape) !== null;
}

export function assertSuccessfulGenerateResponse<T extends { podcastId?: string }>(
  data: T | ErrorResponseShape,
): T {
  const error = normalizeErrorResponseDto(data as ErrorResponseShape);
  if (error) {
    if (error.action === 'REDIRECT_TO_EXPLORE') {
      throw new RedirectToExploreError(
        error.message ||
          'We cannot perform this action right now. Please check out the content on the Explore page.',
      );
    }

    throw new Error(error.message || 'Could not start podcast generation.');
  }

  return data as T;
}
