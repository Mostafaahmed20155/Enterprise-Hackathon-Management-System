'use client';

import { useState } from 'react';
import { useRouter } from '@/i18n/routing';
import { useTranslations, useLocale } from 'next-intl';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { eventsApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Clock, Users, FileText, Plus, X, Sparkles } from 'lucide-react';

const createEventSchema = z.object({
  nameEn: z.string().min(3, 'English name must be at least 3 characters'),
  nameAr: z.string().min(3, 'Arabic name must be at least 3 characters'),
  descriptionEn: z.string().min(10, 'English description must be at least 10 characters'),
  descriptionAr: z.string().min(10, 'Arabic description must be at least 10 characters'),
  registrationStart: z.string(),
  registrationEnd: z.string(),
  hackingStart: z.string(),
  hackingEnd: z.string(),
  maxTeamSize: z.number().min(1).max(20),
  minTeamSize: z.number().min(1).max(20),
});

type CreateEventFormData = z.infer<typeof createEventSchema>;

export default function CreateEventPage() {
  const t = useTranslations('events');
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateEventFormData>({
    resolver: zodResolver(createEventSchema),
    defaultValues: {
      maxTeamSize: 5,
      minTeamSize: 2,
    },
  });

  const onSubmit = async (data: CreateEventFormData) => {
    try {
      setIsLoading(true);
      setError(null);

      const event = await eventsApi.create({
        name: {
          en: data.nameEn,
          ar: data.nameAr,
        },
        description: {
          en: data.descriptionEn,
          ar: data.descriptionAr,
        },
        registrationStart: new Date(data.registrationStart).toISOString(),
        registrationEnd: new Date(data.registrationEnd).toISOString(),
        hackingStart: new Date(data.hackingStart).toISOString(),
        hackingEnd: new Date(data.hackingEnd).toISOString(),
        maxTeamSize: Number(data.maxTeamSize),
        minTeamSize: Number(data.minTeamSize),
        allowLateSubmissions: false,
      });

      router.push(`/events/${event.data?.id}`);
    } catch (err: any) {
      setError(err.response?.data?.message || t('createError'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Page Header */}
      <div className="mb-8 relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-purple-600 to-indigo-700 p-8 text-white shadow-xl">
        <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,transparent,black)] opacity-30" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-lg">
              <Plus className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-3xl font-bold">{t('createEvent')}</h1>
          </div>
          <p className="text-indigo-100 text-lg">{t('createEventDescription')}</p>
        </div>
      </div>

      <Card className="card-modern">
        <CardHeader>
          <CardTitle>{t('eventDetails')}</CardTitle>
          <CardDescription>{t('fillBothLanguages')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-md text-sm">
                {error}
              </div>
            )}

            {/* Event Name */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center shadow-sm">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('eventName')}</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nameEn">{t('nameEn')}</Label>
                  <Input
                    id="nameEn"
                    placeholder="Tech Hackathon 2024"
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
                    placeholder="هاكاثون التقنية 2024"
                    {...register('nameAr')}
                    disabled={isLoading}
                  />
                  {errors.nameAr && (
                    <p className="text-sm text-red-600 dark:text-red-400">{errors.nameAr.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Event Description */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center shadow-sm">
                  <FileText className="w-4 h-4 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('eventDescription')}</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="descriptionEn">{t('descriptionEn')}</Label>
                  <textarea
                    id="descriptionEn"
                    rows={4}
                    className="flex w-full rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm font-medium text-gray-900 dark:text-white transition-all duration-200 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus-visible:outline-none focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/10 hover:border-gray-300 dark:hover:border-gray-600 disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-50 dark:disabled:bg-gray-900"
                    placeholder="A 48-hour innovation challenge..."
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
                    className="flex w-full rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm font-medium text-gray-900 dark:text-white transition-all duration-200 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus-visible:outline-none focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/10 hover:border-gray-300 dark:hover:border-gray-600 disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-50 dark:disabled:bg-gray-900"
                    placeholder="تحدي ابتكار لمدة 48 ساعة..."
                    {...register('descriptionAr')}
                    disabled={isLoading}
                  />
                  {errors.descriptionAr && (
                    <p className="text-sm text-red-600 dark:text-red-400">{errors.descriptionAr.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Registration Dates */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center shadow-sm">
                  <Calendar className="w-4 h-4 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('registrationPeriod')}</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="registrationStart">{t('registrationStart')}</Label>
                  <Input
                    id="registrationStart"
                    type="datetime-local"
                    {...register('registrationStart')}
                    disabled={isLoading}
                  />
                  {errors.registrationStart && (
                    <p className="text-sm text-red-600 dark:text-red-400">{errors.registrationStart.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="registrationEnd">{t('registrationEnd')}</Label>
                  <Input
                    id="registrationEnd"
                    type="datetime-local"
                    {...register('registrationEnd')}
                    disabled={isLoading}
                  />
                  {errors.registrationEnd && (
                    <p className="text-sm text-red-600 dark:text-red-400">{errors.registrationEnd.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Hacking Dates */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg flex items-center justify-center shadow-sm">
                  <Clock className="w-4 h-4 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('hackingPeriod')}</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="hackingStart">{t('hackingStart')}</Label>
                  <Input
                    id="hackingStart"
                    type="datetime-local"
                    {...register('hackingStart')}
                    disabled={isLoading}
                  />
                  {errors.hackingStart && (
                    <p className="text-sm text-red-600 dark:text-red-400">{errors.hackingStart.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hackingEnd">{t('hackingEnd')}</Label>
                  <Input
                    id="hackingEnd"
                    type="datetime-local"
                    {...register('hackingEnd')}
                    disabled={isLoading}
                  />
                  {errors.hackingEnd && (
                    <p className="text-sm text-red-600 dark:text-red-400">{errors.hackingEnd.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Team Size */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-lg flex items-center justify-center shadow-sm">
                  <Users className="w-4 h-4 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('teamSize')}</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="minTeamSize">{t('minTeamSize')}</Label>
                  <Input
                    id="minTeamSize"
                    type="number"
                    min="1"
                    max="20"
                    {...register('minTeamSize', { valueAsNumber: true })}
                    disabled={isLoading}
                  />
                  {errors.minTeamSize && (
                    <p className="text-sm text-red-600 dark:text-red-400">{errors.minTeamSize.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxTeamSize">{t('maxTeamSize')}</Label>
                  <Input
                    id="maxTeamSize"
                    type="number"
                    min="1"
                    max="20"
                    {...register('maxTeamSize', { valueAsNumber: true })}
                    disabled={isLoading}
                  />
                  {errors.maxTeamSize && (
                    <p className="text-sm text-red-600 dark:text-red-400">{errors.maxTeamSize.message}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-4">
              <Button type="button" variant="outline" onClick={() => router.back()} disabled={isLoading} size="lg">
                <X className="w-4 h-4 me-2" />
                {t('cancel')}
              </Button>
              <Button type="submit" disabled={isLoading} size="lg" className="group">
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent me-2" />
                    {t('creating')}
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 me-2" />
                    {t('createEvent')}
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
