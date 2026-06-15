type ExploreRedirectPromptOptions = {
  message: string;
  onConfirm: () => void;
};

export type { ExploreRedirectPromptOptions };

type ShowExploreRedirectPromptFn = (options: ExploreRedirectPromptOptions) => void;

let showPromptImpl: ShowExploreRedirectPromptFn | null = null;

export function registerExploreRedirectPrompt(fn: ShowExploreRedirectPromptFn | null) {
  showPromptImpl = fn;
}

export function showExploreRedirectPrompt(options: ExploreRedirectPromptOptions) {
  showPromptImpl?.(options);
}
