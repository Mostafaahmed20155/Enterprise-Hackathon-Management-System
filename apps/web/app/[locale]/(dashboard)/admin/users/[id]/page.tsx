'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from '@/i18n/routing';
import { usersApi, authApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  ArrowLeft,
  UserCheck,
  UserX,
  Shield,
  ShieldOff,
  Calendar,
  Globe,
  Mail,
  Plus,
  Trash2,
  AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';

const ALL_ROLES = ['SUPER_ADMIN', 'ORGANIZER', 'JUDGE', 'PARTICIPANT'] as const;
type RoleName = (typeof ALL_ROLES)[number];

interface UserDetail {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  bio?: string;
  skills?: string[];
  emailVerified: boolean;
  preferredLocale: string;
  timezone?: string;
  createdAt: string;
  userRoles: Array<{
    role: { id: string; name: string; displayName: string | { en: string; ar: string } };
    event?: { id: string; name: string | { en: string; ar: string } } | null;
  }>;
}

function getUserInitials(name: string) {
  return name.split(' ').map(p => p[0]?.toUpperCase() || '').slice(0, 2).join('');
}

function getRoleBadgeColor(roleName: string) {
  switch (roleName) {
    case 'SUPER_ADMIN': return 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800';
    case 'ORGANIZER':   return 'bg-teal-100 text-teal-800 border-teal-200 dark:bg-teal-950/35 dark:text-teal-300 dark:border-teal-800';
    case 'JUDGE':       return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800';
    case 'PARTICIPANT': return 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800';
    default:            return 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700';
  }
}

function getEventName(eventName: string | { en: string; ar: string } | undefined, locale: string): string {
  if (!eventName) return '';
  if (typeof eventName === 'string') return eventName;
  return eventName[locale as 'en' | 'ar'] || eventName.en || '';
}

export default function AdminUserDetailPage() {
  const t = useTranslations('admin');
  const locale = useLocale();
  const params = useParams();
  const router = useRouter();

  const userId = params.id as string;

  const [user, setUser] = useState<UserDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [selectedRole, setSelectedRole] = useState<RoleName | ''>('');
  const [isAssigning, setIsAssigning] = useState(false);

  // Load current user's role to determine permissions
  useEffect(() => {
    authApi.getCurrentUser().then(res => {
      const roles = res.data?.userRoles?.map((ur: any) => ur.role?.name) || [];
      if (!roles.includes('SUPER_ADMIN') && !roles.includes('ORGANIZER')) {
        router.replace('/dashboard');
        return;
      }
      setIsSuperAdmin(roles.includes('SUPER_ADMIN'));
    }).catch(() => router.replace('/dashboard'));
  }, []);

  useEffect(() => {
    loadUser();
  }, [userId]);

  const loadUser = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await usersApi.getById(userId);
      setUser(res.data?.id ? res.data : res.data?.data);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.response?.data?.error?.message;
      setError(typeof msg === 'object' ? (msg[locale] || msg.en || t('loadError')) : (msg || t('loadError')));
    } finally {
      setIsLoading(false);
    }
  };

  const handleAssignRole = async () => {
    if (!selectedRole || !user) return;
    setIsAssigning(true);
    try {
      const res = await usersApi.assignRole(user.id, selectedRole);
      setUser(res.data?.id ? res.data : res.data?.data);
      setSelectedRole('');
      toast.success(t('roleAssigned'));
    } catch (err: any) {
      const msg = err.response?.data?.message || err.response?.data?.error?.message;
      toast.error(typeof msg === 'object' ? (msg[locale] || msg.en || t('updateError')) : (msg || t('updateError')));
    } finally {
      setIsAssigning(false);
    }
  };

  const handleRemoveRole = async (roleName: string) => {
    if (!user) return;
    const promise = usersApi.removeRole(user.id, roleName);
    toast.promise(promise, {
      loading: t('loading'),
      success: res => {
        const updated = res.data?.id ? res.data : res.data?.data;
        if (updated) setUser(updated);
        return t('roleRemoved');
      },
      error: t('updateError'),
    });
  };

  const handleToggleStatus = async () => {
    if (!user) return;
    const newStatus = !user.emailVerified;
    const promise = usersApi.toggleStatus(user.id, newStatus);
    toast.promise(promise, {
      loading: t('loading'),
      success: () => {
        setUser(prev => prev ? { ...prev, emailVerified: newStatus } : prev);
        return t('statusUpdated');
      },
      error: t('updateError'),
    });
  };

  const getRoleDisplayName = (roleName: string) => {
    try { return t(`roleNames.${roleName}`); } catch { return roleName; }
  };

  // Global roles (eventId is null)
  const globalRoles = user?.userRoles?.filter(ur => !ur.event) || [];
  // Event-scoped roles
  const eventRoles = user?.userRoles?.filter(ur => ur.event) || [];

  // Available roles to assign (not already assigned globally)
  const assignedGlobalRoleNames = new Set(globalRoles.map(ur => ur.role.name));
  const availableRoles = ALL_ROLES.filter(r => !assignedGlobalRoleNames.has(r));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-2">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto" />
          <p className="text-sm text-gray-500">{t('loading')}</p>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-3">
          <p className="text-red-600 dark:text-red-400">{error || t('notFound')}</p>
          <div className="flex gap-2 justify-center">
            <Button variant="outline" size="sm" onClick={() => router.push('/admin/users')}>
              {t('back')}
            </Button>
            <Button size="sm" onClick={loadUser}>{t('retry')}</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Back */}
      <button
        onClick={() => router.push('/admin/users')}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        {t('back')}
      </button>

      {/* Profile Card */}
      <Card className="border-0 shadow-sm overflow-hidden">
        <div className="h-24 bg-primary/15" />
        <CardContent className="px-6 pb-6 -mt-12">
          <div className="flex items-end gap-4">
            <div className="w-20 h-20 bg-primary text-primary-foreground rounded-2xl flex items-center justify-center font-bold text-2xl shadow-sm ring-4 ring-white dark:ring-gray-900">
              {getUserInitials(user.name)}
            </div>
            <div className="pb-1">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">{user.name}</h1>
              <div className="flex items-center gap-1.5 mt-0.5">
                <div className={`w-2 h-2 rounded-full ${user.emailVerified ? 'bg-green-500' : 'bg-gray-400'}`} />
                <span className="text-sm text-gray-500">
                  {user.emailVerified ? t('active') : t('inactive')}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <Mail className="w-4 h-4 text-gray-400 shrink-0" />
              <span className="truncate">{user.email}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <Globe className="w-4 h-4 text-gray-400 shrink-0" />
              <span>{user.preferredLocale === 'ar' ? t('arabicPref') : t('englishPref')}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
              <span>{t('joinedOn')}: {new Date(user.createdAt).toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
          </div>

          {user.bio && (
            <p className="mt-4 text-sm text-gray-600 dark:text-gray-400 leading-relaxed border-t border-gray-100 dark:border-gray-800 pt-4">
              {user.bio}
            </p>
          )}

          {Array.isArray(user.skills) && user.skills.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {user.skills.map((skill, i) => (
                <span key={i} className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs rounded-full">
                  {skill}
                </span>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Platform Roles Card */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-amber-500" />
            {t('platformRoles')}
          </CardTitle>
          <CardDescription>{t('platformRolesDescription')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Current global roles */}
          {globalRoles.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {globalRoles.map((ur, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm font-medium ${getRoleBadgeColor(ur.role.name)}`}
                >
                  <span>{getRoleDisplayName(ur.role.name)}</span>
                  {isSuperAdmin && (
                    <button
                      onClick={() => handleRemoveRole(ur.role.name)}
                      className="hover:text-red-600 transition-colors ms-1"
                      title={t('removeRole')}
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 italic">{t('noRoles')}</p>
          )}

          {/* Assign new role (SUPER_ADMIN only) */}
          {isSuperAdmin && availableRoles.length > 0 && (
            <div className="flex items-center gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
              <select
                value={selectedRole}
                onChange={e => setSelectedRole(e.target.value as RoleName | '')}
                className="flex-1 h-9 rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="">{t('selectRole')}</option>
                {availableRoles.map(r => (
                  <option key={r} value={r}>{getRoleDisplayName(r)}</option>
                ))}
              </select>
              <Button
                size="sm"
                onClick={handleAssignRole}
                disabled={!selectedRole || isAssigning}
                className="shrink-0"
              >
                <Plus className="w-4 h-4 me-1.5" />
                {t('assign')}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Event-scoped Roles */}
      {eventRoles.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              {locale === 'ar' ? 'أدوار مرتبطة بالفعاليات' : 'Event-scoped Roles'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {eventRoles.map((ur, i) => (
                <div key={i} className="flex items-center justify-between py-2 px-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {getEventName(ur.event?.name, locale)}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getRoleBadgeColor(ur.role.name)}`}>
                    {getRoleDisplayName(ur.role.name)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Danger Zone (SUPER_ADMIN only) */}
      {isSuperAdmin && (
        <Card className="border-0 shadow-sm border-red-200 dark:border-red-900/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <AlertTriangle className="w-5 h-5" />
              {t('dangerZone')}
            </CardTitle>
            <CardDescription>{t('dangerZoneDescription')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-950/20 rounded-xl">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {user.emailVerified ? t('deactivateUser') : t('activateUser')}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {user.emailVerified
                    ? (locale === 'ar' ? 'يمنع المستخدم من تسجيل الدخول' : 'Prevents the user from signing in')
                    : (locale === 'ar' ? 'يسمح للمستخدم بتسجيل الدخول مجدداً' : 'Allows the user to sign in again')}
                </p>
              </div>
              <Button
                variant={user.emailVerified ? 'destructive' : 'outline'}
                size="sm"
                onClick={handleToggleStatus}
                className="shrink-0"
              >
                {user.emailVerified
                  ? <><UserX className="w-4 h-4 me-1.5" />{t('deactivateUser')}</>
                  : <><UserCheck className="w-4 h-4 me-1.5" />{t('activateUser')}</>}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
