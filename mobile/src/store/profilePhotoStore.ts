import { useSyncExternalStore } from 'react';

type ProfilePhotoState = {
  url: string | null;
  version: number;
};

let state: ProfilePhotoState = { url: null, version: 0 };
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

function stripCacheParam(url: string): string {
  const idx = url.indexOf('?');
  return idx >= 0 ? url.slice(0, idx) : url;
}

export function setProfilePhotoUrl(url: string | null | undefined) {
  const nextUrl = url?.trim() ? stripCacheParam(url.trim()) : null;
  state = {
    url: nextUrl,
    version: Date.now(),
  };
  emit();
}

/** API'den gelen URL'i store'a yazar; yalnızca URL değiştiyse günceller. */
export function hydrateProfilePhotoUrl(url: string | null | undefined) {
  const nextUrl = url?.trim() ? stripCacheParam(url.trim()) : null;
  if (nextUrl === state.url) return;
  state = {
    url: nextUrl,
    version: state.version || Date.now(),
  };
  emit();
}

export function getProfilePhotoDisplayUrl(url?: string | null): string | null {
  const raw = url?.trim() ? stripCacheParam(url.trim()) : state.url;
  if (!raw) return null;
  const version = state.version || Date.now();
  return `${raw}?v=${version}`;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return getProfilePhotoDisplayUrl();
}

export function useProfilePhotoDisplayUrl(fallbackUrl?: string | null): string | null {
  const displayUrl = useSyncExternalStore(subscribe, getSnapshot, () => null);
  if (displayUrl) return displayUrl;
  return getProfilePhotoDisplayUrl(fallbackUrl);
}

export function clearProfilePhotoUrl() {
  state = { url: null, version: 0 };
  emit();
}
