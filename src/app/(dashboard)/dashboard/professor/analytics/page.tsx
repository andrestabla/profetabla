'use client';

import { useState, useEffect, useCallback } from 'react';
import { BarChart3, Loader2, AlertCircle } from 'lucide-react';
import { OverviewCards } from '@/components/analytics/OverviewCards';
import { StudentProgressChart } from '@/components/analytics/StudentProgressChart';
import { GradeDistribution } from '@/components/analytics/GradeDistribution';
import { AtRiskStudentsTable } from '@/components/analytics/AtRiskStudentsTable';
import { DateRangeFilter } from '@/components/analytics/DateRangeFilter';
import { ProjectFilter } from '@/components/analytics/ProjectFilter';
import { ResourcesByProjectTable } from '@/components/analytics/ResourcesByProjectTable';
import { SessionsByStudentTable } from '@/components/analytics/SessionsByStudentTable';
import { format } from 'date-fns';

export default function ProfessorAnalyticsPage() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filters, setFilters] = useState<{
        startDate: Date | null;
        endDate: Date | null;
        projectId: string | null;
    }>({
        startDate: null,
        endDate: null,
        projectId: null
    });

    const fetchAnalytics = useCallback(async () => {
        try {
            setLoading(true);
            let url = '/api/analytics/professor';
            const params = new URLSearchParams();

            if (filters.startDate && filters.endDate) {
                params.append('startDate', filters.startDate.toISOString());
                params.append('endDate', filters.endDate.toISOString());
            }

            if (filters.projectId) {
                params.append('projectId', filters.projectId);
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
            console.error('Error fetching professor analytics:', err);
            setError('No se pudo cargar la analítica de tus proyectos');
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        fetchAnalytics();
    }, [fetchAnalytics]);

    const handleDateFilterChange = (start: Date | null, end: Date | null) => {
        setFilters(prev => ({ ...prev, startDate: start, endDate: end }));
    };

    const handleProjectFilterChange = (projectId: string | null) => {
        setFilters(prev => ({ ...prev, projectId }));
    };

    if (loading && !data) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <Loader2 className="w-10 h-10 text-emerald-600 animate-spin mb-4" />
                <p className="text-slate-600 font-medium">Preparando tus métricas...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
                <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
                <h2 className="text-xl font-bold text-slate-900 mb-2">Error de conexión</h2>
                <p className="text-slate-600 mb-6">{error}</p>
                <button
                    onClick={() => fetchAnalytics()}
                    className="px-6 py-2 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition-colors"
                >
                    Intentar de nuevo
                </button>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <BarChart3 className="w-8 h-8 text-emerald-600" />
                        <h1 className="text-3xl font-bold text-slate-900">Análisis del Profesor</h1>
                    </div>
                    <p className="text-slate-600">Seguimiento de rendimiento, progreso y participación de estudiantes</p>
                </div>

                <div className="text-sm text-slate-500 bg-slate-100 px-4 py-2 rounded-lg border border-slate-200">
                    Sincronizado: {format(new Date(), 'dd/MM/yyyy HH:mm')}
                </div>
            </div>

            {/* Smart Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <DateRangeFilter onFilterChange={handleDateFilterChange} />
                <ProjectFilter onFilterChange={handleProjectFilterChange} />
            </div>

            {/* Overview Section */}
            <OverviewCards
                metrics={[
                    { title: 'Estudiantes', value: data.overview.totalStudents, icon: 'users' },
                    { title: 'Total Tareas', value: data.overview.totalAssignments, icon: 'projects' },
                    { title: 'Entregas Pendientes', value: data.overview.pendingSubmissions, icon: 'submissions' },
                    { title: 'Progreso Promedio', value: `${data.overview.avgProgress}%`, icon: 'trend' }
                ]}
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Student Progress Chart */}
                <StudentProgressChart data={data.studentProgress} />

                {/* Grade Distribution Chart */}
                <GradeDistribution data={data.gradeDistribution} />
            </div>

            {/* Learning Resources Section */}
            <div className="space-y-6">
                <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                    <h2 className="text-xl font-bold text-slate-900">Uso de Recursos</h2>
                </div>
                <ResourcesByProjectTable data={data.learningResources.byProject} />
            </div>

            {/* Mentorship Section */}
            <div className="space-y-6">
                <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                    <h2 className="text-xl font-bold text-slate-900">Participación en Mentorías</h2>
                </div>
                <SessionsByStudentTable data={data.mentorship.byStudent} />
            </div>

            <div className="grid grid-cols-1 gap-8">
                {/* At Risk Students Table */}
                <AtRiskStudentsTable students={data.atRiskStudents} />
            </div>

            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-6 text-center">
                <p className="text-emerald-800 text-sm font-medium">
                    Gestión Académica Basada en Datos - Profe Tabla
                </p>
            </div>
        </div>
    );
}
