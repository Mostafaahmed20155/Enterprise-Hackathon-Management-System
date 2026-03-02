'use client';

import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Calendar,
  Users,
  FileText,
  Trophy,
  TrendingUp,
  Clock,
  ArrowRight,
  Plus,
  Sparkles,
  CheckCircle2,
  PenLine,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

const ACTIVITIES_PER_PAGE = 5;
import { eventsApi, usersApi, submissionsApi } from '@/lib/api';

interface Activity {
  id: string;
  type: 'team_joined' | 'submission_created' | 'submission_submitted';
  icon: 'team' | 'file' | 'check';
  itemName: string;
  subtitle: string;
  timestamp: string;
  colorClass: string;
}

function relativeTime(iso: string, locale: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);
  const isAr = locale === 'ar';

  if (mins < 2) return isAr ? 'الآن' : 'Just now';
  if (mins < 60) return isAr ? `منذ ${mins} دقيقة` : `${mins}m ago`;
  if (hours < 24) return isAr ? `منذ ${hours} ساعة` : `${hours}h ago`;
  if (days < 30) return isAr ? `منذ ${days} يوم` : `${days}d ago`;
  return new Date(iso).toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US', {
    month: 'short',
    day: 'numeric',
  });
}

function getText(value: any, locale: string): string {
  if (!value) return '';
  if (typeof value === 'string') return value;
  return value[locale] || value.en || value.ar || '';
}

export default function DashboardPage() {
  const locale = useLocale();
  const t = useTranslations('dashboard');
  const [stats, setStats] = useState({ totalEvents: 0, myTeams: 0, submissions: 0, upcomingEvents: 0 });
  const [activities, setActivities] = useState<Activity[]>([]);
  const [activityPage, setActivityPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);

      const [eventsResponse, teamsResponse, subsResponse] = await Promise.all([
        eventsApi.list(),
        usersApi.getMyTeams(),
        submissionsApi.list({ limit: 50 }),
      ]);

      const events: any[] = Array.isArray(eventsResponse.data)
        ? eventsResponse.data
        : (eventsResponse.data?.data || []);

      const teams: any[] = Array.isArray(teamsResponse.data)
        ? teamsResponse.data
        : (teamsResponse.data?.data || []);

      const allSubs: any[] = Array.isArray(subsResponse.data)
        ? subsResponse.data
        : (subsResponse.data?.data || []);

      // Filter submissions that belong to the user's teams
      const myTeamIds = new Set(teams.map((t: any) => t.id));
      const mySubs = allSubs.filter((s: any) => myTeamIds.has(s.teamId) || myTeamIds.has(s.team?.id));

      setStats({
        totalEvents: events.length,
        myTeams: teams.length,
        submissions: mySubs.length,
        upcomingEvents: events.filter((e: any) =>
          ['PUBLISHED', 'REGISTRATION_OPEN', 'TEAM_FORMATION'].includes(e.state)
        ).length,
      });

      // Build activity feed
      const feed: Activity[] = [];

      // Team join activities
      for (const team of teams) {
        if (team.createdAt) {
          feed.push({
            id: `team-${team.id}`,
            type: 'team_joined',
            icon: 'team',
            itemName: getText(team.name, locale),
            subtitle: getText(team.event?.name, locale) || '',
            timestamp: team.createdAt,
            colorClass: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
          });
        }
      }

      // Submission activities
      for (const sub of mySubs) {
        const itemName = getText(sub.title, locale) || sub.id;
        const teamName = getText(sub.team?.name, locale) || '';

        if (sub.status === 'SUBMITTED' && sub.updatedAt && sub.updatedAt !== sub.createdAt) {
          feed.push({
            id: `sub-submitted-${sub.id}`,
            type: 'submission_submitted',
            icon: 'check',
            itemName,
            subtitle: teamName,
            timestamp: sub.updatedAt,
            colorClass: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
          });
        }

        if (sub.createdAt) {
          feed.push({
            id: `sub-created-${sub.id}`,
            type: 'submission_created',
            icon: 'file',
            itemName,
            subtitle: teamName,
            timestamp: sub.createdAt,
            colorClass: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
          });
        }
      }

      // Sort newest first
      feed.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setActivities(feed);
      setActivityPage(1);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 dark:border-gray-700 mx-auto" />
            <div className="absolute inset-0 animate-spin rounded-full h-16 w-16 border-4 border-t-primary border-r-transparent border-b-transparent border-l-transparent mx-auto" />
          </div>
          <p className="text-gray-600 dark:text-gray-400 font-medium">{t('loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-purple-600 to-indigo-700 p-8 text-white shadow-xl">
        <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,transparent,black)] opacity-30" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <Sparkles className="w-6 h-6" />
            <h1 className="text-3xl font-bold">{t('welcomeBack')}</h1>
          </div>
          <p className="text-indigo-100 text-lg">{t('overview')}</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: t('stats.totalEvents'), value: stats.totalEvents, sub: t('stats.allTime'), icon: Calendar, gradient: 'from-blue-500 to-cyan-500' },
          { label: t('stats.myTeams'), value: stats.myTeams, sub: t('stats.activeTeams'), icon: Users, gradient: 'from-purple-500 to-pink-500' },
          { label: t('stats.submissions'), value: stats.submissions, sub: t('stats.projectsSubmitted'), icon: FileText, gradient: 'from-amber-500 to-orange-500' },
          { label: t('stats.upcoming'), value: stats.upcomingEvents, sub: t('stats.eventsOpen'), icon: Clock, gradient: 'from-green-500 to-emerald-500' },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="group card-modern overflow-hidden hover:shadow-xl transition-all duration-300">
              <div className={`h-1 bg-gradient-to-r ${stat.gradient}`} />
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardDescription className="text-sm font-medium">{stat.label}</CardDescription>
                  <div className={`w-10 h-10 bg-gradient-to-br ${stat.gradient} rounded-lg flex items-center justify-center`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900 dark:text-white">{stat.value}</div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  {stat.sub}
                </p>
              </CardContent>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card-modern p-6 hover:shadow-xl transition-all duration-300">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-primary to-purple-600 rounded-xl flex items-center justify-center shrink-0 shadow-lg">
              <Plus className="w-7 h-7 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{t('createEvent')}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                {t('createEventDesc')}
              </p>
              <Link href="/events/create">
                <Button className="group">
                  {t('getStarted')}
                  <ArrowRight className="w-4 h-4 ms-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>
          </div>
        </div>

        <div className="card-modern p-6 hover:shadow-xl transition-all duration-300">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shrink-0 shadow-lg">
              <Trophy className="w-7 h-7 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{t('joinHackathon')}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                {t('joinHackathonDesc')}
              </p>
              <Link href="/events">
                <Button variant="outline" className="group">
                  {t('browseEvents')}
                  <ArrowRight className="w-4 h-4 ms-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <Card className="card-modern">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            {t('recentActivity')}
          </CardTitle>
          <CardDescription>{t('recentActivityDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
          {activities.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500 dark:text-gray-400 font-medium mb-1">{t('noActivity')}</p>
              <p className="text-sm text-gray-400 dark:text-gray-500">
                {t('noActivityDesc')}
              </p>
            </div>
          ) : (() => {
            const totalPages = Math.ceil(activities.length / ACTIVITIES_PER_PAGE);
            const pageItems = activities.slice(
              (activityPage - 1) * ACTIVITIES_PER_PAGE,
              activityPage * ACTIVITIES_PER_PAGE,
            );

            return (
              <>
                <div className="space-y-1">
                  {pageItems.map((activity, index) => {
                    const IconComp =
                      activity.icon === 'team' ? Users :
                      activity.icon === 'check' ? CheckCircle2 :
                      PenLine;
                    const isLast = index === pageItems.length - 1;

                    const activityTitle =
                      activity.type === 'team_joined'
                        ? `${t('activity.joinedTeam')} "${activity.itemName}"`
                        : activity.type === 'submission_submitted'
                        ? `${t('activity.submitted')} "${activity.itemName}"`
                        : `${t('activity.createdSubmission')} "${activity.itemName}"`;

                    return (
                      <div
                        key={activity.id}
                        className="flex items-start gap-4 px-3 py-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                      >
                        {/* Icon + connector line */}
                        <div className="flex flex-col items-center shrink-0">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center ${activity.colorClass}`}>
                            <IconComp className="w-4 h-4" />
                          </div>
                          {!isLast && (
                            <div className="w-px flex-1 min-h-[1.25rem] bg-gray-200 dark:bg-gray-700 mt-1" />
                          )}
                        </div>

                        {/* Text */}
                        <div className="flex-1 min-w-0 pb-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-white leading-snug truncate">
                            {activityTitle}
                          </p>
                          {activity.subtitle && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                              {activity.subtitle}
                            </p>
                          )}
                        </div>

                        {/* Timestamp */}
                        <span className="shrink-0 text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                          {relativeTime(activity.timestamp, locale)}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between pt-4 mt-2 border-t border-gray-100 dark:border-gray-800">
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      {(activityPage - 1) * ACTIVITIES_PER_PAGE + 1}–{Math.min(activityPage * ACTIVITIES_PER_PAGE, activities.length)} of {activities.length}
                    </p>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setActivityPage((p) => Math.max(1, p - 1))}
                        disabled={activityPage === 1}
                        className="p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        aria-label="Previous page"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>

                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <button
                          key={page}
                          onClick={() => setActivityPage(page)}
                          className={`min-w-[2rem] h-8 px-2 rounded-lg text-xs font-medium transition-colors ${
                            page === activityPage
                              ? 'bg-primary text-white shadow-sm'
                              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                          }`}
                        >
                          {page}
                        </button>
                      ))}

                      <button
                        onClick={() => setActivityPage((p) => Math.min(totalPages, p + 1))}
                        disabled={activityPage === totalPages}
                        className="p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        aria-label="Next page"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </>
            );
          })()}
        </CardContent>
      </Card>
    </div>
  );
}
