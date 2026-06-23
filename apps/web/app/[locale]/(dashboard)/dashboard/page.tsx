'use client';

import { useMemo, useState } from 'react';
import { useLocale } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import { Link } from '@/i18n/routing';
import { eventsApi, submissionsApi, usersApi } from '@/lib/api';
import { queryKeys, useCurrentUser } from '@/lib/queries';
import { ArrowRight, Calendar, Clock, FileText, Plus, Sparkles, Trophy, Users } from 'lucide-react';

type BilingualText = string | { en?: string; ar?: string };

interface DashboardEvent {
  id: string;
  name: BilingualText;
  description?: BilingualText;
  state: string;
  createdAt?: string;
  updatedAt?: string;
  registrationStart?: string;
  registrationEnd?: string;
}

interface DashboardTeam {
  id: string;
  name: BilingualText;
  createdAt?: string;
  event?: {
    id?: string;
    name?: BilingualText;
  };
}

interface DashboardSubmission {
  id: string;
  slug?: string | null;
  title?: BilingualText;
  teamId?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  team?: {
    id?: string;
    name?: BilingualText;
  };
}

type ActivityCategory = 'events' | 'teams' | 'submissions';

interface ActivityItem {
  id: string;
  category: ActivityCategory;
  title: string;
  subtitle: string;
  timestamp: string;
  tag: string;
  tone: 'green' | 'gray' | 'dark';
  icon: 'event' | 'team' | 'submission' | 'judging';
  href: string;
}

interface DashboardStats {
  totalEvents: number;
  myTeams: number;
  submissions: number;
  submittedProjects: number;
  upcomingEvents: number;
}

interface DashboardLocaleCopy {
  welcome: {
    prefix: string;
    fallbackName: string;
    overview: string;
  };
  stats: {
    totalEvents: string;
    totalEventsSub: string;
    totalEventsDeltaPrefix: string;
    myTeams: string;
    myTeamsSub: string;
    myTeamsEmptySub: string;
    submissions: string;
    submissionsSub: string;
    submissionsEmptySub: string;
    upcoming: string;
    upcomingSub: string;
    upcomingDelta: string;
  };
  quickActions: {
    createTitle: string;
    createAccent: string;
    createBody: string;
    createCta: string;
    joinTitle: string;
    joinAccent: string;
    joinBody: string;
    joinCta: string;
  };
  activity: {
    title: string;
    subtitle: string;
    filters: {
      all: string;
      events: string;
      teams: string;
      submissions: string;
    };
    emptyTitle: string;
    emptyBody: string;
    footer: string;
    eventOpened: string;
    eventUpdated: string;
    eventJudging: string;
    eventResults: string;
    joinedTeam: string;
    createdSubmission: string;
    submittedProject: string;
    registrationWindow: string;
    teamEventPrefix: string;
    projectTeamPrefix: string;
    liveTag: string;
    readyTag: string;
    draftTag: string;
    memberTag: string;
    submittedTag: string;
    openTeamLink: string;
  };
  loading: string;
  loadError: string;
  retry: string;
}

const dashboardCopy: Record<'en' | 'ar', DashboardLocaleCopy> = {
  en: {
    welcome: {
      prefix: 'Welcome back,',
      fallbackName: 'there',
      overview: "Here's an overview of your hackathon activities.",
    },
    stats: {
      totalEvents: 'Total Events',
      totalEventsSub: 'All time · organized',
      totalEventsDeltaPrefix: '+',
      myTeams: 'My Teams',
      myTeamsSub: 'Active teams in progress',
      myTeamsEmptySub: 'No active teams · join one',
      submissions: 'Submissions',
      submissionsSub: 'Projects submitted so far',
      submissionsEmptySub: 'No projects submitted yet',
      upcoming: 'Upcoming',
      upcomingSub: 'Events open for registration',
      upcomingDelta: 'OPEN',
    },
    quickActions: {
      createTitle: 'Create New',
      createAccent: 'Event.',
      createBody:
        'Start organizing your next hackathon with branding, tracks, judging, and analytics in one place.',
      createCta: 'Get Started',
      joinTitle: 'Join a',
      joinAccent: 'Hackathon.',
      joinBody:
        'Explore open hackathons and join teams to collaborate on innovative projects with developers worldwide.',
      joinCta: 'Browse Events',
    },
    activity: {
      title: 'Recent Activity',
      subtitle: 'Your latest hackathon activities',
      filters: {
        all: 'All',
        events: 'Events',
        teams: 'Teams',
        submissions: 'Submissions',
      },
      emptyTitle: 'No activity yet',
      emptyBody: 'Join an event or create a submission to see activity here.',
      footer: 'View all activity',
      eventOpened: 'opened for registration',
      eventUpdated: 'was updated',
      eventJudging: 'moved into judging',
      eventResults: 'published results',
      joinedTeam: 'You joined',
      createdSubmission: 'Created submission',
      submittedProject: 'Submitted',
      registrationWindow: 'Registration window',
      teamEventPrefix: 'Hackathon',
      projectTeamPrefix: 'Team',
      liveTag: 'Live',
      readyTag: 'Ready',
      draftTag: 'Draft',
      memberTag: 'Member',
      submittedTag: 'Submitted',
      openTeamLink: 'join one',
    },
    loading: 'Loading dashboard...',
    loadError: 'Failed to load dashboard.',
    retry: 'Retry',
  },
  ar: {
    welcome: {
      prefix: 'عوداً سعيداً،',
      fallbackName: 'صديقنا',
      overview: 'إليك نظرة عامة على أنشطة الهاكاثون الخاصة بك.',
    },
    stats: {
      totalEvents: 'إجمالي الفعاليات',
      totalEventsSub: 'كل الوقت · نظمتها',
      totalEventsDeltaPrefix: '+',
      myTeams: 'فرقي',
      myTeamsSub: 'فرق نشطة حالياً',
      myTeamsEmptySub: 'لا توجد فرق نشطة · انضم إلى واحدة',
      submissions: 'المشاريع',
      submissionsSub: 'المشاريع التي تم تقديمها',
      submissionsEmptySub: 'لا توجد مشاريع مقدمة بعد',
      upcoming: 'القادمة',
      upcomingSub: 'فعاليات مفتوحة للتسجيل',
      upcomingDelta: 'مفتوح',
    },
    quickActions: {
      createTitle: 'أنشئ',
      createAccent: 'فعالية جديدة.',
      createBody:
        'ابدأ تنظيم الهاكاثون القادم مع الهوية، المسارات، التحكيم، والتحليلات في مكان واحد.',
      createCta: 'ابدأ الآن',
      joinTitle: 'انضم إلى',
      joinAccent: 'هاكاثون.',
      joinBody:
        'استكشف الهاكاثونات المفتوحة وانضم إلى فرق للتعاون على مشاريع مبتكرة مع مطورين من مختلف الأماكن.',
      joinCta: 'تصفح الفعاليات',
    },
    activity: {
      title: 'النشاط الأخير',
      subtitle: 'أحدث أنشطتك في الهاكاثون',
      filters: {
        all: 'الكل',
        events: 'الفعاليات',
        teams: 'الفرق',
        submissions: 'المشاريع',
      },
      emptyTitle: 'لا يوجد نشاط بعد',
      emptyBody: 'انضم إلى فعالية أو أنشئ مشروعاً لترى النشاط هنا.',
      footer: 'عرض كل النشاط',
      eventOpened: 'فتحت التسجيل',
      eventUpdated: 'تم تحديثها',
      eventJudging: 'انتقلت إلى التحكيم',
      eventResults: 'نشرت النتائج',
      joinedTeam: 'انضممت إلى',
      createdSubmission: 'تم إنشاء مشروع',
      submittedProject: 'تم تقديم',
      registrationWindow: 'فترة التسجيل',
      teamEventPrefix: 'الهاكاثون',
      projectTeamPrefix: 'الفريق',
      liveTag: 'مباشر',
      readyTag: 'جاهز',
      draftTag: 'مسودة',
      memberTag: 'عضو',
      submittedTag: 'تم',
      openTeamLink: 'انضم إلى واحدة',
    },
    loading: 'جارٍ تحميل لوحة التحكم...',
    loadError: 'فشل تحميل لوحة التحكم.',
    retry: 'إعادة المحاولة',
  },
};

function getText(value: BilingualText | undefined, locale: string): string {
  if (!value) {
    return '';
  }

  if (typeof value === 'string') {
    return value;
  }

  return value[locale as 'en' | 'ar'] || value.en || value.ar || '';
}

function extractArray<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) {
    return payload as T[];
  }

  if (
    payload &&
    typeof payload === 'object' &&
    'data' in payload &&
    Array.isArray((payload as { data?: unknown }).data)
  ) {
    return (payload as { data: T[] }).data;
  }

  return [];
}

function relativeTime(iso: string, locale: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);
  const isAr = locale === 'ar';

  if (mins < 2) {
    return isAr ? 'الآن' : 'Just now';
  }

  if (mins < 60) {
    return isAr ? `منذ ${mins} دقيقة` : `${mins}m ago`;
  }

  if (hours < 24) {
    return isAr ? `منذ ${hours} ساعة` : `${hours}h ago`;
  }

  if (days === 1) {
    return isAr ? 'أمس' : 'Yesterday';
  }

  if (days < 30) {
    return isAr ? `منذ ${days} أيام` : `${days}d ago`;
  }

  return new Date(iso).toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US', {
    month: 'short',
    day: 'numeric',
  });
}

function formatHeaderDate(locale: string): string {
  return new Date().toLocaleString(locale === 'ar' ? 'ar-SA' : 'en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function buildEventActivity(
  event: DashboardEvent,
  locale: string,
  copy: DashboardLocaleCopy
): ActivityItem | null {
  const eventName = getText(event.name, locale);
  if (!eventName) {
    return null;
  }

  const timestamp = event.updatedAt || event.createdAt || event.registrationStart;
  if (!timestamp) {
    return null;
  }

  let title = `Event "${eventName}" ${copy.activity.eventUpdated}`;
  let tag = copy.activity.draftTag;
  let tone: ActivityItem['tone'] = 'gray';
  let icon: ActivityItem['icon'] = 'event';

  if (event.state === 'REGISTRATION_OPEN') {
    title = `Event "${eventName}" ${copy.activity.eventOpened}`;
    tag = copy.activity.liveTag;
    tone = 'green';
  } else if (event.state === 'JUDGING') {
    title = `Event "${eventName}" ${copy.activity.eventJudging}`;
    tag = copy.activity.readyTag;
    tone = 'dark';
    icon = 'judging';
  } else if (event.state === 'RESULTS_PUBLISHED') {
    title = `Event "${eventName}" ${copy.activity.eventResults}`;
    tag = copy.activity.readyTag;
    tone = 'green';
  }

  const registrationStart = event.registrationStart;
  const registrationEnd = event.registrationEnd;
  const subtitle =
    registrationStart && registrationEnd
      ? `${copy.activity.registrationWindow}: ${new Date(registrationStart).toLocaleDateString(
          locale === 'ar' ? 'ar-SA' : 'en-US',
          {
            month: 'short',
            day: 'numeric',
          }
        )} - ${new Date(registrationEnd).toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US', {
          month: 'short',
          day: 'numeric',
        })}`
      : getText(event.description, locale);

  return {
    id: `event-${event.id}`,
    category: 'events',
    title,
    subtitle,
    timestamp,
    tag,
    tone,
    icon,
    href: `/events/${event.id}`,
  };
}

function buildTeamActivity(
  team: DashboardTeam,
  locale: string,
  copy: DashboardLocaleCopy
): ActivityItem | null {
  const teamName = getText(team.name, locale);
  const timestamp = team.createdAt;

  if (!teamName || !timestamp) {
    return null;
  }

  const eventName = getText(team.event?.name, locale);

  return {
    id: `team-${team.id}`,
    category: 'teams',
    title: `${copy.activity.joinedTeam} "${teamName}"`,
    subtitle: eventName ? `${copy.activity.teamEventPrefix}: ${eventName}` : '',
    timestamp,
    tag: copy.activity.memberTag,
    tone: 'gray',
    icon: 'team',
    href: `/teams/${team.id}`,
  };
}

function buildSubmissionActivities(
  submission: DashboardSubmission,
  locale: string,
  copy: DashboardLocaleCopy
): ActivityItem[] {
  const title = getText(submission.title, locale) || submission.id;
  const teamName = getText(submission.team?.name, locale);
  const subtitle = teamName ? `${copy.activity.projectTeamPrefix}: ${teamName}` : '';
  const items: ActivityItem[] = [];

  if (submission.createdAt) {
    items.push({
      id: `submission-created-${submission.id}`,
      category: 'submissions',
      title: `${copy.activity.createdSubmission} "${title}"`,
      subtitle,
      timestamp: submission.createdAt,
      tag: copy.activity.draftTag,
      tone: 'gray',
      icon: 'submission',
      href: `/submissions/${submission.slug || submission.id}`,
    });
  }

  if (
    submission.status === 'SUBMITTED' &&
    submission.updatedAt &&
    submission.updatedAt !== submission.createdAt
  ) {
    items.push({
      id: `submission-submitted-${submission.id}`,
      category: 'submissions',
      title: `${copy.activity.submittedProject} "${title}"`,
      subtitle,
      timestamp: submission.updatedAt,
      tag: copy.activity.submittedTag,
      tone: 'green',
      icon: 'submission',
      href: `/submissions/${submission.slug || submission.id}`,
    });
  }

  return items;
}

export default function DashboardPage() {
  const locale = useLocale();
  const isRtl = locale === 'ar';
  const copy = dashboardCopy[isRtl ? 'ar' : 'en'];

  const [activityFilter, setActivityFilter] = useState<ActivityCategory | 'all'>('all');

  const eventsQuery = useQuery({
    queryKey: queryKeys.events,
    queryFn: () => eventsApi.list().then((r) => r.data),
  });
  const teamsQuery = useQuery({
    queryKey: queryKeys.myTeams,
    queryFn: () => usersApi.getMyTeams().then((r) => r.data),
  });
  const submissionsQuery = useQuery({
    queryKey: queryKeys.submissions(50),
    queryFn: () => submissionsApi.list({ limit: 50 }).then((r) => r.data),
  });
  const { data: currentUser } = useCurrentUser();

  const events = extractArray<DashboardEvent>(eventsQuery.data);
  const teams = extractArray<DashboardTeam>(teamsQuery.data);
  const submissions = extractArray<DashboardSubmission>(submissionsQuery.data);

  const stats: DashboardStats = useMemo(() => {
    const myTeamIds = new Set(teams.map((team) => team.id));
    const mySubmissions = submissions.filter((submission) => {
      const teamId = submission.teamId || submission.team?.id;
      return Boolean(teamId && myTeamIds.has(teamId));
    });
    const submittedProjects = mySubmissions.filter(
      (submission) => submission.status === 'SUBMITTED'
    ).length;
    const upcomingEvents = events.filter((event) =>
      ['PUBLISHED', 'REGISTRATION_OPEN', 'TEAM_FORMATION'].includes(event.state)
    ).length;

    return {
      totalEvents: events.length,
      myTeams: teams.length,
      submissions: mySubmissions.length,
      submittedProjects,
      upcomingEvents,
    };
  }, [events, teams, submissions]);

  const activities = useMemo(() => {
    const myTeamIds = new Set(teams.map((team) => team.id));
    const mySubmissions = submissions.filter((submission) => {
      const teamId = submission.teamId || submission.team?.id;
      return Boolean(teamId && myTeamIds.has(teamId));
    });

    return [
      ...events
        .map((event) => buildEventActivity(event, locale, copy))
        .filter((item): item is ActivityItem => item !== null),
      ...teams
        .map((team) => buildTeamActivity(team, locale, copy))
        .filter((item): item is ActivityItem => item !== null),
      ...mySubmissions.flatMap((submission) =>
        buildSubmissionActivities(submission, locale, copy)
      ),
    ].sort(
      (left, right) => new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime()
    );
  }, [events, teams, submissions, locale, copy]);

  const visibleActivities = activities
    .filter((activity) => activityFilter === 'all' || activity.category === activityFilter)
    .slice(0, 5);

  const firstName = currentUser?.name?.trim().split(' ')[0] || copy.welcome.fallbackName;
  const hasTeamLink = stats.myTeams === 0;

  const isLoading =
    eventsQuery.isLoading || teamsQuery.isLoading || submissionsQuery.isLoading;
  const hasError = eventsQuery.isError || teamsQuery.isError || submissionsQuery.isError;

  const refetchDashboardData = () => {
    void eventsQuery.refetch();
    void teamsQuery.refetch();
    void submissionsQuery.refetch();
  };

  if (isLoading) {
    return (
      <div className="ehms-dashboard-page ehms-dashboard-loading">
        <div className="ehms-dashboard-spinner" />
        <p>{copy.loading}</p>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="ehms-dashboard-page ehms-dashboard-loading">
        <div className="ehms-dashboard-error">{copy.loadError}</div>
        <button
          type="button"
          className="ehms-dashboard-btn ehms-dashboard-btn-primary"
          onClick={refetchDashboardData}
        >
          {copy.retry}
        </button>
      </div>
    );
  }

  return (
    <div className="ehms-dashboard-page">
      <div className="ehms-dashboard-welcome">
        <div>
          <h1>
            {copy.welcome.prefix} <span className="ehms-dashboard-serif">{firstName}.</span>
          </h1>
          <p>{copy.welcome.overview}</p>
        </div>
        <div className="ehms-dashboard-date">
          <span className="ehms-dashboard-date-dot" />
          {formatHeaderDate(locale)}
        </div>
      </div>

      <section className="ehms-dashboard-stats">
        <article className="ehms-dashboard-stat">
          <div className="ehms-dashboard-stat-head">
            <div className="ehms-dashboard-stat-label">{copy.stats.totalEvents}</div>
            <div className="ehms-dashboard-stat-icon">
              <Calendar aria-hidden size={16} />
            </div>
          </div>
          <div className="ehms-dashboard-stat-value">
            {stats.totalEvents}
            {stats.upcomingEvents > 0 && (
              <span className="ehms-dashboard-stat-delta">
                {copy.stats.totalEventsDeltaPrefix}
                {stats.upcomingEvents}
              </span>
            )}
          </div>
          <div className="ehms-dashboard-stat-sub">{copy.stats.totalEventsSub}</div>
          <svg className="ehms-dashboard-stat-spark" viewBox="0 0 90 28" preserveAspectRatio="none">
            <polyline
              fill="none"
              stroke="oklch(0.5 0.17 130)"
              strokeWidth="1.6"
              points="0,22 12,18 24,20 36,14 48,16 60,10 72,12 84,6"
            />
            <circle cx="84" cy="6" r="2.5" fill="#0A0A0A" />
          </svg>
        </article>

        <article className={`ehms-dashboard-stat ${stats.myTeams === 0 ? 'is-empty' : ''}`}>
          <div className="ehms-dashboard-stat-head">
            <div className="ehms-dashboard-stat-label">{copy.stats.myTeams}</div>
            <div className="ehms-dashboard-stat-icon">
              <Users aria-hidden size={16} />
            </div>
          </div>
          <div className="ehms-dashboard-stat-value">{stats.myTeams}</div>
          <div className="ehms-dashboard-stat-sub">
            {hasTeamLink ? (
              <>
                {copy.stats.myTeamsEmptySub.split('·')[0].trim()} ·{' '}
                <Link href="/events">{copy.activity.openTeamLink}</Link>
              </>
            ) : (
              copy.stats.myTeamsSub
            )}
          </div>
        </article>

        <article className={`ehms-dashboard-stat ${stats.submissions === 0 ? 'is-empty' : ''}`}>
          <div className="ehms-dashboard-stat-head">
            <div className="ehms-dashboard-stat-label">{copy.stats.submissions}</div>
            <div className="ehms-dashboard-stat-icon">
              <FileText aria-hidden size={16} />
            </div>
          </div>
          <div className="ehms-dashboard-stat-value">{stats.submissions}</div>
          <div className="ehms-dashboard-stat-sub">
            {stats.submissions === 0 ? copy.stats.submissionsEmptySub : copy.stats.submissionsSub}
          </div>
        </article>

        <article className="ehms-dashboard-stat">
          <div className="ehms-dashboard-stat-head">
            <div className="ehms-dashboard-stat-label">{copy.stats.upcoming}</div>
            <div className="ehms-dashboard-stat-icon">
              <Clock aria-hidden size={16} />
            </div>
          </div>
          <div className="ehms-dashboard-stat-value">
            {stats.upcomingEvents}
            <span className="ehms-dashboard-stat-delta">{copy.stats.upcomingDelta}</span>
          </div>
          <div className="ehms-dashboard-stat-sub">{copy.stats.upcomingSub}</div>
          <svg className="ehms-dashboard-stat-spark" viewBox="0 0 90 28" preserveAspectRatio="none">
            <g fill="oklch(0.85 0.17 130)">
              <rect x="4" y="14" width="8" height="10" rx="1.5" />
              <rect x="18" y="8" width="8" height="16" rx="1.5" />
              <rect x="32" y="16" width="8" height="8" rx="1.5" />
              <rect x="46" y="4" width="8" height="20" rx="1.5" />
              <rect x="60" y="10" width="8" height="14" rx="1.5" />
              <rect x="74" y="6" width="8" height="18" rx="1.5" fill="#0A0A0A" />
            </g>
          </svg>
        </article>
      </section>

      <section className="ehms-dashboard-qa-grid">
        <article className="ehms-dashboard-qa is-primary">
          <div className="ehms-dashboard-qa-inner">
            <div className="ehms-dashboard-qa-icon">
              <Plus aria-hidden size={20} />
            </div>
            <h3>
              {copy.quickActions.createTitle}{' '}
              <span className="ehms-dashboard-serif">{copy.quickActions.createAccent}</span>
            </h3>
            <p>{copy.quickActions.createBody}</p>
            <Link href="/events/create" className="ehms-dashboard-qa-cta">
              {copy.quickActions.createCta}
              <span className="ehms-dashboard-chev" aria-hidden>
                {isRtl ? '←' : '→'}
              </span>
            </Link>
          </div>
        </article>

        <article className="ehms-dashboard-qa is-secondary">
          <div className="ehms-dashboard-qa-inner">
            <div className="ehms-dashboard-qa-icon">
              <Sparkles aria-hidden size={20} />
            </div>
            <h3>
              {copy.quickActions.joinTitle}{' '}
              <span className="ehms-dashboard-serif">{copy.quickActions.joinAccent}</span>
            </h3>
            <p>{copy.quickActions.joinBody}</p>
            <Link href="/events" className="ehms-dashboard-qa-cta">
              {copy.quickActions.joinCta}
              <span className="ehms-dashboard-chev" aria-hidden>
                {isRtl ? '←' : '→'}
              </span>
            </Link>
          </div>
        </article>
      </section>

      <section className="ehms-dashboard-activity">
        <div className="ehms-dashboard-activity-head">
          <div>
            <h2>{copy.activity.title}</h2>
            <p>{copy.activity.subtitle}</p>
          </div>
          <div className="ehms-dashboard-activity-filters">
            {(
              [
                ['all', copy.activity.filters.all],
                ['events', copy.activity.filters.events],
                ['teams', copy.activity.filters.teams],
                ['submissions', copy.activity.filters.submissions],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                className={`ehms-dashboard-chip ${activityFilter === value ? 'active' : ''}`}
                onClick={() => setActivityFilter(value)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="ehms-dashboard-activity-list">
          {visibleActivities.length === 0 ? (
            <div className="ehms-dashboard-empty-hint">
              <p>{copy.activity.emptyTitle}</p>
              <span>{copy.activity.emptyBody}</span>
            </div>
          ) : (
            visibleActivities.map((activity) => {
              const Icon =
                activity.icon === 'team'
                  ? Users
                  : activity.icon === 'submission'
                    ? FileText
                    : activity.icon === 'judging'
                      ? Trophy
                      : Calendar;

              return (
                <Link
                  key={activity.id}
                  href={activity.href}
                  className="ehms-dashboard-activity-item"
                >
                  <div
                    className={`ehms-dashboard-activity-dot ${
                      activity.icon === 'team'
                        ? 'is-team'
                        : activity.icon === 'judging'
                          ? 'is-system'
                          : 'is-event'
                    }`}
                  >
                    <Icon aria-hidden size={15} />
                  </div>

                  <div className="ehms-dashboard-activity-body">
                    <div className="ehms-dashboard-activity-title">{activity.title}</div>
                    <div className="ehms-dashboard-activity-sub">{activity.subtitle}</div>
                  </div>

                  <div className="ehms-dashboard-activity-meta">
                    <div className="ehms-dashboard-activity-time">
                      {relativeTime(activity.timestamp, locale)}
                    </div>
                    <span className={`ehms-dashboard-tag is-${activity.tone}`}>{activity.tag}</span>
                  </div>

                  <span className="ehms-dashboard-activity-chev" aria-hidden>
                    {isRtl ? '←' : '→'}
                  </span>
                </Link>
              );
            })
          )}
        </div>

        {visibleActivities.length > 0 && (
          <div className="ehms-dashboard-activity-footer">
            <Link href="/events">
              {copy.activity.footer} {isRtl ? '←' : '→'}
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
