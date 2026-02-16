'use client';

import { useState } from 'react';
import { CheckCircle, Clock, FileText, ExternalLink, Filter } from 'lucide-react';
import Link from 'next/link';
import { calculateTotalQuizScore } from '@/lib/quiz-utils';

/* eslint-disable @typescript-eslint/no-explicit-any */
type Assignment = {
    id: string;
    title: string;
    description: string | null;
    dueDate: string | null;
    evaluationCriteria: string | null;
    project: {
        id: string;
        title: string;
    };
    submissions: any[];
    rubricItems: any[];
    task: {
        status: string;
        priority: string;
        allowedFileTypes: string[];
        maxDate: string | null;
        comments: any[];
        type?: 'TASK' | 'QUIZ';
        quizData?: any;
    } | null;
};

type ProjectOption = {
    id: string;
    title: string;
};

export default function AssignmentsTimelineClient({ assignments, projects = [] }: { assignments: Assignment[], initialSelectedId?: string, projects?: ProjectOption[] }) {
    const [filterProjectId, setFilterProjectId] = useState<string>('ALL');

    const filteredAssignments = filterProjectId === 'ALL'
        ? assignments
        : assignments.filter(a => a.project.id === filterProjectId);

    return (
        <div className="w-full max-w-5xl mx-auto pb-20">
            {/* Header with Filters */}
            <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4 mb-10">
                <div>
                    <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700">
                        Línea de Tiempo de Entregas
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">Gestiona tus entregas y revisiones pendientes</p>
                </div>

                {projects.length > 0 && (
                    <div className="relative group">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-hover:text-blue-500 transition-colors" />
                        <select
                            value={filterProjectId}
                            onChange={(e) => setFilterProjectId(e.target.value)}
                            className="pl-10 pr-8 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 shadow-sm focus:ring-4 focus:ring-blue-50 focus:border-blue-200 outline-none appearance-none cursor-pointer hover:border-blue-200 transition-all min-w-[200px]"
                        >
                            <option value="ALL">Todos los Proyectos</option>
                            {projects.map(p => (
                                <option key={p.id} value={p.id}>{p.title}</option>
                            ))}
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                            <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </div>
                    </div>
                )}
            </div>

            <div className="relative border-l-2 border-slate-100 ml-4 md:ml-6 space-y-12">
                {filteredAssignments.length === 0 ? (
                    <div className="pl-8 py-12">
                        <div className="bg-slate-50 rounded-2xl border border-dashed border-slate-200 p-8 text-center">
                            <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center mx-auto mb-4">
                                <Filter className="w-6 h-6 text-slate-300" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-700">No hay entregas</h3>
                            <p className="text-slate-500 text-sm mt-1">
                                {filterProjectId === 'ALL'
                                    ? 'No tienes entregas asignadas actualmente.'
                                    : 'No hay entregas para este proyecto.'}
                            </p>
                            {filterProjectId !== 'ALL' && (
                                <button
                                    onClick={() => setFilterProjectId('ALL')}
                                    className="mt-4 text-blue-600 text-sm font-bold hover:underline"
                                >
                                    Ver todos los proyectos
                                </button>
                            )}
                        </div>
                    </div>
                ) : (
                    filteredAssignments.map((assignment, index) => {
                        const isSubmitted = assignment.submissions && assignment.submissions.length > 0;
                        const submission = isSubmitted ? assignment.submissions[0] : null;
                        let grade = submission?.grade;

                        // Fallback for auto-graded quizzes
                        if (grade === null && assignment.task?.type === 'QUIZ' && (assignment.task as any)?.quizData?.gradingMethod === 'AUTO' && submission) {
                            grade = calculateTotalQuizScore((assignment.task as any).quizData.questions || [], submission.answers || {});
                        }
                        const isGraded = grade != null;

                        return (
                            <div key={assignment.id} className="relative pl-8 animate-in slide-in-from-bottom-5 duration-500" style={{ animationDelay: `${index * 100}ms` }}>
                                {/* Dot */}
                                <div className={`absolute -left-[9px] top-6 w-5 h-5 rounded-full border-4 border-white shadow-sm ${isGraded ? 'bg-indigo-500' : isSubmitted ? 'bg-emerald-500' : 'bg-blue-500'}`} />

                                {/* Date Label */}
                                <div className="absolute -left-[140px] top-6 w-[120px] text-right hidden md:block">
                                    <p className="text-sm font-bold text-slate-700">
                                        {assignment.dueDate ? new Date(assignment.dueDate).toLocaleDateString() : 'Sin fecha'}
                                    </p>
                                    <p className="text-xs text-slate-400">
                                        {assignment.dueDate ? new Date(assignment.dueDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Flexible'}
                                    </p>
                                </div>

                                {/* Card */}
                                <div className={`rounded-2xl border p-6 transition-all hover:shadow-md ${isGraded ? 'bg-indigo-50/50 border-indigo-100' : isSubmitted ? 'bg-emerald-50/50 border-emerald-100' : 'bg-white border-slate-200'}`}>
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
                                                    {assignment.project.title}
                                                </span>
                                                {assignment.task && (
                                                    <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${assignment.task.priority === 'HIGH' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                                                        {assignment.task?.priority}
                                                    </span>
                                                )}
                                            </div>
                                            <h3 className="text-lg font-bold text-slate-800">{assignment.title}</h3>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-2 mt-2">
                                            {isGraded ? (
                                                <div className="flex items-center gap-1.5 text-indigo-600 bg-indigo-100 px-3 py-1 rounded-lg text-xs font-bold">
                                                    <CheckCircle className="w-4 h-4" /> Revisado {grade != null && `(${grade} pts)`}
                                                </div>
                                            ) : isSubmitted ? (
                                                <div className="flex items-center gap-1.5 text-emerald-600 bg-emerald-100 px-3 py-1 rounded-lg text-xs font-bold">
                                                    <CheckCircle className="w-4 h-4" /> Entregado
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-1.5 text-amber-600 bg-amber-50 px-3 py-1 rounded-lg text-xs font-bold border border-amber-100">
                                                    <Clock className="w-4 h-4" /> Pendiente
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="text-sm text-slate-600 mb-6 bg-slate-50 p-4 rounded-xl border border-slate-100 leading-relaxed line-clamp-3">
                                        {assignment.description || 'Sin descripción detallada.'}
                                    </div>

                                    <div className="flex justify-end gap-3">
                                        {isSubmitted ? (
                                            <div className="flex gap-2">
                                                {submission?.fileType === 'URL' ? (
                                                    <a href={submission.fileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-bold hover:bg-slate-200 transition-colors">
                                                        <ExternalLink className="w-4 h-4" /> Ver Enlace
                                                    </a>
                                                ) : (
                                                    <a href={submission?.fileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-bold hover:bg-slate-200 transition-colors">
                                                        <FileText className="w-4 h-4" /> Ver Archivo
                                                    </a>
                                                )}
                                                <Link
                                                    href={`/dashboard/student/assignments/${assignment.id}`}
                                                    className={`px-4 py-2 border rounded-lg text-sm font-bold transition-colors flex items-center justify-center ${isGraded ? 'border-indigo-200 text-indigo-600 hover:bg-indigo-50' : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'}`}
                                                >
                                                    {isGraded ? 'Ver Retroalimentación' : 'Ver Detalles'}
                                                </Link>
                                            </div>
                                        ) : (
                                            <Link
                                                href={`/dashboard/student/assignments/${assignment.id}`}
                                                className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold shadow-md shadow-blue-200 hover:bg-blue-700 hover:shadow-lg transition-all"
                                            >
                                                <FileText className="w-4 h-4" /> {assignment.task?.priority === 'QUIZ' ? 'Ver Detalles & Iniciar' : 'Ver Detalles & Entregar'}
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
