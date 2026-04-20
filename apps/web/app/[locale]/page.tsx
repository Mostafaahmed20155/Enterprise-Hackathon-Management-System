'use client';

import { useTranslations, useLocale } from 'next-intl';
import { Link, usePathname } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  ArrowUpRight,
  Calendar,
  Users,
  Trophy,
  Globe,
  ChevronRight,
  Star,
  BarChart3,
  FileText,
  Layers,
  Sparkles,
  Zap,
  Shield,
  Clock,
  Target,
  Award,
  Code,
  Search,
  Bell,
  LayoutDashboard,
  Wallet,
  MessageSquare,
  CalendarDays,
  ListTodo,
  UserRound,
  TrendingUp,
  MapPinned,
} from 'lucide-react';

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: 'easeOut' },
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const scaleIn = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  transition: { duration: 0.5, ease: 'easeOut' },
};

export default function HomePage() {
  const t = useTranslations('home');
  const tNav = useTranslations('nav');
  const locale = useLocale();
  const isRtl = locale === 'ar';
  const pathname = usePathname();

  return (
    <div className="min-h-screen overflow-x-hidden bg-neutral-50 text-neutral-900 antialiased dark:bg-neutral-950 dark:text-neutral-50">
      {/* 60% base: neutral field · 30% hint: warm stone wash · no heavy tint */}
      <div className="fixed inset-0 -z-10 bg-gradient-to-b from-neutral-50 via-stone-50/90 to-neutral-100 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950" />
      <div
        className="fixed inset-0 -z-10 opacity-[0.2] pointer-events-none dark:opacity-[0.12]"
        style={{
          backgroundImage: `repeating-linear-gradient(
            -28deg,
            transparent,
            transparent 80px,
            rgba(255,255,255,0.35) 80px,
            rgba(255,255,255,0.35) 82px
          )`,
        }}
      />

      {/* ── Floating pill navbar (Figma) ─────────────────────── */}
      <motion.header
        initial={{ y: -24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className="fixed top-0 inset-x-0 z-50 flex justify-center pt-5 sm:pt-6 px-4 pointer-events-none"
      >
        <div className="pointer-events-auto flex w-full max-w-5xl items-center justify-between gap-3 rounded-full border border-black/[0.06] bg-white/95 px-3 py-2 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.12)] backdrop-blur-md sm:px-5">
          <Link href="/" className="flex items-center gap-2 shrink-0 group">
            <span className="relative flex h-9 w-9 items-center justify-center">
              <span className="absolute h-5 w-5 rounded-full bg-primary opacity-90 [inset-inline-start:2px] top-[6px]" />
              <span className="absolute h-5 w-5 rounded-full bg-primary/65 [inset-inline-end:2px] top-[6px]" />
            </span>
            <span className="text-[17px] font-bold tracking-tight text-neutral-950">EHMS</span>
          </Link>

          <nav className="hidden lg:flex items-center gap-0.5 text-[14px] font-medium text-neutral-800">
            {[
              { label: t('landing.navFeatures'), href: '#features' },
              { label: t('landing.navBenefit'), href: '#how-it-works' },
              { label: t('landing.navPricing'), href: '#pricing-cta' },
              { label: t('landing.navContact'), href: '#footer' },
              { label: t('landing.navFaq'), href: '#features' },
            ].map((item) => (
              <a
                key={item.href + item.label}
                href={item.href}
                className="rounded-full px-3.5 py-2 text-neutral-700 transition-colors hover:bg-neutral-100 hover:text-neutral-950"
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <Link
              href={pathname}
              locale={isRtl ? 'en' : 'ar'}
              className="hidden sm:inline-flex items-center gap-1 rounded-full px-2.5 py-1.5 text-xs font-medium text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-950"
            >
              <Globe className="h-3.5 w-3.5" />
              {isRtl ? 'English' : 'العربية'}
            </Link>
            <Link href="/auth/login" className="hidden sm:inline">
              <Button variant="ghost" size="sm" className="rounded-full text-sm text-neutral-700 hover:bg-neutral-100">
                {tNav('login')}
              </Button>
            </Link>
            <Link href="/auth/register">
              <Button
                size="sm"
                className="rounded-full border-0 bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 sm:px-5"
              >
                {t('landing.navCta')}
              </Button>
            </Link>
          </div>
        </div>
      </motion.header>

      {/* ── Hero + product mock (Figma Obliq-style, EHMS content) ─ */}
      <section className="relative flex flex-col items-center overflow-hidden pb-10 pt-28 sm:pt-32">
        {/* Hero-only ambient glow + soft grid (premium landing kit) */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 z-0 h-[min(85vh,920px)]"
          aria-hidden
        >
          <div className="absolute left-1/2 top-8 h-[420px] w-[min(100vw,720px)] -translate-x-1/2 rounded-full bg-primary/[0.06] blur-[100px] sm:top-12 sm:h-[480px] dark:bg-primary/[0.08]" />
          <div className="absolute end-0 top-1/3 h-64 w-64 rounded-full bg-stone-200/40 blur-3xl sm:end-[8%] dark:bg-neutral-800/40" />
          <div className="absolute start-0 top-1/2 h-56 w-56 rounded-full bg-neutral-200/35 blur-3xl sm:start-[5%] dark:bg-neutral-800/30" />
          <div
            className="absolute inset-x-4 top-24 mx-auto max-w-4xl rounded-[2rem] border border-neutral-200/80 opacity-70 sm:inset-x-8 sm:top-28 dark:border-neutral-700/50"
            style={{
              backgroundImage: `linear-gradient(to right, rgba(0,0,0,0.04) 1px, transparent 1px),
                linear-gradient(to bottom, rgba(0,0,0,0.04) 1px, transparent 1px)`,
              backgroundSize: '28px 28px',
            }}
          />
        </div>

        <motion.div
          initial="initial"
          animate="animate"
          variants={staggerContainer}
          className="relative z-10 mx-auto max-w-4xl px-4 text-center sm:px-6"
        >
          {/* Eyebrow — matches SaaS kit hero badge above headline */}
          <motion.div
            variants={fadeInUp}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-700 shadow-sm backdrop-blur-sm dark:border-neutral-700 dark:bg-neutral-900/80 dark:text-neutral-200"
          >
            <Sparkles className="h-4 w-4 shrink-0 text-primary" aria-hidden />
            <span>
              <span className="text-primary font-semibold">EHMS</span>
              <span className="text-neutral-500 dark:text-neutral-400"> — {t('landing.heroEyebrow')}</span>
            </span>
          </motion.div>

          <motion.h1
            variants={fadeInUp}
            className="mb-5 text-balance text-4xl font-extrabold leading-[1.08] tracking-tight text-neutral-950 sm:text-5xl md:text-6xl lg:text-[3.35rem] lg:leading-[1.06]"
          >
            <span className="block">{t('landing.headlineLine1')}</span>
            <span className="block">{t('landing.headlineLine2')}</span>
          </motion.h1>

          <motion.p
            variants={fadeInUp}
            className="mx-auto mb-9 max-w-2xl text-pretty text-base font-medium leading-relaxed text-neutral-500 sm:text-lg md:text-xl"
          >
            {t('hero.description')}
          </motion.p>

          <motion.div variants={fadeInUp} className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link href="/auth/register">
              <Button
                size="lg"
                className="group h-12 gap-2 rounded-xl border-0 bg-primary px-8 text-base font-semibold text-primary-foreground shadow-xl transition-transform hover:scale-[1.02] hover:bg-primary/90 sm:h-14 sm:px-10 sm:text-lg"
              >
                {t('landing.primaryCta')}
                <ArrowUpRight className="h-5 w-5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </Button>
            </Link>
            <Link href="/events">
              <Button
                size="lg"
                variant="outline"
                className="h-12 rounded-xl border-neutral-200 bg-white/80 px-8 text-base font-medium text-neutral-800 shadow-sm hover:bg-white sm:h-14 sm:px-10 sm:text-lg"
              >
                {t('hero.browseEvents')}
                <ChevronRight className="ms-1 h-5 w-5 opacity-50" />
              </Button>
            </Link>
          </motion.div>

          <motion.p variants={fadeInUp} className="mt-6 text-sm text-neutral-500">
            {t('landing.trustLine')}
          </motion.p>

          {/* Rating + social proof row (Figma hero group) */}
          <motion.div
            variants={fadeInUp}
            className="mt-10 flex flex-col items-center justify-center gap-5 sm:flex-row sm:gap-8"
          >
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-0.5" aria-label="4.9 out of 5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className="h-4 w-4 text-amber-400 fill-amber-400 sm:h-[18px] sm:w-[18px]"
                    aria-hidden
                  />
                ))}
              </div>
              <p className="text-sm text-neutral-600">
                <span className="font-bold tabular-nums text-neutral-900">4.9</span>
                <span className="font-medium">{t('landing.heroRatingSuffix')}</span>
              </p>
            </div>

            <div className="hidden h-8 w-px bg-neutral-200 sm:block dark:bg-neutral-700" aria-hidden />

            <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-center sm:gap-3">
              <div className="flex shrink-0 [&>*+*]:-ms-2.5" role="presentation">
                {['A', 'M', 'S', 'K'].map((letter, i) => (
                  <div
                    key={letter}
                    className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-neutral-100 text-xs font-bold text-neutral-600 ring-1 ring-neutral-200/90 dark:border-neutral-950 dark:bg-neutral-800 dark:text-neutral-300 dark:ring-neutral-700"
                  >
                    {letter}
                  </div>
                ))}
              </div>
              <p className="max-w-xs text-center text-sm leading-snug text-neutral-600 sm:max-w-none sm:text-start">
                <span className="font-bold text-neutral-900">{t('landing.socialProofHighlight')}</span>{' '}
                {t('landing.socialProofRest')}
              </p>
            </div>
          </motion.div>
        </motion.div>

        {/* Dashboard UI mock — layout mirrors Figma CRM preview */}
        <motion.div
          initial={{ opacity: 0, y: 48 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.75, delay: 0.2, ease: 'easeOut' }}
          className="relative z-10 mt-12 w-full max-w-6xl px-4 sm:mt-16 sm:px-6"
        >
          <div className="overflow-hidden rounded-2xl border border-black/[0.06] bg-white shadow-[0_32px_80px_-24px_rgba(0,0,0,0.18)] sm:rounded-3xl">
            <div
              className={`flex min-h-[320px] flex-col md:min-h-[380px] lg:flex-row ${isRtl ? 'lg:flex-row-reverse' : ''}`}
            >
              {/* Sidebar */}
              <aside className="flex w-full shrink-0 flex-col border-b border-neutral-200 bg-[#F4F4F5] lg:w-[220px] lg:border-b-0 lg:border-e lg:border-neutral-200">
                <div className="border-b border-neutral-200/80 px-4 py-4">
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-neutral-400">
                    {t('landing.sidebarPages')}
                  </p>
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2 rounded-lg bg-primary px-2.5 py-2 text-sm font-semibold text-primary-foreground">
                      <LayoutDashboard className="h-4 w-4 shrink-0" />
                      {t('landing.navDashboard')}
                    </div>
                    <div className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-medium text-neutral-600 hover:bg-white/60">
                      <BarChart3 className="h-4 w-4 shrink-0 text-neutral-400" />
                      {t('landing.navAnalytics')}
                    </div>
                    <div className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-medium text-neutral-600 hover:bg-white/60">
                      <Calendar className="h-4 w-4 shrink-0 text-neutral-400" />
                      {t('landing.navEvents')}
                    </div>
                  </div>
                </div>
                <div className="border-b border-neutral-200/80 px-4 py-3">
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-neutral-400">
                    {t('landing.sidebarApps')}
                  </p>
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-medium text-neutral-600 hover:bg-white/60">
                      <Wallet className="h-4 w-4 shrink-0 text-neutral-400" />
                      {t('landing.navFinance')}
                    </div>
                    <div className="relative flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-medium text-neutral-600 hover:bg-white/60">
                      <MessageSquare className="h-4 w-4 shrink-0 text-neutral-400" />
                      {t('landing.navMessages')}
                      <span className="ms-auto rounded-md bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground">
                        {t('landing.messagesBadge')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-medium text-neutral-600 hover:bg-white/60">
                      <CalendarDays className="h-4 w-4 shrink-0 text-neutral-400" />
                      {t('landing.navCalendar')}
                    </div>
                    <div className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-medium text-neutral-600 hover:bg-white/60">
                      <ListTodo className="h-4 w-4 shrink-0 text-neutral-400" />
                      {t('landing.navTasks')}
                    </div>
                  </div>
                </div>
                <div className="px-4 py-3">
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-neutral-400">
                    {t('landing.sidebarSettings')}
                  </p>
                  <div className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-medium text-neutral-600 hover:bg-white/60">
                    <UserRound className="h-4 w-4 shrink-0 text-neutral-400" />
                    {t('landing.navProfile')}
                  </div>
                </div>
              </aside>

              {/* Main panel */}
              <div className="flex min-w-0 flex-1 flex-col bg-white">
                <div className="flex flex-wrap items-center gap-3 border-b border-neutral-100 px-4 py-3 sm:px-5">
                  <div className="flex min-w-0 flex-1 items-center gap-2 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-400">
                    <Search className="h-4 w-4 shrink-0" />
                    <span className="truncate">{t('landing.searchPlaceholder')}</span>
                  </div>
                  <button
                    type="button"
                    className="rounded-lg p-2 text-neutral-500 hover:bg-neutral-100"
                    aria-label="Notifications"
                  >
                    <Bell className="h-5 w-5" />
                  </button>
                  <div className="flex items-center gap-2 rounded-lg ps-1">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                      FA
                    </div>
                    <div className="hidden text-start sm:block leading-tight">
                      <p className="text-sm font-semibold text-neutral-900">{t('landing.userName')}</p>
                      <p className="text-[11px] text-neutral-400">{t('landing.organizerRole')}</p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-1 flex-col gap-4 p-4 sm:p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h2 className="text-lg font-bold text-neutral-900 sm:text-xl">{t('landing.dashboardTitle')}</h2>
                    <Button size="sm" className="rounded-lg border-0 bg-primary font-semibold text-primary-foreground shadow-sm hover:bg-primary/90">
                      {t('landing.addProduct')}
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                    {[
                      { label: t('landing.statUsers'), value: '50,789', delta: '8.5%' },
                      { label: t('landing.statPending'), value: '5,040', delta: '1.8%' },
                      { label: t('landing.statOrders'), value: '20,393', delta: '1.3%' },
                      { label: t('landing.statSales'), value: '128', delta: '4.3%' },
                    ].map((s) => (
                      <div
                        key={s.label}
                        className="rounded-xl border border-neutral-100 bg-neutral-50/80 p-3 sm:p-4"
                      >
                        <div className="mb-2 flex items-center justify-between gap-2">
                          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                            <TrendingUp className="h-4 w-4" />
                          </span>
                          <span className="flex items-center gap-0.5 text-[11px] font-semibold text-amber-700">
                            <TrendingUp className="h-3 w-3" />
                            {s.delta}
                          </span>
                        </div>
                        <p className="text-[11px] font-medium text-neutral-500 sm:text-xs">{s.label}</p>
                        <p className="mt-1 text-lg font-bold tabular-nums text-neutral-900 sm:text-xl">{s.value}</p>
                      </div>
                    ))}
                  </div>

                  <div className="grid flex-1 grid-cols-1 gap-3 lg:grid-cols-12">
                    <div className="rounded-xl border border-neutral-100 bg-neutral-50/50 p-4 lg:col-span-8">
                      <p className="mb-4 text-sm font-semibold text-neutral-800">{t('landing.chartTitle')}</p>
                      <div className="flex h-36 items-end justify-between gap-1.5 sm:h-44 sm:gap-2">
                        {[40, 55, 48, 70, 62, 85, 78, 92, 68, 88, 95, 82].map((h, i) => (
                          <div key={i} className="flex flex-1 flex-col items-center justify-end gap-1">
                            <div
                              className={`w-full max-w-[28px] rounded-t-md sm:max-w-[36px] ${i % 3 === 0 ? 'bg-primary' : 'bg-primary/40'}`}
                              style={{ height: `${h}%` }}
                            />
                          </div>
                        ))}
                      </div>
                      <div className="mt-3 flex flex-wrap gap-4 border-t border-neutral-200/80 pt-3 text-[11px] text-neutral-500">
                        <span className="flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-full bg-primary" />
                          {t('landing.chartLegendRegistrations')}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-full bg-neutral-400" />
                          {t('landing.chartLegendSubmissions')}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col rounded-xl border border-neutral-100 bg-gradient-to-b from-neutral-50 to-white p-4 lg:col-span-4">
                      <p className="text-sm font-semibold text-neutral-800">{t('landing.mapTitle')}</p>
                      <p className="text-[11px] text-neutral-400">{t('landing.mapSubtitle')}</p>
                      <div className="relative mt-3 flex flex-1 min-h-[140px] items-center justify-center overflow-hidden rounded-lg bg-orange-50/80 dark:bg-orange-950/20">
                        <MapPinned className="absolute opacity-[0.07] h-32 w-32 text-neutral-900" />
                        <div className="relative grid w-full grid-cols-3 gap-2 p-3">
                          {[0, 1, 2, 3, 4, 5].map((i) => (
                            <div
                              key={i}
                              className="flex h-10 items-center justify-center rounded-md border border-white/80 bg-white/90 text-[10px] font-semibold text-neutral-600 shadow-sm"
                            >
                              {['RUH', 'DXB', 'CAI', 'DOH', 'KWI', 'JED'][i]}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Trusted-by strip — 30% white band, logos neutral (template) */}
      <section
        id="trusted"
        className="border-y border-neutral-200 bg-white py-12 dark:border-neutral-800 dark:bg-neutral-900/50 sm:py-14"
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <p className="text-center text-[11px] font-bold uppercase tracking-[0.2em] text-neutral-500 dark:text-neutral-400">
            {t('landing.logosTitle')}
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-10 gap-y-5 sm:gap-x-14">
            {(['logo1', 'logo2', 'logo3', 'logo4', 'logo5', 'logo6'] as const).map((key) => (
              <span
                key={key}
                className="text-sm font-semibold tracking-tight text-neutral-400 dark:text-neutral-500"
              >
                {t(`landing.${key}`)}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Stats — 60% typography, 30% surface, 10% accent rule */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="border-b border-neutral-200 bg-neutral-100/90 py-16 dark:border-neutral-800 dark:bg-neutral-900/30"
      >
        <div className="mx-auto max-w-6xl px-4">
          <div className="mx-auto mb-10 h-1 max-w-xs rounded-full bg-primary" aria-hidden />
          <div className="grid grid-cols-2 gap-10 text-center md:grid-cols-4 md:gap-8">
            {(
              [
                ['stripStat1n', 'stripStat1l'],
                ['stripStat2n', 'stripStat2l'],
                ['stripStat3n', 'stripStat3l'],
                ['stripStat4n', 'stripStat4l'],
              ] as const
            ).map(([nk, lk]) => (
              <div key={lk} className="space-y-1">
                <p className="text-3xl font-bold tabular-nums text-neutral-900 md:text-4xl dark:text-white">
                  {t(`landing.${nk}`)}
                </p>
                <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">{t(`landing.${lk}`)}</p>
              </div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* ── Features — Bento (60% surfaces · 10% primary accents) ─ */}
      <section id="features" className="bg-neutral-50 py-24 dark:bg-neutral-950">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="mb-16 text-center"
          >
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-neutral-500 dark:text-neutral-400">
              <span className="text-primary">{t('landing.featuresKicker')}</span>
              <span className="text-neutral-400"> · </span>
              <span>{t('landing.navFeatures')}</span>
            </p>
            <h2 className="mb-4 text-3xl font-bold leading-tight text-neutral-900 md:text-4xl dark:text-white">
              {t('features.title')}
            </h2>
            <p className="mx-auto max-w-xl text-lg text-neutral-600 dark:text-neutral-400">
              {t('landing.featuresSubtitle')}
            </p>
          </motion.div>

          {/* Bento grid */}
          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 auto-rows-[minmax(180px,auto)]"
          >
            {/* Large card — Event Management */}
            <motion.div
              variants={scaleIn}
              className="md:col-span-2 md:row-span-2 group relative rounded-2xl border border-border/50 bg-card p-8 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 overflow-hidden"
            >
              <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative z-10">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-5 group-hover:bg-primary/15 transition-colors">
                  <Calendar className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-3">
                  {t('features.events.title')}
                </h3>
                <p className="text-muted-foreground leading-relaxed mb-6">
                  {t('features.events.description')}
                </p>
                <div className="flex flex-wrap gap-2">
                  {['State machine', 'Bilingual', 'Timeline', 'Phases'].map((tag) => (
                    <span key={tag} className="px-3 py-1 text-xs font-medium rounded-full bg-secondary/60 text-muted-foreground border border-border/30">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Teams */}
            <motion.div
              variants={scaleIn}
              className="group relative rounded-2xl border border-border/50 bg-card p-6 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 overflow-hidden"
            >
              <div className="absolute inset-0 bg-orange-400/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative z-10">
                <div className="w-10 h-10 rounded-xl bg-orange-400/10 flex items-center justify-center mb-4 group-hover:bg-orange-400/15 transition-colors">
                  <Users className="w-5 h-5 text-orange-500" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">
                  {t('features.teams.title')}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {t('features.teams.description')}
                </p>
              </div>
            </motion.div>

            {/* Judging */}
            <motion.div
              variants={scaleIn}
              className="group relative rounded-2xl border border-border/50 bg-card p-6 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 overflow-hidden"
            >
              <div className="absolute inset-0 bg-amber-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative z-10">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center mb-4 group-hover:bg-amber-500/15 transition-colors">
                  <Trophy className="w-5 h-5 text-amber-600" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">
                  {t('features.judging.title')}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {t('features.judging.description')}
                </p>
              </div>
            </motion.div>

            {/* Submissions */}
            <motion.div
              variants={scaleIn}
              className="group relative rounded-2xl border border-border/50 bg-card p-6 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 overflow-hidden"
            >
              <div className="absolute inset-0 bg-orange-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative z-10">
                <div className="w-10 h-10 rounded-xl bg-orange-600/10 flex items-center justify-center mb-4 group-hover:bg-orange-600/15 transition-colors">
                  <FileText className="w-5 h-5 text-orange-700" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">
                  Submission Management
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Structured project submissions with file uploads and bilingual descriptions.
                </p>
              </div>
            </motion.div>

            {/* Security */}
            <motion.div
              variants={scaleIn}
              className="group relative rounded-2xl border border-border/50 bg-card p-6 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 overflow-hidden"
            >
              <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative z-10">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/15 transition-colors">
                  <Shield className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">
                  Enterprise Security
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Role-based access control, JWT authentication, and secure data handling.
                </p>
              </div>
            </motion.div>

            {/* Bilingual — wide card */}
            <motion.div
              variants={scaleIn}
              className="md:col-span-2 group relative rounded-2xl border border-border/50 bg-card p-6 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 overflow-hidden"
            >
              <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative z-10 flex items-center gap-6">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/15 transition-colors">
                  <Globe className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground mb-1">
                    Bilingual — AR + EN
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Full Arabic RTL and English LTR support. Arabic is a first-class citizen.
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── How it works ──────────────────────────────────────── */}
      <section id="how-it-works" className="py-24 bg-secondary/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="text-center mb-16"
          >
            <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-3">
              How it works
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              From idea to award
            </h2>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              Four simple steps to run a world-class hackathon.
            </p>
          </motion.div>

          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-4"
          >
            {[
              {
                step: '01',
                icon: Layers,
                title: 'Create an event',
                desc: 'Set up your hackathon with bilingual content, timelines, and state-machine driven phases.',
                hoverBg: 'bg-primary/5',
                iconColor: 'text-primary',
              },
              {
                step: '02',
                icon: Users,
                title: 'Teams form up',
                desc: 'Participants register, form teams, invite members by email, and collaborate.',
                hoverBg: 'bg-orange-400/5',
                iconColor: 'text-orange-500',
              },
              {
                step: '03',
                icon: Code,
                title: 'Projects submitted',
                desc: 'Teams submit their projects with descriptions, links, and file attachments.',
                hoverBg: 'bg-amber-500/5',
                iconColor: 'text-amber-600',
              },
              {
                step: '04',
                icon: Award,
                title: 'Judged & ranked',
                desc: 'Assigned judges score submissions with custom criteria. Live leaderboard.',
                hoverBg: 'bg-orange-600/5',
                iconColor: 'text-orange-700',
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.step}
                  variants={scaleIn}
                  className="group relative rounded-2xl border border-border/50 bg-card p-6 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300"
                >
                  <div className={`absolute inset-0 ${item.hoverBg} opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl`} />
                  <div className="relative z-10">
                    <p className="text-xs font-bold text-primary/60 mb-3 tracking-widest">{item.step}</p>
                    <div className="w-10 h-10 rounded-xl bg-secondary/60 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <Icon className={`w-5 h-5 ${item.iconColor}`} />
                    </div>
                    <h3 className="text-lg font-bold text-foreground mb-2">{item.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* ── Why EHMS — Bento Grid ─────────────────────────────── */}
      <section className="py-24 bg-background">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="text-center mb-16"
          >
            <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-3">
              Why EHMS?
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground leading-tight">
              Built for enterprise scale
            </h2>
          </motion.div>

          {/* Bento grid for features */}
          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-3 gap-4"
          >
            {/* Large card — Testimonial */}
            <motion.div
              variants={scaleIn}
              className="md:col-span-2 md:row-span-2 group relative rounded-2xl border border-border/50 bg-card p-8 hover:shadow-xl transition-all duration-300 overflow-hidden"
            >
              <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative z-10">
                <div className="flex gap-1 mb-6">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <blockquote className="text-lg text-foreground/90 leading-relaxed mb-8">
                  &ldquo;Running our national hackathon used to require five different tools. EHMS replaced all of them — and the Arabic support is genuinely excellent, not an afterthought.&rdquo;
                </blockquote>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                    FH
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Fatima Hassan</p>
                    <p className="text-xs text-muted-foreground">Innovation Director, Riyadh Tech Hub</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Feature cards */}
            {[
              {
                icon: Globe,
                title: 'Full RTL + LTR',
                desc: 'Arabic and English with a single codebase',
                hoverBg: 'bg-primary/5',
                iconColor: 'text-primary',
              },
              {
                icon: Target,
                title: 'State machine',
                desc: 'Every phase on track automatically',
                hoverBg: 'bg-orange-400/5',
                iconColor: 'text-orange-500',
              },
              {
                icon: Shield,
                title: 'RBAC',
                desc: 'Organizers, judges, participants — scoped access',
                hoverBg: 'bg-amber-500/5',
                iconColor: 'text-amber-600',
              },
              {
                icon: Zap,
                title: 'Live leaderboard',
                desc: 'Real-time scoring as judges submit',
                hoverBg: 'bg-orange-600/5',
                iconColor: 'text-orange-700',
              },
              {
                icon: Clock,
                title: 'Setup time',
                desc: 'Under 5 minutes to launch',
                hoverBg: 'bg-amber-600/5',
                iconColor: 'text-amber-700',
              },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.title}
                  variants={scaleIn}
                  className={`group relative rounded-2xl border border-border/50 bg-card p-6 hover:shadow-xl transition-all duration-300 overflow-hidden ${
                    i === 4 ? 'md:col-span-2' : ''
                  }`}
                >
                  <div className={`absolute inset-0 ${item.hoverBg} opacity-0 group-hover:opacity-100 transition-opacity`} />
                  <div className="relative z-10 flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-secondary/60 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                      <Icon className={`w-5 h-5 ${item.iconColor}`} />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-foreground mb-1">{item.title}</h3>
                      <p className="text-sm text-muted-foreground">{item.desc}</p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* ── Final CTA ─────────────────────────────────────────── */}
      <section id="pricing-cta" className="py-24 relative overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-primary" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:32px_32px]" />
        <div className="absolute top-0 start-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 end-1/4 w-80 h-80 bg-white/5 rounded-full blur-3xl" />

        <motion.div
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          variants={fadeInUp}
          className="relative z-10 max-w-3xl mx-auto px-4 text-center"
        >
          <h2 className="text-3xl md:text-5xl font-bold text-white leading-tight mb-6">
            Ready to launch your next hackathon?
          </h2>
          <p className="text-lg text-white/80 mb-12 max-w-xl mx-auto">
            Join organizations across the region using EHMS to discover talent and drive innovation.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/auth/register">
              <Button
                size="lg"
                className="h-14 px-10 bg-white text-primary hover:bg-white/90 font-semibold text-lg shadow-xl shadow-black/10 transition-all duration-200"
              >
                Get started — it&apos;s free
                <ArrowRight className="ms-2 w-5 h-5" />
              </Button>
            </Link>
            <Link href="/events">
              <Button
                size="lg"
                variant="outline"
                className="h-14 px-10 border-white/30 text-white hover:border-white/60 hover:bg-white/10 text-lg transition-all duration-200"
              >
                Browse events
              </Button>
            </Link>
          </div>
          <p className="mt-8 text-sm text-white/60">
            No credit card required · Arabic &amp; English · Runs on your infrastructure
          </p>
        </motion.div>
      </section>

      {/* ── Footer ────────────────────────────────────────────── */}
      <footer id="footer" className="bg-card border-t border-border/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Logo */}
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center shadow-md shadow-primary/20">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="text-base font-bold text-foreground">
                EHMS
              </span>
            </div>

            {/* Links */}
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <Link href="/events" className="hover:text-foreground transition-colors">Events</Link>
              <Link href="/auth/login" className="hover:text-foreground transition-colors">Sign in</Link>
              <Link href="/auth/register" className="hover:text-foreground transition-colors">Register</Link>
              <Link href="/en" className="hover:text-foreground transition-colors">English</Link>
              <Link href="/ar" className="hover:text-foreground transition-colors">العربية</Link>
            </div>

            {/* Copyright */}
            <p className="text-sm text-muted-foreground/60">
              &copy; {new Date().getFullYear()} EHMS. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
