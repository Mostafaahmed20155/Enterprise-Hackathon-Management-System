'use client';

import { useTranslations, useLocale } from 'next-intl';
import { Link, usePathname } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import {
  ArrowRight,
  Calendar,
  Users,
  Trophy,
  Sparkles,
  Zap,
  Shield,
  Globe,
  ChevronRight,
  CheckCircle2,
  Star,
  BarChart3,
  FileText,
  Layers,
} from 'lucide-react';

export default function HomePage() {
  const t = useTranslations('home');
  const locale = useLocale();
  const isRtl = locale === 'ar';
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 overflow-x-hidden">

      {/* ── Navbar ─────────────────────────────────────────────── */}
      <header className="fixed top-0 inset-x-0 z-50 bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl border-b border-gray-200/60 dark:border-gray-800/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                EHMS
              </span>
            </Link>

            {/* Nav links — hidden on mobile */}
            <nav className="hidden md:flex items-center gap-1">
              {[
                { label: 'Features', href: '#features' },
                { label: 'How it works', href: '#how-it-works' },
              ].map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                  {item.label}
                </a>
              ))}
            </nav>

            {/* Right side */}
            <div className="flex items-center gap-2">
              {/* Language toggle */}
              <Link
                href={pathname}
                locale={isRtl ? 'en' : 'ar'}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <Globe className="w-3.5 h-3.5" />
                {isRtl ? 'English' : 'العربية'}
              </Link>
              <Link href="/auth/login">
                <Button variant="ghost" size="sm" className="text-sm">
                  Sign in
                </Button>
              </Link>
              <Link href="/auth/register">
                <Button
                  size="sm"
                  className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white text-sm shadow-sm"
                >
                  Get started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* ── Hero ──────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center pt-36 pb-20 overflow-hidden">
        {/* Background layers */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.15),rgba(255,255,255,0))] dark:bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(0,0,0,0))]" />
        <div className="absolute inset-y-0 inset-x-0 bg-[url('/grid.svg')] bg-center opacity-[0.03] dark:opacity-[0.07]" />

        {/* Glow orbs */}
        <div className="absolute top-1/4 start-1/4 w-[500px] h-[500px] bg-indigo-400/10 dark:bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 end-1/4 w-[400px] h-[400px] bg-purple-400/10 dark:bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 text-center">
          {/* Eyebrow badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-3 rounded-full border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 text-sm font-medium animate-fade-in">
            <Sparkles className="w-3.5 h-3.5" />
            Enterprise-grade hackathon platform
          </div>

          {/* Headline */}
          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-extrabold tracking-tight leading-[1.05] mb-6 animate-slide-up">
            <span className="text-gray-900 dark:text-white">Run better</span>
            <br />
            <span className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
              hackathons
            </span>
          </h1>

          {/* Sub-headline */}
          <p className="text-xl md:text-2xl text-gray-500 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed mb-10 animate-fade-in">
            {t('hero.description')}
          </p>

          {/* CTA row */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 animate-fade-in">
            <Link href="/auth/register">
              <Button
                size="lg"
                className="group h-12 px-8 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white text-base font-semibold shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/30 transition-all duration-200 hover:-translate-y-0.5"
              >
                Start for free
                <ArrowRight className="ms-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link href="/events">
              <Button
                size="lg"
                variant="outline"
                className="h-12 px-8 text-base font-medium border-gray-300 dark:border-gray-700 hover:border-indigo-400 dark:hover:border-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-all duration-200"
              >
                Browse events
                <ChevronRight className="ms-1 w-4 h-4 opacity-60" />
              </Button>
            </Link>
          </div>

          {/* Trust line */}
          <p className="mt-6 text-sm text-gray-400 dark:text-gray-500">
            No credit card required · Full Arabic &amp; English support
          </p>
        </div>

        {/* Dashboard preview card */}
        <div className="relative z-10 mt-20 max-w-5xl mx-auto px-4 sm:px-6 w-full animate-slide-up">
          <div className="relative rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-800 shadow-2xl shadow-gray-900/10 dark:shadow-gray-900/40">
            {/* Fake browser chrome */}
            <div className="flex items-center gap-1.5 px-4 py-3 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <div className="w-3 h-3 rounded-full bg-red-400" />
              <div className="w-3 h-3 rounded-full bg-yellow-400" />
              <div className="w-3 h-3 rounded-full bg-green-400" />
              <div className="ms-3 flex-1 h-5 bg-white dark:bg-gray-700 rounded-md max-w-xs text-xs text-gray-400 dark:text-gray-500 flex items-center px-2">
                ehms.app/en/events
              </div>
            </div>
            {/* Minimal dashboard mockup */}
            <div className="bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-950 p-6">
              <div className="grid grid-cols-3 gap-4 mb-6">
                {[
                  { label: 'Active Events', value: '12', color: 'from-indigo-500 to-indigo-600' },
                  { label: 'Participants', value: '1,248', color: 'from-purple-500 to-purple-600' },
                  { label: 'Submissions', value: '347', color: 'from-pink-500 to-pink-600' },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className={`rounded-xl bg-gradient-to-br ${stat.color} p-4 text-white shadow-lg`}
                  >
                    <p className="text-xs font-medium opacity-80 mb-1">{stat.label}</p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 sm:col-span-1 space-y-2">
                  {['Riyadh Tech Hackathon', 'AI Innovation Cup', 'Smart City Challenge'].map((name, i) => (
                    <div
                      key={name}
                      className="flex items-center justify-between px-3 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
                    >
                      <span className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{name}</span>
                      <span className={`shrink-0 ms-2 text-xs px-2 py-0.5 rounded-full font-medium ${
                        i === 0 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                        i === 1 ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                                  'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                      }`}>
                        {i === 0 ? 'Active' : i === 1 ? 'Judging' : 'Draft'}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="col-span-2 sm:col-span-1 flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 rounded-xl border border-indigo-100 dark:border-indigo-900/50 p-4">
                  <div className="text-center">
                    <Trophy className="w-10 h-10 text-indigo-400 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Leaderboard live</p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">Real-time scoring</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* Gradient fade below card */}
          <div className="absolute -bottom-8 inset-x-0 h-20 bg-gradient-to-t from-white dark:from-gray-950 to-transparent pointer-events-none" />
        </div>
      </section>

      {/* ── Stats strip ────────────────────────────────────────── */}
      <section className="border-y border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 py-12">
        <div className="max-w-5xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { number: '500+', label: 'Events hosted' },
            { number: '50K+', label: 'Participants globally' },
            { number: '12K+', label: 'Projects submitted' },
            { number: '99.9%', label: 'Platform uptime' },
          ].map((stat) => (
            <div key={stat.label} className="space-y-1">
              <p className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">
                {stat.number}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ──────────────────────────────────────────── */}
      <section id="features" className="py-24 bg-white dark:bg-gray-950">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          {/* Section header */}
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-3">
              Platform features
            </p>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white leading-tight mb-4">
              {t('features.title')}
            </h2>
            <p className="text-lg text-gray-500 dark:text-gray-400 max-w-xl mx-auto">
              Everything you need to run successful hackathons, from registration to results.
            </p>
          </div>

          {/* Feature grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Calendar,
                gradient: 'from-indigo-500 to-blue-600',
                glow: 'group-hover:shadow-indigo-500/20',
                title: t('features.events.title'),
                desc: t('features.events.description'),
              },
              {
                icon: Users,
                gradient: 'from-purple-500 to-violet-600',
                glow: 'group-hover:shadow-purple-500/20',
                title: t('features.teams.title'),
                desc: t('features.teams.description'),
              },
              {
                icon: Trophy,
                gradient: 'from-amber-500 to-orange-500',
                glow: 'group-hover:shadow-amber-500/20',
                title: t('features.judging.title'),
                desc: t('features.judging.description'),
              },
              {
                icon: FileText,
                gradient: 'from-emerald-500 to-green-600',
                glow: 'group-hover:shadow-emerald-500/20',
                title: 'Submission Management',
                desc: 'Structured project submissions with file uploads and bilingual descriptions.',
              },
              {
                icon: Shield,
                gradient: 'from-blue-500 to-cyan-600',
                glow: 'group-hover:shadow-blue-500/20',
                title: 'Enterprise Security',
                desc: 'Role-based access control, JWT authentication, and secure data handling.',
              },
              {
                icon: Globe,
                gradient: 'from-rose-500 to-pink-600',
                glow: 'group-hover:shadow-rose-500/20',
                title: 'Bilingual — AR + EN',
                desc: 'Full Arabic RTL and English LTR support. Arabic is a first-class citizen.',
              },
            ].map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className={`group relative rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 hover:shadow-xl ${feature.glow} transition-all duration-300 hover:-translate-y-1`}
                >
                  {/* Top accent line */}
                  <div className={`absolute top-0 inset-x-0 h-px bg-gradient-to-r ${feature.gradient} opacity-0 group-hover:opacity-100 transition-opacity rounded-t-2xl`} />

                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-200`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                    {feature.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── How it works ──────────────────────────────────────── */}
      <section id="how-it-works" className="py-24 bg-gray-50 dark:bg-gray-900/50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-3">
              How it works
            </p>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              From idea to award
            </h2>
            <p className="text-lg text-gray-500 dark:text-gray-400 max-w-xl mx-auto">
              Four simple steps to run a world-class hackathon.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                step: '01',
                icon: Layers,
                title: 'Create an event',
                desc: 'Set up your hackathon with bilingual content, timelines, and state-machine driven phases — from draft to results.',
                color: 'indigo',
              },
              {
                step: '02',
                icon: Users,
                title: 'Teams form up',
                desc: 'Participants register, form teams, invite members by email, and collaborate — all within the platform.',
                color: 'purple',
              },
              {
                step: '03',
                icon: FileText,
                title: 'Projects submitted',
                desc: 'Teams submit their projects with descriptions, links, and file attachments before the deadline.',
                color: 'pink',
              },
              {
                step: '04',
                icon: BarChart3,
                title: 'Judged & ranked',
                desc: 'Assigned judges score submissions with custom criteria. Live leaderboard shows rankings instantly.',
                color: 'amber',
              },
            ].map((item) => {
              const Icon = item.icon;
              const colorMap: Record<string, string> = {
                indigo: 'bg-indigo-50 dark:bg-indigo-950/30 border-indigo-100 dark:border-indigo-900/50 text-indigo-600 dark:text-indigo-400',
                purple: 'bg-purple-50 dark:bg-purple-950/30 border-purple-100 dark:border-purple-900/50 text-purple-600 dark:text-purple-400',
                pink: 'bg-pink-50 dark:bg-pink-950/30 border-pink-100 dark:border-pink-900/50 text-pink-600 dark:text-pink-400',
                amber: 'bg-amber-50 dark:bg-amber-950/30 border-amber-100 dark:border-amber-900/50 text-amber-600 dark:text-amber-400',
              };
              return (
                <div
                  key={item.step}
                  className="flex gap-5 p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 hover:shadow-lg transition-shadow duration-200"
                >
                  <div className={`shrink-0 w-12 h-12 rounded-xl border flex items-center justify-center ${colorMap[item.color]}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 dark:text-gray-500 mb-1 tracking-widest">{item.step}</p>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1.5">{item.title}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Checklist / Why us ────────────────────────────────── */}
      <section className="py-24 bg-white dark:bg-gray-950">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            {/* Left: text */}
            <div>
              <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-3">
                Why EHMS?
              </p>
              <h2 className="text-4xl font-bold text-gray-900 dark:text-white leading-tight mb-6">
                Built for enterprise scale
              </h2>
              <ul className="space-y-4">
                {[
                  'Full Arabic RTL and English LTR with a single codebase',
                  'Event state machine keeps every phase on track automatically',
                  'RBAC: organizers, judges, and participants see only what they need',
                  'File uploads with Arabic filename support and S3 storage',
                  'Live leaderboard updates as judges submit scores',
                  'Secure JWT auth with refresh tokens and Google OAuth',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-indigo-500 dark:text-indigo-400 shrink-0 mt-0.5" />
                    <span className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Right: testimonial-style card */}
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 dark:from-indigo-500/10 dark:to-purple-500/10 rounded-3xl blur-2xl" />
              <div className="relative bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-8 shadow-xl">
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <blockquote className="text-gray-700 dark:text-gray-300 text-base leading-relaxed mb-6">
                  "Running our national hackathon used to require five different tools. EHMS replaced all of them — and the Arabic support is genuinely excellent, not an afterthought."
                </blockquote>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                    FH
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">Fatima Hassan</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Innovation Director, Riyadh Tech Hub</p>
                  </div>
                </div>
              </div>

              {/* Floating mini-stat */}
              <div className="absolute -bottom-4 -end-4 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg px-4 py-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <Zap className="w-4 h-4 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Setup time</p>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">Under 5 min</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Final CTA ─────────────────────────────────────────── */}
      <section className="py-24 bg-gray-950 dark:bg-black relative overflow-hidden">
        {/* Grid overlay */}
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-[0.04]" />
        {/* Glow */}
        <div className="absolute top-0 start-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-indigo-600/20 blur-3xl rounded-full" />

        <div className="relative z-10 max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white leading-tight mb-4">
            Ready to launch your next hackathon?
          </h2>
          <p className="text-lg text-gray-400 mb-10 max-w-xl mx-auto">
            Join organizations across the region using EHMS to discover talent and drive innovation.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/auth/register">
              <Button
                size="lg"
                className="h-12 px-8 bg-white text-gray-900 hover:bg-gray-100 font-semibold text-base shadow-xl hover:shadow-2xl transition-all duration-200 hover:-translate-y-0.5"
              >
                Get started — it&apos;s free
                <ArrowRight className="ms-2 w-4 h-4" />
              </Button>
            </Link>
            <Link href="/events">
              <Button
                size="lg"
                variant="outline"
                className="h-12 px-8 border-gray-700 text-gray-300 hover:border-gray-500 hover:text-white hover:bg-gray-800 text-base transition-all duration-200"
              >
                Browse events
              </Button>
            </Link>
          </div>
          <p className="mt-6 text-sm text-gray-600">
            No credit card required · Arabic &amp; English · Runs on your infrastructure
          </p>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────── */}
      <footer className="bg-gray-950 dark:bg-black border-t border-gray-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Logo */}
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-base font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                EHMS
              </span>
            </div>

            {/* Links */}
            <div className="flex items-center gap-6 text-sm text-gray-500">
              <Link href="/events" className="hover:text-gray-300 transition-colors">Events</Link>
              <Link href="/auth/login" className="hover:text-gray-300 transition-colors">Sign in</Link>
              <Link href="/auth/register" className="hover:text-gray-300 transition-colors">Register</Link>
              <Link href="/en" className="hover:text-gray-300 transition-colors">English</Link>
              <Link href="/ar" className="hover:text-gray-300 transition-colors">العربية</Link>
            </div>

            {/* Copyright */}
            <p className="text-sm text-gray-600">
              © {new Date().getFullYear()} EHMS. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
