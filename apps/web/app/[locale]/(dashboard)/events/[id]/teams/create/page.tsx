'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useRouter } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { teamsApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const createTeamSchema = z.object({
  nameEn: z.string().min(3, 'English name must be at least 3 characters'),
  nameAr: z.string().min(3, 'Arabic name must be at least 3 characters'),
  descriptionEn: z.string().min(10, 'English description must be at least 10 characters'),
  descriptionAr: z.string().min(10, 'Arabic description must be at least 10 characters'),
});

type CreateTeamFormData = z.infer<typeof createTeamSchema>;

export default function CreateTeamPage() {
  const params = useParams();
  const router = useRouter();
  const t = useTranslations('teams');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const eventId = params.id as string;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateTeamFormData>({
    resolver: zodResolver(createTeamSchema),
  });

  const onSubmit = async (data: CreateTeamFormData) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await teamsApi.create({
        eventId,
        name: {
          en: data.nameEn,
          ar: data.nameAr,
        },
        description: {
          en: data.descriptionEn,
          ar: data.descriptionAr,
        },
      });

      // Extract team data from axios response
      const team = response.data?.data || response.data;
      router.push(`/teams/${team.id}`);
    } catch (err: any) {
      setError(err.response?.data?.error?.message?.en || err.response?.data?.message || t('createError'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('createTeam')}</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">{t('createTeamDescription')}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('teamDetails')}</CardTitle>
          <CardDescription>{t('fillBothLanguages')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-md text-sm">
                {error}
              </div>
            )}

            {/* Team Name */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">{t('teamName')}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nameEn">{t('nameEn')}</Label>
                  <Input
                    id="nameEn"
                    placeholder="Code Warriors"
                    {...register('nameEn')}
                    disabled={isLoading}
                  />
                  {errors.nameEn && (
                    <p className="text-sm text-red-600 dark:text-red-400">{errors.nameEn.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nameAr">{t('nameAr')}</Label>
                  <Input
                    id="nameAr"
                    placeholder="محاربو الكود"
                    {...register('nameAr')}
                    disabled={isLoading}
                  />
                  {errors.nameAr && (
                    <p className="text-sm text-red-600 dark:text-red-400">{errors.nameAr.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Team Description */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">{t('teamDescription')}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="descriptionEn">{t('descriptionEn')}</Label>
                  <textarea
                    id="descriptionEn"
                    rows={4}
                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="We are passionate about building innovative solutions..."
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
                    rows={4}
                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="نحن متحمسون لبناء حلول مبتكرة..."
                    {...register('descriptionAr')}
                    disabled={isLoading}
                  />
                  {errors.descriptionAr && (
                    <p className="text-sm text-red-600 dark:text-red-400">{errors.descriptionAr.message}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end space-s-4">
              <Button type="button" variant="outline" onClick={() => router.back()} disabled={isLoading}>
                {t('cancel')}
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? t('creating') : t('createTeam')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
