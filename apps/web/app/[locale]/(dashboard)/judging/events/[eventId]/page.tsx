'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { Link } from '@/i18n/routing';
import { judgingApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Circle, Trophy, FileText } from 'lucide-react';

type BilingualText = string | { en: string; ar: string };

interface JudgingSubmission {
  id: string;
  title: BilingualText;
  description: BilingualText;
  team: { id: string; name: BilingualText };
  scores: Array<{ id: string; totalScore: number; createdAt: string }>;
  _count: { files: number };
}

function getText(value: BilingualText | undefined, locale: string): string {
  if (!value) return '';
  if (typeof value === 'string') return value;
  return value[locale as 'en' | 'ar'] || value.en || '';
}

export default function JudgingEventPage() {
  const params = useParams();
  const t = useTranslations('judging');
  const locale = useLocale();
  const eventId = params.eventId as string;

  const [assignmentId, setAssignmentId] = useState<string | null>(null);
  const [submissions, setSubmissions] = useState<JudgingSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [eventId]);

  const loadData = async () => {
    try {
      setIsLoading(true);

      // Step 1: find the assignment for this event
      const assignmentsRes = await judgingApi.getAssignments();
      const allAssignments: any[] = Array.isArray(assignmentsRes.data)
        ? assignmentsRes.data
        : (assignmentsRes.data?.data || []);

      const myAssignment = allAssignments.find((a: any) => a.eventId === eventId);
      if (!myAssignment) {
        setError(
          locale === 'ar'
            ? 'لم يتم تعيينك كمحكّم لهذه الفعالية'
            : 'You are not assigned to judge this event'
        );
        return;
      }

      setAssignmentId(myAssignment.id);

      // Step 2: get submissions for that assignment
      const submissionsRes = await judgingApi.getSubmissionsForJudge(myAssignment.id);
      const subs: JudgingSubmission[] = Array.isArray(submissionsRes.data)
        ? submissionsRes.data
        : (submissionsRes.data?.data || []);
      setSubmissions(subs);
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
          <Button onClick={loadData}>{t('retry')}</Button>
        </div>
      </div>
    );
  }

  const scoredCount = submissions.filter((s) => s.scores.length > 0).length;

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {t('yourAssignments')}
          </h1>
          <p className="mt-1 text-gray-500 dark:text-gray-400">
            {t('progress')}: {scoredCount} / {submissions.length} {t('scored')}
          </p>
        </div>
        <Link href={`/judging/events/${eventId}/leaderboard`}>
          <Button variant="outline" className="flex items-center gap-2">
            <Trophy className="w-4 h-4" />
            {t('viewLeaderboard')}
          </Button>
        </Link>
      </div>

      {/* Progress bar */}
      {submissions.length > 0 && (
        <div className="mb-6">
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-primary to-orange-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${submissions.length > 0 ? (scoredCount / submissions.length) * 100 : 0}%` }}
            />
          </div>
        </div>
      )}

      {submissions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="w-10 h-10 text-gray-400 mb-3" />
            <p className="text-gray-600 dark:text-gray-400 text-center">
              {locale === 'ar'
                ? 'لا توجد مشاريع مقدمة لتقييمها في هذه الفعالية'
                : 'No submitted projects to judge for this event yet'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {submissions.map((submission) => {
            const hasScore = submission.scores.length > 0;
            const existingScore = submission.scores[0];
            return (
              <div
                key={submission.id}
                className={`card-modern p-5 flex items-center justify-between gap-4 ${
                  hasScore ? 'border-green-200 dark:border-green-800/50' : ''
                }`}
              >
                {/* Left */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {hasScore ? (
                    <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 shrink-0" />
                  ) : (
                    <Circle className="w-5 h-5 text-gray-400 shrink-0" />
                  )}
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 dark:text-white truncate">
                      {getText(submission.title, locale)}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {getText(submission.team.name, locale)}
                    </p>
                    {hasScore && existingScore && (
                      <p className="text-xs text-green-600 dark:text-green-400 mt-0.5">
                        {locale === 'ar' ? 'المجموع:' : 'Score:'}{' '}
                        <strong>{existingScore.totalScore.toFixed(1)}</strong>
                      </p>
                    )}
                  </div>
                </div>

                {/* Right */}
                <div className="flex items-center gap-2 shrink-0">
                  <Link href={`/submissions/${submission.id}`}>
                    <Button variant="outline" size="sm">
                      {t('viewSubmission')}
                    </Button>
                  </Link>
                  {assignmentId && (
                    <Link
                      href={`/judging/assignments/${assignmentId}/score?submissionId=${submission.id}`}
                    >
                      <Button size="sm" variant={hasScore ? 'outline' : 'default'}>
                        {hasScore ? t('editScore') : t('scoreNow')}
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
