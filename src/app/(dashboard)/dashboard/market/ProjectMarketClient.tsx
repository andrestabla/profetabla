'use client';

import { Search, Layers, CheckSquare, User, Plus } from 'lucide-react';
import { useSession } from 'next-auth/react';
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
    teacher: { name: string | null; avatarUrl: string | null };
};

export default function ProjectMarketClient({ availableProjects, currentFilter }: { availableProjects: ProjectWithTeacher[], currentFilter?: 'PROJECT' | 'CHALLENGE' | 'PROBLEM' }) {
    // Mapping icons/colors based on type
    const typeConfig = {
        PROJECT: { label: "Proyecto", icon: Layers, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200" },
        CHALLENGE: { label: "Reto", icon: CheckSquare, color: "text-orange-600", bg: "bg-orange-50", border: "border-orange-200" },
        PROBLEM: { label: "Problema", icon: Search, color: "text-red-600", bg: "bg-red-50", border: "border-red-200" }
    };

    return (
        <div className="p-6 space-y-8">
            <header className="mb-0">
                <h1 className="text-2xl font-bold text-slate-800">Mercado de Proyectos</h1>
                <p className="text-slate-500">Explora y postúlate a retos reales diseñados por tus profesores.</p>
            </header>

            {/* FIlter Tabs */}
            <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-1">
                <Link
                    href="/dashboard/projects/market"
                    className={`px-4 py-2 text-sm font-bold rounded-t-lg transition-colors border-b-2 ${!currentFilter ? 'border-blue-600 text-blue-600 bg-blue-50/50' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
                >
                    Todos
                </Link>
                <Link
                    href="/dashboard/projects/market?type=PROJECT"
                    className={`px-4 py-2 text-sm font-bold rounded-t-lg transition-colors border-b-2 ${currentFilter === 'PROJECT' ? 'border-blue-600 text-blue-600 bg-blue-50/50' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
                >
                    Proyectos
                </Link>
                <Link
                    href="/dashboard/projects/market?type=CHALLENGE"
                    className={`px-4 py-2 text-sm font-bold rounded-t-lg transition-colors border-b-2 ${currentFilter === 'CHALLENGE' ? 'border-orange-600 text-orange-600 bg-orange-50/50' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
                >
                    Retos
                </Link>
                <Link
                    href="/dashboard/projects/market?type=PROBLEM"
                    className={`px-4 py-2 text-sm font-bold rounded-t-lg transition-colors border-b-2 ${currentFilter === 'PROBLEM' ? 'border-red-600 text-red-600 bg-red-50/50' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
                >
                    Problemas
                </Link>
            </div>

            {/* Grid de Proyectos */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {availableProjects.map((project) => {
                    const config = typeConfig[project.type] || typeConfig.PROJECT;
                    const Icon = config.icon;

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
                                        {project.teacher.avatarUrl ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img src={project.teacher.avatarUrl} alt={project.teacher.name || "Profesor"} className="w-6 h-6 rounded-full object-cover" />
                                        ) : (
                                            <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500">
                                                {(project.teacher.name || "P")[0]}
                                            </div>
                                        )}
                                        <span className="text-xs text-slate-500 font-medium truncate max-w-[120px]">
                                            {project.teacher.name}
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

                {availableProjects.length === 0 && (
                    <div className="col-span-full py-20 text-center text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                        <p className="font-medium text-lg text-slate-600 mb-1">No hay {currentFilter === 'PROJECT' ? 'proyectos' : currentFilter === 'CHALLENGE' ? 'retos' : currentFilter === 'PROBLEM' ? 'problemas' : 'experiencias'} disponibles.</p>
                        <p className="text-sm">Intenta cambiar el filtro o vuelve más tarde.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
