// ============================================
// Galeria - Supervisor Dashboard Layout
// ============================================

'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    Users,
    Calendar,
    Settings,
    Building2,
    Menu,
    User,
    LogOut,
    Monitor,
    FileText,
    Search,
    Shield,
    Siren,
    ArrowUpRight,
    Sparkles,
} from 'lucide-react';
import { BrandMark } from '@/components/landing/BrandMark';
import clsx from 'clsx';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { AdminActionButton } from '@/components/admin/control-plane';

const SIDEBAR_ITEMS = [
    { href: '/admin', label: 'Overview', icon: LayoutDashboard, hint: 'Platform pulse and priorities' },
    { href: '/admin/search', label: 'Search', icon: Search, hint: 'Find people, tenants, and events fast' },
    { href: '/admin/users', label: 'Users', icon: Users, hint: 'Identity, roles, and support access' },
    { href: '/admin/events', label: 'Events', icon: Calendar, hint: 'Cross-tenant event operations' },
    { href: '/admin/tenants', label: 'Tenants', icon: Building2, hint: 'Plan, status, and account health' },
    { href: '/admin/moderation', label: 'Moderation', icon: Shield, hint: 'Resolve pending and rejected media' },
    { href: '/admin/incidents', label: 'Incidents', icon: Siren, hint: 'Operational warnings and service health' },
    { href: '/admin/sessions', label: 'Sessions', icon: Monitor, hint: 'Active access across the system' },
    { href: '/admin/audit', label: 'Audit Logs', icon: FileText, hint: 'Trace admin decisions and reasons' },
    { href: '/admin/settings', label: 'Settings', icon: Settings, hint: 'Platform defaults and guardrails' },
    { href: '/organizer', label: 'Organizer View', icon: Calendar, hint: 'Return to tenant-level operations' },
];

export default function SupervisorLayout({
    children,
}: {
    children: ReactNode;
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

    const activeItem = SIDEBAR_ITEMS.find((item) =>
        pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href))
    ) ?? SIDEBAR_ITEMS[0];

    return (
        <div className="admin-control-plane relative min-h-screen overflow-x-hidden">
            <div className="pointer-events-none absolute inset-0 opacity-70">
                <div className="admin-grid absolute inset-0" />
                <div className="absolute left-[-8rem] top-[-8rem] h-64 w-64 rounded-full bg-[radial-gradient(circle,rgba(177,140,255,0.3),transparent_65%)] blur-3xl" />
                <div className="absolute right-[8%] top-12 h-48 w-48 rounded-full bg-[radial-gradient(circle,rgba(102,223,212,0.22),transparent_65%)] blur-3xl" />
            </div>
            <button
                type="button"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                aria-label={sidebarOpen ? 'Close navigation menu' : 'Open navigation menu'}
                aria-controls="admin-sidebar"
                aria-expanded={sidebarOpen}
                className={clsx(
                    'fixed right-4 top-4 z-50 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-[rgba(12,22,38,0.92)] backdrop-blur transition-opacity duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--admin-signal)]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent lg:hidden',
                    sidebarOpen ? 'pointer-events-none opacity-0' : 'opacity-100'
                )}
            >
                <Menu className="h-5 w-5 text-[var(--admin-text-soft)]" />
            </button>

            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px] lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                    aria-hidden="true"
                />
            )}

            {/* Sidebar */}
            <aside
                ref={sidebarRef}
                id="admin-sidebar"
                className={clsx(
                    'fixed inset-y-0 left-0 z-40 flex h-dvh w-[88vw] max-w-80 flex-col border-r border-white/10 bg-[linear-gradient(180deg,rgba(12,22,38,0.96),rgba(7,14,26,0.95))] backdrop-blur-xl lg:h-screen lg:w-80',
                    'lg:translate-x-0',
                    sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                )}
                style={{ transition: 'transform 0.2s ease-out' }}
                aria-label="Admin navigation"
            >
                <div className="border-b border-white/10 px-5 py-5">
                    <div className="flex items-center gap-3">
                        <BrandMark size={34} gradientId="gm-admin-sidebar" />
                        <div className="min-w-0">
                            <p className="admin-display text-3xl font-semibold leading-none text-[var(--admin-text)]">
                                Galeria
                            </p>
                            <p className="mt-1 text-[0.65rem] font-semibold uppercase tracking-[0.32em] text-[var(--admin-text-muted)]">
                                Control Plane
                            </p>
                        </div>
                        <span className="ml-auto rounded-full border border-[rgba(177,140,255,0.22)] bg-[rgba(177,140,255,0.12)] px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-[#dacbff]">
                            Admin
                        </span>
                    </div>

                    <div className="admin-panel relative mt-5 overflow-hidden rounded-[22px] p-4">
                        <p className="text-[0.65rem] font-semibold uppercase tracking-[0.28em] text-[var(--admin-text-muted)]">
                            Current Workspace
                        </p>
                        <h2 className="mt-2 text-lg font-semibold text-[var(--admin-text)]">
                            {activeItem.label}
                        </h2>
                        <p className="mt-2 text-sm leading-6 text-[var(--admin-text-soft)]">
                            {activeItem.hint}
                        </p>
                    </div>
                </div>

                <nav className="flex-1 space-y-1 overflow-y-auto px-4 py-5">
                    {SIDEBAR_ITEMS.map((item) => {
                        const isActive = pathname === item.href ||
                            (item.href !== '/admin' && pathname.startsWith(item.href));
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setSidebarOpen(false)}
                                className={clsx(
                                    'group flex min-h-14 items-center gap-3 rounded-2xl px-3.5 py-3 text-sm transition duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--admin-signal)]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent',
                                    isActive
                                        ? 'border border-[rgba(177,140,255,0.2)] bg-[linear-gradient(135deg,rgba(177,140,255,0.18),rgba(102,223,212,0.08))] text-[var(--admin-text)]'
                                        : 'border border-transparent text-[var(--admin-text-soft)] hover:border-white/8 hover:bg-white/[0.04] hover:text-[var(--admin-text)]'
                                )}
                            >
                                <div
                                    className={clsx(
                                        'flex h-10 w-10 items-center justify-center rounded-2xl border transition',
                                        isActive
                                            ? 'border-[rgba(177,140,255,0.24)] bg-[rgba(177,140,255,0.14)] text-[#ddceff]'
                                            : 'border-white/8 bg-white/[0.03] text-[var(--admin-text-muted)] group-hover:text-[var(--admin-text-soft)]'
                                    )}
                                >
                                    <item.icon className="h-4.5 w-4.5" />
                                </div>
                                <div className="min-w-0">
                                    <p className="font-semibold">{item.label}</p>
                                    <p className="truncate text-xs text-[var(--admin-text-muted)]">
                                        {item.hint}
                                    </p>
                                </div>
                                {isActive ? <Sparkles className="ml-auto h-4 w-4 text-[var(--admin-signal-2)]" /> : null}
                            </Link>
                        );
                    })}
                </nav>

                <UserMenu />
            </aside>

            <main className="relative min-w-0 flex-1 lg:ml-80">
                <div className="mx-auto min-h-screen w-full max-w-[1440px] px-4 pb-8 pt-20 sm:px-6 lg:px-10 lg:pt-10">
                    {children}
                </div>
            </main>
        </div>
    );
}

function UserMenu() {
    const { user } = useAuth();

    return (
        <div className="border-t border-white/10 px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-4">
            <div className="admin-panel relative overflow-hidden rounded-[24px] p-4">
                <div className="mb-4 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[rgba(177,140,255,0.24)] bg-[rgba(177,140,255,0.14)] text-sm font-semibold text-[#ddceff]">
                    {user?.name?.[0]?.toUpperCase() || 'U'}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-semibold text-[var(--admin-text)]">
                        {user?.name}
                    </p>
                    <p className="truncate text-xs text-[var(--admin-text-soft)]">
                        {user?.email}
                    </p>
                </div>
            </div>

                <div className="grid grid-cols-1 gap-2 min-[380px]:grid-cols-2">
                    <AdminActionButton href="/admin/profile" className="w-full">
                        <User className="h-4 w-4" />
                        Profile
                    </AdminActionButton>
                    <AdminActionButton
                        onClick={async () => {
                            await fetch('/api/auth/logout', { method: 'POST' });
                            window.location.href = '/auth/admin/login';
                        }}
                        className="w-full border-[rgba(255,108,122,0.2)] bg-[rgba(255,108,122,0.08)] text-[#ff9ba4] hover:border-[rgba(255,108,122,0.35)] hover:bg-[rgba(255,108,122,0.12)] hover:text-[#ffd1d6]"
                    >
                        <LogOut className="h-4 w-4" />
                        Logout
                    </AdminActionButton>
                </div>

                <div className="mt-4 rounded-2xl border border-white/8 bg-black/10 px-3 py-2.5">
                    <div className="flex items-center justify-between gap-3 text-xs uppercase tracking-[0.24em] text-[var(--admin-text-muted)]">
                        <span>Mode</span>
                        <Link href="/organizer" className="inline-flex items-center gap-1 text-[var(--admin-signal)] hover:text-[#ddceff]">
                            Leave admin
                            <ArrowUpRight className="h-3.5 w-3.5" />
                        </Link>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-[var(--admin-text-soft)]">
                        Super admin access lets you move across tenants, support accounts, and platform signals from one place.
                    </p>
                </div>
            </div>
        </div>
    );
}
