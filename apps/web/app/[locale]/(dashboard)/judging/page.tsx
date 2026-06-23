'use client';

import { useEffect, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Link } from '@/i18n/routing';
import { judgingApi } from '@/lib/api';
import { Trophy, ChevronRight, CheckCircle, FileText, ListChecks } from 'lucide-react';

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

// Brand tokens (match the platform's bespoke pages — flat, no gradients)
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
const neutral = '#EFEFEA';
const mono = 'font-[family-name:var(--font-mono),ui-monospace,monospace]';
const serif = 'font-[family-name:var(--font-display),ui-serif,Georgia,serif]';

function statePill(state: string): { bg: string; fg: string; label: string } {
  switch (state) {
    case 'JUDGING':
      return { bg: accentSoft, fg: ink2, label: state.replace(/_/g, ' ') };
    case 'RESULTS_PUBLISHED':
      return { bg: accent, fg: ink, label: state.replace(/_/g, ' ') };
    default:
      return { bg: neutral, fg: muted, label: state.replace(/_/g, ' ') };
  }
}

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
      const data: Assignment[] = Array.isArray(response.data)
        ? response.data
        : response.data?.data || [];
      setAssignments(data);
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
    'inline-flex items-center gap-2 rounded-[10px] border border-transparent bg-[#0A0A0A] px-4 py-2.5 text-[13.5px] font-medium text-[#FAFAF7] transition-all hover:-translate-y-px hover:bg-black disabled:opacity-60';
  const btnOutline =
    'inline-flex items-center gap-2 rounded-[10px] border bg-white px-4 py-2.5 text-[13.5px] font-medium text-[#0A0A0A] transition-colors hover:bg-[rgba(10,10,10,.04)]';

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
        className="flex min-h-[420px] items-center justify-center [-webkit-font-smoothing:antialiased]"
        style={{ backgroundColor: bgPage, color: ink }}
      >
        <div className="text-center">
          <div
            className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full"
            style={{ background: neutral }}
          >
            <FileText className="h-5 w-5" style={{ color: muted }} strokeWidth={1.8} />
          </div>
          <p className="mb-4 text-sm" style={{ color: 'oklch(0.62 0.22 25)' }}>
            {error}
          </p>
          <button type="button" onClick={loadAssignments} className={btnPrimary}>
            {t('retry')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="w-full space-y-0 pb-16 pt-1 [-webkit-font-smoothing:antialiased]"
      style={{ backgroundColor: bgPage, color: ink }}
    >
      {/* Header — flat brand card, no gradient */}
      <div
        className="mb-8 overflow-hidden rounded-[18px] border bg-white"
        style={{ borderColor: line }}
      >
        <div className="flex flex-col gap-5 p-7 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <div
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[12px] border"
              style={{ background: ink, borderColor: ink }}
            >
              <Trophy className="h-5 w-5" style={{ color: accent }} strokeWidth={1.8} />
            </div>
            <div>
              <div
                className={`mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.08em] ${mono}`}
                style={{ color: muted2 }}
              >
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ background: accentDeep, boxShadow: '0 0 0 3px oklch(0.68 0.19 130 / 0.15)' }}
                />
                {locale === 'ar' ? 'التحكيم' : 'JUDGING'}
              </div>
              <h1 className="text-[30px] font-semibold leading-[1.05] tracking-[-0.03em]">
                {t('title')}{' '}
                <span className={`${serif} font-normal italic`} style={{ color: ink2 }}>
                  {locale === 'ar' ? 'اللوحة' : 'desk.'}
                </span>
              </h1>
              <p className="mt-1.5 max-w-[520px] text-[14.5px] leading-snug" style={{ color: muted }}>
                {t('subtitle')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Assignments */}
      {assignments.length === 0 ? (
        <div className="overflow-hidden rounded-[18px] border bg-white" style={{ borderColor: line }}>
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div
              className="mb-5 flex h-16 w-16 items-center justify-center rounded-full border"
              style={{ borderColor: line2, background: bgPage }}
            >
              <Trophy className="h-7 w-7" style={{ color: muted2 }} strokeWidth={1.6} />
            </div>
            <p className="text-[15px] font-medium" style={{ color: ink2 }}>
              {t('noAssignments')}
            </p>
            <p className="mt-1 max-w-[420px] text-[13px]" style={{ color: muted }}>
              {locale === 'ar'
                ? 'لم تتم إضافتك كمحكّم في أي فعاليات حتى الآن'
                : "You haven't been assigned to judge any events yet"}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {assignments.map((assignment) => {
            const pill = statePill(assignment.event.state);
            return (
              <div
                key={assignment.id}
                className="overflow-hidden rounded-[14px] border bg-white transition-colors hover:bg-[rgba(10,10,10,.015)]"
                style={{ borderColor: line }}
              >
                <div className="flex items-center justify-between gap-4 p-5">
                  <div className="min-w-0 flex-1">
                    <div className="mb-1.5 flex flex-wrap items-center gap-2.5">
                      <h2 className="truncate text-[17px] font-semibold tracking-[-0.015em]" style={{ color: ink }}>
                        {getText(assignment.event.name, locale)}
                      </h2>
                      <span
                        className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10.5px] font-semibold uppercase tracking-[0.04em] ${mono}`}
                        style={{ background: pill.bg, color: pill.fg }}
                      >
                        {pill.label}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-[12.5px]" style={{ color: muted }}>
                      <span className="inline-flex items-center gap-1.5">
                        <CheckCircle className="h-3.5 w-3.5" style={{ color: accentDeep }} strokeWidth={2} />
                        {assignment._count.scores} {t('scored')}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <ListChecks className="h-3.5 w-3.5" style={{ color: muted2 }} strokeWidth={2} />
                        {assignment.criteria.length} {locale === 'ar' ? 'معايير تحكيم' : 'criteria'}
                      </span>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <Link href={`/judging/events/${assignment.event.id}/leaderboard`}>
                      <span className={btnOutline}>
                        <Trophy className="h-3.5 w-3.5" strokeWidth={2} />
                        {t('viewLeaderboard')}
                      </span>
                    </Link>
                    <Link href={`/judging/events/${assignment.event.id}`}>
                      <span className={btnPrimary}>
                        {t('yourAssignments')}
                        <ChevronRight className="h-4 w-4 rtl:rotate-180" strokeWidth={2} />
                      </span>
                    </Link>
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
