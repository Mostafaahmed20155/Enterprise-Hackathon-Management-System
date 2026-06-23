'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { judgingApi, api } from '@/lib/api';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';
import { Link, useRouter } from '@/i18n/routing';

type BilingualText = string | { en: string; ar: string };

interface Criterion {
  name: string;
  description?: string;
  maxScore: number;
  weight: number;
}

interface ScoredSubmission {
  id: string;
  slug?: string | null;
  title: BilingualText;
  description: BilingualText;
  team: { id: string; name: BilingualText };
  scores: Array<{
    id: string;
    totalScore: number;
    scores: Record<string, number>;
    feedback?: { en: string; ar: string };
    createdAt: string;
  }>;
}

interface PageData {
  assignmentCriteria: Criterion[];
  submission: ScoredSubmission;
  existingScoreId: string | null;
  existingScores: Record<string, number>;
  existingFeedbackEn: string;
  existingFeedbackAr: string;
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

const fieldBase =
  'w-full rounded-[10px] bg-white px-3.5 py-2.5 text-sm text-[#0A0A0A] outline-none transition-colors hover:border-[rgba(10,10,10,.2)] focus:border-[#0A0A0A] focus:shadow-[0_0_0_3px_rgba(10,10,10,.05)] disabled:opacity-60';

export default function ScoreSubmissionPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const t = useTranslations('judging');
  const locale = useLocale();

  const assignmentId = params.assignmentId as string;
  const submissionId = searchParams.get('submissionId');

  const [data, setData] = useState<PageData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [assignmentId, submissionId]);

  const loadData = async () => {
    try {
      setIsLoading(true);

      const [assignmentRes, submissionsRes] = await Promise.all([
        api.get(`/judging/assignments/${assignmentId}`, { headers: { 'Accept-Language': 'en' } }),
        judgingApi.getSubmissionsForJudge(assignmentId),
      ]);

      const assignment = assignmentRes.data;
      const submissions: ScoredSubmission[] = Array.isArray(submissionsRes.data)
        ? submissionsRes.data
        : submissionsRes.data?.data || [];

      const submission = submissionId
        ? submissions.find((s) => s.id === submissionId)
        : submissions[0];

      if (!submission) {
        setError(locale === 'ar' ? 'المشروع غير موجود' : 'Submission not found');
        return;
      }

      const criteria: Criterion[] = Array.isArray(assignment.criteria)
        ? assignment.criteria
        : [];
      const existing = submission.scores[0];

      const rawFeedback = existing?.feedback;
      const feedbackEn = typeof rawFeedback === 'string' ? rawFeedback : (rawFeedback as any)?.en ?? '';
      const feedbackAr = typeof rawFeedback === 'string' ? '' : (rawFeedback as any)?.ar ?? '';

      setData({
        assignmentCriteria: criteria,
        submission,
        existingScoreId: existing?.id ?? null,
        existingScores: (existing?.scores as Record<string, number>) ?? {},
        existingFeedbackEn: feedbackEn,
        existingFeedbackAr: feedbackAr,
      });
    } catch (err: any) {
      const msg = err.response?.data?.message;
      setError(
        typeof msg === 'object' ? msg[locale] || msg.en || t('loadError') : msg || t('loadError')
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!data) return;

    const formData = new FormData(e.currentTarget);
    const scores: Record<string, number> = {};
    data.assignmentCriteria.forEach((criterion, index) => {
      const value = formData.get(`score_${index}`);
      scores[criterion.name] = value ? Number(value) : 0;
    });

    const feedbackEn = (formData.get('feedbackEn') as string) || '';
    const feedbackAr = (formData.get('feedbackAr') as string) || '';
    const feedback = { en: feedbackEn, ar: feedbackAr };

    setIsSaving(true);

    let promise: Promise<any>;
    if (data.existingScoreId) {
      promise = judgingApi.updateScore(data.existingScoreId, { scores, feedback });
    } else {
      promise = judgingApi.submitScore({
        assignmentId,
        submissionId: data.submission.id,
        scores,
        feedback,
      });
    }

    toast.promise(promise, {
      loading: t('submitting'),
      success: () => {
        router.back();
        return t('submitSuccess') || 'Score submitted successfully';
      },
      error: (err: any) => {
        const errorData = err.response?.data;
        const errorMessage = errorData?.error?.message || errorData?.message;
        return typeof errorMessage === 'object'
          ? errorMessage[locale] || errorMessage.en || t('submitError')
          : errorMessage || t('submitError');
      },
    });

    promise.finally(() => setIsSaving(false));
  };

  const btnPrimary =
    'inline-flex items-center justify-center gap-2 rounded-[10px] border border-transparent bg-[#0A0A0A] px-5 py-2.5 text-[13.5px] font-medium text-[#FAFAF7] transition-all hover:-translate-y-px hover:bg-black disabled:opacity-60';
  const btnOutline =
    'inline-flex items-center justify-center gap-2 rounded-[10px] border bg-white px-5 py-2.5 text-[13.5px] font-medium text-[#0A0A0A] transition-colors hover:bg-[rgba(10,10,10,.04)] disabled:opacity-60';

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

  if (error || !data) {
    return (
      <div
        className="mx-auto max-w-[860px] px-4 py-8 sm:px-8 [-webkit-font-smoothing:antialiased]"
        style={{ backgroundColor: bgPage, color: ink }}
      >
        <p className="mb-4 text-sm" style={{ color: 'oklch(0.62 0.22 25)' }}>
          {error || t('notFound')}
        </p>
        <button type="button" onClick={loadData} className={btnPrimary}>
          {t('retry')}
        </button>
      </div>
    );
  }

  const {
    assignmentCriteria,
    submission,
    existingScoreId,
    existingScores,
    existingFeedbackEn,
    existingFeedbackAr,
  } = data;

  return (
    <div
      className="mx-auto max-w-[860px] px-4 py-8 sm:px-8 [-webkit-font-smoothing:antialiased]"
      style={{ backgroundColor: bgPage, color: ink }}
    >
      {/* Header */}
      <div className="mb-7">
        <button
          type="button"
          onClick={() => router.back()}
          className={`mb-3 inline-flex items-center gap-2 text-[12px] transition-colors hover:text-[#0A0A0A] ${mono}`}
          style={{ color: muted2 }}
        >
          <ArrowLeft className="h-3.5 w-3.5 rtl:rotate-180" /> {locale === 'ar' ? 'العودة' : 'Back'}
        </button>
        <h1 className="text-[28px] font-semibold leading-[1.05] tracking-[-0.03em]">
          {existingScoreId ? t('editScore') : t('scoreSubmission')}{' '}
          <span className={`${serif} font-normal italic`} style={{ color: ink2 }}>
            {locale === 'ar' ? 'النموذج' : 'form.'}
          </span>
        </h1>
        <p className="mt-1.5 text-[13.5px]" style={{ color: muted }}>
          {getText(submission.title, locale)} · {getText(submission.team.name, locale)}
        </p>
      </div>

      <div className="space-y-5">
        {/* Submission Info */}
        <section className="overflow-hidden rounded-[18px] border bg-white" style={{ borderColor: line }}>
          <div className="border-b px-6 py-4" style={{ borderColor: line }}>
            <h2 className="text-[15px] font-semibold tracking-[-0.01em]" style={{ color: ink }}>
              {t('submissionDetails')}
            </h2>
          </div>
          <div className="px-6 py-5">
            <p className="whitespace-pre-wrap text-[14px] leading-relaxed" style={{ color: ink2 }}>
              {getText(submission.description, locale)}
            </p>
            <div className="mt-4">
              <Link
                href={`/submissions/${submission.slug || submission.id}`}
                className="text-[13px] font-medium transition-colors hover:underline"
                style={{ color: accentDeep }}
              >
                {locale === 'ar' ? 'عرض المشروع الكامل ←' : 'View full submission →'}
              </Link>
            </div>
          </div>
        </section>

        {/* Scoring Form */}
        <section className="overflow-hidden rounded-[18px] border bg-white" style={{ borderColor: line }}>
          <div className="border-b px-6 py-4" style={{ borderColor: line }}>
            <h2 className="text-[15px] font-semibold tracking-[-0.01em]" style={{ color: ink }}>
              {t('scoringCriteria')}
            </h2>
            <p className="mt-1 text-[12.5px]" style={{ color: muted }}>
              {t('scoringDescription')}
            </p>
          </div>
          <div className="px-6 py-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Criteria Scores */}
              {assignmentCriteria.map((criterion, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <label htmlFor={`score_${index}`} className="text-[13.5px] font-semibold" style={{ color: ink }}>
                      {criterion.name}{' '}
                      <span className="font-normal" style={{ color: muted }}>
                        ({criterion.weight * 100}% {t('weight')})
                      </span>
                    </label>
                    <span className={`text-[12px] ${mono}`} style={{ color: muted2 }}>
                      {t('max')}: {criterion.maxScore}
                    </span>
                  </div>
                  {criterion.description && (
                    <p className="text-[12.5px]" style={{ color: muted }}>
                      {criterion.description}
                    </p>
                  )}
                  <input
                    id={`score_${index}`}
                    name={`score_${index}`}
                    type="number"
                    min="0"
                    max={criterion.maxScore}
                    step="0.5"
                    defaultValue={existingScores[criterion.name] ?? 0}
                    required
                    disabled={isSaving}
                    className={`${fieldBase} ${mono}`}
                    style={{ borderColor: line2, maxWidth: 200 }}
                  />
                </div>
              ))}

              {/* Feedback */}
              <div className="space-y-3 border-t pt-5" style={{ borderColor: line }}>
                <h3 className="text-[14px] font-semibold" style={{ color: ink }}>
                  {t('feedback')}
                </h3>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <label htmlFor="feedbackEn" className="text-[12.5px] font-medium" style={{ color: ink2 }}>
                      {t('feedbackEn')}
                    </label>
                    <textarea
                      id="feedbackEn"
                      name="feedbackEn"
                      rows={4}
                      dir="ltr"
                      placeholder="Great work on..."
                      defaultValue={existingFeedbackEn}
                      disabled={isSaving}
                      className={`${fieldBase} min-h-[110px] resize-y leading-[1.55]`}
                      style={{ borderColor: line2 }}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="feedbackAr" className="text-[12.5px] font-medium" style={{ color: ink2 }}>
                      {t('feedbackAr')}
                    </label>
                    <textarea
                      id="feedbackAr"
                      name="feedbackAr"
                      rows={4}
                      dir="rtl"
                      placeholder="عمل رائع على..."
                      defaultValue={existingFeedbackAr}
                      disabled={isSaving}
                      className={`${fieldBase} min-h-[110px] resize-y leading-[1.55]`}
                      style={{ borderColor: line2 }}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t pt-5" style={{ borderColor: line }}>
                <button type="button" onClick={() => router.back()} disabled={isSaving} className={btnOutline}>
                  {t('cancel')}
                </button>
                <button type="submit" disabled={isSaving} className={btnPrimary}>
                  {isSaving ? t('submitting') : t('submitScore')}
                </button>
              </div>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
}
