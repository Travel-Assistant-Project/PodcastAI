import { api } from '@/src/api/client';

export type Interest = {
  id: number;
  name: string;
  description?: string | null;
};

export async function getInterests() {
  const { data } = await api.get<Interest[]>('/api/interests');
  return data;
}
