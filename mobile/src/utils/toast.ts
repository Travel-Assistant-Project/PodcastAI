type ShowToastFn = (message: string) => void;

let showToastImpl: ShowToastFn | null = null;

export function registerShowToast(fn: ShowToastFn | null) {
  showToastImpl = fn;
}

export function showToast(message: string) {
  const text = message.trim();
  if (!text) return;
  showToastImpl?.(text);
}
