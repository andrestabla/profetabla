'use client';

import { useState } from 'react';
import { Search, Briefcase, BookOpen, Target, Send, User, Loader2, Plus } from 'lucide-react';
import { applyToProjectAction } from './actions';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

// Tipado basado en nuestro nuevo esquema Prisma
type Project = {
type ProjectWithTeacher = { // Renamed type and added 'type' property
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
    type: 'PROJECT' | 'CHALLENGE' | 'PROBLEM'; // Added type property
    teacher: { name: string | null; avatarUrl: string | null };
};

export default function ProjectMarketClient({ availableProjects }: { availableProjects: ProjectWithTeacher[] }) {
    // REMOVED MODAL STATE
    const { data: session } = useSession();
    const canCreate = session?.user?.role === 'TEACHER' || session?.user?.role === 'ADMIN';
    const router = useRouter(); // Added useRouter

    // Mapping icons/colors based on type (Keep this for the card design)
    const typeConfig = {
        PROJECT: { label: "Proyecto", icon: Layers, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200" },
        CHALLENGE: { label: "Reto", icon: CheckSquare, color: "text-orange-600", bg: "bg-orange-50", border: "border-orange-200" },
        PROBLEM: { label: "Problema", icon: Search, color: "text-red-600", bg: "bg-red-50", border: "border-red-200" }
    };

    return (
        <div className="p-6 space-y-8">
            <header className="mb-8 flex justify-between items-start">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Mercado de Proyectos</h1>
                    <p className="text-slate-500">Explora y postúlate a retos reales diseñados por tus profesores.</p>
                </div>
                {canCreate && (
                    <Link
                        href="/dashboard/professor/projects/new"
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-xl shadow-lg transition-all flex items-center gap-2 text-sm"
                    >
                        <Plus className="w-4 h-4" /> Nuevo Proyecto
                    </Link>
                )}
            </header>

            {/* Barra de Búsqueda y Filtros - REMOVED */}
            {/* The search bar and filter section was removed as per the instruction's implied changes */}

            {/* Grid de Proyectos */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {availableProjects.map((project) => {
                    const config = typeConfig[project.type] || typeConfig.PROJECT;
                    const Icon = config.icon;

                    return (
                        <Link
                            key={project.id}
                            href={`/dashboard/projects/market/${project.id}`}
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
                    <div className="col-span-full py-12 text-center text-slate-400">
                        rows={4}
                        required
                        placeholder="Explícale al profesor por qué te interesa este proyecto y qué valor puedes aportar..."
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                ></textarea>
                            </div>

            <div className="flex gap-4">
                <button type="button" onClick={() => setSelectedProject(null)} className="flex-1 py-3 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition-colors">
                    Cancelar
                </button>
                <button
                    type="submit"
                    disabled={isApplying}
                    className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg shadow-lg disabled:opacity-50 transition-all"
                >
                    {isApplying ? <Loader2 className="animate-spin" /> : <><Send className="w-5 h-5" /> Enviar Postulación</>}
                </button>
            </div>
        </form>
                    </div >
                </div >
            )
}
        </div >
    );
}
