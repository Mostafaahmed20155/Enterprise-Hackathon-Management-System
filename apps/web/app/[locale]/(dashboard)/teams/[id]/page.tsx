'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { teamsApi, usersApi } from '@/lib/api';
import { toast } from 'sonner';
import { Link } from '@/i18n/routing';

interface Team {
  id: string;
  name: string;
  description: string;
  event: { id: string; name: string; maxTeamSize?: number };
  members: Array<{ id: string; user: { id: string; name: string; email: string }; role: string }>;
  invites: Array<{ id: string; email: string; status: string }>;
  isLocked: boolean;
}

interface UserResult {
  id: string;
  name: string;
  email: string;
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

const AV_COLORS = [
  'linear-gradient(135deg, #FFB74D, #E57373)',
  'linear-gradient(135deg, #5C6BC0, #7E57C2)',
  'linear-gradient(135deg, oklch(0.85 0.17 130), oklch(0.68 0.19 130))',
  'linear-gradient(135deg, #26A69A, #5C6BC0)',
  'linear-gradient(135deg, #EC407A, #AB47BC)',
];

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function MemberDot({ color = 'oklch(0.85 0.17 130)' }: { color?: string }) {
  return <span style={{ display: 'inline-block', width: 5, height: 5, borderRadius: '50%', background: color, marginRight: 5, verticalAlign: 'middle' }} />;
}

export default function TeamDetailPage() {
  const params = useParams();
  const t = useTranslations('teams');
  const locale = useLocale();
  const isRtl = locale === 'ar';
  const [team, setTeam] = useState<Team | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isInviting, setIsInviting] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserResult | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchDone, setSearchDone] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const debouncedQuery = useDebounce(searchQuery, 350);
  const teamId = params.id as string;

  useEffect(() => { loadTeam(); }, [teamId]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

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

  const handleRemoveMember = async (userId: string) => {
    toast.promise(
      async () => {
        await teamsApi.removeMember(teamId, userId);
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

  const isAlreadyMember = (email: string) => team?.members.some(m => m.user.email === email) ?? false;
  const isAlreadyInvited = (email: string) => team?.invites.some(i => i.email === email && i.status === 'PENDING') ?? false;
  const emailIsValid = searchQuery.includes('@') && searchQuery.includes('.');
  const alreadyMember = selectedUser ? isAlreadyMember(selectedUser.email) : (emailIsValid ? isAlreadyMember(searchQuery) : false);
  const alreadyInvited = selectedUser ? isAlreadyInvited(selectedUser.email) : (emailIsValid ? isAlreadyInvited(searchQuery) : false);
  const canSendInvite = (selectedUser || emailIsValid) && !alreadyMember && !alreadyInvited;

  if (isLoading) {
    return (
      <div style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
        <div style={{ background: '#fff', border: '1px solid rgba(10,10,10,0.08)', borderRadius: 22, padding: '32px 34px', marginBottom: 24 }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
            {[80, 100, 70].map((w, i) => <div key={i} style={{ height: 22, width: w, background: 'linear-gradient(90deg,#F0F0EC 0%,#F8F8F4 50%,#F0F0EC 100%)', backgroundSize: '200% 100%', borderRadius: 100, animation: 'shimmer 1.4s infinite' }} />)}
          </div>
          <div style={{ height: 52, width: '45%', background: 'linear-gradient(90deg,#F0F0EC 0%,#F8F8F4 50%,#F0F0EC 100%)', backgroundSize: '200% 100%', borderRadius: 10, animation: 'shimmer 1.4s infinite', marginBottom: 12 }} />
          <div style={{ height: 20, width: '60%', background: 'linear-gradient(90deg,#F0F0EC 0%,#F8F8F4 50%,#F0F0EC 100%)', backgroundSize: '200% 100%', borderRadius: 6, animation: 'shimmer 1.4s infinite' }} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 24 }}>
          {[0, 1, 2, 3].map(i => <div key={i} style={{ height: 100, background: i === 0 ? '#0A0A0A' : '#fff', border: '1px solid rgba(10,10,10,0.08)', borderRadius: 14 }} />)}
        </div>
        <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
      </div>
    );
  }

  if (error || !team) {
    return (
      <div style={{ fontFamily: 'Inter, system-ui, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
        <div style={{ background: '#fff', border: '1px solid rgba(10,10,10,0.08)', borderRadius: 18, padding: '48px 40px', textAlign: 'center', maxWidth: 400 }}>
          <div style={{ width: 64, height: 64, borderRadius: 18, background: 'oklch(0.95 0.05 25)', border: '1px solid oklch(0.88 0.06 25)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="oklch(0.62 0.22 25)" strokeWidth="1.8" strokeLinecap="round">
              <circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" />
            </svg>
          </div>
          <h3 style={{ fontSize: 18, fontWeight: 600, letterSpacing: '-0.02em', color: '#0A0A0A', marginBottom: 8 }}>{isRtl ? 'تعذّر تحميل الفريق' : "Couldn't load team"}</h3>
          <p style={{ fontSize: 13.5, color: '#6B6B6B', marginBottom: 20 }}>{error || t('notFound')}</p>
          <button onClick={loadTeam} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '9px 16px', borderRadius: 10, background: '#0A0A0A', color: '#fff', border: 'none', fontSize: 13.5, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
            {isRtl ? 'إعادة المحاولة' : 'Retry'}
          </button>
        </div>
      </div>
    );
  }

  const leader = team.members.find(m => m.role === 'LEADER');
  const maxSize = team.event.maxTeamSize ?? 5;
  const pendingInvites = team.invites.filter(i => i.status === 'PENDING');
  const teamNameParts = team.name.trim().split(/\s+/);
  const heroFirst = teamNameParts.length > 1 ? teamNameParts.slice(0, -1).join(' ') : '';
  const heroLast = teamNameParts[teamNameParts.length - 1];

  const sideCardStyle: React.CSSProperties = {
    background: '#fff',
    border: '1px solid rgba(10,10,10,0.08)',
    borderRadius: 16,
    padding: '18px 20px',
    marginBottom: 14,
  };

  const sideCardTitleStyle: React.CSSProperties = {
    fontSize: 11,
    fontFamily: 'JetBrains Mono, monospace',
    color: '#9B9B9B',
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    fontWeight: 600,
    marginBottom: 12,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  };

  const monoLabelStyle: React.CSSProperties = {
    fontFamily: 'JetBrains Mono, monospace',
    fontSize: 10.5,
    color: '#9B9B9B',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    fontWeight: 600,
    marginBottom: 4,
  };

  return (
    <div style={{ fontFamily: 'Inter, system-ui, sans-serif', WebkitFontSmoothing: 'antialiased', direction: isRtl ? 'rtl' : 'ltr' }}>

      {/* ── HERO CARD ─────────────────────────────────────────────────── */}
      <section style={{ position: 'relative', overflow: 'hidden', border: '1px solid rgba(10,10,10,0.08)', borderRadius: 22, background: '#fff', padding: '32px 34px', marginBottom: 24 }}>

        {/* Radial glow */}
        <div style={{ position: 'absolute', top: -180, right: -120, width: 560, height: 560, background: 'radial-gradient(circle at center, oklch(0.85 0.17 130 / 0.55), transparent 62%)', pointerEvents: 'none', zIndex: 0 }} />

        {/* Dot pattern (masked) */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'radial-gradient(rgba(10,10,10,0.06) 1px, transparent 1px)',
          backgroundSize: '16px 16px',
          WebkitMaskImage: 'radial-gradient(ellipse 70% 60% at 80% 20%, #000 20%, transparent 75%)',
          maskImage: 'radial-gradient(ellipse 70% 60% at 80% 20%, #000 20%, transparent 75%)',
          pointerEvents: 'none',
          zIndex: 0,
        }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 28, flexWrap: 'wrap' }}>

            {/* Left: badges + title + meta */}
            <div style={{ flex: 1, minWidth: 300 }}>

              {/* Badges */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
                {/* Event badge */}
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '5px 10px', borderRadius: 100, background: '#0A0A0A', color: '#fff', border: '1px solid #0A0A0A', fontSize: 11.5, fontWeight: 500, backdropFilter: 'blur(8px)' }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'oklch(0.85 0.17 130)', display: 'inline-block' }} />
                  {team.event.name}
                </span>
                {/* Status badge */}
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '5px 10px', borderRadius: 100, background: 'oklch(0.85 0.17 130)', color: '#0A0A0A', border: '1px solid oklch(0.68 0.19 130)', fontSize: 11.5, fontWeight: 500 }}>
                  {team.isLocked ? (isRtl ? 'مقفل · الفريق مكتمل' : 'Locked · Roster Final') : (isRtl ? 'مسجّل · الفريق نشط' : 'Registered · Active')}
                </span>
                {team.members.length >= maxSize && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '5px 10px', borderRadius: 100, background: 'rgba(255,255,255,0.8)', border: '1px solid rgba(10,10,10,0.08)', fontSize: 11.5, fontWeight: 500, color: '#2A2A2A', backdropFilter: 'blur(8px)' }}>
                    {isRtl ? 'الحد الأقصى للأعضاء' : 'Max Members Reached'}
                  </span>
                )}
              </div>

              {/* Title */}
              <h1 style={{ fontSize: 48, letterSpacing: '-0.035em', fontWeight: 600, lineHeight: 1.02, textWrap: 'balance', maxWidth: 720, color: '#0A0A0A', margin: 0 }}>
                {heroFirst && `${heroFirst} `}
                <span style={{ fontFamily: "var(--font-serif, 'Instrument Serif', Georgia, serif)", fontStyle: 'italic', fontWeight: 400, color: '#2A2A2A' }}>
                  {heroLast}.
                </span>
              </h1>

              {/* Tagline */}
              {team.description && (
                <p style={{ fontFamily: "var(--font-serif, 'Instrument Serif', Georgia, serif)", fontStyle: 'italic', fontSize: 20, color: '#6B6B6B', marginTop: 10, maxWidth: 580, lineHeight: 1.4 }}>
                  {team.description}
                </p>
              )}

              {/* Meta row */}
              <div style={{ display: 'flex', gap: 26, marginTop: 20, flexWrap: 'wrap', fontSize: 13, color: '#6B6B6B' }}>
                <div>
                  <div style={monoLabelStyle}>{isRtl ? 'الأعضاء' : 'Members'}</div>
                  <strong style={{ color: '#0A0A0A', fontWeight: 600, display: 'block', marginBottom: 2, fontSize: 14.5, letterSpacing: '-0.01em' }}>
                    {team.members.length} of {maxSize}
                  </strong>
                  <span>{team.members.length >= maxSize ? (isRtl ? 'لا مقاعد متاحة' : 'Max reached · no open slots') : `${maxSize - team.members.length} ${isRtl ? 'مقاعد متاحة' : 'slots remaining'}`}</span>
                </div>
                <div>
                  <div style={monoLabelStyle}>{isRtl ? 'الحالة' : 'Status'}</div>
                  <strong style={{ color: '#0A0A0A', fontWeight: 600, display: 'block', marginBottom: 2, fontSize: 14.5, letterSpacing: '-0.01em' }}>
                    {team.isLocked ? (isRtl ? 'مقفل' : 'Locked') : (isRtl ? 'نشط' : 'Active')}
                  </strong>
                  <span>{team.isLocked ? (isRtl ? 'القائمة نهائية' : 'Roster finalized') : (isRtl ? 'يقبل أعضاء جدد' : 'Accepting members')}</span>
                </div>
                {pendingInvites.length > 0 && (
                  <div>
                    <div style={monoLabelStyle}>{isRtl ? 'الدعوات المعلقة' : 'Pending Invites'}</div>
                    <strong style={{ color: '#0A0A0A', fontWeight: 600, display: 'block', marginBottom: 2, fontSize: 14.5, letterSpacing: '-0.01em' }}>
                      {pendingInvites.length}
                    </strong>
                    <span>{isRtl ? 'في انتظار الرد' : 'Awaiting response'}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Right: action buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minWidth: 200 }}>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: isRtl ? 'flex-start' : 'flex-end' }}>
                <Link href={`/submissions/create?teamId=${team.id}`}>
                  <button style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderRadius: 10, fontSize: 13.5, fontWeight: 600, background: 'oklch(0.85 0.17 130)', color: '#0A0A0A', border: '1px solid transparent', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s', whiteSpace: 'nowrap' }}>
                    {isRtl ? 'تقديم المشروع' : 'Submit project'} →
                  </button>
                </Link>
              </div>
            </div>
          </div>

          {/* Leader strip */}
          {leader && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 26, padding: '14px 16px', border: '1px solid rgba(10,10,10,0.08)', borderRadius: 14, background: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(8px)' }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: AV_COLORS[0], color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 15, flexShrink: 0 }}>
                {getInitials(leader.user.name)}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em', color: '#0A0A0A', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  {leader.user.name}
                  <span style={{ display: 'inline-block', marginLeft: 2, fontSize: 10, padding: '2px 7px', borderRadius: 5, background: '#0A0A0A', color: 'oklch(0.85 0.17 130)', fontFamily: 'JetBrains Mono, monospace', fontWeight: 600, letterSpacing: '0.04em', verticalAlign: 'middle' }}>
                    LEAD
                  </span>
                </div>
                <div style={{ fontSize: 12, color: '#6B6B6B', marginTop: 2 }}>{leader.user.email}</div>
              </div>
              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                {[
                  { title: 'Message', icon: <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" /> },
                  { title: 'Email', icon: <><path d="M4 6h16v12H4z" /><path d="M4 6l8 6 8-6" /></> },
                ].map(({ title, icon }) => (
                  <button key={title} title={title} style={{ width: 34, height: 34, borderRadius: 9, border: '1px solid rgba(10,10,10,0.14)', background: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#6B6B6B', cursor: 'pointer', transition: 'all 0.2s' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{icon}</svg>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── KPI ROW ──────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>

        {/* Members (dark) */}
        <div style={{ border: '1px solid #0A0A0A', background: '#0A0A0A', borderRadius: 14, padding: '18px 20px' }}>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10.5, color: 'oklch(0.85 0.17 130)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /></svg>
            {isRtl ? 'الأعضاء' : 'Members'}
          </div>
          <div style={{ fontSize: 32, fontWeight: 600, letterSpacing: '-0.025em', lineHeight: 1, color: '#fff' }}>
            {team.members.length}<span style={{ fontSize: 16, color: 'rgba(255,255,255,0.45)', fontWeight: 500, marginLeft: 3 }}>/{maxSize}</span>
          </div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', marginTop: 8 }}>
            {team.isLocked ? <><span style={{ color: 'oklch(0.85 0.17 130)', fontWeight: 600 }}>LOCKED</span> · roster final</> : `${maxSize - team.members.length} slots open`}
          </div>
        </div>

        {/* Pending invites */}
        <div style={{ border: '1px solid rgba(10,10,10,0.08)', background: '#fff', borderRadius: 14, padding: '18px 20px' }}>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10.5, color: '#9B9B9B', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" /></svg>
            {isRtl ? 'الدعوات' : 'Invites'}
          </div>
          <div style={{ fontSize: 32, fontWeight: 600, letterSpacing: '-0.025em', lineHeight: 1, color: '#0A0A0A' }}>
            {pendingInvites.length}
          </div>
          <div style={{ fontSize: 12, color: '#9B9B9B', marginTop: 8 }}>
            {pendingInvites.length === 0 ? (isRtl ? 'لا دعوات معلقة' : 'No pending invites') : (isRtl ? 'بانتظار الرد' : 'Awaiting response')}
          </div>
        </div>

        {/* Status */}
        <div style={{ border: '1px solid rgba(10,10,10,0.08)', background: '#fff', borderRadius: 14, padding: '18px 20px' }}>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10.5, color: '#9B9B9B', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>
            {isRtl ? 'الحالة' : 'Status'}
          </div>
          <div style={{ fontSize: 28, fontWeight: 600, letterSpacing: '-0.02em', lineHeight: 1, color: '#0A0A0A' }}>
            {team.isLocked ? (isRtl ? 'مقفل' : 'Locked') : (isRtl ? 'نشط' : 'Active')}
          </div>
          <div style={{ fontSize: 12, color: '#9B9B9B', marginTop: 8 }}>
            {team.isLocked ? (isRtl ? 'القائمة نهائية' : 'Roster finalized') : (isRtl ? 'يقبل أعضاء' : 'Accepting members')}
          </div>
        </div>

        {/* Submissions */}
        <div style={{ border: '1px solid rgba(10,10,10,0.08)', background: '#fff', borderRadius: 14, padding: '18px 20px' }}>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10.5, color: '#9B9B9B', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><path d="M14 2v6h6" /></svg>
            {isRtl ? 'التقديمات' : 'Submissions'}
          </div>
          <div style={{ fontSize: 32, fontWeight: 600, letterSpacing: '-0.025em', lineHeight: 1, color: '#0A0A0A' }}>
            —
          </div>
          <div style={{ fontSize: 12, color: '#9B9B9B', marginTop: 8 }}>
            <Link href={`/submissions/create?teamId=${team.id}`} style={{ color: 'oklch(0.68 0.19 130)', fontWeight: 600, textDecoration: 'none' }}>
              {isRtl ? 'إنشاء تقديم →' : 'Create one →'}
            </Link>
          </div>
        </div>
      </div>

      {/* ── TWO-COLUMN LAYOUT ─────────────────────────────────────────── */}
      <div className="team-layout" style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 22, alignItems: 'flex-start' }}>

        {/* ── LEFT COLUMN ─────────────────────────────────────────────── */}
        <div>

          {/* Members section */}
          <section style={{ background: '#fff', border: '1px solid rgba(10,10,10,0.08)', borderRadius: 16, overflow: 'hidden', marginBottom: 20 }}>
            <div style={{ padding: '18px 22px', borderBottom: '1px solid rgba(10,10,10,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 14 }}>
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 600, letterSpacing: '-0.015em', color: '#0A0A0A', display: 'flex', alignItems: 'center', gap: 10, margin: 0 }}>
                  {isRtl ? 'أعضاء الفريق' : 'Team members'}
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11.5, color: '#9B9B9B', background: '#F5F5F0', padding: '2px 8px', borderRadius: 100, fontWeight: 600 }}>
                    {team.members.length + pendingInvites.length} / {maxSize}
                  </span>
                </h3>
                <p style={{ fontSize: 12.5, color: '#9B9B9B', marginTop: 2 }}>
                  {isRtl ? 'قائمة الأعضاء الحاليين والمدعوين' : 'Current members and pending invitations.'}
                </p>
              </div>
            </div>

            <div style={{ padding: '20px 22px' }}>

              {/* Table header */}
              <div style={{ display: 'grid', gridTemplateColumns: '44px 1fr 1fr 110px 36px', gap: 14, alignItems: 'center', padding: '10px 0', borderBottom: '1px solid rgba(10,10,10,0.08)', fontFamily: 'JetBrains Mono, monospace', fontSize: 10.5, color: '#9B9B9B', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
                <div />
                <div>{isRtl ? 'الاسم' : 'Name'}</div>
                <div>{isRtl ? 'الدور' : 'Role'}</div>
                <div>{isRtl ? 'الحالة' : 'Status'}</div>
                <div />
              </div>

              {/* Member rows */}
              {team.members.map((member, mi) => (
                <div
                  key={member.id}
                  style={{ display: 'grid', gridTemplateColumns: '44px 1fr 1fr 110px 36px', gap: 14, alignItems: 'center', padding: '14px 0', borderBottom: '1px solid rgba(10,10,10,0.08)' }}
                >
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: AV_COLORS[mi % AV_COLORS.length], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12.5, fontWeight: 700, color: mi === 2 ? '#0A0A0A' : '#fff' }}>
                    {getInitials(member.user.name)}
                  </div>
                  <div>
                    <div style={{ fontSize: 13.5, fontWeight: 600, letterSpacing: '-0.01em', color: '#0A0A0A', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      {member.user.name}
                      {member.role === 'LEADER' && (
                        <span style={{ fontSize: 9.5, padding: '2px 6px', borderRadius: 4, background: '#0A0A0A', color: 'oklch(0.85 0.17 130)', fontFamily: 'JetBrains Mono, monospace', fontWeight: 600, letterSpacing: '0.05em' }}>
                          LEAD
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 11.5, color: '#9B9B9B', marginTop: 2 }}>{member.user.email}</div>
                  </div>
                  <div style={{ fontSize: 12.5, color: '#2A2A2A' }}>
                    <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#9B9B9B', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>
                      {isRtl ? 'الدور' : 'Role'}
                    </div>
                    {member.role === 'LEADER' ? (isRtl ? 'قائد الفريق' : 'Team Leader') : (isRtl ? 'عضو' : 'Member')}
                  </div>
                  <div>
                    <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 100, fontWeight: 600, letterSpacing: '0.02em', display: 'inline-flex', alignItems: 'center', gap: 5, background: 'oklch(0.93 0.09 130)', color: '#0A0A0A', border: '1px solid oklch(0.85 0.17 130 / 0.4)' }}>
                      <MemberDot />
                      {isRtl ? 'نشط' : 'Active'}
                    </span>
                  </div>
                  <div>
                    {member.role !== 'LEADER' && !team.isLocked && (
                      <button
                        onClick={() => handleRemoveMember(member.user.id)}
                        title={isRtl ? 'إزالة العضو' : 'Remove member'}
                        style={{ width: 32, height: 32, borderRadius: 8, background: 'none', border: '1px solid rgba(10,10,10,0.08)', cursor: 'pointer', color: '#9B9B9B', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
                        onMouseEnter={e => { (e.currentTarget).style.background = '#FFF5F5'; (e.currentTarget).style.borderColor = '#FECACA'; (e.currentTarget).style.color = '#DC2626'; }}
                        onMouseLeave={e => { (e.currentTarget).style.background = 'none'; (e.currentTarget).style.borderColor = 'rgba(10,10,10,0.08)'; (e.currentTarget).style.color = '#9B9B9B'; }}
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                          <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {/* Pending invite rows */}
              {pendingInvites.map(invite => (
                <div
                  key={invite.id}
                  style={{ display: 'grid', gridTemplateColumns: '44px 1fr 1fr 110px 36px', gap: 14, alignItems: 'center', padding: '14px 0', borderBottom: '1px solid rgba(10,10,10,0.08)' }}
                >
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: '#F5F5F0', border: '1px dashed rgba(10,10,10,0.14)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: '#9B9B9B' }}>
                    {invite.email.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontSize: 13.5, fontWeight: 500, color: '#2A2A2A' }}>{invite.email}</div>
                    <div style={{ fontSize: 11.5, color: '#9B9B9B', marginTop: 2 }}>{isRtl ? 'تمت الدعوة' : '· invited'}</div>
                  </div>
                  <div style={{ fontSize: 12.5, color: '#9B9B9B' }}>—</div>
                  <div>
                    <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 100, fontWeight: 600, letterSpacing: '0.02em', display: 'inline-flex', alignItems: 'center', gap: 5, background: '#FFF3E0', color: '#E65100', border: '1px solid #FFE0B2' }}>
                      <MemberDot color="#FB8C00" />
                      {isRtl ? 'معلق' : 'Pending'}
                    </span>
                  </div>
                  <div />
                </div>
              ))}

              {/* Invite slot */}
              {!team.isLocked && team.members.length < maxSize && (
                <div style={{ display: 'grid', gridTemplateColumns: '44px 1fr 120px', gap: 14, alignItems: 'center', padding: '12px 14px', border: '1.5px dashed rgba(10,10,10,0.14)', borderRadius: 12, marginTop: 10, background: '#FCFCFA', transition: 'all 0.2s', cursor: 'default' }}
                  onMouseEnter={e => { (e.currentTarget).style.borderColor = '#0A0A0A'; (e.currentTarget).style.background = '#fff'; }}
                  onMouseLeave={e => { (e.currentTarget).style.borderColor = 'rgba(10,10,10,0.14)'; (e.currentTarget).style.background = '#FCFCFA'; }}
                >
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: '#F5F5F0', border: '1px dashed rgba(10,10,10,0.14)', color: '#9B9B9B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: '#2A2A2A' }}>{isRtl ? 'دعوة عبر البريد أو المعرّف' : 'Invite by email or @handle'}</div>
                    <div style={{ fontSize: 11.5, color: '#9B9B9B', marginTop: 2 }}>
                      {maxSize - team.members.length} {isRtl ? 'مقاعد متاحة' : 'slots remaining'}
                    </div>
                  </div>
                  <span style={{ fontSize: 11.5, color: '#6B6B6B', fontFamily: 'JetBrains Mono, monospace' }}>
                    {isRtl ? 'استخدم بطاقة الدعوة ←' : '→ Use invite card'}
                  </span>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* ── RIGHT SIDEBAR ────────────────────────────────────────────── */}
        <aside>

          {/* Quick actions */}
          <div style={sideCardStyle}>
            <h4 style={sideCardTitleStyle}>
              {isRtl ? 'إجراءات سريعة' : 'Quick actions'}
              <span style={{ flex: 1, height: 1, background: 'rgba(10,10,10,0.08)' }} />
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <Link href={`/submissions/create?teamId=${team.id}`} style={{ textDecoration: 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, fontSize: 13, color: '#fff', transition: 'all 0.2s', background: '#0A0A0A', cursor: 'pointer' }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="oklch(0.85 0.17 130)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><path d="M14 2v6h6" /><path d="M9 15l2 2 4-4" /></svg>
                  <span style={{ flex: 1 }}>{isRtl ? 'تقديم المشروع' : 'Submit project'}</span>
                  <span style={{ color: 'oklch(0.85 0.17 130)' }}>→</span>
                </div>
              </Link>
              <Link href={`/events/${team.event.id}`} style={{ textDecoration: 'none' }}>
                <div
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, fontSize: 13, color: '#2A2A2A', cursor: 'pointer', transition: 'all 0.2s', border: '1px solid transparent' }}
                  onMouseEnter={e => { (e.currentTarget).style.background = '#F5F5F0'; (e.currentTarget).style.color = '#0A0A0A'; }}
                  onMouseLeave={e => { (e.currentTarget).style.background = 'none'; (e.currentTarget).style.color = '#2A2A2A'; }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9B9B9B" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>
                  <span style={{ flex: 1 }}>{isRtl ? 'صفحة الفعالية' : 'View event page'}</span>
                  <span style={{ color: '#9B9B9B' }}>→</span>
                </div>
              </Link>
            </div>
          </div>

          {/* Invite member card */}
          {!team.isLocked && (
            <div style={sideCardStyle}>
              <h4 style={sideCardTitleStyle}>
                {isRtl ? 'دعوة عضو' : 'Invite member'}
                <span style={{ flex: 1, height: 1, background: 'rgba(10,10,10,0.08)' }} />
              </h4>
              <p style={{ fontSize: 12.5, color: '#9B9B9B', marginBottom: 12 }}>
                {isRtl ? 'ابحث عن مستخدم أو أدخل بريد إلكتروني' : 'Search a user or enter any email address.'}
              </p>

              {/* Search input */}
              <div ref={searchRef} style={{ position: 'relative', marginBottom: 10 }}>
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', left: isRtl ? 'auto' : 10, right: isRtl ? 10 : 'auto', top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', pointerEvents: 'none' }}>
                    {isSearching ? (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9B9B9B" strokeWidth="2" strokeLinecap="round" style={{ animation: 'spin 1s linear infinite' }}>
                        <path d="M21 12a9 9 0 11-3-6.7L21 8" />
                      </svg>
                    ) : (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9B9B9B" strokeWidth="2" strokeLinecap="round">
                        <circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" />
                      </svg>
                    )}
                  </div>
                  <input
                    type="text"
                    placeholder={isRtl ? 'اسم أو بريد إلكتروني...' : 'Name or email...'}
                    value={searchQuery}
                    onChange={e => {
                      setSearchQuery(e.target.value);
                      if (selectedUser && e.target.value !== selectedUser.email) setSelectedUser(null);
                    }}
                    onFocus={() => searchResults.length > 0 && setShowDropdown(true)}
                    style={{ width: '100%', padding: '9px 36px', border: '1px solid rgba(10,10,10,0.14)', borderRadius: 10, fontSize: 13.5, background: '#FAFAF9', fontFamily: 'inherit', color: '#0A0A0A', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s' }}
                    onFocusCapture={e => (e.target as HTMLInputElement).style.borderColor = '#0A0A0A'}
                    onBlurCapture={e => (e.target as HTMLInputElement).style.borderColor = 'rgba(10,10,10,0.14)'}
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={handleClearSelection}
                      style={{ position: 'absolute', right: isRtl ? 'auto' : 10, left: isRtl ? 10 : 'auto', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9B9B9B', padding: 0, display: 'flex', lineHeight: 1 }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
                    </button>
                  )}
                </div>

                {/* Dropdown */}
                {showDropdown && searchResults.length > 0 && (
                  <div style={{ position: 'absolute', zIndex: 50, width: '100%', marginTop: 4, background: '#fff', border: '1px solid rgba(10,10,10,0.14)', borderRadius: 12, boxShadow: '0 8px 24px -8px rgba(10,10,10,0.2)', overflow: 'hidden' }}>
                    {searchResults.map(user => {
                      const isMember = isAlreadyMember(user.email);
                      const isInvited = isAlreadyInvited(user.email);
                      return (
                        <button
                          key={user.id}
                          type="button"
                          onClick={() => !isMember && !isInvited && handleSelectUser(user)}
                          disabled={isMember || isInvited}
                          style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', textAlign: 'left', background: isMember || isInvited ? '#FCFCFA' : 'transparent', cursor: isMember || isInvited ? 'not-allowed' : 'pointer', border: 'none', borderBottom: '1px solid rgba(10,10,10,0.06)', transition: 'background 0.15s', opacity: isMember || isInvited ? 0.6 : 1, fontFamily: 'inherit' }}
                          onMouseEnter={e => { if (!isMember && !isInvited) (e.currentTarget).style.background = '#F5F5F0'; }}
                          onMouseLeave={e => { (e.currentTarget).style.background = isMember || isInvited ? '#FCFCFA' : 'transparent'; }}
                        >
                          <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg, oklch(0.85 0.17 130), oklch(0.68 0.19 130))', color: '#0A0A0A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                            <p style={{ fontSize: 13, fontWeight: 600, color: '#0A0A0A', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name}</p>
                            <p style={{ fontSize: 11.5, color: '#9B9B9B', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</p>
                          </div>
                          <div style={{ flexShrink: 0, fontSize: 11, fontFamily: 'JetBrains Mono, monospace', fontWeight: 600 }}>
                            {isMember ? <span style={{ color: 'oklch(0.68 0.19 130)' }}>Member</span> : isInvited ? <span style={{ color: '#FB8C00' }}>Invited</span> : (
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="oklch(0.68 0.19 130)" strokeWidth="2" strokeLinecap="round">
                                <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 11l-4 4-2-2" />
                              </svg>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}

                {showDropdown && searchDone && searchResults.length === 0 && debouncedQuery.length >= 2 && (
                  <div style={{ position: 'absolute', zIndex: 50, width: '100%', marginTop: 4, background: '#fff', border: '1px solid rgba(10,10,10,0.14)', borderRadius: 12, boxShadow: '0 8px 24px -8px rgba(10,10,10,0.2)', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#9B9B9B' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 18h-6M19 15v6" /></svg>
                    {isRtl ? 'لا يوجد مستخدم بهذا الاسم أو البريد' : 'No registered user found'}
                  </div>
                )}
              </div>

              {/* Selected user */}
              {selectedUser && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: 'oklch(0.93 0.09 130)', border: '1px solid oklch(0.85 0.17 130 / 0.4)', borderRadius: 10, marginBottom: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, oklch(0.85 0.17 130), oklch(0.68 0.19 130))', color: '#0A0A0A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, flexShrink: 0 }}>
                    {selectedUser.name.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#0A0A0A', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selectedUser.name}</p>
                    <p style={{ fontSize: 11.5, color: '#6B6B6B', margin: 0 }}>{selectedUser.email}</p>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="oklch(0.68 0.19 130)" strokeWidth="2.2" strokeLinecap="round">
                    <path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                </div>
              )}

              {/* Feedback */}
              {alreadyMember && (
                <p style={{ fontSize: 12, color: '#DC2626', marginBottom: 8 }}>{isRtl ? 'هذا المستخدم عضو في الفريق بالفعل' : 'This user is already a team member'}</p>
              )}
              {alreadyInvited && !alreadyMember && (
                <p style={{ fontSize: 12, color: '#D97706', marginBottom: 8 }}>{isRtl ? 'تمت الدعوة مسبقاً' : 'An invite was already sent to this email'}</p>
              )}
              {!selectedUser && emailIsValid && searchDone && !searchResults.some(u => u.email.toLowerCase() === searchQuery.toLowerCase()) && !alreadyMember && !alreadyInvited && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: '#D97706', background: '#FFFBEB', border: '1px solid #FDE68A', padding: '8px 10px', borderRadius: 8, marginBottom: 8 }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" /></svg>
                  {isRtl ? 'غير مسجل — سيتم الإخطار عند التسجيل' : 'Not registered yet — invite will wait for them'}
                </div>
              )}

              <button
                onClick={handleInvite}
                disabled={isInviting || !canSendInvite}
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '10px 16px', borderRadius: 10, background: canSendInvite && !isInviting ? '#0A0A0A' : '#F5F5F0', color: canSendInvite && !isInviting ? '#fff' : '#9B9B9B', border: 'none', fontSize: 13.5, fontWeight: 500, cursor: isInviting || !canSendInvite ? 'not-allowed' : 'pointer', fontFamily: 'inherit', transition: 'all 0.2s' }}
              >
                {isInviting ? (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ animation: 'spin 1s linear infinite' }}>
                      <path d="M21 12a9 9 0 11-3-6.7L21 8" />
                    </svg>
                    {isRtl ? 'جاري الإرسال...' : 'Sending…'}
                  </>
                ) : (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
                    </svg>
                    {isRtl ? 'إرسال الدعوة' : t('sendInvite')}
                  </>
                )}
              </button>
            </div>
          )}

          {/* Team meta (dark card) */}
          <div style={{ background: '#0A0A0A', color: '#fff', borderRadius: 16, padding: '20px 22px', marginBottom: 14, position: 'relative', overflow: 'hidden' }}>
            {/* Glow decoration */}
            <div style={{ position: 'absolute', top: -100, right: -100, width: 240, height: 240, background: 'radial-gradient(circle, oklch(0.68 0.19 130 / 0.3), transparent 70%)', pointerEvents: 'none' }} />
            <div style={{ position: 'relative', zIndex: 1 }}>
              <h4 style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: 'oklch(0.85 0.17 130)', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600, marginBottom: 14 }}>
                {isRtl ? 'بيانات الفريق' : 'Team meta'}
              </h4>
              {[
                { label: isRtl ? 'الفعالية' : 'EVENT', value: team.event.name },
                { label: isRtl ? 'الأعضاء' : 'MEMBERS', value: `${team.members.length} / ${maxSize}` },
                { label: isRtl ? 'الحالة' : 'STATUS', value: team.isLocked ? (isRtl ? 'مقفل' : 'Locked') : (isRtl ? 'نشط' : 'Active') },
                { label: isRtl ? 'الدعوات' : 'INVITES', value: `${pendingInvites.length} pending` },
              ].map(({ label, value }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', fontSize: 12.5, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                  <span style={{ color: 'rgba(255,255,255,0.5)', fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }}>{label}</span>
                  <span style={{ fontWeight: 500, letterSpacing: '-0.005em', textAlign: 'right', color: '#fff' }}>{value}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 900px) {
          .team-layout { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
