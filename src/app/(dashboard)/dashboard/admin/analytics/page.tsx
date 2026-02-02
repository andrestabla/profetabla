'use client';

import { useEffect, useState } from 'react';
import { OverviewCards } from '@/components/analytics/OverviewCards';
import { UserGrowthChart } from '@/components/analytics/UserGrowthChart';
import { ProjectStatusPie } from '@/components/analytics/ProjectStatusPie';
import { SubmissionTimeline } from '@/components/analytics/SubmissionTimeline';
import { TopPerformersTable } from '@/components/analytics/TopPerformersTable';
import { BarChart3, Loader2 } from 'lucide-react';

interface AnalyticsData {
    overview: {
        totalUsers: number;
        totalStudents: number;
        totalProfessors: number;
        activeProjects: number;
        submissionsThisMonth: number;
        avgCompletionRate: number;
    };
    userGrowth: Array<{
        month: string;
        students: number;
        professors: number;
    }>;
    projectStatus: Array<{
        status: string;
        count: number;
    }>;
    submissionTimeline: Array<{
        week: string;
        count: number;
    }>;
    topPerformers: Array<{
        id: string;
        name: string;
        email: string;
        completionRate: number;
        projectsEnrolled: number;
        completedAssignments: number;
        totalAssignments: number;
    }>;
}

export default function AdminAnalyticsPage() {
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchAnalytics() {
            try {
                const response = await fetch('/api/analytics/admin');
                if (!response.ok) {
                    throw new Error('Failed to fetch analytics');
                }
                const analyticsData = await response.json();
                setData(analyticsData);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Unknown error');
            } finally {
                setLoading(false);
            }
        }

        fetchAnalytics();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="max-w-7xl mx-auto p-6">
                <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
                    <p className="text-red-600 font-medium">Error al cargar analítica</p>
                    <p className="text-red-500 text-sm mt-2">{error}</p>
                </div>
            </div>
        );
    }

    const metrics = [
        {
            title: 'Total Usuarios',
            value: data.overview.totalUsers,
            icon: 'users' as const
        },
        {
            title: 'Proyectos Activos',
            value: data.overview.activeProjects,
            icon: 'projects' as const
        },
        {
            title: 'Entregas Este Mes',
            value: data.overview.submissionsThisMonth,
            icon: 'submissions' as const
        },
        {
            title: 'Tasa de Completitud',
            value: `${data.overview.avgCompletionRate}%`,
            icon: 'trend' as const
        }
    ];

    return (
        <div className="max-w-7xl mx-auto p-6">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <BarChart3 className="w-8 h-8 text-blue-600" />
                    <h1 className="text-3xl font-bold text-slate-900">Analítica de la Plataforma</h1>
                </div>
                <p className="text-slate-600">Vista general de métricas y rendimiento del sistema</p>
            </div>

            {/* Overview Cards */}
            <OverviewCards metrics={metrics} />

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <UserGrowthChart data={data.userGrowth} />
                <ProjectStatusPie data={data.projectStatus} />
            </div>

            {/* Submission Timeline */}
            <div className="mb-8">
                <SubmissionTimeline data={data.submissionTimeline} />
            </div>

            {/* Top Performers */}
            <TopPerformersTable performers={data.topPerformers} />
        </div>
    );
}
