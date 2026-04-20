'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { eventsApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface Team {
  id: string;
  name: string;
  description: string;
  members: Array<{
    id: string;
    user: {
      id: string;
      name: string;
    };
    role: string;
  }>;
  isLocked: boolean;
}

export default function EventTeamsPage() {
  const params = useParams();
  const t = useTranslations('teams');
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const eventId = params.id as string;

  useEffect(() => {
    loadTeams();
  }, [eventId]);

  const loadTeams = async () => {
    try {
      setIsLoading(true);
      const response = await eventsApi.getTeams(eventId);
      const data = response.data?.data || response.data;
      setTeams(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.response?.data?.message || t('loadError'));
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">{t('loading')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400">{error}</p>
          <Button onClick={loadTeams} className="mt-4">
            {t('retry')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('eventTeams')}</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">{t('eventTeamsDescription')}</p>
        </div>
        <Link href={`/events/${eventId}/teams/create`}>
          <Button>{t('createTeam')}</Button>
        </Link>
      </div>

      {teams.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-gray-600 dark:text-gray-400 text-center mb-4">{t('noTeamsInEvent')}</p>
            <Link href={`/events/${eventId}/teams/create`}>
              <Button>{t('createFirstTeam')}</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teams.map((team) => (
            <Card key={team.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between mb-2">
                  <CardTitle className="text-xl">{team.name}</CardTitle>
                  {team.isLocked && (
                    <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-full">
                      🔒 {t('locked')}
                    </span>
                  )}
                </div>
                <CardDescription className="line-clamp-2">{team.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('members')} ({team.members.length})
                  </p>
                  <div className="space-y-1">
                    {team.members.slice(0, 3).map((member) => (
                      <div key={member.id} className="flex items-center text-sm">
                        <span className="me-2">👤</span>
                        <span>{member.user.name}</span>
                        {member.role === 'LEADER' && (
                          <span className="ms-2 text-xs bg-orange-100 dark:bg-orange-950/30 text-orange-900 dark:text-orange-300 px-2 py-0.5 rounded">
                            {t('leader')}
                          </span>
                        )}
                      </div>
                    ))}
                    {team.members.length > 3 && (
                      <p className="text-sm text-gray-500">+{team.members.length - 3} {t('more')}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
