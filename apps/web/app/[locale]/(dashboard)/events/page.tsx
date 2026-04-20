'use client';

import { useEffect, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Link } from '@/i18n/routing';
import { eventsApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Rocket, Plus, RefreshCw, ArrowRight, Sparkles, Search, LayoutGrid, List } from 'lucide-react';

type BilingualText = string | { en: string; ar: string };

interface Event {
  id: string;
  name: BilingualText;
  description: BilingualText;
  state: string;
  registrationStart: string;
  registrationEnd: string;
  hackingStart: string;
  hackingEnd: string;
}

function getText(value: BilingualText | undefined, locale: string): string {
  if (!value) return '';
  if (typeof value === 'string') return value;
  return value[locale as 'en' | 'ar'] || value.en || '';
}

const stateColors: Record<string, string> = {
  DRAFT: 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 dark:from-gray-800 dark:to-gray-700 dark:text-gray-300',
  PUBLISHED: 'bg-gradient-to-r from-orange-100 to-amber-100 text-orange-900 dark:from-orange-950/30 dark:to-amber-950/30 dark:text-orange-300',
  REGISTRATION_OPEN: 'bg-gradient-to-r from-green-100 to-emerald-200 text-green-800 dark:from-green-900/30 dark:to-emerald-800/30 dark:text-green-400',
  TEAM_FORMATION: 'bg-gradient-to-r from-yellow-100 to-amber-200 text-yellow-800 dark:from-yellow-900/30 dark:to-amber-800/30 dark:text-yellow-400',
  HACKING_PHASE: 'bg-gradient-to-r from-orange-100 to-amber-100 text-orange-900 dark:from-orange-950/30 dark:to-amber-950/30 dark:text-orange-300',
  SUBMISSION_CLOSED: 'bg-gradient-to-r from-orange-100 to-orange-200 text-orange-800 dark:from-orange-900/30 dark:to-orange-800/30 dark:text-orange-400',
  JUDGING: 'bg-gradient-to-r from-amber-100 to-orange-100 text-orange-900 dark:from-orange-950/30 dark:to-amber-950/30 dark:text-orange-300',
  RESULTS_PUBLISHED: 'bg-gradient-to-r from-amber-100 to-orange-200 text-orange-900 dark:from-amber-950/30 dark:to-orange-900/30 dark:text-orange-300',
  ARCHIVED: 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 dark:from-gray-800 dark:to-gray-700 dark:text-gray-300',
};

type ViewMode = 'grid' | 'list';

export default function EventsPage() {
  const t = useTranslations('events');
  const locale = useLocale();
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      setIsLoading(true);
      const response = await eventsApi.list();
      const eventsData = Array.isArray(response.data) ? response.data : (response.data?.data || []);
      setEvents(eventsData);
    } catch (err: any) {
      setError(err.response?.data?.message || t('loadError'));
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const filtered = events.filter((e) => {
    const q = search.toLowerCase();
    if (!q) return true;
    const name = getText(e.name, locale).toLowerCase();
    const desc = getText(e.description, locale).toLowerCase();
    return name.includes(q) || desc.includes(q);
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 dark:border-gray-700 mx-auto"></div>
            <div className="absolute inset-0 animate-spin rounded-full h-16 w-16 border-4 border-t-primary border-r-transparent border-b-transparent border-l-transparent mx-auto"></div>
          </div>
          <p className="text-gray-600 dark:text-gray-400 font-medium">{t('loading')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto">
            <span className="text-2xl">⚠️</span>
          </div>
          <p className="text-red-600 dark:text-red-400 font-medium">{error}</p>
          <Button onClick={loadEvents} className="mt-4">
            <RefreshCw className="w-4 h-4 me-2" />
            {t('retry')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 bg-clip-text text-transparent">
            {t('title')}
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">{t('subtitle')}</p>
        </div>
        <Link href="/events/create">
          <Button size="lg" className="group bg-gradient-to-r from-primary to-orange-600 hover:from-primary/90 hover:to-orange-700/90 shadow-lg hover:shadow-xl transition-all">
            <Plus className="w-5 h-5 me-2 group-hover:rotate-90 transition-transform" />
            {t('createEvent')}
          </Button>
        </Link>
      </div>

      {/* Toolbar: Search + View Toggle */}
      {events.length > 0 && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={locale === 'ar' ? 'البحث في الفعاليات...' : 'Search events...'}
              className="w-full ps-10 pe-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute end-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                ✕
              </button>
            )}
          </div>

          {/* View Toggle */}
          <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl self-stretch sm:self-auto">
            <button
              onClick={() => setViewMode('grid')}
              title={locale === 'ar' ? 'عرض الشبكة' : 'Grid view'}
              className={`flex-1 sm:flex-none flex items-center justify-center px-3 py-2 rounded-lg transition-all ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-gray-700 shadow-sm text-primary'
                  : 'text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              title={locale === 'ar' ? 'عرض القائمة' : 'List view'}
              className={`flex-1 sm:flex-none flex items-center justify-center px-3 py-2 rounded-lg transition-all ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-gray-700 shadow-sm text-primary'
                  : 'text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          {/* Result count */}
          {search && (
            <span className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
              {filtered.length} {locale === 'ar' ? 'نتيجة' : 'results'}
            </span>
          )}
        </div>
      )}

      {/* Empty State */}
      {events.length === 0 ? (
        <div className="card-modern">
          <div className="flex flex-col items-center justify-center py-20 px-6">
            <div className="w-20 h-20 bg-gradient-to-br from-primary/12 to-orange-500/12 rounded-full flex items-center justify-center mb-6">
              <Sparkles className="w-10 h-10 text-primary" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              {t('noEvents')}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-center mb-6 max-w-md">
              {locale === 'ar' ? 'ابدأ بإنشاء أول فعالية هاكاثون' : 'Get started by creating your first hackathon event'}
            </p>
            <Link href="/events/create">
              <Button size="lg" className="bg-gradient-to-r from-primary to-orange-600">
                <Plus className="w-5 h-5 me-2" />
                {t('createFirstEvent')}
              </Button>
            </Link>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Search className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-4" />
          <p className="text-gray-500 dark:text-gray-400 font-medium">
            {locale === 'ar' ? `لا توجد نتائج لـ "${search}"` : `No results for "${search}"`}
          </p>
          <button onClick={() => setSearch('')} className="mt-3 text-sm text-primary hover:underline">
            {locale === 'ar' ? 'مسح البحث' : 'Clear search'}
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        /* ── Grid View ─────────────────────────────────────────────────── */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((event) => (
            <div
              key={event.id}
              className="group card-modern overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            >
              <div className="h-1 bg-gradient-to-r from-primary via-orange-500 to-amber-600" />

              <CardHeader className="pb-4">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <CardTitle className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-primary dark:group-hover:text-primary transition-colors line-clamp-2">
                    {getText(event.name, locale)}
                  </CardTitle>
                  <span className={`shrink-0 px-3 py-1.5 text-xs font-semibold rounded-full shadow-sm ${stateColors[event.state] || stateColors.DRAFT}`}>
                    {t(`states.${event.state}`)}
                  </span>
                </div>
                <CardDescription className="line-clamp-2 text-gray-600 dark:text-gray-400">
                  {getText(event.description, locale)}
                </CardDescription>
              </CardHeader>

              <CardContent className="pb-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20 rounded-lg">
                    <div className="w-8 h-8 bg-white dark:bg-gray-800 rounded-lg flex items-center justify-center shrink-0 shadow-sm">
                      <Calendar className="w-4 h-4 text-primary dark:text-orange-300" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{t('registration')}</p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                        {formatDate(event.registrationStart)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 rounded-lg">
                    <div className="w-8 h-8 bg-white dark:bg-gray-800 rounded-lg flex items-center justify-center shrink-0 shadow-sm">
                      <Rocket className="w-4 h-4 text-orange-700 dark:text-orange-300" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{t('hacking')}</p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                        {formatDate(event.hackingStart)}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="pt-4 border-t border-gray-100 dark:border-gray-800">
                <Link href={`/events/${event.id}`} className="w-full">
                  <Button variant="outline" className="w-full group/btn border-2 hover:border-primary hover:bg-primary/5 transition-colors">
                    {t('viewDetails')}
                    <ArrowRight className="w-4 h-4 ms-2 group-hover/btn:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </CardFooter>
            </div>
          ))}
        </div>
      ) : (
        /* ── List View ─────────────────────────────────────────────────── */
        <div className="space-y-2">
          {filtered.map((event) => (
            <div
              key={event.id}
              className="group flex items-center gap-4 p-4 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-primary/40 hover:shadow-md transition-all"
            >
              {/* Color dot */}
              <div className="w-2 h-10 rounded-full bg-gradient-to-b from-primary to-orange-600 shrink-0" />

              {/* Name + description */}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 dark:text-white group-hover:text-primary transition-colors truncate">
                  {getText(event.name, locale)}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                  {getText(event.description, locale)}
                </p>
              </div>

              {/* Dates */}
              <div className="hidden md:flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 shrink-0">
                <Calendar className="w-3.5 h-3.5" />
                {formatDate(event.registrationStart)}
              </div>

              {/* State badge */}
              <span className={`shrink-0 px-3 py-1.5 text-xs font-semibold rounded-full hidden sm:inline-flex ${stateColors[event.state] || stateColors.DRAFT}`}>
                {t(`states.${event.state}`)}
              </span>

              {/* CTA */}
              <Link href={`/events/${event.id}`} className="shrink-0">
                <Button size="sm" variant="outline" className="group/btn border-2 hover:border-primary hover:bg-primary/5">
                  {t('viewDetails')}
                  <ArrowRight className="w-3.5 h-3.5 ms-1.5 group-hover/btn:translate-x-0.5 transition-transform" />
                </Button>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
