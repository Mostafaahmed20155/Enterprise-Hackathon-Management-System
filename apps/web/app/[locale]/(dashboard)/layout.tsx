'use client';

import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Link, usePathname, useRouter } from '@/i18n/routing';
import { authApi, teamsApi } from '@/lib/api';
import {
  Bell,
  Calendar,
  FileText,
  Globe,
  HelpCircle,
  LayoutDashboard,
  LogOut,
  Menu,
  Plus,
  Scale,
  Search,
  ShieldCheck,
  User,
  UserCog,
  Users,
  X,
} from 'lucide-react';

interface CurrentUserRole {
  role?: {
    name?: string;
  };
}

interface CurrentUser {
  name?: string;
  email?: string;
  userRoles?: CurrentUserRole[];
}

interface ShellCopy {
  platformLabel: string;
  workspaceLabel: string;
  accountLabel: string;
  adminLabel: string;
  searchPlaceholder: string;
  shortcut: string;
  helpLabel: string;
  notificationsLabel: string;
  newEvent: string;
}

const shellCopy: Record<'en' | 'ar', ShellCopy> = {
  en: {
    platformLabel: 'Hackathon Platform',
    workspaceLabel: 'Workspace',
    accountLabel: 'Account',
    adminLabel: 'Admin',
    searchPlaceholder: 'Search events, teams, submissions...',
    shortcut: '⌘K',
    helpLabel: 'Help',
    notificationsLabel: 'Notifications',
    newEvent: 'New event',
  },
  ar: {
    platformLabel: 'منصة الهاكاثون',
    workspaceLabel: 'مساحة العمل',
    accountLabel: 'الحساب',
    adminLabel: 'الإدارة',
    searchPlaceholder: 'ابحث في الفعاليات والفرق والمشاريع...',
    shortcut: '⌘K',
    helpLabel: 'المساعدة',
    notificationsLabel: 'الإشعارات',
    newEvent: 'فعالية جديدة',
  },
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const locale = useLocale();
  const isRtl = locale === 'ar';
  const copy = shellCopy[isRtl ? 'ar' : 'en'];
  const t = useTranslations('nav');
  const tAdmin = useTranslations('admin');
  const pathname = usePathname();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [pendingInviteCount, setPendingInviteCount] = useState(0);

  useEffect(() => {
    void Promise.all([
      authApi
        .getCurrentUser()
        .then((response) => setCurrentUser((response.data || null) as CurrentUser | null))
        .catch(() => {}),
      teamsApi
        .getInvites()
        .then((response) => {
          const data = Array.isArray(response.data) ? response.data : response.data?.data || [];
          setPendingInviteCount(data.length);
        })
        .catch(() => {}),
    ]);
  }, []);

  const getUserInitials = (name?: string) => {
    if (!name?.trim()) {
      return 'EH';
    }

    return name
      .split(' ')
      .map((part) => part.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('');
  };

  const isAdminOrOrganizer = Boolean(
    currentUser?.userRoles?.some(
      (userRole) => userRole.role?.name === 'SUPER_ADMIN' || userRole.role?.name === 'ORGANIZER'
    )
  );

  const workspaceNavigation = [
    { name: t('dashboard'), href: '/dashboard', icon: LayoutDashboard },
    { name: t('events'), href: '/events', icon: Calendar },
    { name: t('myTeams'), href: '/teams', icon: Users, badge: pendingInviteCount },
    { name: t('submissions'), href: '/submissions', icon: FileText },
    { name: t('judging'), href: '/judging', icon: Scale },
  ];

  const accountNavigation = [{ name: t('profile'), href: '/profile', icon: User }];

  const adminNavigation = isAdminOrOrganizer
    ? [{ name: tAdmin('userManagement'), href: '/admin/users', icon: UserCog }]
    : [];

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    router.push('/auth/login');
  };

  const renderNavItem = (
    item: {
      name: string;
      href: string;
      icon: typeof LayoutDashboard;
      badge?: number;
    },
    tone: 'default' | 'admin' = 'default'
  ) => {
    const Icon = item.icon;
    const active = isActive(item.href);

    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={() => setIsSidebarOpen(false)}
        className={`ehms-shell-nav-item ${active ? 'active' : ''} ${
          tone === 'admin' ? 'is-admin' : ''
        }`}
      >
        <Icon className="ehms-shell-nav-icon" aria-hidden size={17} />
        <span>{item.name}</span>
        {item.badge ? <span className="ehms-shell-nav-badge">{item.badge}</span> : null}
      </Link>
    );
  };

  return (
    <div className="ehms-shell">
      {isSidebarOpen ? (
        <button
          type="button"
          className="ehms-shell-backdrop"
          aria-label="Close navigation"
          onClick={() => setIsSidebarOpen(false)}
        />
      ) : null}

      <aside className={`ehms-shell-sidebar ${isSidebarOpen ? 'is-open' : ''}`}>
        <div className="ehms-shell-sidebar-inner">
          <div className="ehms-shell-brand-row">
            <Link href="/" className="ehms-shell-brand" onClick={() => setIsSidebarOpen(false)}>
              <span className="ehms-shell-logo-mark" aria-hidden />
              <span className="ehms-shell-brand-copy">
                <strong>EHMS</strong>
                <span>{copy.platformLabel}</span>
              </span>
            </Link>

            <button
              type="button"
              className="ehms-shell-close"
              aria-label="Close navigation"
              onClick={() => setIsSidebarOpen(false)}
            >
              <X aria-hidden size={18} />
            </button>
          </div>

          <nav className="ehms-shell-nav">
            <div className="ehms-shell-nav-group">
              <div className="ehms-shell-nav-label">{copy.workspaceLabel}</div>
              {workspaceNavigation.map((item) => renderNavItem(item))}
            </div>

            <div className="ehms-shell-nav-group">
              <div className="ehms-shell-nav-label">{copy.accountLabel}</div>
              {accountNavigation.map((item) => renderNavItem(item))}
            </div>

            {adminNavigation.length > 0 ? (
              <div className="ehms-shell-nav-group">
                <div className="ehms-shell-nav-label is-admin">
                  <ShieldCheck aria-hidden size={12} />
                  <span>{copy.adminLabel}</span>
                </div>
                {adminNavigation.map((item) => renderNavItem(item, 'admin'))}
              </div>
            ) : null}
          </nav>

          <div className="ehms-shell-footer">
            <div className="ehms-shell-user-card">
              <div className="ehms-shell-user-avatar">{getUserInitials(currentUser?.name)}</div>
              <div className="ehms-shell-user-copy">
                <div className="ehms-shell-user-name">
                  {currentUser?.name || (isRtl ? 'مستخدم EHMS' : 'EHMS User')}
                </div>
                <div className="ehms-shell-user-email">
                  {currentUser?.email || (isRtl ? 'جاري تحميل الحساب...' : 'Loading account...')}
                </div>
              </div>
            </div>

            <button type="button" className="ehms-shell-logout" onClick={handleLogout}>
              <LogOut aria-hidden size={16} />
              <span>{t('logout')}</span>
            </button>
          </div>
        </div>
      </aside>

      <div className="ehms-shell-main">
        <header className="ehms-shell-topbar">
          <div className="ehms-shell-topbar-start">
            <button
              type="button"
              className="ehms-shell-mobile-toggle"
              aria-label="Open navigation"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu aria-hidden size={18} />
            </button>

            <label className="ehms-shell-search" aria-label={copy.searchPlaceholder}>
              <Search aria-hidden size={15} />
              <input
                type="text"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder={copy.searchPlaceholder}
              />
              <kbd>{copy.shortcut}</kbd>
            </label>
          </div>

          <div className="ehms-shell-topbar-actions">
            <div className="ehms-shell-locale-switch">
              <Globe aria-hidden size={14} />
              <Link
                href={pathname}
                locale="en"
                className={`ehms-shell-locale-link ${locale === 'en' ? 'active' : ''}`}
              >
                EN
              </Link>
              <Link
                href={pathname}
                locale="ar"
                className={`ehms-shell-locale-link ${locale === 'ar' ? 'active' : ''}`}
              >
                AR
              </Link>
            </div>

            <button type="button" className="ehms-shell-icon-btn" aria-label={copy.helpLabel}>
              <HelpCircle aria-hidden size={16} />
            </button>

            <button
              type="button"
              className="ehms-shell-icon-btn has-pip"
              aria-label={copy.notificationsLabel}
            >
              <Bell aria-hidden size={16} />
              <span className="ehms-shell-pip" />
            </button>

            <Link href="/events/create" className="ehms-shell-btn ehms-shell-btn-primary">
              <Plus aria-hidden size={16} />
              <span>{copy.newEvent}</span>
            </Link>
          </div>
        </header>

        <main className="ehms-shell-content">
          <div className="ehms-shell-content-inner">{children}</div>
        </main>
      </div>
    </div>
  );
}
