'use client';

import { useEffect, useMemo, useState } from 'react';
import { Link, useRouter } from '@/i18n/routing';
import { useLocale, useTranslations } from 'next-intl';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { eventsApi } from '@/lib/api';
import {
  Calendar,
  Check,
  ChevronRight,
  Clock3,
  FileText,
  Languages,
  Minus,
  Plus,
  Sparkles,
  Users,
  X,
} from 'lucide-react';

type StepId = 'details' | 'registration' | 'hacking' | 'team';
type DateField = 'registrationStart' | 'registrationEnd' | 'hackingStart' | 'hackingEnd';

const createEventSchema = z
  .object({
    nameEn: z.string().min(3, 'English name must be at least 3 characters'),
    nameAr: z.string().min(3, 'Arabic name must be at least 3 characters'),
    descriptionEn: z.string().min(10, 'English description must be at least 10 characters'),
    descriptionAr: z.string().min(10, 'Arabic description must be at least 10 characters'),
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
    helper: string;
  };
  steps: {
    title: string;
    details: string;
    registration: string;
    hacking: string;
    team: string;
    complete: string;
  };
  sections: {
    details: string;
    detailsBody: string;
    registration: string;
    registrationBody: string;
    hacking: string;
    hackingBody: string;
    team: string;
    teamBody: string;
  };
  fields: {
    required: string;
    name: string;
    description: string;
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
    characters: string;
  };
  footer: {
    completeLabel: string;
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
      accent: 'Event.',
      subtitle:
        'Create a new hackathon event with the same bilingual setup used across the admin experience.',
      badge: 'Bilingual setup',
      helper: 'Only the fields supported by the current platform are included here.',
    },
    steps: {
      title: 'Form map',
      details: 'Event details',
      registration: 'Registration period',
      hacking: 'Hackathon period',
      team: 'Team size',
      complete: 'complete',
    },
    sections: {
      details: 'Event Details',
      detailsBody:
        'Fill in both languages. English and Arabic are both required for the current setup.',
      registration: 'Registration Period',
      registrationBody: 'When can participants register for this event?',
      hacking: 'Hackathon Period',
      hackingBody: 'Defines the window when teams can build and submit.',
      team: 'Team Size',
      teamBody: 'How many members are allowed per team?',
    },
    fields: {
      required: 'Required',
      name: 'Event Name',
      description: 'Event Description',
      nameEnPlaceholder: 'e.g. Global Innovate 2026',
      nameArPlaceholder: 'مثال: هاكاثون الابتكار العالمي',
      descriptionEnPlaceholder: 'Tell participants what this event is about...',
      descriptionArPlaceholder: 'صف الفعالية للمشاركين باللغة العربية...',
      publicTitle: 'Shown as the primary title on public pages.',
      publicTitleAr: 'يظهر كعنوان رئيسي في الصفحات العامة.',
      publicDescription: 'Used on the public event page and registration emails.',
      publicDescriptionAr: 'يستخدم في الصفحة العامة ورسائل التسجيل.',
      timezone: 'Values are converted to ISO timestamps when submitted.',
      registrationRule: 'Registration must close before hacking begins.',
      buildWindow: 'Build window',
      minHelp: 'At least 1 member.',
      maxHelp: 'Up to 20 members.',
      preview: 'Preview',
      teamRange: 'Teams of {min} - {max} members allowed',
      characters: 'characters',
    },
    footer: {
      completeLabel: 'sections complete',
      requiredHint: 'Fields marked required must be completed before creating the event.',
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
        'أنشئ فعالية هاكاثون جديدة بنفس لغة التصميم الإدارية مع دعم ثنائي كامل للعربية والإنجليزية.',
      badge: 'إعداد ثنائي اللغة',
      helper: 'تم تضمين الحقول المدعومة فعليا في المنصة الحالية فقط.',
    },
    steps: {
      title: 'خريطة النموذج',
      details: 'تفاصيل الفعالية',
      registration: 'فترة التسجيل',
      hacking: 'فترة الهاكاثون',
      team: 'حجم الفريق',
      complete: 'مكتملة',
    },
    sections: {
      details: 'تفاصيل الفعالية',
      detailsBody: 'املأ اللغتين معا. الإنجليزية والعربية مطلوبتان في الإعداد الحالي.',
      registration: 'فترة التسجيل',
      registrationBody: 'متى يمكن للمشاركين التسجيل في هذه الفعالية؟',
      hacking: 'فترة الهاكاثون',
      hackingBody: 'تحدد النافذة الزمنية التي يمكن خلالها للفرق البناء والتقديم.',
      team: 'حجم الفريق',
      teamBody: 'كم عدد الأعضاء المسموح به في كل فريق؟',
    },
    fields: {
      required: 'مطلوب',
      name: 'اسم الفعالية',
      description: 'وصف الفعالية',
      nameEnPlaceholder: 'مثال: Global Innovate 2026',
      nameArPlaceholder: 'مثال: هاكاثون الابتكار العالمي',
      descriptionEnPlaceholder: 'اكتب وصفا باللغة الإنجليزية يعرّف المشاركين بالفعالية...',
      descriptionArPlaceholder: 'اكتب وصفا بالعربية يشرح الفعالية للمشاركين...',
      publicTitle: 'يظهر كعنوان رئيسي في الصفحات العامة.',
      publicTitleAr: 'يظهر كعنوان رئيسي في الصفحات العامة.',
      publicDescription: 'يستخدم في الصفحة العامة ورسائل التسجيل.',
      publicDescriptionAr: 'يستخدم في الصفحة العامة ورسائل التسجيل.',
      timezone: 'سيتم تحويل القيم إلى توقيت ISO عند الإرسال.',
      registrationRule: 'يجب أن يغلق التسجيل قبل بدء الهاكاثون.',
      buildWindow: 'نافذة البناء',
      minHelp: 'عضو واحد على الأقل.',
      maxHelp: 'حتى 20 عضوا.',
      preview: 'معاينة',
      teamRange: 'يسمح بفرق من {min} إلى {max} أعضاء',
      characters: 'حرف',
    },
    footer: {
      completeLabel: 'أقسام مكتملة',
      requiredHint: 'يجب إكمال الحقول المطلوبة قبل إنشاء الفعالية.',
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

export default function CreateEventPage() {
  const t = useTranslations('events');
  const locale = useLocale();
  const isRtl = locale === 'ar';
  const copy = CREATE_EVENT_COPY[isRtl ? 'ar' : 'en'];
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeStep, setActiveStep] = useState<StepId>('details');

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
        id: 'details' as const,
        label: copy.steps.details,
        complete:
          nameEn.trim().length >= 3 &&
          nameAr.trim().length >= 3 &&
          descriptionEn.trim().length >= 10 &&
          descriptionAr.trim().length >= 10,
        hasError: Boolean(
          errors.nameEn || errors.nameAr || errors.descriptionEn || errors.descriptionAr
        ),
      },
      {
        id: 'registration' as const,
        label: copy.steps.registration,
        complete: Boolean(registrationStart && registrationEnd),
        hasError: Boolean(errors.registrationStart || errors.registrationEnd),
      },
      {
        id: 'hacking' as const,
        label: copy.steps.hacking,
        complete: Boolean(hackingStart && hackingEnd),
        hasError: Boolean(errors.hackingStart || errors.hackingEnd),
      },
      {
        id: 'team' as const,
        label: copy.steps.team,
        complete: minTeamSize >= 1 && maxTeamSize >= minTeamSize,
        hasError: Boolean(errors.minTeamSize || errors.maxTeamSize),
      },
    ],
    [
      copy.steps.details,
      copy.steps.hacking,
      copy.steps.registration,
      copy.steps.team,
      descriptionAr,
      descriptionEn,
      errors.descriptionAr,
      errors.descriptionEn,
      errors.hackingEnd,
      errors.hackingStart,
      errors.maxTeamSize,
      errors.minTeamSize,
      errors.nameAr,
      errors.nameEn,
      errors.registrationEnd,
      errors.registrationStart,
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
  const progressPercent = Math.round((completedSteps / steps.length) * 100);
  const visibleTeamSlots = Math.min(Math.max(maxTeamSize, 7), 10);

  useEffect(() => {
    const onScroll = () => {
      let currentStep: StepId = 'details';

      for (const step of steps) {
        const section = document.getElementById(`create-${step.id}`);
        if (section && section.getBoundingClientRect().top <= 180) {
          currentStep = step.id;
        }
      }

      setActiveStep(currentStep);
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', onScroll);
    };
  }, [steps]);

  const scrollToStep = (stepId: StepId) => {
    document.getElementById(`create-${stepId}`)?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  };

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
    } catch (submitError: any) {
      const message =
        submitError?.response?.data?.error?.message || submitError?.response?.data?.message;
      setError(extractApiMessage(message, locale, t('createError')));
    } finally {
      setIsLoading(false);
    }
  };

  const inputClassName = (hasError?: boolean, isArabic?: boolean) =>
    `ehms-create-input${hasError ? ' is-invalid' : ''}${isArabic ? ' is-ar' : ''}`;
  const textAreaClassName = (hasError?: boolean, isArabic?: boolean) =>
    `ehms-create-textarea${hasError ? ' is-invalid' : ''}${isArabic ? ' is-ar' : ''}`;

  return (
    <div className="ehms-dashboard-page ehms-create-event-page">
      <div className="ehms-dashboard-toolbar">
        <div className="ehms-create-crumb">
          <span>{copy.toolbar.root}</span>
          <span className="ehms-create-crumb-sep">/</span>
          <Link href="/events">{copy.toolbar.events}</Link>
          <span className="ehms-create-crumb-sep">/</span>
          <b>{copy.toolbar.current}</b>
        </div>

        <div className="ehms-dashboard-actions">
          <button
            type="button"
            className="ehms-dashboard-btn ehms-create-btn-secondary"
            onClick={() => router.back()}
          >
            {copy.toolbar.cancel}
          </button>

          <button
            type="submit"
            form="create-event-form"
            className="ehms-dashboard-btn ehms-dashboard-btn-primary"
            disabled={isLoading}
          >
            {isLoading ? copy.toolbar.creating : copy.toolbar.submit}
            {!isLoading && (
              <span className="ehms-dashboard-chev" aria-hidden>
                {isRtl ? '←' : '→'}
              </span>
            )}
          </button>
        </div>
      </div>

      <div className="ehms-create-head">
        <div>
          <div className="ehms-create-badge">
            <Languages aria-hidden size={14} />
            {copy.header.badge}
          </div>
          <h1>
            {copy.header.title} <span className="ehms-dashboard-serif">{copy.header.accent}</span>
          </h1>
          <p>{copy.header.subtitle}</p>
        </div>

        <div className="ehms-create-head-note">
          <strong>{completedSteps} / 4</strong>
          <span>{copy.header.helper}</span>
        </div>
      </div>

      <div className="ehms-create-layout">
        <aside className="ehms-create-stepnav" aria-label={copy.steps.title}>
          <div className="ehms-create-stepnav-title">{copy.steps.title}</div>
          {steps.map((step, index) => (
            <button
              key={step.id}
              type="button"
              className={`ehms-create-stepnav-item ${
                activeStep === step.id ? 'active' : ''
              } ${step.complete ? 'done' : ''} ${step.hasError ? 'has-error' : ''}`}
              onClick={() => scrollToStep(step.id)}
              aria-current={activeStep === step.id ? 'step' : undefined}
            >
              <span className="ehms-create-stepnav-num">{String(index + 1).padStart(2, '0')}</span>
              <span className="ehms-create-stepnav-label">{step.label}</span>
              <Check aria-hidden size={12} className="ehms-create-stepnav-tick" />
            </button>
          ))}
        </aside>

        <div className="ehms-create-form-col">
          {error && <div className="ehms-create-form-error">{error}</div>}

          <form
            id="create-event-form"
            onSubmit={handleSubmit(onSubmit)}
            className="ehms-create-form"
          >
            <section
              id="create-details"
              className={`ehms-create-section ${activeStep === 'details' ? 'is-active' : ''}`}
            >
              <div className="ehms-create-section-head">
                <div className="ehms-create-section-head-left">
                  <div className="ehms-create-section-icon">
                    <Sparkles aria-hidden size={16} />
                  </div>
                  <div>
                    <h3>{copy.sections.details}</h3>
                    <p>{copy.sections.detailsBody}</p>
                  </div>
                </div>
                <span className="ehms-create-section-pill">STEP 01</span>
              </div>

              <div className="ehms-create-section-body">
                <div className="ehms-create-field">
                  <label className="ehms-create-field-label">{copy.fields.name}</label>

                  <div className="ehms-create-lang-group">
                    <div className="ehms-create-field-group">
                      <label className="ehms-create-sub-label" htmlFor="nameEn">
                        <span className="ehms-create-lang-pill is-en">EN</span>
                        {t('nameEn')}
                        <span className="ehms-create-req">{copy.fields.required}</span>
                      </label>
                      <input
                        id="nameEn"
                        className={inputClassName(Boolean(errors.nameEn))}
                        placeholder={copy.fields.nameEnPlaceholder}
                        disabled={isLoading}
                        {...register('nameEn')}
                      />
                      <div className="ehms-create-field-help">
                        <span>{copy.fields.publicTitle}</span>
                        <span className="ehms-create-count">
                          {nameEn.length} {copy.fields.characters}
                        </span>
                      </div>
                      {errors.nameEn && (
                        <p className="ehms-create-field-error">{errors.nameEn.message}</p>
                      )}
                    </div>

                    <div className="ehms-create-field-group">
                      <label className="ehms-create-sub-label" htmlFor="nameAr">
                        <span className="ehms-create-lang-pill is-ar">AR</span>
                        {t('nameAr')}
                        <span className="ehms-create-req">{copy.fields.required}</span>
                      </label>
                      <input
                        id="nameAr"
                        className={inputClassName(Boolean(errors.nameAr), true)}
                        placeholder={copy.fields.nameArPlaceholder}
                        dir="rtl"
                        disabled={isLoading}
                        {...register('nameAr')}
                      />
                      <div className="ehms-create-field-help">
                        <span>{copy.fields.publicTitleAr}</span>
                        <span className="ehms-create-count">
                          {nameAr.length} {copy.fields.characters}
                        </span>
                      </div>
                      {errors.nameAr && (
                        <p className="ehms-create-field-error">{errors.nameAr.message}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="ehms-create-field">
                  <label className="ehms-create-field-label">{copy.fields.description}</label>

                  <div className="ehms-create-lang-group">
                    <div className="ehms-create-field-group">
                      <label className="ehms-create-sub-label" htmlFor="descriptionEn">
                        <span className="ehms-create-lang-pill is-en">EN</span>
                        {t('descriptionEn')}
                        <span className="ehms-create-req">{copy.fields.required}</span>
                      </label>
                      <textarea
                        id="descriptionEn"
                        className={textAreaClassName(Boolean(errors.descriptionEn))}
                        placeholder={copy.fields.descriptionEnPlaceholder}
                        rows={5}
                        disabled={isLoading}
                        {...register('descriptionEn')}
                      />
                      <div className="ehms-create-field-help">
                        <span>{copy.fields.publicDescription}</span>
                        <span className="ehms-create-count">
                          {descriptionEn.length} {copy.fields.characters}
                        </span>
                      </div>
                      {errors.descriptionEn && (
                        <p className="ehms-create-field-error">{errors.descriptionEn.message}</p>
                      )}
                    </div>

                    <div className="ehms-create-field-group">
                      <label className="ehms-create-sub-label" htmlFor="descriptionAr">
                        <span className="ehms-create-lang-pill is-ar">AR</span>
                        {t('descriptionAr')}
                        <span className="ehms-create-req">{copy.fields.required}</span>
                      </label>
                      <textarea
                        id="descriptionAr"
                        className={textAreaClassName(Boolean(errors.descriptionAr), true)}
                        placeholder={copy.fields.descriptionArPlaceholder}
                        rows={5}
                        dir="rtl"
                        disabled={isLoading}
                        {...register('descriptionAr')}
                      />
                      <div className="ehms-create-field-help">
                        <span>{copy.fields.publicDescriptionAr}</span>
                        <span className="ehms-create-count">
                          {descriptionAr.length} {copy.fields.characters}
                        </span>
                      </div>
                      {errors.descriptionAr && (
                        <p className="ehms-create-field-error">{errors.descriptionAr.message}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section
              id="create-registration"
              className={`ehms-create-section ${activeStep === 'registration' ? 'is-active' : ''}`}
            >
              <div className="ehms-create-section-head">
                <div className="ehms-create-section-head-left">
                  <div className="ehms-create-section-icon">
                    <Calendar aria-hidden size={16} />
                  </div>
                  <div>
                    <h3>{copy.sections.registration}</h3>
                    <p>{copy.sections.registrationBody}</p>
                  </div>
                </div>
                <span className="ehms-create-section-pill is-soft">STEP 02</span>
              </div>

              <div className="ehms-create-section-body">
                <div className="ehms-create-two-col">
                  <div className="ehms-create-field-group">
                    <label className="ehms-create-sub-label" htmlFor="registrationStart">
                      {t('registrationStart')}
                      <span className="ehms-create-req">{copy.fields.required}</span>
                    </label>
                    <div className="ehms-create-date-wrap">
                      <Calendar aria-hidden size={14} className="ehms-create-date-icon" />
                      <input
                        id="registrationStart"
                        type="datetime-local"
                        className={inputClassName(Boolean(errors.registrationStart))}
                        value={registrationStart}
                        onChange={(event) =>
                          updateDateField('registrationStart', event.target.value)
                        }
                        disabled={isLoading}
                      />
                      {registrationStart && (
                        <button
                          type="button"
                          className="ehms-create-date-clear"
                          onClick={() => clearDateField('registrationStart')}
                          aria-label="Clear registration start"
                        >
                          <X aria-hidden size={12} />
                        </button>
                      )}
                    </div>
                    <div className="ehms-create-field-help">
                      <span>{copy.fields.timezone}</span>
                    </div>
                    {errors.registrationStart && (
                      <p className="ehms-create-field-error">{errors.registrationStart.message}</p>
                    )}
                  </div>

                  <div className="ehms-create-field-group">
                    <label className="ehms-create-sub-label" htmlFor="registrationEnd">
                      {t('registrationEnd')}
                      <span className="ehms-create-req">{copy.fields.required}</span>
                    </label>
                    <div className="ehms-create-date-wrap">
                      <Calendar aria-hidden size={14} className="ehms-create-date-icon" />
                      <input
                        id="registrationEnd"
                        type="datetime-local"
                        className={inputClassName(Boolean(errors.registrationEnd))}
                        value={registrationEnd}
                        onChange={(event) => updateDateField('registrationEnd', event.target.value)}
                        disabled={isLoading}
                      />
                      {registrationEnd && (
                        <button
                          type="button"
                          className="ehms-create-date-clear"
                          onClick={() => clearDateField('registrationEnd')}
                          aria-label="Clear registration end"
                        >
                          <X aria-hidden size={12} />
                        </button>
                      )}
                    </div>
                    <div className="ehms-create-field-help">
                      <span>{copy.fields.registrationRule}</span>
                    </div>
                    {errors.registrationEnd && (
                      <p className="ehms-create-field-error">{errors.registrationEnd.message}</p>
                    )}
                  </div>
                </div>
              </div>
            </section>

            <section
              id="create-hacking"
              className={`ehms-create-section ${activeStep === 'hacking' ? 'is-active' : ''}`}
            >
              <div className="ehms-create-section-head">
                <div className="ehms-create-section-head-left">
                  <div className="ehms-create-section-icon">
                    <Clock3 aria-hidden size={16} />
                  </div>
                  <div>
                    <h3>{copy.sections.hacking}</h3>
                    <p>{copy.sections.hackingBody}</p>
                  </div>
                </div>
                <span className="ehms-create-section-pill">STEP 03</span>
              </div>

              <div className="ehms-create-section-body">
                <div className="ehms-create-two-col">
                  <div className="ehms-create-field-group">
                    <label className="ehms-create-sub-label" htmlFor="hackingStart">
                      {t('hackingStart')}
                      <span className="ehms-create-req">{copy.fields.required}</span>
                    </label>
                    <div className="ehms-create-date-wrap">
                      <Clock3 aria-hidden size={14} className="ehms-create-date-icon" />
                      <input
                        id="hackingStart"
                        type="datetime-local"
                        className={inputClassName(Boolean(errors.hackingStart))}
                        value={hackingStart}
                        onChange={(event) => updateDateField('hackingStart', event.target.value)}
                        disabled={isLoading}
                      />
                      {hackingStart && (
                        <button
                          type="button"
                          className="ehms-create-date-clear"
                          onClick={() => clearDateField('hackingStart')}
                          aria-label="Clear hackathon start"
                        >
                          <X aria-hidden size={12} />
                        </button>
                      )}
                    </div>
                    {errors.hackingStart && (
                      <p className="ehms-create-field-error">{errors.hackingStart.message}</p>
                    )}
                  </div>

                  <div className="ehms-create-field-group">
                    <label className="ehms-create-sub-label" htmlFor="hackingEnd">
                      {t('hackingEnd')}
                      <span className="ehms-create-req">{copy.fields.required}</span>
                    </label>
                    <div className="ehms-create-date-wrap">
                      <Clock3 aria-hidden size={14} className="ehms-create-date-icon" />
                      <input
                        id="hackingEnd"
                        type="datetime-local"
                        className={inputClassName(Boolean(errors.hackingEnd))}
                        value={hackingEnd}
                        onChange={(event) => updateDateField('hackingEnd', event.target.value)}
                        disabled={isLoading}
                      />
                      {hackingEnd && (
                        <button
                          type="button"
                          className="ehms-create-date-clear"
                          onClick={() => clearDateField('hackingEnd')}
                          aria-label="Clear hackathon end"
                        >
                          <X aria-hidden size={12} />
                        </button>
                      )}
                    </div>
                    {errors.hackingEnd && (
                      <p className="ehms-create-field-error">{errors.hackingEnd.message}</p>
                    )}
                  </div>
                </div>

                <div className="ehms-create-timeline">
                  <span>{copy.fields.buildWindow}</span>
                  <div className="ehms-create-timeline-bar">
                    <div className="ehms-create-timeline-fill" />
                    <div className="ehms-create-timeline-dot is-start" />
                    <div className="ehms-create-timeline-dot is-end" />
                  </div>
                  <b>{formatDuration(hackingStart, hackingEnd, copy.misc)}</b>
                </div>
              </div>
            </section>

            <section
              id="create-team"
              className={`ehms-create-section ${activeStep === 'team' ? 'is-active' : ''}`}
            >
              <div className="ehms-create-section-head">
                <div className="ehms-create-section-head-left">
                  <div className="ehms-create-section-icon">
                    <Users aria-hidden size={16} />
                  </div>
                  <div>
                    <h3>{copy.sections.team}</h3>
                    <p>{copy.sections.teamBody}</p>
                  </div>
                </div>
                <span className="ehms-create-section-pill is-muted">STEP 04</span>
              </div>

              <div className="ehms-create-section-body">
                <div className="ehms-create-team-row">
                  <div className="ehms-create-field-group">
                    <label className="ehms-create-sub-label" htmlFor="minTeamSize">
                      {t('minTeamSize')}
                      <span className="ehms-create-req">{copy.fields.required}</span>
                    </label>
                    <div className="ehms-create-stepper">
                      <button
                        type="button"
                        className="ehms-create-stepper-btn"
                        onClick={() => updateMinTeamSize(minTeamSize - 1)}
                        disabled={isLoading}
                        aria-label="Decrease minimum team size"
                      >
                        <Minus aria-hidden size={14} />
                      </button>
                      <input
                        id="minTeamSize"
                        type="number"
                        min={1}
                        max={10}
                        className="ehms-create-stepper-value"
                        disabled={isLoading}
                        {...register('minTeamSize', {
                          valueAsNumber: true,
                          onChange: (event) =>
                            updateMinTeamSize(Number(event.target.value || minTeamSize)),
                        })}
                      />
                      <button
                        type="button"
                        className="ehms-create-stepper-btn"
                        onClick={() => updateMinTeamSize(minTeamSize + 1)}
                        disabled={isLoading}
                        aria-label="Increase minimum team size"
                      >
                        <Plus aria-hidden size={14} />
                      </button>
                    </div>
                    <div className="ehms-create-field-help">
                      <span>{copy.fields.minHelp}</span>
                    </div>
                    {errors.minTeamSize && (
                      <p className="ehms-create-field-error">{errors.minTeamSize.message}</p>
                    )}
                  </div>

                  <div className="ehms-create-field-group">
                    <label className="ehms-create-sub-label" htmlFor="maxTeamSize">
                      {t('maxTeamSize')}
                      <span className="ehms-create-req">{copy.fields.required}</span>
                    </label>
                    <div className="ehms-create-stepper">
                      <button
                        type="button"
                        className="ehms-create-stepper-btn"
                        onClick={() => updateMaxTeamSize(maxTeamSize - 1)}
                        disabled={isLoading}
                        aria-label="Decrease maximum team size"
                      >
                        <Minus aria-hidden size={14} />
                      </button>
                      <input
                        id="maxTeamSize"
                        type="number"
                        min={2}
                        max={20}
                        className="ehms-create-stepper-value"
                        disabled={isLoading}
                        {...register('maxTeamSize', {
                          valueAsNumber: true,
                          onChange: (event) =>
                            updateMaxTeamSize(Number(event.target.value || maxTeamSize)),
                        })}
                      />
                      <button
                        type="button"
                        className="ehms-create-stepper-btn"
                        onClick={() => updateMaxTeamSize(maxTeamSize + 1)}
                        disabled={isLoading}
                        aria-label="Increase maximum team size"
                      >
                        <Plus aria-hidden size={14} />
                      </button>
                    </div>
                    <div className="ehms-create-field-help">
                      <span>{copy.fields.maxHelp}</span>
                    </div>
                    {errors.maxTeamSize && (
                      <p className="ehms-create-field-error">{errors.maxTeamSize.message}</p>
                    )}
                  </div>
                </div>

                <div className="ehms-create-team-preview">
                  <div className="ehms-create-team-preview-label">{copy.fields.preview}</div>
                  <div className="ehms-create-team-preview-avatars" aria-hidden>
                    {Array.from({ length: visibleTeamSlots }, (_, index) => {
                      const slot = index + 1;
                      const state =
                        slot <= minTeamSize ? 'is-core' : slot <= maxTeamSize ? 'is-on' : 'is-off';

                      return (
                        <span key={slot} className={`ehms-create-team-avatar ${state}`}>
                          {slot}
                        </span>
                      );
                    })}
                    {maxTeamSize > visibleTeamSlots && (
                      <span className="ehms-create-team-avatar is-extra">
                        +{maxTeamSize - visibleTeamSlots}
                      </span>
                    )}
                  </div>
                  <div className="ehms-create-team-preview-note">
                    {copy.fields.teamRange
                      .replace('{min}', String(minTeamSize))
                      .replace('{max}', String(maxTeamSize))}
                  </div>
                </div>
              </div>
            </section>
          </form>
        </div>
      </div>

      <div className="ehms-create-footer-bar">
        <div className="ehms-create-footer-meta">
          <div
            className="ehms-create-progress-ring"
            style={{
              background: `conic-gradient(var(--ink) 0%, var(--ink) ${progressPercent}%, #efefea ${progressPercent}%, #efefea 100%)`,
            }}
          >
            <span>{progressPercent}%</span>
          </div>
          <div>
            <div className="ehms-create-footer-title">
              {completedSteps} / {steps.length} {copy.footer.completeLabel}
            </div>
            <div className="ehms-create-footer-sub">{copy.footer.requiredHint}</div>
          </div>
        </div>

        <div className="ehms-create-footer-actions">
          <button
            type="button"
            className="ehms-dashboard-btn ehms-create-btn-secondary"
            onClick={() => router.back()}
            disabled={isLoading}
          >
            {t('cancel')}
          </button>
          <button
            type="submit"
            form="create-event-form"
            className="ehms-dashboard-btn ehms-create-btn-primary"
            disabled={isLoading}
          >
            {isLoading ? copy.toolbar.creating : copy.toolbar.submit}
            {!isLoading && (
              <ChevronRight aria-hidden size={14} className={isRtl ? 'flip-rtl' : ''} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
