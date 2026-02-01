'use client';

import { useState } from 'react';
import {
    FileText,
    CheckCircle,
    Clock,
    TrendingUp,
    Search,
    Filter
} from 'lucide-react';
import { cn } from '@/lib/utils';

type Submission = {
    id: string;
    grade: number | null;
    feedback: string | null;
    createdAt: Date;
    status: string;
};

type Assignment = {
    id: string;
    title: string;
    dueDate: Date | null;
    submissions: Submission[];
    projectTitle?: string;
};

type Project = {
    id: string;
    title: string;
    industry: string | null;
    assignments: Assignment[];
};

export default function StudentGradesClient({ projects }: { projects: Project[] }) {
    const [selectedProjectId, setSelectedProjectId] = useState<string>(projects[0]?.id || 'all');
    const [searchQuery, setSearchQuery] = useState('');

    const filteredProjects = selectedProjectId === 'all'
        ? projects
        : projects.filter(p => p.id === selectedProjectId);

    const allAssignments = filteredProjects.flatMap(p =>
        p.assignments.map(a => ({ ...a, projectTitle: p.title }))
    ).filter(a => a.title.toLowerCase().includes(searchQuery.toLowerCase()));

    const gradedSubmissions = allAssignments.flatMap(a => a.submissions).filter(s => s.grade !== null);
    const averageGrade = gradedSubmissions.length > 0
        ? (gradedSubmissions.reduce((acc, s) => acc + (s.grade || 0), 0) / gradedSubmissions.length).toFixed(1)
        : '0.0';

    return (
        <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-8 animate-in fade-in duration-500">
            {/* Header section */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Mis Calificaciones</h1>
                    <p className="text-slate-500 mt-2 font-medium">Seguimiento de tu progreso académico y retroalimentación.</p>
                </div>

                <div className="bg-blue-600 text-white p-6 rounded-3xl shadow-xl shadow-blue-200 flex items-center gap-4 transition-transform hover:scale-105 duration-300">
                    <div className="bg-white/20 p-3 rounded-2xl">
                        <TrendingUp className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-xs font-bold uppercase tracking-wider opacity-80">Promedio General</p>
                        <p className="text-3xl font-black">{averageGrade} <span className="text-sm font-bold opacity-70">pts</span></p>
                    </div>
                </div>
            </header>

            {/* Filters Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white p-4 rounded-3xl border border-slate-200 shadow-sm">
                <div className="relative group">
                    <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                    <select
                        value={selectedProjectId}
                        onChange={(e) => setSelectedProjectId(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all appearance-none cursor-pointer"
                    >
                        <option value="all">Todos los Proyectos</option>
                        {projects.map(p => (
                            <option key={p.id} value={p.id}>{p.title}</option>
                        ))}
                    </select>
                </div>

                <div className="md:col-span-2 relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                    <input
                        type="text"
                        placeholder="Buscar por actividad..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all"
                    />
                </div>
            </div>

            {/* Grades Table/List */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-100 text-left">
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Actividad</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest hidden md:table-cell">Proyecto</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Estado</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Fecha</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Nota</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {allAssignments.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="p-4 bg-slate-50 rounded-full">
                                                <FileText className="w-8 h-8 text-slate-300" />
                                            </div>
                                            <p className="text-slate-500 font-medium">No se encontraron actividades.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                allAssignments.map((a) => {
                                    const submission = a.submissions[0];
                                    const isGraded = submission?.grade !== null && submission?.grade !== undefined;
                                    const isSubmitted = !!submission;

                                    return (
                                        <tr key={a.id} className="hover:bg-slate-50 transition-colors group">
                                            <td className="px-6 py-6">
                                                <div className="flex items-center gap-3">
                                                    <div className={cn(
                                                        "p-2 rounded-xl transition-colors",
                                                        isGraded ? "bg-indigo-50 text-indigo-600" : "bg-slate-100 text-slate-400"
                                                    )}>
                                                        <FileText className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-800 text-sm leading-none">{a.title}</p>
                                                        {isGraded && (
                                                            <p className="text-[10px] text-slate-500 mt-1.5 flex items-center gap-1">
                                                                <CheckCircle className="w-3 h-3 text-emerald-500" /> Retroalimentación disponible
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-6 hidden md:table-cell">
                                                <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full whitespace-nowrap">
                                                    {a.projectTitle}
                                                </span>
                                            </td>
                                            <td className="px-6 py-6">
                                                {isGraded ? (
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-100 text-indigo-700 text-[10px] font-bold rounded-lg uppercase tracking-wide">
                                                        <CheckCircle className="w-3 h-3" /> Revisado
                                                    </span>
                                                ) : isSubmitted ? (
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-lg uppercase tracking-wide">
                                                        <Clock className="w-3 h-3" /> Entregado
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-600 text-[10px] font-bold rounded-lg uppercase tracking-wide border border-amber-100">
                                                        <Clock className="w-3 h-3" /> Pendiente
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-6 text-xs text-slate-500 font-medium">
                                                {a.dueDate ? new Date(a.dueDate).toLocaleDateString() : 'Sin fecha'}
                                            </td>
                                            <td className="px-6 py-6 text-right">
                                                {isGraded ? (
                                                    <span className="text-xl font-black text-blue-600">{submission.grade} <span className="text-[10px] opacity-70">pts</span></span>
                                                ) : (
                                                    <span className="text-sm font-bold text-slate-300">--</span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Feedback Section (Optional: only if one is selected or just show all feedback cards at bottom) */}
            {gradedSubmissions.length > 0 && (
                <div className="space-y-6">
                    <h2 className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
                        <CheckCircle className="w-6 h-6 text-emerald-500" /> Retroalimentación Reciente
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {allAssignments.filter(a => a.submissions[0]?.grade !== null && a.submissions[0]?.feedback).map(a => (
                            <div key={a.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all group">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                                        <FileText className="w-5 h-5" />
                                    </div>
                                    <span className="text-lg font-black text-blue-600">{a.submissions[0].grade} pts</span>
                                </div>
                                <h4 className="font-bold text-slate-800 line-clamp-1 group-hover:text-blue-600 transition-colors">{a.title}</h4>
                                <p className="text-xs text-slate-400 mt-1">{a.projectTitle}</p>
                                <div className="mt-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 relative">
                                    <div className="absolute -top-2 left-4 w-4 h-4 bg-slate-50 rotate-45 border-t border-l border-slate-100" />
                                    <p className="text-xs text-slate-600 italic leading-relaxed line-clamp-3">
                                        &quot;{a.submissions[0].feedback}&quot;
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
