'use client';

import { useEffect, useState } from 'react';
import { useLocale } from 'next-intl';
import { Link, usePathname } from '@/i18n/routing';
import {
  BarChart3,
  Calendar,
  CreditCard,
  DollarSign,
  Globe,
  Heart,
  LayoutDashboard,
  MessageSquare,
  Settings,
  Sparkles,
  Trophy,
  Users,
  Zap,
} from 'lucide-react';

const brandLogos = [
  { name: 'Atlas Labs', tone: 'circle' },
  { name: 'Northwind', tone: 'diamond' },
  { name: 'Forma', tone: 'accent' },
  { name: 'PrismIQ', tone: 'square' },
  { name: 'Helix', tone: 'outline' },
  { name: 'Quantum U.', tone: 'ink-circle' },
] as const;

const featureIcons = [Users, Trophy, Calendar, MessageSquare, BarChart3, CreditCard] as const;
const whyIcons = [Sparkles, Zap, Heart, DollarSign] as const;

const networkNodes = [
  { label: 'NA', highlight: true, style: { insetInlineStart: '14%', top: '22%' } },
  { label: 'EU', highlight: false, style: { insetInlineStart: '72%', top: '18%' } },
  { label: 'APAC', highlight: false, style: { insetInlineStart: '82%', top: '58%' } },
  { label: 'LATAM', highlight: false, style: { insetInlineStart: '22%', top: '70%' } },
  { label: 'IN', highlight: true, style: { insetInlineStart: '54%', top: '82%' } },
] as const;

const homeCopy = {
  en: {
    navLinks: [
      { href: '#features', label: 'Features' },
      { href: '#workflow', label: 'Workflow' },
      { href: '#why', label: 'Why EHMS' },
      { href: '#enterprise', label: 'Enterprise' },
      { href: '#faq', label: 'FAQ' },
    ],
    nav: {
      signIn: 'Sign in',
      cta: 'Sign up',
      switchLabel: 'العربية',
    },
    hero: {
      pillTag: 'NEW',
      pillText: 'Real-time judging & automated scoring - now live',
      titleLine1: 'Transform hackathon',
      titleLine2: 'operations with',
      titleAccent: 'next-gen',
      titleLine3: 'event software.',
      description:
        'EHMS is the operating system for modern hackathons and innovation events. Registrations, teams, judging, analytics - unified in a single, enterprise-grade workspace.',
      primaryCta: 'Start free trial',
      secondaryCta: 'See how it works',
      meta: ['14-day free trial', 'No credit card required', 'SOC 2 compliant'],
    },
    dashboard: {
      callouts: [
        {
          label: 'REGISTRATIONS',
          main: '+248 today',
          sub: 'Target 84% reached',
        },
        {
          label: 'JUDGING ROUND',
          main: 'Round 2 - In progress',
          sub: '14 of 32 scored',
        },
      ],
      breadcrumb: 'Global Innovate 2026',
      workspaceLabel: 'Workspace',
      adminLabel: 'Admin',
      menu: {
        overview: 'Overview',
        participants: 'Participants',
        schedule: 'Schedule',
        judging: 'Judging',
        analytics: 'Analytics',
        settings: 'Settings',
        badge: '1.2k',
      },
      title: 'Participant Overview',
      subtitle: 'Live event metrics, updated every 15s',
      filters: ['All', 'Today', '7d', '30d'],
      stats: [
        {
          label: 'Registered',
          value: '1,248',
          delta: '12.4%',
          bars: [40, 55, 48, 72, 60, 88, 70],
        },
        {
          label: 'Teams',
          value: '312',
          delta: '6.1%',
          bars: [30, 44, 55, 60, 72, 80, 68],
        },
        {
          label: 'Submissions',
          value: '184',
          delta: '22.0%',
          bars: [20, 30, 40, 50, 65, 92, 80],
        },
        {
          label: 'Judges active',
          value: '42',
          delta: '3',
          bars: [40, 48, 50, 62, 70, 85, 78],
        },
      ],
      engagementTitle: 'Engagement timeline',
      engagementDate: 'Apr 18-21',
      liveTitle: 'Live activity',
      liveState: 'LIVE',
      activity: [
        { highlight: 'Team Delta', text: 'submitted', time: '14:22', muted: false },
        { highlight: 'Judge M.', text: 'scored Round 2', time: '14:19', muted: false },
        { highlight: '12 new', text: 'registrations', time: '14:11', muted: true },
        { highlight: 'Workshop B', text: 'started', time: '14:00', muted: true },
      ],
    },
    logosLabel: 'Trusted by innovation teams, universities & developer communities worldwide',
    featuresSection: {
      eyebrow: '01 - Features',
      title: 'Everything you need,',
      accent: "nothing you don't.",
      description:
        'Six purpose-built modules replace the patchwork of spreadsheets, Slack threads, and disconnected tools that slow event ops down.',
    },
    features: {
      cards: [
        {
          title: 'Smart registration & teams',
          description:
            'Dynamic forms, automatic team matching, and waitlist management. Onboard 10 or 10,000 participants without breaking a sweat.',
        },
        {
          title: 'Judging & scoring engine',
          description:
            'Configurable rubrics, blind review, and conflict detection. Judges rate on any device; results roll up instantly.',
        },
        {
          title: 'Unified scheduling',
          description: 'Tracks, workshops, keynotes - all in one timeline with conflict detection.',
        },
        {
          title: 'In-app communications',
          description: 'Announcements, team chat, judge DMs - no more Discord duct tape.',
        },
        {
          title: 'Realtime analytics',
          description:
            'Engagement, drop-off, demographics - every metric your sponsors will ask about.',
        },
        {
          title: 'Sponsor & payments',
          description:
            'Tiered pricing, prize payouts, sponsor invoicing - all tracked and auditable.',
        },
      ],
      registrationRows: [
        {
          initials: 'AK',
          accent: '',
          label: 'Ava Kim · Team Delta',
          state: 'Confirmed',
          queued: false,
        },
        {
          initials: 'MO',
          accent: 'soft',
          label: 'Mateo Ortiz · Team Orbit',
          state: 'Confirmed',
          queued: false,
        },
        {
          initials: 'SR',
          accent: 'cool',
          label: 'Sana Raza · matching...',
          state: 'Queued',
          queued: true,
        },
        {
          initials: 'JT',
          accent: 'warm',
          label: 'Jordan T. · Team Helix',
          state: 'Confirmed',
          queued: false,
        },
      ],
      judgingScores: [
        { label: 'Innovation', score: '8.6', width: '86%' },
        { label: 'Execution', score: '9.2', width: '92%' },
        { label: 'Impact', score: '7.8', width: '78%' },
        { label: 'Design', score: '8.8', width: '88%' },
      ],
      scheduleLabels: ['Keynote', 'Hack Sprint', 'Mentor hours'],
      messages: [
        'Round 2 kicks off in 10 min - submit your prototype.',
        'On it - pushing final commit now.',
      ],
      analyticsHeights: ['30%', '55%', '42%', '68%', '58%', '80%', '95%', '72%', '62%'],
      payments: [
        { label: 'Registrations', value: '$12,480' },
        { label: 'Sponsor tier A', value: '$45,000' },
        { label: 'Add-ons', value: '$2,120' },
      ],
      totalLabel: 'Collected',
      totalValue: '$59,600',
    },
    workflow: {
      eyebrow: '02 - Workflow',
      title: 'Ship an event in',
      accent: 'five steps.',
      description:
        'From first draft to awards ceremony, EHMS guides your team through a proven operational playbook.',
      steps: [
        {
          step: '01',
          title: 'Configure',
          description:
            'Spin up your event in minutes - branding, tracks, rubric, and registration flow.',
        },
        {
          step: '02',
          title: 'Launch',
          description: 'Open registrations with a branded landing page and automated onboarding.',
        },
        {
          step: '03',
          title: 'Operate',
          description: 'Run the live event - schedule, communications, submissions, mentor hours.',
        },
        {
          step: '04',
          title: 'Judge',
          description: 'Assign judges, collect scores, and manage multi-round evaluation securely.',
        },
        {
          step: '05',
          title: 'Award',
          description: 'Announce winners, distribute prizes, and export the complete event report.',
        },
      ],
    },
    lifecycle: {
      eyebrow: '03 - Lifecycle',
      title: 'From idea to',
      accent: 'award.',
      description:
        'EHMS is the single system of record for every stage of your event - before, during, and after.',
      cardEyebrow: 'LIFECYCLE',
      leftTitle: 'Every milestone,',
      leftAccent: 'one timeline.',
      leftDescription:
        'Stop switching between six tools. EHMS captures every action, score, and artifact in a single event record.',
      journey: [
        { label: 'WEEK -6', title: 'Brief approved & event configured', done: true },
        { label: 'WEEK -4', title: 'Registrations open · sponsors confirmed', done: true },
        { label: 'WEEK -1', title: 'Judges onboarded · rubrics published', done: true },
        { label: 'DAY 0-2', title: 'Live event · 1,248 participants active', done: true },
        { label: 'DAY 3', title: 'Final judging & awards ceremony', done: false },
      ],
      awardsLabel: 'Awards · Global Innovate 2026',
      awardsState: 'FINALIZED',
      awards: [
        {
          rank: '1',
          tone: 'gold',
          name: 'Team Delta',
          project: 'AI-driven flood forecasting',
          prize: '$25,000',
        },
        {
          rank: '2',
          tone: 'silver',
          name: 'Team Orbit',
          project: 'Supply-chain transparency API',
          prize: '$12,000',
        },
        {
          rank: '3',
          tone: 'bronze',
          name: 'Team Helix',
          project: 'Elder-care companion app',
          prize: '$6,000',
        },
      ],
      certificatesTitle: 'Certificates auto-generated',
      certificatesBody: '1,248 personalized PDFs · delivered via email',
      certificatesCta: 'Preview',
    },
    why: {
      eyebrow: '04 - Why EHMS',
      title: 'Measurable outcomes,',
      accent: 'from day one.',
      description:
        'Teams that switch to EHMS consistently cut operational overhead while scaling program impact.',
      cards: [
        {
          value: '78',
          suffix: '%',
          title: 'Less operational overhead',
          description:
            'Replace spreadsheets, email chains, and five scattered tools with a single workspace.',
        },
        {
          value: '3.4',
          suffix: 'x',
          title: 'Faster event launch',
          description:
            'Go from brief to registration-open in days, not weeks, with reusable event templates.',
        },
        {
          value: '94',
          suffix: '%',
          title: 'Participant satisfaction',
          description:
            'Clear communication, reliable scheduling, and a polished judging experience.',
        },
        {
          value: '$0',
          suffix: '',
          title: 'Hidden add-ons',
          description:
            'Transparent, usage-based pricing. Every feature included - no premium tier gatekeeping.',
        },
      ],
    },
    enterprise: {
      eyebrow: '05 - Enterprise',
      title: 'Built for',
      accent: 'enterprise scale.',
      description:
        "Security, compliance, and global infrastructure - engineered to run flagship programs for the world's most demanding organizations.",
      leftTitle: 'Security & compliance,',
      leftAccent: 'non-negotiable.',
      leftDescription:
        'EHMS is hardened for organizations that cannot compromise on governance. From SOC 2 audits to regional data residency, every layer is designed to meet enterprise review.',
      bullets: [
        {
          title: 'SOC 2 Type II & ISO 27001',
          body: 'independently audited controls across the platform.',
        },
        {
          title: 'SSO, SCIM & RBAC',
          body: 'plug into Okta, Azure AD, and Google Workspace in minutes.',
        },
        {
          title: 'Data residency',
          body: 'US, EU, APAC and India regions with full audit logs.',
        },
        {
          title: '99.99% uptime SLA',
          body: 'multi-region failover with 24/7 on-call support.',
        },
      ],
      nodeLabel: '5 regions · 42 edge nodes',
    },
    faq: {
      eyebrow: '06 - FAQ',
      title: 'Questions,',
      accent: 'answered.',
      description:
        "Can't find what you're looking for? Our team responds to every inquiry within four business hours.",
      items: [
        {
          question: 'How long does it take to launch an event on EHMS?',
          answer:
            'Most teams go from brief to open registrations within 48 hours. Reusable event templates and our onboarding specialists accelerate subsequent programs to under a day.',
        },
        {
          question: 'Can EHMS handle both in-person and virtual hackathons?',
          answer:
            'Yes. EHMS supports in-person, hybrid, and fully virtual formats from the same workspace - with built-in check-in, venue maps, streaming integrations, and virtual team rooms.',
        },
        {
          question: "Is my data and my participants' data secure?",
          answer:
            'EHMS is SOC 2 Type II certified, ISO 27001 compliant, and GDPR-ready. Data is encrypted at rest and in transit, with regional residency options across US, EU, APAC, and India.',
        },
        {
          question: 'What integrations are supported out of the box?',
          answer:
            'Native integrations include Slack, Microsoft Teams, Zoom, Stripe, GitHub, Notion, Okta, Azure AD, Google Workspace, and Zapier - plus a fully documented REST and webhook API.',
        },
        {
          question: 'How does pricing work for larger programs?',
          answer:
            'Starter plans scale on a per-participant basis. Enterprise customers move to a flat annual license with unlimited events, white-label branding, and dedicated success management.',
        },
        {
          question: 'Do you offer white-label or custom domain options?',
          answer:
            'Absolutely. Every EHMS event can run on a custom domain with your full brand system - logos, typography, colors, and custom email sending domains.',
        },
      ],
    },
    cta: {
      eyebrow: 'READY WHEN YOU ARE',
      title: 'Run your next event on',
      accent: 'infrastructure that scales.',
      description:
        'Join leading enterprises, universities, and developer communities running their most important events on EHMS.',
      primary: 'Start free trial',
      secondary: 'Talk to sales',
    },
    footer: {
      description: 'The operating system for modern hackathons and innovation events.',
      groups: [
        {
          title: 'Product',
          links: [
            { label: 'Features', href: '#features' },
            { label: 'Workflow', href: '#workflow' },
            { label: 'Lifecycle', href: '#idea' },
            { label: 'Enterprise', href: '#enterprise' },
          ],
        },
        {
          title: 'Resources',
          links: [
            { label: 'Why EHMS', href: '#why' },
            { label: 'FAQ', href: '#faq' },
            { label: 'CTA', href: '#cta' },
            { label: 'Contact', href: '#footer' },
          ],
        },
        {
          title: 'Company',
          links: [
            { label: 'Overview', href: '#top' },
            { label: 'Workflow', href: '#workflow' },
            { label: 'Proof', href: '#why' },
            { label: 'Enterprise', href: '#enterprise' },
          ],
        },
        {
          title: 'Legal',
          links: [
            { label: 'Security', href: '#enterprise' },
            { label: 'Support', href: '#faq' },
            { label: 'Cookies', href: '#footer' },
            { label: 'Status', href: '#cta' },
          ],
        },
      ],
      bottom: '© 2026 EHMS Systems, Inc. All rights reserved.',
      utilities: [
        { label: 'Status', href: '#cta' },
        { label: 'Sitemap', href: '#features' },
        { label: 'Cookies', href: '#footer' },
      ],
    },
  },
  ar: {
    navLinks: [
      { href: '#features', label: 'الميزات' },
      { href: '#workflow', label: 'سير العمل' },
      { href: '#why', label: 'لماذا EHMS' },
      { href: '#enterprise', label: 'المؤسسات' },
      { href: '#faq', label: 'الأسئلة' },
    ],
    nav: {
      signIn: 'تسجيل الدخول',
      cta: 'إنشاء حساب',
      switchLabel: 'English',
    },
    hero: {
      pillTag: 'جديد',
      pillText: 'التحكيم الفوري والتقييم الآلي أصبحا متاحين الآن',
      titleLine1: 'حوّل تشغيل الهاكاثونات',
      titleLine2: 'باستخدام منصة',
      titleAccent: 'من الجيل التالي',
      titleLine3: 'لإدارة الفعاليات.',
      description:
        'EHMS هو نظام التشغيل للهاكاثونات وبرامج الابتكار الحديثة. التسجيلات، الفرق، التحكيم، والتحليلات - كلها في مساحة عمل واحدة بمستوى المؤسسات.',
      primaryCta: 'ابدأ التجربة',
      secondaryCta: 'شاهد آلية العمل',
      meta: ['تجربة مجانية 14 يوماً', 'من دون بطاقة ائتمان', 'متوافق مع SOC 2'],
    },
    dashboard: {
      callouts: [
        {
          label: 'التسجيلات',
          main: '+248 اليوم',
          sub: 'تم بلوغ 84% من الهدف',
        },
        {
          label: 'جولة التحكيم',
          main: 'الجولة 2 - جارية',
          sub: 'تم تقييم 14 من 32',
        },
      ],
      breadcrumb: 'Global Innovate 2026',
      workspaceLabel: 'مساحة العمل',
      adminLabel: 'الإدارة',
      menu: {
        overview: 'نظرة عامة',
        participants: 'المشاركون',
        schedule: 'الجدول',
        judging: 'التحكيم',
        analytics: 'التحليلات',
        settings: 'الإعدادات',
        badge: '1.2k',
      },
      title: 'نظرة عامة على المشاركين',
      subtitle: 'مقاييس مباشرة يتم تحديثها كل 15 ثانية',
      filters: ['الكل', 'اليوم', '7 أيام', '30 يوماً'],
      stats: [
        {
          label: 'المسجلون',
          value: '1,248',
          delta: '12.4%',
          bars: [40, 55, 48, 72, 60, 88, 70],
        },
        {
          label: 'الفرق',
          value: '312',
          delta: '6.1%',
          bars: [30, 44, 55, 60, 72, 80, 68],
        },
        {
          label: 'المشاركات',
          value: '184',
          delta: '22.0%',
          bars: [20, 30, 40, 50, 65, 92, 80],
        },
        {
          label: 'المحكمون النشطون',
          value: '42',
          delta: '3',
          bars: [40, 48, 50, 62, 70, 85, 78],
        },
      ],
      engagementTitle: 'خط التفاعل',
      engagementDate: '18-21 أبريل',
      liveTitle: 'النشاط المباشر',
      liveState: 'مباشر',
      activity: [
        { highlight: 'Team Delta', text: 'أرسلت مشروعها', time: '14:22', muted: false },
        { highlight: 'Judge M.', text: 'أنهى تقييم الجولة 2', time: '14:19', muted: false },
        { highlight: '12 جديداً', text: 'في التسجيلات', time: '14:11', muted: true },
        { highlight: 'ورشة B', text: 'بدأت', time: '14:00', muted: true },
      ],
    },
    logosLabel: 'موثوق من فرق الابتكار، الجامعات، ومجتمعات المطورين حول العالم',
    featuresSection: {
      eyebrow: '01 - الميزات',
      title: 'كل ما تحتاجه،',
      accent: 'ولا شيء زائد.',
      description:
        'ست وحدات مصممة بعناية تستبدل خليط الجداول، محادثات Slack، والأدوات المنفصلة التي تبطئ تشغيل الفعاليات.',
    },
    features: {
      cards: [
        {
          title: 'تسجيل ذكي وتكوين فرق',
          description:
            'نماذج ديناميكية، مطابقة تلقائية للفرق، وإدارة لقوائم الانتظار. استوعب 10 أو 10,000 مشارك من دون تعقيد.',
        },
        {
          title: 'محرك تحكيم وتقييم',
          description:
            'معايير قابلة للتخصيص، مراجعة عمياء، وكشف تعارضات. يقيّم الحكام من أي جهاز وتُجمع النتائج فوراً.',
        },
        {
          title: 'جدولة موحدة',
          description:
            'المسارات، الورش، والكلمات الرئيسية - كلها على خط زمني واحد مع كشف التعارضات.',
        },
        {
          title: 'اتصالات داخل المنصة',
          description: 'إعلانات، دردشة فرق، ورسائل للحكام - لا حاجة بعد الآن لحلول خارجية مشتتة.',
        },
        {
          title: 'تحليلات فورية',
          description:
            'التفاعل، الانسحاب، والبيانات الديموغرافية - كل رقم سيطلبه الرعاة أمامك مباشرة.',
        },
        {
          title: 'الرعاة والمدفوعات',
          description: 'خطط متعددة، صرف جوائز، وفوترة للرعاة - كلها موثقة وقابلة للمراجعة.',
        },
      ],
      registrationRows: [
        { initials: 'AK', accent: '', label: 'Ava Kim · Team Delta', state: 'مؤكد', queued: false },
        {
          initials: 'MO',
          accent: 'soft',
          label: 'Mateo Ortiz · Team Orbit',
          state: 'مؤكد',
          queued: false,
        },
        {
          initials: 'SR',
          accent: 'cool',
          label: 'Sana Raza · جارٍ المطابقة...',
          state: 'بالانتظار',
          queued: true,
        },
        {
          initials: 'JT',
          accent: 'warm',
          label: 'Jordan T. · Team Helix',
          state: 'مؤكد',
          queued: false,
        },
      ],
      judgingScores: [
        { label: 'الابتكار', score: '8.6', width: '86%' },
        { label: 'التنفيذ', score: '9.2', width: '92%' },
        { label: 'الأثر', score: '7.8', width: '78%' },
        { label: 'التصميم', score: '8.8', width: '88%' },
      ],
      scheduleLabels: ['الكلمة الرئيسية', 'سباق الهاكاثون', 'ساعات الإرشاد'],
      messages: [
        'الجولة الثانية تبدأ بعد 10 دقائق - أرسل نموذجك الآن.',
        'تم - أرفع النسخة النهائية حالاً.',
      ],
      analyticsHeights: ['30%', '55%', '42%', '68%', '58%', '80%', '95%', '72%', '62%'],
      payments: [
        { label: 'التسجيلات', value: '$12,480' },
        { label: 'راعي الفئة A', value: '$45,000' },
        { label: 'الإضافات', value: '$2,120' },
      ],
      totalLabel: 'الإجمالي المحصل',
      totalValue: '$59,600',
    },
    workflow: {
      eyebrow: '02 - سير العمل',
      title: 'أطلق فعاليتك خلال',
      accent: 'خمس خطوات.',
      description:
        'من الفكرة الأولى حتى منصة التتويج، يوجّه EHMS فريقك عبر أسلوب تشغيل واضح ومجرب.',
      steps: [
        {
          step: '01',
          title: 'الإعداد',
          description: 'أنشئ فعاليتك خلال دقائق - الهوية، المسارات، المعايير، وتدفق التسجيل.',
        },
        {
          step: '02',
          title: 'الإطلاق',
          description: 'افتح التسجيلات عبر صفحة هبوط مخصصة وتجربة انضمام تلقائية.',
        },
        {
          step: '03',
          title: 'التشغيل',
          description: 'أدر الحدث المباشر - الجدول، الاتصالات، المشاركات، وساعات الإرشاد.',
        },
        {
          step: '04',
          title: 'التحكيم',
          description: 'عيّن الحكام، اجمع الدرجات، وأدر التقييم متعدد الجولات بأمان.',
        },
        {
          step: '05',
          title: 'التتويج',
          description: 'أعلن الفائزين، وزّع الجوائز، وصدّر التقرير الكامل للفعالية.',
        },
      ],
    },
    lifecycle: {
      eyebrow: '03 - دورة الفعالية',
      title: 'من الفكرة إلى',
      accent: 'التتويج.',
      description: 'EHMS هو سجل العمل الموحد لكل مرحلة من مراحل الفعالية - قبلها وأثناءها وبعدها.',
      cardEyebrow: 'الدورة',
      leftTitle: 'كل محطة،',
      leftAccent: 'في خط واحد.',
      leftDescription:
        'توقف عن التنقل بين ست أدوات مختلفة. EHMS يجمع كل إجراء، درجة، وملف داخل سجل واحد للفعالية.',
      journey: [
        { label: 'قبل 6 أسابيع', title: 'اعتماد الملخص وتهيئة الفعالية', done: true },
        { label: 'قبل 4 أسابيع', title: 'فتح التسجيلات وتأكيد الرعاة', done: true },
        { label: 'قبل أسبوع', title: 'إدراج الحكام ونشر المعايير', done: true },
        { label: 'اليوم 0-2', title: 'تشغيل حي مع 1,248 مشاركاً نشطاً', done: true },
        { label: 'اليوم 3', title: 'التحكيم النهائي وحفل الجوائز', done: false },
      ],
      awardsLabel: 'الجوائز · Global Innovate 2026',
      awardsState: 'مكتمل',
      awards: [
        {
          rank: '1',
          tone: 'gold',
          name: 'Team Delta',
          project: 'AI-driven flood forecasting',
          prize: '$25,000',
        },
        {
          rank: '2',
          tone: 'silver',
          name: 'Team Orbit',
          project: 'Supply-chain transparency API',
          prize: '$12,000',
        },
        {
          rank: '3',
          tone: 'bronze',
          name: 'Team Helix',
          project: 'Elder-care companion app',
          prize: '$6,000',
        },
      ],
      certificatesTitle: 'إنشاء الشهادات تلقائياً',
      certificatesBody: '1,248 ملف PDF شخصياً تم تسليمه عبر البريد الإلكتروني',
      certificatesCta: 'معاينة',
    },
    why: {
      eyebrow: '04 - لماذا EHMS',
      title: 'نتائج قابلة للقياس،',
      accent: 'من اليوم الأول.',
      description: 'الفرق التي تنتقل إلى EHMS تقلل العبء التشغيلي باستمرار مع توسيع أثر برامجها.',
      cards: [
        {
          value: '78',
          suffix: '%',
          title: 'خفض في العبء التشغيلي',
          description: 'استبدل الجداول وسلاسل البريد وخمس أدوات متفرقة بمساحة عمل واحدة.',
        },
        {
          value: '3.4',
          suffix: 'x',
          title: 'إطلاق أسرع للفعالية',
          description:
            'انتقل من الملخص إلى فتح التسجيلات خلال أيام لا أسابيع بفضل القوالب الجاهزة.',
        },
        {
          value: '94',
          suffix: '%',
          title: 'رضا أعلى للمشاركين',
          description: 'تواصل واضح، جدولة موثوقة، وتجربة تحكيم أكثر احترافية.',
        },
        {
          value: '$0',
          suffix: '',
          title: 'رسوم مخفية',
          description: 'تسعير شفاف قائم على الاستخدام. كل المزايا متاحة بلا طبقات مخفية.',
        },
      ],
    },
    enterprise: {
      eyebrow: '05 - للمؤسسات',
      title: 'مصمم لـ',
      accent: 'حجم المؤسسات.',
      description:
        'الأمان، الامتثال، والبنية العالمية - كلها مصممة لتشغيل أكثر البرامج حساسية لدى المؤسسات الكبرى.',
      leftTitle: 'الأمن والامتثال،',
      leftAccent: 'خط أحمر.',
      leftDescription:
        'تم تقوية EHMS للجهات التي لا يمكنها التنازل عن الحوكمة. من مراجعات SOC 2 حتى الإقامة الإقليمية للبيانات، كل طبقة جاهزة للتدقيق المؤسسي.',
      bullets: [
        {
          title: 'SOC 2 Type II و ISO 27001',
          body: 'ضوابط مدققة بشكل مستقل عبر كامل المنصة.',
        },
        {
          title: 'SSO و SCIM و RBAC',
          body: 'تكامل سريع مع Okta و Azure AD و Google Workspace.',
        },
        {
          title: 'إقامة البيانات',
          body: 'مناطق في أمريكا وأوروبا وآسيا والهند مع سجلات تدقيق كاملة.',
        },
        {
          title: 'اتفاقية توافر 99.99%',
          body: 'تعافٍ متعدد المناطق ودعم متواصل على مدار الساعة.',
        },
      ],
      nodeLabel: '5 مناطق · 42 عقدة طرفية',
    },
    faq: {
      eyebrow: '06 - الأسئلة الشائعة',
      title: 'أسئلة',
      accent: 'مُجابة.',
      description: 'إذا لم تجد ما تبحث عنه، يرد فريقنا على كل استفسار خلال أربع ساعات عمل.',
      items: [
        {
          question: 'كم يستغرق إطلاق فعالية على EHMS؟',
          answer:
            'تنتقل أغلب الفرق من الملخص إلى فتح التسجيلات خلال 48 ساعة. القوالب القابلة لإعادة الاستخدام وفريق التهيئة يساعدان على تسريع كل فعالية لاحقة إلى أقل من يوم.',
        },
        {
          question: 'هل يدعم EHMS الهاكاثونات الحضورية والافتراضية معاً؟',
          answer:
            'نعم. يدعم EHMS الفعاليات الحضورية والهجينة والافتراضية من مساحة واحدة - مع تسجيل حضور، خرائط مواقع، تكاملات بث، وغرف فرق افتراضية.',
        },
        {
          question: 'هل بياناتي وبيانات المشاركين آمنة؟',
          answer:
            'EHMS حاصل على SOC 2 Type II ومتوافق مع ISO 27001 وجاهز لـ GDPR. البيانات مشفرة أثناء النقل وفي السكون مع خيارات إقامة إقليمية عبر أمريكا وأوروبا وآسيا والهند.',
        },
        {
          question: 'ما التكاملات المدعومة بشكل جاهز؟',
          answer:
            'تشمل التكاملات الأصلية Slack وMicrosoft Teams وZoom وStripe وGitHub وNotion وOkta وAzure AD وGoogle Workspace وZapier - إضافة إلى REST API وwebhooks موثقة بالكامل.',
        },
        {
          question: 'كيف يعمل التسعير للبرامج الأكبر؟',
          answer:
            'الخطط الأولية تعتمد على عدد المشاركين. أما العملاء المؤسسيون فينتقلون إلى ترخيص سنوي ثابت مع فعاليات غير محدودة، وهوية بيضاء، وإدارة نجاح مخصصة.',
        },
        {
          question: 'هل توفرون هوية بيضاء أو نطاقاً مخصصاً؟',
          answer:
            'بالتأكيد. يمكن لكل فعالية على EHMS أن تعمل على نطاق مخصص مع هويتك الكاملة - الشعار، الطباعة، الألوان، وحتى نطاقات الإرسال البريدية.',
        },
      ],
    },
    cta: {
      eyebrow: 'جاهزون عندما تكون جاهزاً',
      title: 'شغّل فعاليتك القادمة على',
      accent: 'بنية قابلة للتوسع.',
      description:
        'انضم إلى المؤسسات والجامعات ومجتمعات المطورين التي تدير أهم فعالياتها على EHMS.',
      primary: 'ابدأ التجربة',
      secondary: 'تحدث إلى المبيعات',
    },
    footer: {
      description: 'نظام التشغيل للهاكاثونات وبرامج الابتكار الحديثة.',
      groups: [
        {
          title: 'المنتج',
          links: [
            { label: 'الميزات', href: '#features' },
            { label: 'سير العمل', href: '#workflow' },
            { label: 'الدورة', href: '#idea' },
            { label: 'المؤسسات', href: '#enterprise' },
          ],
        },
        {
          title: 'المصادر',
          links: [
            { label: 'لماذا EHMS', href: '#why' },
            { label: 'الأسئلة', href: '#faq' },
            { label: 'الدعوة', href: '#cta' },
            { label: 'التواصل', href: '#footer' },
          ],
        },
        {
          title: 'الشركة',
          links: [
            { label: 'نظرة عامة', href: '#top' },
            { label: 'الخطوات', href: '#workflow' },
            { label: 'الأثر', href: '#why' },
            { label: 'البنية', href: '#enterprise' },
          ],
        },
        {
          title: 'السياسات',
          links: [
            { label: 'الأمان', href: '#enterprise' },
            { label: 'الدعم', href: '#faq' },
            { label: 'الكوكيز', href: '#footer' },
            { label: 'الحالة', href: '#cta' },
          ],
        },
      ],
      bottom: '© 2026 EHMS Systems, Inc. جميع الحقوق محفوظة.',
      utilities: [
        { label: 'الحالة', href: '#cta' },
        { label: 'الخريطة', href: '#features' },
        { label: 'الكوكيز', href: '#footer' },
      ],
    },
  },
} as const;

function SectionHeader({
  eyebrow,
  title,
  accent,
  description,
}: {
  eyebrow: string;
  title: string;
  accent: string;
  description: string;
}) {
  return (
    <div className="ehms-sec-head ehms-reveal">
      <span className="ehms-eyebrow">
        <span className="ehms-eyebrow-dot" />
        {eyebrow}
      </span>
      <h2>
        {title} <span className="ehms-serif">{accent}</span>
      </h2>
      <p>{description}</p>
    </div>
  );
}

export default function HomePage() {
  const locale = useLocale();
  const pathname = usePathname();
  const [openFaq, setOpenFaq] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);

  const isRtl = locale === 'ar';
  const copy = isRtl ? homeCopy.ar : homeCopy.en;

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 8);
    onScroll();

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            return;
          }

          const element = entry.target as HTMLElement;
          element.classList.add('is-visible');

          if (element.dataset.steps === 'true') {
            requestAnimationFrame(() => {
              window.setTimeout(() => element.classList.add('in-view'), 120);
            });
          }

          observer.unobserve(element);
        });
      },
      {
        threshold: 0.2,
        rootMargin: '0px 0px -60px 0px',
      }
    );

    document.querySelectorAll<HTMLElement>('.ehms-reveal').forEach((element) => {
      observer.observe(element);
    });

    window.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', onScroll);
      observer.disconnect();
    };
  }, []);

  const renderFeatureVisual = (index: number) => {
    if (index === 0) {
      return (
        <div className="ehms-bv-reg">
          {copy.features.registrationRows.map((row) => (
            <div key={`${row.initials}-${row.label}`} className="ehms-bv-row">
              <span className="ehms-bv-name">
                <span className={`ehms-bv-avatar ${row.accent ? `is-${row.accent}` : ''}`}>
                  {row.initials}
                </span>
                {row.label}
              </span>
              <span className={`ehms-bv-state ${row.queued ? 'is-queued' : ''}`}>{row.state}</span>
            </div>
          ))}
        </div>
      );
    }

    if (index === 1) {
      return (
        <div className="ehms-bv-judge">
          {copy.features.judgingScores.map((score) => (
            <div key={score.label} className="ehms-judge-card">
              <div className="ehms-judge-name">{score.label}</div>
              <div className="ehms-judge-score">
                <div className="ehms-judge-bar">
                  <div className="ehms-judge-fill" style={{ width: score.width }} />
                </div>
                <span className="ehms-mono">{score.score}</span>
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (index === 2) {
      return (
        <div className="ehms-bv-schedule">
          <div className="ehms-schedule-grid" />
          <div className="ehms-schedule-event is-primary">{copy.features.scheduleLabels[0]}</div>
          <div className="ehms-schedule-event is-accent">{copy.features.scheduleLabels[1]}</div>
          <div className="ehms-schedule-event is-outline">{copy.features.scheduleLabels[2]}</div>
        </div>
      );
    }

    if (index === 3) {
      return (
        <div className="ehms-bv-messages">
          <div className="ehms-message">
            <span className="ehms-message-avatar">O</span>
            <span className="ehms-message-bubble">{copy.features.messages[0]}</span>
          </div>
          <div className="ehms-message is-me">
            <span className="ehms-message-avatar is-accent">YO</span>
            <span className="ehms-message-bubble">{copy.features.messages[1]}</span>
          </div>
        </div>
      );
    }

    if (index === 4) {
      return (
        <div className="ehms-bv-analytics">
          {copy.features.analyticsHeights.map((height, heightIndex) => (
            <span
              key={`${height}-${heightIndex}`}
              className={heightIndex === 6 ? 'is-highlight' : ''}
              style={{ height }}
            />
          ))}
        </div>
      );
    }

    return (
      <div className="ehms-bv-pay">
        {copy.features.payments.map((payment) => (
          <div key={payment.label} className="ehms-pay-row">
            <span>{payment.label}</span>
            <b>{payment.value}</b>
          </div>
        ))}
        <div className="ehms-pay-total">
          <span>{copy.features.totalLabel}</span>
          <span>{copy.features.totalValue}</span>
        </div>
      </div>
    );
  };

  return (
    <div id="top" className="ehms-home" dir={isRtl ? 'rtl' : 'ltr'}>
      <nav className="ehms-nav" data-scrolled={isScrolled}>
        <div className="ehms-container ehms-nav-inner">
          <Link href="/" className="ehms-logo">
            <span className="ehms-logo-mark" />
            EHMS
          </Link>

          <div className="ehms-nav-links">
            {copy.navLinks.map((item) => (
              <a key={item.href} href={item.href}>
                {item.label}
              </a>
            ))}
          </div>

          <div className="ehms-nav-cta">
            <Link
              href={pathname}
              locale={isRtl ? 'en' : 'ar'}
              className="ehms-btn ehms-btn-ghost ehms-lang-link"
            >
              <Globe aria-hidden size={15} />
              {copy.nav.switchLabel}
            </Link>
            <Link href="/auth/login" className="ehms-btn ehms-btn-ghost">
              {copy.nav.signIn}
            </Link>
            <Link href="/auth/register" className="ehms-btn ehms-btn-primary">
              {copy.nav.cta}
              <span aria-hidden className="ehms-chev">
                {isRtl ? '←' : '→'}
              </span>
            </Link>
          </div>
        </div>
      </nav>

      <main>
        <section className="ehms-hero">
          <div className="ehms-hero-gradient" />
          <div className="ehms-container">
            <div className="ehms-hero-inner">
              <div className="ehms-pill ehms-reveal is-visible">
                <span className="ehms-pill-tag">{copy.hero.pillTag}</span>
                <span className="ehms-pill-dot" />
                {copy.hero.pillText}
              </div>

              <h1 className="ehms-reveal is-visible ehms-delay-1">
                {copy.hero.titleLine1}
                <br />
                {copy.hero.titleLine2} <span className="ehms-serif">{copy.hero.titleAccent}</span>
                <br />
                {copy.hero.titleLine3}
              </h1>

              <p className="ehms-sub ehms-reveal is-visible ehms-delay-2">
                {copy.hero.description}
              </p>

              <div className="ehms-hero-ctas ehms-reveal is-visible ehms-delay-3">
                <Link href="/auth/register" className="ehms-btn ehms-btn-primary">
                  {copy.hero.primaryCta}
                  <span aria-hidden className="ehms-chev">
                    {isRtl ? '←' : '→'}
                  </span>
                </Link>
                <a href="#workflow" className="ehms-btn ehms-btn-outline">
                  {copy.hero.secondaryCta}
                </a>
              </div>

              <div className="ehms-hero-meta ehms-reveal is-visible ehms-delay-4">
                {copy.hero.meta.map((item) => (
                  <span key={item}>
                    <span className="ehms-tick">✓</span>
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <div className="ehms-dash-wrap ehms-reveal">
              <div className="ehms-float-card fc1">
                <div className="ehms-float-top">
                  <span className="ehms-float-dot" />
                  {copy.dashboard.callouts[0].label}
                </div>
                <div className="ehms-float-main">{copy.dashboard.callouts[0].main}</div>
                <div className="ehms-float-sub">{copy.dashboard.callouts[0].sub}</div>
              </div>

              <div className="ehms-float-card fc2">
                <div className="ehms-float-top">
                  <span className="ehms-float-dot" />
                  {copy.dashboard.callouts[1].label}
                </div>
                <div className="ehms-float-main">{copy.dashboard.callouts[1].main}</div>
                <div className="ehms-float-sub">{copy.dashboard.callouts[1].sub}</div>
              </div>

              <div className="ehms-dash">
                <div className="ehms-dash-top">
                  <div className="ehms-dots">
                    <span />
                    <span />
                    <span />
                  </div>
                  <div className="ehms-dash-crumb">
                    <span className="ehms-mono">ehms.app</span>
                    <span>/</span>
                    <b>{copy.dashboard.breadcrumb}</b>
                  </div>
                </div>

                <div className="ehms-dash-body">
                  <aside className="ehms-dash-side">
                    <div className="ehms-side-sec">{copy.dashboard.workspaceLabel}</div>
                    <div className="ehms-side-item">
                      <LayoutDashboard className="ehms-side-ico" aria-hidden />
                      {copy.dashboard.menu.overview}
                    </div>
                    <div className="ehms-side-item active">
                      <Users className="ehms-side-ico" aria-hidden />
                      {copy.dashboard.menu.participants}
                      <span className="ehms-side-badge">{copy.dashboard.menu.badge}</span>
                    </div>
                    <div className="ehms-side-item">
                      <Calendar className="ehms-side-ico" aria-hidden />
                      {copy.dashboard.menu.schedule}
                    </div>
                    <div className="ehms-side-item">
                      <Trophy className="ehms-side-ico" aria-hidden />
                      {copy.dashboard.menu.judging}
                    </div>
                    <div className="ehms-side-item">
                      <BarChart3 className="ehms-side-ico" aria-hidden />
                      {copy.dashboard.menu.analytics}
                    </div>
                    <div className="ehms-side-sec">{copy.dashboard.adminLabel}</div>
                    <div className="ehms-side-item">
                      <Settings className="ehms-side-ico" aria-hidden />
                      {copy.dashboard.menu.settings}
                    </div>
                  </aside>

                  <div className="ehms-dash-main">
                    <div className="ehms-dash-head">
                      <div>
                        <h3>{copy.dashboard.title}</h3>
                        <p>{copy.dashboard.subtitle}</p>
                      </div>
                      <div className="ehms-dash-filters">
                        {copy.dashboard.filters.map((filter, index) => (
                          <button
                            key={filter}
                            type="button"
                            className={`ehms-chip ${index === 1 ? 'active' : ''}`}
                          >
                            {filter}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="ehms-stat-row">
                      {copy.dashboard.stats.map((stat) => (
                        <div key={stat.label} className="ehms-stat">
                          <div className="ehms-stat-label">{stat.label}</div>
                          <div className="ehms-stat-val">
                            {stat.value} <span className="ehms-stat-delta">↑ {stat.delta}</span>
                          </div>
                          <div className="ehms-stat-bar">
                            {stat.bars.map((bar, index) => (
                              <span
                                key={`${stat.label}-${bar}-${index}`}
                                className={index === 5 ? 'is-highlight' : ''}
                                style={{ height: `${bar}%` }}
                              />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="ehms-chart-row">
                      <div className="ehms-card-box">
                        <div className="ehms-card-title">
                          <span>{copy.dashboard.engagementTitle}</span>
                          <span className="ehms-mono ehms-card-meta">
                            {copy.dashboard.engagementDate}
                          </span>
                        </div>
                        <svg
                          className="ehms-chart-svg"
                          viewBox="0 0 600 140"
                          preserveAspectRatio="none"
                        >
                          <defs>
                            <linearGradient id="ehms-chart-fill" x1="0" x2="0" y1="0" y2="1">
                              <stop offset="0" stopColor="oklch(0.85 0.17 130)" stopOpacity=".5" />
                              <stop offset="1" stopColor="oklch(0.85 0.17 130)" stopOpacity="0" />
                            </linearGradient>
                          </defs>
                          <g stroke="rgba(10,10,10,0.06)" strokeWidth="1">
                            <line x1="0" y1="35" x2="600" y2="35" />
                            <line x1="0" y1="70" x2="600" y2="70" />
                            <line x1="0" y1="105" x2="600" y2="105" />
                          </g>
                          <path
                            d="M0 110 C 60 95, 100 60, 160 70 S 260 40, 320 55 S 430 20, 500 30 S 570 55, 600 40 L 600 140 L 0 140 Z"
                            fill="url(#ehms-chart-fill)"
                          />
                          <path
                            d="M0 110 C 60 95, 100 60, 160 70 S 260 40, 320 55 S 430 20, 500 30 S 570 55, 600 40"
                            fill="none"
                            stroke="oklch(0.5 0.17 130)"
                            strokeWidth="2"
                          />
                          <circle cx="500" cy="30" r="4" fill="#0A0A0A" />
                          <circle cx="500" cy="30" r="8" fill="#0A0A0A" fillOpacity=".1" />
                        </svg>
                      </div>

                      <div className="ehms-card-box">
                        <div className="ehms-card-title">
                          <span>{copy.dashboard.liveTitle}</span>
                          <span className="ehms-mono ehms-card-live">
                            ● {copy.dashboard.liveState}
                          </span>
                        </div>
                        <div className="ehms-timeline">
                          {copy.dashboard.activity.map((activity) => (
                            <div
                              key={`${activity.highlight}-${activity.time}`}
                              className="ehms-timeline-item"
                            >
                              <span
                                className={`ehms-timeline-dot ${activity.muted ? 'is-muted' : ''}`}
                              />
                              <span className="ehms-timeline-name">
                                <b>{activity.highlight}</b> {activity.text}
                              </span>
                              <span className="ehms-timeline-time">{activity.time}</span>
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
        </section>

        <section className="ehms-logos">
          <div className="ehms-container">
            <div className="ehms-logos-label ehms-reveal">{copy.logosLabel}</div>
            <div className="ehms-logos-row ehms-reveal ehms-delay-1">
              {brandLogos.map((logo) => (
                <div key={logo.name} className="ehms-logo-item">
                  <span className={`ehms-logo-dot is-${logo.tone}`} />
                  {logo.name === 'PrismIQ' ? (
                    <>
                      Prism<b>IQ</b>
                    </>
                  ) : (
                    logo.name
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="ehms-section" id="features">
          <div className="ehms-container">
            <SectionHeader
              eyebrow={copy.featuresSection.eyebrow}
              title={copy.featuresSection.title}
              accent={copy.featuresSection.accent}
              description={copy.featuresSection.description}
            />

            <div className="ehms-bento">
              {copy.features.cards.map((card, index) => {
                const Icon = featureIcons[index];
                const spanClass =
                  index === 0
                    ? 'ehms-bento-card ehms-c-span3 ehms-c-rspan2 ehms-reveal'
                    : index === 1 || index === 2
                      ? `ehms-bento-card ehms-c-span3 ehms-reveal ehms-delay-${index}`
                      : `ehms-bento-card ehms-c-span2 ehms-reveal ehms-delay-${index - 1}`;

                return (
                  <article key={card.title} className={spanClass}>
                    <div className="ehms-bc-ico">
                      <Icon aria-hidden size={18} />
                    </div>
                    <h3 className="ehms-bc-title">{card.title}</h3>
                    <p className="ehms-bc-body">{card.description}</p>
                    <div className="ehms-bc-visual">{renderFeatureVisual(index)}</div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="ehms-section ehms-workflow" id="workflow">
          <div className="ehms-container">
            <SectionHeader
              eyebrow={copy.workflow.eyebrow}
              title={copy.workflow.title}
              accent={copy.workflow.accent}
              description={copy.workflow.description}
            />

            <div className="ehms-steps-wrap ehms-reveal" data-steps="true">
              <div className="ehms-steps-track" />
              <div className="ehms-steps-fill" />
              <div className="ehms-steps">
                {copy.workflow.steps.map((step) => (
                  <div key={step.step} className="ehms-step">
                    <div className="ehms-step-inner">
                      <div className="ehms-step-num">{step.step}</div>
                      <h4>{step.title}</h4>
                      <p>{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="ehms-section" id="idea">
          <div className="ehms-container">
            <SectionHeader
              eyebrow={copy.lifecycle.eyebrow}
              title={copy.lifecycle.title}
              accent={copy.lifecycle.accent}
              description={copy.lifecycle.description}
            />

            <div className="ehms-idea-grid">
              <div className="ehms-idea-left ehms-reveal">
                <span className="ehms-eyebrow is-dark">
                  <span className="ehms-eyebrow-dot" />
                  {copy.lifecycle.cardEyebrow}
                </span>
                <h3>
                  {copy.lifecycle.leftTitle}{' '}
                  <span className="ehms-serif">{copy.lifecycle.leftAccent}</span>
                </h3>
                <p>{copy.lifecycle.leftDescription}</p>
                <div className="ehms-journey">
                  {copy.lifecycle.journey.map((item) => (
                    <div
                      key={`${item.label}-${item.title}`}
                      className={`ehms-journey-item ${item.done ? 'done' : ''}`}
                    >
                      <div className="ehms-journey-label">{item.label}</div>
                      <div className="ehms-journey-title">{item.title}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="ehms-idea-right ehms-reveal ehms-delay-1">
                <div className="ehms-awards-top">
                  <div className="ehms-mono ehms-awards-label">{copy.lifecycle.awardsLabel}</div>
                  <div className="ehms-mono ehms-awards-state">● {copy.lifecycle.awardsState}</div>
                </div>

                {copy.lifecycle.awards.map((award) => (
                  <div key={`${award.rank}-${award.name}`} className="ehms-award-card">
                    <div className={`ehms-award-rank is-${award.tone}`}>{award.rank}</div>
                    <div className="ehms-award-info">
                      <div className="ehms-award-name">{award.name}</div>
                      <div className="ehms-award-project">{award.project}</div>
                    </div>
                    <div className="ehms-award-prize">{award.prize}</div>
                  </div>
                ))}

                <div className="ehms-cert-card">
                  <div>
                    <div className="ehms-cert-title">{copy.lifecycle.certificatesTitle}</div>
                    <div className="ehms-cert-body">{copy.lifecycle.certificatesBody}</div>
                  </div>
                  <a href="#cta" className="ehms-cert-btn">
                    {copy.lifecycle.certificatesCta}
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="ehms-section ehms-section-tight" id="why">
          <div className="ehms-container">
            <SectionHeader
              eyebrow={copy.why.eyebrow}
              title={copy.why.title}
              accent={copy.why.accent}
              description={copy.why.description}
            />

            <div className="ehms-why-grid">
              {copy.why.cards.map((card, index) => {
                const Icon = whyIcons[index];

                return (
                  <div key={card.title} className={`ehms-why-card ehms-reveal ehms-delay-${index}`}>
                    <div className="ehms-why-ico">
                      <Icon aria-hidden size={18} />
                    </div>
                    <div className="ehms-why-big">
                      {card.value}
                      <span className="ehms-why-unit">{card.suffix}</span>
                    </div>
                    <div className="ehms-why-title">{card.title}</div>
                    <div className="ehms-why-body">{card.description}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="ehms-section ehms-section-tight" id="enterprise">
          <div className="ehms-container">
            <SectionHeader
              eyebrow={copy.enterprise.eyebrow}
              title={copy.enterprise.title}
              accent={copy.enterprise.accent}
              description={copy.enterprise.description}
            />

            <div className="ehms-enterprise-wrap ehms-reveal">
              <div className="ehms-enterprise-left">
                <h3>
                  {copy.enterprise.leftTitle}{' '}
                  <span className="ehms-serif">{copy.enterprise.leftAccent}</span>
                </h3>
                <p>{copy.enterprise.leftDescription}</p>
                <div className="ehms-enterprise-list">
                  {copy.enterprise.bullets.map((bullet) => (
                    <div key={bullet.title} className="ehms-enterprise-item">
                      <span className="ehms-enterprise-check">✓</span>
                      <div>
                        <b>{bullet.title}</b> - {bullet.body}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="ehms-enterprise-right">
                <div className="ehms-globe-ring is-3" />
                <div className="ehms-globe-ring is-2" />
                <div className="ehms-globe-ring is-1" />
                <div className="ehms-globe-core">EHMS</div>
                {networkNodes.map((node) => (
                  <div
                    key={node.label}
                    className={`ehms-node ${node.highlight ? 'is-highlight' : ''}`}
                    style={node.style}
                  >
                    {node.label}
                  </div>
                ))}
                <div className="ehms-node-caption">● {copy.enterprise.nodeLabel}</div>
              </div>
            </div>
          </div>
        </section>

        <section className="ehms-section" id="faq">
          <div className="ehms-container">
            <SectionHeader
              eyebrow={copy.faq.eyebrow}
              title={copy.faq.title}
              accent={copy.faq.accent}
              description={copy.faq.description}
            />

            <div className="ehms-faq-wrap ehms-reveal">
              {copy.faq.items.map((item, index) => {
                const isOpen = openFaq === index;

                return (
                  <div key={item.question} className={`ehms-faq-item ${isOpen ? 'is-open' : ''}`}>
                    <button
                      type="button"
                      className="ehms-faq-question"
                      onClick={() => setOpenFaq(isOpen ? -1 : index)}
                      aria-expanded={isOpen}
                    >
                      {item.question}
                      <span className="ehms-faq-icon">+</span>
                    </button>
                    <div className="ehms-faq-answer">
                      <p>{item.answer}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="ehms-cta" id="cta">
          <div className="ehms-container">
            <div className="ehms-cta-box ehms-reveal">
              <div className="ehms-cta-inner">
                <span className="ehms-eyebrow is-cta">
                  <span className="ehms-eyebrow-dot" />
                  {copy.cta.eyebrow}
                </span>
                <h2>
                  {copy.cta.title} <span className="ehms-serif">{copy.cta.accent}</span>
                </h2>
                <p>{copy.cta.description}</p>
                <div className="ehms-cta-btns">
                  <Link href="/auth/register" className="ehms-btn ehms-btn-accent">
                    {copy.cta.primary}
                    <span aria-hidden className="ehms-chev">
                      {isRtl ? '←' : '→'}
                    </span>
                  </Link>
                  <a href="#footer" className="ehms-btn ehms-btn-outline-light">
                    {copy.cta.secondary}
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        <footer className="ehms-footer" id="footer">
          <div className="ehms-container">
            <div className="ehms-footer-top">
              <div className="ehms-foot-brand">
                <Link href="/" className="ehms-logo">
                  <span className="ehms-logo-mark" />
                  EHMS
                </Link>
                <p>{copy.footer.description}</p>
              </div>

              {copy.footer.groups.map((group) => (
                <div key={group.title} className="ehms-foot-col">
                  <h5>{group.title}</h5>
                  {group.links.map((link) => (
                    <a key={`${group.title}-${link.href}`} href={link.href}>
                      {link.label}
                    </a>
                  ))}
                </div>
              ))}
            </div>

            <div className="ehms-foot-bot">
              <div>{copy.footer.bottom}</div>
              <div className="ehms-foot-links">
                {copy.footer.utilities.map((item) => (
                  <a key={item.label} href={item.href}>
                    {item.label}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
