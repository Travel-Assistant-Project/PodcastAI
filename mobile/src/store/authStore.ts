// Basit in-memory auth store. Persistence şu an yok; uygulamayı tekrar açınca login gerekir.
// PreferredMode = null ise mobile uygulamayı onboarding'e yönlendirir.

export type AuthUser = {
  id: string;
  fullName: string;
  email: string;
  token: string;
  preferredMode?: 'listen' | 'learn' | null;
  cefrLevel?: string | null;
};

let _user: AuthUser | null = null;

export function setUser(user: AuthUser | null) {
  _user = user;
}

export function getUser(): AuthUser | null {
  return _user;
}

// Onboarding sonrası mod ve seviyeyi günceller (oturum içi).
export function updateLearningPrefs(prefs: {
  preferredMode?: 'listen' | 'learn' | null;
  cefrLevel?: string | null;
}) {
  if (_user == null) return;
  _user = {
    ..._user,
    ...(prefs.preferredMode !== undefined ? { preferredMode: prefs.preferredMode } : {}),
    ...(prefs.cefrLevel !== undefined ? { cefrLevel: prefs.cefrLevel } : {}),
  };
}
