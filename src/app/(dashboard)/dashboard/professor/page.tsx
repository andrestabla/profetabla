'use client';

/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';
import { ProjectRiskCard } from '@/components/ProjectRiskCard';
import { ActivityFeed } from '@/components/ActivityFeed';
import { Loader2, LayoutDashboard, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function ProfessorDashboard() {
    const [data, setData] = useState<{ projects: any[], recentActivity: any[] } | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/analytics/professor')
            .then(res => res.json())
            .then(data => {
                setData(data);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    if (loading) {
        return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-500" /></div>;
    }

    if (!data) return <div>Error loading dashboard.</div>;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3 mb-2">
                        <LayoutDashboard className="w-8 h-8 text-blue-600" />
                        Panel del Profesor
                    </h1>
                    <p className="text-slate-500">
                        Monitorea el progreso de tus estudiantes y detecta riesgos a tiempo.
                    </p>
                </div>

                {data.projects.some((p: any) => p.risk === 'HIGH') && (
                    <div className="bg-red-50 border border-red-200 p-4 rounded-xl flex items-center gap-3 text-red-700 font-medium">
                        ⚠️ Tienes {data.projects.filter((p: any) => p.risk === 'HIGH').length} proyectos en riesgo crítico.
                    </div>
                )}

                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-slate-800">Estado de Proyectos</h3>
                    <Link href="/dashboard/professor/projects" className="text-sm font-bold text-blue-600 hover:underline flex items-center gap-1">
                        Ver Todos <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {data.projects.map((project: any) => (
                        <ProjectRiskCard key={project.id} project={project} />
                    ))}
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-fit">
                <ActivityFeed activities={data.recentActivity} />
            </div>
        </div >
    );
}
