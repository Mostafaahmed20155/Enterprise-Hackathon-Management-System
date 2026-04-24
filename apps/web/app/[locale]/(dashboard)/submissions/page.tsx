'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Link, useRouter } from '@/i18n/routing';
import { submissionsApi } from '@/lib/api';
import {
  AlertCircle,
  ChevronRight,
  FileText,
  LayoutGrid,
  List,
  Search,
} from 'lucide-react';
import { toast } from 'sonner';

type BilingualText = string | { en: string; ar: string };

interface Submission {
  id: string;
  title: BilingualText;
  description: BilingualText;
  status: string;
  averageScore: number | null;
  _count?: { files: number; scores: number };
  team: {
    id: string;
    name: BilingualText;
  };
  createdAt: string;
  updatedAt: string;
}

function getText(value: BilingualText | undefined, locale: string): string {
  if (!value) return '';
  if (typeof value === 'string') return value;
  return value[locale as 'en' | 'ar'] || value.en || '';
}

/** Stable hue for team “dot” from id */
function teamHue(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 360;
  return h;
}

type ViewMode = 'grid' | 'list';
type ChipFilter = 'all' | 'draft' | 'final' | 'review';

function matchesChip(sub: Submission, chip: ChipFilter): boolean {
  if (chip === 'all') return true;
  if (chip === 'draft') return sub.status === 'DRAFT';
  if (chip === 'final') return sub.status === 'SUBMITTED' || sub.status === 'WINNER';
  if (chip === 'review') return sub.status === 'UNDER_REVIEW';
  return true;
}

function statusBadgeKey(
  status: string
): 'draft' | 'final' | 'review' | 'disqualified' | 'winner' {
  if (status === 'DRAFT') return 'draft';
  if (status === 'SUBMITTED') return 'final';
  if (status === 'UNDER_REVIEW') return 'review';
  if (status === 'DISQUALIFIED') return 'disqualified';
  if (status === 'WINNER') return 'winner';
  return 'draft';
}

export default function SubmissionsPage() {
  const t = useTranslations('submissions');
  const locale = useLocale();
  const router = useRouter();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [chip, setChip] = useState<ChipFilter>('all');

  const loadSubmissions = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await submissionsApi.list();
      const data = response.data?.data || response.data;
      setSubmissions(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      setError(msg || t('loadError'));
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadSubmissions();
  }, [loadSubmissions]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const formatDateShort = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US', {
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const counts = useMemo(() => {
    const draft = submissions.filter((s) => s.status === 'DRAFT').length;
    const final = submissions.filter((s) => s.status === 'SUBMITTED' || s.status === 'WINNER')
      .length;
    const review = submissions.filter((s) => s.status === 'UNDER_REVIEW').length;
    return { all: submissions.length, draft, final, review };
  }, [submissions]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return submissions.filter((sub) => {
      if (!matchesChip(sub, chip)) return false;
      if (!q) return true;
      const title = getText(sub.title, locale).toLowerCase();
      const team = getText(sub.team.name, locale).toLowerCase();
      const desc = getText(sub.description, locale).toLowerCase();
      return title.includes(q) || team.includes(q) || desc.includes(q);
    });
  }, [submissions, search, locale, chip]);

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
  const danger = 'oklch(0.62 0.22 25)';

  const badgeClass = (status: string) => {
    const k = statusBadgeKey(status);
    if (k === 'draft')
      return 'bg-[#F5F5F0] text-[#6B6B6B] border border-transparent';
    if (k === 'final')
      return 'bg-[#0A0A0A] text-[oklch(0.85_0.17_130)] border border-transparent';
    if (k === 'review')
      return 'bg-[oklch(0.93_0.09_130)] text-[#0A0A0A] border border-[oklch(0.85_0.17_130/0.3)]';
    if (k === 'disqualified')
      return 'bg-[oklch(0.95_0.05_25)] text-[oklch(0.62_0.22_25)] border border-[oklch(0.88_0.06_25)]';
    if (k === 'winner')
      return 'bg-[oklch(0.93_0.09_130)] text-[#0A0A0A] border border-[oklch(0.85_0.17_130/0.3)]';
    return '';
  };

  const badgeLabel = (status: string) => t(`statusBadge.${statusBadgeKey(status)}`);

  const chipBtn = (active: boolean) =>
    `inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors ${
      active
        ? 'border-[#0A0A0A] bg-[#0A0A0A] text-white'
        : 'border-[rgba(10,10,10,.08)] bg-white text-[#2A2A2A] hover:border-[rgba(10,10,10,.2)]'
    }`;

  const mono = "font-[family-name:var(--font-mono-display),ui-monospace,monospace]";
  const displaySerif = "font-[family-name:var(--font-display),ui-serif,Georgia,serif]";

  if (isLoading) {
    return (
      <div
        className="min-h-[420px] px-1 py-2"
        style={{ color: ink, backgroundColor: bgPage }}
      >
        <div
          className="rounded-2xl border bg-white p-5 shadow-none"
          style={{ borderColor: line }}
        >
          <div className="mb-3 flex justify-between gap-3">
            <div
              className="h-3.5 animate-pulse rounded-md bg-gradient-to-r from-neutral-200 via-neutral-100 to-neutral-200 bg-[length:200%_100%]"
              style={{ width: '58%' }}
            />
            <div
              className="h-4 w-12 animate-pulse rounded-full bg-gradient-to-r from-neutral-200 via-neutral-100 to-neutral-200 bg-[length:200%_100%]"
            />
          </div>
          <div
            className="mb-2 h-3.5 animate-pulse rounded-md bg-gradient-to-r from-neutral-200 via-neutral-100 to-neutral-200 bg-[length:200%_100%]"
          />
          <div
            className="mb-2 h-3.5 w-4/5 animate-pulse rounded-md bg-gradient-to-r from-neutral-200 via-neutral-100 to-neutral-200 bg-[length:200%_100%]"
          />
          <div
            className="mt-3 flex justify-between border-t border-dashed pt-3"
            style={{ borderColor: line2 }}
          >
            <div
              className="h-2.5 w-24 animate-pulse rounded bg-gradient-to-r from-neutral-200 via-neutral-100 to-neutral-200 bg-[length:200%_100%]"
            />
            <div
              className="h-2.5 w-14 animate-pulse rounded bg-gradient-to-r from-neutral-200 via-neutral-100 to-neutral-200 bg-[length:200%_100%]"
            />
          </div>
        </div>
        <p className={`mt-6 text-center text-sm ${mono}`} style={{ color: muted }}>
          {t('loading')}
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="flex min-h-[420px] items-center justify-center px-4 py-10"
        style={{ backgroundColor: bgPage, color: ink }}
      >
        <div
          className="flex max-w-md flex-col items-center gap-3 rounded-2xl border bg-white px-6 py-10 text-center"
          style={{ borderColor: line }}
        >
          <div
            className="flex h-[60px] w-[60px] items-center justify-center rounded-2xl border text-[oklch(0.62_0.22_25)]"
            style={{
              backgroundColor: 'oklch(0.95 0.05 25)',
              borderColor: 'oklch(0.88 0.06 25)',
            }}
          >
            <AlertCircle className="h-6 w-6" strokeWidth={1.8} />
          </div>
          <h3 className="text-lg font-semibold tracking-tight">{t('errorTitle')}</h3>
          <p className="text-sm leading-relaxed" style={{ color: muted }}>
            {t('errorDescription')}
          </p>
          <p className={`text-sm ${mono}`} style={{ color: danger }}>
            {error}
          </p>
          <div className="mt-2 flex flex-wrap justify-center gap-2">
            <button
              type="button"
              onClick={() => router.back()}
              className="inline-flex items-center gap-2 rounded-[10px] border bg-white px-4 py-2.5 text-[13.5px] font-medium transition-colors hover:border-[#0A0A0A]"
              style={{ borderColor: line2, color: ink }}
            >
              {t('back')}
            </button>
            <button
              type="button"
              onClick={() => loadSubmissions()}
              className="inline-flex items-center gap-2 rounded-[10px] border border-transparent bg-[#0A0A0A] px-4 py-2.5 text-[13.5px] font-medium text-[#FAFAF7] transition-colors hover:bg-black"
            >
              {t('retry')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="space-y-0 pb-16 pt-1 [-webkit-font-smoothing:antialiased]"
      style={{ backgroundColor: bgPage, color: ink }}
    >
      <div className="mx-auto max-w-[1400px] space-y-5 px-1 sm:px-0">
        {/* Page heading */}
        <div className="flex flex-wrap items-end justify-between gap-5 pb-1">
          <div>
            <h1 className="text-[32px] font-semibold leading-[1.05] tracking-[-0.03em]">
              {t.rich('listHeading', {
                accent: (chunks) => (
                  <span className={`${displaySerif} font-normal italic`} style={{ color: ink2 }}>
                    {chunks}
                  </span>
                ),
              })}
            </h1>
            <p className="mt-1.5 max-w-[560px] text-sm leading-snug" style={{ color: muted }}>
              {t('listSubtitle')}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => toast.info(t('exportSoon'))}
              className="inline-flex items-center gap-2 rounded-[10px] border bg-white px-4 py-2.5 text-[13.5px] font-medium transition-colors hover:border-[#0A0A0A]"
              style={{ borderColor: line2, color: ink }}
            >
              {t('exportCsv')}
            </button>
            <Link
              href="/submissions/create"
              className="inline-flex items-center gap-2 rounded-[10px] border border-transparent bg-[#0A0A0A] px-4 py-2.5 text-[13.5px] font-medium text-[#FAFAF7] transition-all hover:-translate-y-px hover:bg-black"
            >
              + {t('createSubmission')}
            </Link>
          </div>
        </div>

        {/* Toolbar */}
        {submissions.length > 0 && (
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <div
              className="flex w-full max-w-[340px] items-center gap-2 rounded-[10px] border bg-white px-3 py-2 sm:w-[340px]"
              style={{ borderColor: line2 }}
            >
              <Search className="h-3.5 w-3.5 shrink-0" strokeWidth={2} style={{ color: muted2 }} />
              <input
                ref={searchInputRef}
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('searchPlaceholder')}
                className="min-w-0 flex-1 border-0 bg-transparent text-[13.5px] outline-none ring-0 placeholder:text-[#9B9B9B]"
                style={{ color: ink }}
              />
              <span
                className={`hidden shrink-0 sm:inline ${mono} border px-1.5 py-0.5 text-[10.5px]`}
                style={{ color: muted, borderColor: line, borderRadius: 5 }}
              >
                {t('shortcutHint')}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <button type="button" className={chipBtn(chip === 'all')} onClick={() => setChip('all')}>
                {t('filterAll')}{' '}
                <span className={mono} style={{ fontSize: 10.5 }}>
                  {counts.all}
                </span>
              </button>
              <button
                type="button"
                className={chipBtn(chip === 'final')}
                onClick={() => setChip('final')}
              >
                {t('filterSubmitted')}{' '}
                <span className={mono} style={{ fontSize: 10.5 }}>
                  {counts.final}
                </span>
              </button>
              <button
                type="button"
                className={chipBtn(chip === 'draft')}
                onClick={() => setChip('draft')}
              >
                {t('filterDraft')}{' '}
                <span className={mono} style={{ fontSize: 10.5 }}>
                  {counts.draft}
                </span>
              </button>
              <button
                type="button"
                className={chipBtn(chip === 'review')}
                onClick={() => setChip('review')}
              >
                {t('filterReview')}{' '}
                <span className={mono} style={{ fontSize: 10.5 }}>
                  {counts.review}
                </span>
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-3.5 sm:ms-auto">
              <span className={`text-xs ${mono}`} style={{ color: muted }}>
                {t('submissionsCount', { count: filtered.length })}
              </span>
              <div
                className="flex gap-0 rounded-[10px] border bg-white p-0.5"
                style={{ borderColor: line }}
              >
                <button
                  type="button"
                  title={t('gridView')}
                  onClick={() => setViewMode('grid')}
                  className={`inline-flex items-center gap-1.5 rounded-[7px] px-3 py-1.5 text-xs transition-colors ${
                    viewMode === 'grid'
                      ? 'bg-[#0A0A0A] text-white'
                      : 'text-[#9B9B9B] hover:text-[#2A2A2A]'
                  }`}
                >
                  <LayoutGrid className="h-3.5 w-3.5" strokeWidth={2} />
                  {t('gridView')}
                </button>
                <button
                  type="button"
                  title={t('listView')}
                  onClick={() => setViewMode('list')}
                  className={`inline-flex items-center gap-1.5 rounded-[7px] px-3 py-1.5 text-xs transition-colors ${
                    viewMode === 'list'
                      ? 'bg-[#0A0A0A] text-white'
                      : 'text-[#9B9B9B] hover:text-[#2A2A2A]'
                  }`}
                >
                  <List className="h-3.5 w-3.5" strokeWidth={2} />
                  {t('listView')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Empty */}
        {submissions.length === 0 ? (
          <div
            className="flex flex-col items-center gap-2.5 rounded-2xl border bg-white px-6 py-10 text-center"
            style={{ borderColor: line }}
          >
            <div
              className="flex h-[60px] w-[60px] items-center justify-center rounded-2xl border text-[#0A0A0A]"
              style={{
                backgroundColor: accentSoft,
                borderColor: 'oklch(0.85 0.17 130 / 0.3)',
              }}
            >
              <FileText className="h-6 w-6" strokeWidth={1.8} />
            </div>
            <h3 className="text-[17px] font-semibold tracking-tight">{t('noSubmissions')}</h3>
            <p className="max-w-[360px] text-[13px] leading-relaxed" style={{ color: muted }}>
              {t('noSubmissionsDescription')}
            </p>
            <Link
              href="/submissions/create"
              className="group mt-1 inline-flex items-center gap-2 rounded-[10px] px-4 py-2.5 text-[13.5px] font-semibold transition-all hover:-translate-y-px"
              style={{ backgroundColor: accent, color: ink }}
            >
              {t('createSubmission')}
              <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 rtl:rotate-180" />
            </Link>
          </div>
        ) : filtered.length === 0 ? (
          <div
            className="flex flex-col items-center gap-2.5 rounded-2xl border bg-white px-6 py-10 text-center"
            style={{ borderColor: line }}
          >
            <div
              className="flex h-[60px] w-[60px] items-center justify-center rounded-2xl bg-[#F5F5F0] text-[#9B9B9B]"
            >
              <Search className="h-6 w-6" strokeWidth={1.8} />
            </div>
            <h3 className="text-[17px] font-semibold tracking-tight">
              {t('noResultsTitle', { query: search })}
            </h3>
            <p className="max-w-[360px] text-[13px] leading-relaxed" style={{ color: muted }}>
              {t('noResultsDescription')}
            </p>
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setChip('all');
              }}
              className="mt-1 inline-flex items-center gap-2 rounded-[10px] border bg-white px-4 py-2.5 text-[13.5px] font-medium transition-colors hover:border-[#0A0A0A]"
              style={{ borderColor: line2, color: ink }}
            >
              {t('clearSearch')}
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-4">
            {filtered.map((submission) => {
              const hue = teamHue(submission.team.id);
              return (
                <Link key={submission.id} href={`/submissions/${submission.id}`} className="group">
                  <article
                    className="flex h-full flex-col gap-3 rounded-2xl border bg-white p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_30px_-15px_rgba(10,10,10,0.15)]"
                    style={{ borderColor: line }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h3
                        className="flex-1 text-base font-semibold leading-tight tracking-[-0.015em]"
                        style={{ color: ink }}
                      >
                        {getText(submission.title, locale)}
                      </h3>
                      <span
                        className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.04em] ${mono} ${badgeClass(submission.status)}`}
                      >
                        {badgeLabel(submission.status)}
                      </span>
                    </div>
                    <p
                      className="line-clamp-2 text-[13.5px] leading-[1.55]"
                      style={{ color: ink2 }}
                    >
                      {getText(submission.description, locale)}
                    </p>
                    <div
                      className="flex items-center justify-between gap-2 border-t border-dashed pt-3 text-xs"
                      style={{ borderColor: line2, color: muted }}
                    >
                      <span className="inline-flex min-w-0 items-center gap-1.5 font-medium" style={{ color: ink2 }}>
                        <span
                          className="inline-block h-[18px] w-[18px] shrink-0 rounded-[5px]"
                          style={{
                            background: `linear-gradient(135deg, ${accent}, ${accentDeep})`,
                            filter: `hue-rotate(${hue * 0.15}deg)`,
                          }}
                        />
                        <span className="truncate">{getText(submission.team.name, locale)}</span>
                      </span>
                      {submission.averageScore != null ? (
                        <span
                          className={`inline-flex shrink-0 items-center gap-1 rounded-full bg-[#0A0A0A] px-2 py-0.5 text-[11px] font-semibold text-white ${mono}`}
                        >
                          {t('avgLabel')}{' '}
                          <span style={{ color: accent }}>{submission.averageScore}</span>
                        </span>
                      ) : null}
                    </div>
                    <div className="flex justify-between text-[11px]" style={{ color: muted }}>
                      <span className={mono}>
                        {t('updatedLabel')} {formatDateShort(submission.updatedAt)}
                      </span>
                    </div>
                  </article>
                </Link>
              );
            })}
          </div>
        ) : (
          <>
            <div className="space-y-2 md:hidden">
              {filtered.map((submission) => {
                const hue = teamHue(submission.team.id);
                return (
                  <Link
                    key={submission.id}
                    href={`/submissions/${submission.id}`}
                    className="block rounded-2xl border bg-white p-4 transition-colors hover:bg-[#FCFCFA]"
                    style={{ borderColor: line }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold tracking-tight" style={{ color: ink }}>
                          {getText(submission.title, locale)}
                        </div>
                        <div className="mt-1 flex items-center gap-1.5 text-xs" style={{ color: ink2 }}>
                          <span
                            className="inline-block h-3.5 w-3.5 shrink-0 rounded"
                            style={{
                              background: `linear-gradient(135deg, ${accent}, ${accentDeep})`,
                              filter: `hue-rotate(${hue * 0.15}deg)`,
                            }}
                          />
                          <span className="truncate">{getText(submission.team.name, locale)}</span>
                        </div>
                      </div>
                      <span
                        className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.04em] ${mono} ${badgeClass(submission.status)}`}
                      >
                        {badgeLabel(submission.status)}
                      </span>
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-2 border-t border-dashed pt-3 text-xs" style={{ borderColor: line2, color: muted }}>
                      <span className={mono}>{formatDateShort(submission.updatedAt)}</span>
                      {submission.averageScore != null ? (
                        <span
                          className={`inline-flex items-center gap-1 rounded-full bg-[#0A0A0A] px-2 py-0.5 text-[11px] font-semibold text-white ${mono}`}
                        >
                          {t('avgLabel')}{' '}
                          <span style={{ color: accent }}>{submission.averageScore}</span>
                        </span>
                      ) : (
                        <span className={mono} style={{ color: muted2 }}>
                          —
                        </span>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>

            <div
              className="hidden overflow-hidden rounded-2xl border bg-white md:block"
              style={{ borderColor: line }}
            >
              <div
                className={`grid grid-cols-[1fr_140px_100px_90px_72px] gap-3.5 border-b px-5 py-3 text-[10.5px] font-semibold uppercase tracking-[0.08em] ${mono}`}
                style={{
                  background: '#FCFCFA',
                  borderColor: line,
                  color: muted,
                }}
              >
                <span className="min-w-0">{t('colSubmission')}</span>
                <span>{t('colTeam')}</span>
                <span>{t('colStatus')}</span>
                <span>{t('colScore')}</span>
                <span className="text-end">{t('colUpdated')}</span>
              </div>
              {filtered.map((submission) => {
                const hue = teamHue(submission.team.id);
                return (
                  <Link
                    key={submission.id}
                    href={`/submissions/${submission.id}`}
                    className="grid grid-cols-[1fr_140px_100px_90px_72px] cursor-pointer items-center gap-3.5 border-b px-5 py-3.5 transition-colors last:border-b-0 hover:bg-[#FCFCFA]"
                    style={{ borderColor: line }}
                  >
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold tracking-tight" style={{ color: ink }}>
                        {getText(submission.title, locale)}
                      </div>
                      <div className="truncate text-xs" style={{ color: muted }}>
                        {getText(submission.description, locale)}
                      </div>
                    </div>
                    <span className="flex min-w-0 items-center gap-1.5 truncate text-[13px]" style={{ color: ink2 }}>
                      <span
                        className="inline-block h-3.5 w-3.5 shrink-0 rounded"
                        style={{
                          background: `linear-gradient(135deg, ${accent}, ${accentDeep})`,
                          filter: `hue-rotate(${hue * 0.15}deg)`,
                        }}
                      />
                      {getText(submission.team.name, locale)}
                    </span>
                    <span
                      className={`inline-flex w-fit items-center ${mono} rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.04em] ${badgeClass(submission.status)}`}
                    >
                      {badgeLabel(submission.status)}
                    </span>
                    <div>
                      {submission.averageScore != null ? (
                        <span
                          className={`inline-flex items-center gap-1 rounded-full bg-[#0A0A0A] px-2 py-0.5 text-[11px] font-semibold text-white ${mono}`}
                        >
                          {t('avgLabel')}{' '}
                          <span style={{ color: accent }}>{submission.averageScore}</span>
                        </span>
                      ) : (
                        <span className={`text-xs ${mono}`} style={{ color: muted2 }}>
                          —
                        </span>
                      )}
                    </div>
                    <span className={`text-end text-xs ${mono}`} style={{ color: muted }}>
                      {formatDateShort(submission.updatedAt)}
                    </span>
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
