'use client';

import { Search, Layers, CheckSquare } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import Link from 'next/link';

// Tipado basado en nuestro nuevo esquema Prisma
type ProjectWithTeacher = {
    id: string;
    title: string;
    description: string | null;
    industry: string | null;
    objectives: string | null;
    deliverables: string | null;
    methodology: string | null;
    schedule: string | null;
    budget: string | null;
    evaluation: string | null;
    kpis: string | null;
    type: 'PROJECT' | 'CHALLENGE' | 'PROBLEM';
    teachers: { name: string | null; avatarUrl: string | null }[];
    students?: { id: string }[];
};

export default function ProjectMarketClient({ availableProjects, currentFilter }: { availableProjects: ProjectWithTeacher[], currentFilter?: 'PROJECT' | 'CHALLENGE' | 'PROBLEM' }) {
    // Mapping icons/colors based on type
    const typeConfig = {
        PROJECT: { label: "Proyecto", icon: Layers, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200" },
        CHALLENGE: { label: "Reto", icon: CheckSquare, color: "text-orange-600", bg: "bg-orange-50", border: "border-orange-200" },
        PROBLEM: { label: "Problema", icon: Search, color: "text-red-600", bg: "bg-red-50", border: "border-red-200" }
    };

    const { data: session } = useSession();
    const [filter, setFilter] = useState<'ALL' | 'PROJECT' | 'CHALLENGE' | 'PROBLEM' | 'MINE'>(currentFilter || 'ALL');

    // Sync URL param with internal state
    useEffect(() => {
        if (currentFilter && currentFilter !== filter) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setFilter(currentFilter);
        }
    }, [currentFilter, filter]);

    // Apply filters locally (allows combining Type + Mine if we wanted, but for now tabs are exclusive)
    const filteredProjects = availableProjects.filter(p => {
        if (filter === 'MINE') {
            return p.students?.some((s: { id: string }) => s.id === session?.user?.id);
        }
        if (filter === 'ALL') return true;
        return p.type === filter;
    });

    return (
        <div className="p-6 space-y-8">
            <header className="mb-0">
                <h1 className="text-2xl font-bold text-slate-800">Mercado de Proyectos</h1>
                <p className="text-slate-500">Explora y postúlate a los proyectos, retos y problemas diseñados por tus profesores.</p>
            </header>

            {/* FIlter Tabs */}
            <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-1">
                <button
                    onClick={() => setFilter('ALL')}
                    className={`px-4 py-2 text-sm font-bold rounded-t-lg transition-colors border-b-2 ${filter === 'ALL' ? 'border-blue-600 text-blue-600 bg-blue-50/50' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
                >
                    Todos
                </button>
                <button
                    onClick={() => setFilter('PROJECT')}
                    className={`px-4 py-2 text-sm font-bold rounded-t-lg transition-colors border-b-2 ${filter === 'PROJECT' ? 'border-blue-600 text-blue-600 bg-blue-50/50' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
                >
                    Proyectos
                </button>
                <button
                    onClick={() => setFilter('CHALLENGE')}
                    className={`px-4 py-2 text-sm font-bold rounded-t-lg transition-colors border-b-2 ${filter === 'CHALLENGE' ? 'border-orange-600 text-orange-600 bg-orange-50/50' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
                >
                    Retos
                </button>
                <button
                    onClick={() => setFilter('PROBLEM')}
                    className={`px-4 py-2 text-sm font-bold rounded-t-lg transition-colors border-b-2 ${filter === 'PROBLEM' ? 'border-red-600 text-red-600 bg-red-50/50' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
                >
                    Problemas
                </button>
                <button
                    onClick={() => setFilter('MINE')}
                    className={`px-4 py-2 text-sm font-bold rounded-t-lg transition-colors border-b-2 ${filter === 'MINE' ? 'border-purple-600 text-purple-600 bg-purple-50/50' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
                >
                    Solo míos
                </button>
            </div>

            {/* Grid de Proyectos */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProjects.map((project) => {
                    const config = typeConfig[project.type] || typeConfig.PROJECT;
                    const Icon = config.icon;
                    const teacher = project.teachers?.[0] || { name: 'Sin Asignar', avatarUrl: null };

                    return (
                        <Link
                            key={project.id}
                            href={`/dashboard/market/${project.id}`}
                            className="block group h-full"
                        >
                            <div className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg transition-all duration-200 hover:border-slate-300 h-full flex flex-col">
                                {/* Card Header */}
                                <div className="flex items-start justify-between mb-4">
                                    <div className={`p-2 rounded-lg ${config.bg}`}>
                                        <Icon className={`w-5 h-5 ${config.color}`} />
                                    </div>
                                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${config.bg} ${config.color}`}>
                                        {config.label.toUpperCase()}
                                    </span>
                                </div>

                                {/* Content */}
                                <div className="space-y-3 mb-6 flex-grow">
                                    <h3 className="font-bold text-slate-800 group-hover:text-blue-600 transition-colors line-clamp-2">
                                        {project.title}
                                    </h3>
                                    <p className="text-sm text-slate-500 line-clamp-3">
                                        {project.description}
                                    </p>
                                </div>

                                {/* Footer */}
                                <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-auto">
                                    <div className="flex items-center gap-2">
                                        {teacher.avatarUrl ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img src={teacher.avatarUrl} alt={teacher.name || "Profesor"} className="w-6 h-6 rounded-full object-cover" />
                                        ) : (
                                            <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500">
                                                {(teacher.name || "P")[0]}
                                            </div>
                                        )}
                                        <span className="text-xs text-slate-500 font-medium truncate max-w-[120px]">
                                            {teacher.name}
                                        </span>
                                    </div>
                                    <span className="text-xs text-slate-400">
                                        Ver detalles &rarr;
                                    </span>
                                </div>
                            </div>
                        </Link>
                    );
                })}

                {filteredProjects.length === 0 && (
                    <div className="col-span-full py-20 text-center text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                        <p className="font-medium text-lg text-slate-600 mb-1">
                            {filter === 'MINE' ? 'No tienes proyectos asignados aún.' : `No hay ${filter === 'PROJECT' ? 'proyectos' : filter === 'CHALLENGE' ? 'retos' : filter === 'PROBLEM' ? 'problemas' : 'experiencias'} disponibles.`}
                        </p>
                        <p className="text-sm">Intenta cambiar el filtro o vuelve más tarde.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
