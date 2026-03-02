'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { teamsApi, submissionsApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const submissionSchema = z.object({
  titleEn: z.string().min(3, 'English title must be at least 3 characters'),
  titleAr: z.string().min(3, 'Arabic title must be at least 3 characters'),
  descriptionEn: z.string().min(20, 'English description must be at least 20 characters'),
  descriptionAr: z.string().min(20, 'Arabic description must be at least 20 characters'),
  demoUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  repoUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  videoUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
});

type SubmissionFormData = z.infer<typeof submissionSchema>;

interface Team {
  id: string;
  name: string;
  event: {
    id: string;
    name: string;
  };
}

export default function CreateSubmissionPage() {
  const params = useParams();
  const router = useRouter();
  const t = useTranslations('submissions');
  const [team, setTeam] = useState<Team | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [files, setFiles] = useState<File[]>([]);

  const teamId = params.id as string;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SubmissionFormData>({
    resolver: zodResolver(submissionSchema),
  });

  useEffect(() => {
    loadTeam();
  }, [teamId]);

  const loadTeam = async () => {
    try {
      const data = await teamsApi.getById(teamId);
      setTeam(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load team');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const onSubmit = async (data: SubmissionFormData) => {
    try {
      setIsLoading(true);
      setError(null);

      const submission = await submissionsApi.create({
        teamId,
        title: {
          en: data.titleEn,
          ar: data.titleAr,
        },
        description: {
          en: data.descriptionEn,
          ar: data.descriptionAr,
        },
        demoUrl: data.demoUrl || undefined,
        repoUrl: data.repoUrl || undefined,
        videoUrl: data.videoUrl || undefined,
      });

      // Upload files if any
      if (files.length > 0) {
        for (const file of files) {
          await submissionsApi.uploadFile(submission.id, file);
        }
      }

      router.push(`/submissions/${submission.id}`);
    } catch (err: any) {
      setError(err.response?.data?.message || t('createError'));
    } finally {
      setIsLoading(false);
    }
  };

  if (!team) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('createSubmission')}</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          {t('teamLabel')}: {team.name} · {t('eventLabel')}: {team.event.name}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('projectDetails')}</CardTitle>
          <CardDescription>{t('fillBothLanguages')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-md text-sm">
                {error}
              </div>
            )}

            {/* Project Title */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">{t('projectTitle')}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="titleEn">{t('titleEn')}</Label>
                  <Input
                    id="titleEn"
                    placeholder="Smart City Dashboard"
                    {...register('titleEn')}
                    disabled={isLoading}
                  />
                  {errors.titleEn && (
                    <p className="text-sm text-red-600 dark:text-red-400">{errors.titleEn.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="titleAr">{t('titleAr')}</Label>
                  <Input
                    id="titleAr"
                    placeholder="لوحة تحكم المدينة الذكية"
                    {...register('titleAr')}
                    disabled={isLoading}
                  />
                  {errors.titleAr && (
                    <p className="text-sm text-red-600 dark:text-red-400">{errors.titleAr.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Project Description */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">{t('projectDescription')}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="descriptionEn">{t('descriptionEn')}</Label>
                  <textarea
                    id="descriptionEn"
                    rows={6}
                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Our project aims to solve..."
                    {...register('descriptionEn')}
                    disabled={isLoading}
                  />
                  {errors.descriptionEn && (
                    <p className="text-sm text-red-600 dark:text-red-400">{errors.descriptionEn.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="descriptionAr">{t('descriptionAr')}</Label>
                  <textarea
                    id="descriptionAr"
                    rows={6}
                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="يهدف مشروعنا إلى حل..."
                    {...register('descriptionAr')}
                    disabled={isLoading}
                  />
                  {errors.descriptionAr && (
                    <p className="text-sm text-red-600 dark:text-red-400">{errors.descriptionAr.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* URLs */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">{t('projectLinks')}</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="demoUrl">{t('demoUrl')} ({t('optional')})</Label>
                  <Input
                    id="demoUrl"
                    type="url"
                    placeholder="https://demo.example.com"
                    {...register('demoUrl')}
                    disabled={isLoading}
                  />
                  {errors.demoUrl && (
                    <p className="text-sm text-red-600 dark:text-red-400">{errors.demoUrl.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="repoUrl">{t('repoUrl')} ({t('optional')})</Label>
                  <Input
                    id="repoUrl"
                    type="url"
                    placeholder="https://github.com/username/repo"
                    {...register('repoUrl')}
                    disabled={isLoading}
                  />
                  {errors.repoUrl && (
                    <p className="text-sm text-red-600 dark:text-red-400">{errors.repoUrl.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="videoUrl">{t('videoUrl')} ({t('optional')})</Label>
                  <Input
                    id="videoUrl"
                    type="url"
                    placeholder="https://youtube.com/watch?v=..."
                    {...register('videoUrl')}
                    disabled={isLoading}
                  />
                  {errors.videoUrl && (
                    <p className="text-sm text-red-600 dark:text-red-400">{errors.videoUrl.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* File Upload */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">{t('projectFiles')}</h3>
              <div className="space-y-2">
                <Label htmlFor="files">{t('uploadFiles')} ({t('optional')})</Label>
                <Input
                  id="files"
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  disabled={isLoading}
                  className="cursor-pointer"
                />
                {files.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {files.map((file, index) => (
                      <p key={index} className="text-sm text-gray-600 dark:text-gray-400">
                        📎 {file.name} ({(file.size / 1024).toFixed(2)} KB)
                      </p>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end space-s-4">
              <Button type="button" variant="outline" onClick={() => router.back()} disabled={isLoading}>
                {t('cancel')}
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? t('creating') : t('createSubmission')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
