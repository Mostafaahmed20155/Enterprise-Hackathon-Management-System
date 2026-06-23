'use client';

import { useEffect, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Link } from '@/i18n/routing';
import { usersApi, teamsApi } from '@/lib/api';
import { toast } from 'sonner';

interface Team {
  id: string;
  name: string;
  description: string;
  event: { id: string; name: string };
  members: Array<{ id: string; user: { id: string; name: string; email: string }; role: string }>;
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

const LOGO_STYLES = [
  { background: 'linear-gradient(135deg, oklch(0.85 0.17 130), oklch(0.68 0.19 130))', color: '#0A0A0A' },
  { background: '#0A0A0A', color: 'oklch(0.85 0.17 130)' },
  { background: 'linear-gradient(135deg, #FFE4C9, #FFD1A3)', color: '#7A3D00' },
  { background: 'linear-gradient(135deg, #E3F1FF, #C6E3FF)', color: '#0A3D73' },
  { background: 'linear-gradient(135deg, #FFDDE4, #FFBBC8)', color: '#8A1E36' },
  { background: 'linear-gradient(135deg, #E9EBED, #D0D3D7)', color: '#333' },
];

const AV_COLORS = ['#7A3D00', '#0A3D73', '#2A2A2A', '#8A1E36', '#4D5A35'];

type FilterType = 'all' | 'locked' | 'open';

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function LockIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 118 0v4" />
    </svg>
  );
}

function SearchIcon({ color = '#9B9B9B' }: { color?: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round">
      <circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" />
    </svg>
  );
}

function TeamsIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="oklch(0.68 0.19 130)" strokeWidth="1.8" strokeLinecap="round">
      <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 00-3-3.87" />
    </svg>
  );
}

function CrownIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="#6B6B6B">
      <path d="M5 16l-2-9 6 4 3-7 3 7 6-4-2 9H5z" />
    </svg>
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
  const [filter, setFilter] = useState<FilterType>('all');

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
      const errorMsg = typeof errorMessage === 'object'
        ? (errorMessage[locale] || errorMessage.en || 'Failed to respond')
        : (errorMessage || 'Failed to respond');
      toast.error(errorMsg);
    } finally {
      setRespondingId(null);
    }
  };

  const filtered = teams.filter(team => {
    const q = search.toLowerCase();
    const matchesSearch = !q || (
      team.name.toLowerCase().includes(q) ||
      team.event.name.toLowerCase().includes(q) ||
      team.members.some(m => m.user.name.toLowerCase().includes(q))
    );
    const matchesFilter =
      filter === 'locked' ? team.isLocked :
      filter === 'open' ? !team.isLocked : true;
    return matchesSearch && matchesFilter;
  });

  if (isLoading) {
    return (
      <div style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 20, marginBottom: 22 }}>
          <div>
            <div style={{ height: 38, width: 200, background: 'linear-gradient(90deg, #F0F0EC 0%, #F8F8F4 50%, #F0F0EC 100%)', backgroundSize: '200% 100%', borderRadius: 8, animation: 'shimmer 1.4s infinite', marginBottom: 10 }} />
            <div style={{ height: 16, width: 340, background: 'linear-gradient(90deg, #F0F0EC 0%, #F8F8F4 50%, #F0F0EC 100%)', backgroundSize: '200% 100%', borderRadius: 6, animation: 'shimmer 1.4s infinite' }} />
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {[0, 1, 2, 3, 4, 5].map(i => (
            <div key={i} style={{ background: '#fff', border: '1px solid rgba(10,10,10,0.08)', borderRadius: 16, padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(90deg, #F0F0EC 0%, #F8F8F4 50%, #F0F0EC 100%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ height: 16, width: '55%', background: 'linear-gradient(90deg, #F0F0EC 0%, #F8F8F4 50%, #F0F0EC 100%)', backgroundSize: '200% 100%', borderRadius: 6, animation: 'shimmer 1.4s infinite', marginBottom: 8 }} />
                  <div style={{ height: 11, width: '35%', background: 'linear-gradient(90deg, #F0F0EC 0%, #F8F8F4 50%, #F0F0EC 100%)', backgroundSize: '200% 100%', borderRadius: 6, animation: 'shimmer 1.4s infinite' }} />
                </div>
              </div>
              <div style={{ height: 14, background: 'linear-gradient(90deg, #F0F0EC 0%, #F8F8F4 50%, #F0F0EC 100%)', backgroundSize: '200% 100%', borderRadius: 6, animation: 'shimmer 1.4s infinite' }} />
              <div style={{ height: 14, width: '70%', background: 'linear-gradient(90deg, #F0F0EC 0%, #F8F8F4 50%, #F0F0EC 100%)', backgroundSize: '200% 100%', borderRadius: 6, animation: 'shimmer 1.4s infinite' }} />
              <div style={{ paddingTop: 14, borderTop: '1px dashed rgba(10,10,10,0.14)', display: 'flex', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', gap: -6 }}>
                  {[0, 1, 2].map(j => (
                    <div key={j} style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(90deg, #F0F0EC 0%, #F8F8F4 50%, #F0F0EC 100%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite', marginLeft: j > 0 ? -6 : 0, border: '2px solid #FAFAF7' }} />
                  ))}
                </div>
                <div style={{ height: 12, width: 100, background: 'linear-gradient(90deg, #F0F0EC 0%, #F8F8F4 50%, #F0F0EC 100%)', backgroundSize: '200% 100%', borderRadius: 6, animation: 'shimmer 1.4s infinite' }} />
              </div>
            </div>
          ))}
        </div>
        <style>{`@keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }`}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ fontFamily: 'Inter, system-ui, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
        <div style={{ background: '#fff', border: '1px solid rgba(10,10,10,0.08)', borderRadius: 18, padding: '48px 40px', textAlign: 'center', maxWidth: 400 }}>
          <div style={{ width: 64, height: 64, borderRadius: 18, background: 'oklch(0.95 0.05 25)', border: '1px solid oklch(0.88 0.06 25)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="oklch(0.62 0.22 25)" strokeWidth="1.8" strokeLinecap="round">
              <circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" />
            </svg>
          </div>
          <h3 style={{ fontSize: 18, fontWeight: 600, letterSpacing: '-0.02em', color: '#0A0A0A', marginBottom: 8 }}>Couldn't load teams</h3>
          <p style={{ fontSize: 13.5, color: '#6B6B6B', marginBottom: 20, lineHeight: 1.5 }}>{error}</p>
          <button
            onClick={loadTeams}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '9px 16px', borderRadius: 10, background: '#0A0A0A', color: '#fff', border: 'none', fontSize: 13.5, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <path d="M21 12a9 9 0 11-3-6.7L21 8" /><path d="M21 3v5h-5" />
            </svg>
            Retry
          </button>
        </div>
      </div>
    );
  }

  const isRtl = locale === 'ar';

  return (
    <div style={{ fontFamily: 'Inter, system-ui, sans-serif', WebkitFontSmoothing: 'antialiased', direction: isRtl ? 'rtl' : 'ltr' }}>

      {/* ── Page Header ─────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 20, marginBottom: 22, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 32, letterSpacing: '-0.03em', fontWeight: 600, lineHeight: 1.05, color: '#0A0A0A' }}>
            {isRtl ? (
              <>فرقي <span style={{ fontFamily: "var(--font-serif, 'Instrument Serif', Georgia, serif)", fontStyle: 'italic', color: '#2A2A2A', fontWeight: 400 }}>المتسابقة.</span></>
            ) : (
              <>My <span style={{ fontFamily: "var(--font-serif, 'Instrument Serif', Georgia, serif)", fontStyle: 'italic', color: '#2A2A2A', fontWeight: 400 }}>teams.</span></>
            )}
          </h1>
          <p style={{ color: '#6B6B6B', fontSize: 14, marginTop: 6, maxWidth: 560 }}>
            {isRtl ? 'جميع الفرق التي تنتمي إليها — تعاون وابنِ وأطلق معاً.' : 'All teams you belong to. Collaborate, build, and ship together.'}
          </p>
        </div>
      </div>

      {/* ── Pending Invites ──────────────────────────────────────────── */}
      {invites.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <span style={{ fontFamily: 'JetBrains Mono, Fira Code, monospace', fontSize: 10.5, color: '#9B9B9B', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600 }}>
              {isRtl ? 'دعوات معلقة' : 'Pending invites'}
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minWidth: 20, height: 20, padding: '0 5px', borderRadius: 10, background: 'oklch(0.68 0.19 130)', color: '#fff', fontSize: 10, fontWeight: 700 }}>
              {invites.length}
            </span>
            <div style={{ flex: 1, height: 1, background: 'rgba(10,10,10,0.08)' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {invites.map(invite => (
              <div
                key={invite.id}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, padding: '14px 18px', background: '#fff', border: '1px solid rgba(10,10,10,0.08)', borderRadius: 14, flexWrap: 'wrap' }}
              >
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <div style={{ width: 42, height: 42, borderRadius: 11, background: 'linear-gradient(135deg, oklch(0.85 0.17 130), oklch(0.68 0.19 130))', color: '#0A0A0A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 16, flexShrink: 0 }}>
                    {invite.team.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em', color: '#0A0A0A' }}>{invite.team.name}</div>
                    <div style={{ fontSize: 12, color: '#6B6B6B', marginTop: 2 }}>
                      {invite.team.event.name} · {isRtl ? 'من' : 'by'} {invite.team.leader.name} · {invite.team._count.members} {isRtl ? 'أعضاء' : 'members'}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  <button
                    onClick={() => handleRespond(invite.id, true)}
                    disabled={respondingId === invite.id}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 9, background: '#0A0A0A', color: 'oklch(0.85 0.17 130)', border: 'none', fontSize: 13, fontWeight: 600, cursor: respondingId === invite.id ? 'not-allowed' : 'pointer', opacity: respondingId === invite.id ? 0.6 : 1, fontFamily: 'inherit', transition: 'opacity 0.2s' }}
                  >
                    {isRtl ? 'قبول' : 'Accept'}
                  </button>
                  <button
                    onClick={() => handleRespond(invite.id, false)}
                    disabled={respondingId === invite.id}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 9, background: '#fff', color: '#2A2A2A', border: '1px solid rgba(10,10,10,0.14)', fontSize: 13, fontWeight: 500, cursor: respondingId === invite.id ? 'not-allowed' : 'pointer', opacity: respondingId === invite.id ? 0.6 : 1, fontFamily: 'inherit', transition: 'opacity 0.2s' }}
                  >
                    {isRtl ? 'رفض' : 'Decline'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Toolbar ──────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 18, flexWrap: 'wrap' }}>

        {/* Search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', background: '#fff', border: '1px solid rgba(10,10,10,0.14)', borderRadius: 10, width: 320, maxWidth: '100%', boxSizing: 'border-box' }}>
          <SearchIcon />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={isRtl ? 'البحث في الفرق...' : 'Search teams by name or member…'}
            style={{ border: 'none', outline: 'none', flex: 1, fontSize: 13.5, background: 'transparent', fontFamily: 'inherit', color: '#0A0A0A' }}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9B9B9B', padding: 0, display: 'flex', lineHeight: 1, fontSize: 12 }}
            >
              ✕
            </button>
          )}
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10.5, color: '#9B9B9B', padding: '2px 6px', border: '1px solid rgba(10,10,10,0.08)', borderRadius: 5, background: '#FCFCFA', flexShrink: 0 }}>
            {isRtl ? 'بحث' : '⌘K'}
          </span>
        </div>

        {/* Filter chips */}
        <div style={{ display: 'flex', gap: 8 }}>
          {([
            { key: 'all' as FilterType, label: isRtl ? 'الكل' : 'All', count: teams.length },
            { key: 'open' as FilterType, label: isRtl ? 'مفتوح' : 'Open', count: teams.filter(t => !t.isLocked).length },
            { key: 'locked' as FilterType, label: isRtl ? 'مقفل' : 'Locked', count: teams.filter(t => t.isLocked).length },
          ]).map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              style={{ padding: '8px 12px', background: filter === key ? '#0A0A0A' : '#fff', border: `1px solid ${filter === key ? '#0A0A0A' : 'rgba(10,10,10,0.08)'}`, borderRadius: 9, fontSize: 12.5, color: filter === key ? '#fff' : '#2A2A2A', display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'inherit' }}
            >
              {label}
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10.5, opacity: 0.7 }}>{count}</span>
            </button>
          ))}
        </div>

        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: '#6B6B6B', padding: '0 4px' }}>
          {filtered.length} {filtered.length === 1 ? (isRtl ? 'فريق' : 'team') : (isRtl ? 'فرق' : 'teams')}
        </div>
      </div>

      {/* ── Content ──────────────────────────────────────────────────── */}
      {teams.length === 0 ? (

        /* Empty state */
        <div style={{ background: '#fff', border: '1px solid rgba(10,10,10,0.08)', borderRadius: 18, padding: '60px 40px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 72, height: 72, borderRadius: 18, background: 'oklch(0.93 0.09 130)', border: '1px solid oklch(0.85 0.17 130 / 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
            <TeamsIcon />
          </div>
          <h3 style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em', color: '#0A0A0A' }}>{t('noTeams')}</h3>
          <p style={{ fontSize: 14, color: '#6B6B6B', maxWidth: 440, lineHeight: 1.55 }}>
            {isRtl
              ? 'تصفح الفعاليات المتاحة وانضم إلى فريق — أو ابدأ فريقك الخاص ودعِ زملاءك.'
              : 'Browse open events and join a team — or create your own and invite up to 4 teammates.'}
          </p>
          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <Link href="/events">
              <button style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 18px', borderRadius: 10, background: 'oklch(0.85 0.17 130)', color: '#0A0A0A', border: 'none', fontSize: 13.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                {t('browseEvents')} →
              </button>
            </Link>
          </div>
        </div>

      ) : filtered.length === 0 ? (

        /* No results */
        <div style={{ background: '#fff', border: '1px solid rgba(10,10,10,0.08)', borderRadius: 18, padding: '40px 24px', textAlign: 'center' }}>
          <p style={{ color: '#6B6B6B', fontSize: 14 }}>
            {isRtl ? `لا توجد نتائج لـ "${search}"` : `No results for "${search}"`}
          </p>
          <button
            onClick={() => setSearch('')}
            style={{ marginTop: 10, color: 'oklch(0.68 0.19 130)', fontSize: 13, fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
          >
            {isRtl ? 'مسح البحث' : 'Clear search'}
          </button>
        </div>

      ) : (

        /* Card grid */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {filtered.map((team, idx) => {
            const leader = team.members.find(m => m.role === 'LEADER');
            const ls = LOGO_STYLES[idx % LOGO_STYLES.length];
            return (
              <Link href={`/teams/${team.id}`} key={team.id} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
                <article
                  style={{ background: '#fff', border: '1px solid rgba(10,10,10,0.08)', borderRadius: 16, padding: 20, display: 'flex', flexDirection: 'column', gap: 14, cursor: 'pointer', transition: 'all 0.2s', height: '100%', boxSizing: 'border-box' }}
                  onMouseEnter={e => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.borderColor = 'rgba(10,10,10,0.14)';
                    el.style.boxShadow = '0 10px 30px -15px rgba(10,10,10,0.15)';
                    el.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={e => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.borderColor = 'rgba(10,10,10,0.08)';
                    el.style.boxShadow = 'none';
                    el.style.transform = 'translateY(0)';
                  }}
                >
                  {/* Card top */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                      <div style={{ width: 44, height: 44, borderRadius: 12, background: ls.background, color: ls.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 15, letterSpacing: '-0.02em', flexShrink: 0 }}>
                        {getInitials(team.name)}
                      </div>
                      <div>
                        <div style={{ fontSize: 16.5, fontWeight: 600, letterSpacing: '-0.015em', color: '#0A0A0A' }}>{team.name}</div>
                        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11.5, color: '#6B6B6B', marginTop: 2 }}>
                          {team.members.length} {team.members.length === 1 ? (isRtl ? 'عضو' : 'member') : (isRtl ? 'أعضاء' : 'members')}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end', flexShrink: 0 }}>
                      {team.isLocked ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 9px', borderRadius: 100, background: '#0A0A0A', color: '#fff', fontFamily: 'JetBrains Mono, monospace', fontSize: 10, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                          <LockIcon /> {isRtl ? 'مقفل' : 'Locked'}
                        </span>
                      ) : (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 9px', borderRadius: 100, background: 'oklch(0.93 0.09 130)', color: '#0A0A0A', border: '1px solid oklch(0.85 0.17 130 / 0.3)', fontFamily: 'JetBrains Mono, monospace', fontSize: 10, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                          {isRtl ? 'مفتوح' : 'Open'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Description */}
                  <p className="line-clamp-3" style={{ fontSize: 13.5, color: '#2A2A2A', lineHeight: 1.55, flex: 1 }}>
                    {team.description || `${isRtl ? 'فريق يشارك في' : 'A team competing in'} ${team.event.name}.`}
                  </p>

                  {/* Event tag */}
                  <div style={{ alignSelf: 'flex-start' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 100, background: '#F5F5F0', color: '#2A2A2A', fontSize: 11.5, fontWeight: 500 }}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                        <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
                      </svg>
                      {team.event.name}
                    </span>
                  </div>

                  {/* Member avatars + leader */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 14, borderTop: '1px dashed rgba(10,10,10,0.14)' }}>
                    <div style={{ display: 'flex' }}>
                      {team.members.slice(0, 5).map((member, mi) => (
                        <div
                          key={member.id}
                          title={member.user.name}
                          style={{ width: 28, height: 28, borderRadius: '50%', background: member.role === 'LEADER' ? AV_COLORS[0] : AV_COLORS[mi % AV_COLORS.length], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10.5, fontWeight: 700, color: '#fff', marginLeft: mi > 0 ? -6 : 0, border: '2px solid #fff', position: 'relative', zIndex: 5 - mi }}
                        >
                          {member.user.name.charAt(0).toUpperCase()}
                          {member.role === 'LEADER' && (
                            <span style={{ position: 'absolute', top: -3, right: -3, width: 12, height: 12, borderRadius: '50%', background: 'oklch(0.85 0.17 130)', border: '1.5px solid #fff', boxShadow: '0 0 0 1px oklch(0.68 0.19 130)' }} />
                          )}
                        </div>
                      ))}
                      {team.members.length > 5 && (
                        <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#F5F5F0', color: '#6B6B6B', border: '2px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 600, marginLeft: -6 }}>
                          +{team.members.length - 5}
                        </div>
                      )}
                    </div>
                    {leader && (
                      <div style={{ fontSize: 12, color: '#6B6B6B', display: 'flex', alignItems: 'center', gap: 5 }}>
                        <CrownIcon />
                        {isRtl ? 'القائد' : 'Leader'} ·{' '}
                        <strong style={{ color: '#0A0A0A', fontWeight: 600 }}>{leader.user.name.split(' ')[0]}</strong>
                      </div>
                    )}
                  </div>
                </article>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
