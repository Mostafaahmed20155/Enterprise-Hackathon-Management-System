'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { judgingApi, api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

type BilingualText = string | { en: string; ar: string };

interface Criterion {
  // After LocalizeResponseInterceptor, `name` is a plain string.
  // We always fetch with Accept-Language: en so it's the English name (stable score key).
  name: string;
  description?: string;
  maxScore: number;
  weight: number;
}

interface ScoredSubmission {
  id: string;
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

      // Fetch assignment with EN locale so criterion names are always English
      // (used as stable keys in the scores JSON — must match stored keys)
      const [assignmentRes, submissionsRes] = await Promise.all([
        api.get(`/judging/assignments/${assignmentId}`, { headers: { 'Accept-Language': 'en' } }),
        judgingApi.getSubmissionsForJudge(assignmentId),
      ]);

      const assignment = assignmentRes.data;
      const submissions: ScoredSubmission[] = Array.isArray(submissionsRes.data)
        ? submissionsRes.data
        : (submissionsRes.data?.data || []);

      const submission = submissionId
        ? submissions.find((s) => s.id === submissionId)
        : submissions[0];

      if (!submission) {
        setError(
          locale === 'ar' ? 'المشروع غير موجود' : 'Submission not found'
        );
        return;
      }

      const criteria: Criterion[] = Array.isArray(assignment.criteria)
        ? assignment.criteria
        : [];
      const existing = submission.scores[0];

      // `feedback` is stored as { en, ar } in DB but the interceptor localizes it.
      // We need both EN and AR for the bilingual feedback form, so fetch submissions
      // with Accept-Language: en to get the EN feedback, then also with AR for AR.
      // Simpler: store raw feedback if available, otherwise show empty.
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
        typeof msg === 'object' ? (msg[locale] || msg.en || t('loadError')) : (msg || t('loadError'))
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
      // Update existing score
      promise = judgingApi.updateScore(data.existingScoreId, { scores, feedback });
    } else {
      // Submit new score
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
          ? (errorMessage[locale] || errorMessage.en || t('submitError'))
          : (errorMessage || t('submitError'));
      },
    });

    promise.finally(() => setIsSaving(false));
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

  if (error || !data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400">{error || t('notFound')}</p>
          <Button onClick={loadData} className="mt-4">{t('retry')}</Button>
        </div>
      </div>
    );
  }

  const { assignmentCriteria, submission, existingScoreId, existingScores, existingFeedbackEn, existingFeedbackAr } = data;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          {existingScoreId ? t('editScore') : t('scoreSubmission')}
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          {getText(submission.title, locale)} · {getText(submission.team.name, locale)}
        </p>
      </div>

      <div className="space-y-6">
        {/* Submission Info */}
        <Card>
          <CardHeader>
            <CardTitle>{t('submissionDetails')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
              {getText(submission.description, locale)}
            </p>
            <div className="mt-4">
              <a
                href={`/${locale}/submissions/${submission.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary dark:text-green-300 hover:underline"
              >
                {locale === 'ar' ? 'عرض المشروع الكامل ←' : 'View full submission →'}
              </a>
            </div>
          </CardContent>
        </Card>

        {/* Scoring Form */}
        <Card>
          <CardHeader>
            <CardTitle>{t('scoringCriteria')}</CardTitle>
            <CardDescription>{t('scoringDescription')}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Criteria Scores */}
              {assignmentCriteria.map((criterion, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor={`score_${index}`} className="font-semibold">
                      {criterion.name}
                      {' '}
                      <span className="font-normal text-gray-500">
                        ({criterion.weight * 100}% {t('weight')})
                      </span>
                    </Label>
                    <span className="text-sm text-gray-500">
                      {t('max')}: {criterion.maxScore}
                    </span>
                  </div>
                  {criterion.description && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {criterion.description}
                    </p>
                  )}
                  <Input
                    id={`score_${index}`}
                    name={`score_${index}`}
                    type="number"
                    min="0"
                    max={criterion.maxScore}
                    step="0.5"
                    defaultValue={existingScores[criterion.name] ?? 0}
                    required
                    disabled={isSaving}
                  />
                </div>
              ))}

              {/* Feedback */}
              <div className="space-y-4 pt-2">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">{t('feedback')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="feedbackEn">{t('feedbackEn')}</Label>
                    <textarea
                      id="feedbackEn"
                      name="feedbackEn"
                      rows={4}
                      dir="ltr"
                      className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      placeholder="Great work on..."
                      defaultValue={existingFeedbackEn}
                      disabled={isSaving}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="feedbackAr">{t('feedbackAr')}</Label>
                    <textarea
                      id="feedbackAr"
                      name="feedbackAr"
                      rows={4}
                      dir="rtl"
                      className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      placeholder="عمل رائع على..."
                      defaultValue={existingFeedbackAr}
                      disabled={isSaving}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSaving}>
                  {t('cancel')}
                </Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? t('submitting') : t('submitScore')}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
