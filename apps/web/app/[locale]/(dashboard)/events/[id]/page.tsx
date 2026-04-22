'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { Link } from '@/i18n/routing';
import { eventsApi, authApi } from '@/lib/api';
import { toast } from 'sonner';

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

const STATE_ORDER = [
  'DRAFT', 'PUBLISHED', 'REGISTRATION_OPEN', 'TEAM_FORMATION',
  'HACKING_PHASE', 'SUBMISSION_CLOSED', 'JUDGING', 'RESULTS_PUBLISHED', 'ARCHIVED',
];

const STATE_LABELS: Record<string, string> = {
  DRAFT: 'Draft', PUBLISHED: 'Published', REGISTRATION_OPEN: 'Registration',
  TEAM_FORMATION: 'Teams', HACKING_PHASE: 'Hacking', SUBMISSION_CLOSED: 'Submissions',
  JUDGING: 'Judging', RESULTS_PUBLISHED: 'Results', ARCHIVED: 'Archived',
};

const STATE_GUIDANCE: Record<string, { en: string; ar: string }> = {
  DRAFT: { en: 'The event is being set up. Fill in all details and click Publish when ready.', ar: 'الحدث في مرحلة الإعداد. أكمل جميع التفاصيل واضغط على نشر عندما تكون مستعداً.' },
  PUBLISHED: { en: 'The event is published and visible. Registration will open at the scheduled time.', ar: 'الحدث منشور ومرئي. سيفتح التسجيل تلقائياً في الوقت المحدد.' },
  REGISTRATION_OPEN: { en: 'Registration is open! Participants can now register, create teams, and invite members.', ar: 'التسجيل مفتوح! يمكن للمشاركين الآن التسجيل وإنشاء الفرق ودعوة الأعضاء.' },
  TEAM_FORMATION: { en: 'Registration has closed. Teams can still be formed before hacking begins.', ar: 'أُغلق التسجيل. لا تزال الفرق قابلة للتشكيل قبل بدء القرصنة.' },
  HACKING_PHASE: { en: 'Hacking has started! Teams are locked. Work on your projects and submit.', ar: 'بدأت مرحلة البناء! الفرق مقفلة. اعمل على مشاريعك وقدّمها.' },
  SUBMISSION_CLOSED: { en: 'Submissions are closed. Organizers can now move to the judging phase.', ar: 'أُغلقت التقديمات. يمكن للمنظمين الآن نقل الحدث إلى مرحلة التحكيم.' },
  JUDGING: { en: 'Judges are evaluating submissions. Results will be published once complete.', ar: 'يقوم المحكمون بتقييم التقديمات. ستُنشر النتائج بمجرد اكتمال التحكيم.' },
  RESULTS_PUBLISHED: { en: 'Results are in! Winners and rankings are now visible to all participants.', ar: 'النتائج متاحة! الفائزون والترتيب مرئيان الآن لجميع المشاركين.' },
  ARCHIVED: { en: 'This event has been archived. All data is preserved for reference.', ar: 'تم أرشفة هذا الحدث. جميع البيانات محفوظة للرجوع إليها.' },
};

const TIMELINE_STATES = STATE_ORDER.filter(s => s !== 'ARCHIVED');

export default function EventDetailPage() {
  const params = useParams();
  const t = useTranslations('events');
  const locale = useLocale();
  const [event, setEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);
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
    if (isOrganizerOrAdmin && eventId) loadParticipants();
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
    } catch { /* silently fail */ } finally {
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
      toast.success(typeof message === 'object' ? (message[locale] || message.en) : (message || 'Event published'), { duration: 4000 });
      loadEvent();
    } catch (err: any) {
      const errorData = err.response?.data;
      const errorMessage = errorData?.error?.message || errorData?.message;
      toast.error(errorMessage && typeof errorMessage === 'object' ? (errorMessage[locale] || errorMessage.en) : (errorMessage || t('publishError')), { duration: 5000 });
    }
  };

  const handleAdvanceState = async () => {
    try {
      const response = await eventsApi.advanceState(eventId);
      const message = response.data?.message;
      toast.success(typeof message === 'object' ? (message[locale] || message.en) : (message || 'State advanced'), { duration: 4000 });
      loadEvent();
    } catch (err: any) {
      const errorData = err.response?.data;
      const errorMessage = errorData?.error?.message || errorData?.message;
      toast.error(errorMessage && typeof errorMessage === 'object' ? (errorMessage[locale] || errorMessage.en) : (errorMessage || 'Failed to advance state'), { duration: 5000 });
    }
  };

  const fmtDate = (d: string | Date) => {
    if (!d) return 'N/A';
    try {
      const date = typeof d === 'string' ? new Date(d) : d;
      if (isNaN(date.getTime())) return 'Invalid Date';
      return date.toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch { return 'Invalid Date'; }
  };

  const fmtTime = (d: string | Date) => {
    if (!d) return '';
    try {
      const date = typeof d === 'string' ? new Date(d) : d;
      if (isNaN(date.getTime())) return '';
      return date.toLocaleTimeString(locale === 'ar' ? 'ar-SA' : 'en-US', { hour: '2-digit', minute: '2-digit' });
    } catch { return ''; }
  };

  if (isLoading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 40, height: 40, border: '2.5px solid transparent', borderTopColor: 'oklch(0.85 0.17 130)', borderRadius: '50%', animation: 'ehmsSpin .8s linear infinite', margin: '0 auto 14px' }} />
        <p style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: '#6B6B6B', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Loading event…</p>
      </div>
    </div>
  );

  if (error || !event) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
      <div style={{ textAlign: 'center' }}>
        <p style={{ color: 'oklch(0.62 0.22 25)', marginBottom: 16 }}>{error || t('notFound')}</p>
        <Link href="/events">
          <button style={{ padding: '10px 18px', background: '#0A0A0A', color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer', fontSize: 13.5 }}>{t('backToEvents')}</button>
        </Link>
      </div>
    </div>
  );

  const currentStateIndex = STATE_ORDER.indexOf(event.state);
  const currentTimelineIndex = TIMELINE_STATES.indexOf(event.state);
  const guidance = STATE_GUIDANCE[event.state];
  const canRegister = event.state === 'REGISTRATION_OPEN';
  const canCreateTeam = event.state === 'REGISTRATION_OPEN' || event.state === 'TEAM_FORMATION';
  const canSubmit = event.state === 'HACKING_PHASE' || event.state === 'SUBMISSION_CLOSED';
  const canViewLeaderboard = ['JUDGING', 'RESULTS_PUBLISHED', 'ARCHIVED'].includes(event.state);
  const canAssignJudge = ['SUBMISSION_CLOSED', 'JUDGING', 'RESULTS_PUBLISHED'].includes(event.state);
  const isEventEnded = ['RESULTS_PUBLISHED', 'ARCHIVED'].includes(event.state);
  const fillRatio = currentTimelineIndex <= 0 ? 0 : currentTimelineIndex / (TIMELINE_STATES.length - 1);
  const filtered = participants.filter(p =>
    p.user.name.toLowerCase().includes(participantSearch.toLowerCase()) ||
    p.user.email.toLowerCase().includes(participantSearch.toLowerCase())
  );

  const exportCSV = () => {
    const header = ['Name', 'Email', 'Status', 'Registered At'];
    const rows = participants.map(p => [p.user.name, p.user.email, p.status, new Date(p.registeredAt).toISOString()]);
    const csv = [header, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `participants-${eventId}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const regIdx = STATE_ORDER.indexOf('REGISTRATION_OPEN');
  const hackIdx = STATE_ORDER.indexOf('HACKING_PHASE');
  const regStatus = currentStateIndex === regIdx ? 'OPEN' : currentStateIndex > regIdx ? 'CLOSED' : 'UPCOMING';
  const hackStatus = currentStateIndex === hackIdx ? 'ACTIVE' : currentStateIndex > hackIdx ? 'CLOSED' : 'UPCOMING';

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&display=swap');
        @keyframes ehmsSpin { to { transform: rotate(360deg); } }

        .ep { font-family: 'Inter','IBM Plex Sans Arabic',system-ui,sans-serif; -webkit-font-smoothing: antialiased; color: #0A0A0A; }

        /* Hero */
        .ep-hero { position:relative; border:1px solid rgba(10,10,10,0.08); border-radius:20px; padding:28px 32px; background:#fff; margin-bottom:24px; overflow:hidden; }
        .ep-hero::before { content:""; position:absolute; inset:0; background: radial-gradient(ellipse 50% 80% at 0% 0%, oklch(0.88 0.17 130 / 0.28) 0%, transparent 55%), radial-gradient(ellipse 40% 70% at 100% 120%, oklch(0.82 0.15 130 / 0.18) 0%, transparent 55%); pointer-events:none; }
        .ep-hero-inner { position:relative; z-index:1; display:flex; justify-content:space-between; align-items:flex-start; gap:32px; flex-wrap:wrap; }

        /* Tags */
        .ep-tag { display:inline-flex; align-items:center; gap:6px; padding:5px 11px; border-radius:100px; font-size:11.5px; font-weight:600; letter-spacing:0.02em; font-family:'JetBrains Mono',monospace; }
        .ep-tag-state { background:#0A0A0A; color:oklch(0.85 0.17 130); text-transform:uppercase; }
        .ep-tag-state .d { width:6px; height:6px; border-radius:50%; background:oklch(0.85 0.17 130); box-shadow:0 0 0 3px oklch(0.85 0.17 130 / 0.3); flex-shrink:0; }
        .ep-tag-region { background:rgba(255,255,255,.7); border:1px solid rgba(10,10,10,0.14); color:#2A2A2A; backdrop-filter:blur(8px); }
        .ep-tag-id { background:rgba(255,255,255,.7); border:1px solid rgba(10,10,10,0.14); color:#6B6B6B; backdrop-filter:blur(8px); text-transform:none; letter-spacing:0.06em; }

        /* KPIs */
        .ep-kpis { display:grid; grid-template-columns:repeat(3,1fr); gap:14px; margin-top:26px; position:relative; z-index:1; }
        .ep-kpi { background:rgba(255,255,255,.7); border:1px solid rgba(10,10,10,0.08); border-radius:14px; padding:18px 20px; backdrop-filter:blur(8px); display:flex; align-items:center; gap:16px; transition:all .25s; }
        .ep-kpi:hover { background:#fff; border-color:rgba(10,10,10,0.14); transform:translateY(-2px); }
        .ep-kpi-ico { width:42px; height:42px; border-radius:11px; background:#0A0A0A; color:oklch(0.85 0.17 130); display:flex; align-items:center; justify-content:center; flex-shrink:0; }
        .ep-kpi .v { font-size:28px; letter-spacing:-0.025em; font-weight:600; line-height:1; }
        .ep-kpi .l { font-size:12px; color:#6B6B6B; text-transform:uppercase; letter-spacing:0.08em; font-weight:600; font-family:'JetBrains Mono',monospace; margin-top:4px; }

        /* Banner */
        .ep-banner { background:linear-gradient(135deg,oklch(0.93 0.09 130),#fff); border:1px solid oklch(0.85 0.17 130 / 0.35); border-radius:16px; padding:18px 22px; margin-bottom:24px; display:flex; align-items:center; gap:16px; position:relative; overflow:hidden; }
        .ep-banner::after { content:""; position:absolute; inset:0; background:radial-gradient(ellipse 50% 120% at 100% 50%, oklch(0.85 0.17 130 / 0.2), transparent 60%); pointer-events:none; }
        .ep-banner-ico { width:44px; height:44px; border-radius:12px; background:#0A0A0A; color:oklch(0.85 0.17 130); display:flex; align-items:center; justify-content:center; flex-shrink:0; position:relative; z-index:1; }

        /* Layout */
        .ep-layout { display:grid; grid-template-columns:1fr 360px; gap:20px; }

        /* Card */
        .ep-card { background:#fff; border:1px solid rgba(10,10,10,0.08); border-radius:18px; overflow:hidden; margin-bottom:20px; }
        .ep-card-head { padding:18px 24px; border-bottom:1px solid rgba(10,10,10,0.08); display:flex; justify-content:space-between; align-items:center; gap:12px; }
        .ep-card-head h3 { font-size:16px; font-weight:600; letter-spacing:-0.015em; margin:0; }
        .ep-card-head .sub { font-size:12.5px; color:#6B6B6B; margin-top:2px; }

        /* Stepper */
        .ep-stepper { padding:28px 24px 24px; display:flex; align-items:stretch; overflow-x:auto; position:relative; }
        .ep-stepper-track { position:absolute; top:52px; left:52px; right:52px; height:2px; background:rgba(10,10,10,0.08); border-radius:2px; }
        .ep-stepper-fill { position:absolute; top:52px; left:52px; height:2px; background:linear-gradient(90deg,#0A0A0A,oklch(0.68 0.19 130)); border-radius:2px; box-shadow:0 0 8px oklch(0.85 0.17 130 / 0.6); transition:width .6s ease; }
        .ep-stepper-fill::after { content:""; position:absolute; right:-5px; top:-4px; width:10px; height:10px; border-radius:50%; background:oklch(0.85 0.17 130); box-shadow:0 0 0 4px oklch(0.85 0.17 130 / 0.3), 0 0 12px oklch(0.68 0.19 130); }
        .ep-step { flex:1; min-width:80px; display:flex; flex-direction:column; align-items:center; text-align:center; position:relative; z-index:1; }
        .ep-step .dot { width:38px; height:38px; border-radius:50%; background:#fff; border:2px solid rgba(10,10,10,0.14); display:flex; align-items:center; justify-content:center; font-weight:600; font-size:13px; color:#9B9B9B; font-family:'JetBrains Mono',monospace; transition:all .2s; }
        .ep-step.done .dot { background:#0A0A0A; border-color:#0A0A0A; color:oklch(0.85 0.17 130); }
        .ep-step.current .dot { background:oklch(0.85 0.17 130); border-color:oklch(0.85 0.17 130); color:#0A0A0A; box-shadow:0 0 0 4px oklch(0.85 0.17 130 / 0.22); }
        .ep-step .lbl { margin-top:10px; font-size:12px; color:#6B6B6B; font-weight:500; }
        .ep-step.done .lbl { color:#2A2A2A; }
        .ep-step.current .lbl { color:#0A0A0A; font-weight:600; }
        .ep-step .cnt { font-size:10.5px; color:#9B9B9B; margin-top:2px; font-family:'JetBrains Mono',monospace; }
        .ep-step.current .cnt { color:oklch(0.68 0.19 130); font-weight:600; }

        /* Info group */
        .ep-group-title { display:flex; align-items:center; gap:10px; padding:16px 24px; background:#FCFCFA; border-top:1px solid rgba(10,10,10,0.08); font-size:12px; text-transform:uppercase; letter-spacing:0.1em; color:#2A2A2A; font-weight:600; font-family:'JetBrains Mono',monospace; }
        .ep-group-title:first-child { border-top:0; }
        .ep-group-ico { width:26px; height:26px; border-radius:7px; background:oklch(0.93 0.09 130); color:#0A0A0A; display:flex; align-items:center; justify-content:center; border:1px solid oklch(0.85 0.17 130 / 0.3); flex-shrink:0; }
        .ep-pill { margin-left:auto; font-family:'JetBrains Mono',monospace; font-size:10.5px; padding:2px 8px; border-radius:100px; font-weight:600; letter-spacing:0.05em; }
        .ep-pill-closed { background:#0A0A0A; color:#fff; }
        .ep-pill-open { background:oklch(0.85 0.17 130); color:#0A0A0A; }
        .ep-pill-upcoming { background:#F5F5F0; color:#6B6B6B; }
        .ep-info-row { display:grid; grid-template-columns:1fr 1fr; gap:24px; padding:18px 24px; border-top:1px solid rgba(10,10,10,0.08); }
        .ep-info-cell .lbl { font-size:11px; color:#6B6B6B; text-transform:uppercase; letter-spacing:0.08em; font-weight:600; font-family:'JetBrains Mono',monospace; display:flex; align-items:center; gap:6px; margin-bottom:4px; }
        .ep-info-cell .val { font-size:15px; font-weight:500; letter-spacing:-0.01em; color:#0A0A0A; }
        .ep-info-cell .val .d { font-size:13px; color:#6B6B6B; font-weight:400; display:block; margin-top:2px; }

        /* Participants */
        .ep-pt-top { display:flex; align-items:center; justify-content:space-between; gap:12px; padding:20px 24px; flex-wrap:wrap; border-bottom:1px solid rgba(10,10,10,0.08); }
        .ep-search { display:flex; align-items:center; gap:8px; padding:7px 12px; background:#FBFBF9; border:1px solid rgba(10,10,10,0.08); border-radius:9px; font-size:13px; color:#6B6B6B; width:220px; transition:all .2s; }
        .ep-search:focus-within { background:#fff; border-color:#0A0A0A; }
        .ep-search input { border:none; outline:none; flex:1; font:inherit; font-size:13px; background:transparent; color:#0A0A0A; }
        .ep-empty { padding:56px 24px; text-align:center; display:flex; flex-direction:column; align-items:center; gap:10px; background:#FCFCFA; }
        .ep-empty-ico { width:64px; height:64px; border-radius:16px; background:#fff; border:1px dashed rgba(10,10,10,0.14); display:flex; align-items:center; justify-content:center; color:#9B9B9B; margin-bottom:6px; }
        .ep-p-row { display:flex; align-items:center; gap:16px; padding:12px 24px; border-bottom:1px solid rgba(10,10,10,0.08); transition:background .15s; cursor:default; }
        .ep-p-row:hover { background:#FCFCFA; }

        /* Side column */
        .ep-side { display:flex; flex-direction:column; gap:16px; position:sticky; top:82px; align-self:start; }

        /* Quick actions */
        .ep-qa { background:#fff; border:1px solid rgba(10,10,10,0.08); border-radius:18px; overflow:hidden; }
        .ep-qa-head { padding:18px 20px; border-bottom:1px solid rgba(10,10,10,0.08); display:flex; justify-content:space-between; align-items:center; }
        .ep-qa-item { display:flex; align-items:center; gap:12px; padding:12px 14px; transition:background .2s; text-decoration:none; color:inherit; }
        .ep-qa-item:hover { background:#FCFCFA; }
        .ep-qa-item + .ep-qa-item { border-top:1px dashed rgba(10,10,10,0.14); }
        .ep-qa-ico { width:36px; height:36px; border-radius:10px; background:oklch(0.93 0.09 130); color:#0A0A0A; display:flex; align-items:center; justify-content:center; flex-shrink:0; border:1px solid oklch(0.85 0.17 130 / 0.3); }
        .ep-qa-item.dark .ep-qa-ico { background:#0A0A0A; color:oklch(0.85 0.17 130); border-color:#0A0A0A; }
        .ep-qa-chev { color:#9B9B9B; transition:transform .2s, color .2s; margin-left:auto; flex-shrink:0; }
        .ep-qa-item:hover .ep-qa-chev { transform:translateX(3px); color:#0A0A0A; }

        /* Meta card */
        .ep-meta { background:#0A0A0A; color:#fff; border-radius:18px; padding:22px; position:relative; overflow:hidden; }
        .ep-meta::before { content:""; position:absolute; inset:0; background:radial-gradient(ellipse 60% 80% at 100% 120%, oklch(0.85 0.17 130 / 0.4) 0%, transparent 55%); pointer-events:none; }
        .ep-meta-inner { position:relative; z-index:1; }
        .ep-meta-row { display:flex; justify-content:space-between; padding:9px 0; font-size:13px; border-bottom:1px dashed rgba(255,255,255,0.1); }
        .ep-meta-row:last-child { border-bottom:0; }

        /* Danger */
        .ep-danger { background:#fff; border:1px solid oklch(0.88 0.06 25); border-radius:18px; padding:18px 20px; }

        /* Buttons */
        .ep-btn { display:inline-flex; align-items:center; gap:8px; padding:10px 16px; border-radius:10px; font-size:13.5px; font-weight:500; transition:all .2s; border:1px solid transparent; white-space:nowrap; cursor:pointer; font-family:inherit; text-decoration:none; }
        .ep-btn-primary { background:#0A0A0A; color:#fff; border-color:#0A0A0A; }
        .ep-btn-primary:hover { background:#000; transform:translateY(-1px); box-shadow:0 6px 20px -8px rgba(10,10,10,0.4); }
        .ep-btn-outline { border-color:rgba(10,10,10,0.14); color:#0A0A0A; background:#fff; }
        .ep-btn-outline:hover { border-color:#0A0A0A; }
        .ep-btn-accent { background:oklch(0.85 0.17 130); color:#0A0A0A; font-weight:600; border-color:oklch(0.85 0.17 130); }
        .ep-btn-accent:hover { background:oklch(0.68 0.19 130); color:#fff; transform:translateY(-1px); box-shadow:0 10px 24px -10px oklch(0.68 0.19 130 / 0.5); }
        .ep-btn-danger { display:inline-flex; align-items:center; gap:6px; padding:7px 12px; border:1px solid oklch(0.88 0.06 25); color:oklch(0.62 0.22 25); border-radius:8px; font-size:12.5px; font-weight:500; transition:all .2s; cursor:pointer; background:none; font-family:inherit; }
        .ep-btn-danger:hover { background:oklch(0.62 0.22 25); color:#fff; border-color:oklch(0.62 0.22 25); }
        .ep-btn-sm { padding:7px 12px; font-size:13px; }

        @media (max-width:1100px) {
          .ep-layout { grid-template-columns:1fr; }
          .ep-side { position:static; }
          .ep-kpis { grid-template-columns:repeat(2,1fr); }
        }
        @media (max-width:640px) {
          .ep-hero { padding:22px; }
          .ep-kpis { grid-template-columns:1fr; }
          .ep-stepper { padding:20px 12px; }
          .ep-info-row { grid-template-columns:1fr; }
        }
      `}</style>

      <div className="ep">

        {/* ── HERO ── */}
        <div className="ep-hero">
          <div className="ep-hero-inner">
            <div style={{ maxWidth: 700 }}>
              <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
                <span className="ep-tag ep-tag-state">
                  <span className="d" />
                  {STATE_LABELS[event.state] || event.state}
                </span>
                <span className="ep-tag ep-tag-region">🏆 Hackathon Event</span>
                <span className="ep-tag ep-tag-id">{event.id?.slice(0, 16) || 'EVT-ID'}</span>
              </div>
              <h1 style={{
                fontSize: 38, letterSpacing: '-0.025em', fontWeight: 600, lineHeight: 1.1, margin: 0,
                ...(locale === 'ar' ? { fontFamily: "'IBM Plex Sans Arabic',sans-serif", direction: 'rtl', fontWeight: 700 } : {}),
              }}>
                {getText(event.name, locale)}
              </h1>
              <p style={{
                fontSize: 15, color: '#6B6B6B', marginTop: 8, maxWidth: 520, lineHeight: 1.5,
                ...(locale === 'ar' ? { fontFamily: "'IBM Plex Sans Arabic',sans-serif", direction: 'rtl' } : {}),
              }}>
                {getText(event.description, locale)}
              </p>
            </div>

            {/* Hero action buttons */}
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginTop: 4 }}>
              {event.state === 'DRAFT' && (
                <button className="ep-btn ep-btn-accent" onClick={handlePublish}>
                  Publish Event <span style={{ marginLeft: 2 }}>→</span>
                </button>
              )}
              {event.state !== 'DRAFT' && event.state !== 'ARCHIVED' && (
                <button className="ep-btn ep-btn-accent" onClick={handleAdvanceState}>
                  Advance State <span style={{ marginLeft: 2 }}>→</span>
                </button>
              )}
              {canRegister && (
                isRegistered ? (
                  <button className="ep-btn ep-btn-outline" disabled style={{ opacity: 0.7 }}>
                    ✓ {t('alreadyRegistered')}
                  </button>
                ) : isConfirmingRegister ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.85)', border: '1px solid rgba(10,10,10,0.14)', borderRadius: 12, padding: '8px 12px', backdropFilter: 'blur(8px)' }}>
                    <span style={{ fontSize: 13, color: '#2A2A2A' }}>{locale === 'ar' ? 'هل أنت متأكد؟' : 'Confirm registration?'}</span>
                    <button className="ep-btn ep-btn-primary" style={{ padding: '6px 12px', fontSize: 12 }} onClick={handleRegister}>{locale === 'ar' ? 'نعم' : 'Yes'}</button>
                    <button className="ep-btn ep-btn-outline" style={{ padding: '6px 12px', fontSize: 12 }} onClick={() => setIsConfirmingRegister(false)}>{locale === 'ar' ? 'إلغاء' : 'Cancel'}</button>
                  </div>
                ) : (
                  <button className="ep-btn ep-btn-primary" onClick={() => setIsConfirmingRegister(true)}>
                    {t('registerForEvent')}
                  </button>
                )
              )}
            </div>
          </div>

          {/* KPI pills */}
          {event._count && (
            <div className="ep-kpis">
              <div className="ep-kpi">
                <div className="ep-kpi-ico">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>
                </div>
                <div>
                  <div className="v">{event._count.eventRegistrations}</div>
                  <div className="l">Participants</div>
                </div>
              </div>
              <div className="ep-kpi">
                <div className="ep-kpi-ico">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="9" cy="9" r="3"/><circle cx="17" cy="7" r="2.5"/><path d="M3 20v-1a4 4 0 014-4h4a4 4 0 014 4v1M15 20v-1a3 3 0 013-3h2a3 3 0 013 3v1"/></svg>
                </div>
                <div>
                  <div className="v">{event._count.teams}</div>
                  <div className="l">Teams</div>
                </div>
              </div>
              <div className="ep-kpi">
                <div className="ep-kpi-ico">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/></svg>
                </div>
                <div>
                  <div className="v">{event._count.submissions}</div>
                  <div className="l">Submissions</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── STATE BANNER ── */}
        {guidance && (
          <div className="ep-banner">
            <div className="ep-banner-ico">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 01-10 0V4zM7 6H4v2a3 3 0 003 3M17 6h3v2a3 3 0 01-3 3"/></svg>
            </div>
            <div style={{ position: 'relative', zIndex: 1, flex: 1 }}>
              <div style={{ fontSize: 15.5, fontWeight: 600, letterSpacing: '-0.01em', marginBottom: 2 }}>{STATE_LABELS[event.state] || event.state}</div>
              <div style={{ fontSize: 13.5, color: '#2A2A2A', lineHeight: 1.5 }}>{guidance[locale as 'en' | 'ar'] || guidance.en}</div>
            </div>
            {canViewLeaderboard && (
              <div style={{ position: 'relative', zIndex: 1 }}>
                <Link href={`/judging/events/${event.id}/leaderboard`}>
                  <button className="ep-btn ep-btn-primary">View Leaderboard <span>→</span></button>
                </Link>
              </div>
            )}
          </div>
        )}

        {/* ── TWO COLUMN LAYOUT ── */}
        <div className="ep-layout">

          {/* ── LEFT COLUMN ── */}
          <div>

            {/* Progress Stepper */}
            <div className="ep-card">
              <div className="ep-card-head">
                <div>
                  <h3>Event Progress</h3>
                  <div className="sub">Lifecycle state · {Math.max(currentTimelineIndex, 0)} of {TIMELINE_STATES.length} steps completed</div>
                </div>
                <span className="ep-tag ep-tag-state" style={{ textTransform: 'none' }}>
                  <span className="d" />
                  Step {String(currentTimelineIndex + 1).padStart(2, '0')} · {STATE_LABELS[event.state]}
                </span>
              </div>
              <div className="ep-stepper">
                <div className="ep-stepper-track" />
                {fillRatio > 0 && (
                  <div className="ep-stepper-fill" style={{ width: `calc((100% - 104px) * ${fillRatio})` }} />
                )}
                {TIMELINE_STATES.map((state, index) => {
                  const isPast = currentTimelineIndex > index;
                  const isCurrent = event.state === state;
                  const stateCount =
                    state === 'REGISTRATION_OPEN' && event._count ? `${event._count.eventRegistrations}` :
                    state === 'TEAM_FORMATION' && event._count ? `${event._count.teams}` :
                    state === 'SUBMISSION_CLOSED' && event._count ? `${event._count.submissions}` : null;
                  return (
                    <div key={state} className={`ep-step${isPast ? ' done' : ''}${isCurrent ? ' current' : ''}`}>
                      <div className="dot">
                        {isPast
                          ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
                          : index + 1}
                      </div>
                      <div className="lbl">{STATE_LABELS[state]}</div>
                      {(isPast && stateCount) && <div className="cnt">{stateCount}</div>}
                      {isCurrent && <div className="cnt">CURRENT</div>}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Timeline Info */}
            <div className="ep-card" style={{ padding: 0 }}>
              {/* Registration Period */}
              <div className="ep-group-title">
                <span className="ep-group-ico">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
                </span>
                Registration Period
                <span className={`ep-pill ${regStatus === 'OPEN' ? 'ep-pill-open' : regStatus === 'CLOSED' ? 'ep-pill-closed' : 'ep-pill-upcoming'}`}>{regStatus}</span>
              </div>
              <div className="ep-info-row">
                <div className="ep-info-cell">
                  <div className="lbl"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 5l7 7-7 7"/></svg>STARTS</div>
                  <div className="val">{fmtDate(event.registrationStart)}<span className="d">{fmtTime(event.registrationStart)}</span></div>
                </div>
                <div className="ep-info-cell">
                  <div className="lbl"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M15 19l-7-7 7-7"/></svg>ENDS</div>
                  <div className="val">{fmtDate(event.registrationEnd)}<span className="d">{fmtTime(event.registrationEnd)}</span></div>
                </div>
              </div>

              {/* Hackathon Period */}
              <div className="ep-group-title">
                <span className="ep-group-ico">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9z"/></svg>
                </span>
                Hackathon Period
                <span className={`ep-pill ${hackStatus === 'ACTIVE' ? 'ep-pill-open' : hackStatus === 'CLOSED' ? 'ep-pill-closed' : 'ep-pill-upcoming'}`}>{hackStatus}</span>
              </div>
              <div className="ep-info-row">
                <div className="ep-info-cell">
                  <div className="lbl"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 5l7 7-7 7"/></svg>STARTS</div>
                  <div className="val">{fmtDate(event.hackingStart)}<span className="d">{fmtTime(event.hackingStart)}</span></div>
                </div>
                <div className="ep-info-cell">
                  <div className="lbl"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M15 19l-7-7 7-7"/></svg>ENDS</div>
                  <div className="val">{fmtDate(event.hackingEnd)}<span className="d">{fmtTime(event.hackingEnd)}</span></div>
                </div>
              </div>

              {/* Team Size */}
              <div className="ep-group-title">
                <span className="ep-group-ico">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                </span>
                Team Size
              </div>
              <div className="ep-info-row">
                <div className="ep-info-cell">
                  <div className="lbl"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14"/></svg>MINIMUM</div>
                  <div className="val">{event.minTeamSize} members</div>
                </div>
                <div className="ep-info-cell">
                  <div className="lbl"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>MAXIMUM</div>
                  <div className="val">{event.maxTeamSize} members</div>
                </div>
              </div>
            </div>

            {/* Participants (organizer/admin only) */}
            {isOrganizerOrAdmin && (
              <div className="ep-card">
                <div className="ep-pt-top">
                  <div>
                    <div style={{ fontSize: 17, fontWeight: 600, letterSpacing: '-0.015em', display: 'flex', alignItems: 'center', gap: 8 }}>
                      {locale === 'ar' ? 'المشاركون المسجلون' : 'Registered Participants'}
                      <span style={{ fontFamily: "'JetBrains Mono',monospace", color: '#9B9B9B', fontWeight: 500, fontSize: 15 }}>({participants.length})</span>
                    </div>
                    <div style={{ fontSize: 13, color: '#6B6B6B', marginTop: 3 }}>
                      {locale === 'ar' ? 'جميع المستخدمين الذين سجلوا في هذه الفعالية' : 'All users who registered for this event'}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                    <div className="ep-search">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>
                      <input type="text" value={participantSearch} onChange={e => setParticipantSearch(e.target.value)} placeholder={locale === 'ar' ? 'بحث بالاسم أو البريد…' : 'Search by name, email…'} />
                    </div>
                    <button className="ep-btn ep-btn-outline ep-btn-sm" onClick={loadParticipants} disabled={participantsLoading}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" style={participantsLoading ? { animation: 'ehmsSpin .8s linear infinite' } : undefined}><path d="M21 12a9 9 0 11-3-6.7L21 8"/><path d="M21 3v5h-5"/></svg>
                      {locale === 'ar' ? 'تحديث' : 'Refresh'}
                    </button>
                    {participants.length > 0 && (
                      <button className="ep-btn ep-btn-outline ep-btn-sm" onClick={exportCSV}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
                        {locale === 'ar' ? 'تصدير CSV' : 'Export CSV'}
                      </button>
                    )}
                  </div>
                </div>

                {participantsLoading ? (
                  <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
                    <div style={{ width: 32, height: 32, border: '2px solid transparent', borderTopColor: 'oklch(0.85 0.17 130)', borderRadius: '50%', animation: 'ehmsSpin .8s linear infinite' }} />
                  </div>
                ) : filtered.length === 0 ? (
                  <div className="ep-empty">
                    <div className="ep-empty-ico">
                      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 00-3-3.87"/></svg>
                    </div>
                    <h4 style={{ fontSize: 16, fontWeight: 600, letterSpacing: '-0.01em' }}>
                      {participantSearch ? 'No results found' : 'No registered participants yet'}
                    </h4>
                    <p style={{ fontSize: 13.5, color: '#6B6B6B', maxWidth: 360, lineHeight: 1.5 }}>
                      {participantSearch ? `No participants match "${participantSearch}"` : "When users register for this event, they'll appear here. You can filter, export, or message them in bulk."}
                    </p>
                  </div>
                ) : (
                  <div>
                    {filtered.map((p, i) => (
                      <div key={p.id} className="ep-p-row">
                        <span style={{ width: 24, fontSize: 12, color: '#9B9B9B', textAlign: 'center', flexShrink: 0, fontFamily: "'JetBrains Mono',monospace" }}>{i + 1}</span>
                        <div style={{ width: 36, height: 36, background: 'linear-gradient(135deg,oklch(0.85 0.17 130),oklch(0.68 0.19 130))', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0A0A0A', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                          {p.user.name.split(' ').map((n: string) => n[0]?.toUpperCase()).slice(0, 2).join('')}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 14, fontWeight: 500, color: '#0A0A0A', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.user.name}</p>
                          <p style={{ fontSize: 12, color: '#6B6B6B', margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.user.email}</p>
                        </div>
                        <div style={{ fontSize: 12, color: '#9B9B9B', fontFamily: "'JetBrains Mono',monospace", flexShrink: 0 }}>
                          {new Date(p.registeredAt).toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                        </div>
                        <span style={{ flexShrink: 0, padding: '3px 10px', borderRadius: 100, fontSize: 11, fontWeight: 600, fontFamily: "'JetBrains Mono',monospace", background: p.status === 'REGISTERED' ? 'oklch(0.93 0.09 130)' : '#F5F5F0', color: p.status === 'REGISTERED' ? '#0A0A0A' : '#6B6B6B', border: p.status === 'REGISTERED' ? '1px solid oklch(0.85 0.17 130 / 0.3)' : '1px solid rgba(10,10,10,0.08)' }}>
                          {p.status === 'REGISTERED' ? (locale === 'ar' ? 'مسجل' : 'REGISTERED') : p.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── RIGHT COLUMN ── */}
          <div className="ep-side">

            {/* Quick Actions */}
            <div className="ep-qa">
              <div className="ep-qa-head">
                <div style={{ fontSize: 15.5, fontWeight: 600, letterSpacing: '-0.015em' }}>Quick Actions</div>
                {isEventEnded && (
                  <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10.5, padding: '3px 8px', borderRadius: 100, background: '#0A0A0A', color: '#fff', letterSpacing: '0.05em', fontWeight: 600 }}>EVENT ENDED</span>
                )}
              </div>
              <div style={{ padding: '14px' }}>
                <Link href={`/events/${event.id}/teams`} className="ep-qa-item">
                  <div className="ep-qa-ico"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 00-3-3.87"/></svg></div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 500, letterSpacing: '-0.01em' }}>{t('viewTeams')}</div>
                    <div style={{ fontSize: 12, color: '#6B6B6B', marginTop: 1 }}>{event._count?.teams || 0} teams · rosters &amp; members</div>
                  </div>
                  <svg className="ep-qa-chev" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 6l6 6-6 6"/></svg>
                </Link>

                {canCreateTeam && (
                  <Link href={`/events/${event.id}/teams/create`} className="ep-qa-item">
                    <div className="ep-qa-ico"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg></div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 500, letterSpacing: '-0.01em' }}>{t('createTeam')}</div>
                      <div style={{ fontSize: 12, color: '#6B6B6B', marginTop: 1 }}>Form a new team</div>
                    </div>
                    <svg className="ep-qa-chev" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 6l6 6-6 6"/></svg>
                  </Link>
                )}

                {canSubmit && (
                  <Link href="/submissions/create" className="ep-qa-item">
                    <div className="ep-qa-ico"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/></svg></div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 500, letterSpacing: '-0.01em' }}>Submit Project</div>
                      <div style={{ fontSize: 12, color: '#6B6B6B', marginTop: 1 }}>Upload your project files</div>
                    </div>
                    <svg className="ep-qa-chev" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 6l6 6-6 6"/></svg>
                  </Link>
                )}

                {canAssignJudge && (
                  <Link href={`/events/${event.id}/judging/assign`} className="ep-qa-item">
                    <div className="ep-qa-ico"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l3 7h7l-5.5 4 2 7L12 16l-6.5 4 2-7L2 9h7z"/></svg></div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 500, letterSpacing: '-0.01em' }}>{locale === 'ar' ? 'تعيين حكم' : 'Assign Judge'}</div>
                      <div style={{ fontSize: 12, color: '#6B6B6B', marginTop: 1 }}>Add reviewers &amp; scoring panel</div>
                    </div>
                    <svg className="ep-qa-chev" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 6l6 6-6 6"/></svg>
                  </Link>
                )}

                {canViewLeaderboard && (
                  <Link href={`/judging/events/${event.id}/leaderboard`} className="ep-qa-item dark">
                    <div className="ep-qa-ico"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 01-10 0V4zM7 6H4v2a3 3 0 003 3M17 6h3v2a3 3 0 01-3 3"/></svg></div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 500, letterSpacing: '-0.01em' }}>View Leaderboard</div>
                      <div style={{ fontSize: 12, color: '#6B6B6B', marginTop: 1 }}>Final rankings · certified</div>
                    </div>
                    <svg className="ep-qa-chev" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 6l6 6-6 6"/></svg>
                  </Link>
                )}
              </div>
            </div>

            {/* Event Meta (dark card) */}
            <div className="ep-meta">
              <div className="ep-meta-inner">
                <h4 style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,.55)', fontWeight: 600, marginBottom: 12, fontFamily: "'JetBrains Mono',monospace" }}>
                  Event Meta
                </h4>
                <div className="ep-meta-row">
                  <span style={{ color: 'rgba(255,255,255,.55)' }}>Event ID</span>
                  <span style={{ fontWeight: 500, fontFamily: "'JetBrains Mono',monospace", fontSize: 11 }}>{event.id?.slice(0, 16) || 'N/A'}</span>
                </div>
                <div className="ep-meta-row">
                  <span style={{ color: 'rgba(255,255,255,.55)' }}>State</span>
                  <span style={{ fontWeight: 500 }}>{STATE_LABELS[event.state] || event.state}</span>
                </div>
                <div className="ep-meta-row">
                  <span style={{ color: 'rgba(255,255,255,.55)' }}>Min Team</span>
                  <span style={{ fontWeight: 500 }}>{event.minTeamSize} members</span>
                </div>
                <div className="ep-meta-row">
                  <span style={{ color: 'rgba(255,255,255,.55)' }}>Max Team</span>
                  <span style={{ fontWeight: 500 }}>{event.maxTeamSize} members</span>
                </div>
                <div className="ep-meta-row">
                  <span style={{ color: 'rgba(255,255,255,.55)' }}>Language</span>
                  <span style={{ fontWeight: 500 }}>AR / EN</span>
                </div>
              </div>
            </div>

            {/* Danger Zone (organizer/admin only) */}
            {isOrganizerOrAdmin && (
              <div className="ep-danger">
                <h4 style={{ fontSize: 13, fontWeight: 600, color: 'oklch(0.62 0.22 25)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.3 3.9L2.4 18a2 2 0 001.7 3h15.8a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0zM12 9v4M12 17h.01"/></svg>
                  Danger zone
                </h4>
                <p style={{ fontSize: 12.5, color: '#6B6B6B', lineHeight: 1.5, marginBottom: 10 }}>
                  Archive this event to hide it from public listings. Archived events stay available for reports and audits.
                </p>
                <button className="ep-btn-danger">Archive event</button>
              </div>
            )}

          </div>
        </div>
      </div>
    </>
  );
}
