// ============================================
// MOMENTIQUE - Supervisor Dashboard Overview
// ============================================

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    Users,
    Calendar,
    Image as ImageIcon,
    Building2,
    TrendingUp,
    ArrowRight,
    Loader2
} from 'lucide-react';

interface DashboardStats {
    totalUsers: number;
    totalEvents: number;
    totalPhotos: number;
    totalTenants: number;
    activeEvents: number;
    recentUsers: number;
}

export default function SupervisorDashboardPage() {
    const [stats, setStats] = useState<DashboardStats>({
        totalUsers: 0,
        totalEvents: 0,
        totalPhotos: 0,
        totalTenants: 0,
        activeEvents: 0,
        recentUsers: 0,
    });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await fetch('/api/admin/stats', {
                    credentials: 'include',
                });

                if (response.ok) {
                    const data = await response.json();
                    setStats(data.data || stats);
                }
            } catch (error) {
                console.error('Failed to fetch supervisor stats:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchStats();
    }, []);

    const statCards = [
        {
            label: 'Total Users',
            value: stats.totalUsers,
            icon: Users,
            color: 'bg-blue-500',
            href: '/admin/users'
        },
        {
            label: 'Total Events',
            value: stats.totalEvents,
            icon: Calendar,
            color: 'bg-violet-500',
            href: '/admin/events'
        },
        {
            label: 'Total Photos',
            value: stats.totalPhotos,
            icon: ImageIcon,
            color: 'bg-pink-500',
            href: null
        },
        {
            label: 'Total Tenants',
            value: stats.totalTenants,
            icon: Building2,
            color: 'bg-amber-500',
            href: '/admin/tenants'
        },
    ];

    if (isLoading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    Super Admin Dashboard
                </h1>
                <p className="mt-1 text-gray-600 dark:text-gray-400">
                    System-wide overview and management
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {statCards.map((stat) => (
                    <div
                        key={stat.label}
                        className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                    {stat.label}
                                </p>
                                <p className="mt-1 text-3xl font-bold text-gray-900 dark:text-white">
                                    {stat.value.toLocaleString()}
                                </p>
                            </div>
                            <div className={`rounded-lg ${stat.color} p-3`}>
                                <stat.icon className="h-6 w-6 text-white" />
                            </div>
                        </div>
                        {stat.href && (
                            <Link
                                href={stat.href}
                                className="mt-4 flex items-center text-sm font-medium text-violet-600 hover:text-violet-700 dark:text-violet-400"
                            >
                                View all <ArrowRight className="ml-1 h-4 w-4" />
                            </Link>
                        )}
                    </div>
                ))}
            </div>

            {/* Quick Actions */}
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                    Quick Actions
                </h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <Link
                        href="/admin/users"
                        className="flex items-center gap-3 rounded-lg border border-gray-200 p-4 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700"
                    >
                        <Users className="h-5 w-5 text-blue-500" />
                        <span className="font-medium text-gray-900 dark:text-white">
                            Manage Users
                        </span>
                    </Link>
                    <Link
                        href="/admin/events"
                        className="flex items-center gap-3 rounded-lg border border-gray-200 p-4 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700"
                    >
                        <Calendar className="h-5 w-5 text-violet-500" />
                        <span className="font-medium text-gray-900 dark:text-white">
                            Manage Events
                        </span>
                    </Link>
                    <Link
                        href="/admin/tenants"
                        className="flex items-center gap-3 rounded-lg border border-gray-200 p-4 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700"
                    >
                        <Building2 className="h-5 w-5 text-amber-500" />
                        <span className="font-medium text-gray-900 dark:text-white">
                            Manage Tenants
                        </span>
                    </Link>
                </div>
            </div>

            {/* Recent Activity Placeholder */}
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-500" />
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Recent Activity
                    </h2>
                </div>
                <p className="mt-4 text-center text-gray-500 dark:text-gray-400">
                    Activity feed coming soon...
                </p>
            </div>
        </div>
    );
}
