import { api } from '@/src/api/client';

export type UserProfile = {
  id: string;
  fullName: string;
  email: string;
  age?: number | null;
  occupation?: string | null;
  photoUrl?: string | null;
  createdAt: string;
};

export async function getProfile(): Promise<UserProfile> {
  const { data } = await api.get<UserProfile>('/api/user/profile');
  return data;
}

export async function updateProfile(payload: {
  fullName: string;
  email: string;
  age?: number | null;
  occupation?: string | null;
}): Promise<void> {
  await api.put('/api/user/profile', {
    fullName: payload.fullName,
    email: payload.email,
    age: payload.age ?? null,
    occupation: payload.occupation ?? null,
  });
}

export async function changePassword(payload: {
  currentPassword: string;
  newPassword: string;
}): Promise<void> {
  await api.put('/api/user/password', {
    currentPassword: payload.currentPassword,
    newPassword: payload.newPassword,
  });
}

export async function uploadProfilePhoto(localUri: string): Promise<string> {
  const filename = localUri.split('/').pop() ?? 'photo.jpg';
  const ext = filename.split('.').pop()?.toLowerCase() ?? 'jpg';
  let mimeType = 'image/jpeg';
  if (ext === 'png') mimeType = 'image/png';
  else if (ext === 'webp') mimeType = 'image/webp';

  const formData = new FormData();
  formData.append('photo', {
    uri: localUri,
    name: filename,
    type: mimeType,
  } as unknown as Blob);

  const { data } = await api.post<{ photoUrl: string }>('/api/user/profile-photo', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data.photoUrl;
}
