'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { Link } from '@/i18n/routing';
import { judgingApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, ArrowLeft } from 'lucide-react';

type BilingualText = string | { en: string; ar: string };

// Shape returned by GET /judging/events/:eventId/leaderboard
interface LeaderboardEntry {
  rank: number;
  submissionId: string;
  teamId: string;
  teamName: BilingualText;
  title: BilingualText;
  totalScore: number;
  judgeCount: number;
}

function getText(value: BilingualText | undefined, locale: string): string {
  if (!value) return '';
  if (typeof value === 'string') return value;
  return value[locale as 'en' | 'ar'] || value.en || '';
}

const getRankBadge = (rank: number) => {
  if (rank === 1) return '🥇';
  if (rank === 2) return '🥈';
  if (rank === 3) return '🥉';
  return `#${rank}`;
};

export default function LeaderboardPage() {
  const params = useParams();
  const t = useTranslations('judging');
  const locale = useLocale();
  const eventId = params.eventId as string;

  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadLeaderboard();
  }, [eventId]);

  const loadLeaderboard = async () => {
    try {
      setIsLoading(true);
      const response = await judgingApi.getLeaderboard(eventId);
      const data: LeaderboardEntry[] = Array.isArray(response.data)
        ? response.data
        : (response.data?.data || []);
      setEntries(data);
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
        <div className="text-center space-y-4">
          <p className="text-red-600 dark:text-red-400">{error}</p>
          <Button onClick={loadLeaderboard}>{t('retry')}</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex items-center gap-4">
        <Link href={`/judging/events/${eventId}`}>
          <Button variant="ghost" size="sm" className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
            {locale === 'ar' ? 'العودة' : 'Back'}
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Trophy className="w-8 h-8 text-yellow-500" />
            {t('leaderboard')}
          </h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">{t('leaderboardDescription')}</p>
        </div>
      </div>

      {entries.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Trophy className="w-12 h-12 text-gray-300 mb-4" />
            <p className="text-gray-600 dark:text-gray-400 text-center">
              {t('noResults')}
            </p>
            <p className="text-sm text-gray-400 mt-2 text-center">
              {locale === 'ar'
                ? 'ستظهر النتائج هنا بعد تقييم المشاريع'
                : 'Results will appear here after projects are scored'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Top 3 Podium */}
          {entries.length >= 3 && (
            <div className="grid grid-cols-3 gap-4 mb-8 items-end">
              {/* 2nd Place */}
              <Card className="border-gray-300 dark:border-gray-600">
                <CardHeader className="text-center pb-2">
                  <div className="text-4xl mb-2">🥈</div>
                  <CardTitle className="text-base leading-tight">
                    {getText(entries[1].teamName, locale)}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-center pt-0">
                  <p className="text-2xl font-bold text-gray-700 dark:text-gray-300">
                    {entries[1].totalScore.toFixed(1)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                    {getText(entries[1].title, locale)}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {entries[1].judgeCount} {locale === 'ar' ? 'حكام' : 'judges'}
                  </p>
                </CardContent>
              </Card>

              {/* 1st Place */}
              <Card className="border-yellow-300 dark:border-yellow-600 shadow-xl scale-105 z-10">
                <CardHeader className="text-center pb-2">
                  <div className="text-5xl mb-2">🥇</div>
                  <CardTitle className="text-lg leading-tight">
                    {getText(entries[0].teamName, locale)}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-center pt-0">
                  <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
                    {entries[0].totalScore.toFixed(1)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                    {getText(entries[0].title, locale)}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {entries[0].judgeCount} {locale === 'ar' ? 'حكام' : 'judges'}
                  </p>
                </CardContent>
              </Card>

              {/* 3rd Place */}
              <Card className="border-teal-300 dark:border-teal-600">
                <CardHeader className="text-center pb-2">
                  <div className="text-4xl mb-2">🥉</div>
                  <CardTitle className="text-base leading-tight">
                    {getText(entries[2].teamName, locale)}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-center pt-0">
                  <p className="text-2xl font-bold text-gray-700 dark:text-gray-300">
                    {entries[2].totalScore.toFixed(1)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                    {getText(entries[2].title, locale)}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {entries[2].judgeCount} {locale === 'ar' ? 'حكام' : 'judges'}
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Full Rankings Table */}
          <Card>
            <CardHeader>
              <CardTitle>{t('fullRankings')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700 text-sm text-gray-500">
                      <th className="text-start p-3 font-medium">{t('rank')}</th>
                      <th className="text-start p-3 font-medium">{t('team')}</th>
                      <th className="text-start p-3 font-medium">{t('project')}</th>
                      <th className="text-center p-3 font-medium">{t('totalScore')}</th>
                      <th className="text-center p-3 font-medium">{t('judges')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entries.map((entry) => (
                      <tr
                        key={entry.submissionId}
                        className={`border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${
                          entry.rank <= 3 ? 'bg-yellow-50/30 dark:bg-yellow-900/5' : ''
                        }`}
                      >
                        <td className="p-3">
                          <span className="text-xl font-bold">{getRankBadge(entry.rank)}</span>
                        </td>
                        <td className="p-3 font-medium text-gray-900 dark:text-white">
                          {getText(entry.teamName, locale)}
                        </td>
                        <td className="p-3 text-sm text-gray-600 dark:text-gray-400">
                          <Link
                            href={`/submissions/${entry.submissionId}`}
                            className="hover:text-primary dark:hover:text-green-300 hover:underline"
                          >
                            {getText(entry.title, locale)}
                          </Link>
                        </td>
                        <td className="p-3 text-center">
                          <span className="text-lg font-bold text-primary dark:text-green-300">
                            {entry.totalScore.toFixed(1)}
                          </span>
                        </td>
                        <td className="p-3 text-center text-sm text-gray-500">
                          {entry.judgeCount}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
