'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import { useAuth } from '@/contexts/AuthContext';
import {
  HomeIcon,
  CalendarDaysIcon,
  Cog6ToothIcon,
  UserGroupIcon,
  Bars3Icon,
  XMarkIcon,
  ArrowRightOnRectangleIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Minyanim', href: '/minyanim', icon: CalendarDaysIcon },
  { name: 'Buildings', href: '/buildings', icon: UserGroupIcon },
  { name: 'Settings', href: '/settings', icon: Cog6ToothIcon },
];

const adminNavigation = [
  { name: 'Admin Panel', href: '/admin', icon: ShieldCheckIcon },
];

export default function Navigation() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';

  const allNavigation = isAdmin
    ? [...navigation, ...adminNavigation]
    : navigation;

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-72 lg:flex-col">
        <div className="flex min-h-0 flex-1 flex-col bg-white border-r border-gray-100 shadow-sm">
          {/* Logo */}
          <div className="flex h-20 items-center px-6">
            <Link href="/dashboard" className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/30">
                <UserGroupIcon className="h-5 w-5 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">Minyan</span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1.5 px-4 py-4">
            {allNavigation.map((item) => {
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={clsx(
                    'flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200',
                    isActive
                      ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/30'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  )}
                >
                  <item.icon className={clsx('mr-3 h-5 w-5 flex-shrink-0', isActive && 'text-white')} />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* User section */}
          <div className="border-t border-gray-100 p-4">
            <div className="flex items-center p-3 rounded-xl bg-gray-50">
              <div className="flex-shrink-0">
                <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shadow-md">
                  <span className="text-white font-semibold">
                    {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                </div>
              </div>
              <div className="ml-3 min-w-0 flex-1">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {user?.name}
                </p>
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
              </div>
              <button
                onClick={logout}
                className="ml-2 p-2.5 text-gray-400 hover:text-red-500 rounded-xl hover:bg-red-50 transition-colors"
                title="Sign out"
              >
                <ArrowRightOnRectangleIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="flex h-16 items-center justify-between px-4">
          <Link href="/dashboard" className="flex items-center space-x-2">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-md shadow-primary-500/30">
              <UserGroupIcon className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">Minyan</span>
          </Link>
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2.5 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <Bars3Icon className="h-6 w-6" />
          </button>
        </div>
      </div>

      {/* Mobile menu overlay */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="fixed inset-y-0 right-0 w-full max-w-sm bg-white shadow-2xl">
            <div className="flex items-center justify-between h-16 px-4 border-b border-gray-100">
              <span className="text-lg font-semibold text-gray-900">Menu</span>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2.5 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <nav className="px-4 py-4 space-y-1.5">
              {allNavigation.map((item) => {
                const isActive = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={clsx(
                      'flex items-center px-4 py-3.5 text-base font-medium rounded-xl transition-all duration-200',
                      isActive
                        ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/30'
                        : 'text-gray-600 hover:bg-gray-100'
                    )}
                  >
                    <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
            <div className="absolute bottom-0 left-0 right-0 border-t border-gray-100 p-4">
              <div className="flex items-center mb-4 p-3 rounded-xl bg-gray-50">
                <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shadow-md">
                  <span className="text-white font-semibold">
                    {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-semibold text-gray-900">
                    {user?.name}
                  </p>
                  <p className="text-xs text-gray-500">{user?.email}</p>
                </div>
              </div>
              <button
                onClick={logout}
                className="w-full flex items-center justify-center px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl font-medium transition-colors"
              >
                <ArrowRightOnRectangleIcon className="h-5 w-5 mr-2" />
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
