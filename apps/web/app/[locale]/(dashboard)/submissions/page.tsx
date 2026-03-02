'use client';

import { useEffect, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Link } from '@/i18n/routing';
import { submissionsApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { FileText, Calendar, Users, ExternalLink, Plus, Star, Search, LayoutGrid, List, ArrowRight } from 'lucide-react';

type BilingualText = string | { en: string; ar: string };

interface Submission {
  id: string;
  title: BilingualText;
  description: BilingualText;
  status: string;
  averageScore: number | null;
  _count?: { files: number; scores: number };
  team: {
    id: string;
    name: BilingualText;
  };
  createdAt: string;
  updatedAt: string;
}

function getText(value: BilingualText | undefined, locale: string): string {
  if (!value) return '';
  if (typeof value === 'string') return value;
  return value[locale as 'en' | 'ar'] || value.en || '';
}

const statusColors: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
  SUBMITTED: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
  UNDER_REVIEW: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
  DISQUALIFIED: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
  WINNER: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
};

const statusBarColors: Record<string, string> = {
  DRAFT: 'bg-gradient-to-r from-gray-400 to-gray-500',
  SUBMITTED: 'bg-gradient-to-r from-green-500 to-emerald-500',
  UNDER_REVIEW: 'bg-gradient-to-r from-blue-500 to-cyan-500',
  DISQUALIFIED: 'bg-gradient-to-r from-red-500 to-red-600',
  WINNER: 'bg-gradient-to-r from-yellow-400 to-amber-500',
};

type ViewMode = 'grid' | 'list';

export default function SubmissionsPage() {
  const t = useTranslations('submissions');
  const locale = useLocale();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  useEffect(() => {
    loadSubmissions();
  }, []);

  const loadSubmissions = async () => {
    try {
      setIsLoading(true);
      const response = await submissionsApi.list();
      const data = response.data?.data || response.data;
      setSubmissions(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.response?.data?.message || t('loadError'));
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const filtered = submissions.filter((sub) => {
    const q = search.toLowerCase();
    if (!q) return true;
    const title = getText(sub.title, locale).toLowerCase();
    const team = getText(sub.team.name, locale).toLowerCase();
    return title.includes(q) || team.includes(q);
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
            <FileText className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <p className="text-red-600 dark:text-red-400">{error}</p>
          <Button onClick={loadSubmissions}>{t('retry')}</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-purple-600 to-indigo-700 p-8 text-white shadow-xl">
        <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,transparent,black)] opacity-30" />
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <FileText className="w-6 h-6" />
              <h1 className="text-3xl font-bold">{t('title')}</h1>
            </div>
            <p className="text-indigo-100 text-lg">{t('subtitle')}</p>
          </div>
          <Link href="/submissions/create">
            <Button variant="secondary" className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              {t('createSubmission')}
            </Button>
          </Link>
        </div>
      </div>

      {/* Toolbar: Search + View Toggle */}
      {submissions.length > 0 && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={locale === 'ar' ? 'البحث في التقديمات...' : 'Search submissions...'}
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
      {submissions.length === 0 ? (
        <Card className="card-modern">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-full flex items-center justify-center mb-6">
              <FileText className="w-10 h-10 text-gray-400" />
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-center text-lg mb-2">{t('noSubmissions')}</p>
            <p className="text-gray-500 dark:text-gray-500 text-sm text-center max-w-md">{t('noSubmissionsDescription')}</p>
          </CardContent>
        </Card>
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
          {filtered.map((submission) => (
            <Link key={submission.id} href={`/submissions/${submission.id}`}>
              <div className="group card-modern overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer h-full">
                <div className={`h-1 ${statusBarColors[submission.status] || statusBarColors.DRAFT}`} />
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-primary transition-colors line-clamp-2 flex-1">
                      {getText(submission.title, locale)}
                    </h3>
                    <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-primary transition-colors shrink-0 ms-2" />
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-3">
                    {getText(submission.description, locale)}
                  </p>
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                      <Users className="w-4 h-4" />
                      <span>{getText(submission.team.name, locale)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(submission.updatedAt)}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${statusColors[submission.status]}`}>
                      {t(`statuses.${submission.status}`)}
                    </span>
                    {submission.averageScore !== null && submission.averageScore !== undefined && (
                      <span className="flex items-center gap-1 text-xs font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-2.5 py-1 rounded-full">
                        <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                        {submission.averageScore}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        /* ── List View ─────────────────────────────────────────────────── */
        <div className="space-y-2">
          {filtered.map((submission) => (
            <div
              key={submission.id}
              className="group flex items-center gap-4 p-4 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-primary/40 hover:shadow-md transition-all"
            >
              {/* Status stripe */}
              <div className={`w-1.5 h-10 rounded-full shrink-0 ${statusBarColors[submission.status] || statusBarColors.DRAFT}`} />

              {/* Title + team */}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 dark:text-white group-hover:text-primary transition-colors truncate">
                  {getText(submission.title, locale)}
                </p>
                <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
                  <Users className="w-3.5 h-3.5" />
                  <span className="truncate">{getText(submission.team.name, locale)}</span>
                </div>
              </div>

              {/* Date */}
              <div className="hidden md:flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 shrink-0">
                <Calendar className="w-3.5 h-3.5" />
                {formatDate(submission.updatedAt)}
              </div>

              {/* Score */}
              {submission.averageScore !== null && submission.averageScore !== undefined && (
                <span className="hidden sm:flex items-center gap-1 text-xs font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-2.5 py-1 rounded-full shrink-0">
                  <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                  {submission.averageScore}
                </span>
              )}

              {/* Status badge */}
              <span className={`shrink-0 px-3 py-1 text-xs font-semibold rounded-full hidden sm:inline-flex ${statusColors[submission.status]}`}>
                {t(`statuses.${submission.status}`)}
              </span>

              {/* CTA */}
              <Link href={`/submissions/${submission.id}`} className="shrink-0">
                <Button size="sm" variant="outline" className="group/btn border-2 hover:border-primary hover:bg-primary/5">
                  {locale === 'ar' ? 'عرض' : 'View'}
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
