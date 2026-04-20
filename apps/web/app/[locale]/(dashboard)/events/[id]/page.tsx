'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { Link } from '@/i18n/routing';
import { eventsApi, authApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import {
  FileText, Users, Trophy, ClipboardList, Lock, Send,
  Clock, CheckCircle, Archive, ChevronRight,
  Search, Download, Mail, RefreshCw,
} from 'lucide-react';

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
  maxTeamSize: number;
  minTeamSize: number;
  isRegistered?: boolean;
  _count?: {
    teams: number;
    submissions: number;
    eventRegistrations: number;
  };
}

interface Participant {
  id: string;
  status: string;
  registeredAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    preferredLocale: string;
  };
}

function getText(value: BilingualText | undefined, locale: string): string {
  if (!value) return '';
  if (typeof value === 'string') return value;
  return value[locale as 'en' | 'ar'] || value.en || '';
}

// Ordered list of all states for the timeline
const STATE_ORDER = [
  'DRAFT',
  'PUBLISHED',
  'REGISTRATION_OPEN',
  'TEAM_FORMATION',
  'HACKING_PHASE',
  'SUBMISSION_CLOSED',
  'JUDGING',
  'RESULTS_PUBLISHED',
  'ARCHIVED',
];

const STATE_COLORS: Record<string, string> = {
  DRAFT:              'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  PUBLISHED:          'bg-orange-100 text-orange-800 dark:bg-orange-950/35 dark:text-orange-300',
  REGISTRATION_OPEN:  'bg-amber-100 text-amber-900 dark:bg-amber-950/35 dark:text-amber-300',
  TEAM_FORMATION:     'bg-amber-50 text-amber-900 dark:bg-orange-950/25 dark:text-orange-300',
  HACKING_PHASE:      'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  SUBMISSION_CLOSED:  'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  JUDGING:            'bg-orange-100 text-orange-800 dark:bg-orange-950/35 dark:text-orange-300',
  RESULTS_PUBLISHED:  'bg-amber-100 text-orange-900 dark:bg-amber-950/35 dark:text-orange-300',
  ARCHIVED:           'bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400',
};

const STATE_ICONS: Record<string, React.ReactNode> = {
  DRAFT:             <FileText className="w-4 h-4" />,
  PUBLISHED:         <Send className="w-4 h-4" />,
  REGISTRATION_OPEN: <ClipboardList className="w-4 h-4" />,
  TEAM_FORMATION:    <Users className="w-4 h-4" />,
  HACKING_PHASE:     <Clock className="w-4 h-4" />,
  SUBMISSION_CLOSED: <Lock className="w-4 h-4" />,
  JUDGING:           <ClipboardList className="w-4 h-4" />,
  RESULTS_PUBLISHED: <Trophy className="w-4 h-4" />,
  ARCHIVED:          <Archive className="w-4 h-4" />,
};

// Human-readable guidance for each state
const STATE_GUIDANCE: Record<string, { en: string; ar: string }> = {
  DRAFT: {
    en: 'The event is being set up. Fill in all details and click Publish when ready to open it.',
    ar: 'الحدث في مرحلة الإعداد. أكمل جميع التفاصيل واضغط على نشر عندما تكون مستعداً.',
  },
  PUBLISHED: {
    en: 'The event is published and visible. Registration will open automatically at the scheduled time.',
    ar: 'الحدث منشور ومرئي. سيفتح التسجيل تلقائياً في الوقت المحدد.',
  },
  REGISTRATION_OPEN: {
    en: 'Registration is open! Participants can now register, create teams, and invite members.',
    ar: 'التسجيل مفتوح! يمكن للمشاركين الآن التسجيل وإنشاء الفرق ودعوة الأعضاء.',
  },
  TEAM_FORMATION: {
    en: 'Registration has closed. Teams can still be formed and members invited before hacking begins.',
    ar: 'أُغلق التسجيل. لا تزال الفرق قابلة للتشكيل ودعوة الأعضاء قبل بدء القرصنة.',
  },
  HACKING_PHASE: {
    en: 'Hacking has started! Teams are locked. Participants should now work on their projects and submit.',
    ar: 'بدأت مرحلة البناء! الفرق مقفلة. يجب على المشاركين الآن العمل على مشاريعهم وتقديمها.',
  },
  SUBMISSION_CLOSED: {
    en: 'Submissions are closed. Organizers can now move the event to the judging phase.',
    ar: 'أُغلقت التقديمات. يمكن للمنظمين الآن نقل الحدث إلى مرحلة التحكيم.',
  },
  JUDGING: {
    en: 'Judges are evaluating submissions. Results will be published once judging is complete.',
    ar: 'يقوم المحكمون بتقييم التقديمات. ستُنشر النتائج بمجرد اكتمال التحكيم.',
  },
  RESULTS_PUBLISHED: {
    en: 'Results are in! Winners and rankings are now visible to all participants.',
    ar: 'النتائج متاحة! الفائزون والترتيب مرئيان الآن لجميع المشاركين.',
  },
  ARCHIVED: {
    en: 'This event has been archived. All data is preserved for reference.',
    ar: 'تم أرشفة هذا الحدث. جميع البيانات محفوظة للرجوع إليها.',
  },
};

export default function EventDetailPage() {
  const params = useParams();
  const t = useTranslations('events');
  const locale = useLocale();
  const [event, setEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);

  // Participants list
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [participantsLoading, setParticipantsLoading] = useState(false);
  const [participantSearch, setParticipantSearch] = useState('');
  const [isOrganizerOrAdmin, setIsOrganizerOrAdmin] = useState(false);
  const [isConfirmingRegister, setIsConfirmingRegister] = useState(false);

  const eventId = params.id as string;

  useEffect(() => {
    Promise.all([
      loadEvent(),
      authApi.getCurrentUser()
        .then(res => {
          const roles = res.data?.userRoles?.map((ur: any) => ur.role?.name) || [];
          setIsOrganizerOrAdmin(roles.includes('SUPER_ADMIN') || roles.includes('ORGANIZER'));
        })
        .catch(() => {}),
    ]);
  }, [eventId]);

  useEffect(() => {
    if (isOrganizerOrAdmin && eventId) {
      loadParticipants();
    }
  }, [isOrganizerOrAdmin, eventId]);

  const loadEvent = async () => {
    try {
      setIsLoading(true);
      const response = await eventsApi.getById(eventId);
      const eventData = response.data?.data || response.data;
      setEvent(eventData);
      setIsRegistered(eventData.isRegistered || false);
    } catch (err: any) {
      setError(err.response?.data?.message || t('loadError'));
    } finally {
      setIsLoading(false);
    }
  };

  const loadParticipants = async () => {
    try {
      setParticipantsLoading(true);
      const res = await eventsApi.getRegistrations(eventId);
      setParticipants(res.data?.data ?? []);
    } catch {
      // Silently fail — user may not have permission
    } finally {
      setParticipantsLoading(false);
    }
  };

  const handleRegister = async () => {
    setIsConfirmingRegister(false);
    try {
      const response = await eventsApi.register(eventId);
      const message = response.data?.message;
      const successMsg = typeof message === 'object' ? (message[locale] || message.en) : (message || t('registerSuccess'));
      toast.success(successMsg, { duration: 4000 });
      // Set registered AFTER loadEvent so it isn't overwritten by eventData.isRegistered
      await loadEvent();
      setIsRegistered(true);
    } catch (err: any) {
      const errorData = err.response?.data;
      const errorMessage = errorData?.error?.message || errorData?.message;
      const errorMsg = errorMessage && typeof errorMessage === 'object'
        ? (errorMessage[locale] || errorMessage.en || t('registerError'))
        : (errorMessage || t('registerError'));
      toast.error(errorMsg, { duration: 5000 });
    }
  };

  const handlePublish = async () => {
    try {
      const response = await eventsApi.publish(eventId);
      const message = response.data?.message;
      const successMsg = typeof message === 'object' ? (message[locale] || message.en) : (message || 'Event published successfully');
      toast.success(successMsg, { duration: 4000 });
      loadEvent();
    } catch (err: any) {
      const errorData = err.response?.data;
      const errorMessage = errorData?.error?.message || errorData?.message;
      const errorMsg = errorMessage && typeof errorMessage === 'object'
        ? (errorMessage[locale] || errorMessage.en || t('publishError'))
        : (errorMessage || t('publishError'));
      toast.error(errorMsg, { duration: 5000 });
    }
  };

  const handleAdvanceState = async () => {
    try {
      const response = await eventsApi.advanceState(eventId);
      const message = response.data?.message;
      const successMsg = typeof message === 'object' ? (message[locale] || message.en) : (message || 'Event state advanced successfully');
      toast.success(successMsg, { duration: 4000 });
      loadEvent();
    } catch (err: any) {
      const errorData = err.response?.data;
      const errorMessage = errorData?.error?.message || errorData?.message;
      const errorMsg = errorMessage && typeof errorMessage === 'object'
        ? (errorMessage[locale] || errorMessage.en || 'Failed to advance event state')
        : (errorMessage || 'Failed to advance event state');
      toast.error(errorMsg, { duration: 5000 });
    }
  };

  const formatDate = (dateString: string | Date) => {
    if (!dateString) return 'N/A';
    try {
      const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
      if (isNaN(date.getTime())) return 'Invalid Date';
      return date.toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US', {
        year: 'numeric', month: 'long', day: 'numeric',
        hour: '2-digit', minute: '2-digit',
      });
    } catch {
      return 'Invalid Date';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">{t('loading')}</p>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400">{error || t('notFound')}</p>
          <Link href="/events">
            <Button className="mt-4">{t('backToEvents')}</Button>
          </Link>
        </div>
      </div>
    );
  }

  const currentStateIndex = STATE_ORDER.indexOf(event.state);
  const guidance = STATE_GUIDANCE[event.state];

  // State-specific action buttons
  const canRegister    = event.state === 'REGISTRATION_OPEN';
  const canCreateTeam  = event.state === 'REGISTRATION_OPEN' || event.state === 'TEAM_FORMATION';
  const canSubmit      = event.state === 'HACKING_PHASE' || event.state === 'SUBMISSION_CLOSED';
  const canViewLeaderboard = event.state === 'JUDGING' || event.state === 'RESULTS_PUBLISHED' || event.state === 'ARCHIVED';
  const canAssignJudge = event.state === 'SUBMISSION_CLOSED' || event.state === 'JUDGING' || event.state === 'RESULTS_PUBLISHED';

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
              {getText(event.name, locale)}
            </h1>
            {event.state && (
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-sm font-medium rounded-full ${STATE_COLORS[event.state]}`}>
                {STATE_ICONS[event.state]}
                {t(`states.${event.state}`)}
              </span>
            )}
          </div>
          <div className="flex gap-2 flex-wrap justify-end">
            {event.state === 'DRAFT' && (
              <Button onClick={handlePublish}>
                <Send className="w-4 h-4 me-2" />
                {t('publish')}
              </Button>
            )}
            {event.state !== 'DRAFT' && event.state !== 'ARCHIVED' && (
              <Button variant="outline" onClick={handleAdvanceState} title="Advance to next state (testing)">
                Advance State <ChevronRight className="w-4 h-4 ms-1" />
              </Button>
            )}
            {canRegister && (
              isRegistered ? (
                <Button disabled className="bg-green-600 hover:bg-green-600 opacity-80">
                  <CheckCircle className="w-4 h-4 me-2" />
                  {t('alreadyRegistered')}
                </Button>
              ) : isConfirmingRegister ? (
                <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2">
                  <span className="text-sm text-amber-800 dark:text-amber-200 font-medium whitespace-nowrap">
                    {locale === 'ar' ? 'هل أنت متأكد من التسجيل في هذا الحدث؟' : 'Confirm registration?'}
                  </span>
                  <div className="flex gap-1.5">
                    <Button size="sm" onClick={handleRegister} className="bg-green-600 hover:bg-green-700 text-white h-7 px-3 text-xs">
                      {locale === 'ar' ? 'نعم، سجّلني' : 'Yes, register'}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setIsConfirmingRegister(false)} className="h-7 px-3 text-xs">
                      {locale === 'ar' ? 'إلغاء' : 'Cancel'}
                    </Button>
                  </div>
                </div>
              ) : (
                <Button onClick={() => setIsConfirmingRegister(true)}>
                  {t('registerForEvent')}
                </Button>
              )
            )}
          </div>
        </div>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          {getText(event.description, locale)}
        </p>

        {/* Participant & Team Stats */}
        {event._count && (
          <div className="flex flex-wrap gap-4 mt-4">
            <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <Users className="w-4 h-4 text-primary dark:text-orange-300" />
              <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                {event._count.eventRegistrations}
              </span>
              <span className="text-sm text-primary dark:text-orange-300">
                {locale === 'ar' ? 'مشارك' : 'Participants'}
              </span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-orange-50 dark:bg-orange-950/25 rounded-lg">
              <Users className="w-4 h-4 text-orange-700 dark:text-orange-300" />
              <span className="text-sm font-semibold text-orange-800 dark:text-orange-200">
                {event._count.teams}
              </span>
              <span className="text-sm text-orange-700 dark:text-orange-300">
                {locale === 'ar' ? 'فريق' : 'Teams'}
              </span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <FileText className="w-4 h-4 text-green-600 dark:text-green-400" />
              <span className="text-sm font-semibold text-green-700 dark:text-green-300">
                {event._count.submissions}
              </span>
              <span className="text-sm text-green-600 dark:text-green-400">
                {locale === 'ar' ? 'تقديم' : 'Submissions'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* State Guidance Banner */}
      {guidance && (
        <div className={`mb-6 p-4 rounded-lg border ${STATE_COLORS[event.state]} border-current border-opacity-20`}>
          <div className="flex items-start gap-3">
            <div className="mt-0.5">{STATE_ICONS[event.state]}</div>
            <div>
              <p className="font-semibold text-sm mb-0.5">{t(`states.${event.state}`)}</p>
              <p className="text-sm opacity-90">{guidance[locale as 'en' | 'ar'] || guidance.en}</p>
            </div>
          </div>
        </div>
      )}

      {/* State Timeline */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Event Progress</CardTitle>
        </CardHeader>
        <CardContent>
          {(() => {
            const timelineStates = STATE_ORDER.filter(s => s !== 'ARCHIVED');
            const shortLabels: Record<string, string> = {
              DRAFT:             'Draft',
              PUBLISHED:         'Published',
              REGISTRATION_OPEN: 'Registration',
              TEAM_FORMATION:    'Teams',
              HACKING_PHASE:     'Hacking',
              SUBMISSION_CLOSED: 'Submissions',
              JUDGING:           'Judging',
              RESULTS_PUBLISHED: 'Results',
            };
            return (
              <div className="relative">
                {/* Background track line */}
                <div className="absolute top-4 left-0 right-0 h-0.5 bg-gray-200 dark:bg-gray-700" />
                {/* Filled portion up to current state */}
                <div
                  className="absolute top-4 left-0 h-0.5 bg-green-500 transition-all duration-500"
                  style={{
                    width: currentStateIndex <= 0
                      ? '0%'
                      : `${(currentStateIndex / (timelineStates.length - 1)) * 100}%`,
                  }}
                />
                {/* Steps */}
                <div className="relative grid gap-0" style={{ gridTemplateColumns: `repeat(${timelineStates.length}, 1fr)` }}>
                  {timelineStates.map((state, index) => {
                    const isPast    = currentStateIndex > index;
                    const isCurrent = event.state === state;
                    return (
                      <div key={state} className="flex flex-col items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 bg-white dark:bg-gray-900 transition-all z-10
                          ${isCurrent ? 'border-primary bg-primary text-white shadow-lg ring-2 ring-orange-200 dark:ring-orange-900' :
                            isPast    ? 'border-green-500 bg-green-500 text-white' :
                                        'border-gray-300 text-gray-400'}`}>
                          {isPast ? <CheckCircle className="w-4 h-4" /> : index + 1}
                        </div>
                        <span className={`text-xs mt-2 text-center leading-tight px-0.5 break-words w-full
                          ${isCurrent ? 'font-bold text-primary dark:text-orange-300' :
                            isPast    ? 'text-green-600 dark:text-green-400' :
                                        'text-gray-400'}`}>
                          {shortLabels[state]}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Registration Period */}
        <Card>
          <CardHeader>
            <CardTitle>{t('registrationPeriod')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('starts')}</p>
              <p className="font-medium">{formatDate(event.registrationStart)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('ends')}</p>
              <p className="font-medium">{formatDate(event.registrationEnd)}</p>
            </div>
          </CardContent>
        </Card>

        {/* Hacking Period */}
        <Card>
          <CardHeader>
            <CardTitle>{t('hackingPeriod')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('starts')}</p>
              <p className="font-medium">{formatDate(event.hackingStart)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('ends')}</p>
              <p className="font-medium">{formatDate(event.hackingEnd)}</p>
            </div>
          </CardContent>
        </Card>

        {/* Team Size */}
        <Card>
          <CardHeader>
            <CardTitle>{t('teamSize')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg">
              {t('teamSizeRange', { min: event.minTeamSize, max: event.maxTeamSize })}
            </p>
          </CardContent>
        </Card>

        {/* Actions — shown contextually based on state */}
        <Card>
          <CardHeader>
            <CardTitle>{t('quickActions')}</CardTitle>
            <CardDescription>
              {event.state === 'DRAFT'            ? 'Available once the event is published' :
               event.state === 'PUBLISHED'         ? 'Registration will open soon' :
               event.state === 'REGISTRATION_OPEN' ? 'Register and form your team' :
               event.state === 'TEAM_FORMATION'    ? 'Finalize your team before hacking starts' :
               event.state === 'HACKING_PHASE'     ? 'Build your project and submit' :
               event.state === 'SUBMISSION_CLOSED' ? 'Submissions closed — awaiting judging' :
               event.state === 'JUDGING'           ? 'Judging in progress' :
                                                     'Event has ended'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {/* Always visible */}
            <Link href={`/events/${event.id}/teams`}>
              <Button variant="outline" className="w-full">
                <Users className="w-4 h-4 me-2" />
                {t('viewTeams')}
              </Button>
            </Link>

            {/* Create Team — only during registration/team formation */}
            {canCreateTeam && (
              <Link href={`/events/${event.id}/teams/create`}>
                <Button variant="outline" className="w-full">
                  <Users className="w-4 h-4 me-2" />
                  {t('createTeam')}
                </Button>
              </Link>
            )}

            {/* Submit project — only during hacking / submission_closed */}
            {canSubmit && (
              <Link href={`/submissions/create`}>
                <Button variant="outline" className="w-full">
                  <FileText className="w-4 h-4 me-2" />
                  Submit Project
                </Button>
              </Link>
            )}

            {/* Assign Judge — during judging phase */}
            {canAssignJudge && (
              <Link href={`/events/${event.id}/judging/assign`}>
                <Button variant="outline" className="w-full">
                  <Trophy className="w-4 h-4 me-2" />
                  {locale === 'ar' ? 'تعيين حكم' : 'Assign Judge'}
                </Button>
              </Link>
            )}

            {/* Leaderboard — only once judging has started */}
            {canViewLeaderboard && (
              <Link href={`/judging/events/${event.id}/leaderboard`}>
                <Button variant="outline" className="w-full">
                  <Trophy className="w-4 h-4 me-2" />
                  View Leaderboard
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Registered Participants (organizer/admin only) ──────────────────── */}
      {isOrganizerOrAdmin && (() => {
        const filtered = participants.filter(p =>
          p.user.name.toLowerCase().includes(participantSearch.toLowerCase()) ||
          p.user.email.toLowerCase().includes(participantSearch.toLowerCase())
        );

        const exportCSV = () => {
          const header = locale === 'ar'
            ? ['الاسم', 'البريد الإلكتروني', 'الحالة', 'تاريخ التسجيل']
            : ['Name', 'Email', 'Status', 'Registered At'];
          const rows = participants.map(p => [
            p.user.name,
            p.user.email,
            p.status,
            new Date(p.registeredAt).toISOString(),
          ]);
          const csv = [header, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n');
          const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `participants-${eventId}.csv`;
          a.click();
          URL.revokeObjectURL(url);
        };

        return (
          <Card className="mt-6">
            <CardHeader>
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-primary" />
                    {locale === 'ar' ? 'المشاركون المسجلون' : 'Registered Participants'}
                    <span className="text-sm font-normal text-gray-500 ms-1">
                      ({participants.length})
                    </span>
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {locale === 'ar'
                      ? 'جميع المستخدمين الذين سجلوا في هذه الفعالية'
                      : 'All users who registered for this event'}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={loadParticipants}
                    disabled={participantsLoading}
                  >
                    <RefreshCw className={`w-4 h-4 me-1.5 ${participantsLoading ? 'animate-spin' : ''}`} />
                    {locale === 'ar' ? 'تحديث' : 'Refresh'}
                  </Button>
                  {participants.length > 0 && (
                    <Button variant="outline" size="sm" onClick={exportCSV}>
                      <Download className="w-4 h-4 me-1.5" />
                      {locale === 'ar' ? 'تصدير CSV' : 'Export CSV'}
                    </Button>
                  )}
                </div>
              </div>

              {/* Search */}
              {participants.length > 0 && (
                <div className="relative mt-3">
                  <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    value={participantSearch}
                    onChange={e => setParticipantSearch(e.target.value)}
                    placeholder={locale === 'ar' ? 'بحث بالاسم أو البريد الإلكتروني...' : 'Search by name or email...'}
                    className="ps-9"
                  />
                </div>
              )}
            </CardHeader>

            <CardContent className="p-0">
              {participantsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                </div>
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                  <Users className="w-10 h-10 text-gray-300 mb-3" />
                  <p className="text-gray-500 text-sm">
                    {participantSearch
                      ? (locale === 'ar' ? 'لا توجد نتائج' : 'No results found')
                      : (locale === 'ar' ? 'لم يسجل أحد بعد' : 'No participants yet')}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                  {filtered.map((p, i) => (
                    <div
                      key={p.id}
                      className="flex items-center gap-4 px-6 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                    >
                      {/* Rank number */}
                      <span className="w-6 text-xs text-gray-400 text-center shrink-0">{i + 1}</span>

                      {/* Avatar */}
                      <div className="w-9 h-9 bg-gradient-to-br from-primary to-orange-600 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0">
                        {p.user.name.split(' ').map((n: string) => n[0]?.toUpperCase()).slice(0, 2).join('')}
                      </div>

                      {/* Name */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {p.user.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate flex items-center gap-1 mt-0.5">
                          <Mail className="w-3 h-3 shrink-0" />
                          {p.user.email}
                        </p>
                      </div>

                      {/* Registration date */}
                      <div className="hidden sm:block text-xs text-gray-400 shrink-0 text-end">
                        {new Date(p.registeredAt).toLocaleDateString(
                          locale === 'ar' ? 'ar-SA' : 'en-US',
                          { year: 'numeric', month: 'short', day: 'numeric' }
                        )}
                      </div>

                      {/* Status badge */}
                      <span className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-medium ${
                        p.status === 'REGISTERED'
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                      }`}>
                        {p.status === 'REGISTERED'
                          ? (locale === 'ar' ? 'مسجل' : 'Registered')
                          : p.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })()}
    </div>
  );
}
