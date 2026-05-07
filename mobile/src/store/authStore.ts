// Basit in-memory auth store. Persistence şu an yok; uygulamayı tekrar açınca login gerekir.

export type AuthUser = {
  id: string;
  fullName: string;
  email: string;
  token: string;
};

let _user: AuthUser | null = null;

export function setUser(user: AuthUser | null) {
  _user = user;
}

export function getUser(): AuthUser | null {
  return _user;
}
