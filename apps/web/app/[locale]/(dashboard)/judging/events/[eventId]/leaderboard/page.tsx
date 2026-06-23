'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { Link } from '@/i18n/routing';
import { judgingApi } from '@/lib/api';
import { Trophy, ArrowLeft } from 'lucide-react';

type BilingualText = string | { en: string; ar: string };

interface LeaderboardEntry {
  rank: number;
  submissionId: string;
  submissionSlug?: string | null;
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

const RankBadge = ({ rank }: { rank: number }) => {
  const isTop = rank <= 3;
  return (
    <span
      className={`inline-flex h-7 min-w-7 items-center justify-center rounded-full px-2 text-[12px] font-bold ${mono}`}
      style={{
        background: rank === 1 ? ink : isTop ? accentSoft : bgPage,
        color: rank === 1 ? accent : isTop ? ink : muted,
        border: `1px solid ${rank === 1 ? ink : isTop ? 'oklch(0.85 0.17 130 / 0.4)' : line2}`,
      }}
    >
      {rank}
    </span>
  );
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
        : response.data?.data || [];
      setEntries(data);
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
          <p className="mb-4 text-sm" style={{ color: 'oklch(0.62 0.22 25)' }}>
            {error}
          </p>
          <button type="button" onClick={loadLeaderboard} className={btnPrimary}>
            {t('retry')}
          </button>
        </div>
      </div>
    );
  }

  const podiumCard = (entry: LeaderboardEntry, place: 1 | 2 | 3) => {
    const isFirst = place === 1;
    return (
      <div
        className="overflow-hidden rounded-[16px] border"
        style={{
          borderColor: isFirst ? ink : 'oklch(0.85 0.17 130 / 0.35)',
          background: isFirst ? ink : '#fff',
          boxShadow: isFirst ? '0 24px 48px -24px rgba(10,10,10,.35)' : 'none',
        }}
      >
        <div className="flex flex-col items-center px-4 pb-5 pt-6 text-center">
          <span
            className={`mb-3 text-[13px] font-bold ${mono}`}
            style={{ color: isFirst ? accent : accentDeep }}
          >
            #{place}
          </span>
          <p
            className="text-[15px] font-semibold leading-tight tracking-[-0.01em]"
            style={{ color: isFirst ? '#fff' : ink }}
          >
            {getText(entry.teamName, locale)}
          </p>
          <p
            className={`mt-3 text-[28px] font-semibold tracking-[-0.02em] ${mono}`}
            style={{ color: isFirst ? accent : ink }}
          >
            {entry.totalScore.toFixed(1)}
          </p>
          <p className="mt-1 line-clamp-2 text-[11.5px]" style={{ color: isFirst ? 'rgba(255,255,255,.6)' : muted }}>
            {getText(entry.title, locale)}
          </p>
          <p className={`mt-1.5 text-[11px] uppercase tracking-[0.06em] ${mono}`} style={{ color: isFirst ? 'rgba(255,255,255,.5)' : muted2 }}>
            {entry.judgeCount} {locale === 'ar' ? 'حكام' : 'judges'}
          </p>
        </div>
      </div>
    );
  };

  return (
    <div
      className="mx-auto max-w-[1100px] px-4 py-8 sm:px-8 [-webkit-font-smoothing:antialiased]"
      style={{ backgroundColor: bgPage, color: ink }}
    >
      {/* Header */}
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link href={`/judging/events/${eventId}`}>
            <span className={`mb-3 inline-flex items-center gap-2 text-[12px] ${mono}`} style={{ color: muted2 }}>
              <ArrowLeft className="h-3.5 w-3.5 rtl:rotate-180" /> {locale === 'ar' ? 'العودة' : 'Back'}
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-[11px]"
              style={{ background: ink }}
            >
              <Trophy className="h-5 w-5" style={{ color: accent }} strokeWidth={1.8} />
            </div>
            <h1 className="text-[30px] font-semibold leading-[1.05] tracking-[-0.03em]">
              {t('leaderboard')}{' '}
              <span className={`${serif} font-normal italic`} style={{ color: ink2 }}>
                {locale === 'ar' ? 'النتائج' : 'rankings.'}
              </span>
            </h1>
          </div>
          <p className="mt-2 max-w-[520px] text-[14px]" style={{ color: muted }}>
            {t('leaderboardDescription')}
          </p>
        </div>
      </div>

      {entries.length === 0 ? (
        <div className="overflow-hidden rounded-[18px] border bg-white" style={{ borderColor: line }}>
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div
              className="mb-4 flex h-12 w-12 items-center justify-center rounded-full border"
              style={{ borderColor: line2, background: bgPage }}
            >
              <Trophy className="h-5 w-5" style={{ color: muted2 }} strokeWidth={1.8} />
            </div>
            <p className="text-[13.5px]" style={{ color: muted }}>
              {t('noResults')}
            </p>
            <p className="mt-1.5 text-[12px]" style={{ color: muted2 }}>
              {locale === 'ar' ? 'ستظهر النتائج هنا بعد تقييم المشاريع' : 'Results will appear here after projects are scored'}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Top 3 Podium — flat brand cards, no gradient/yellow/teal */}
          {entries.length >= 3 && (
            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
              {podiumCard(entries[0], 1)}
              {podiumCard(entries[1], 2)}
              {podiumCard(entries[2], 3)}
            </div>
          )}

          {/* Full Rankings Table */}
          <div className="overflow-hidden rounded-[18px] border bg-white" style={{ borderColor: line }}>
            <div className="border-b px-6 py-4" style={{ borderColor: line }}>
              <h2 className="text-[15px] font-semibold tracking-[-0.01em]" style={{ color: ink }}>
                {t('fullRankings')}
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: `1px solid ${line}` }}>
                    <th className={`p-3 text-start text-[11px] font-semibold uppercase tracking-[0.06em] ${mono}`} style={{ color: muted2 }}>
                      {t('rank')}
                    </th>
                    <th className={`p-3 text-start text-[11px] font-semibold uppercase tracking-[0.06em] ${mono}`} style={{ color: muted2 }}>
                      {t('team')}
                    </th>
                    <th className={`p-3 text-start text-[11px] font-semibold uppercase tracking-[0.06em] ${mono}`} style={{ color: muted2 }}>
                      {t('project')}
                    </th>
                    <th className={`p-3 text-center text-[11px] font-semibold uppercase tracking-[0.06em] ${mono}`} style={{ color: muted2 }}>
                      {t('totalScore')}
                    </th>
                    <th className={`p-3 text-center text-[11px] font-semibold uppercase tracking-[0.06em] ${mono}`} style={{ color: muted2 }}>
                      {t('judges')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry) => {
                    const isTop = entry.rank <= 3;
                    return (
                      <tr
                        key={entry.submissionId}
                        className="transition-colors hover:bg-[rgba(10,10,10,.02)]"
                        style={{
                          borderBottom: `1px solid ${line}`,
                          background: isTop ? 'oklch(0.93 0.09 130 / 0.35)' : 'transparent',
                        }}
                      >
                        <td className="p-3">
                          <RankBadge rank={entry.rank} />
                        </td>
                        <td className="p-3 text-[14px] font-medium" style={{ color: ink }}>
                          {getText(entry.teamName, locale)}
                        </td>
                        <td className="p-3 text-[13px]" style={{ color: muted }}>
                          <Link
                            href={`/submissions/${entry.submissionSlug || entry.submissionId}`}
                            className="transition-colors hover:text-[#0A0A0A] hover:underline"
                          >
                            {getText(entry.title, locale)}
                          </Link>
                        </td>
                        <td className="p-3 text-center">
                          <span className={`text-[15px] font-bold ${mono}`} style={{ color: accentDeep }}>
                            {entry.totalScore.toFixed(1)}
                          </span>
                        </td>
                        <td className={`p-3 text-center text-[13px] ${mono}`} style={{ color: muted }}>
                          {entry.judgeCount}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
