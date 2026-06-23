'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { Link } from '@/i18n/routing';
import { judgingApi } from '@/lib/api';
import { CheckCircle, Circle, Trophy, FileText, ArrowLeft } from 'lucide-react';

type BilingualText = string | { en: string; ar: string };

interface JudgingSubmission {
  id: string;
  slug?: string | null;
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

// Brand tokens — flat, no gradients
const ink = '#0A0A0A';
const ink2 = '#2A2A2A';
const muted = '#6B6B6B';
const muted2 = '#9B9B9B';
const line = 'rgba(10,10,10,.08)';
const line2 = 'rgba(10,10,10,.14)';
const bgPage = '#FAFAF7';
const accent = 'oklch(0.85 0.17 130)';
const accentDeep = 'oklch(0.68 0.19 130)';
const accentSoft = 'oklch(0.93 0.09 130)';
const mono = 'font-[family-name:var(--font-mono),ui-monospace,monospace]';
const serif = 'font-[family-name:var(--font-display),ui-serif,Georgia,serif]';

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

      const assignmentsRes = await judgingApi.getAssignments();
      const allAssignments: any[] = Array.isArray(assignmentsRes.data)
        ? assignmentsRes.data
        : assignmentsRes.data?.data || [];

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

      const submissionsRes = await judgingApi.getSubmissionsForJudge(myAssignment.id);
      const subs: JudgingSubmission[] = Array.isArray(submissionsRes.data)
        ? submissionsRes.data
        : submissionsRes.data?.data || [];
      setSubmissions(subs);
    } catch (err: any) {
      const msg = err.response?.data?.message;
      setError(
        typeof msg === 'object' ? msg[locale] || msg.en || t('loadError') : msg || t('loadError')
      );
    } finally {
      setIsLoading(false);
    }
  };

  const btnPrimary =
    'inline-flex items-center gap-2 rounded-[10px] border border-transparent bg-[#0A0A0A] px-4 py-2.5 text-[13.5px] font-medium text-[#FAFAF7] transition-all hover:-translate-y-px hover:bg-black';
  const btnOutline =
    'inline-flex items-center gap-2 rounded-[10px] border bg-white px-4 py-2.5 text-[13.5px] font-medium text-[#0A0A0A] transition-colors hover:bg-[rgba(10,10,10,.04)]';
  const btnSmPrimary =
    'inline-flex items-center gap-1.5 rounded-[9px] border border-transparent bg-[#0A0A0A] px-3 py-1.5 text-[12.5px] font-medium text-[#FAFAF7] transition-all hover:bg-black';
  const btnSmOutline =
    'inline-flex items-center gap-1.5 rounded-[9px] border bg-white px-3 py-1.5 text-[12.5px] font-medium text-[#0A0A0A] transition-colors hover:bg-[rgba(10,10,10,.04)]';

  if (isLoading) {
    return (
      <div
        className="flex min-h-[420px] items-center justify-center [-webkit-font-smoothing:antialiased]"
        style={{ backgroundColor: bgPage, color: ink }}
      >
        <div className="text-center">
          <div
            className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2"
            style={{ borderColor: line2, borderTopColor: ink }}
          />
          <p className="text-[13px]" style={{ color: muted }}>
            {t('loading')}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="mx-auto max-w-[1000px] px-4 py-8 sm:px-8 [-webkit-font-smoothing:antialiased]"
        style={{ backgroundColor: bgPage, color: ink }}
      >
        <Link href="/judging">
          <span className={`mb-6 inline-flex items-center gap-2 text-[12.5px] ${mono}`} style={{ color: muted }}>
            <ArrowLeft className="h-3.5 w-3.5 rtl:rotate-180" /> {locale === 'ar' ? 'العودة' : 'Back'}
          </span>
        </Link>
        <div className="overflow-hidden rounded-[18px] border bg-white" style={{ borderColor: line }}>
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="mb-4 text-sm" style={{ color: 'oklch(0.62 0.22 25)' }}>
              {error}
            </p>
            <button type="button" onClick={loadData} className={btnPrimary}>
              {t('retry')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const scoredCount = submissions.filter((s) => s.scores.length > 0).length;
  const pct = submissions.length > 0 ? Math.round((scoredCount / submissions.length) * 100) : 0;

  return (
    <div
      className="mx-auto max-w-[1000px] px-4 py-8 sm:px-8 [-webkit-font-smoothing:antialiased]"
      style={{ backgroundColor: bgPage, color: ink }}
    >
      {/* Header */}
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link href="/judging">
            <span className={`mb-3 inline-flex items-center gap-2 text-[12px] ${mono}`} style={{ color: muted2 }}>
              <ArrowLeft className="h-3.5 w-3.5 rtl:rotate-180" /> {locale === 'ar' ? 'العودة للوحة التحكيم' : 'JUDGING'}
            </span>
          </Link>
          <h1 className="text-[28px] font-semibold leading-[1.05] tracking-[-0.03em]">
            {t('yourAssignments')}{' '}
            <span className={`${serif} font-normal italic`} style={{ color: ink2 }}>
              {locale === 'ar' ? 'قائمة' : 'queue.'}
            </span>
          </h1>
          <p className="mt-1.5 text-[13.5px]" style={{ color: muted }}>
            {t('progress')}: {scoredCount} / {submissions.length} {t('scored')}
          </p>
        </div>
        <Link href={`/judging/events/${eventId}/leaderboard`}>
          <span className={btnOutline}>
            <Trophy className="h-4 w-4" style={{ color: accentDeep }} strokeWidth={2} />
            {t('viewLeaderboard')}
          </span>
        </Link>
      </div>

      {/* Progress bar — flat brand fill, no gradient */}
      {submissions.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between text-[11px]" style={{ color: muted2 }}>
            <span className={`${mono} uppercase tracking-[0.06em]`}>
              {locale === 'ar' ? 'التقدّم' : 'Progress'}
            </span>
            <span className={`${mono} font-semibold`} style={{ color: ink }}>
              {pct}%
            </span>
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full" style={{ background: line }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${pct}%`, background: accentDeep }}
            />
          </div>
        </div>
      )}

      {submissions.length === 0 ? (
        <div className="overflow-hidden rounded-[18px] border bg-white" style={{ borderColor: line }}>
          <div className="flex flex-col items-center justify-center py-14 text-center">
            <div
              className="mb-4 flex h-12 w-12 items-center justify-center rounded-full border"
              style={{ borderColor: line2, background: bgPage }}
            >
              <FileText className="h-5 w-5" style={{ color: muted2 }} strokeWidth={1.8} />
            </div>
            <p className="text-[13.5px]" style={{ color: muted }}>
              {locale === 'ar'
                ? 'لا توجد مشاريع مقدمة لتقييمها في هذه الفعالية'
                : 'No submitted projects to judge for this event yet'}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {submissions.map((submission) => {
            const hasScore = submission.scores.length > 0;
            const existingScore = submission.scores[0];
            return (
              <div
                key={submission.id}
                className="rounded-[14px] border bg-white p-5"
                style={{
                  borderColor: hasScore ? 'oklch(0.68 0.19 130 / 0.35)' : line,
                  boxShadow: hasScore ? '0 0 0 1px oklch(0.85 0.17 130 / 0.25)' : 'none',
                }}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    {hasScore ? (
                      <CheckCircle className="h-5 w-5 shrink-0" style={{ color: accentDeep }} strokeWidth={2} />
                    ) : (
                      <Circle className="h-5 w-5 shrink-0" style={{ color: muted2 }} strokeWidth={1.8} />
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-[15px] font-semibold tracking-[-0.01em]" style={{ color: ink }}>
                        {getText(submission.title, locale)}
                      </p>
                      <p className="text-[12.5px]" style={{ color: muted }}>
                        {getText(submission.team.name, locale)}
                      </p>
                      {hasScore && existingScore && (
                        <p className="mt-0.5 text-[11.5px]" style={{ color: accentDeep }}>
                          {locale === 'ar' ? 'المجموع:' : 'Score:'}{' '}
                          <strong className={mono}>{existingScore.totalScore.toFixed(1)}</strong>
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <Link href={`/submissions/${submission.slug || submission.id}`}>
                      <span className={btnSmOutline}>{t('viewSubmission')}</span>
                    </Link>
                    {assignmentId && (
                      <Link
                        href={`/judging/assignments/${assignmentId}/score?submissionId=${submission.id}`}
                      >
                        <span className={btnSmPrimary}>
                          {hasScore ? t('editScore') : t('scoreNow')}
                        </span>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
