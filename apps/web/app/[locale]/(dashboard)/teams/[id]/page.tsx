'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { teamsApi, usersApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Link } from '@/i18n/routing';
import {
  FileText, Search, UserCheck, UserX, CheckCircle2, Send,
  X, Crown, Lock, Users, Loader2,
} from 'lucide-react';

interface Team {
  id: string;
  name: string;
  description: string;
  event: {
    id: string;
    name: string;
    maxTeamSize?: number;
  };
  members: Array<{
    id: string;
    user: { id: string; name: string; email: string };
    role: string;
  }>;
  invites: Array<{
    id: string;
    email: string;
    status: string;
  }>;
  isLocked: boolean;
}

interface UserResult {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  bio?: string;
  skills?: string[];
}

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

export default function TeamDetailPage() {
  const params = useParams();
  const t = useTranslations('teams');
  const locale = useLocale();
  const [team, setTeam] = useState<Team | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isInviting, setIsInviting] = useState(false);

  // Invite search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserResult | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchDone, setSearchDone] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const debouncedQuery = useDebounce(searchQuery, 350);
  const teamId = params.id as string;

  useEffect(() => {
    loadTeam();
  }, [teamId]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Search users as query changes
  useEffect(() => {
    if (!debouncedQuery || debouncedQuery.length < 2) {
      setSearchResults([]);
      setSearchDone(false);
      setShowDropdown(false);
      return;
    }
    searchUsers(debouncedQuery);
  }, [debouncedQuery]);

  const searchUsers = async (q: string) => {
    setIsSearching(true);
    setSearchDone(false);
    try {
      const res = await usersApi.search({ q, limit: 8 });
      const data = res.data?.data ?? res.data ?? [];
      setSearchResults(Array.isArray(data) ? data : []);
      setSearchDone(true);
      setShowDropdown(true);
    } catch {
      setSearchResults([]);
      setSearchDone(true);
    } finally {
      setIsSearching(false);
    }
  };

  const loadTeam = async () => {
    try {
      setIsLoading(true);
      const response = await teamsApi.getById(teamId);
      const teamData = response.data?.data || response.data;
      setTeam(teamData);
    } catch (err: any) {
      setError(err.response?.data?.error?.message?.en || err.response?.data?.message || t('loadError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectUser = (user: UserResult) => {
    setSelectedUser(user);
    setSearchQuery(user.email);
    setShowDropdown(false);
  };

  const handleClearSelection = () => {
    setSelectedUser(null);
    setSearchQuery('');
    setSearchResults([]);
    setSearchDone(false);
  };

  const handleInvite = async () => {
    const email = selectedUser?.email || searchQuery.trim();
    if (!email || !email.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }
    try {
      setIsInviting(true);
      const response = await teamsApi.invite(teamId, email);
      const message = response.data?.message;
      const successMsg = typeof message === 'object' ? (message[locale] || message.en) : (message || 'Invitation sent successfully');
      toast.success(successMsg, { duration: 4000 });
      handleClearSelection();
      loadTeam();
    } catch (err: any) {
      const errorData = err.response?.data;
      const errorMessage = errorData?.error?.message || errorData?.message;
      const errorMsg = errorMessage && typeof errorMessage === 'object'
        ? (errorMessage[locale] || errorMessage.en || t('inviteError'))
        : (errorMessage || t('inviteError'));
      toast.error(errorMsg, { duration: 5000 });
    } finally {
      setIsInviting(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    toast.promise(
      async () => {
        await teamsApi.removeMember(teamId, memberId);
        await loadTeam();
      },
      {
        loading: t('removing'),
        success: () => t('removedSuccessfully'),
        error: (err: any) => {
          const errorData = err.response?.data;
          const errorMessage = errorData?.error?.message || errorData?.message;
          return errorMessage && typeof errorMessage === 'object'
            ? (errorMessage[locale] || errorMessage.en || t('removeError'))
            : (errorMessage || t('removeError'));
        },
      }
    );
  };

  // Helpers
  const isAlreadyMember = (email: string) =>
    team?.members.some(m => m.user.email === email) ?? false;

  const isAlreadyInvited = (email: string) =>
    team?.invites.some(i => i.email === email && i.status === 'PENDING') ?? false;

  const emailIsValid = searchQuery.includes('@') && searchQuery.includes('.');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">{t('loading')}</p>
        </div>
      </div>
    );
  }

  if (error || !team) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400">{error || t('notFound')}</p>
        </div>
      </div>
    );
  }

  const alreadyMember = selectedUser ? isAlreadyMember(selectedUser.email) : (emailIsValid ? isAlreadyMember(searchQuery) : false);
  const alreadyInvited = selectedUser ? isAlreadyInvited(selectedUser.email) : (emailIsValid ? isAlreadyInvited(searchQuery) : false);
  const canSendInvite = (selectedUser || emailIsValid) && !alreadyMember && !alreadyInvited;

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">{team.name}</h1>
            <p className="text-lg text-gray-600 dark:text-gray-400">{team.description}</p>
          </div>
          {team.isLocked && (
            <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300 rounded-full text-sm flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5" /> {t('locked')}
            </span>
          )}
        </div>
        <p className="mt-4 text-sm text-gray-500">
          {t('event')}: {team.event.name}
          {team.event.maxTeamSize && (
            <span className="ms-3 text-gray-400">
              · {team.members.length}/{team.event.maxTeamSize} {locale === 'ar' ? 'أعضاء' : 'members'}
            </span>
          )}
        </p>
      </div>

      {/* Quick Actions */}
      <div className="mb-6 flex gap-3">
        <Link href={`/submissions/create?teamId=${team.id}`}>
          <Button className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Create Submission
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Team Members */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                {t('members')} ({team.members.length})
              </CardTitle>
              <CardDescription>{t('membersDescription')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {team.members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/20 rounded-full flex items-center justify-center shrink-0">
                        <span className="text-indigo-600 dark:text-indigo-400 font-medium">
                          {member.user.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{member.user.name}</p>
                        <p className="text-sm text-gray-500">{member.user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {member.role === 'LEADER' && (
                        <span className="px-2 py-1 text-xs bg-amber-100 dark:bg-amber-900/20 text-amber-800 dark:text-amber-400 rounded-full flex items-center gap-1">
                          <Crown className="w-3 h-3" /> {t('leader')}
                        </span>
                      )}
                      {member.role !== 'LEADER' && !team.isLocked && (
                        <Button variant="outline" size="sm" onClick={() => handleRemoveMember(member.user.id)}>
                          {t('remove')}
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Invite Member */}
          {!team.isLocked && (
            <Card>
              <CardHeader>
                <CardTitle>{t('inviteMember')}</CardTitle>
                <CardDescription>
                  {locale === 'ar'
                    ? 'ابحث عن مستخدم أو أدخل بريد إلكتروني'
                    : 'Search a user or enter any email'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Search input */}
                <div ref={searchRef} className="relative">
                  <div className="relative">
                    {isSearching ? (
                      <Loader2 className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" />
                    ) : (
                      <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    )}
                    <Input
                      type="text"
                      placeholder={locale === 'ar' ? 'اسم أو بريد إلكتروني...' : 'Name or email...'}
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        if (selectedUser && e.target.value !== selectedUser.email) {
                          setSelectedUser(null);
                        }
                      }}
                      onFocus={() => searchResults.length > 0 && setShowDropdown(true)}
                      className="ps-9 pe-9"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={handleClearSelection}
                        className="absolute end-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Results dropdown */}
                  {showDropdown && searchResults.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg overflow-hidden">
                      {searchResults.map((user) => {
                        const isMember = isAlreadyMember(user.email);
                        const isInvited = isAlreadyInvited(user.email);
                        return (
                          <button
                            key={user.id}
                            type="button"
                            onClick={() => !isMember && !isInvited && handleSelectUser(user)}
                            disabled={isMember || isInvited}
                            className={`w-full flex items-center gap-3 px-4 py-3 text-start transition-colors ${
                              isMember || isInvited
                                ? 'opacity-50 cursor-not-allowed bg-gray-50 dark:bg-gray-800/50'
                                : 'hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer'
                            }`}
                          >
                            <div className="w-8 h-8 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-semibold shrink-0">
                              {user.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{user.name}</p>
                              <p className="text-xs text-gray-500 truncate">{user.email}</p>
                            </div>
                            <div className="shrink-0">
                              {isMember ? (
                                <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                                  {locale === 'ar' ? 'عضو' : 'Member'}
                                </span>
                              ) : isInvited ? (
                                <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                                  {locale === 'ar' ? 'مدعو' : 'Invited'}
                                </span>
                              ) : (
                                <UserCheck className="w-4 h-4 text-indigo-500" />
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* No results found after search */}
                  {showDropdown && searchDone && searchResults.length === 0 && debouncedQuery.length >= 2 && (
                    <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg px-4 py-3 flex items-center gap-2 text-sm text-gray-500">
                      <UserX className="w-4 h-4 shrink-0" />
                      {locale === 'ar' ? 'لا يوجد مستخدم بهذا الاسم/البريد في النظام' : 'No registered user found'}
                    </div>
                  )}
                </div>

                {/* Selected user preview */}
                {selectedUser && (
                  <div className="flex items-center gap-3 p-3 bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-800 rounded-lg">
                    <div className="w-9 h-9 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold shrink-0">
                      {selectedUser.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{selectedUser.name}</p>
                      <p className="text-xs text-gray-500 truncate">{selectedUser.email}</p>
                    </div>
                    <CheckCircle2 className="w-5 h-5 text-indigo-500 shrink-0" />
                  </div>
                )}

                {/* Status feedback for manually-typed email */}
                {!selectedUser && emailIsValid && searchDone && (
                  searchResults.some(u => u.email.toLowerCase() === searchQuery.toLowerCase()) ? null : (
                    <div className="flex items-center gap-2 text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 px-3 py-2 rounded-lg">
                      <UserX className="w-4 h-4 shrink-0" />
                      {locale === 'ar'
                        ? 'هذا البريد غير مسجل في النظام — سيتم إرسال دعوة لهم عند التسجيل'
                        : 'Not registered yet — invite will be waiting when they sign up'}
                    </div>
                  )
                )}

                {/* Already member / invited feedback */}
                {alreadyMember && (
                  <p className="text-xs text-red-600 dark:text-red-400">
                    {locale === 'ar' ? 'هذا المستخدم عضو في الفريق بالفعل' : 'This user is already a team member'}
                  </p>
                )}
                {alreadyInvited && !alreadyMember && (
                  <p className="text-xs text-amber-600 dark:text-amber-400">
                    {locale === 'ar' ? 'تم إرسال دعوة لهذا البريد بالفعل' : 'An invite was already sent to this email'}
                  </p>
                )}

                <Button
                  className="w-full gap-2"
                  onClick={handleInvite}
                  disabled={isInviting || !canSendInvite}
                >
                  {isInviting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  {isInviting ? t('inviting') : t('sendInvite')}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Pending Invites */}
          {team.invites.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>{t('pendingInvites')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {team.invites.map((invite) => (
                    <div key={invite.id} className="flex items-center justify-between p-2 text-sm rounded-lg bg-gray-50 dark:bg-gray-800/50">
                      <span className="text-gray-700 dark:text-gray-300 truncate">{invite.email}</span>
                      <span className="text-xs text-amber-600 dark:text-amber-400 ms-2 shrink-0">
                        {t(`inviteStatus.${invite.status}`)}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
