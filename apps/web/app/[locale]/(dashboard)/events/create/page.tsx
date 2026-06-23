'use client';

import type { ReactNode } from 'react';
import { useMemo, useState } from 'react';
import { Link, useRouter } from '@/i18n/routing';
import { useLocale, useTranslations } from 'next-intl';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { eventsApi } from '@/lib/api';
import {
  AlertCircle,
  Calendar,
  ChevronRight,
  Clock3,
  List,
  MessageSquare,
  Minus,
  Plus,
  Users,
  X,
} from 'lucide-react';

type DateField = 'registrationStart' | 'registrationEnd' | 'hackingStart' | 'hackingEnd';

const createEventSchema = z
  .object({
    nameEn: z
      .string()
      .min(3, 'English name must be at least 3 characters')
      .max(60, 'English name must be at most 60 characters'),
    nameAr: z
      .string()
      .min(3, 'Arabic name must be at least 3 characters')
      .max(60, 'Arabic name must be at most 60 characters'),
    descriptionEn: z
      .string()
      .min(10, 'English description must be at least 10 characters')
      .max(400, 'English description must be at most 400 characters'),
    descriptionAr: z
      .string()
      .min(10, 'Arabic description must be at least 10 characters')
      .max(400, 'Arabic description must be at most 400 characters'),
    registrationStart: z.string().min(1, 'Registration start is required'),
    registrationEnd: z.string().min(1, 'Registration end is required'),
    hackingStart: z.string().min(1, 'Hackathon start is required'),
    hackingEnd: z.string().min(1, 'Hackathon end is required'),
    maxTeamSize: z.number().min(2, 'Maximum team size must be at least 2').max(20),
    minTeamSize: z.number().min(1, 'Minimum team size must be at least 1').max(10),
  })
  .refine((data) => new Date(data.registrationEnd) > new Date(data.registrationStart), {
    message: 'Registration end must be after registration start',
    path: ['registrationEnd'],
  })
  .refine((data) => new Date(data.hackingStart) >= new Date(data.registrationEnd), {
    message: 'Hackathon start must be after registration end',
    path: ['hackingStart'],
  })
  .refine((data) => new Date(data.hackingEnd) > new Date(data.hackingStart), {
    message: 'Hackathon end must be after hackathon start',
    path: ['hackingEnd'],
  })
  .refine((data) => data.minTeamSize <= data.maxTeamSize, {
    message: 'Minimum team size must be less than or equal to maximum team size',
    path: ['minTeamSize'],
  });

type CreateEventFormData = z.infer<typeof createEventSchema>;

interface CreateEventCopy {
  toolbar: {
    root: string;
    events: string;
    current: string;
    cancel: string;
    submit: string;
    creating: string;
  };
  header: {
    title: string;
    accent: string;
    subtitle: string;
    badge: string;
  };
  sections: {
    names: string;
    namesBody: string;
    descriptions: string;
    descriptionsBody: string;
    registration: string;
    registrationBody: string;
    hacking: string;
    hackingBody: string;
    team: string;
    teamBody: string;
  };
  fields: {
    required: string;
    nameEnPlaceholder: string;
    nameArPlaceholder: string;
    descriptionEnPlaceholder: string;
    descriptionArPlaceholder: string;
    publicTitle: string;
    publicTitleAr: string;
    publicDescription: string;
    publicDescriptionAr: string;
    timezone: string;
    registrationRule: string;
    buildWindow: string;
    minHelp: string;
    maxHelp: string;
    preview: string;
    teamRange: string;
  };
  footer: {
    status: string;
    requiredHint: string;
  };
  misc: {
    days: string;
    hours: string;
    minutes: string;
    invalidDate: string;
  };
}

const CREATE_EVENT_COPY: Record<'en' | 'ar', CreateEventCopy> = {
  en: {
    toolbar: {
      root: 'Admin',
      events: 'Events',
      current: 'Create event',
      cancel: 'Cancel',
      submit: 'Create Event',
      creating: 'Creating...',
    },
    header: {
      title: 'Create',
      accent: 'event.',
      subtitle:
        'Set up a bilingual hackathon with registration windows, build dates, and team size limits.',
      badge: 'Bilingual setup',
    },
    sections: {
      names: 'Event name',
      namesBody: 'Public title in English and Arabic — both are required.',
      descriptions: 'Event description',
      descriptionsBody: 'One or two sentences per language about what participants should expect.',
      registration: 'Registration period',
      registrationBody: 'When can participants register for this event?',
      hacking: 'Hackathon period',
      hackingBody: 'The window when teams can build and submit their projects.',
      team: 'Team size',
      teamBody: 'Minimum and maximum members allowed per team.',
    },
    fields: {
      required: '*',
      nameEnPlaceholder: 'e.g. Tech Hackathon 2026',
      nameArPlaceholder: 'مثال: هاكاثون الرياض 2026',
      descriptionEnPlaceholder: 'Tell participants what this event is about…',
      descriptionArPlaceholder: 'صف الفعالية للمشاركين بالعربية…',
      publicTitle: 'Shown on listings and the public event page.',
      publicTitleAr: 'يظهر في القوائم والصفحة العامة.',
      publicDescription: 'Visible to mentors, judges, and participants.',
      publicDescriptionAr: 'مرئي للموجهين والمحكمين والمشاركين.',
      timezone: 'Stored as ISO timestamps on save.',
      registrationRule: 'Registration must end before hacking begins.',
      buildWindow: 'Build window',
      minHelp: 'At least 1 member.',
      maxHelp: 'Up to 20 members.',
      preview: 'Preview',
      teamRange: 'Teams of {min} – {max} members allowed',
    },
    footer: {
      status: '{complete} of {total} sections ready',
      requiredHint: 'Complete all required fields before creating the event.',
    },
    misc: {
      days: 'd',
      hours: 'h',
      minutes: 'm',
      invalidDate: 'Set both dates',
    },
  },
  ar: {
    toolbar: {
      root: 'الإدارة',
      events: 'الفعاليات',
      current: 'إنشاء فعالية',
      cancel: 'إلغاء',
      submit: 'إنشاء الفعالية',
      creating: 'جاري الإنشاء...',
    },
    header: {
      title: 'إنشاء',
      accent: 'فعالية.',
      subtitle:
        'أعدّ فعالية هاكاثون ثنائية اللغة مع نوافذ التسجيل وتواريخ البناء وحدود حجم الفريق.',
      badge: 'إعداد ثنائي اللغة',
    },
    sections: {
      names: 'اسم الفعالية',
      namesBody: 'العنوان العام بالإنجليزية والعربية — كلاهما مطلوب.',
      descriptions: 'وصف الفعالية',
      descriptionsBody: 'جملة أو جملتان لكل لغة عما ينتظره المشاركون.',
      registration: 'فترة التسجيل',
      registrationBody: 'متى يمكن للمشاركين التسجيل؟',
      hacking: 'فترة الهاكاثون',
      hackingBody: 'النافذة التي يمكن خلالها للفرق البناء والتقديم.',
      team: 'حجم الفريق',
      teamBody: 'الحد الأدنى والأقصى للأعضاء في كل فريق.',
    },
    fields: {
      required: '*',
      nameEnPlaceholder: 'مثال: Tech Hackathon 2026',
      nameArPlaceholder: 'مثال: هاكاثون الرياض 2026',
      descriptionEnPlaceholder: 'صف الفعالية بالإنجليزية…',
      descriptionArPlaceholder: 'صف الفعالية بالعربية…',
      publicTitle: 'يظهر في القوائم والصفحة العامة.',
      publicTitleAr: 'يظهر في القوائم والصفحة العامة.',
      publicDescription: 'مرئي للموجهين والمحكمين والمشاركين.',
      publicDescriptionAr: 'مرئي للموجهين والمحكمين والمشاركين.',
      timezone: 'يُحفظ كتوقيت ISO عند الإرسال.',
      registrationRule: 'يجب أن ينتهي التسجيل قبل بدء الهاكاثون.',
      buildWindow: 'نافذة البناء',
      minHelp: 'عضو واحد على الأقل.',
      maxHelp: 'حتى 20 عضوا.',
      preview: 'معاينة',
      teamRange: 'فرق من {min} – {max} أعضاء',
    },
    footer: {
      status: '{complete} من {total} أقسام جاهزة',
      requiredHint: 'أكمل جميع الحقول المطلوبة قبل إنشاء الفعالية.',
    },
    misc: {
      days: 'ي',
      hours: 'س',
      minutes: 'د',
      invalidDate: 'أدخل التاريخين',
    },
  },
};

function formatDuration(
  start: string | undefined,
  end: string | undefined,
  copy: CreateEventCopy['misc']
): string {
  if (!start || !end) {
    return copy.invalidDate;
  }

  const startDate = new Date(start);
  const endDate = new Date(end);

  if (
    Number.isNaN(startDate.getTime()) ||
    Number.isNaN(endDate.getTime()) ||
    endDate <= startDate
  ) {
    return copy.invalidDate;
  }

  const diff = endDate.getTime() - startDate.getTime();
  const totalMinutes = Math.floor(diff / 60000);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;
  const parts: string[] = [];

  if (days > 0) {
    parts.push(`${days}${copy.days}`);
  }

  if (hours > 0) {
    parts.push(`${hours}${copy.hours}`);
  }

  if (days === 0 && minutes > 0) {
    parts.push(`${minutes}${copy.minutes}`);
  }

  return parts.join(' ') || copy.invalidDate;
}

function extractApiMessage(message: unknown, locale: string, fallback: string): string {
  if (!message) {
    return fallback;
  }

  if (typeof message === 'string') {
    return message;
  }

  if (typeof message === 'object') {
    const localized = message as { en?: string; ar?: string };
    return localized[locale as 'en' | 'ar'] || localized.en || localized.ar || fallback;
  }

  return fallback;
}

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
const mono = "font-[family-name:var(--font-mono-display),ui-monospace,monospace]";
const displaySerif = "font-[family-name:var(--font-display),ui-serif,Georgia,serif]";

export default function CreateEventPage() {
  const t = useTranslations('events');
  const locale = useLocale();
  const isRtl = locale === 'ar';
  const copy = CREATE_EVENT_COPY[isRtl ? 'ar' : 'en'];
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<CreateEventFormData>({
    resolver: zodResolver(createEventSchema),
    defaultValues: {
      nameEn: '',
      nameAr: '',
      descriptionEn: '',
      descriptionAr: '',
      registrationStart: '',
      registrationEnd: '',
      hackingStart: '',
      hackingEnd: '',
      maxTeamSize: 5,
      minTeamSize: 2,
    },
  });

  const watchedValues = useWatch({ control });
  const nameEn = watchedValues.nameEn ?? '';
  const nameAr = watchedValues.nameAr ?? '';
  const descriptionEn = watchedValues.descriptionEn ?? '';
  const descriptionAr = watchedValues.descriptionAr ?? '';
  const registrationStart = watchedValues.registrationStart ?? '';
  const registrationEnd = watchedValues.registrationEnd ?? '';
  const hackingStart = watchedValues.hackingStart ?? '';
  const hackingEnd = watchedValues.hackingEnd ?? '';
  const minTeamSize = Math.max(1, Math.min(10, Number(watchedValues.minTeamSize ?? 2) || 2));
  const maxTeamSize = Math.max(2, Math.min(20, Number(watchedValues.maxTeamSize ?? 5) || 5));

  const steps = useMemo(
    () => [
      {
        complete:
          nameEn.trim().length >= 3 &&
          nameAr.trim().length >= 3 &&
          descriptionEn.trim().length >= 10 &&
          descriptionAr.trim().length >= 10,
      },
      {
        complete: Boolean(registrationStart && registrationEnd),
      },
      {
        complete: Boolean(hackingStart && hackingEnd),
      },
      {
        complete: minTeamSize >= 1 && maxTeamSize >= minTeamSize,
      },
    ],
    [
      descriptionAr,
      descriptionEn,
      hackingEnd,
      hackingStart,
      maxTeamSize,
      minTeamSize,
      nameAr,
      nameEn,
      registrationEnd,
      registrationStart,
    ]
  );

  const completedSteps = steps.filter((step) => step.complete).length;
  const visibleTeamSlots = Math.min(Math.max(maxTeamSize, 7), 10);

  const updateDateField = (field: DateField, value: string) => {
    setValue(field, value, {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  const clearDateField = (field: DateField) => {
    updateDateField(field, '');
  };

  const updateMinTeamSize = (nextValue: number) => {
    const safeValue = Math.max(1, Math.min(10, nextValue));
    setValue('minTeamSize', safeValue, {
      shouldDirty: true,
      shouldValidate: true,
    });

    if (maxTeamSize < safeValue) {
      setValue('maxTeamSize', safeValue, {
        shouldDirty: true,
        shouldValidate: true,
      });
    }
  };

  const updateMaxTeamSize = (nextValue: number) => {
    const safeValue = Math.max(minTeamSize, Math.min(20, nextValue));
    setValue('maxTeamSize', safeValue, {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  const onSubmit = async (data: CreateEventFormData) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await eventsApi.create({
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

      const eventId = response.data?.id || response.data?.data?.id;
      router.push(`/events/${eventId}`);
    } catch (submitError: unknown) {
      const err = submitError as { response?: { data?: { error?: { message?: unknown }; message?: unknown } } };
      const message = err?.response?.data?.error?.message || err?.response?.data?.message;
      setError(extractApiMessage(message, locale, t('createError')));
    } finally {
      setIsLoading(false);
    }
  };

  const inp =
    'w-full rounded-[10px] border bg-[#FCFCFA] px-3.5 py-2.5 text-sm text-[#0A0A0A] outline-none transition-colors hover:bg-white focus:border-[#0A0A0A] focus:bg-white focus:shadow-[0_0_0_3px_rgba(10,10,10,.05)] disabled:opacity-60';
  const inpErr = 'border-[oklch(0.62_0.22_25)] bg-white';
  const inpNorm = 'border-[rgba(10,10,10,.14)]';
  const tar = `${inp} min-h-[110px] resize-y leading-[1.55]`;

  const langEn = `rounded-[5px] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em] ${mono} bg-[#0A0A0A] text-[oklch(0.85_0.17_130)]`;
  const langAr = `rounded-[5px] border border-[oklch(0.85_0.17_130/0.3)] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em] ${mono} bg-[oklch(0.93_0.09_130)] text-[#0A0A0A]`;

  const secHead = (
    icon: ReactNode,
    title: string,
    subtitle: string
  ) => (
    <div className="flex gap-3.5 border-b px-6 py-5 sm:px-6" style={{ borderColor: line }}>
      <div
        className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[10px] border text-[#0A0A0A]"
        style={{
          backgroundColor: accentSoft,
          borderColor: 'oklch(0.85 0.17 130 / 0.3)',
        }}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <h3 className="text-[17px] font-semibold tracking-[-0.015em]" style={{ color: ink }}>
          {title}
        </h3>
        <p className="mt-1 text-[13px] leading-snug" style={{ color: muted }}>
          {subtitle}
        </p>
      </div>
    </div>
  );

  return (
    <div className="pb-20 [-webkit-font-smoothing:antialiased]" style={{ backgroundColor: bgPage, color: ink }}>
      <div className="mx-auto max-w-[1100px] px-4 py-7 sm:px-8 sm:py-8">
        {/* Top bar */}
        <div
          className="mb-7 flex flex-col gap-3 border-b pb-4 sm:flex-row sm:items-center sm:justify-between"
          style={{ borderColor: line }}
        >
          <div className="flex flex-wrap items-center gap-2 text-[13px]" style={{ color: muted }}>
            <span>{copy.toolbar.root}</span>
            <span style={{ color: muted2 }}>/</span>
            <Link href="/events" className="transition-colors hover:text-[#0A0A0A]">
              {copy.toolbar.events}
            </Link>
            <span style={{ color: muted2 }}>/</span>
            <b className="font-medium" style={{ color: ink }}>
              {copy.toolbar.current}
            </b>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <button
              type="button"
              onClick={() => router.back()}
              className="inline-flex items-center gap-2 rounded-[10px] px-4 py-2.5 text-[13.5px] font-medium transition-colors hover:bg-[rgba(10,10,10,.04)]"
              style={{ color: ink2 }}
            >
              {copy.toolbar.cancel}
            </button>
            <button
              type="submit"
              form="create-event-form"
              className="inline-flex items-center gap-2 rounded-[10px] border border-transparent bg-[#0A0A0A] px-4 py-2.5 text-[13.5px] font-medium text-[#FAFAF7] transition-all hover:-translate-y-px hover:bg-black disabled:opacity-60"
              disabled={isLoading}
            >
              {isLoading ? copy.toolbar.creating : copy.toolbar.submit}
              {!isLoading && <ChevronRight className="h-4 w-4 rtl:rotate-180" strokeWidth={2} />}
            </button>
          </div>
        </div>

        {/* Page heading */}
        <div className="mb-7 flex flex-wrap items-end justify-between gap-5">
          <div>
            <h1 className="text-[34px] font-semibold leading-[1.05] tracking-[-0.03em]">
              {copy.header.title}{' '}
              <span className={`${displaySerif} font-normal italic`} style={{ color: ink2 }}>
                {copy.header.accent}
              </span>
            </h1>
            <p className="mt-1.5 max-w-[540px] text-[14.5px] leading-snug" style={{ color: muted }}>
              {copy.header.subtitle}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold tracking-[0.05em] ${mono}`}
              style={{ backgroundColor: ink, color: accent }}
            >
              <span
                className="h-1.5 w-1.5 shrink-0 rounded-full"
                style={{
                  backgroundColor: accent,
                  boxShadow: '0 0 0 3px oklch(0.85 0.17 130 / 0.3)',
                }}
              />
              {copy.header.badge}
            </span>
          </div>
        </div>

        {error ? (
          <div
            className="mb-5 flex items-start gap-2 rounded-[10px] border px-3 py-2.5 text-sm"
            style={{
              borderColor: 'oklch(0.88 0.06 25)',
              backgroundColor: 'oklch(0.96 0.04 25)',
              color: danger,
            }}
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2} />
            {error}
          </div>
        ) : null}

        <form id="create-event-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Event name */}
          <section className="overflow-hidden rounded-[18px] border bg-white" style={{ borderColor: line }}>
            {secHead(
              <List aria-hidden className="h-4 w-4" strokeWidth={1.8} strokeLinecap="round" />,
              copy.sections.names,
              copy.sections.namesBody
            )}
            <div className="px-6 py-[22px] sm:px-6">
              <div className="grid gap-5 md:grid-cols-2">
                <div className="flex flex-col">
                  <label className="mb-1.5 flex flex-wrap items-center gap-2 text-[13px] font-medium" htmlFor="nameEn">
                    <span className={langEn}>EN</span>
                    {t('nameEn')}{' '}
                    <span className="text-[11px]" style={{ color: accentDeep }}>
                      {copy.fields.required}
                    </span>
                  </label>
                  <input
                    id="nameEn"
                    className={`${inp} ${errors.nameEn ? inpErr : inpNorm}`}
                    placeholder={copy.fields.nameEnPlaceholder}
                    disabled={isLoading}
                    maxLength={60}
                    {...register('nameEn')}
                  />
                  <div className="mt-1.5 flex justify-between text-xs" style={{ color: muted }}>
                    <span>{copy.fields.publicTitle}</span>
                    <span className={mono} style={{ color: muted2 }}>
                      {nameEn.length} / 60
                    </span>
                  </div>
                  {errors.nameEn ? (
                    <p className="mt-1.5 flex items-center gap-1.5 text-xs" style={{ color: danger }}>
                      <AlertCircle className="h-3 w-3 shrink-0" strokeWidth={2} />
                      {errors.nameEn.message}
                    </p>
                  ) : null}
                </div>
                <div className="flex flex-col">
                  <label className="mb-1.5 flex flex-wrap items-center gap-2 text-[13px] font-medium" htmlFor="nameAr">
                    <span className={langAr}>AR</span>
                    {t('nameAr')}{' '}
                    <span className="text-[11px]" style={{ color: accentDeep }}>
                      {copy.fields.required}
                    </span>
                  </label>
                  <input
                    id="nameAr"
                    className={`${inp} ${errors.nameAr ? inpErr : inpNorm}`}
                    placeholder={copy.fields.nameArPlaceholder}
                    dir="rtl"
                    disabled={isLoading}
                    maxLength={60}
                    {...register('nameAr')}
                  />
                  <div className="mt-1.5 flex justify-between text-xs" style={{ color: muted }}>
                    <span>{copy.fields.publicTitleAr}</span>
                    <span className={mono} style={{ color: muted2 }}>
                      {nameAr.length} / 60
                    </span>
                  </div>
                  {errors.nameAr ? (
                    <p className="mt-1.5 flex items-center gap-1.5 text-xs" style={{ color: danger }}>
                      <AlertCircle className="h-3 w-3 shrink-0" strokeWidth={2} />
                      {errors.nameAr.message}
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
          </section>

          {/* Event description */}
          <section className="overflow-hidden rounded-[18px] border bg-white" style={{ borderColor: line }}>
            {secHead(
              <MessageSquare aria-hidden className="h-4 w-4" strokeWidth={1.8} strokeLinecap="round" />,
              copy.sections.descriptions,
              copy.sections.descriptionsBody
            )}
            <div className="px-6 py-[22px] sm:px-6">
              <div className="grid gap-5 md:grid-cols-2">
                <div className="flex flex-col">
                  <label
                    className="mb-1.5 flex flex-wrap items-center gap-2 text-[13px] font-medium"
                    htmlFor="descriptionEn"
                  >
                    <span className={langEn}>EN</span>
                    {t('descriptionEn')}{' '}
                    <span className="text-[11px]" style={{ color: accentDeep }}>
                      {copy.fields.required}
                    </span>
                  </label>
                  <textarea
                    id="descriptionEn"
                    className={`${tar} ${errors.descriptionEn ? inpErr : inpNorm}`}
                    placeholder={copy.fields.descriptionEnPlaceholder}
                    disabled={isLoading}
                    maxLength={400}
                    {...register('descriptionEn')}
                  />
                  <div className="mt-1.5 flex justify-between text-xs" style={{ color: muted }}>
                    <span>{copy.fields.publicDescription}</span>
                    <span className={mono} style={{ color: muted2 }}>
                      {descriptionEn.length} / 400
                    </span>
                  </div>
                  {errors.descriptionEn ? (
                    <p className="mt-1.5 flex items-center gap-1.5 text-xs" style={{ color: danger }}>
                      <AlertCircle className="h-3 w-3 shrink-0" strokeWidth={2} />
                      {errors.descriptionEn.message}
                    </p>
                  ) : null}
                </div>
                <div className="flex flex-col">
                  <label
                    className="mb-1.5 flex flex-wrap items-center gap-2 text-[13px] font-medium"
                    htmlFor="descriptionAr"
                  >
                    <span className={langAr}>AR</span>
                    {t('descriptionAr')}{' '}
                    <span className="text-[11px]" style={{ color: accentDeep }}>
                      {copy.fields.required}
                    </span>
                  </label>
                  <textarea
                    id="descriptionAr"
                    className={`${tar} ${errors.descriptionAr ? inpErr : inpNorm}`}
                    placeholder={copy.fields.descriptionArPlaceholder}
                    dir="rtl"
                    disabled={isLoading}
                    maxLength={400}
                    {...register('descriptionAr')}
                  />
                  <div className="mt-1.5 flex justify-between text-xs" style={{ color: muted }}>
                    <span>{copy.fields.publicDescriptionAr}</span>
                    <span className={mono} style={{ color: muted2 }}>
                      {descriptionAr.length} / 400
                    </span>
                  </div>
                  {errors.descriptionAr ? (
                    <p className="mt-1.5 flex items-center gap-1.5 text-xs" style={{ color: danger }}>
                      <AlertCircle className="h-3 w-3 shrink-0" strokeWidth={2} />
                      {errors.descriptionAr.message}
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
          </section>

          {/* Registration */}
          <section className="overflow-hidden rounded-[18px] border bg-white" style={{ borderColor: line }}>
            {secHead(
              <Calendar aria-hidden className="h-4 w-4" strokeWidth={1.8} />,
              copy.sections.registration,
              copy.sections.registrationBody
            )}
            <div className="px-6 py-[22px] sm:px-6">
              <div className="grid gap-5 md:grid-cols-2">
                <div className="flex flex-col">
                  <label className="mb-1.5 text-[13px] font-medium" htmlFor="registrationStart">
                    {t('registrationStart')}{' '}
                    <span className="text-[11px]" style={{ color: accentDeep }}>
                      {copy.fields.required}
                    </span>
                  </label>
                  <div className="relative">
                    <Calendar
                      aria-hidden
                      className="pointer-events-none absolute start-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#9B9B9B]"
                      strokeWidth={1.8}
                    />
                    <input
                      id="registrationStart"
                      type="datetime-local"
                      className={`${inp} ps-10 ${errors.registrationStart ? inpErr : inpNorm}`}
                      value={registrationStart}
                      onChange={(e) => updateDateField('registrationStart', e.target.value)}
                      disabled={isLoading}
                    />
                    {registrationStart ? (
                      <button
                        type="button"
                        className="absolute end-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-[#9B9B9B] hover:bg-[rgba(10,10,10,.06)] hover:text-[#0A0A0A]"
                        onClick={() => clearDateField('registrationStart')}
                        aria-label="Clear"
                      >
                        <X className="h-3 w-3" strokeWidth={2} />
                      </button>
                    ) : null}
                  </div>
                  <p className="mt-1.5 text-xs" style={{ color: muted }}>
                    {copy.fields.timezone}
                  </p>
                  {errors.registrationStart ? (
                    <p className="mt-1.5 flex items-center gap-1.5 text-xs" style={{ color: danger }}>
                      <AlertCircle className="h-3 w-3 shrink-0" strokeWidth={2} />
                      {errors.registrationStart.message}
                    </p>
                  ) : null}
                </div>
                <div className="flex flex-col">
                  <label className="mb-1.5 text-[13px] font-medium" htmlFor="registrationEnd">
                    {t('registrationEnd')}{' '}
                    <span className="text-[11px]" style={{ color: accentDeep }}>
                      {copy.fields.required}
                    </span>
                  </label>
                  <div className="relative">
                    <Calendar
                      aria-hidden
                      className="pointer-events-none absolute start-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#9B9B9B]"
                      strokeWidth={1.8}
                    />
                    <input
                      id="registrationEnd"
                      type="datetime-local"
                      className={`${inp} ps-10 ${errors.registrationEnd ? inpErr : inpNorm}`}
                      value={registrationEnd}
                      onChange={(e) => updateDateField('registrationEnd', e.target.value)}
                      disabled={isLoading}
                    />
                    {registrationEnd ? (
                      <button
                        type="button"
                        className="absolute end-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-[#9B9B9B] hover:bg-[rgba(10,10,10,.06)] hover:text-[#0A0A0A]"
                        onClick={() => clearDateField('registrationEnd')}
                        aria-label="Clear"
                      >
                        <X className="h-3 w-3" strokeWidth={2} />
                      </button>
                    ) : null}
                  </div>
                  <p className="mt-1.5 text-xs" style={{ color: muted }}>
                    {copy.fields.registrationRule}
                  </p>
                  {errors.registrationEnd ? (
                    <p className="mt-1.5 flex items-center gap-1.5 text-xs" style={{ color: danger }}>
                      <AlertCircle className="h-3 w-3 shrink-0" strokeWidth={2} />
                      {errors.registrationEnd.message}
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
          </section>

          {/* Hacking */}
          <section className="overflow-hidden rounded-[18px] border bg-white" style={{ borderColor: line }}>
            {secHead(
              <Clock3 aria-hidden className="h-4 w-4" strokeWidth={1.8} />,
              copy.sections.hacking,
              copy.sections.hackingBody
            )}
            <div className="px-6 py-[22px] sm:px-6">
              <div className="grid gap-5 md:grid-cols-2">
                <div className="flex flex-col">
                  <label className="mb-1.5 text-[13px] font-medium" htmlFor="hackingStart">
                    {t('hackingStart')}{' '}
                    <span className="text-[11px]" style={{ color: accentDeep }}>
                      {copy.fields.required}
                    </span>
                  </label>
                  <div className="relative">
                    <Clock3
                      aria-hidden
                      className="pointer-events-none absolute start-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#9B9B9B]"
                      strokeWidth={1.8}
                    />
                    <input
                      id="hackingStart"
                      type="datetime-local"
                      className={`${inp} ps-10 ${errors.hackingStart ? inpErr : inpNorm}`}
                      value={hackingStart}
                      onChange={(e) => updateDateField('hackingStart', e.target.value)}
                      disabled={isLoading}
                    />
                    {hackingStart ? (
                      <button
                        type="button"
                        className="absolute end-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-[#9B9B9B] hover:bg-[rgba(10,10,10,.06)] hover:text-[#0A0A0A]"
                        onClick={() => clearDateField('hackingStart')}
                        aria-label="Clear"
                      >
                        <X className="h-3 w-3" strokeWidth={2} />
                      </button>
                    ) : null}
                  </div>
                  {errors.hackingStart ? (
                    <p className="mt-1.5 flex items-center gap-1.5 text-xs" style={{ color: danger }}>
                      <AlertCircle className="h-3 w-3 shrink-0" strokeWidth={2} />
                      {errors.hackingStart.message}
                    </p>
                  ) : null}
                </div>
                <div className="flex flex-col">
                  <label className="mb-1.5 text-[13px] font-medium" htmlFor="hackingEnd">
                    {t('hackingEnd')}{' '}
                    <span className="text-[11px]" style={{ color: accentDeep }}>
                      {copy.fields.required}
                    </span>
                  </label>
                  <div className="relative">
                    <Clock3
                      aria-hidden
                      className="pointer-events-none absolute start-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#9B9B9B]"
                      strokeWidth={1.8}
                    />
                    <input
                      id="hackingEnd"
                      type="datetime-local"
                      className={`${inp} ps-10 ${errors.hackingEnd ? inpErr : inpNorm}`}
                      value={hackingEnd}
                      onChange={(e) => updateDateField('hackingEnd', e.target.value)}
                      disabled={isLoading}
                    />
                    {hackingEnd ? (
                      <button
                        type="button"
                        className="absolute end-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-[#9B9B9B] hover:bg-[rgba(10,10,10,.06)] hover:text-[#0A0A0A]"
                        onClick={() => clearDateField('hackingEnd')}
                        aria-label="Clear"
                      >
                        <X className="h-3 w-3" strokeWidth={2} />
                      </button>
                    ) : null}
                  </div>
                  {errors.hackingEnd ? (
                    <p className="mt-1.5 flex items-center gap-1.5 text-xs" style={{ color: danger }}>
                      <AlertCircle className="h-3 w-3 shrink-0" strokeWidth={2} />
                      {errors.hackingEnd.message}
                    </p>
                  ) : null}
                </div>
              </div>

              <div
                className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-[10px] border px-4 py-3"
                style={{ borderColor: line, background: '#FCFCFA' }}
              >
                <span className="text-[13px] font-medium" style={{ color: ink2 }}>
                  {copy.fields.buildWindow}
                </span>
                <b className={`text-sm ${mono}`} style={{ color: ink }}>
                  {formatDuration(hackingStart, hackingEnd, copy.misc)}
                </b>
              </div>
            </div>
          </section>

          {/* Team size + action bar */}
          <section className="overflow-hidden rounded-[18px] border bg-white" style={{ borderColor: line }}>
            {secHead(
              <Users aria-hidden className="h-4 w-4" strokeWidth={1.8} />,
              copy.sections.team,
              copy.sections.teamBody
            )}
            <div className="px-6 py-[22px] sm:px-6">
              <div className="grid gap-5 md:grid-cols-2">
                <div className="flex flex-col">
                  <label className="mb-1.5 text-[13px] font-medium" htmlFor="minTeamSize">
                    {t('minTeamSize')}{' '}
                    <span className="text-[11px]" style={{ color: accentDeep }}>
                      {copy.fields.required}
                    </span>
                  </label>
                  <div
                    className="flex items-center gap-0 overflow-hidden rounded-[10px] border"
                    style={{ borderColor: line2 }}
                  >
                    <button
                      type="button"
                      className="flex h-11 w-11 shrink-0 items-center justify-center border-e transition-colors hover:bg-[rgba(10,10,10,.04)]"
                      style={{ borderColor: line }}
                      onClick={() => updateMinTeamSize(minTeamSize - 1)}
                      disabled={isLoading}
                      aria-label="Decrease"
                    >
                      <Minus className="h-3.5 w-3.5" strokeWidth={2} />
                    </button>
                    <input
                      id="minTeamSize"
                      type="number"
                      min={1}
                      max={10}
                      className={`h-11 min-w-0 flex-1 border-0 bg-transparent text-center text-sm font-semibold outline-none ${mono}`}
                      disabled={isLoading}
                      {...register('minTeamSize', {
                        valueAsNumber: true,
                        onChange: (e) => updateMinTeamSize(Number(e.target.value || minTeamSize)),
                      })}
                    />
                    <button
                      type="button"
                      className="flex h-11 w-11 shrink-0 items-center justify-center border-s transition-colors hover:bg-[rgba(10,10,10,.04)]"
                      style={{ borderColor: line }}
                      onClick={() => updateMinTeamSize(minTeamSize + 1)}
                      disabled={isLoading}
                      aria-label="Increase"
                    >
                      <Plus className="h-3.5 w-3.5" strokeWidth={2} />
                    </button>
                  </div>
                  <p className="mt-1.5 text-xs" style={{ color: muted }}>
                    {copy.fields.minHelp}
                  </p>
                  {errors.minTeamSize ? (
                    <p className="mt-1.5 flex items-center gap-1.5 text-xs" style={{ color: danger }}>
                      <AlertCircle className="h-3 w-3 shrink-0" strokeWidth={2} />
                      {errors.minTeamSize.message}
                    </p>
                  ) : null}
                </div>
                <div className="flex flex-col">
                  <label className="mb-1.5 text-[13px] font-medium" htmlFor="maxTeamSize">
                    {t('maxTeamSize')}{' '}
                    <span className="text-[11px]" style={{ color: accentDeep }}>
                      {copy.fields.required}
                    </span>
                  </label>
                  <div
                    className="flex items-center gap-0 overflow-hidden rounded-[10px] border"
                    style={{ borderColor: line2 }}
                  >
                    <button
                      type="button"
                      className="flex h-11 w-11 shrink-0 items-center justify-center border-e transition-colors hover:bg-[rgba(10,10,10,.04)]"
                      style={{ borderColor: line }}
                      onClick={() => updateMaxTeamSize(maxTeamSize - 1)}
                      disabled={isLoading}
                      aria-label="Decrease"
                    >
                      <Minus className="h-3.5 w-3.5" strokeWidth={2} />
                    </button>
                    <input
                      id="maxTeamSize"
                      type="number"
                      min={2}
                      max={20}
                      className={`h-11 min-w-0 flex-1 border-0 bg-transparent text-center text-sm font-semibold outline-none ${mono}`}
                      disabled={isLoading}
                      {...register('maxTeamSize', {
                        valueAsNumber: true,
                        onChange: (e) => updateMaxTeamSize(Number(e.target.value || maxTeamSize)),
                      })}
                    />
                    <button
                      type="button"
                      className="flex h-11 w-11 shrink-0 items-center justify-center border-s transition-colors hover:bg-[rgba(10,10,10,.04)]"
                      style={{ borderColor: line }}
                      onClick={() => updateMaxTeamSize(maxTeamSize + 1)}
                      disabled={isLoading}
                      aria-label="Increase"
                    >
                      <Plus className="h-3.5 w-3.5" strokeWidth={2} />
                    </button>
                  </div>
                  <p className="mt-1.5 text-xs" style={{ color: muted }}>
                    {copy.fields.maxHelp}
                  </p>
                  {errors.maxTeamSize ? (
                    <p className="mt-1.5 flex items-center gap-1.5 text-xs" style={{ color: danger }}>
                      <AlertCircle className="h-3 w-3 shrink-0" strokeWidth={2} />
                      {errors.maxTeamSize.message}
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="mt-6 rounded-[10px] border px-4 py-3" style={{ borderColor: line, background: '#FCFCFA' }}>
                <div className="mb-2 text-[12px] font-semibold uppercase tracking-wide" style={{ color: muted2 }}>
                  {copy.fields.preview}
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  {Array.from({ length: visibleTeamSlots }, (_, index) => {
                    const slot = index + 1;
                    const state =
                      slot <= minTeamSize ? 'bg-[#0A0A0A] text-[oklch(0.85_0.17_130)]' : slot <= maxTeamSize
                        ? 'border border-[rgba(10,10,10,.14)] bg-white text-[#2A2A2A]'
                        : 'border border-dashed border-[rgba(10,10,10,.12)] bg-[#F5F5F0] text-[#9B9B9B]';
                    return (
                      <span
                        key={slot}
                        className={`flex h-9 w-9 items-center justify-center rounded-full text-[11px] font-bold ${mono} ${state}`}
                      >
                        {slot}
                      </span>
                    );
                  })}
                  {maxTeamSize > visibleTeamSlots ? (
                    <span
                      className={`flex h-9 min-w-9 items-center justify-center rounded-full px-2 text-[11px] font-bold ${mono}`}
                      style={{ background: accentSoft, color: ink }}
                    >
                      +{maxTeamSize - visibleTeamSlots}
                    </span>
                  ) : null}
                </div>
                <p className="mt-2 text-[12.5px]" style={{ color: muted }}>
                  {copy.fields.teamRange.replace('{min}', String(minTeamSize)).replace('{max}', String(maxTeamSize))}
                </p>
              </div>
            </div>

            <div
              className="flex flex-col gap-3 border-t px-6 py-[18px] sm:flex-row sm:items-center sm:justify-between"
              style={{ borderColor: line, background: '#FCFCFA' }}
            >
              <div className="flex items-center gap-2 text-[12.5px]" style={{ color: muted }}>
                <span
                  className="h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{ backgroundColor: accentDeep }}
                />
                {copy.footer.status
                  .replace('{complete}', String(completedSteps))
                  .replace('{total}', String(steps.length))}
                <span className="hidden sm:inline">·</span>
                <span className="sm:ms-0">{copy.footer.requiredHint}</span>
              </div>
              <div className="flex flex-wrap gap-2.5">
                <button
                  type="button"
                  onClick={() => router.back()}
                  disabled={isLoading}
                  className="inline-flex items-center justify-center gap-2 rounded-[10px] px-4 py-2.5 text-[13.5px] font-medium transition-colors hover:bg-[rgba(10,10,10,.04)] disabled:opacity-60"
                  style={{ color: ink2 }}
                >
                  {copy.toolbar.cancel}
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-2 rounded-[10px] border border-transparent bg-[#0A0A0A] px-4 py-2.5 text-[13.5px] font-medium text-[#FAFAF7] transition-all hover:-translate-y-px hover:bg-black disabled:opacity-60"
                  disabled={isLoading}
                >
                  {isLoading ? copy.toolbar.creating : copy.toolbar.submit}
                  {!isLoading && <ChevronRight className="h-4 w-4 rtl:rotate-180" strokeWidth={2} />}
                </button>
              </div>
            </div>
          </section>
        </form>
      </div>
    </div>
  );
}
