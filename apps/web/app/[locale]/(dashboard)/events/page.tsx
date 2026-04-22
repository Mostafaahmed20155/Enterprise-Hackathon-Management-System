'use client';

import { useCallback, useDeferredValue, useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { eventsApi } from '@/lib/api';
import { toast } from 'sonner';
import {
  Archive,
  ArrowUpDown,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Download,
  FileText,
  LayoutGrid,
  List,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Rocket,
  Search,
  Trophy,
  User,
  Users,
} from 'lucide-react';

type BilingualText = string | { en?: string; ar?: string };

interface Event {
  id: string;
  name: BilingualText;
  description?: BilingualText;
  state: string;
  registrationStart?: string;
  registrationEnd?: string;
  hackingStart?: string;
  hackingEnd?: string;
  createdAt?: string;
  updatedAt?: string;
  minTeamSize?: number;
  maxTeamSize?: number;
  organizer?: {
    id?: string;
    name?: string;
    email?: string;
  };
  _count?: {
    teams?: number;
    submissions?: number;
  };
}

type FilterKey = 'all' | 'live' | 'registration' | 'judging' | 'concluded' | 'drafts';
type ViewMode = 'cards' | 'table';
type SortMode = 'recent' | 'oldest' | 'name' | 'state';
type ScopeMode = 'all' | 'active' | 'concluded';

interface EventsPageCopy {
  toolbar: {
    root: string;
    current: string;
    export: string;
    newEvent: string;
    exportSuccess: string;
  };
  header: {
    title: string;
    accent: string;
    subtitle: string;
    refresh: string;
    toggleArchived: string;
  };
  stats: {
    live: string;
    registration: string;
    judging: string;
    concluded: string;
    drafts: string;
    teams: string;
    submissions: string;
    allTime: string;
    inSetup: string;
    activeNow: string;
  };
  filters: {
    searchPlaceholder: string;
    sort: string;
    scope: string;
    cards: string;
    table: string;
    all: string;
    live: string;
    registration: string;
    judging: string;
    concluded: string;
    drafts: string;
    recent: string;
    oldest: string;
    name: string;
    state: string;
    scopeAll: string;
    scopeActive: string;
    scopeConcluded: string;
    showing: string;
    of: string;
    clear: string;
  };
  card: {
    trackLive: string;
    trackRegistration: string;
    trackJudging: string;
    trackConcluded: string;
    trackDraft: string;
    organizer: string;
    hackathonWindow: string;
    lifecycle: string;
    teams: string;
    submissions: string;
    preview: string;
    open: string;
    createNew: string;
    createBody: string;
    untitled: string;
    noDescription: string;
    system: string;
  };
  empty: {
    noEventsTitle: string;
    noEventsBody: string;
    noResultsTitle: string;
    noResultsBody: string;
  };
  pagination: {
    previous: string;
    next: string;
  };
  misc: {
    tbd: string;
  };
}

const EVENTS_COPY: Record<'en' | 'ar', EventsPageCopy> = {
  en: {
    toolbar: {
      root: 'Admin',
      current: 'Events',
      export: 'Export',
      newEvent: 'New event',
      exportSuccess: 'Events export downloaded.',
    },
    header: {
      title: 'Events',
      accent: 'archive.',
      subtitle: 'All events you organize, manage, and monitor - from drafts to concluded editions.',
      refresh: 'Refresh data',
      toggleArchived: 'Focus concluded',
    },
    stats: {
      live: 'Live now',
      registration: 'Registration',
      judging: 'Judging',
      concluded: 'Concluded',
      drafts: 'Drafts',
      teams: 'teams',
      submissions: 'submissions',
      allTime: 'all time',
      inSetup: 'in setup',
      activeNow: 'active now',
    },
    filters: {
      searchPlaceholder: 'Search events by name, organizer, or phase...',
      sort: 'Sort',
      scope: 'Scope',
      cards: 'Cards',
      table: 'Table',
      all: 'All',
      live: 'Live',
      registration: 'Registration',
      judging: 'Judging',
      concluded: 'Concluded',
      drafts: 'Drafts',
      recent: 'Recent',
      oldest: 'Oldest',
      name: 'Name',
      state: 'State',
      scopeAll: 'All states',
      scopeActive: 'Active only',
      scopeConcluded: 'Concluded only',
      showing: 'Showing',
      of: 'of',
      clear: 'Clear filters',
    },
    card: {
      trackLive: 'LIVE · HACKING',
      trackRegistration: 'REGISTRATION · OPEN',
      trackJudging: 'JUDGING · REVIEW',
      trackConcluded: 'ARCHIVE · COMPLETE',
      trackDraft: 'DRAFT · SETUP',
      organizer: 'Organizer',
      hackathonWindow: 'Hackathon',
      lifecycle: 'Lifecycle progress',
      teams: 'teams',
      submissions: 'submissions',
      preview: 'Preview',
      open: 'Open',
      createNew: 'Create new event',
      createBody: 'Start from scratch or duplicate a previous edition to launch the next program.',
      untitled: 'Untitled event',
      noDescription: 'No event description available yet.',
      system: 'EHMS',
    },
    empty: {
      noEventsTitle: 'No events yet',
      noEventsBody: 'Create your first event to start building the archive.',
      noResultsTitle: 'No matching events',
      noResultsBody: 'Try another keyword or reset the current filters.',
    },
    pagination: {
      previous: 'Previous',
      next: 'Next',
    },
    misc: {
      tbd: 'TBD',
    },
  },
  ar: {
    toolbar: {
      root: 'الإدارة',
      current: 'الفعاليات',
      export: 'تصدير',
      newEvent: 'فعالية جديدة',
      exportSuccess: 'تم تنزيل ملف الفعاليات.',
    },
    header: {
      title: 'الفعاليات',
      accent: 'الأرشيف.',
      subtitle: 'جميع الفعاليات التي تنظمها وتديرها وتراقبها من المسودة حتى الإصدارات المكتملة.',
      refresh: 'تحديث البيانات',
      toggleArchived: 'التركيز على المكتملة',
    },
    stats: {
      live: 'جارية الآن',
      registration: 'مرحلة التسجيل',
      judging: 'التحكيم',
      concluded: 'المكتملة',
      drafts: 'المسودات',
      teams: 'فرق',
      submissions: 'مشاركات',
      allTime: 'إجمالي دائم',
      inSetup: 'قيد الإعداد',
      activeNow: 'نشطة الآن',
    },
    filters: {
      searchPlaceholder: 'ابحث باسم الفعالية أو المنظم أو المرحلة...',
      sort: 'الترتيب',
      scope: 'النطاق',
      cards: 'بطاقات',
      table: 'جدول',
      all: 'الكل',
      live: 'مباشر',
      registration: 'التسجيل',
      judging: 'التحكيم',
      concluded: 'المكتملة',
      drafts: 'المسودات',
      recent: 'الأحدث',
      oldest: 'الأقدم',
      name: 'الاسم',
      state: 'الحالة',
      scopeAll: 'كل الحالات',
      scopeActive: 'النشطة فقط',
      scopeConcluded: 'المكتملة فقط',
      showing: 'عرض',
      of: 'من',
      clear: 'مسح التصفية',
    },
    card: {
      trackLive: 'مباشر · البناء',
      trackRegistration: 'التسجيل · مفتوح',
      trackJudging: 'التحكيم · مراجعة',
      trackConcluded: 'الأرشيف · مكتمل',
      trackDraft: 'مسودة · إعداد',
      organizer: 'المنظم',
      hackathonWindow: 'فترة الهاكاثون',
      lifecycle: 'تقدم دورة الحياة',
      teams: 'فرق',
      submissions: 'مشاركات',
      preview: 'معاينة',
      open: 'فتح',
      createNew: 'إنشاء فعالية جديدة',
      createBody: 'ابدأ من الصفر أو انسخ إصدارا سابقا لإطلاق البرنامج التالي.',
      untitled: 'فعالية بدون عنوان',
      noDescription: 'لا يوجد وصف متاح لهذه الفعالية بعد.',
      system: 'المنصة',
    },
    empty: {
      noEventsTitle: 'لا توجد فعاليات بعد',
      noEventsBody: 'أنشئ أول فعالية لبدء بناء الأرشيف.',
      noResultsTitle: 'لا توجد نتائج مطابقة',
      noResultsBody: 'جرّب كلمة أخرى أو أعد ضبط عوامل التصفية الحالية.',
    },
    pagination: {
      previous: 'السابق',
      next: 'التالي',
    },
    misc: {
      tbd: 'غير محدد',
    },
  },
};

const STATE_ORDER = [
  'DRAFT',
  'PUBLISHED',
  'REGISTRATION_OPEN',
  'TEAM_FORMATION',
  'HACKING_PHASE',
  'SUBMISSION_CLOSED',
  'JUDGING',
  'RESULTS_PUBLISHED',
  'ARCHIVED',
];

const SORT_ORDER: SortMode[] = ['recent', 'oldest', 'name', 'state'];
const SCOPE_ORDER: ScopeMode[] = ['all', 'active', 'concluded'];

function getText(value: BilingualText | undefined, locale: string): string {
  if (!value) {
    return '';
  }

  if (typeof value === 'string') {
    return value;
  }

  return value[locale as 'en' | 'ar'] || value.en || value.ar || '';
}

function extractEvents(payload: unknown): Event[] {
  if (Array.isArray(payload)) {
    return payload as Event[];
  }

  if (
    payload &&
    typeof payload === 'object' &&
    'data' in payload &&
    Array.isArray((payload as { data?: unknown }).data)
  ) {
    return (payload as { data: Event[] }).data;
  }

  return [];
}

function formatShortDate(dateString: string | undefined, locale: string, fallback: string): string {
  if (!dateString) {
    return fallback;
  }

  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) {
    return fallback;
  }

  return date.toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatDateRange(
  start: string | undefined,
  end: string | undefined,
  locale: string,
  fallback: string
): string {
  if (!start && !end) {
    return fallback;
  }

  if (start && end) {
    return `${formatShortDate(start, locale, fallback)} - ${formatShortDate(
      end,
      locale,
      fallback
    )}`;
  }

  return formatShortDate(start || end, locale, fallback);
}

function getFilterKey(state: string): FilterKey {
  if (state === 'HACKING_PHASE') {
    return 'live';
  }

  if (['PUBLISHED', 'REGISTRATION_OPEN', 'TEAM_FORMATION'].includes(state)) {
    return 'registration';
  }

  if (['SUBMISSION_CLOSED', 'JUDGING'].includes(state)) {
    return 'judging';
  }

  if (['RESULTS_PUBLISHED', 'ARCHIVED'].includes(state)) {
    return 'concluded';
  }

  return 'drafts';
}

function getScopeMatch(state: string, scope: ScopeMode): boolean {
  if (scope === 'all') {
    return true;
  }

  if (scope === 'concluded') {
    return ['RESULTS_PUBLISHED', 'ARCHIVED'].includes(state);
  }

  return !['RESULTS_PUBLISHED', 'ARCHIVED'].includes(state);
}

function getStateIndex(state: string): number {
  const index = STATE_ORDER.indexOf(state);
  return index >= 0 ? index : 0;
}

function getProgress(state: string) {
  const current = getStateIndex(state) + 1;
  return {
    current,
    total: STATE_ORDER.length,
    percent: Math.max(8, Math.round((current / STATE_ORDER.length) * 100)),
  };
}

function getTone(state: string): 'live' | 'reg' | 'draft' | 'done' | 'judge' {
  const filterKey = getFilterKey(state);

  if (filterKey === 'live') {
    return 'live';
  }

  if (filterKey === 'registration') {
    return 'reg';
  }

  if (filterKey === 'judging') {
    return 'judge';
  }

  if (filterKey === 'concluded') {
    return 'done';
  }

  return 'draft';
}

function getCoverClass(state: string, index: number): string {
  const filterKey = getFilterKey(state);

  if (filterKey === 'live') {
    return 'cover-ink';
  }

  if (filterKey === 'registration') {
    return index % 2 === 0 ? 'cover-lime' : 'cover-mint';
  }

  if (filterKey === 'judging') {
    return 'cover-sand';
  }

  if (filterKey === 'concluded') {
    return index % 2 === 0 ? 'cover-sky' : 'cover-ink';
  }

  return 'cover-rose';
}

export default function EventsPage() {
  const t = useTranslations('events');
  const locale = useLocale();
  const isRtl = locale === 'ar';
  const copy = EVENTS_COPY[isRtl ? 'ar' : 'en'];
  const itemsPerPage = 8;

  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterKey>('all');
  const [sortMode, setSortMode] = useState<SortMode>('recent');
  const [scope, setScope] = useState<ScopeMode>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('cards');
  const [currentPage, setCurrentPage] = useState(1);

  const deferredSearch = useDeferredValue(search);

  const loadEvents = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await eventsApi.list({ page: 1, limit: 100 });
      setEvents(extractEvents(response.data));
    } catch {
      setError(t('loadError'));
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void loadEvents();
  }, [loadEvents]);

  useEffect(() => {
    setCurrentPage(1);
  }, [deferredSearch, filter, sortMode, scope, viewMode]);

  const normalizedQuery = deferredSearch.trim().toLowerCase();
  const filterCounts: Record<FilterKey, number> = {
    all: events.length,
    live: 0,
    registration: 0,
    judging: 0,
    concluded: 0,
    drafts: 0,
  };

  let liveTeams = 0;
  let registrationTeams = 0;
  let judgingSubmissions = 0;

  for (const event of events) {
    const key = getFilterKey(event.state);
    filterCounts[key] += 1;

    if (key === 'live') {
      liveTeams += event._count?.teams || 0;
    }

    if (key === 'registration') {
      registrationTeams += event._count?.teams || 0;
    }

    if (key === 'judging') {
      judgingSubmissions += event._count?.submissions || 0;
    }
  }

  const filteredEvents = [...events]
    .filter((event) => getScopeMatch(event.state, scope))
    .filter((event) => filter === 'all' || getFilterKey(event.state) === filter)
    .filter((event) => {
      if (!normalizedQuery) {
        return true;
      }

      const haystacks = [
        getText(event.name, locale),
        getText(event.description, locale),
        event.organizer?.name || '',
        event.state,
      ];

      return haystacks.some((value) => value.toLowerCase().includes(normalizedQuery));
    })
    .sort((left, right) => {
      if (sortMode === 'name') {
        return getText(left.name, locale).localeCompare(getText(right.name, locale), locale);
      }

      if (sortMode === 'state') {
        return getStateIndex(left.state) - getStateIndex(right.state);
      }

      const leftTime = new Date(
        left.updatedAt || left.createdAt || left.hackingStart || left.registrationStart || 0
      ).getTime();
      const rightTime = new Date(
        right.updatedAt || right.createdAt || right.hackingStart || right.registrationStart || 0
      ).getTime();

      return sortMode === 'oldest' ? leftTime - rightTime : rightTime - leftTime;
    });

  const totalPages = Math.max(1, Math.ceil(filteredEvents.length / itemsPerPage));
  const safePage = Math.min(currentPage, totalPages);
  const visibleEvents = filteredEvents.slice(
    (safePage - 1) * itemsPerPage,
    safePage * itemsPerPage
  );

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const rangeStart = filteredEvents.length === 0 ? 0 : (safePage - 1) * itemsPerPage + 1;
  const rangeEnd =
    filteredEvents.length === 0 ? 0 : Math.min(safePage * itemsPerPage, filteredEvents.length);

  const stateLabel = (state: string): string => {
    switch (state) {
      case 'DRAFT':
        return t('states.DRAFT');
      case 'PUBLISHED':
        return t('states.PUBLISHED');
      case 'REGISTRATION_OPEN':
        return t('states.REGISTRATION_OPEN');
      case 'TEAM_FORMATION':
        return t('states.TEAM_FORMATION');
      case 'HACKING_PHASE':
        return t('states.HACKING_PHASE');
      case 'SUBMISSION_CLOSED':
        return t('states.SUBMISSION_CLOSED');
      case 'JUDGING':
        return t('states.JUDGING');
      case 'RESULTS_PUBLISHED':
        return t('states.RESULTS_PUBLISHED');
      case 'ARCHIVED':
        return t('states.ARCHIVED');
      default:
        return state;
    }
  };

  const getTrackLabel = (state: string): string => {
    const filterKey = getFilterKey(state);

    if (filterKey === 'live') {
      return copy.card.trackLive;
    }

    if (filterKey === 'registration') {
      return copy.card.trackRegistration;
    }

    if (filterKey === 'judging') {
      return copy.card.trackJudging;
    }

    if (filterKey === 'concluded') {
      return copy.card.trackConcluded;
    }

    return copy.card.trackDraft;
  };

  const getSortLabel = (value: SortMode): string => {
    switch (value) {
      case 'oldest':
        return copy.filters.oldest;
      case 'name':
        return copy.filters.name;
      case 'state':
        return copy.filters.state;
      default:
        return copy.filters.recent;
    }
  };

  const getScopeLabel = (value: ScopeMode): string => {
    switch (value) {
      case 'active':
        return copy.filters.scopeActive;
      case 'concluded':
        return copy.filters.scopeConcluded;
      default:
        return copy.filters.scopeAll;
    }
  };

  const cycleSort = () => {
    const nextIndex = (SORT_ORDER.indexOf(sortMode) + 1) % SORT_ORDER.length;
    setSortMode(SORT_ORDER[nextIndex]);
  };

  const cycleScope = () => {
    const nextIndex = (SCOPE_ORDER.indexOf(scope) + 1) % SCOPE_ORDER.length;
    setScope(SCOPE_ORDER[nextIndex]);
  };

  const clearFilters = () => {
    setSearch('');
    setFilter('all');
    setSortMode('recent');
    setScope('all');
  };

  const handleExport = () => {
    const exportPayload = filteredEvents.map((event) => ({
      id: event.id,
      name: getText(event.name, locale),
      description: getText(event.description, locale),
      state: event.state,
      organizer: event.organizer?.name || copy.card.system,
      registrationStart: event.registrationStart,
      registrationEnd: event.registrationEnd,
      hackingStart: event.hackingStart,
      hackingEnd: event.hackingEnd,
      teams: event._count?.teams || 0,
      submissions: event._count?.submissions || 0,
    }));

    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    const stamp = new Date().toISOString().slice(0, 10);
    anchor.href = url;
    anchor.download = `events-${locale}-${stamp}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    toast.success(copy.toolbar.exportSuccess);
  };

  if (isLoading) {
    return (
      <div className="ehms-dashboard-page ehms-events-page ehms-dashboard-loading">
        <div className="ehms-dashboard-spinner" />
        <p>{t('loading')}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="ehms-dashboard-page ehms-events-page ehms-dashboard-loading">
        <div className="ehms-dashboard-error">{error}</div>
        <button
          type="button"
          className="ehms-dashboard-btn ehms-dashboard-btn-primary"
          onClick={() => void loadEvents()}
        >
          {t('retry')}
        </button>
      </div>
    );
  }

  return (
    <div className="ehms-dashboard-page ehms-events-page">
      <div className="ehms-dashboard-toolbar">
        <div className="ehms-events-crumb">
          <span>{copy.toolbar.root}</span>
          <span className="ehms-events-crumb-sep">/</span>
          <b>{copy.toolbar.current}</b>
        </div>

        <div className="ehms-dashboard-actions">
          <button
            type="button"
            className="ehms-dashboard-btn ehms-events-btn-secondary"
            onClick={handleExport}
          >
            <Download aria-hidden size={14} />
            {copy.toolbar.export}
          </button>

          <Link href="/events/create" className="ehms-dashboard-btn ehms-dashboard-btn-primary">
            <Plus aria-hidden size={15} />
            {copy.toolbar.newEvent}
          </Link>
        </div>
      </div>

      <div className="ehms-events-head">
        <div>
          <h1>
            {copy.header.title} <span className="ehms-dashboard-serif">{copy.header.accent}</span>
          </h1>
          <p>{copy.header.subtitle}</p>
        </div>

        <div className="ehms-events-head-actions">
          <button type="button" className="ehms-events-ghost-btn" onClick={() => void loadEvents()}>
            <RefreshCw aria-hidden size={14} />
            {copy.header.refresh}
          </button>

          <button type="button" className="ehms-events-ghost-btn" onClick={cycleScope}>
            <Archive aria-hidden size={14} />
            {scope === 'concluded' ? copy.filters.scopeAll : copy.header.toggleArchived}
          </button>
        </div>
      </div>

      <section className="ehms-events-strip">
        <article className="ehms-events-strip-card">
          <div className="ehms-events-strip-label">
            <span className="ehms-events-strip-dot is-green" />
            {copy.stats.live}
          </div>
          <div className="ehms-events-strip-value">
            {filterCounts.live}
            <span className="ehms-events-strip-meta">
              {liveTeams} {copy.stats.teams}
            </span>
          </div>
        </article>

        <article className="ehms-events-strip-card">
          <div className="ehms-events-strip-label">
            <span className="ehms-events-strip-dot is-amber" />
            {copy.stats.registration}
          </div>
          <div className="ehms-events-strip-value">
            {filterCounts.registration}
            <span className="ehms-events-strip-meta">
              {registrationTeams} {copy.stats.teams}
            </span>
          </div>
        </article>

        <article className="ehms-events-strip-card">
          <div className="ehms-events-strip-label">
            <span className="ehms-events-strip-dot is-gray" />
            {copy.stats.judging}
          </div>
          <div className="ehms-events-strip-value">
            {filterCounts.judging}
            <span className="ehms-events-strip-meta">
              {judgingSubmissions} {copy.stats.submissions}
            </span>
          </div>
        </article>

        <article className="ehms-events-strip-card">
          <div className="ehms-events-strip-label">
            <span className="ehms-events-strip-dot is-black" />
            {copy.stats.concluded}
          </div>
          <div className="ehms-events-strip-value">
            {filterCounts.concluded}
            <span className="ehms-events-strip-meta">{copy.stats.allTime}</span>
          </div>
        </article>

        <article className="ehms-events-strip-card">
          <div className="ehms-events-strip-label">
            <span className="ehms-events-strip-dot is-rose" />
            {copy.stats.drafts}
          </div>
          <div className="ehms-events-strip-value">
            {filterCounts.drafts}
            <span className="ehms-events-strip-meta">{copy.stats.inSetup}</span>
          </div>
        </article>
      </section>

      <div className="ehms-events-fbar">
        <label className="ehms-events-search" aria-label={copy.filters.searchPlaceholder}>
          <Search aria-hidden size={15} />
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={copy.filters.searchPlaceholder}
          />
          {search ? (
            <button
              type="button"
              className="ehms-events-clear"
              onClick={() => setSearch('')}
              aria-label={copy.filters.clear}
            >
              ×
            </button>
          ) : (
            <kbd>Ctrl K</kbd>
          )}
        </label>

        <div className="ehms-events-divider" />

        <button type="button" className="ehms-events-filter-btn" onClick={cycleSort}>
          <ArrowUpDown aria-hidden size={14} />
          {copy.filters.sort}: {getSortLabel(sortMode)}
        </button>

        <button
          type="button"
          className={`ehms-events-filter-btn ${scope !== 'all' ? 'is-active' : ''}`}
          onClick={cycleScope}
        >
          <Archive aria-hidden size={14} />
          {copy.filters.scope}: {getScopeLabel(scope)}
        </button>

        <div className="ehms-events-divider" />

        <div className="ehms-events-seg" role="tablist" aria-label={copy.filters.cards}>
          <button
            type="button"
            className={viewMode === 'cards' ? 'active' : ''}
            onClick={() => setViewMode('cards')}
          >
            <LayoutGrid aria-hidden size={14} />
            {copy.filters.cards}
          </button>
          <button
            type="button"
            className={viewMode === 'table' ? 'active' : ''}
            onClick={() => setViewMode('table')}
          >
            <List aria-hidden size={14} />
            {copy.filters.table}
          </button>
        </div>
      </div>

      <div className="ehms-events-chips-row">
        {(
          [
            ['all', copy.filters.all],
            ['live', copy.filters.live],
            ['registration', copy.filters.registration],
            ['judging', copy.filters.judging],
            ['concluded', copy.filters.concluded],
            ['drafts', copy.filters.drafts],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            className={`ehms-events-chip ${filter === key ? 'active' : ''}`}
            onClick={() => setFilter(key)}
          >
            {label}
            <span className="ehms-events-chip-count">{filterCounts[key]}</span>
          </button>
        ))}

        <div className="ehms-events-meta">
          {copy.filters.showing}{' '}
          <b>
            {rangeStart}-{rangeEnd}
          </b>{' '}
          {copy.filters.of} {filteredEvents.length}
        </div>
      </div>

      {events.length === 0 ? (
        <div className="ehms-events-empty">
          <div className="ehms-events-card-plus">
            <Plus aria-hidden size={22} />
          </div>
          <h3>{copy.empty.noEventsTitle}</h3>
          <p>{copy.empty.noEventsBody}</p>
          <Link href="/events/create" className="ehms-dashboard-btn ehms-dashboard-btn-primary">
            <Plus aria-hidden size={15} />
            {copy.toolbar.newEvent}
          </Link>
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="ehms-events-empty">
          <div className="ehms-events-card-plus is-muted">
            <Search aria-hidden size={20} />
          </div>
          <h3>{copy.empty.noResultsTitle}</h3>
          <p>{copy.empty.noResultsBody}</p>
          <button
            type="button"
            className="ehms-dashboard-btn ehms-events-btn-secondary"
            onClick={clearFilters}
          >
            {copy.filters.clear}
          </button>
        </div>
      ) : viewMode === 'cards' ? (
        <div className="ehms-events-grid">
          {visibleEvents.map((event, index) => {
            const tone = getTone(event.state);
            const progress = getProgress(event.state);
            const title = getText(event.name, locale) || copy.card.untitled;
            const description = getText(event.description, locale) || copy.card.noDescription;
            const organizerName = event.organizer?.name || copy.card.system;
            const teamsCount = event._count?.teams || 0;
            const submissionsCount = event._count?.submissions || 0;
            const Icon =
              tone === 'live'
                ? Rocket
                : tone === 'judge'
                  ? Trophy
                  : tone === 'draft'
                    ? FileText
                    : tone === 'done'
                      ? Archive
                      : ClipboardList;

            return (
              <article key={event.id} className="ehms-events-card">
                <div className={`ehms-events-card-cover ${getCoverClass(event.state, index)}`}>
                  <div className="ehms-events-card-pattern" />

                  <span className={`ehms-events-card-status is-${tone}`}>
                    <span className="ehms-events-card-status-dot" />
                    {stateLabel(event.state)}
                  </span>

                  <Link
                    href={`/events/${event.id}`}
                    className="ehms-events-card-more"
                    aria-label={`${copy.card.open} ${title}`}
                  >
                    <MoreHorizontal aria-hidden size={14} />
                  </Link>

                  <div className="ehms-events-card-icon">
                    <Icon aria-hidden size={42} />
                  </div>
                </div>

                <div className="ehms-events-card-body">
                  <div className="ehms-events-card-head">
                    <div>
                      <div className="ehms-events-card-track">
                        <span className={`ehms-events-card-track-dot is-${tone}`} />
                        {getTrackLabel(event.state)}
                      </div>
                      <div className="ehms-events-card-title">{title}</div>
                    </div>
                  </div>

                  <div className="ehms-events-card-desc">{description}</div>

                  <div className="ehms-events-card-meta">
                    <span className="ehms-events-card-meta-item">
                      <Calendar aria-hidden size={12} />
                      {formatDateRange(event.hackingStart, event.hackingEnd, locale, copy.misc.tbd)}
                    </span>
                    <span className="ehms-events-card-meta-item">
                      <User aria-hidden size={12} />
                      {copy.card.organizer}: {organizerName}
                    </span>
                  </div>

                  <div className="ehms-events-card-progress">
                    <div className="ehms-events-card-progress-row">
                      <span>{copy.card.lifecycle}</span>
                      <b>
                        {progress.current} / {progress.total}
                      </b>
                    </div>
                    <div className="ehms-events-card-progress-bar">
                      <div
                        className={`ehms-events-card-progress-fill ${
                          tone === 'done' ? 'is-done' : ''
                        }`}
                        style={{ width: `${progress.percent}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="ehms-events-card-footer">
                  <div className="ehms-events-card-stack">
                    <div className="ehms-events-avatar-stack" aria-hidden>
                      <span className="ehms-events-avatar a1">
                        {organizerName
                          .split(' ')
                          .map((part) => part[0])
                          .join('')
                          .slice(0, 2)
                          .toUpperCase()}
                      </span>
                      <span className="ehms-events-avatar a2">T</span>
                      <span className="ehms-events-avatar a4">S</span>
                    </div>

                    <span>
                      {teamsCount} {copy.card.teams} · {submissionsCount} {copy.card.submissions}
                    </span>
                  </div>

                  <div className="ehms-events-card-actions">
                    <Link href={`/events/${event.id}`} className="ehms-events-link-btn">
                      {copy.card.preview}
                    </Link>
                    <Link href={`/events/${event.id}`} className="ehms-events-link-btn is-primary">
                      {copy.card.open}
                      <ChevronRight aria-hidden size={12} className={isRtl ? 'flip-rtl' : ''} />
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}

          <Link href="/events/create" className="ehms-events-card ehms-events-card-new">
            <div className="ehms-events-card-plus">
              <Plus aria-hidden size={22} />
            </div>
            <h3>{copy.card.createNew}</h3>
            <p>{copy.card.createBody}</p>
          </Link>
        </div>
      ) : (
        <div className="ehms-events-table">
          {visibleEvents.map((event) => {
            const title = getText(event.name, locale) || copy.card.untitled;
            const description = getText(event.description, locale) || copy.card.noDescription;
            const progress = getProgress(event.state);
            const tone = getTone(event.state);

            return (
              <Link key={event.id} href={`/events/${event.id}`} className="ehms-events-table-row">
                <div className="ehms-events-row-main">
                  <span className={`ehms-events-row-status is-${tone}`}>
                    {stateLabel(event.state)}
                  </span>
                  <div className="ehms-events-row-info">
                    <div className="ehms-events-row-title">{title}</div>
                    <div className="ehms-events-row-sub">{description}</div>
                  </div>
                </div>

                <div className="ehms-events-row-col">
                  <span className="ehms-events-row-label">{copy.card.lifecycle}</span>
                  <strong>
                    {progress.current}/{progress.total}
                  </strong>
                </div>

                <div className="ehms-events-row-col">
                  <span className="ehms-events-row-label">{copy.card.hackathonWindow}</span>
                  <strong>
                    {formatDateRange(event.hackingStart, event.hackingEnd, locale, copy.misc.tbd)}
                  </strong>
                </div>

                <div className="ehms-events-row-col">
                  <span className="ehms-events-row-label">{copy.card.organizer}</span>
                  <strong>{event.organizer?.name || copy.card.system}</strong>
                </div>

                <div className="ehms-events-row-col is-metrics">
                  <strong>
                    {event._count?.teams || 0} {copy.card.teams}
                  </strong>
                  <strong>
                    {event._count?.submissions || 0} {copy.card.submissions}
                  </strong>
                </div>

                <span className="ehms-events-row-open">
                  {copy.card.open}
                  <ChevronRight aria-hidden size={14} className={isRtl ? 'flip-rtl' : ''} />
                </span>
              </Link>
            );
          })}
        </div>
      )}

      {filteredEvents.length > itemsPerPage && (
        <div className="ehms-events-pagination">
          <div className="ehms-events-meta">
            {copy.filters.showing}{' '}
            <b>
              {rangeStart}-{rangeEnd}
            </b>{' '}
            {copy.filters.of} {filteredEvents.length}
          </div>

          <div className="ehms-events-page-buttons">
            <button
              type="button"
              className="ehms-events-page-btn"
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              disabled={safePage === 1}
              aria-label={copy.pagination.previous}
            >
              <ChevronLeft aria-hidden size={14} className={isRtl ? 'flip-rtl' : ''} />
            </button>

            {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
              <button
                key={page}
                type="button"
                className={`ehms-events-page-btn ${safePage === page ? 'active' : ''}`}
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </button>
            ))}

            <button
              type="button"
              className="ehms-events-page-btn"
              onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
              disabled={safePage === totalPages}
              aria-label={copy.pagination.next}
            >
              <ChevronRight aria-hidden size={14} className={isRtl ? 'flip-rtl' : ''} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
