'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { usersApi } from '@/lib/api';
import { useRouter } from '@/i18n/routing';
import { useCurrentUser } from '@/lib/queries';
import { getText, type BilingualText } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import {
  Users,
  Search,
  ShieldCheck,
  UserCheck,
  UserX,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  UserCog,
  Trash2,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

const ALL_ROLES = ['SUPER_ADMIN', 'ORGANIZER', 'JUDGE', 'PARTICIPANT'] as const;

interface UserRow {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  emailVerified: boolean;
  preferredLocale: string;
  createdAt: string;
  userRoles: Array<{
    role: { name: string; displayName: string | { en: string; ar: string } };
  }>;
  teamMemberships?: Array<{ team: { id: string; name: BilingualText } }>;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

function getRoleBadgeColor(roleName: string) {
  switch (roleName) {
    case 'SUPER_ADMIN':
      return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
    case 'ORGANIZER':
      return 'bg-teal-100 text-teal-800 dark:bg-teal-950/35 dark:text-teal-300';
    case 'JUDGE':
      return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
    case 'PARTICIPANT':
      return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
    default:
      return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
  }
}

function getUserInitials(name: string) {
  return name
    .split(' ')
    .map((p) => p[0]?.toUpperCase() || '')
    .slice(0, 2)
    .join('');
}

interface CheckboxProps {
  checked: boolean;
  indeterminate?: boolean;
  onChange: () => void;
  disabled?: boolean;
  'aria-label'?: string;
}

function Checkbox({ checked, indeterminate, onChange, disabled, ...rest }: CheckboxProps) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate ?? false;
  }, [indeterminate]);
  return (
    <input
      ref={ref}
      type="checkbox"
      checked={checked}
      onChange={onChange}
      disabled={disabled}
      className="h-4 w-4 cursor-pointer rounded border-gray-300 text-[#0a0a0a] accent-[#0a0a0a] focus:ring-2 focus:ring-[#0a0a0a]/20 disabled:cursor-not-allowed"
      {...rest}
    />
  );
}

const GRID_COLS =
  'grid-cols-[2.25rem_minmax(0,1fr)_5.5rem] md:grid-cols-[2.25rem_minmax(0,1fr)_11rem_12rem_6.5rem_6.5rem]';

export default function AdminUsersPage() {
  const t = useTranslations('admin');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const router = useRouter();
  const { data: currentUser } = useCurrentUser();

  const [users, setUsers] = useState<UserRow[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);
  const [stats, setStats] = useState({ total: 0, active: 0, admins: 0 });

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmState, setConfirmState] = useState<
    { mode: 'single' | 'bulk'; userId?: string } | null
  >(null);
  const [deleting, setDeleting] = useState(false);

  const canManage = useMemo(
    () => currentUser?.userRoles?.some((ur) => ur.role?.name === 'SUPER_ADMIN') ?? false,
    [currentUser]
  );

  // Access guard
  useEffect(() => {
    if (currentUser === undefined) return;
    const allowed = currentUser?.userRoles?.some(
      (ur) => ur.role?.name === 'SUPER_ADMIN' || ur.role?.name === 'ORGANIZER'
    );
    if (!allowed) router.replace('/dashboard');
  }, [currentUser, router]);

  const loadUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await usersApi.listAll({
        q: query || undefined,
        role: roleFilter || undefined,
        page,
        limit: 15,
      });
      const data: UserRow[] = res.data?.data ?? res.data ?? [];
      const meta: Pagination =
        res.data?.pagination ?? {
          page: 1,
          limit: 15,
          total: data.length,
          totalPages: 1,
          hasNext: false,
          hasPrev: false,
        };
      setUsers(data);
      setPagination(meta);

      if (page === 1 && !query && !roleFilter) {
        const active = data.filter((u) => u.emailVerified).length;
        const admins = data.filter((u) =>
          u.userRoles?.some((ur) => ur.role?.name === 'SUPER_ADMIN')
        ).length;
        setStats({ total: meta.total, active, admins });
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.response?.data?.error?.message;
      setError(
        typeof msg === 'object' ? msg[locale] || msg.en || t('loadError') : msg || t('loadError')
      );
    } finally {
      setIsLoading(false);
    }
  }, [query, roleFilter, page, locale, t]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // Reset to page 1 + clear selection when filters change
  useEffect(() => {
    setPage(1);
    setSelected(new Set());
  }, [query, roleFilter]);

  const selectableUsers = useMemo(
    () => users.filter((u) => u.id !== currentUser?.id),
    [users, currentUser]
  );
  const allSelected =
    selectableUsers.length > 0 && selectableUsers.every((u) => selected.has(u.id));
  const someSelected = selectableUsers.some((u) => selected.has(u.id));

  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    setSelected((prev) => {
      if (selectableUsers.every((u) => prev.has(u.id))) {
        const next = new Set(prev);
        selectableUsers.forEach((u) => next.delete(u.id));
        return next;
      }
      const next = new Set(prev);
      selectableUsers.forEach((u) => next.add(u.id));
      return next;
    });
  };

  const clearSelection = () => setSelected(new Set());

  const goToPage = (next: number) => {
    setSelected(new Set());
    setPage(next);
  };

  const handleToggleStatus = async (user: UserRow) => {
    const newStatus = !user.emailVerified;
    const promise = usersApi.toggleStatus(user.id, newStatus);
    toast.promise(promise, {
      loading: t('loading'),
      success: () => {
        setUsers((prev) =>
          prev.map((u) => (u.id === user.id ? { ...u, emailVerified: newStatus } : u))
        );
        return t('statusUpdated');
      },
      error: t('updateError'),
    });
  };

  const confirmDelete = async () => {
    if (!confirmState) return;
    setDeleting(true);
    try {
      if (confirmState.mode === 'single' && confirmState.userId) {
        await usersApi.delete(confirmState.userId);
        toast.success(t('userDeleted'));
      } else {
        const ids = Array.from(selected);
        const results = await Promise.allSettled(ids.map((id) => usersApi.delete(id)));
        const fulfilled = results.filter((r) => r.status === 'fulfilled').length;
        const rejected = results.length - fulfilled;
        if (rejected > 0) {
          toast.error(`${t('usersDeleted', { count: fulfilled })} · ${rejected} ${t('deleteError')}`);
        } else {
          toast.success(t('usersDeleted', { count: fulfilled }));
        }
      }
      setConfirmState(null);
      clearSelection();
      await loadUsers();
    } catch (err: any) {
      const msg = err.response?.data?.message || err.response?.data?.error?.message;
      toast.error(
        typeof msg === 'object' ? msg[locale] || msg.en || t('deleteError') : msg || t('deleteError')
      );
    } finally {
      setDeleting(false);
    }
  };

  const getRoleDisplayName = (role: { name?: string }) => {
    const roleName = role?.name || '';
    try {
      return t(`roleNames.${roleName}`);
    } catch {
      return roleName;
    }
  };

  const renderTeams = (user: UserRow) => {
    const teams = (user.teamMemberships || []).map((m) => m.team);
    if (teams.length === 0) {
      return <span className="text-xs text-gray-400 dark:text-gray-500">{t('noTeams')}</span>;
    }
    return (
      <div className="flex flex-wrap gap-1">
        {teams.slice(0, 2).map((team) => (
          <span
            key={team.id}
            className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 max-w-[120px] truncate"
            title={getText(team.name, locale)}
          >
            {getText(team.name, locale)}
          </span>
        ))}
        {teams.length > 2 && (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-xs font-medium bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
            +{teams.length - 2}
          </span>
        )}
      </div>
    );
  };

  const statCards = [
    {
      icon: Users,
      value: stats.total || pagination?.total || '—',
      label: t('totalUsers'),
    },
    {
      icon: UserCheck,
      value: stats.active || '—',
      label: t('activeUsers'),
    },
    {
      icon: ShieldCheck,
      value: stats.admins || '—',
      label: t('adminUsers'),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-[#0a0a0a] rounded-xl flex items-center justify-center shadow-sm">
          <UserCog className="w-5 h-5 text-[oklch(0.85_0.17_130)]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('userManagement')}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{t('usersDescription')}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {statCards.map((s, i) => (
          <Card
            key={i}
            className="border border-gray-100 shadow-sm bg-white dark:bg-gray-900 dark:border-gray-800"
          >
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                <s.icon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{s.value}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t('searchPlaceholder')}
                className="ps-9"
              />
            </div>
            <div className="flex gap-2 flex-wrap items-center">
              <button
                onClick={() => setRoleFilter('')}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  !roleFilter
                    ? 'bg-[#0a0a0a] text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'
                }`}
              >
                {t('allRoles')}
              </button>
              {ALL_ROLES.map((r) => (
                <button
                  key={r}
                  onClick={() => setRoleFilter(roleFilter === r ? '' : r)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                    roleFilter === r
                      ? 'bg-[#0a0a0a] text-white shadow-sm'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'
                  }`}
                >
                  {t(`roleNames.${r}`)}
                </button>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={loadUsers}
                disabled={isLoading}
                className="shrink-0"
              >
                <RefreshCw className={`w-4 h-4 me-1.5 ${isLoading ? 'animate-spin' : ''}`} />
                {locale === 'ar' ? 'تحديث' : 'Refresh'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card className="border border-gray-200/70 dark:border-gray-800 shadow-sm overflow-hidden">
        {/* Bulk action bar */}
        {selected.size > 0 ? (
          <div className="flex items-center gap-3 px-5 py-3 bg-gray-50 dark:bg-gray-800/60 border-b border-gray-200 dark:border-gray-800">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
              {selected.size} {t('selected')}
            </span>
            <div className="ms-auto flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={clearSelection}
                disabled={deleting}
                className="gap-1.5"
              >
                <X className="w-3.5 h-3.5" />
                {t('clearSelection')}
              </Button>
              {canManage && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setConfirmState({ mode: 'bulk' })}
                  className="gap-1.5 bg-red-600 hover:bg-red-700"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  {t('deleteSelected')}
                </Button>
              )}
            </div>
          </div>
        ) : null}

        {/* Column headers (desktop) */}
        <div
          className={`hidden md:grid items-center gap-3 ${GRID_COLS} px-5 py-2.5 border-b border-gray-100 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-800/30 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400`}
        >
          <div>
            <Checkbox
              checked={allSelected}
              indeterminate={someSelected && !allSelected}
              onChange={toggleAll}
              disabled={!canManage || selectableUsers.length === 0}
              aria-label={t('selectAll')}
            />
          </div>
          <div>{t('users')}</div>
          <div>{t('roles')}</div>
          <div>{t('teams')}</div>
          <div>{t('status')}</div>
          <div className="text-end">{canManage ? t('deleteTooltip') : ''}</div>
        </div>

        <div>
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="text-center space-y-2">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0a0a0a] mx-auto" />
                <p className="text-sm text-gray-500">{t('loading')}</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-16">
              <div className="text-center space-y-3">
                <p className="text-red-600 dark:text-red-400">{error}</p>
                <Button variant="outline" size="sm" onClick={loadUsers}>
                  {t('retry')}
                </Button>
              </div>
            </div>
          ) : users.length === 0 ? (
            <div className="flex items-center justify-center py-16">
              <div className="text-center space-y-2">
                <Users className="w-10 h-10 text-gray-300 mx-auto" />
                <p className="text-gray-500 dark:text-gray-400">{t('noUsers')}</p>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {users.map((user) => {
                const isSelf = user.id === currentUser?.id;
                const isSelected = selected.has(user.id);
                return (
                  <div
                    key={user.id}
                    className={`grid items-center gap-3 ${GRID_COLS} px-5 py-3.5 transition-colors ${
                      isSelected
                        ? 'bg-[oklch(0.85_0.17_130/0.08)]'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-800/40'
                    }`}
                  >
                    {/* Checkbox */}
                    <div className="flex items-center" onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={isSelected}
                        onChange={() => toggleOne(user.id)}
                        disabled={!canManage || isSelf}
                        aria-label={user.name}
                      />
                    </div>

                    {/* User */}
                    <div
                      className="flex items-center gap-3 min-w-0 cursor-pointer"
                      onClick={() => router.push(`/admin/users/${user.id}`)}
                    >
                      <div className="w-9 h-9 bg-[#0a0a0a] rounded-full flex items-center justify-center text-[oklch(0.85_0.17_130)] font-semibold text-xs shrink-0">
                        {getUserInitials(user.name)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {user.name}
                          {isSelf && (
                            <span className="ms-2 text-xs font-normal text-gray-400">
                              ({locale === 'ar' ? 'أنت' : 'you'})
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {user.email}
                        </p>
                      </div>
                    </div>

                    {/* Roles */}
                    <div className="hidden md:flex items-center gap-1.5 flex-wrap">
                      {user.userRoles?.length > 0 ? (
                        [...new Map(user.userRoles.map((ur) => [ur.role?.name, ur])).values()].map(
                          (ur, i) => (
                            <span
                              key={i}
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(
                                ur.role?.name
                              )}`}
                            >
                              {getRoleDisplayName(ur.role)}
                            </span>
                          )
                        )
                      ) : (
                        <span className="text-xs text-gray-400 italic">{t('noRoles')}</span>
                      )}
                    </div>

                    {/* Teams */}
                    <div className="hidden md:flex items-center min-w-0">
                      {renderTeams(user)}
                    </div>

                    {/* Status */}
                    <div className="hidden md:flex items-center gap-1.5">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          user.emailVerified ? 'bg-green-500' : 'bg-gray-300'
                        }`}
                      />
                      <span className="text-xs text-gray-500">
                        {user.emailVerified ? t('active') : t('inactive')}
                      </span>
                    </div>

                    {/* Actions */}
                    <div
                      className="flex items-center justify-end gap-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => handleToggleStatus(user)}
                        title={user.emailVerified ? t('deactivateUser') : t('activateUser')}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        {user.emailVerified ? (
                          <UserX className="w-4 h-4 text-red-500" />
                        ) : (
                          <UserCheck className="w-4 h-4 text-green-500" />
                        )}
                      </button>
                      {canManage && !isSelf && (
                        <button
                          onClick={() => setConfirmState({ mode: 'single', userId: user.id })}
                          title={t('deleteTooltip')}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Card>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <Button
            variant="outline"
            size="sm"
            disabled={!pagination.hasPrev || isLoading}
            onClick={() => goToPage(pagination.page - 1)}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {t('page')} {pagination.page} {t('of')} {pagination.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={!pagination.hasNext || isLoading}
            onClick={() => goToPage(pagination.page + 1)}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}

      <ConfirmDialog
        open={confirmState !== null}
        title={
          confirmState?.mode === 'bulk'
            ? t('deleteSelectedConfirmTitle')
            : t('deleteConfirmTitle')
        }
        description={
          confirmState?.mode === 'bulk'
            ? t('deleteSelectedConfirmBody', { count: selected.size })
            : t('deleteConfirmBody')
        }
        confirmLabel={tCommon('delete')}
        cancelLabel={tCommon('cancel')}
        loadingLabel={t('deleting')}
        loading={deleting}
        destructive
        onConfirm={confirmDelete}
        onCancel={() => !deleting && setConfirmState(null)}
      />
    </div>
  );
}
