// ============================================
// Galeria - Supervisor Dashboard Layout
// ============================================

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    Users,
    Calendar,
    Settings,
    Building2,
    Shield,
    Menu,
    X,
    User,
    LogOut,
    Monitor,
    FileText,
} from 'lucide-react';
import clsx from 'clsx';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

const SIDEBAR_ITEMS = [
    { href: '/admin', label: 'Overview', icon: LayoutDashboard },
    { href: '/admin/users', label: 'Users', icon: Users },
    { href: '/admin/events', label: 'Events', icon: Calendar },
    { href: '/admin/tenants', label: 'Tenants', icon: Building2 },
    { href: '/admin/sessions', label: 'Sessions', icon: Monitor },
    { href: '/admin/audit', label: 'Audit Logs', icon: FileText },
    { href: '/admin/settings', label: 'Settings', icon: Settings },
];

export default function SupervisorLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const { user, isLoading, isAuthenticated } = useAuth();
    const router = useRouter();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const sidebarRef = useRef<HTMLElement>(null);

    // Redirect non-supervisors
    useEffect(() => {
        if (!isLoading && (!isAuthenticated || user?.role !== 'super_admin')) {
            router.push('/auth/admin/login');
        }
    }, [isLoading, isAuthenticated, user, router]);

    useEffect(() => {
        if (!sidebarOpen) {
            return;
        }

        const sidebar = sidebarRef.current;
        const previousFocus = document.activeElement as HTMLElement | null;
        const focusable = sidebar?.querySelectorAll<HTMLElement>(
            'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
        );

        focusable?.[0]?.focus();

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setSidebarOpen(false);
                return;
            }

            if (event.key !== 'Tab' || !focusable || focusable.length === 0) {
                return;
            }

            const first = focusable[0];
            const last = focusable[focusable.length - 1];

            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first.focus();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        document.body.style.overflow = 'hidden';

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = '';
            previousFocus?.focus();
        };
    }, [sidebarOpen]);

    if (isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-600 border-t-transparent" />
            </div>
        );
    }

    if (!isAuthenticated || user?.role !== 'super_admin') {
        return null;
    }

    return (
        <div className="flex min-h-screen overflow-x-hidden bg-gray-50 dark:bg-gray-900">
            <button
                type="button"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                aria-label={sidebarOpen ? 'Close navigation menu' : 'Open navigation menu'}
                aria-controls="admin-sidebar"
                aria-expanded={sidebarOpen}
                className={clsx(
                    'fixed right-4 top-4 z-50 flex h-11 w-11 items-center justify-center rounded-xl border border-gray-200 bg-white shadow-md transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 lg:hidden dark:border-gray-700 dark:bg-gray-800',
                    sidebarOpen ? 'pointer-events-none opacity-0' : 'opacity-100'
                )}
            >
                {sidebarOpen ? (
                    <X className="h-6 w-6 text-gray-600 dark:text-gray-300" />
                ) : (
                    <Menu className="h-6 w-6 text-gray-600 dark:text-gray-300" />
                )}
            </button>

            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/50 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                    aria-hidden="true"
                />
            )}

            {/* Sidebar */}
            <aside
                ref={sidebarRef}
                id="admin-sidebar"
                className={clsx(
                    'fixed inset-y-0 left-0 z-40 flex h-dvh w-[85vw] max-w-64 flex-col border-r border-gray-200 bg-white transition-transform duration-200 dark:border-gray-700 dark:bg-gray-800 lg:h-screen lg:w-64',
                    'lg:translate-x-0',
                    sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                )}
                aria-label="Admin navigation"
            >
                {/* Header */}
                <div className="flex h-16 items-center gap-2 border-b border-gray-200 px-4 dark:border-gray-700">
                    <Shield className="h-6 w-6 text-violet-600" />
                    <span className="text-lg font-bold text-gray-900 dark:text-white">
                        Super Admin
                    </span>
                </div>

                {/* Navigation */}
                <nav className="flex-1 space-y-1 overflow-y-auto p-4 pb-8">
                    {SIDEBAR_ITEMS.map((item) => {
                        const isActive = pathname === item.href ||
                            (item.href !== '/admin' && pathname.startsWith(item.href));
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setSidebarOpen(false)}
                                className={clsx(
                                    'flex min-h-11 items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-800',
                                    isActive
                                        ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400'
                                        : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                                )}
                            >
                                <item.icon className="h-5 w-5" />
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                {/* User Menu */}
                <UserMenu />
            </aside>

            {/* Main Content */}
            <main className="min-w-0 flex-1 lg:ml-64">
                <div className="mx-auto min-h-screen w-full max-w-7xl px-4 pb-6 pt-20 sm:px-6 lg:px-8 lg:pb-8 lg:pt-8">
                    {children}
                </div>
            </main>
        </div>
    );
}

function UserMenu() {
    const { user } = useAuth();

    return (
        <div className="border-t border-gray-200 bg-white p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] dark:border-gray-700 dark:bg-gray-800">
            <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 rounded-full bg-violet-100 flex items-center justify-center text-violet-700 font-bold dark:bg-violet-900 dark:text-violet-300">
                    {user?.name?.[0]?.toUpperCase() || 'U'}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate dark:text-white">
                        {user?.name}
                    </p>
                    <p className="text-xs text-gray-500 truncate dark:text-gray-400">
                        {user?.email}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-2 min-[380px]:grid-cols-2">
                <Link
                    href="/admin/profile"
                    className="flex min-h-11 items-center justify-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:focus-visible:ring-offset-gray-800"
                >
                    <User className="h-4 w-4" />
                    Profile
                </Link>
                <button
                    type="button"
                    onClick={async () => {
                        await fetch('/api/auth/logout', { method: 'POST' });
                        window.location.href = '/auth/admin/login';
                    }}
                    className="flex min-h-11 items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 dark:border-red-900/30 dark:bg-red-900/20 dark:hover:bg-red-900/30 dark:focus-visible:ring-offset-gray-800"
                >
                    <LogOut className="h-4 w-4" />
                    Logout
                </button>
            </div>
        </div>
    );
}
