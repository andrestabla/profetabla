'use client';

import { useState, useEffect, useCallback } from 'react';
import { BarChart3, Loader2, AlertCircle } from 'lucide-react';
import { OverviewCards } from '@/components/analytics/OverviewCards';
import { UserGrowthChart } from '@/components/analytics/UserGrowthChart';
import { ProjectStatusPie } from '@/components/analytics/ProjectStatusPie';
import { SubmissionTimeline } from '@/components/analytics/SubmissionTimeline';
import { TopPerformersTable } from '@/components/analytics/TopPerformersTable';
import { DateRangeFilter } from '@/components/analytics/DateRangeFilter';
import { ResourceTypeDistribution } from '@/components/analytics/ResourceTypeDistribution';
import { TopResourcesTable } from '@/components/analytics/TopResourcesTable';
import { MentorshipStatusPie } from '@/components/analytics/MentorshipStatusPie';
import { TopMentorsTable } from '@/components/analytics/TopMentorsTable';
import { format } from 'date-fns';

export default function AdminAnalyticsPage() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filters, setFilters] = useState<{
        startDate: Date | null;
        endDate: Date | null;
    }>({
        startDate: null,
        endDate: null
    });

    const fetchAnalytics = useCallback(async () => {
        try {
            setLoading(true);
            let url = '/api/analytics/admin';
            const params = new URLSearchParams();

            if (filters.startDate && filters.endDate) {
                params.append('startDate', filters.startDate.toISOString());
                params.append('endDate', filters.endDate.toISOString());
            }

            if (params.toString()) {
                url += `?${params.toString()}`;
            }

            const response = await fetch(url);
            if (!response.ok) throw new Error('Failed to fetch analytics data');
            const result = await response.json();
            setData(result);
            setError(null);
        } catch (err) {
            console.error('Error fetching admin analytics:', err);
            setError('No se pudo cargar la información de analítica');
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        fetchAnalytics();
    }, [fetchAnalytics]);

    const handleDateFilterChange = (start: Date | null, end: Date | null) => {
        setFilters({ startDate: start, endDate: end });
    };

    if (loading && !data) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
                <p className="text-slate-600 font-medium">Cargando analíticas...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
                <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
                <h2 className="text-xl font-bold text-slate-900 mb-2">Error al cargar datos</h2>
                <p className="text-slate-600 mb-6">{error}</p>
                <button
                    onClick={() => fetchAnalytics()}
                    className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                >
                    Reintentar
                </button>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <BarChart3 className="w-8 h-8 text-blue-600" />
                        <h1 className="text-3xl font-bold text-slate-900">Analítica de la Plataforma</h1>
                    </div>
                    <p className="text-slate-600">Vista general de métricas y rendimiento del sistema</p>
                </div>

                <div className="text-sm text-slate-500 bg-slate-100 px-4 py-2 rounded-lg border border-slate-200">
                    Última actualización: {format(new Date(), 'dd/MM/yyyy HH:mm')}
                </div>
            </div>

            {/* Smart Filters */}
            <DateRangeFilter onFilterChange={handleDateFilterChange} />

            {/* Overview Section */}
            <OverviewCards
                metrics={[
                    { title: 'Total Usuarios', value: data.overview.totalUsers, icon: 'users' },
                    { title: 'Proyectos Activos', value: data.overview.activeProjects, icon: 'projects' },
                    { title: 'Entregas en Período', value: data.overview.submissionsThisPeriod || data.overview.submissionsThisMonth, icon: 'submissions' },
                    { title: 'Tasa de Completitud', value: `${data.overview.avgCompletionRate}%`, icon: 'trend' }
                ]}
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* User Growth Chart */}
                <UserGrowthChart data={data.userGrowth} />

                {/* Project Status Pie Chart */}
                <ProjectStatusPie data={data.projectStatus} />
            </div>

            <div className="grid grid-cols-1 gap-8">
                {/* Submission Timeline */}
                <SubmissionTimeline data={data.submissionTimeline} />
            </div>

            {/* Learning Resources Section */}
            <div className="space-y-6">
                <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                    <h2 className="text-xl font-bold text-slate-900">Aprendizaje y Recursos</h2>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-1">
                        <ResourceTypeDistribution data={data.learningResources.byType} />
                    </div>
                    <div className="lg:col-span-2">
                        <TopResourcesTable resources={data.learningResources.topAccessed} />
                    </div>
                </div>
            </div>

            {/* Mentorship Section */}
            <div className="space-y-6">
                <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                    <h2 className="text-xl font-bold text-slate-900">Sesiones de Mentoría</h2>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <MentorshipStatusPie data={data.mentorship.byStatus} />
                    <TopMentorsTable mentors={data.mentorship.topMentors} />
                </div>
            </div>

            <div className="grid grid-cols-1 gap-8">
                {/* Top Performers Table */}
                <TopPerformersTable performers={data.topPerformers} />
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-xl p-6 text-center">
                <p className="text-blue-800 text-sm font-medium">
                    © {new Date().getFullYear()} Profe Tabla v2.0 - Módulo de Analítica Avanzada
                </p>
            </div>
        </div>
    );
}
