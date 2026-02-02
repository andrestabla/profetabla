'use client';

import { useEffect, useState } from 'react';
import { OverviewCards } from '@/components/analytics/OverviewCards';
import { StudentProgressChart } from '@/components/analytics/StudentProgressChart';
import { GradeDistribution } from '@/components/analytics/GradeDistribution';
import { AtRiskStudentsTable } from '@/components/analytics/AtRiskStudentsTable';
import { BarChart3, Loader2 } from 'lucide-react';

interface ProfessorAnalyticsData {
    overview: {
        totalStudents: number;
        avgProgress: number;
        pendingSubmissions: number;
        upcomingDeadlines: number;
    };
    studentProgress: Array<{
        studentId: string;
        studentName: string;
        studentEmail: string;
        progress: number;
        completedAssignments: number;
        totalAssignments: number;
    }>;
    submissionRates: Array<{
        date: string;
        submitted: number;
        total: number;
    }>;
    gradeDistribution: Array<{
        range: string;
        count: number;
    }>;
    atRiskStudents: Array<{
        id: string;
        name: string;
        email: string;
        progress: number;
        missedDeadlines: number;
        lastActivity: string;
    }>;
}

export default function ProfessorAnalyticsPage() {
    const [data, setData] = useState<ProfessorAnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchAnalytics() {
            try {
                const response = await fetch('/api/analytics/professor');
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
            title: 'Total Estudiantes',
            value: data.overview.totalStudents,
            icon: 'users' as const
        },
        {
            title: 'Progreso Promedio',
            value: `${data.overview.avgProgress}%`,
            icon: 'trend' as const
        },
        {
            title: 'Entregas Pendientes',
            value: data.overview.pendingSubmissions,
            icon: 'submissions' as const
        },
        {
            title: 'Próximos Deadlines',
            value: data.overview.upcomingDeadlines,
            icon: 'projects' as const
        }
    ];

    return (
        <div className="max-w-7xl mx-auto p-6">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <BarChart3 className="w-8 h-8 text-blue-600" />
                    <h1 className="text-3xl font-bold text-slate-900">Analítica de Mis Proyectos</h1>
                </div>
                <p className="text-slate-600">Vista general del rendimiento de tus estudiantes</p>
            </div>

            {/* Overview Cards */}
            <OverviewCards metrics={metrics} />

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <StudentProgressChart data={data.studentProgress} />
                <GradeDistribution data={data.gradeDistribution} />
            </div>

            {/* At-Risk Students */}
            <AtRiskStudentsTable students={data.atRiskStudents} />
        </div>
    );
}
