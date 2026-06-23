'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Link, useRouter } from '@/i18n/routing';
import { getApiErrorMessage } from '@/lib/api-error-message';

type Role = 'Organizer' | 'Participant' | 'Judge';

function getStrength(pw: string): number {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return score;
}

const STRENGTH_LABELS = ['Too short', 'Weak', 'Okay', 'Good', 'Strong'];
const STRENGTH_COLORS = ['', '#E57373', '#FFB74D', 'oklch(0.85 0.17 130)', 'oklch(0.68 0.19 130)'];

export default function RegisterPage() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<Role>('Participant');

  const strength = getStrength(password);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    const firstName = (formData.get('firstName') as string || '').trim();
    const lastName  = (formData.get('lastName')  as string || '').trim();
    const name      = `${firstName} ${lastName}`.trim();
    const email     = formData.get('email') as string;
    const pw        = formData.get('password') as string;
    const confirmPw = formData.get('confirmPassword') as string;

    if (pw !== confirmPw) {
      setError(t('auth.passwordsDoNotMatch'));
      setLoading(false);
      return;
    }

    const apiBase = process.env.NEXT_PUBLIC_API_URL;
    if (!apiBase) {
      setError(
        locale === 'ar'
          ? 'عنوان واجهة البرمجة غير مضبوط (NEXT_PUBLIC_API_URL).'
          : 'API URL is not set. Add NEXT_PUBLIC_API_URL to apps/web/.env and restart the dev server.',
      );
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${apiBase}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept-Language': locale },
        credentials: 'include',
        body: JSON.stringify({ name, email, password: pw, preferredLocale: locale }),
      });

      if (!response.ok) {
        let data: unknown;
        try { data = await response.json(); } catch { data = null; }
        throw new Error(getApiErrorMessage(data, locale, t('auth.registrationFailed')));
      }

      const data = await response.json();
      if (data.accessToken) localStorage.setItem('accessToken', data.accessToken);
      if (data.refreshToken) localStorage.setItem('refreshToken', data.refreshToken);
      localStorage.setItem('locale', locale);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || t('auth.registrationFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Instrument+Serif:ital@1&family=JetBrains+Mono:wght@400;500&display=swap');
        @keyframes rgSpin { to { transform: rotate(360deg); } }

        .rg-wrap { display:grid; grid-template-columns:1fr 1fr; min-height:100vh; font-family:'Inter',system-ui,sans-serif; -webkit-font-smoothing:antialiased; color:#0A0A0A; }

        /* LEFT – visual */
        .rg-left {
          position:relative; overflow:hidden;
          background:
            radial-gradient(70% 55% at 30% 30%, oklch(0.85 0.17 130 / 0.55), transparent 70%),
            radial-gradient(90% 70% at 70% 90%, oklch(0.68 0.19 130 / 0.22), transparent 75%),
            #F5F5F0;
          display:flex; flex-direction:column; padding:32px 40px; justify-content:space-between;
        }
        .rg-left::before {
          content:""; position:absolute; inset:0;
          background-image:
            radial-gradient(rgba(10,10,10,0.07) 1px, transparent 1px),
            radial-gradient(rgba(10,10,10,0.04) 1px, transparent 1px);
          background-size:22px 22px, 11px 11px;
          background-position:0 0, 11px 11px;
          -webkit-mask-image:radial-gradient(ellipse 80% 80% at 50% 40%, #000 40%, transparent 85%);
          mask-image:radial-gradient(ellipse 80% 80% at 50% 40%, #000 40%, transparent 85%);
          pointer-events:none; z-index:0;
        }
        .rg-left > * { position:relative; z-index:1; }

        .rg-brand { display:flex; align-items:center; gap:10px; font-weight:700; font-size:17px; letter-spacing:-0.02em; text-decoration:none; color:#0A0A0A; }
        .rg-logo-mark { width:26px; height:26px; border-radius:8px; background:#0A0A0A; position:relative; overflow:hidden; flex-shrink:0; }
        .rg-logo-mark::before { content:""; position:absolute; inset:4px; border-radius:4px; background:oklch(0.85 0.17 130); }
        .rg-logo-mark::after { content:""; position:absolute; left:10px; top:10px; width:6px; height:6px; border-radius:2px; background:#0A0A0A; }

        .rg-pitch { max-width:440px; margin:auto 0; }
        .rg-pitch .tag { font-family:'JetBrains Mono',monospace; font-size:11px; color:#6B6B6B; letter-spacing:0.1em; margin-bottom:14px; display:flex; align-items:center; gap:10px; }
        .rg-pitch .tag::before { content:""; width:22px; height:1px; background:#0A0A0A; }
        .rg-pitch h2 { font-size:38px; letter-spacing:-0.03em; font-weight:600; line-height:1.05; color:#0A0A0A; margin-bottom:10px; }
        .rg-serif { font-family:'Instrument Serif',serif; font-weight:400; font-style:italic; color:#2A2A2A; }
        .rg-pitch > p { color:#6B6B6B; font-size:14.5px; line-height:1.6; max-width:400px; margin:0; }

        .rg-feats { margin-top:28px; display:flex; flex-direction:column; gap:12px; }
        .rg-feat { display:flex; gap:12px; align-items:flex-start; }
        .rg-feat-ico { width:32px; height:32px; border-radius:9px; background:#fff; border:1px solid rgba(10,10,10,0.08); display:flex; align-items:center; justify-content:center; color:#0A0A0A; flex-shrink:0; }
        .rg-feat-ico svg { width:14px; height:14px; }
        .rg-feat .tt { font-size:13.5px; font-weight:600; letter-spacing:-0.01em; }
        .rg-feat .dd { font-size:12.5px; color:#6B6B6B; margin-top:2px; line-height:1.5; max-width:360px; }

        .rg-logos { margin-top:28px; border-top:1px solid rgba(10,10,10,0.08); padding-top:18px; }
        .rg-logos .l { font-size:11px; color:#6B6B6B; font-family:'JetBrains Mono',monospace; letter-spacing:0.1em; margin-bottom:10px; }
        .rg-logos .row { display:flex; gap:22px; align-items:center; flex-wrap:wrap; font-family:'Instrument Serif',serif; font-size:18px; color:#2A2A2A; font-style:italic; }
        .rg-logos .row span { opacity:0.7; }

        .rg-left-foot { font-family:'JetBrains Mono',monospace; font-size:11px; color:#6B6B6B; display:flex; justify-content:space-between; align-items:center; margin-top:18px; }
        .rg-left-dot { width:5px; height:5px; border-radius:50%; background:oklch(0.68 0.19 130); display:inline-block; margin-right:6px; box-shadow:0 0 0 3px oklch(0.68 0.19 130 / 0.15); }

        /* RIGHT – form */
        .rg-right { display:flex; flex-direction:column; padding:32px 40px; background:#FAFAF7; }
        .rg-brand-bar { display:flex; align-items:center; justify-content:space-between; }
        .rg-creating { font-size:13px; color:#6B6B6B; }
        .rg-bb-right { font-size:13px; color:#6B6B6B; display:flex; align-items:center; gap:14px; }
        .rg-ghost { padding:7px 14px; border-radius:8px; border:1px solid rgba(10,10,10,0.14); color:#0A0A0A; font-weight:500; transition:all .2s; background:#fff; text-decoration:none; font-size:13px; }
        .rg-ghost:hover { border-color:#0A0A0A; }

        .rg-form-shell { flex:1; display:flex; align-items:center; justify-content:center; padding:28px 0; }
        .rg-form-box { width:100%; max-width:440px; }

        .rg-step-tag { font-family:'JetBrains Mono',monospace; font-size:11px; color:#6B6B6B; letter-spacing:0.08em; display:flex; align-items:center; gap:10px; margin-bottom:18px; }
        .rg-step-tag::before { content:""; width:24px; height:1px; background:#0A0A0A; }
        .rg-form-box h1 { font-size:36px; letter-spacing:-0.03em; font-weight:600; line-height:1.05; margin:0 0 6px; }
        .rg-sub { color:#6B6B6B; font-size:14px; line-height:1.55; max-width:380px; }

        /* Role picker */
        .rg-role { display:grid; grid-template-columns:1fr 1fr 1fr; gap:6px; margin:22px 0; padding:5px; border:1px solid rgba(10,10,10,0.08); border-radius:12px; background:#FCFCFA; }
        .rg-role-btn { padding:9px 8px; border-radius:8px; font-size:12.5px; font-weight:500; color:#6B6B6B; transition:all .15s; display:flex; align-items:center; justify-content:center; gap:6px; cursor:pointer; background:none; border:none; font-family:inherit; }
        .rg-role-btn svg { width:13px; height:13px; }
        .rg-role-btn:hover { color:#0A0A0A; }
        .rg-role-btn.active { background:#fff; color:#0A0A0A; box-shadow:0 1px 3px rgba(10,10,10,0.08), 0 0 0 1px rgba(10,10,10,0.14); }

        /* SSO 2-col */
        .rg-sso-row { display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:0; }
        .rg-sso-btn { display:flex; align-items:center; justify-content:center; gap:10px; padding:11px 14px; border-radius:10px; background:#fff; border:1px solid rgba(10,10,10,0.14); font-size:13.5px; font-weight:500; color:#0A0A0A; transition:all .2s; cursor:pointer; font-family:inherit; }
        .rg-sso-btn:hover { border-color:#0A0A0A; transform:translateY(-1px); }
        .rg-sso-btn svg { width:15px; height:15px; }

        .rg-divider { display:flex; align-items:center; gap:14px; margin:20px 0; color:#9B9B9B; font-size:11px; letter-spacing:0.1em; text-transform:uppercase; font-family:'JetBrains Mono',monospace; font-weight:600; }
        .rg-divider::before, .rg-divider::after { content:""; flex:1; height:1px; background:rgba(10,10,10,0.08); }

        .rg-two-col { display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:14px; }
        .rg-fld { display:flex; flex-direction:column; margin-bottom:14px; }
        .rg-fld-label { font-size:13px; font-weight:500; color:#0A0A0A; margin-bottom:6px; }
        .rg-inp-wrap { position:relative; }
        .rg-inp-ico { position:absolute; left:12px; top:50%; transform:translateY(-50%); width:15px; height:15px; color:#9B9B9B; pointer-events:none; }
        .rg-inp-eye { position:absolute; right:10px; top:50%; transform:translateY(-50%); width:26px; height:26px; border-radius:6px; color:#6B6B6B; display:inline-flex; align-items:center; justify-content:center; cursor:pointer; background:none; border:none; padding:0; }
        .rg-inp-eye:hover { background:#F5F5F0; color:#0A0A0A; }
        .rg-inp-eye svg { width:14px; height:14px; }
        .rg-inp { width:100%; padding:12px 14px 12px 36px; background:#fff; border:1px solid rgba(10,10,10,0.14); border-radius:10px; font:inherit; font-size:14px; color:#0A0A0A; transition:all .2s; outline:none; box-sizing:border-box; }
        .rg-inp.no-ico { padding-left:14px; }
        .rg-inp:focus { border-color:#0A0A0A; box-shadow:0 0 0 3px rgba(10,10,10,0.05); }
        .rg-inp::placeholder { color:#9B9B9B; }

        /* Password strength */
        .rg-strength { margin-top:8px; display:flex; gap:4px; }
        .rg-seg { flex:1; height:3px; background:#EFEFEA; border-radius:100px; transition:background .25s; }
        .rg-str-label { font-size:11.5px; color:#6B6B6B; margin-top:6px; display:flex; justify-content:space-between; }
        .rg-str-label b { color:#0A0A0A; font-weight:600; }

        /* Terms */
        .rg-check { display:flex; align-items:flex-start; gap:10px; font-size:12.5px; color:#2A2A2A; cursor:pointer; line-height:1.55; margin:8px 0 22px; }
        .rg-check-input { display:none; }
        .rg-check-box { width:16px; height:16px; border-radius:5px; border:1.5px solid rgba(10,10,10,0.14); background:#fff; display:inline-flex; align-items:center; justify-content:center; transition:all .2s; flex-shrink:0; margin-top:1px; }
        .rg-check-box svg { width:10px; height:10px; color:#0A0A0A; opacity:0; transition:opacity .15s; }
        .rg-check-input:checked + .rg-check-box { background:oklch(0.85 0.17 130); border-color:oklch(0.68 0.19 130); }
        .rg-check-input:checked + .rg-check-box svg { opacity:1; }
        .rg-check a { color:#0A0A0A; border-bottom:1px dashed rgba(10,10,10,0.14); padding-bottom:1px; text-decoration:none; }
        .rg-check a:hover { border-color:#0A0A0A; }

        .rg-sub-btn { width:100%; padding:12.5px 16px; border-radius:10px; background:#0A0A0A; color:#FAFAF7; font-weight:600; font-size:14.5px; letter-spacing:-0.01em; display:flex; align-items:center; justify-content:center; gap:10px; transition:all .2s; cursor:pointer; border:none; font-family:inherit; }
        .rg-sub-btn:hover:not(:disabled) { transform:translateY(-1px); box-shadow:0 12px 28px -12px rgba(10,10,10,0.4); background:#000; }
        .rg-sub-btn:disabled { opacity:0.7; cursor:not-allowed; }
        .rg-arr { transition:transform .2s; display:inline-block; }
        .rg-sub-btn:hover:not(:disabled) .rg-arr { transform:translateX(4px); }

        .rg-alt-cta { text-align:center; margin-top:20px; font-size:13.5px; color:#6B6B6B; }
        .rg-alt-cta a { color:#0A0A0A; font-weight:600; border-bottom:1px dashed rgba(10,10,10,0.14); padding-bottom:1px; text-decoration:none; }

        .rg-legal { text-align:center; font-size:11.5px; color:#9B9B9B; margin-top:24px; line-height:1.6; }
        .rg-legal a { color:#6B6B6B; border-bottom:1px dashed rgba(10,10,10,0.14); text-decoration:none; }

        .rg-error { background:#FEF2F2; border:1px solid #FCA5A5; border-radius:10px; padding:12px 14px; margin-bottom:16px; }
        .rg-error p { font-size:13px; color:#B91C1C; line-height:1.5; }

        @media (max-width:960px) {
          .rg-wrap { grid-template-columns:1fr; }
          .rg-left { display:none; }
          .rg-right { padding:24px 20px; }
        }
      `}</style>

      <div className="rg-wrap">

        {/* ── LEFT: Visual ── */}
        <div className="rg-left">
          <Link href="/" className="rg-brand">
            <span className="rg-logo-mark" />
            EHMS
          </Link>

          <div className="rg-pitch">
            <div className="tag">JOIN THE PLATFORM</div>
            <h2>Join the <span className="rg-serif">Innovation</span><br />Community.</h2>
            <p>Create your account and start participating in exciting hackathon events</p>

            <div className="rg-feats">
              <div className="rg-feat">
                <div className="rg-feat-ico">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>
                </div>
                <div>
                  <div className="tt">Quick Setup</div>
                  <div className="dd">Get started in minutes with our streamlined registration</div>
                </div>
              </div>
              <div className="rg-feat">
                <div className="rg-feat-ico">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 00-3-3.87"/></svg>
                </div>
                <div>
                  <div className="tt">Join Teams</div>
                  <div className="dd">Connect with talented individuals and form winning teams</div>
                </div>
              </div>
              <div className="rg-feat">
                <div className="rg-feat-ico">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l3 7h7l-5.5 4 2 7L12 16l-6.5 4 2-7L2 9h7z"/></svg>
                </div>
                <div>
                  <div className="tt">Compete &amp; Win</div>
                  <div className="dd">Showcase your skills and win amazing prizes</div>
                </div>
              </div>
            </div>
          </div>

          <div>
           
          
          </div>
        </div>

        {/* ── RIGHT: Form ── */}
        <div className="rg-right">
        

          <div className="rg-form-shell">
            <div className="rg-form-box">

              <h1>Create your <span className="rg-serif">account.</span></h1>
              <p className="rg-sub">Pick a role to get the right defaults. You can add more roles later.</p>

              {/* Role picker */}
              <div className="rg-role">
                {(['Organizer', 'Participant', 'Judge'] as Role[]).map(role => (
                  <button
                    key={role}
                    type="button"
                    className={`rg-role-btn${selectedRole === role ? ' active' : ''}`}
                    onClick={() => setSelectedRole(role)}
                  >
                    {role === 'Organizer' && <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M8 2v4M16 2v4"/></svg>}
                    {role === 'Participant' && <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>}
                    {role === 'Judge' && <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l3 7h7l-5.5 4 2 7L12 16l-6.5 4 2-7L2 9h7z"/></svg>}
                    {role}
                  </button>
                ))}
              </div>

              {/* SSO 2-col
              <div className="rg-sso-row">
                <button
                  type="button"
                  className="rg-sso-btn"
                  onClick={() => { window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/auth/oauth/google`; }}
                >
                  <svg viewBox="0 0 24 24" width="15" height="15">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Google
                </button>
              </div>
              */}

              <div className="rg-divider">or with email</div>

              {/* Error */}
              {error && (
                <div className="rg-error">
                  <p>{error}</p>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit}>
                <div className="rg-two-col">
                  <div style={{ display:'flex', flexDirection:'column' }}>
                    <label className="rg-fld-label">{t('auth.fullName').split(' ')[0] || 'First name'}</label>
                    <input className="rg-inp no-ico" name="firstName" type="text" autoComplete="given-name" required placeholder="Ayesha" />
                  </div>
                  <div style={{ display:'flex', flexDirection:'column' }}>
                    <label className="rg-fld-label">Last name</label>
                    <input className="rg-inp no-ico" name="lastName" type="text" autoComplete="family-name" placeholder="Rahman" />
                  </div>
                </div>

                <div className="rg-fld">
                  <label className="rg-fld-label">{t('auth.email')}</label>
                  <div className="rg-inp-wrap">
                    <svg className="rg-inp-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 6h16v12H4z"/><path d="M4 6l8 6 8-6"/></svg>
                    <input className="rg-inp" name="email" type="email" autoComplete="email" required placeholder={t('auth.emailPlaceholder')} />
                  </div>
                </div>

                <div className="rg-fld">
                  <label className="rg-fld-label">{t('auth.password')}</label>
                  <div className="rg-inp-wrap">
                    <svg className="rg-inp-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 118 0v4"/></svg>
                    <input
                      className="rg-inp"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      required
                      minLength={8}
                      placeholder="8+ characters, mixed case &amp; a number"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      style={{ paddingRight: 40 }}
                    />
                    <button type="button" className="rg-inp-eye" aria-label="Toggle password" onClick={() => setShowPassword(v => !v)}>
                      {showPassword
                        ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                        : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>}
                    </button>
                  </div>
                  {/* Strength meter */}
                  {password.length > 0 && (
                    <>
                      <div className="rg-strength">
                        {[1, 2, 3, 4].map(i => (
                          <div
                            key={i}
                            className="rg-seg"
                            style={{ background: i <= strength ? STRENGTH_COLORS[strength] : '#EFEFEA' }}
                          />
                        ))}
                      </div>
                      <div className="rg-str-label">
                        <span>Password strength</span>
                        <b>{STRENGTH_LABELS[strength]}</b>
                      </div>
                    </>
                  )}
                </div>

                <div className="rg-fld">
                  <label className="rg-fld-label">{t('auth.confirmPassword')}</label>
                  <div className="rg-inp-wrap">
                    <svg className="rg-inp-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 118 0v4"/></svg>
                    <input className="rg-inp" name="confirmPassword" type="password" autoComplete="new-password" required minLength={8} placeholder={t('auth.confirmPassword')} />
                  </div>
                </div>

                {/* Terms */}
                <label className="rg-check">
                  <input type="checkbox" className="rg-check-input" name="terms" required />
                  <span className="rg-check-box">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                  </span>
                  I agree to the <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>. I also agree to receive occasional product updates by email.
                </label>

                <button type="submit" className="rg-sub-btn" disabled={loading}>
                  {loading
                    ? <><div style={{ width:18, height:18, border:'2px solid rgba(255,255,255,0.3)', borderTopColor:'#fff', borderRadius:'50%', animation:'rgSpin .8s linear infinite' }} />{t('common.loading')}</>
                    : <>{t('auth.createAccount')} <span className="rg-arr">→</span></>}
                </button>
              </form>

              <div className="rg-alt-cta">
                Already have an account? <Link href="/auth/login">{t('auth.signIn')}</Link>
              </div>

              
            </div>
          </div>
        </div>

      </div>
    </>
  );
}
