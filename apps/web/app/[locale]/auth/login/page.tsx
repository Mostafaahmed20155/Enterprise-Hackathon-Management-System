'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Link, useRouter } from '@/i18n/routing';
import { getApiErrorMessage } from '@/lib/api-error-message';

export default function LoginPage() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const loginWith = async (emailValue: string, passwordValue: string) => {
    setLoading(true);
    setError('');

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
      const response = await fetch(`${apiBase}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept-Language': locale },
        credentials: 'include',
        body: JSON.stringify({ email: emailValue, password: passwordValue }),
      });

      if (!response.ok) {
        let data: unknown;
        try { data = await response.json(); } catch { data = null; }
        throw new Error(getApiErrorMessage(data, locale, t('auth.loginFailed')));
      }

      const data = await response.json();
      if (data.accessToken) localStorage.setItem('accessToken', data.accessToken);
      if (data.refreshToken) localStorage.setItem('refreshToken', data.refreshToken);
      localStorage.setItem('locale', locale);
      router.push('/dashboard');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '';
      const isNetworkError =
        message === 'Failed to fetch' || (err instanceof TypeError && message.toLowerCase().includes('fetch'));
      if (isNetworkError) {
        setError(
          locale === 'ar'
            ? 'تعذّر الاتصال بالخادم. تأكد أن Nest يعمل على المنفذ 3001.'
            : 'Cannot reach the API. Check that the API server is running on port 3001 and NEXT_PUBLIC_API_URL is correct.',
        );
      } else {
        setError(message || t('auth.loginFailed'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    void loginWith(email, password);
  };

  const handleDemo = (demoEmail: string, demoPassword: string) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    void loginWith(demoEmail, demoPassword);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Instrument+Serif:ital@1&family=JetBrains+Mono:wght@400;500&display=swap');
        @keyframes lnSpin { to { transform: rotate(360deg); } }

        .ln-wrap { display:grid; grid-template-columns:1fr 1fr; min-height:100vh; font-family:'Inter',system-ui,sans-serif; -webkit-font-smoothing:antialiased; color:#0A0A0A; background:#FAFAF7; }

        /* LEFT – form side */
        .ln-left { display:flex; flex-direction:column; padding:32px 40px; background:#FAFAF7; }
        .ln-brand-bar { display:flex; align-items:center; justify-content:space-between; }
        .ln-brand { display:flex; align-items:center; gap:10px; font-weight:700; font-size:17px; letter-spacing:-0.02em; text-decoration:none; color:#0A0A0A; }
        .ln-logo-mark { width:26px; height:26px; border-radius:8px; background:#0A0A0A; position:relative; overflow:hidden; flex-shrink:0; }
        .ln-logo-mark::before { content:""; position:absolute; inset:4px; border-radius:4px; background:oklch(0.85 0.17 130); }
        .ln-logo-mark::after { content:""; position:absolute; left:10px; top:10px; width:6px; height:6px; border-radius:2px; background:#0A0A0A; }
        .ln-bb-right { font-size:13px; color:#6B6B6B; display:flex; align-items:center; gap:14px; }
        .ln-ghost { padding:7px 14px; border-radius:8px; border:1px solid rgba(10,10,10,0.14); color:#0A0A0A; font-weight:500; transition:all .2s; background:#fff; text-decoration:none; font-size:13px; }
        .ln-ghost:hover { border-color:#0A0A0A; }

        .ln-form-shell { flex:1; display:flex; align-items:center; justify-content:center; padding:32px 0; }
        .ln-form-box { width:100%; max-width:420px; }

        .ln-step-tag { font-family:'JetBrains Mono',monospace; font-size:11px; color:#6B6B6B; letter-spacing:0.08em; display:flex; align-items:center; gap:10px; margin-bottom:18px; }
        .ln-step-tag::before { content:""; width:24px; height:1px; background:#0A0A0A; }
        .ln-form-box h1 { font-size:40px; letter-spacing:-0.035em; font-weight:600; line-height:1.02; margin:0 0 6px; }
        .ln-serif { font-family:'Instrument Serif',serif; font-weight:400; font-style:italic; color:#2A2A2A; }
        .ln-sub { color:#6B6B6B; font-size:14.5px; margin-top:8px; line-height:1.55; max-width:380px; }

        .ln-sso { margin-top:28px; display:flex; flex-direction:column; gap:10px; }
        .ln-sso-btn { display:flex; align-items:center; justify-content:center; gap:10px; padding:11px 16px; border-radius:10px; background:#fff; border:1px solid rgba(10,10,10,0.14); font-size:14px; font-weight:500; color:#0A0A0A; width:100%; transition:all .2s; cursor:pointer; font-family:inherit; }
        .ln-sso-btn:hover { border-color:#0A0A0A; transform:translateY(-1px); box-shadow:0 6px 18px -10px rgba(10,10,10,0.2); }
        .ln-sso-btn svg { width:16px; height:16px; flex-shrink:0; }

        .ln-divider { display:flex; align-items:center; gap:14px; margin:22px 0; color:#9B9B9B; font-size:11.5px; letter-spacing:0.1em; text-transform:uppercase; font-family:'JetBrains Mono',monospace; font-weight:600; }
        .ln-divider::before, .ln-divider::after { content:""; flex:1; height:1px; background:rgba(10,10,10,0.08); }

        .ln-fld { display:flex; flex-direction:column; margin-bottom:14px; }
        .ln-fld-label { font-size:13px; font-weight:500; color:#0A0A0A; margin-bottom:6px; display:flex; justify-content:space-between; align-items:center; }
        .ln-fld-label a { font-size:12px; color:#6B6B6B; border-bottom:1px dashed rgba(10,10,10,0.14); padding-bottom:1px; text-decoration:none; }
        .ln-fld-label a:hover { color:#0A0A0A; border-color:#0A0A0A; }
        .ln-inp-wrap { position:relative; }
        .ln-inp-ico { position:absolute; left:12px; top:50%; transform:translateY(-50%); width:15px; height:15px; color:#9B9B9B; pointer-events:none; }
        .ln-inp-eye { position:absolute; right:10px; top:50%; transform:translateY(-50%); width:26px; height:26px; border-radius:6px; color:#6B6B6B; display:inline-flex; align-items:center; justify-content:center; cursor:pointer; background:none; border:none; padding:0; }
        .ln-inp-eye:hover { background:#F5F5F0; color:#0A0A0A; }
        .ln-inp-eye svg { width:14px; height:14px; }
        .ln-inp { width:100%; padding:12px 14px 12px 36px; background:#fff; border:1px solid rgba(10,10,10,0.14); border-radius:10px; font:inherit; font-size:14px; color:#0A0A0A; transition:all .2s; outline:none; box-sizing:border-box; }
        .ln-inp:hover { border-color:rgba(10,10,10,0.2); }
        .ln-inp:focus { border-color:#0A0A0A; box-shadow:0 0 0 3px rgba(10,10,10,0.05); }
        .ln-inp::placeholder { color:#9B9B9B; }

        .ln-row { display:flex; justify-content:space-between; align-items:center; margin:4px 0 22px; }
        .ln-check { display:inline-flex; align-items:center; gap:9px; font-size:13px; color:#2A2A2A; cursor:pointer; }
        .ln-check-input { display:none; }
        .ln-check-box { width:16px; height:16px; border-radius:5px; border:1.5px solid rgba(10,10,10,0.14); background:#fff; display:inline-flex; align-items:center; justify-content:center; transition:all .2s; flex-shrink:0; }
        .ln-check-box svg { width:10px; height:10px; color:#0A0A0A; opacity:0; transition:opacity .15s; }
        .ln-check-input:checked + .ln-check-box { background:oklch(0.85 0.17 130); border-color:oklch(0.68 0.19 130); }
        .ln-check-input:checked + .ln-check-box svg { opacity:1; }
        .ln-passkey { font-size:12.5px; color:#6B6B6B; text-decoration:none; }
        .ln-passkey:hover { color:#0A0A0A; }

        .ln-sub-btn { width:100%; padding:12.5px 16px; border-radius:10px; background:#0A0A0A; color:#FAFAF7; font-weight:600; font-size:14.5px; letter-spacing:-0.01em; display:flex; align-items:center; justify-content:center; gap:10px; transition:all .2s; cursor:pointer; border:none; font-family:inherit; }
        .ln-sub-btn:hover:not(:disabled) { transform:translateY(-1px); box-shadow:0 12px 28px -12px rgba(10,10,10,0.4); background:#000; }
        .ln-sub-btn:disabled { opacity:0.7; cursor:not-allowed; }
        .ln-arr { transition:transform .2s; display:inline-block; }
        .ln-sub-btn:hover:not(:disabled) .ln-arr { transform:translateX(4px); }

        .ln-alt-cta { text-align:center; margin-top:24px; font-size:13.5px; color:#6B6B6B; }
        .ln-alt-cta a { color:#0A0A0A; font-weight:600; border-bottom:1px dashed rgba(10,10,10,0.14); padding-bottom:1px; text-decoration:none; }
        .ln-alt-cta a:hover { border-color:#0A0A0A; }

        .ln-demo { margin-top:20px; padding:14px 16px; background:#fff; border:1px solid rgba(10,10,10,0.08); border-radius:12px; }
        .ln-demo-title { font-family:'JetBrains Mono',monospace; font-size:10.5px; color:#9B9B9B; letter-spacing:0.08em; text-transform:uppercase; font-weight:600; margin-bottom:10px; }
        .ln-demo-row { display:flex; align-items:center; gap:8px; font-size:12px; color:#6B6B6B; margin-bottom:4px; width:100%; text-align:start; background:#fff; border:1px solid rgba(10,10,10,0.08); border-radius:8px; padding:8px 10px; cursor:pointer; font-family:inherit; transition:all .15s; }
        .ln-demo-row:hover:not(:disabled) { border-color:#0A0A0A; color:#0A0A0A; transform:translateY(-1px); }
        .ln-demo-row:disabled { opacity:0.6; cursor:not-allowed; }
        .ln-demo-row:last-child { margin-bottom:0; }
        .ln-demo-badge { font-size:10.5px; font-weight:600; font-family:'JetBrains Mono',monospace; background:#F5F5F0; color:#2A2A2A; padding:2px 7px; border-radius:5px; }
        .ln-code { font-family:'JetBrains Mono',monospace; font-size:11.5px; background:#F5F5F0; padding:2px 6px; border-radius:4px; color:#2A2A2A; }

        .ln-foot-row { display:flex; justify-content:space-between; align-items:center; font-size:12px; color:#9B9B9B; margin-top:20px; font-family:'JetBrains Mono',monospace; }
        .ln-foot-dot { width:5px; height:5px; border-radius:50%; background:oklch(0.68 0.19 130); display:inline-block; margin-right:6px; box-shadow:0 0 0 3px oklch(0.68 0.19 130 / 0.15); }
        .ln-legal { text-align:center; font-size:11.5px; color:#9B9B9B; margin-top:20px; line-height:1.6; }
        .ln-legal a { color:#6B6B6B; border-bottom:1px dashed rgba(10,10,10,0.14); text-decoration:none; }
        .ln-legal a:hover { color:#0A0A0A; }

        .ln-error { background:#FEF2F2; border:1px solid #FCA5A5; border-radius:10px; padding:12px 14px; margin-bottom:18px; }
        .ln-error p { font-size:13px; color:#B91C1C; line-height:1.5; }

        /* RIGHT – visual side */
        .ln-right {
          position:relative; overflow:hidden;
          background:
            radial-gradient(60% 50% at 75% 25%, oklch(0.85 0.17 130 / 0.55), transparent 70%),
            radial-gradient(80% 60% at 25% 95%, oklch(0.68 0.19 130 / 0.22), transparent 75%),
            #F5F5F0;
          padding:40px 48px; display:flex; flex-direction:column; gap:28px;
        }
        .ln-right::before {
          content:""; position:absolute; inset:0;
          background-image: radial-gradient(rgba(10,10,10,0.08) 1px, transparent 1px);
          background-size:16px 16px;
          -webkit-mask-image:radial-gradient(ellipse 80% 70% at 50% 40%, #000 30%, transparent 85%);
          mask-image:radial-gradient(ellipse 80% 70% at 50% 40%, #000 30%, transparent 85%);
          pointer-events:none; z-index:0;
        }
        .ln-right > * { position:relative; z-index:1; }

        .ln-r-chips { display:flex; gap:8px; justify-content:flex-end; flex-wrap:wrap; }
        .ln-r-chip { display:inline-flex; align-items:center; gap:7px; padding:6px 11px; border-radius:100px; background:rgba(255,255,255,0.75); border:1px solid rgba(255,255,255,0.9); backdrop-filter:blur(10px); font-size:11.5px; font-weight:500; color:#2A2A2A; box-shadow:0 4px 12px -6px rgba(10,10,10,0.1); }
        .ln-r-chip svg { width:12px; height:12px; color:oklch(0.68 0.19 130); flex-shrink:0; }
        .ln-r-chip.dark { background:#0A0A0A; color:#fff; border-color:#0A0A0A; }
        .ln-r-chip.dark svg { color:oklch(0.85 0.17 130); }

        .ln-r-head { max-width:480px; }
        .ln-r-eyebrow { font-family:'JetBrains Mono',monospace; font-size:11px; color:#6B6B6B; letter-spacing:0.1em; display:flex; align-items:center; gap:10px; margin-bottom:14px; }
        .ln-r-eyebrow::before { content:""; width:22px; height:1px; background:#0A0A0A; }
        .ln-r-head h2 { font-size:34px; line-height:1.05; letter-spacing:-0.03em; font-weight:600; color:#0A0A0A; margin:0 0 10px; }
        .ln-r-sub { font-size:14px; color:#6B6B6B; line-height:1.6; margin-bottom:20px; max-width:400px; }

        .ln-feats { display:flex; flex-direction:column; gap:12px; margin-bottom:4px; }
        .ln-feat { display:flex; gap:12px; align-items:flex-start; }
        .ln-feat-ico { width:32px; height:32px; border-radius:9px; background:rgba(255,255,255,0.8); border:1px solid rgba(10,10,10,0.08); display:flex; align-items:center; justify-content:center; color:#0A0A0A; flex-shrink:0; }
        .ln-feat-ico svg { width:14px; height:14px; }
        .ln-feat .tt { font-size:13.5px; font-weight:600; letter-spacing:-0.01em; }
        .ln-feat .dd { font-size:12.5px; color:#6B6B6B; margin-top:2px; line-height:1.5; }

        /* Mock dashboard */
        .ln-mock-wrap { flex:1; position:relative; display:flex; align-items:center; justify-content:center; min-height:0; }
        .ln-mock { width:100%; max-width:520px; background:#fff; border:1px solid rgba(10,10,10,0.08); border-radius:18px; box-shadow:0 40px 80px -30px rgba(10,10,10,0.25), 0 16px 32px -16px rgba(10,10,10,0.12); overflow:hidden; transform:perspective(1400px) rotateY(-4deg) rotateX(3deg) rotate(-0.5deg); transform-origin:center; }
        .ln-mock-top { display:flex; align-items:center; gap:6px; padding:11px 14px; border-bottom:1px solid rgba(10,10,10,0.08); background:#FCFCFA; }
        .ln-mock-dot { width:10px; height:10px; border-radius:50%; flex-shrink:0; }
        .ln-mock-url { flex:1; margin-left:12px; font-family:'JetBrains Mono',monospace; font-size:10.5px; color:#9B9B9B; text-align:center; background:#F5F5F0; padding:4px 10px; border-radius:6px; display:flex; align-items:center; justify-content:center; gap:6px; }
        .ln-mock-url svg { width:10px; height:10px; }
        .ln-mock-body { padding:16px; display:flex; flex-direction:column; gap:12px; }
        .ln-mock-header { display:flex; justify-content:space-between; align-items:center; }
        .ln-mock-ttl { font-size:14px; font-weight:600; letter-spacing:-0.015em; }
        .ln-mock-ttl span { font-family:'Instrument Serif',serif; font-style:italic; font-weight:400; color:#2A2A2A; }
        .ln-mock-live { display:inline-flex; align-items:center; gap:6px; font-size:10px; font-family:'JetBrains Mono',monospace; color:#6B6B6B; padding:3px 8px; border-radius:100px; background:oklch(0.93 0.09 130); border:1px solid oklch(0.85 0.17 130 / 0.4); }
        .ln-mock-live .p { width:5px; height:5px; border-radius:50%; background:oklch(0.68 0.19 130); box-shadow:0 0 0 3px oklch(0.68 0.19 130 / 0.2); }
        .ln-mock-row { display:grid; grid-template-columns:repeat(3,1fr); gap:8px; }
        .ln-mock-stat { background:#FCFCFA; border:1px solid rgba(10,10,10,0.08); border-radius:10px; padding:10px 12px; }
        .ln-mock-stat.accent { background:#0A0A0A; color:#fff; }
        .ln-mock-stat .l { font-size:9.5px; color:#6B6B6B; text-transform:uppercase; letter-spacing:0.08em; font-family:'JetBrains Mono',monospace; font-weight:600; }
        .ln-mock-stat.accent .l { color:oklch(0.85 0.17 130); }
        .ln-mock-stat .v { font-size:22px; font-weight:600; letter-spacing:-0.02em; margin-top:3px; line-height:1; }
        .ln-mock-stat .d { font-size:10px; color:#6B6B6B; margin-top:4px; display:flex; align-items:center; gap:4px; }
        .ln-mock-stat .d b { color:oklch(0.68 0.19 130); font-weight:600; }
        .ln-mock-stat.accent .d { color:rgba(255,255,255,0.6); }
        .ln-mock-stat.accent .d b { color:oklch(0.85 0.17 130); }
        .ln-mock-chart { background:#FCFCFA; border:1px solid rgba(10,10,10,0.08); border-radius:10px; padding:14px 12px 6px; height:100px; position:relative; }
        .ln-mock-chart .ch-label { position:absolute; top:10px; left:12px; font-size:10px; font-family:'JetBrains Mono',monospace; color:#6B6B6B; letter-spacing:0.06em; text-transform:uppercase; font-weight:600; }
        .ln-mock-chart .ch-value { position:absolute; top:24px; left:12px; font-size:16px; font-weight:600; letter-spacing:-0.02em; }
        .ln-mock-events { display:flex; flex-direction:column; gap:6px; }
        .ln-mock-ev { display:flex; align-items:center; gap:10px; padding:8px 10px; background:#FCFCFA; border:1px solid rgba(10,10,10,0.08); border-radius:9px; font-size:11.5px; }
        .ln-mock-ev .dt { width:32px; text-align:center; flex-shrink:0; }
        .ln-mock-ev .dt .mo { font-size:8.5px; font-family:'JetBrains Mono',monospace; color:#6B6B6B; text-transform:uppercase; letter-spacing:0.06em; font-weight:600; }
        .ln-mock-ev .dt .dy { font-size:15px; font-weight:600; letter-spacing:-0.02em; line-height:1; margin-top:1px; }
        .ln-mock-ev .nm { flex:1; font-weight:500; letter-spacing:-0.01em; color:#0A0A0A; }
        .ln-mock-ev .nm .sub { font-size:10px; color:#6B6B6B; font-weight:400; margin-top:1px; }
        .ln-mock-ev .st { font-size:9.5px; padding:2px 7px; border-radius:5px; background:oklch(0.85 0.17 130); color:#0A0A0A; font-family:'JetBrains Mono',monospace; font-weight:600; letter-spacing:0.04em; }
        .ln-mock-ev .st.gray { background:#EFEFEA; color:#6B6B6B; }

        .ln-r-foot { display:flex; justify-content:space-between; align-items:center; font-family:'JetBrains Mono',monospace; font-size:10.5px; color:#6B6B6B; letter-spacing:0.06em; }
        .ln-r-foot .ls { display:flex; gap:16px; }

        @media (max-width:960px) {
          .ln-wrap { grid-template-columns:1fr; }
          .ln-right { display:none; }
          .ln-left { padding:24px 20px; }
        }
      `}</style>

      <div className="ln-wrap">

        {/* ── LEFT: Form ── */}
        <div className="ln-left">
          <div className="ln-brand-bar">
            <Link href="/" className="ln-brand">
              <span className="ln-logo-mark" />
              EHMS
            </Link>
          
          </div>

          <div className="ln-form-shell">
            <div className="ln-form-box">

              <div className="ln-step-tag">ACCOUNT · SIGN IN</div>
              <h1>Welcome <span className="ln-serif">back.</span></h1>
              <p className="ln-sub">Continue managing your hackathons, teams and judging in one place.</p>

              {/* SSO 
              <div className="ln-sso">
                <button
                  type="button"
                  className="ln-sso-btn"
                  onClick={() => { window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/auth/oauth/google`; }}
                >
                  <svg viewBox="0 0 24 24" width="16" height="16">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continue with Google
                </button>
              </div>

              <div className="ln-divider">or with email</div>
*/}
              {/* Error */}
              {error && (
                <div className="ln-error">
                  <p>{error}</p>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit}>
                <div className="ln-fld">
                  <label className="ln-fld-label">{t('auth.email')}</label>
                  <div className="ln-inp-wrap">
                    <svg className="ln-inp-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 6h16v12H4z"/><path d="M4 6l8 6 8-6"/></svg>
                    <input className="ln-inp" name="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required placeholder={t('auth.emailPlaceholder')} />
                  </div>
                </div>

                <div className="ln-fld">
                  <label className="ln-fld-label">
                    {t('auth.password')}
                    <a href="#">{t('auth.forgotPassword')}</a>
                  </label>
                  <div className="ln-inp-wrap">
                    <svg className="ln-inp-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 118 0v4"/></svg>
                    <input className="ln-inp" name="password" type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required placeholder={t('auth.passwordPlaceholder')} style={{ paddingRight: 40 }} />
                    <button type="button" className="ln-inp-eye" aria-label="Toggle password" onClick={() => setShowPassword(v => !v)}>
                      {showPassword
                        ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                        : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>}
                    </button>
                  </div>
                </div>

                <div className="ln-row">
                  <label className="ln-check">
                    <input type="checkbox" className="ln-check-input" name="remember-me" defaultChecked />
                    <span className="ln-check-box">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                    </span>
                    {t('auth.rememberMe')}
                  </label>
                </div>

                <button type="submit" className="ln-sub-btn" disabled={loading}>
                  {loading
                    ? <><div style={{ width:18, height:18, border:'2px solid rgba(255,255,255,0.3)', borderTopColor:'#fff', borderRadius:'50%', animation:'lnSpin .8s linear infinite' }} />{t('common.loading')}</>
                    : <>{t('auth.signIn')} <span className="ln-arr">→</span></>}
                </button>
              </form>

              <div className="ln-alt-cta">
                New to EHMS? <Link href="/auth/register">{t('auth.createAccount')}</Link>
              </div>

              {/* Demo accounts */}
              <div className="ln-demo">
                <div className="ln-demo-title">{locale === 'ar' ? 'حسابات تجريبية · اضغط لتسجيل الدخول' : 'Demo accounts · click to sign in'}</div>
                <button type="button" className="ln-demo-row" disabled={loading} onClick={() => handleDemo('admin@ehms.com', 'Password123!')}>
                  <span className="ln-demo-badge">Admin</span>
                  <span className="ln-code">admin@ehms.com</span>
                  <span style={{ color:'#9B9B9B' }}>/</span>
                  <span className="ln-code">Password123!</span>
                </button>
                <button type="button" className="ln-demo-row" disabled={loading} onClick={() => handleDemo('organizer@ehms.com', 'Password123!')}>
                  <span className="ln-demo-badge">Org</span>
                  <span className="ln-code">organizer@ehms.com</span>
                  <span style={{ color:'#9B9B9B' }}>/</span>
                  <span className="ln-code">Password123!</span>
                </button>
              </div>

             
            </div>
          </div>

          <div className="ln-legal">
            By continuing, you agree to our <a href="#">Terms</a> and <a href="#">Privacy policy</a>.
          </div>
        </div>

        {/* ── RIGHT: Visual ── */}
        <div className="ln-right">


          {/* Headline + features */}
          <div className="ln-r-head">
            <div className="ln-r-eyebrow">ENTERPRISE HACKATHON PLATFORM</div>
            <h2>Welcome to the Future<br />of <span className="ln-serif">Hackathons.</span></h2>
            <p className="ln-r-sub">Enterprise-grade platform for organizing and managing successful hackathon events</p>
            <div className="ln-feats">
              <div className="ln-feat">
                <div className="ln-feat-ico">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 118 0v4"/></svg>
                </div>
                <div><div className="tt">Enterprise Security</div><div className="dd">Role-based access control and secure data handling</div></div>
              </div>
              <div className="ln-feat">
                <div className="ln-feat-ico">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 00-3-3.87"/></svg>
                </div>
                <div><div className="tt">Team Collaboration</div><div className="dd">Seamless team formation and project management</div></div>
              </div>
              <div className="ln-feat">
                <div className="ln-feat-ico">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l3 7h7l-5.5 4 2 7L12 16l-6.5 4 2-7L2 9h7z"/></svg>
                </div>
                <div><div className="tt">Smart Judging</div><div className="dd">Comprehensive evaluation and leaderboard system</div></div>
              </div>
            </div>
          </div>

          {/* Mock dashboard */}
          <div className="ln-mock-wrap">
            <div className="ln-mock">
              <div className="ln-mock-top">
                <span className="ln-mock-dot" style={{ background:'#FF5F57' }} />
                <span className="ln-mock-dot" style={{ background:'#FEBC2E' }} />
                <span className="ln-mock-dot" style={{ background:'#28C840' }} />
                <span className="ln-mock-url">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 118 0v4"/></svg>
                  app.ehms.sa/dashboard
                </span>
              </div>
              <div className="ln-mock-body">
                <div className="ln-mock-header">
                  <div className="ln-mock-ttl">Overview <span>· this quarter</span></div>
                  <div className="ln-mock-live"><span className="p" />LIVE</div>
                </div>
                <div className="ln-mock-row">
                  <div className="ln-mock-stat accent"><div className="l">Events</div><div className="v">24</div><div className="d"><b>↑ 12%</b> vs last Q</div></div>
                  <div className="ln-mock-stat"><div className="l">Teams</div><div className="v">186</div><div className="d"><b>↑ 38</b> this week</div></div>
                  <div className="ln-mock-stat"><div className="l">Submissions</div><div className="v">342</div><div className="d"><b>92%</b> judged</div></div>
                </div>
                <div className="ln-mock-chart">
                  <div className="ch-label">Registrations · 30d</div>
                  <div className="ch-value">+1,284</div>
                  <svg viewBox="0 0 320 70" preserveAspectRatio="none" style={{ width:'100%', height:'100%', marginTop:18 }}>
                    <defs>
                      <linearGradient id="lnGr" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0" stopColor="oklch(0.68 0.19 130)" stopOpacity="0.35"/>
                        <stop offset="1" stopColor="oklch(0.68 0.19 130)" stopOpacity="0"/>
                      </linearGradient>
                    </defs>
                    <path d="M0 55 C30 50 50 38 85 42 C115 46 135 22 170 26 C205 30 225 12 265 16 C290 18 305 10 320 8 L320 70 L0 70 Z" fill="url(#lnGr)"/>
                    <path d="M0 55 C30 50 50 38 85 42 C115 46 135 22 170 26 C205 30 225 12 265 16 C290 18 305 10 320 8" fill="none" stroke="oklch(0.68 0.19 130)" strokeWidth="2" strokeLinecap="round"/>
                    <circle cx="265" cy="16" r="3.5" fill="#fff" stroke="oklch(0.68 0.19 130)" strokeWidth="2"/>
                  </svg>
                </div>
                <div className="ln-mock-events">
                  <div className="ln-mock-ev">
                    <div className="dt"><div className="mo">NOV</div><div className="dy">12</div></div>
                    <div className="nm">Tech Hackathon 2026<div className="sub">72 teams · Riyadh</div></div>
                    <div className="st">LIVE</div>
                  </div>
                  <div className="ln-mock-ev">
                    <div className="dt"><div className="mo">NOV</div><div className="dy">22</div></div>
                    <div className="nm">Green Economy Jam<div className="sub">Registration open</div></div>
                    <div className="st gray">OPEN</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

         
        </div>

      </div>
    </>
  );
}
