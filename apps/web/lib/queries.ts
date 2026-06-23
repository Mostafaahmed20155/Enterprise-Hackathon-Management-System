import { useQuery } from '@tanstack/react-query';
import { authApi } from '@/lib/api';

export const queryKeys = {
  currentUser: ['auth', 'me'] as const,
  events: ['events'] as const,
  myTeams: ['my-teams'] as const,
  submissions: (limit?: number) => ['submissions', { limit: limit ?? 20 }] as const,
  teamInvites: ['team-invites'] as const,
};

export interface CurrentUser {
  id?: string;
  name?: string;
  email?: string;
  userRoles?: {
    role?: {
      name?: string;
    };
  }[];
}

export function useCurrentUser() {
  return useQuery({
    queryKey: queryKeys.currentUser,
    queryFn: async (): Promise<CurrentUser | null> => {
      try {
        const res = await authApi.getCurrentUser();
        return (res.data ?? null) as CurrentUser | null;
      } catch {
        return null;
      }
    },
    staleTime: 60 * 1000,
  });
}
