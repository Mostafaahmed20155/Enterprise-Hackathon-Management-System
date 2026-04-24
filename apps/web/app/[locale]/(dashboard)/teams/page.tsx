'use client';

import { useEffect, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Link } from '@/i18n/routing';
import { usersApi, teamsApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import {
  Users, Lock, Crown, Calendar, RefreshCw, ArrowRight, UserPlus,
  Bell, Check, X, Search, LayoutGrid, List, Shield, Zap,
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

const TEAM_GRADIENTS = [
  'from-[oklch(0.64_0.2_38)] to-[oklch(0.58_0.16_32)]',
  'from-[oklch(0.7_0.17_48)] to-[oklch(0.64_0.2_38)]',
  'from-[oklch(0.58_0.16_32)] to-[oklch(0.52_0.12_28)]',
  'from-[oklch(0.72_0.14_58)] to-[oklch(0.64_0.2_38)]',
  'from-[oklch(0.62_0.18_42)] to-[oklch(0.54_0.14_35)]',
];

function getGradient(index: number) {
  return TEAM_GRADIENTS[index % TEAM_GRADIENTS.length];
}

function MemberAvatar({ name, index = 0, size = 'md' }: { name: string; index?: number; size?: 'sm' | 'md' }) {
  const gradient = getGradient(index);
  const sizeClass = size === 'sm' ? 'w-7 h-7 text-[10px]' : 'w-9 h-9 text-xs';
  return (
    <div className={`${sizeClass} rounded-full bg-gradient-to-br ${gradient} border-2 border-background flex items-center justify-center text-white font-bold shrink-0`}>
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

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
      // silently ignore
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
        <div className="text-center space-y-5">
          <div className="relative w-16 h-16 mx-auto">
            <div className="absolute inset-0 rounded-full border-4 border-border" />
            <div className="absolute inset-0 rounded-full border-4 border-t-primary border-r-transparent border-b-transparent border-l-transparent animate-spin" />
            <div className="absolute inset-2 rounded-full bg-primary/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-primary" />
            </div>
          </div>
          <p className="text-muted-foreground text-sm font-medium tracking-wide">{t('loading')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-destructive/10 border border-destructive/20 flex items-center justify-center mx-auto">
            <span className="text-2xl">⚠️</span>
          </div>
          <p className="text-destructive font-medium">{error}</p>
          <Button onClick={loadTeams} variant="outline" className="gap-2">
            <RefreshCw className="w-4 h-4" />
            {t('retry')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">

      {/* ── Page Header ──────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/8 via-background to-[oklch(0.7_0.17_48)]/8 border border-border p-6 sm:p-8">
        {/* decorative rings */}
        <div className="pointer-events-none absolute -top-12 -end-12 w-48 h-48 rounded-full border border-primary/15" />
        <div className="pointer-events-none absolute -top-6 -end-6 w-32 h-32 rounded-full border border-primary/10" />

        <div className="relative flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold uppercase tracking-wider mb-4">
              <Zap className="w-3 h-3" />
              {locale === 'ar' ? 'فرقي' : 'My Teams'}
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2" style={{ fontFamily: 'var(--font-serif)' }}>
              {t('myTeams')}
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base max-w-lg">{t('myTeamsDescription')}</p>
          </div>

          {teams.length > 0 && (
            <div className="flex items-center gap-4 shrink-0">
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">{teams.length}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{locale === 'ar' ? 'فريق' : 'Teams'}</p>
              </div>
              <div className="w-px h-10 bg-border" />
              <div className="text-center">
                <p className="text-2xl font-bold text-foreground">
                  {teams.reduce((acc, t) => acc + t.members.length, 0)}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">{locale === 'ar' ? 'عضو' : 'Members'}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Pending Invites ───────────────────────────────────────────── */}
      {invites.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-7 h-7 rounded-full bg-amber-500/15 border border-amber-500/25">
              <Bell className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            </div>
            <h2 className="text-sm font-semibold text-foreground">
              {locale === 'ar' ? 'دعوات معلقة' : 'Pending Invites'}
              <span className="ms-2 inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-500 text-white text-[10px] font-bold">
                {invites.length}
              </span>
            </h2>
          </div>

          {invites.map((invite) => (
            <div
              key={invite.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5 rounded-xl border-2 border-amber-300/60 dark:border-amber-700/40 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/15 dark:to-orange-950/10"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center text-white font-bold text-lg shrink-0 shadow-sm">
                  {invite.team.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-foreground">{invite.team.name}</p>
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium text-foreground/70">{invite.team.event.name}</span>
                    {' · '}
                    {locale === 'ar' ? 'من' : 'by'} {invite.team.leader.name}
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
                  className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 shadow-sm"
                >
                  <Check className="w-3.5 h-3.5" />
                  {locale === 'ar' ? 'قبول' : 'Accept'}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleRespond(invite.id, false)}
                  disabled={respondingId === invite.id}
                  className="border-red-300 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/20 gap-1.5"
                >
                  <X className="w-3.5 h-3.5" />
                  {locale === 'ar' ? 'رفض' : 'Decline'}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Toolbar ───────────────────────────────────────────────────── */}
      {teams.length > 0 && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute start-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={locale === 'ar' ? 'البحث في الفرق...' : 'Search teams…'}
              className="w-full ps-10 pe-10 py-2.5 bg-background border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring transition"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute end-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1 p-1 bg-muted rounded-xl">
            {(['grid', 'list'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                title={mode === 'grid' ? (locale === 'ar' ? 'شبكة' : 'Grid') : (locale === 'ar' ? 'قائمة' : 'List')}
                className={`flex items-center justify-center px-3 py-2 rounded-lg transition-all ${
                  viewMode === mode
                    ? 'bg-background shadow-sm text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {mode === 'grid' ? <LayoutGrid className="w-4 h-4" /> : <List className="w-4 h-4" />}
              </button>
            ))}
          </div>

          {search && (
            <span className="text-xs text-muted-foreground whitespace-nowrap px-2">
              {filtered.length} {locale === 'ar' ? 'نتيجة' : 'results'}
            </span>
          )}
        </div>
      )}

      {/* ── Empty State ───────────────────────────────────────────────── */}
      {teams.length === 0 ? (
        <div className="relative overflow-hidden rounded-2xl border-2 border-dashed border-border bg-gradient-to-br from-muted/40 to-muted/20 py-20 px-6 text-center">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,oklch(0.64_0.2_38/0.04)_0%,transparent_70%)]" />
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/15 to-[oklch(0.7_0.17_48)]/15 border border-primary/20 flex items-center justify-center mx-auto mb-6">
              <Users className="w-10 h-10 text-primary" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">{t('noTeams')}</h3>
            <p className="text-muted-foreground text-sm mb-8 max-w-sm mx-auto">
              {locale === 'ar' ? 'تصفح الفعاليات وانضم إلى فريق للبدء في رحلتك' : 'Browse events and join a team to begin your journey'}
            </p>
            <Link href="/events">
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2 shadow-md">
                <Calendar className="w-5 h-5" />
                {t('browseEvents')}
              </Button>
            </Link>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-14 h-14 rounded-xl bg-muted border border-border flex items-center justify-center mb-4">
            <Search className="w-6 h-6 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground font-medium text-sm">
            {locale === 'ar' ? `لا توجد نتائج لـ "${search}"` : `No results for "${search}"`}
          </p>
          <button onClick={() => setSearch('')} className="mt-3 text-xs text-primary hover:underline">
            {locale === 'ar' ? 'مسح البحث' : 'Clear search'}
          </button>
        </div>

      /* ── Grid View ──────────────────────────────────────────────────── */
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((team, idx) => {
            const leader = team.members.find(m => m.role === 'LEADER');
            const gradient = getGradient(idx);
            return (
              <div
                key={team.id}
                className="group relative flex flex-col rounded-2xl bg-card border border-border overflow-hidden hover:border-primary/40 hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5"
              >
                {/* color band */}
                <div className={`h-1.5 bg-gradient-to-r ${gradient} w-full`} />

                {/* card body */}
                <div className="p-5 flex-1 flex flex-col gap-4">

                  {/* header row */}
                  <div className="flex items-start gap-3">
                    <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-bold text-base shrink-0 shadow-sm`}>
                      {team.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors truncate text-base">
                          {team.name}
                        </h3>
                        {team.isLocked && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded-full bg-muted text-muted-foreground border border-border">
                            <Lock className="w-2.5 h-2.5" />
                            {t('locked')}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">{team.description}</p>
                    </div>
                  </div>

                  {/* event badge */}
                  <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-muted/60 border border-border/60">
                    <Calendar className="w-3.5 h-3.5 text-primary shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">{t('event')}</p>
                      <p className="text-xs font-semibold text-foreground truncate">{team.event.name}</p>
                    </div>
                  </div>

                  {/* members */}
                  <div className="flex-1">
                    <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide mb-2.5 flex items-center gap-1.5">
                      <Users className="w-3 h-3" />
                      {t('members')} · {team.members.length}
                    </p>
                    <div className="space-y-1.5">
                      {team.members.slice(0, 3).map((member, mi) => (
                        <div key={member.id} className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-muted/50 transition-colors">
                          <MemberAvatar name={member.user.name} index={mi} />
                          <span className="text-sm text-foreground font-medium truncate flex-1">{member.user.name}</span>
                          {member.role === 'LEADER' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 shrink-0">
                              <Crown className="w-2.5 h-2.5" />
                              {t('leader')}
                            </span>
                          )}
                        </div>
                      ))}
                      {team.members.length > 3 && (
                        <div className="flex items-center gap-2.5 px-2.5 py-1.5">
                          <div className="flex -space-x-1.5 rtl:space-x-reverse">
                            {team.members.slice(3, 6).map((m, mi) => (
                              <MemberAvatar key={m.id} name={m.user.name} index={mi + 3} size="sm" />
                            ))}
                          </div>
                          <span className="text-xs text-muted-foreground">+{team.members.length - 3} {t('more')}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* footer CTA */}
                  <Link href={`/teams/${team.id}`} className="block">
                    <Button
                      variant="outline"
                      className="w-full border-border hover:border-primary hover:bg-primary/5 hover:text-primary transition-all gap-2 text-sm"
                    >
                      {t('viewTeam')}
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </Button>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

      /* ── List View ──────────────────────────────────────────────────── */
      ) : (
        <div className="rounded-2xl border border-border bg-card overflow-hidden divide-y divide-border">
          {filtered.map((team, idx) => {
            const gradient = getGradient(idx);
            return (
              <div
                key={team.id}
                className="group flex items-center gap-4 px-5 py-4 hover:bg-muted/30 transition-colors"
              >
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-bold shrink-0`}>
                  {team.name.charAt(0).toUpperCase()}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-foreground group-hover:text-primary transition-colors text-sm truncate">
                      {team.name}
                    </p>
                    {team.isLocked && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] rounded-full bg-muted text-muted-foreground border border-border">
                        <Lock className="w-2.5 h-2.5" />
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate mt-0.5 flex items-center gap-1">
                    <Calendar className="w-3 h-3 shrink-0" />
                    {team.event.name}
                  </p>
                </div>

                <div className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                  <Users className="w-3.5 h-3.5" />
                  {team.members.length}
                </div>

                <div className="hidden md:flex -space-x-2 rtl:space-x-reverse shrink-0">
                  {team.members.slice(0, 4).map((m, mi) => (
                    <MemberAvatar key={m.id} name={m.user.name} index={mi} size="sm" />
                  ))}
                  {team.members.length > 4 && (
                    <div className="w-7 h-7 rounded-full bg-muted border-2 border-background flex items-center justify-center text-[10px] font-semibold text-muted-foreground">
                      +{team.members.length - 4}
                    </div>
                  )}
                </div>

                <Link href={`/teams/${team.id}`} className="shrink-0">
                  <Button size="sm" variant="outline" className="border-border hover:border-primary hover:bg-primary/5 hover:text-primary gap-1.5 text-xs transition-all">
                    {t('viewTeam')}
                    <ArrowRight className="w-3 h-3" />
                  </Button>
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
