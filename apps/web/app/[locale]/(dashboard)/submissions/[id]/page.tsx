'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { Link, useRouter } from '@/i18n/routing';
import { submissionsApi } from '@/lib/api';
import { toast } from 'sonner';
import {
  AlertCircle,
  ChevronRight,
  Download,
  Eye,
  Github,
  Globe,
  Link2,
  Lock,
  PenLine,
  Trash2,
  Video,
} from 'lucide-react';

type BilingualText = string | { en: string; ar: string };

interface TeamMemberRow {
  user: {
    id: string;
    name?: string | null;
    email?: string;
  };
}

interface Submission {
  id: string;
  title: BilingualText;
  description: BilingualText;
  status: string;
  demoUrl?: string | null;
  repoUrl?: string | null;
  videoUrl?: string | null;
  team: {
    id: string;
    name: BilingualText;
    leader?: { id: string; name?: string | null; email?: string };
    members?: TeamMemberRow[];
  };
  event?: { id: string; name: BilingualText; state?: string };
  files: Array<{
    id: string;
    fileName: string;
    fileSize: number;
    fileUrl: string;
    mimeType?: string;
  }>;
  scores?: Array<{
    judge: { id?: string; name: string };
    scores?: Record<string, number>;
    criteriaScores?: Record<string, number>;
    totalScore: number;
    feedback?: { en: string; ar: string } | null;
    submittedAt?: string;
    createdAt?: string;
    updatedAt?: string;
  }>;
  averageScore?: number | null;
  createdAt: string;
  updatedAt: string;
  submittedAt?: string | null;
}

function getText(value: BilingualText | undefined, locale: string): string {
  if (!value) return '';
  if (typeof value === 'string') return value;
  return value[locale as 'en' | 'ar'] || value.en || '';
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fileKind(name: string): 'pdf' | 'zip' | 'img' | 'vid' | 'file' {
  const ext = name.split('.').pop()?.toLowerCase() ?? '';
  if (ext === 'pdf') return 'pdf';
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) return 'zip';
  if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext)) return 'img';
  if (['mp4', 'webm', 'mov', 'mkv'].includes(ext)) return 'vid';
  return 'file';
}

function initials(name: string): string {
  const p = name.trim().split(/\s+/).filter(Boolean);
  if (p.length >= 2) return (p[0][0] + p[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase() || '?';
}

const AVATAR_BACKGROUNDS = ['#7A3D00', '#0A3D73', '#2A2A2A', '#8A1E36', '#4D5A35', '#1a5c4a', '#5c3d8c'];

function getCriteriaMap(row: {
  scores?: Record<string, number>;
  criteriaScores?: Record<string, number>;
}): Record<string, number> {
  return row.criteriaScores ?? row.scores ?? {};
}

function criterionAverages(
  rows: NonNullable<Submission['scores']>
): { name: string; avg: number }[] {
  const acc = new Map<string, { sum: number; n: number }>();
  for (const row of rows) {
    const obj = getCriteriaMap(row);
    for (const [k, v] of Object.entries(obj)) {
      const cur = acc.get(k) ?? { sum: 0, n: 0 };
      cur.sum += Number(v);
      cur.n += 1;
      acc.set(k, cur);
    }
  }
  return [...acc.entries()].map(([name, { sum, n }]) => ({ name, avg: sum / n }));
}

function splitTitleForHero(title: string): { lead: string; accentWord: string } {
  const parts = title.trim().split(/\s+/);
  if (parts.length <= 1) return { lead: '', accentWord: title.trim() };
  const accentWord = parts.pop() ?? '';
  return { lead: parts.join(' '), accentWord };
}

function displayUrl(u: string): string {
  try {
    const url = u.startsWith('http') ? u : `https://${u}`;
    return new URL(url).hostname + new URL(url).pathname.replace(/\/$/, '').slice(0, 48);
  } catch {
    return u.length > 40 ? `${u.slice(0, 37)}…` : u;
  }
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

export default function SubmissionDetailPage() {
  const params = useParams();
  const t = useTranslations('submissions');
  const locale = useLocale();
  const router = useRouter();
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tocActive, setTocActive] = useState<'desc' | 'scores' | 'files'>('desc');

  const submissionId = params.id as string;

  const ink = '#0A0A0A';
  const ink2 = '#2A2A2A';
  const muted = '#6B6B6B';
  const muted2 = '#9B9B9B';
  const line = 'rgba(10,10,10,.08)';
  const line2 = 'rgba(10,10,10,.14)';
  const bgPage = '#FAFAF7';
  const accentColor = 'oklch(0.85 0.17 130)';
  const accentDeep = 'oklch(0.68 0.19 130)';
  const accentSoft = 'oklch(0.93 0.09 130)';
  const danger = 'oklch(0.62 0.22 25)';
  const mono = "font-[family-name:var(--font-mono-display),ui-monospace,monospace]";
  const displaySerif = "font-[family-name:var(--font-display),ui-serif,Georgia,serif]";

  const loadSubmission = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await submissionsApi.getById(submissionId);
      const data = response.data?.id ? response.data : response.data?.data;
      setSubmission(data ?? null);
      if (!data) setError(t('notFound'));
    } catch (err: unknown) {
      const errData =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { error?: { message?: unknown }; message?: unknown } } }).response?.data
          : undefined;
      const raw = errData?.error?.message ?? errData?.message;
      const msg =
        typeof raw === 'object' && raw !== null && 'en' in (raw as object)
          ? ((raw as { en?: string; ar?: string })[locale as 'en' | 'ar'] ??
            (raw as { en?: string }).en ??
            t('loadError'))
          : typeof raw === 'string'
            ? raw
            : t('loadError');
      setError(msg);
      setSubmission(null);
    } finally {
      setIsLoading(false);
    }
  }, [submissionId, t, locale]);

  useEffect(() => {
    loadSubmission();
  }, [loadSubmission]);

  useEffect(() => {
    if (submission && (!submission.scores || submission.scores.length === 0) && tocActive === 'scores') {
      setTocActive('desc');
    }
  }, [submission, tocActive]);

  useEffect(() => {
    if (!submission) return;
    const ids =
      submission.scores && submission.scores.length > 0
        ? (['desc', 'scores', 'files'] as const)
        : (['desc', 'files'] as const);
    const els = ids.map((id) => document.getElementById(id)).filter(Boolean) as HTMLElement[];
    if (els.length === 0) return;
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target.id && (ids as readonly string[]).includes(visible.target.id)) {
          setTocActive(visible.target.id as 'desc' | 'scores' | 'files');
        }
      },
      { rootMargin: '-12% 0px -55% 0px', threshold: [0.08, 0.15, 0.25] }
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [submission]);

  const handleSubmitFinal = () => {
    setIsSubmitting(true);
    toast.promise(
      async () => {
        try {
          const response = await submissionsApi.submitFinal(submissionId);
          await loadSubmission();
          return response;
        } finally {
          setIsSubmitting(false);
        }
      },
      {
        loading: t('submitting'),
        success: (data: { data?: { message?: unknown } }) => {
          const message = data?.data?.message;
          return typeof message === 'object' && message !== null && 'en' in (message as object)
            ? ((message as { en?: string; ar?: string })[locale as 'en' | 'ar'] ??
              (message as { en?: string }).en ??
              t('submitSuccess'))
            : ((message as string) || t('submitSuccess'));
        },
        error: (err: unknown) => {
          const errorData =
            err && typeof err === 'object' && 'response' in err
              ? (err as { response?: { data?: { error?: { message?: unknown }; message?: unknown } } }).response
                  ?.data
              : undefined;
          const errorMessage = errorData?.error?.message || errorData?.message;
          return errorMessage && typeof errorMessage === 'object'
            ? ((errorMessage as { en?: string; ar?: string })[locale as 'en' | 'ar'] ??
              (errorMessage as { en?: string }).en ??
              t('submitError'))
            : ((errorMessage as string) || t('submitError'));
        },
      }
    );
  };

  const handleDeleteFile = async (fileId: string) => {
    if (!window.confirm(t('confirmDeleteFile'))) return;
    toast.promise(
      async () => {
        await submissionsApi.deleteFile(submissionId, fileId);
        await loadSubmission();
      },
      {
        loading: t('deleting'),
        success: () => t('deleteFileSuccess'),
        error: (err: unknown) => {
          const errorData =
            err && typeof err === 'object' && 'response' in err
              ? (err as { response?: { data?: { error?: { message?: unknown }; message?: unknown } } }).response
                  ?.data
              : undefined;
          const errorMessage = errorData?.error?.message || errorData?.message;
          return errorMessage && typeof errorMessage === 'object'
            ? ((errorMessage as { en?: string; ar?: string })[locale as 'en' | 'ar'] ??
              (errorMessage as { en?: string }).en ??
              t('deleteFileError'))
            : ((errorMessage as string) || t('deleteFileError'));
        },
      }
    );
  };

  const badgeClass = (status: string) => {
    const k = statusBadgeKey(status);
    if (k === 'draft') return 'bg-[#F5F5F0] text-[#6B6B6B]';
    if (k === 'final') return 'bg-[#0A0A0A] text-[oklch(0.85_0.17_130)]';
    if (k === 'review') return 'bg-[oklch(0.93_0.09_130)] text-[#0A0A0A] border border-[oklch(0.85_0.17_130/0.3)]';
    if (k === 'disqualified')
      return 'bg-[oklch(0.95_0.05_25)] text-[oklch(0.62_0.22_25)] border border-[oklch(0.88_0.06_25)]';
    if (k === 'winner') return 'bg-[oklch(0.93_0.09_130)] text-[#0A0A0A] border border-[oklch(0.85_0.17_130/0.3)]';
    return '';
  };

  const roster = useMemo(() => {
    if (!submission) return [];
    const seen = new Set<string>();
    const out: { id: string; name: string }[] = [];
    const leader = submission.team.leader;
    if (leader?.id) {
      seen.add(leader.id);
      out.push({ id: leader.id, name: leader.name || leader.email || '?' });
    }
    for (const m of submission.team.members ?? []) {
      const u = m.user;
      if (!u?.id || seen.has(u.id)) continue;
      seen.add(u.id);
      out.push({ id: u.id, name: u.name || u.email || '?' });
    }
    return out;
  }, [submission]);

  if (isLoading) {
    return (
      <div className="min-h-[420px] px-1 py-2" style={{ color: ink, backgroundColor: bgPage }}>
        <div className="mx-auto max-w-[1400px]">
          <div className="mb-6 h-10 w-2/3 max-w-md animate-pulse rounded-lg bg-neutral-200/80" />
          <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
            <div className="h-64 animate-pulse rounded-2xl bg-white" style={{ border: `1px solid ${line}` }} />
            <div className="h-48 animate-pulse rounded-2xl bg-white" style={{ border: `1px solid ${line}` }} />
          </div>
        </div>
        <p className={`mt-6 text-center text-sm ${mono}`} style={{ color: muted }}>
          {t('loading')}
        </p>
      </div>
    );
  }

  if (error || !submission) {
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
          <h3 className="text-lg font-semibold tracking-tight">{t('loadError')}</h3>
          <p className={`text-sm ${mono}`} style={{ color: danger }}>
            {error || t('notFound')}
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
              onClick={() => loadSubmission()}
              className="inline-flex items-center gap-2 rounded-[10px] border border-transparent bg-[#0A0A0A] px-4 py-2.5 text-[13.5px] font-medium text-[#FAFAF7] transition-colors hover:bg-black"
            >
              {t('retry')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const titleText = getText(submission.title, locale);
  const { lead, accentWord } = splitTitleForHero(titleText);
  const descText = getText(submission.description, locale);
  const descParagraphs = descText.split(/\n\n+/).filter(Boolean);
  const titleObj = submission.title;
  const hasBothLangTitles =
    typeof titleObj === 'object' &&
    titleObj?.en?.trim() &&
    titleObj?.ar?.trim() &&
    titleObj.en.trim() !== titleObj.ar.trim();

  const scores = submission.scores ?? [];
  const critAvgs = scores.length ? criterionAverages(scores) : [];
  const maxCritVal = Math.max(10, ...critAvgs.map((c) => c.avg), 1);
  const totals = scores.map((s) => s.totalScore);
  const maxTotal = Math.max(...totals, 0);
  const showSlashTen = maxTotal <= 10.0001;
  const avgTotal =
    scores.length > 0
      ? scores.reduce((a, s) => a + s.totalScore, 0) / scores.length
      : typeof submission.averageScore === 'number'
        ? submission.averageScore
        : null;

  const filesTotalBytes = submission.files.reduce((a, f) => a + f.fileSize, 0);
  const submittedTs = submission.submittedAt || submission.updatedAt;

  const tocLink = (id: 'desc' | 'scores' | 'files', label: string) => (
    <a
      key={id}
      href={`#${id}`}
      onClick={() => setTocActive(id)}
      className={`mb-[-1px] border-b-2 px-3.5 py-2.5 text-[13px] transition-colors ${
        tocActive === id
          ? 'border-[#0A0A0A] font-medium text-[#0A0A0A]'
          : 'border-transparent text-[#6B6B6B] hover:text-[#2A2A2A]'
      }`}
    >
      {label}
    </a>
  );

  const badgeLabel = (status: string) => t(`statusBadge.${statusBadgeKey(status)}`);

  const sharePage = async () => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    try {
      await navigator.clipboard.writeText(url);
      toast.success(t('detailShareCopied'));
    } catch {
      toast.error(t('comingSoon'));
    }
  };

  const fileIconClass = (kind: string) => {
    if (kind === 'pdf') return 'bg-[#FFE4E4] text-[#A0281A]';
    if (kind === 'zip') return 'bg-[#FFF2D4] text-[#8A5D0A]';
    if (kind === 'img') return 'bg-[#D4E7FF] text-[#0A3D73]';
    if (kind === 'vid') return 'bg-[#E9DFFF] text-[#4E2680]';
    return 'bg-[#F5F5F0] text-[#6B6B6B]';
  };

  const fileIconLabel = (kind: string, name: string) => {
    if (kind === 'pdf') return 'PDF';
    if (kind === 'zip') return 'ZIP';
    if (kind === 'img') return name.split('.').pop()?.toUpperCase().slice(0, 4) || 'IMG';
    if (kind === 'vid') return name.split('.').pop()?.toUpperCase().slice(0, 4) || 'VID';
    return (name.split('.').pop() || 'FILE').slice(0, 4).toUpperCase();
  };

  return (
    <div className="pb-16 [-webkit-font-smoothing:antialiased]" style={{ backgroundColor: bgPage, color: ink }}>
      <div className="mx-auto max-w-[1400px] space-y-6 px-1 sm:px-0">
        {/* Top bar (crumb + actions) */}
        <div
          className="flex flex-col gap-3 border-b pb-4 sm:flex-row sm:items-center sm:justify-between"
          style={{ borderColor: line }}
        >
          <div className="flex flex-wrap items-center gap-2 text-[13px]" style={{ color: muted }}>
            <Link href="/submissions" className="transition-colors hover:text-[#0A0A0A]">
              {t('detailBreadcrumb')}
            </Link>
            <span style={{ color: muted2 }}>/</span>
            <span className="max-w-[min(100%,280px)] truncate font-medium" style={{ color: ink }}>
              {titleText}
            </span>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <button
              type="button"
              onClick={sharePage}
              className="inline-flex items-center gap-2 rounded-[10px] border bg-white px-4 py-2.5 text-[13.5px] font-medium transition-colors hover:border-[#0A0A0A]"
              style={{ borderColor: line2, color: ink }}
            >
              {t('detailShare')}
            </button>
            <Link
              href="/judging"
              className="inline-flex items-center gap-2 rounded-[10px] border bg-white px-4 py-2.5 text-[13.5px] font-medium transition-colors hover:border-[#0A0A0A]"
              style={{ borderColor: line2, color: ink }}
            >
              {t('detailOpenScorer')}
              <ChevronRight className="h-4 w-4 rtl:rotate-180" />
            </Link>
          </div>
        </div>

        <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div>
            {/* Hero */}
            <div
              className="mb-6 flex flex-wrap items-start justify-between gap-5 border-b pb-6"
              style={{ borderColor: line }}
            >
              <div className="min-w-0">
                <h1 className="text-[36px] font-semibold leading-[1.05] tracking-[-0.025em]">
                  {lead ? (
                    <>
                      {lead}{' '}
                      <span className={`${displaySerif} font-normal italic`} style={{ color: ink2 }}>
                        {accentWord.endsWith('.') ? accentWord : `${accentWord}.`}
                      </span>
                    </>
                  ) : (
                    <span className={`${displaySerif} font-normal italic`} style={{ color: ink2 }}>
                      {accentWord}
                    </span>
                  )}
                </h1>
                <div className="mt-2.5 flex flex-wrap items-center gap-2.5 text-[13.5px]" style={{ color: muted }}>
                  <span
                    className="inline-block h-5 w-5 shrink-0 rounded-md bg-gradient-to-br"
                    style={{
                      backgroundImage: `linear-gradient(135deg, ${accentColor}, ${accentDeep})`,
                    }}
                  />
                  <b className="font-medium" style={{ color: ink }}>
                    {getText(submission.team.name, locale)}
                  </b>
                  <span className="inline-block h-0.5 w-0.5 shrink-0 rounded-full bg-[#9B9B9B]" />
                  <span>
                    {t('detailSubmitted')}{' '}
                    {new Date(submittedTs).toLocaleString(locale === 'ar' ? 'ar-SA' : 'en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>
              <div className="flex shrink-0 flex-wrap items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-[0.04em] ${mono} ${badgeClass(submission.status)}`}
                >
                  {badgeLabel(submission.status)}
                </span>
                {scores.length > 0 ? (
                  <span
                    className={`inline-flex items-center gap-1 rounded-full border border-[oklch(0.85_0.17_130/0.3)] bg-[oklch(0.93_0.09_130)] px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-[0.04em] text-[#0A0A0A] ${mono}`}
                  >
                    {t('detailBadgeJudged', { count: scores.length })}
                  </span>
                ) : null}
              </div>
            </div>

            {/* TOC */}
            <nav className="mb-4 flex flex-wrap gap-1 border-b" style={{ borderColor: line }}>
              {tocLink('desc', t('detailTocDescription'))}
              {scores.length > 0 ? tocLink('scores', t('detailTocScores')) : null}
              {tocLink('files', t('detailTocFiles'))}
            </nav>

            {/* Description */}
            <section id="desc" className="mb-[18px] overflow-hidden rounded-[18px] border bg-white" style={{ borderColor: line }}>
              <div
                className="flex items-center gap-2.5 border-b px-[22px] py-4"
                style={{ borderColor: line }}
              >
                <h3 className="flex-1 text-[15.5px] font-semibold tracking-[-0.015em]">{t('description')}</h3>
                <span className={`text-xs ${mono}`} style={{ color: muted }}>
                  {hasBothLangTitles ? t('detailDescHint') : t('detailDescHintSingle')}
                </span>
              </div>
              <div className="px-[22px] py-[22px]">
                <div className="space-y-3 text-[14.5px] leading-[1.7]" style={{ color: ink2 }}>
                  {descParagraphs.length > 0 ? (
                    descParagraphs.map((p, i) => (
                      <p key={i} className="whitespace-pre-wrap">
                        {p}
                      </p>
                    ))
                  ) : (
                    <p className="whitespace-pre-wrap">{descText}</p>
                  )}
                </div>
              </div>
            </section>

            {/* Scores */}
            {scores.length > 0 && avgTotal != null ? (
              <section id="scores" className="mb-[18px] overflow-hidden rounded-[18px] border bg-white" style={{ borderColor: line }}>
                <div
                  className="flex items-center gap-2.5 border-b px-[22px] py-4"
                  style={{ borderColor: line }}
                >
                  <h3 className="flex-1 text-[15.5px] font-semibold tracking-[-0.015em]">
                    {t('detailJudgingScores')}
                  </h3>
                  <span className={`text-xs ${mono}`} style={{ color: muted }}>
                    {t('detailScoresHint', {
                      judges: scores.length,
                      criteria: critAvgs.length || Object.keys(getCriteriaMap(scores[0])).length,
                    })}
                  </span>
                </div>
                <div className="grid gap-[18px] p-[22px] lg:grid-cols-[minmax(220px,280px)_1fr]">
                  <div
                    className="relative flex flex-col justify-between overflow-hidden rounded-[14px] px-5 py-5 text-white"
                    style={{ backgroundColor: ink }}
                  >
                    <div
                      className="pointer-events-none absolute -end-[20%] -top-[20%] h-40 w-40 rounded-full opacity-45"
                      style={{
                        background: `radial-gradient(circle, ${accentColor} 0%, transparent 70%)`,
                      }}
                    />
                    <div className="relative z-[1]">
                      <div className={`text-[10.5px] font-semibold uppercase tracking-[0.1em] ${mono}`} style={{ color: accentColor }}>
                        {t('detailAvgScore')}
                      </div>
                      <div className="mt-1.5 text-[62px] font-semibold leading-none tracking-[-0.04em]">
                        {avgTotal.toFixed(1)}
                        {showSlashTen ? (
                          <span className="text-xl font-normal text-[#9B9B9B]">/10</span>
                        ) : null}
                      </div>
                    </div>
                    <div className={`relative z-[1] mt-2.5 text-[12.5px] text-[#9B9B9B] ${mono}`}>
                      {t('detailAvgSub', { count: scores.length })}
                    </div>
                  </div>
                  {critAvgs.length > 0 ? (
                    <div className="flex flex-col justify-center gap-2.5">
                      {critAvgs.map(({ name, avg }) => (
                        <div
                          key={name}
                          className="grid items-center gap-3 text-[12.5px]"
                          style={{ gridTemplateColumns: '100px 1fr 48px' }}
                        >
                          <span className="font-medium" style={{ color: ink2 }}>
                            {name}
                          </span>
                          <div className="h-[7px] overflow-hidden rounded-full bg-[rgba(10,10,10,.08)]">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${Math.min(100, (avg / maxCritVal) * 100)}%`,
                                background: `linear-gradient(90deg, ${accentDeep}, ${accentColor})`,
                              }}
                            />
                          </div>
                          <span className={`text-right text-xs font-semibold ${mono}`} style={{ color: ink }}>
                            {avg.toFixed(1)}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>

                <div className="flex flex-col gap-3.5 border-t px-[22px] py-[22px]" style={{ borderColor: line }}>
                  {scores.map((row, idx) => {
                    const cmap = getCriteriaMap(row);
                    const critEntries = Object.entries(cmap);
                    const when = row.submittedAt || row.createdAt || row.updatedAt;
                    const fb = row.feedback;
                    const fbText =
                      fb && typeof fb === 'object'
                        ? fb[locale as 'en' | 'ar'] || fb.en || ''
                        : '';
                    const ji = initials(row.judge.name);
                    return (
                      <article
                        key={idx}
                        className="rounded-[14px] border bg-[#FCFCFA] p-4"
                        style={{ borderColor: line }}
                      >
                        <div className="mb-3 flex items-center justify-between gap-3">
                          <div className="flex min-w-0 items-center gap-3">
                            <div
                              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] text-[13px] font-bold"
                                style={{
                                background: AVATAR_BACKGROUNDS[idx % AVATAR_BACKGROUNDS.length],
                                color: accentColor,
                              }}
                            >
                              {ji}
                            </div>
                            <div className="min-w-0">
                              <div className="truncate text-sm font-semibold tracking-tight">{row.judge.name}</div>
                              {when ? (
                                <div className={`mt-0.5 text-xs ${mono}`} style={{ color: muted }}>
                                  {new Date(when).toLocaleString(locale === 'ar' ? 'ar-SA' : 'en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </div>
                              ) : null}
                            </div>
                          </div>
                          <div className={`shrink-0 text-[22px] font-bold leading-none tracking-[-0.02em] ${mono}`}>
                            {row.totalScore.toFixed(1)}
                            <span className="text-base font-normal text-[#9B9B9B]">
                              {showSlashTen ? '/10' : ''}
                            </span>
                          </div>
                        </div>
                        {critEntries.length > 0 ? (
                          <div className="mb-3 grid grid-cols-2 gap-2 md:grid-cols-4">
                            {critEntries.map(([k, v]) => (
                              <div
                                key={k}
                                className="rounded-[10px] border bg-white p-2.5"
                                style={{ borderColor: line }}
                              >
                                <div className={`text-[10.5px] font-semibold uppercase tracking-[0.04em] ${mono}`} style={{ color: muted }}>
                                  {k}
                                </div>
                                <div className="mt-0.5 text-lg font-semibold tracking-tight">
                                  {Number(v).toFixed(1)}
                                  <span className="text-[13px] font-normal text-[#9B9B9B]">/10</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : null}
                        {fbText ? (
                          <div
                            className={`relative rounded-[10px] border px-3.5 py-3 text-[13.5px] leading-[1.55] ${displaySerif}`}
                            style={{
                              color: ink2,
                              backgroundColor: accentSoft,
                              borderColor: 'oklch(0.85 0.17 130 / 0.3)',
                            }}
                          >
                            <span
                              className="mb-1 block text-[32px] leading-none text-[oklch(0.68_0.19_130)]"
                              style={{ fontStyle: 'italic' }}
                              aria-hidden
                            >
                              &ldquo;
                            </span>
                            {fbText}
                          </div>
                        ) : null}
                      </article>
                    );
                  })}
                </div>
              </section>
            ) : null}

            {/* Files */}
            <section id="files" className="overflow-hidden rounded-[18px] border bg-white" style={{ borderColor: line }}>
              <div
                className="flex flex-wrap items-center gap-2 border-b px-[22px] py-4"
                style={{ borderColor: line }}
              >
                <h3 className="flex-1 text-[15.5px] font-semibold tracking-[-0.015em]">{t('files')}</h3>
                <span className={`text-xs ${mono}`} style={{ color: muted }}>
                  {t('detailFilesHint', {
                    count: submission.files.length,
                    size: formatBytes(filesTotalBytes),
                  })}
                </span>
              </div>
              <div className="flex flex-col gap-2 px-[22px] pb-[22px] pt-4">
                {submission.files.length === 0 ? (
                  <p className="text-center text-[12.5px]" style={{ color: muted }}>
                    {t('noFiles')}
                  </p>
                ) : (
                  submission.files.map((file) => {
                    const kind = fileKind(file.fileName);
                    const canPreview = kind === 'img' || kind === 'pdf';
                    return (
                      <div
                        key={file.id}
                        className="grid items-center gap-3.5 rounded-[11px] border bg-[#FCFCFA] p-3"
                        style={{ borderColor: line, gridTemplateColumns: '40px 1fr auto' }}
                      >
                        <div
                          className={`flex h-10 w-10 items-center justify-center rounded-[9px] text-[10px] font-bold ${mono} ${fileIconClass(kind)}`}
                        >
                          {fileIconLabel(kind, file.fileName)}
                        </div>
                        <div className="min-w-0">
                          <div className="truncate text-[13.5px] font-medium">{file.fileName}</div>
                          <div className={`mt-0.5 text-[11.5px] ${mono}`} style={{ color: muted }}>
                            {formatBytes(file.fileSize)}
                          </div>
                        </div>
                        <div className="flex shrink-0 gap-1.5">
                          {canPreview ? (
                            <a
                              href={file.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex h-8 w-8 items-center justify-center rounded-lg border transition-colors hover:border-[#0A0A0A] hover:text-[#0A0A0A]"
                              style={{ borderColor: line, color: muted }}
                              title={t('detailPreview')}
                            >
                              <Eye className="h-3.5 w-3.5" strokeWidth={2} />
                            </a>
                          ) : null}
                          <a
                            href={file.fileUrl}
                            download
                            className="flex h-8 w-8 items-center justify-center rounded-lg border transition-colors hover:border-[#0A0A0A] hover:text-[#0A0A0A]"
                            style={{ borderColor: line, color: muted }}
                            title={t('download')}
                          >
                            <Download className="h-3.5 w-3.5" strokeWidth={2} />
                          </a>
                          {submission.status === 'DRAFT' ? (
                            <button
                              type="button"
                              onClick={() => handleDeleteFile(file.id)}
                              className="flex h-8 w-8 items-center justify-center rounded-lg border transition-colors hover:border-[oklch(0.62_0.22_25)] hover:text-[oklch(0.62_0.22_25)]"
                              style={{ borderColor: line, color: muted }}
                              title={t('delete')}
                            >
                              <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
                            </button>
                          ) : null}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
              {submission.status !== 'DRAFT' ? (
                <div className="flex items-start gap-2 px-[22px] pb-[18px] text-xs" style={{ color: muted }}>
                  <Lock className="mt-0.5 h-3 w-3 shrink-0" strokeWidth={2} />
                  <span>
                    {t('detailFileLock', { status: t(`statuses.${submission.status}`) })}
                  </span>
                </div>
              ) : null}
            </section>
          </div>

          {/* Side panel */}
          <aside className="flex flex-col gap-4 lg:sticky lg:top-24 lg:self-start">
            <div className="overflow-hidden rounded-2xl border bg-white" style={{ borderColor: line }}>
              <h4 className="flex items-center gap-2 px-[18px] pb-2.5 pt-4 text-[13px] font-semibold" style={{ color: ink }}>
                <Link2 className="h-3.5 w-3.5 shrink-0 text-[oklch(0.68_0.19_130)]" strokeWidth={2} />
                {t('links')}
              </h4>
              {submission.demoUrl ? (
                <a
                  href={submission.demoUrl.startsWith('http') ? submission.demoUrl : `https://${submission.demoUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 border-t px-[18px] py-2.5 text-[13px] transition-colors hover:bg-[#FCFCFA]"
                  style={{ borderColor: line, color: ink2 }}
                >
                  <Globe className="h-4 w-4 shrink-0 text-[#9B9B9B]" strokeWidth={2} />
                  <span className="shrink-0">{t('detailLinkDemo')}</span>
                  <span className={`min-w-0 flex-1 truncate text-end text-[11.5px] ${mono}`} style={{ color: muted }}>
                    {displayUrl(submission.demoUrl)}
                  </span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-[#9B9B9B] rtl:rotate-180" />
                </a>
              ) : null}
              {submission.repoUrl ? (
                <a
                  href={submission.repoUrl.startsWith('http') ? submission.repoUrl : `https://${submission.repoUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 border-t px-[18px] py-2.5 text-[13px] transition-colors hover:bg-[#FCFCFA]"
                  style={{ borderColor: line, color: ink2 }}
                >
                  <Github className="h-4 w-4 shrink-0 text-[#9B9B9B]" strokeWidth={2} />
                  <span className="shrink-0">{t('detailLinkRepo')}</span>
                  <span className={`min-w-0 flex-1 truncate text-end text-[11.5px] ${mono}`} style={{ color: muted }}>
                    {displayUrl(submission.repoUrl)}
                  </span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-[#9B9B9B] rtl:rotate-180" />
                </a>
              ) : null}
              {submission.videoUrl ? (
                <a
                  href={submission.videoUrl.startsWith('http') ? submission.videoUrl : `https://${submission.videoUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 border-t px-[18px] py-2.5 text-[13px] transition-colors hover:bg-[#FCFCFA]"
                  style={{ borderColor: line, color: ink2 }}
                >
                  <Video className="h-4 w-4 shrink-0 text-[#9B9B9B]" strokeWidth={2} />
                  <span className="shrink-0">{t('detailLinkVideo')}</span>
                  <span className={`min-w-0 flex-1 truncate text-end text-[11.5px] ${mono}`} style={{ color: muted }}>
                    {displayUrl(submission.videoUrl)}
                  </span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-[#9B9B9B] rtl:rotate-180" />
                </a>
              ) : null}
              {!submission.demoUrl && !submission.repoUrl && !submission.videoUrl ? (
                <p className="border-t px-[18px] py-4 text-center text-[12.5px]" style={{ borderColor: line, color: muted }}>
                  {t('noLinks')}
                </p>
              ) : null}
            </div>

            {submission.status === 'DRAFT' ? (
              <div className="overflow-hidden rounded-2xl border bg-white" style={{ borderColor: line }}>
                <h4 className="flex items-center gap-2 px-[18px] pb-2.5 pt-4 text-[13px] font-semibold">
                  <PenLine className="h-3.5 w-3.5 shrink-0 text-[oklch(0.68_0.19_130)]" strokeWidth={2} aria-hidden />
                  {t('actions')}
                </h4>
                <div className="flex flex-col gap-2 px-[18px] pb-4">
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={handleSubmitFinal}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-[10px] px-4 py-2.5 text-[13.5px] font-semibold transition-all hover:-translate-y-px disabled:opacity-60"
                    style={{ backgroundColor: accentColor, color: ink }}
                  >
                    {isSubmitting ? t('submitting') : t('submitFinal')}
                    <ChevronRight className="h-4 w-4 rtl:rotate-180" />
                  </button>
                  <Link
                    href={`/submissions/${submissionId}/edit`}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-[10px] border bg-white px-4 py-2.5 text-[13.5px] font-medium transition-colors hover:border-[#0A0A0A]"
                    style={{ borderColor: line2, color: ink }}
                  >
                    {t('editSubmission')}
                  </Link>
                  <p className="rounded-lg border bg-[#FCFCFA] p-2.5 text-xs leading-relaxed" style={{ borderColor: line, color: muted }}>
                    <span className="font-semibold" style={{ color: ink }}>
                      {t('submitFinal')}
                    </span>{' '}
                    {t('submitWarning')}
                  </p>
                </div>
              </div>
            ) : null}

            <div className="overflow-hidden rounded-2xl border bg-white" style={{ borderColor: line }}>
              <h4 className="flex items-center gap-2 px-[18px] pb-2.5 pt-4 text-[13px] font-semibold">
                <span className="text-[oklch(0.68_0.19_130)]">
                  {/* users icon inline */}
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                  </svg>
                </span>
                {t('detailTeam')}
              </h4>
              <div className="px-[18px] pb-4">
                {roster.length > 0 ? (
                  <div className="flex">
                    {roster.slice(0, 8).map((person, i) => (
                      <div
                        key={person.id}
                        className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white text-[10.5px] font-bold text-white"
                        style={{
                          marginInlineStart: i > 0 ? -6 : 0,
                          backgroundColor: AVATAR_BACKGROUNDS[i % AVATAR_BACKGROUNDS.length],
                          zIndex: 8 - i,
                        }}
                        title={person.name}
                      >
                        {initials(person.name)}
                      </div>
                    ))}
                  </div>
                ) : (
                  <Link
                    href={`/teams/${submission.team.id}`}
                    className={`text-sm font-medium hover:underline ${mono}`}
                    style={{ color: ink2 }}
                  >
                    {getText(submission.team.name, locale)}
                  </Link>
                )}
                {roster.length > 0 ? (
                  <p className="mt-2 text-[12.5px]" style={{ color: muted }}>
                    {getText(submission.team.name, locale)}
                  </p>
                ) : null}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
