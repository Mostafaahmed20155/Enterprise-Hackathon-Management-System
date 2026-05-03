'use client';

import { useEffect, useState, useCallback } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { usersApi, authApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
    case 'SUPER_ADMIN': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
    case 'ORGANIZER':   return 'bg-teal-100 text-teal-800 dark:bg-teal-950/35 dark:text-teal-300';
    case 'JUDGE':       return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
    case 'PARTICIPANT': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
    default:            return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
  }
}

function getUserInitials(name: string) {
  return name.split(' ').map(p => p[0]?.toUpperCase() || '').slice(0, 2).join('');
}

export default function AdminUsersPage() {
  const t = useTranslations('admin');
  const locale = useLocale();
  const router = useRouter();

  const [users, setUsers] = useState<UserRow[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);
  const [stats, setStats] = useState({ total: 0, active: 0, admins: 0 });

  // Access guard
  useEffect(() => {
    authApi.getCurrentUser().then(res => {
      const roles = res.data?.userRoles?.map((ur: any) => ur.role?.name) || [];
      if (!roles.includes('SUPER_ADMIN') && !roles.includes('ORGANIZER')) {
        router.replace('/dashboard');
      }
    }).catch(() => router.replace('/dashboard'));
  }, []);

  const loadUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await usersApi.listAll({ q: query || undefined, role: roleFilter || undefined, page, limit: 15 });
      const data = res.data?.data ?? res.data ?? [];
      const meta: Pagination = res.data?.pagination ?? { page: 1, limit: 15, total: data.length, totalPages: 1, hasNext: false, hasPrev: false };
      setUsers(data);
      setPagination(meta);

      // Compute stats from full dataset (only meaningful on page 1 without filters)
      if (page === 1 && !query && !roleFilter) {
        const active = data.filter((u: UserRow) => u.emailVerified).length;
        const admins = data.filter((u: UserRow) =>
          u.userRoles?.some(ur => ur.role?.name === 'SUPER_ADMIN')
        ).length;
        setStats({ total: meta.total, active, admins });
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.response?.data?.error?.message;
      setError(typeof msg === 'object' ? (msg[locale] || msg.en || t('loadError')) : (msg || t('loadError')));
    } finally {
      setIsLoading(false);
    }
  }, [query, roleFilter, page, locale]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // Debounce search
  useEffect(() => {
    setPage(1);
  }, [query, roleFilter]);

  const handleToggleStatus = async (user: UserRow) => {
    const newStatus = !user.emailVerified;
    const promise = usersApi.toggleStatus(user.id, newStatus);
    toast.promise(promise, {
      loading: t('loading'),
      success: () => {
        setUsers(prev => prev.map(u => u.id === user.id ? { ...u, emailVerified: newStatus } : u));
        return t('statusUpdated');
      },
      error: t('updateError'),
    });
  };

  const getRoleDisplayName = (role: any) => {
    const roleName = role?.name || '';
    // Use translation if available
    try { return t(`roleNames.${roleName}`); } catch { return roleName; }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-md">
          <UserCog className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('userManagement')}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{t('usersDescription')}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-0 shadow-sm bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-primary dark:text-green-300" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total || pagination?.total || '—'}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{t('totalUsers')}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-gradient-to-br from-green-50 to-teal-50 dark:from-green-950/25 dark:to-teal-950/25">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center">
              <UserCheck className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.active || '—'}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{t('activeUsers')}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950/30 dark:to-rose-950/30">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 bg-red-500/10 rounded-lg flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.admins || '—'}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{t('adminUsers')}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder={t('searchPlaceholder')}
                className="ps-9"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setRoleFilter('')}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  !roleFilter
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'
                }`}
              >
                {t('allRoles')}
              </button>
              {ALL_ROLES.map(r => (
                <button
                  key={r}
                  onClick={() => setRoleFilter(roleFilter === r ? '' : r)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                    roleFilter === r
                      ? 'bg-primary text-white shadow-sm'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'
                  }`}
                >
                  {t(`roleNames.${r}`)}
                </button>
              ))}
            </div>
            <Button variant="outline" size="sm" onClick={loadUsers} disabled={isLoading} className="shrink-0">
              <RefreshCw className={`w-4 h-4 me-1.5 ${isLoading ? 'animate-spin' : ''}`} />
              {locale === 'ar' ? 'تحديث' : 'Refresh'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card className="border-0 shadow-sm overflow-hidden">
        <CardHeader className="border-b border-gray-100 dark:border-gray-800 pb-4">
          <CardTitle className="text-base">
            {t('allUsers')}
            {pagination && (
              <span className="ms-2 text-sm font-normal text-gray-500">
                ({pagination.total})
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="text-center space-y-2">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
                <p className="text-sm text-gray-500">{t('loading')}</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-16">
              <div className="text-center space-y-3">
                <p className="text-red-600 dark:text-red-400">{error}</p>
                <Button variant="outline" size="sm" onClick={loadUsers}>{t('retry')}</Button>
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
              {users.map(user => (
                <div
                  key={user.id}
                  className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer group"
                  onClick={() => router.push(`/admin/users/${user.id}`)}
                >
                  {/* Avatar */}
                  <div className="w-10 h-10 bg-gradient-to-br from-primary to-green-600 rounded-full flex items-center justify-center text-white font-semibold text-sm shrink-0">
                    {getUserInitials(user.name)}
                  </div>

                  {/* Name & Email */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate group-hover:text-primary transition-colors">
                      {user.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
                  </div>

                  {/* Roles */}
                  <div className="hidden sm:flex items-center gap-1.5 flex-wrap justify-end max-w-[200px]">
                    {user.userRoles?.length > 0 ? (
                      user.userRoles.map((ur, i) => (
                        <span
                          key={i}
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(ur.role?.name)}`}
                        >
                          {getRoleDisplayName(ur.role)}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-gray-400 italic">{t('noRoles')}</span>
                    )}
                  </div>

                  {/* Status */}
                  <div className="hidden md:flex items-center gap-1.5 shrink-0">
                    <div className={`w-2 h-2 rounded-full ${user.emailVerified ? 'bg-green-500' : 'bg-gray-300'}`} />
                    <span className="text-xs text-gray-500">
                      {user.emailVerified ? t('active') : t('inactive')}
                    </span>
                  </div>

                  {/* Toggle Status */}
                  <button
                    onClick={e => { e.stopPropagation(); handleToggleStatus(user); }}
                    title={user.emailVerified ? t('deactivateUser') : t('activateUser')}
                    className="shrink-0 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    {user.emailVerified
                      ? <UserX className="w-4 h-4 text-red-500" />
                      : <UserCheck className="w-4 h-4 text-green-500" />
                    }
                  </button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <Button
            variant="outline"
            size="sm"
            disabled={!pagination.hasPrev || isLoading}
            onClick={() => setPage(p => p - 1)}
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
            onClick={() => setPage(p => p + 1)}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
