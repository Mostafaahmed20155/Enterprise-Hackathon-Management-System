'use client';

import { useEffect, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Link } from '@/i18n/routing';
import { usersApi, teamsApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Users, Lock, Crown, Calendar, RefreshCw, ArrowRight, UserPlus,
  Sparkles, Bell, Check, X, Search, LayoutGrid, List,
} from 'lucide-react';
import { toast } from 'sonner';

interface Team {
  id: string;
  name: string;
  description: string;
  event: {
    id: string;
    name: string;
  };
  members: Array<{
    id: string;
    user: {
      id: string;
      name: string;
      email: string;
    };
    role: string;
  }>;
  isLocked: boolean;
}

interface Invite {
  id: string;
  email: string;
  status: string;
  expiresAt: string;
  createdAt: string;
  team: {
    id: string;
    name: string;
    leader: { id: string; name: string; email: string };
    event: { id: string; name: string; state: string };
    _count: { members: number };
  };
}

type ViewMode = 'grid' | 'list';

export default function MyTeamsPage() {
  const t = useTranslations('teams');
  const locale = useLocale();
  const [teams, setTeams] = useState<Team[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [respondingId, setRespondingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  useEffect(() => {
    Promise.all([loadTeams(), loadInvites()]);
  }, []);

  const loadTeams = async () => {
    try {
      setIsLoading(true);
      const response = await usersApi.getMyTeams();
      const teamsData = Array.isArray(response.data) ? response.data : (response.data?.data || []);
      setTeams(teamsData);
    } catch (err: any) {
      setError(err.response?.data?.message || t('loadError'));
    } finally {
      setIsLoading(false);
    }
  };

  const loadInvites = async () => {
    try {
      const response = await teamsApi.getInvites();
      const data = Array.isArray(response.data) ? response.data : (response.data?.data || []);
      setInvites(data);
    } catch {
      // silently ignore — user may not be logged in yet
    }
  };

  const handleRespond = async (inviteId: string, accept: boolean) => {
    setRespondingId(inviteId);
    try {
      const response = await teamsApi.respondToInvite(inviteId, accept);
      const message = response.data?.message;
      const msg = typeof message === 'object' ? (message[locale] || message.en) : message;
      if (accept) {
        toast.success(msg || 'Joined team successfully!');
        await Promise.all([loadTeams(), loadInvites()]);
      } else {
        toast.info(msg || 'Invite declined');
        setInvites(prev => prev.filter(i => i.id !== inviteId));
      }
    } catch (err: any) {
      const errorData = err.response?.data;
      const errorMessage = errorData?.error?.message || errorData?.message;
      const errorMsg = errorMessage && typeof errorMessage === 'object'
        ? (errorMessage[locale] || errorMessage.en || 'Failed to respond')
        : (errorMessage || 'Failed to respond');
      toast.error(errorMsg);
    } finally {
      setRespondingId(null);
    }
  };

  const filtered = teams.filter((team) => {
    const q = search.toLowerCase();
    if (!q) return true;
    return (
      team.name.toLowerCase().includes(q) ||
      team.event.name.toLowerCase().includes(q) ||
      team.members.some(m => m.user.name.toLowerCase().includes(q))
    );
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
          <Button onClick={loadTeams}>
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
            {t('myTeams')}
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">{t('myTeamsDescription')}</p>
        </div>
      </div>

      {/* Pending Invites */}
      {invites.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-amber-500" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {locale === 'ar' ? 'دعوات معلقة' : 'Pending Invites'} ({invites.length})
            </h2>
          </div>
          {invites.map((invite) => (
            <div
              key={invite.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border-2 border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center text-white font-bold text-lg shrink-0">
                  {invite.team.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white text-base">{invite.team.name}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {locale === 'ar' ? 'الفعالية:' : 'Event:'} <span className="font-medium">{invite.team.event.name}</span>
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-500">
                    {locale === 'ar' ? 'دعوة من:' : 'Invited by:'} {invite.team.leader.name}
                    {' · '}
                    {invite.team._count.members} {locale === 'ar' ? 'عضو' : 'members'}
                  </p>
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button
                  size="sm"
                  onClick={() => handleRespond(invite.id, true)}
                  disabled={respondingId === invite.id}
                  className="bg-green-600 hover:bg-green-700 text-white gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  {locale === 'ar' ? 'قبول' : 'Accept'}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleRespond(invite.id, false)}
                  disabled={respondingId === invite.id}
                  className="border-red-300 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/20 gap-1.5"
                >
                  <X className="w-4 h-4" />
                  {locale === 'ar' ? 'رفض' : 'Decline'}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Toolbar: Search + View Toggle */}
      {teams.length > 0 && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={locale === 'ar' ? 'البحث في الفرق...' : 'Search teams...'}
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
      {teams.length === 0 ? (
        <div className="card-modern">
          <div className="flex flex-col items-center justify-center py-20 px-6">
            <div className="w-20 h-20 bg-gradient-to-br from-primary/12 to-orange-500/12 rounded-full flex items-center justify-center mb-6">
              <Users className="w-10 h-10 text-primary" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{t('noTeams')}</h3>
            <p className="text-gray-600 dark:text-gray-400 text-center mb-6 max-w-md">
              {locale === 'ar' ? 'تصفح الفعاليات وانضم إلى فريق للبدء' : 'Browse events and join a team to get started'}
            </p>
            <Link href="/events">
              <Button size="lg" className="bg-gradient-to-r from-primary to-orange-600">
                <Calendar className="w-5 h-5 me-2" />
                {t('browseEvents')}
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
          {filtered.map((team) => (
            <div
              key={team.id}
              className="group card-modern overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            >
              <div className="h-1 bg-gradient-to-r from-orange-500 via-primary to-amber-600" />

              <CardHeader className="pb-4">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <CardTitle className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-primary dark:group-hover:text-primary transition-colors line-clamp-2">
                    {team.name}
                  </CardTitle>
                  {team.isLocked && (
                    <span className="shrink-0 px-3 py-1.5 text-xs font-semibold rounded-full bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 dark:from-gray-800 dark:to-gray-700 dark:text-gray-300 shadow-sm flex items-center gap-1">
                      <Lock className="w-3 h-3" />
                      {t('locked')}
                    </span>
                  )}
                </div>
                <CardDescription className="line-clamp-2 text-gray-600 dark:text-gray-400">
                  {team.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4 pb-4">
                <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20 rounded-lg">
                  <div className="w-8 h-8 bg-white dark:bg-gray-800 rounded-lg flex items-center justify-center shrink-0 shadow-sm">
                    <Calendar className="w-4 h-4 text-primary dark:text-orange-300" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{t('event')}</p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{team.event.name}</p>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      {t('members')} ({team.members.length})
                    </p>
                  </div>
                  <div className="space-y-2">
                    {team.members.slice(0, 3).map((member) => (
                      <div key={member.id} className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                        <div className="w-8 h-8 bg-gradient-to-br from-primary to-orange-600 rounded-full flex items-center justify-center text-white text-xs font-semibold shrink-0">
                          {member.user.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm text-gray-900 dark:text-white font-medium truncate flex-1">
                          {member.user.name}
                        </span>
                        {member.role === 'LEADER' && (
                          <span className="shrink-0 px-2 py-1 text-xs font-semibold bg-gradient-to-r from-amber-100 to-yellow-200 text-amber-800 dark:from-amber-900/30 dark:to-yellow-800/30 dark:text-amber-400 rounded-full flex items-center gap-1 shadow-sm">
                            <Crown className="w-3 h-3" />
                            {t('leader')}
                          </span>
                        )}
                      </div>
                    ))}
                    {team.members.length > 3 && (
                      <div className="flex items-center gap-2 p-2 text-sm text-gray-500 dark:text-gray-400">
                        <UserPlus className="w-4 h-4" />
                        +{team.members.length - 3} {t('more')}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>

              <CardFooter className="pt-4 border-t border-gray-100 dark:border-gray-800">
                <Link href={`/teams/${team.id}`} className="w-full">
                  <Button variant="outline" className="w-full group/btn border-2 hover:border-primary hover:bg-primary/5 transition-colors">
                    {t('viewTeam')}
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
          {filtered.map((team) => (
            <div
              key={team.id}
              className="group flex items-center gap-4 p-4 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-primary/40 hover:shadow-md transition-all"
            >
              {/* Avatar */}
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-orange-600 rounded-xl flex items-center justify-center text-white font-bold text-base shrink-0">
                {team.name.charAt(0).toUpperCase()}
              </div>

              {/* Name + event */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-gray-900 dark:text-white group-hover:text-primary transition-colors truncate">
                    {team.name}
                  </p>
                  {team.isLocked && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                      <Lock className="w-3 h-3" /> {t('locked')}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                  {team.event.name}
                </p>
              </div>

              {/* Member count */}
              <div className="hidden sm:flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 shrink-0">
                <Users className="w-3.5 h-3.5" />
                {team.members.length} {t('members')}
              </div>

              {/* Member avatars */}
              <div className="hidden md:flex -space-x-2 rtl:space-x-reverse shrink-0">
                {team.members.slice(0, 4).map((m) => (
                  <div
                    key={m.id}
                    title={m.user.name}
                    className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-orange-600 border-2 border-white dark:border-gray-900 flex items-center justify-center text-white text-xs font-semibold"
                  >
                    {m.user.name.charAt(0).toUpperCase()}
                  </div>
                ))}
                {team.members.length > 4 && (
                  <div className="w-7 h-7 rounded-full bg-gray-200 dark:bg-gray-700 border-2 border-white dark:border-gray-900 flex items-center justify-center text-xs font-semibold text-gray-600 dark:text-gray-300">
                    +{team.members.length - 4}
                  </div>
                )}
              </div>

              {/* CTA */}
              <Link href={`/teams/${team.id}`} className="shrink-0">
                <Button size="sm" variant="outline" className="group/btn border-2 hover:border-primary hover:bg-primary/5">
                  {t('viewTeam')}
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
