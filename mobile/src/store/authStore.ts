type AuthUser = {
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
