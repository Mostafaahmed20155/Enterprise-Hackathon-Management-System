'use client';

import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/routing';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Calendar,
  Users,
  FileText,
  Scale,
  User,
  LogOut,
  Menu,
  X,
  Sparkles,
  Globe,
  LayoutDashboard,
  ShieldCheck,
  UserCog,
} from 'lucide-react';
import { authApi, teamsApi } from '@/lib/api';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = useTranslations('nav');
  const tAdmin = useTranslations('admin');
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [pendingInviteCount, setPendingInviteCount] = useState(0);

  useEffect(() => {
    Promise.all([
      authApi.getCurrentUser()
        .then(res => setCurrentUser(res.data))
        .catch(() => {}),
      teamsApi.getInvites()
        .then(res => {
          const data = Array.isArray(res.data) ? res.data : (res.data?.data || []);
          setPendingInviteCount(data.length);
        })
        .catch(() => {}),
    ]);
  }, []);

  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('');
  };

  const isAdminOrOrganizer = currentUser?.userRoles?.some(
    (ur: any) => ur.role?.name === 'SUPER_ADMIN' || ur.role?.name === 'ORGANIZER'
  );

  const navigation = [
    { name: t('dashboard'), href: '/dashboard', icon: LayoutDashboard },
    { name: t('events'), href: '/events', icon: Calendar },
    { name: t('myTeams'), href: '/teams', icon: Users },
    { name: t('submissions'), href: '/submissions', icon: FileText },
    { name: t('judging'), href: '/judging', icon: Scale },
    { name: t('profile'), href: '/profile', icon: User },
  ];

  const adminNavigation = [
    { name: tAdmin('userManagement'), href: '/admin/users', icon: UserCog },
  ];

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900">
      {/* Mobile sidebar backdrop */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden animate-fade-in"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 ${
          isSidebarOpen ? 'start-0' : '-start-72'
        } lg:start-0 z-50 w-72 bg-white dark:bg-gray-900 border-e border-gray-200 dark:border-gray-800 transition-all duration-300 lg:translate-x-0 shadow-xl lg:shadow-none`}
      >
        <div className="flex flex-col h-full">
          {/* Logo Section */}
          <div className="flex items-center justify-between h-20 px-6 border-b border-gray-200 dark:border-gray-800">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-orange-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold bg-gradient-to-r from-primary to-orange-600 bg-clip-text text-transparent">
                  EHMS
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Hackathon Platform
                </span>
              </div>
            </Link>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsSidebarOpen(false)}
                  className={`group flex items-center px-4 py-3.5 rounded-xl transition-all duration-200 ${
                    active
                      ? 'bg-gradient-to-r from-primary/12 to-orange-500/12 text-primary dark:text-primary font-semibold shadow-sm'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:translate-x-1'
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 me-3 transition-colors ${
                      active
                        ? 'text-primary'
                        : 'text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300'
                    }`}
                  />
                  <span className="text-sm">{item.name}</span>
                  {item.href === '/teams' && pendingInviteCount > 0 && (
                    <span className="ms-auto me-2 min-w-[20px] h-5 bg-amber-500 text-white text-xs font-bold rounded-full flex items-center justify-center px-1">
                      {pendingInviteCount}
                    </span>
                  )}
                  {active && (
                    <div className={`${item.href === '/teams' && pendingInviteCount > 0 ? '' : 'ms-auto'} w-1.5 h-8 bg-gradient-to-b from-primary to-orange-600 rounded-full`} />
                  )}
                </Link>
              );
            })}

            {/* Admin Tools Section */}
            {isAdminOrOrganizer && (
              <div className="pt-4">
                <div className="flex items-center gap-2 px-4 py-2 mb-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                    {tAdmin('tools')}
                  </span>
                </div>
                <div className="h-px bg-gradient-to-r from-amber-200 via-amber-300 to-transparent dark:from-amber-800 dark:via-amber-700 mb-2" />
                {adminNavigation.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsSidebarOpen(false)}
                      className={`group flex items-center px-4 py-3.5 rounded-xl transition-all duration-200 ${
                        active
                          ? 'bg-gradient-to-r from-amber-500/10 to-orange-500/10 text-amber-700 dark:text-amber-400 font-semibold shadow-sm'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-amber-50 dark:hover:bg-amber-900/20 hover:translate-x-1'
                      }`}
                    >
                      <Icon
                        className={`w-5 h-5 me-3 transition-colors ${
                          active
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-gray-400 group-hover:text-amber-500'
                        }`}
                      />
                      <span className="text-sm">{item.name}</span>
                      {active && (
                        <div className="ms-auto w-1.5 h-8 bg-gradient-to-b from-amber-500 to-orange-500 rounded-full" />
                      )}
                    </Link>
                  );
                })}
              </div>
            )}
          </nav>

          {/* User Section */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-800 space-y-3">
            {currentUser ? (
              <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-800/50 rounded-xl">
                <div className="w-10 h-10 bg-gradient-to-br from-primary to-orange-600 rounded-full flex items-center justify-center text-white font-semibold shadow-md">
                  {getUserInitials(currentUser.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                    {currentUser.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {currentUser.email}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-800/50 rounded-xl animate-pulse">
                <div className="w-10 h-10 bg-gray-300 dark:bg-gray-700 rounded-full" />
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-24" />
                  <div className="h-2 bg-gray-300 dark:bg-gray-700 rounded w-32" />
                </div>
              </div>
            )}

            <Button
              variant="outline"
              className="w-full group hover:bg-red-50 hover:border-red-200 hover:text-red-600 dark:hover:bg-red-950 dark:hover:border-red-900 transition-colors"
              onClick={() => {
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                window.location.href = '/auth/login';
              }}
            >
              <LogOut className="w-4 h-4 me-2 group-hover:rotate-12 transition-transform" />
              {t('logout')}
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:ps-72">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 glass">
          <div className="flex items-center justify-between h-16 px-6">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <Menu className="w-6 h-6" />
            </button>

            {/* Language Switcher */}
            <div className="flex items-center gap-2 ms-auto">
              <Globe className="w-4 h-4 text-gray-400" />
              <Link
                href={pathname}
                locale="ar"
                className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                العربية
              </Link>
              <span className="text-gray-300 dark:text-gray-700">|</span>
              <Link
                href={pathname}
                locale="en"
                className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                English
              </Link>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
