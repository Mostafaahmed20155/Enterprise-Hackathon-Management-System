'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { submissionsApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { ArrowLeft, Save, Upload, Trash2 } from 'lucide-react';
import { Link } from '@/i18n/routing';

type BilingualText = string | { en: string; ar: string };

interface Submission {
  id: string;
  title: BilingualText;
  description: BilingualText;
  status: string;
  demoUrl?: string;
  repoUrl?: string;
  videoUrl?: string;
  team: { id: string; name: BilingualText };
  files: Array<{
    id: string;
    fileName: string;
    fileSize: number;
    fileUrl: string;
  }>;
}

function getText(value: BilingualText | undefined, locale: string): string {
  if (!value) return '';
  if (typeof value === 'string') return value;
  return value[locale as 'en' | 'ar'] || value.en || '';
}

export default function EditSubmissionPage() {
  const params = useParams();
  const router = useRouter();
  const t = useTranslations('submissions');
  const locale = useLocale();
  const submissionId = params.id as string;

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submission, setSubmission] = useState<Submission | null>(null);

  // Form state
  const [titleEn, setTitleEn] = useState('');
  const [titleAr, setTitleAr] = useState('');
  const [descriptionEn, setDescriptionEn] = useState('');
  const [descriptionAr, setDescriptionAr] = useState('');
  const [demoUrl, setDemoUrl] = useState('');
  const [repoUrl, setRepoUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');

  useEffect(() => {
    loadSubmission();
  }, [submissionId]);

  const loadSubmission = async () => {
    try {
      setIsLoading(true);
      const response = await submissionsApi.getById(submissionId);
      const data: Submission = response.data;
      setSubmission(data);

      // Populate form fields
      if (typeof data.title === 'object') {
        setTitleEn(data.title.en || '');
        setTitleAr(data.title.ar || '');
      } else {
        setTitleEn(data.title || '');
      }

      if (typeof data.description === 'object') {
        setDescriptionEn(data.description.en || '');
        setDescriptionAr(data.description.ar || '');
      } else {
        setDescriptionEn(data.description || '');
      }

      setDemoUrl(data.demoUrl || '');
      setRepoUrl(data.repoUrl || '');
      setVideoUrl(data.videoUrl || '');
    } catch (err: any) {
      setError(err.response?.data?.message || t('loadError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    const payload: any = {};

    if (titleEn || titleAr) {
      payload.title = { en: titleEn, ar: titleAr };
    }
    if (descriptionEn || descriptionAr) {
      payload.description = { en: descriptionEn, ar: descriptionAr };
    }
    if (demoUrl !== undefined) payload.demoUrl = demoUrl || null;
    if (repoUrl !== undefined) payload.repoUrl = repoUrl || null;
    if (videoUrl !== undefined) payload.videoUrl = videoUrl || null;

    const promise = submissionsApi.update(submissionId, payload);

    toast.promise(promise, {
      loading: t('saving'),
      success: () => {
        router.push(`/submissions/${submissionId}`);
        return t('saveSuccess');
      },
      error: (err: any) => {
        const msg = err.response?.data?.message;
        return typeof msg === 'object'
          ? (msg[locale] || msg.en || t('saveError'))
          : (msg || t('saveError'));
      },
    });

    promise.finally(() => setIsSaving(false));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    toast.promise(
      async () => {
        try {
          await submissionsApi.uploadFile(submissionId, file);
          await loadSubmission();
        } finally {
          setIsUploading(false);
          e.target.value = '';
        }
      },
      {
        loading: 'Uploading file...',
        success: 'File uploaded successfully',
        error: (err: any) => err.response?.data?.message || err.message || 'Failed to upload file',
      },
    );
  };

  const handleDeleteFile = async (fileId: string) => {
    toast.promise(
      async () => {
        await submissionsApi.deleteFile(submissionId, fileId);
        await loadSubmission();
      },
      {
        loading: t('deleting'),
        success: t('deleteFileSuccess'),
        error: (err: any) => err.response?.data?.message || t('deleteFileError'),
      }
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">{t('loading')}</p>
        </div>
      </div>
    );
  }

  if (error || !submission) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400">{error || t('notFound')}</p>
        </div>
      </div>
    );
  }

  if (submission.status !== 'DRAFT') {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <p className="text-gray-600 dark:text-gray-400 text-lg mb-4">
          {locale === 'ar'
            ? 'لا يمكن تعديل المشروع بعد التقديم النهائي'
            : 'This submission cannot be edited after final submission.'}
        </p>
        <Link href={`/submissions/${submissionId}`}>
          <Button variant="outline">{locale === 'ar' ? 'العودة' : 'Go Back'}</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-center gap-4">
        <Link href={`/submissions/${submissionId}`}>
          <Button variant="ghost" size="sm" className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
            {locale === 'ar' ? 'العودة' : 'Back'}
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('editSubmission')}</h1>
          <p className="text-sm text-gray-500">{getText(submission.team.name, locale)}</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Project Details */}
        <Card>
          <CardHeader>
            <CardTitle>{t('projectDetails')}</CardTitle>
            <CardDescription>{t('fillBothLanguages')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('titleEn')}
                </label>
                <input
                  type="text"
                  value={titleEn}
                  onChange={(e) => setTitleEn(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  dir="ltr"
                  placeholder="Project title in English"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('titleAr')}
                </label>
                <input
                  type="text"
                  value={titleAr}
                  onChange={(e) => setTitleAr(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  dir="rtl"
                  placeholder="عنوان المشروع بالعربية"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('descriptionEn')}
                </label>
                <textarea
                  value={descriptionEn}
                  onChange={(e) => setDescriptionEn(e.target.value)}
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y"
                  dir="ltr"
                  placeholder="Describe your project in English"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('descriptionAr')}
                </label>
                <textarea
                  value={descriptionAr}
                  onChange={(e) => setDescriptionAr(e.target.value)}
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y"
                  dir="rtl"
                  placeholder="صف مشروعك بالعربية"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Project Links */}
        <Card>
          <CardHeader>
            <CardTitle>{t('projectLinks')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('demoUrl')} <span className="text-gray-400">({t('optional')})</span>
              </label>
              <input
                type="url"
                value={demoUrl}
                onChange={(e) => setDemoUrl(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                dir="ltr"
                placeholder="https://your-demo.example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('repoUrl')} <span className="text-gray-400">({t('optional')})</span>
              </label>
              <input
                type="url"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                dir="ltr"
                placeholder="https://github.com/your-org/your-repo"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('videoUrl')} <span className="text-gray-400">({t('optional')})</span>
              </label>
              <input
                type="url"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                dir="ltr"
                placeholder="https://youtube.com/watch?v=..."
              />
            </div>
          </CardContent>
        </Card>

        {/* Files */}
        <Card>
          <CardHeader>
            <CardTitle>{t('projectFiles')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Existing files */}
            {submission.files.length > 0 && (
              <div className="space-y-2">
                {submission.files.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">📎</span>
                      <div>
                        <p className="font-medium text-sm text-gray-900 dark:text-white">{file.fileName}</p>
                        <p className="text-xs text-gray-500">{(file.fileSize / 1024).toFixed(2)} KB</p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteFile(file.id)}
                      className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Upload new file */}
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10 transition-colors">
              <div className="flex flex-col items-center justify-center gap-2">
                <Upload className="w-6 h-6 text-gray-400" />
                <span className="text-sm text-gray-500">
                  {isUploading
                    ? (locale === 'ar' ? 'جاري الرفع...' : 'Uploading...')
                    : (locale === 'ar' ? 'اضغط لرفع ملف' : 'Click to upload a file')}
                </span>
              </div>
              <input
                type="file"
                className="hidden"
                onChange={handleFileUpload}
                disabled={isUploading}
              />
            </label>
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex items-center justify-end gap-3 pb-8">
          <Link href={`/submissions/${submissionId}`}>
            <Button type="button" variant="outline">{t('cancel')}</Button>
          </Link>
          <Button type="submit" disabled={isSaving} className="flex items-center gap-2">
            <Save className="w-4 h-4" />
            {isSaving ? t('saving') : t('saveChanges')}
          </Button>
        </div>
      </form>
    </div>
  );
}
