'use client';

import { useEffect, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Link } from '@/i18n/routing';
import { judgingApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { FileText, Trophy, ChevronRight, CheckCircle } from 'lucide-react';

type BilingualText = string | { en: string; ar: string };

interface Assignment {
  id: string;
  eventId: string;
  criteria: Array<{
    name: { en: string; ar: string };
    weight: number;
    maxScore: number;
  }>;
  assignedAt: string;
  event: {
    id: string;
    name: BilingualText;
    state: string;
  };
  _count: {
    scores: number;
  };
}

function getText(value: BilingualText | undefined, locale: string): string {
  if (!value) return '';
  if (typeof value === 'string') return value;
  return value[locale as 'en' | 'ar'] || value.en || '';
}

const STATE_COLORS: Record<string, string> = {
  JUDGING: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
  RESULTS_PUBLISHED: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
  ARCHIVED: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
};

export default function JudgingPage() {
  const t = useTranslations('judging');
  const locale = useLocale();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAssignments();
  }, []);

  const loadAssignments = async () => {
    try {
      setIsLoading(true);
      const response = await judgingApi.getAssignments();
      const data = Array.isArray(response.data)
        ? response.data
        : (response.data?.data || []);
      setAssignments(data);
    } catch (err: any) {
      const msg = err.response?.data?.message;
      setError(
        typeof msg === 'object' ? (msg[locale] || msg.en || t('loadError')) : (msg || t('loadError'))
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 dark:border-gray-700 mx-auto"></div>
            <div className="absolute inset-0 animate-spin rounded-full h-16 w-16 border-4 border-t-primary border-r-transparent border-b-transparent border-l-transparent mx-auto"></div>
          </div>
          <p className="text-gray-600 dark:text-gray-400 font-medium">{t('loading')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto">
            <FileText className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <p className="text-red-600 dark:text-red-400">{error}</p>
          <Button onClick={loadAssignments}>{t('retry')}</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8 relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-purple-600 to-indigo-700 p-8 text-white shadow-xl">
        <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,transparent,black)] opacity-30" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <Trophy className="w-6 h-6" />
            <h1 className="text-3xl font-bold">{t('title')}</h1>
          </div>
          <p className="text-indigo-100 text-lg">{t('subtitle')}</p>
        </div>
      </div>

      {/* Assignments */}
      {assignments.length === 0 ? (
        <Card className="card-modern">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-full flex items-center justify-center mb-6">
              <Trophy className="w-10 h-10 text-gray-400" />
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-center text-lg mb-2">
              {t('noAssignments')}
            </p>
            <p className="text-gray-500 dark:text-gray-500 text-sm text-center max-w-md">
              {locale === 'ar'
                ? 'لم تتم إضافتك كمحكّم في أي فعاليات حتى الآن'
                : "You haven't been assigned to judge any events yet"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {assignments.map((assignment) => (
            <div key={assignment.id} className="card-modern overflow-hidden">
              <div className="p-6 flex items-center justify-between">
                {/* Left: event info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1 flex-wrap">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white truncate">
                      {getText(assignment.event.name, locale)}
                    </h2>
                    <span className={`px-2 py-0.5 text-xs font-semibold rounded-full shrink-0 ${STATE_COLORS[assignment.event.state] || STATE_COLORS.ARCHIVED}`}>
                      {assignment.event.state.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                    <span className="flex items-center gap-1">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      {assignment._count.scores} {t('scored')}
                    </span>
                    <span className="text-gray-400">
                      {assignment.criteria.length}{' '}
                      {locale === 'ar' ? 'معايير تحكيم' : 'criteria'}
                    </span>
                  </div>
                </div>

                {/* Right: actions */}
                <div className="flex items-center gap-2 ms-4 shrink-0">
                  <Link href={`/judging/events/${assignment.event.id}/leaderboard`}>
                    <Button variant="outline" size="sm" className="flex items-center gap-1">
                      <Trophy className="w-4 h-4" />
                      {t('viewLeaderboard')}
                    </Button>
                  </Link>
                  <Link href={`/judging/events/${assignment.event.id}`}>
                    <Button size="sm" className="flex items-center gap-1">
                      {t('yourAssignments')}
                      <ChevronRight className="w-4 h-4 rtl:rotate-180" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
