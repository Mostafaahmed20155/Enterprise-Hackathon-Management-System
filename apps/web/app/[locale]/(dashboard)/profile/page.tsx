'use client';

import { useEffect, useState, useRef, KeyboardEvent } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { usersApi, authApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import {
  User,
  Mail,
  Calendar,
  Clock,
  Globe,
  Shield,
  Lock,
  CheckCircle2,
  XCircle,
  X,
  Plus,
  Pencil,
  Eye,
  EyeOff,
} from 'lucide-react';

// ──────────────────────────────────────────────────────────────────────────────
// Types & schemas
// ──────────────────────────────────────────────────────────────────────────────

const profileSchema = z.object({
  name: z.string().min(2),
  bio: z.string().optional(),
  timezone: z.string().optional(),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
  confirmNewPassword: z.string().min(8),
}).refine(d => d.newPassword === d.confirmNewPassword, {
  message: 'mismatch',
  path: ['confirmNewPassword'],
});

type ProfileFormData = z.infer<typeof profileSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;

interface UserProfile {
  id: string;
  name: string;
  email: string;
  bio?: string;
  timezone?: string;
  preferredLocale: string;
  skills: string[];
  emailVerified: boolean;
  emailVerifiedAt?: string;
  createdAt: string;
  lastLoginAt?: string;
  googleId?: string;
  githubId?: string;
  userRoles: Array<{ role: { name: string; displayName: string | { en: string; ar: string } } }>;
}

// ──────────────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────────────

function getUserInitials(name: string) {
  return name.split(' ').map(p => p[0]?.toUpperCase() || '').slice(0, 2).join('');
}

function formatDate(iso: string, locale: string) {
  return new Date(iso).toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
}

function getRoleBadgeClass(name: string) {
  const map: Record<string, string> = {
    SUPER_ADMIN: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    ORGANIZER:   'bg-orange-100 text-orange-800 dark:bg-orange-950/35 dark:text-orange-300',
    JUDGE:       'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    PARTICIPANT: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  };
  return map[name] ?? 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
}

const COMMON_TIMEZONES = [
  'Asia/Riyadh', 'Asia/Dubai', 'Asia/Kuwait', 'Asia/Bahrain', 'Asia/Qatar',
  'Asia/Muscat', 'Africa/Cairo', 'Asia/Amman', 'Asia/Beirut', 'Asia/Baghdad',
  'Africa/Casablanca', 'UTC', 'Europe/London', 'America/New_York', 'America/Los_Angeles',
];

// ──────────────────────────────────────────────────────────────────────────────
// Skills tag input
// ──────────────────────────────────────────────────────────────────────────────

function SkillsInput({ skills, onChange, placeholder, disabled }: {
  skills: string[];
  onChange: (skills: string[]) => void;
  placeholder: string;
  disabled?: boolean;
}) {
  const [inputVal, setInputVal] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const add = (raw: string) => {
    const skill = raw.trim().replace(/,+$/, '');
    if (skill && !skills.includes(skill)) {
      onChange([...skills, skill]);
    }
    setInputVal('');
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      add(inputVal);
    } else if (e.key === 'Backspace' && !inputVal && skills.length > 0) {
      onChange(skills.slice(0, -1));
    }
  };

  const remove = (skill: string) => onChange(skills.filter(s => s !== skill));

  return (
    <div
      className="flex flex-wrap gap-2 min-h-[42px] px-3 py-2 border border-input rounded-md bg-background cursor-text focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2"
      onClick={() => inputRef.current?.focus()}
    >
      {skills.map(skill => (
        <span
          key={skill}
          className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium"
        >
          {skill}
          {!disabled && (
            <button type="button" onClick={() => remove(skill)} className="hover:text-red-500 transition-colors">
              <X className="w-3 h-3" />
            </button>
          )}
        </span>
      ))}
      {!disabled && (
        <input
          ref={inputRef}
          value={inputVal}
          onChange={e => setInputVal(e.target.value)}
          onKeyDown={onKeyDown}
          onBlur={() => inputVal.trim() && add(inputVal)}
          placeholder={skills.length === 0 ? placeholder : ''}
          className="flex-1 min-w-[120px] bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Main page
// ──────────────────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const t = useTranslations('profile');
  const locale = useLocale();

  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [skills, setSkills] = useState<string[]>([]);
  const [teamsCount, setTeamsCount] = useState<number | null>(null);
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
  } = useForm<ProfileFormData>({ resolver: zodResolver(profileSchema) });

  const {
    register: regPw,
    handleSubmit: handlePwSubmit,
    formState: { errors: pwErrors },
    reset: resetPw,
    setError: setPwError,
  } = useForm<PasswordFormData>({ resolver: zodResolver(passwordSchema) });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setIsLoading(true);
      const [profileRes, teamsRes] = await Promise.allSettled([
        usersApi.getProfile(),
        usersApi.getMyTeams(),
      ]);

      if (profileRes.status === 'fulfilled') {
        const u: UserProfile = profileRes.value.data;
        setUser(u);
        setSkills(Array.isArray(u.skills) ? u.skills : []);
        reset({ name: u.name, bio: u.bio || '', timezone: u.timezone || '' });
      }

      if (teamsRes.status === 'fulfilled') {
        const teams = teamsRes.value.data;
        setTeamsCount(Array.isArray(teams) ? teams.length : (teams?.data?.length ?? 0));
      }
    } catch {
      toast.error(t('loadError'));
    } finally {
      setIsLoading(false);
    }
  };

  const onSaveProfile = async (data: ProfileFormData) => {
    const promise = usersApi.updateProfile({ ...data, skills });
    toast.promise(promise, {
      loading: t('saving'),
      success: res => {
        const updated = res.data;
        if (updated) setUser(prev => prev ? { ...prev, ...updated, skills: updated.skills ?? skills } : prev);
        return t('saveSuccess');
      },
      error: err => {
        const msg = err.response?.data?.message;
        return typeof msg === 'object' ? (msg[locale] || msg.en || t('saveError')) : (msg || t('saveError'));
      },
    });
  };

  const onChangeLocale = async (newLocale: string) => {
    const promise = usersApi.updateProfile({ preferredLocale: newLocale });
    toast.promise(promise, {
      loading: t('saving'),
      success: () => {
        setUser(prev => prev ? { ...prev, preferredLocale: newLocale } : prev);
        return t('languageSaved');
      },
      error: t('saveError'),
    });
  };

  const onChangePassword = async (data: PasswordFormData) => {
    if (data.newPassword !== data.confirmNewPassword) {
      setPwError('confirmNewPassword', { message: t('passwordMismatch') });
      return;
    }
    const promise = authApi.changePassword(data.currentPassword, data.newPassword);
    toast.promise(promise, {
      loading: t('saving'),
      success: () => { resetPw(); return t('passwordChanged'); },
      error: err => {
        const msg = err.response?.data?.message || err.response?.data?.error?.message;
        return typeof msg === 'object' ? (msg[locale] || msg.en || t('changePasswordError')) : (msg || t('changePasswordError'));
      },
    });
  };

  // ── Loading skeleton ────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto space-y-6 animate-pulse">
        <div className="h-48 bg-gray-200 dark:bg-gray-800 rounded-2xl" />
        <div className="h-64 bg-gray-200 dark:bg-gray-800 rounded-2xl" />
        <div className="h-48 bg-gray-200 dark:bg-gray-800 rounded-2xl" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-3">
          <p className="text-gray-500">{t('loadError')}</p>
          <Button onClick={loadProfile}>{t('retry')}</Button>
        </div>
      </div>
    );
  }

  const isOAuthOnly = !!user.googleId && !user.email;
  const globalRoles = user.userRoles?.filter((ur: any) => !ur.event) ?? [];

  return (
    <div className="max-w-3xl mx-auto space-y-6">

      {/* ── Profile Header ─────────────────────────────────────────────────── */}
      <div className="relative rounded-2xl overflow-hidden shadow-sm border-0">
        {/* Cover */}
        <div className="h-28 bg-gradient-to-r from-primary via-orange-500 to-amber-600" />

        {/* Content */}
        <div className="bg-white dark:bg-gray-900 px-6 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-12">
            {/* Avatar */}
            <div className="w-24 h-24 bg-gradient-to-br from-primary to-orange-600 rounded-2xl flex items-center justify-center text-white font-bold text-3xl shadow-xl ring-4 ring-white dark:ring-gray-900 shrink-0">
              {getUserInitials(user.name)}
            </div>

            <div className="flex-1 pb-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{user.name}</h1>
                {user.emailVerified
                  ? <span title={t('emailVerified')}><CheckCircle2 className="w-5 h-5 text-green-500" /></span>
                  : <span title={t('emailNotVerified')}><XCircle className="w-5 h-5 text-gray-400" /></span>
                }
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{user.email}</p>

              {/* Role badges */}
              {globalRoles.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {globalRoles.map((ur: any, i: number) => (
                    <span key={i} className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${getRoleBadgeClass(ur.role?.name)}`}>
                      {ur.role?.name === 'SUPER_ADMIN' ? (locale === 'ar' ? 'مدير النظام' : 'Super Admin') :
                       ur.role?.name === 'ORGANIZER' ? (locale === 'ar' ? 'منظم' : 'Organizer') :
                       ur.role?.name === 'JUDGE' ? (locale === 'ar' ? 'حكم' : 'Judge') :
                       (locale === 'ar' ? 'مشارك' : 'Participant')}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Quick stats */}
            {teamsCount !== null && (
              <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-gray-800 rounded-xl text-sm shrink-0">
                <Shield className="w-4 h-4 text-primary" />
                <span className="font-semibold text-gray-900 dark:text-white">{teamsCount}</span>
                <span className="text-gray-500">{t('teamsCount')}</span>
              </div>
            )}
          </div>

          {/* Bio preview */}
          {user.bio && (
            <p className="mt-4 text-sm text-gray-600 dark:text-gray-400 leading-relaxed border-t border-gray-100 dark:border-gray-800 pt-4">
              {user.bio}
            </p>
          )}
        </div>
      </div>

      {/* ── Personal Info Form ─────────────────────────────────────────────── */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Pencil className="w-4 h-4 text-primary" />
            {t('personalInfo')}
          </CardTitle>
          <CardDescription>{t('personalInfoDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSaveProfile)} className="space-y-5">
            {/* Name */}
            <div className="space-y-1.5">
              <Label htmlFor="name">{t('name')}</Label>
              <Input
                id="name"
                placeholder={t('namePlaceholder')}
                {...register('name')}
              />
              {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
            </div>

            {/* Bio */}
            <div className="space-y-1.5">
              <Label htmlFor="bio">{t('bio')}</Label>
              <textarea
                id="bio"
                rows={3}
                placeholder={t('bioPlaceholder')}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
                {...register('bio')}
              />
            </div>

            {/* Timezone */}
            <div className="space-y-1.5">
              <Label htmlFor="timezone">{t('timezone')}</Label>
              <Input
                id="timezone"
                placeholder={t('timezonePlaceholder')}
                list="timezone-suggestions"
                {...register('timezone')}
              />
              <datalist id="timezone-suggestions">
                {COMMON_TIMEZONES.map(tz => <option key={tz} value={tz} />)}
              </datalist>
            </div>

            {/* Skills */}
            <div className="space-y-1.5">
              <Label>{t('skills')}</Label>
              <SkillsInput
                skills={skills}
                onChange={setSkills}
                placeholder={t('skillsPlaceholder')}
              />
              <p className="text-xs text-gray-400">{t('skillsDescription')}</p>
            </div>

            <div className="flex justify-end pt-1">
              <Button type="submit">
                {t('save')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* ── Language Preference ────────────────────────────────────────────── */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-primary" />
            {t('preferences')}
          </CardTitle>
          <CardDescription>{t('preferencesDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label>{t('preferredLanguage')}</Label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => onChangeLocale('ar')}
                className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-medium border-2 transition-all ${
                  user.preferredLocale === 'ar'
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-primary/50'
                }`}
              >
                العربية
              </button>
              <button
                type="button"
                onClick={() => onChangeLocale('en')}
                className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-medium border-2 transition-all ${
                  user.preferredLocale === 'en'
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-primary/50'
                }`}
              >
                English
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Account Information ────────────────────────────────────────────── */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-4 h-4 text-primary" />
            {t('accountInfo')}
          </CardTitle>
          <CardDescription>{t('accountInfoDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="space-y-4">
            <div className="flex items-start gap-3 py-3 border-b border-gray-100 dark:border-gray-800 last:border-0">
              <Mail className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <dt className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">{t('email')}</dt>
                <dd className="mt-0.5 text-sm font-medium text-gray-900 dark:text-white flex items-center gap-2 flex-wrap">
                  {user.email}
                  {user.emailVerified
                    ? <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-xs"><CheckCircle2 className="w-3 h-3" />{t('emailVerified')}</span>
                    : <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded-full text-xs"><XCircle className="w-3 h-3" />{t('emailNotVerified')}</span>
                  }
                </dd>
              </div>
            </div>

            <div className="flex items-start gap-3 py-3 border-b border-gray-100 dark:border-gray-800 last:border-0">
              <Calendar className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
              <div className="flex-1">
                <dt className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">{t('joinedOn')}</dt>
                <dd className="mt-0.5 text-sm font-medium text-gray-900 dark:text-white">
                  {formatDate(user.createdAt, locale)}
                </dd>
              </div>
            </div>

            {user.lastLoginAt && (
              <div className="flex items-start gap-3 py-3 border-b border-gray-100 dark:border-gray-800 last:border-0">
                <Clock className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                <div className="flex-1">
                  <dt className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">{t('lastLogin')}</dt>
                  <dd className="mt-0.5 text-sm font-medium text-gray-900 dark:text-white">
                    {formatDate(user.lastLoginAt, locale)}
                  </dd>
                </div>
              </div>
            )}

            <div className="flex items-start gap-3 py-3 last:border-0">
              <Shield className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
              <div className="flex-1">
                <dt className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">{t('authProvider')}</dt>
                <dd className="mt-0.5">
                  {user.googleId
                    ? <span className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-900 dark:text-white">
                        <svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                        {t('authGoogle')}
                      </span>
                    : <span className="text-sm font-medium text-gray-900 dark:text-white">{t('authEmail')}</span>
                  }
                </dd>
              </div>
            </div>
          </dl>
        </CardContent>
      </Card>

      {/* ── Change Password ────────────────────────────────────────────────── */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-primary" />
            {t('changePassword')}
          </CardTitle>
          <CardDescription>{t('changePasswordDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          {user.googleId && !user.email ? (
            <p className="text-sm text-gray-500 italic">{t('notAvailableForOAuth')}</p>
          ) : (
            <form onSubmit={handlePwSubmit(onChangePassword)} className="space-y-4">
              {/* Current password */}
              <div className="space-y-1.5">
                <Label htmlFor="currentPassword">{t('currentPassword')}</Label>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    type={showCurrentPw ? 'text' : 'password'}
                    placeholder={t('passwordPlaceholder')}
                    className="pe-10"
                    {...regPw('currentPassword')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPw(v => !v)}
                    className="absolute end-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showCurrentPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {pwErrors.currentPassword && <p className="text-xs text-red-500">{pwErrors.currentPassword.message}</p>}
              </div>

              {/* New password */}
              <div className="space-y-1.5">
                <Label htmlFor="newPassword">{t('newPassword')}</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showNewPw ? 'text' : 'password'}
                    placeholder={t('passwordPlaceholder')}
                    className="pe-10"
                    {...regPw('newPassword')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPw(v => !v)}
                    className="absolute end-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {pwErrors.newPassword && <p className="text-xs text-red-500">{t('passwordTooShort')}</p>}
              </div>

              {/* Confirm new password */}
              <div className="space-y-1.5">
                <Label htmlFor="confirmNewPassword">{t('confirmNewPassword')}</Label>
                <div className="relative">
                  <Input
                    id="confirmNewPassword"
                    type={showConfirmPw ? 'text' : 'password'}
                    placeholder={t('passwordPlaceholder')}
                    className="pe-10"
                    {...regPw('confirmNewPassword')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPw(v => !v)}
                    className="absolute end-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {pwErrors.confirmNewPassword && <p className="text-xs text-red-500">{t('passwordMismatch')}</p>}
              </div>

              <div className="flex justify-end pt-1">
                <Button type="submit" variant="outline">
                  <Lock className="w-4 h-4 me-2" />
                  {t('changePassword')}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>

    </div>
  );
}
