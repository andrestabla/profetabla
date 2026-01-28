'use client';

import { useState } from 'react';
import {
    Calendar, DollarSign, BarChart, ClipboardCheck,
    BookOpen, User, Briefcase, Clock, ChevronLeft, CheckSquare, Layers, Search,
    ChevronDown, ChevronUp, Clock3, Target, GraduationCap, Map
} from 'lucide-react';
import Link from 'next/link';
import { Project } from '@prisma/client';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// Extend Project type to include teacher
type ProjectWithRelations = Project & {
    teacher: {
        name: string | null;
        avatarUrl: string | null;
        email: string | null;
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    learningObjects: any[];
};

export default function ProjectDetailClient({ project }: { project: ProjectWithRelations }) {
    const [activeTab, setActiveTab] = useState<'overview' | 'methodology' | 'logistics'>('overview');

    const typeConfig = {
        PROJECT: { label: "Proyecto", icon: Layers, color: "text-blue-600", bg: "bg-blue-50", ring: "ring-blue-100" },
        CHALLENGE: { label: "Reto", icon: CheckSquare, color: "text-orange-600", bg: "bg-orange-50", ring: "ring-orange-100" },
        PROBLEM: { label: "Problema", icon: Search, color: "text-red-600", bg: "bg-red-50", ring: "ring-red-100" }
    };

    const config = typeConfig[project.type as keyof typeof typeConfig] || typeConfig.PROJECT;
    const Icon = config.icon;

    // Helper for Markdown Styling
    const MarkdownContent = ({ content }: { content: string | null }) => {
        if (!content) return <span className="text-slate-400 italic">No disponible</span>;

        return (
            <div className="prose prose-sm prose-slate max-w-none 
                prose-headings:font-bold prose-headings:text-slate-800 
                prose-p:text-slate-600 prose-p:leading-relaxed
                prose-li:text-slate-600 prose-li:marker:text-blue-500
                prose-strong:text-slate-800 prose-strong:font-bold
                prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline
            ">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {content}
                </ReactMarkdown>
            </div>
        );
    };

    return (
        <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8 pb-24 font-sans bg-slate-50/50 min-h-screen">
            {/* Navigation & Breadcrumbs */}
            <nav className="flex items-center gap-3 text-sm text-slate-500 mb-6">
                <Link href="/dashboard/projects/market" className="hover:text-slate-900 transition-colors flex items-center gap-1">
                    <ChevronLeft className="w-4 h-4" /> Volver al Mercado
                </Link>
                <span className="text-slate-300">/</span>
                <span className="font-medium text-slate-900 truncate max-w-[200px]">{project.title}</span>
            </nav>

            {/* Modern Hero Section */}
            <div className="relative overflow-hidden rounded-3xl bg-white border border-slate-200 shadow-xl shadow-slate-200/50 p-1">
                <div className={`absolute top-0 right-0 w-96 h-96 ${config.bg} rounded-full blur-3xl opacity-30 -translate-y-1/2 translate-x-1/2`}></div>

                <div className="relative p-8 md:p-10 bg-white/50 backdrop-blur-sm rounded-[20px]">
                    <div className="flex flex-col md:flex-row gap-8 items-start">
                        <div className="flex-1 space-y-6">
                            <div className="flex items-center gap-3">
                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${config.bg} ${config.color} ring-1 inset ring-black/5`}>
                                    <Icon className="w-3.5 h-3.5" />
                                    {config.label}
                                </span>
                                {project.industry && (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold text-slate-600 bg-slate-100">
                                        <Briefcase className="w-3.5 h-3.5" />
                                        {project.industry}
                                    </span>
                                )}
                            </div>

                            <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-[1.1]">
                                {project.title}
                            </h1>

                            <div className="flex items-center gap-6 pt-2">
                                <div className="flex items-center gap-3">
                                    {project.teacher.avatarUrl ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={project.teacher.avatarUrl} alt={project.teacher.name || ""} className="w-10 h-10 rounded-full object-cover ring-4 ring-white shadow-md bg-white" />
                                    ) : (
                                        <div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-sm ring-4 ring-white shadow-md">
                                            {(project.teacher.name || "P")[0]}
                                        </div>
                                    )}
                                    <div className="leading-tight">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Liderado por</p>
                                        <p className="font-bold text-slate-800">{project.teacher.name}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Quick Stats / CTA Card */}
                        <div className="w-full md:w-80 bg-white/80 backdrop-blur-md rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col gap-4 relative z-10">
                            {project.schedule && (
                                <div className="flex gap-4 items-start pb-4 border-b border-slate-100">
                                    <div className="p-2.5 bg-blue-50 rounded-xl text-blue-600 shrink-0">
                                        <Clock3 className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-0.5">Duración Estimada</p>
                                        <div className="text-sm font-semibold text-slate-700 line-clamp-3 leading-snug">
                                            <MarkdownContent content={project.schedule?.split('\n')[0] || "No especificada"} />
                                        </div>
                                    </div>
                                </div>
                            )}
                            <button className="w-full py-4 bg-slate-900 hover:bg-black text-white font-bold rounded-xl shadow-lg shadow-slate-900/20 transition-all hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 group">
                                Postularme Ahora
                                <span className="inline-block transition-transform group-hover:translate-x-1">→</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Layout Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                {/* Left Column (Navigation Tabs) - Sticky */}
                <div className="lg:col-span-3 lg:sticky lg:top-8 space-y-1">
                    <p className="px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 pl-6">Navegación</p>
                    <button
                        onClick={() => setActiveTab('overview')}
                        className={`w-full text-left px-6 py-4 rounded-2xl text-sm font-bold transition-all flex items-center gap-3 ${activeTab === 'overview' ? 'bg-white text-indigo-600 shadow-lg shadow-indigo-100 ring-1 ring-indigo-50' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'}`}
                    >
                        <BookOpen className="w-4 h-4 opacity-70" /> Resumen General
                    </button>
                    <button
                        onClick={() => setActiveTab('methodology')}
                        className={`w-full text-left px-6 py-4 rounded-2xl text-sm font-bold transition-all flex items-center gap-3 ${activeTab === 'methodology' ? 'bg-white text-orange-600 shadow-lg shadow-orange-100 ring-1 ring-orange-50' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'}`}
                    >
                        <Map className="w-4 h-4 opacity-70" /> Ruta de Trabajo
                    </button>
                    <button
                        onClick={() => setActiveTab('logistics')}
                        className={`w-full text-left px-6 py-4 rounded-2xl text-sm font-bold transition-all flex items-center gap-3 ${activeTab === 'logistics' ? 'bg-white text-emerald-600 shadow-lg shadow-emerald-100 ring-1 ring-emerald-50' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'}`}
                    >
                        <Target className="w-4 h-4 opacity-70" /> Criterios y Recursos
                    </button>
                </div>

                {/* Right Column (Content) */}
                <div className="lg:col-span-9 space-y-10 min-h-[600px]">

                    {/* TAB: OVERVIEW */}
                    {activeTab === 'overview' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-forwards">

                            {/* Justification Card */}
                            <div className="bg-white p-8 md:p-10 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-50 rounded-full blur-3xl -mr-16 -mt-16"></div>

                                <div className="flex flex-col gap-6 relative">
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                                            <Target className="w-5 h-5 text-purple-600" />
                                            Contexto y Justificación
                                        </h3>
                                        <MarkdownContent content={project.description} />
                                    </div>

                                    {project.justification && (
                                        <div className="pt-6 border-t border-slate-100">
                                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Fundamentación Teórica</h4>
                                            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                                                <MarkdownContent content={project.justification} />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Objectives Grid */}
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="bg-white p-8 rounded-3xl border border-emerald-100 shadow-sm relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-full blur-2xl -mr-10 -mt-10"></div>
                                    <h3 className="font-bold text-emerald-800 mb-4 flex items-center gap-2 relative z-10">
                                        <CheckSquare className="w-5 h-5" /> Objetivos de Aprendizaje
                                    </h3>
                                    <div className="relative z-10 text-emerald-900/80">
                                        <MarkdownContent content={project.objectives} />
                                    </div>
                                </div>
                                <div className="bg-white p-8 rounded-3xl border border-blue-100 shadow-sm relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-full blur-2xl -mr-10 -mt-10"></div>
                                    <h3 className="font-bold text-blue-800 mb-4 flex items-center gap-2 relative z-10">
                                        <GraduationCap className="w-5 h-5" /> Entregables Esperados
                                    </h3>
                                    <div className="relative z-10 text-blue-900/80">
                                        <MarkdownContent content={project.deliverables} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB: METHODOLOGY */}
                    {activeTab === 'methodology' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-forwards space-y-6">
                            <div className="bg-white p-8 md:p-12 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-40 bg-orange-50/50 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>

                                <div className="relative">
                                    <h3 className="text-2xl font-bold text-slate-800 mb-2 flex items-center gap-3">
                                        <Map className="w-6 h-6 text-orange-500" />
                                        Metodología del Proyecto
                                    </h3>
                                    <p className="text-slate-500 mb-8">Pasos detallados y enfoque pedagógico</p>

                                    {project.methodology ? (
                                        <div className="pl-4 border-l-2 border-orange-100 md:pl-8 md:border-l-4">
                                            <MarkdownContent content={project.methodology} />
                                        </div>
                                    ) : (
                                        <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                            <p className="text-slate-400 italic">No se ha especificado una metodología detallada.</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Schedule Card (Separate visual block) */}
                            {project.schedule && (
                                <div className="bg-slate-900 text-slate-200 p-8 md:p-10 rounded-3xl shadow-xl relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-slate-800 rounded-full blur-3xl -mr-20 -mt-20 opacity-50"></div>
                                    <h3 className="font-bold text-white mb-6 flex items-center gap-2 relative relative z-10">
                                        <Calendar className="w-5 h-5 text-blue-400" /> Cronograma Estimado
                                    </h3>
                                    <div className="relative z-10 prose prose-invert prose-sm max-w-none">
                                        <MarkdownContent content={project.schedule} />
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* TAB: LOGISTICS */}
                    {activeTab === 'logistics' && (
                        <div className="grid md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-forwards">
                            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm h-full">
                                <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                                    <ClipboardCheck className="w-5 h-5 text-indigo-500" /> Criterios de Evaluación
                                </h3>
                                <div className="bg-indigo-50/50 rounded-2xl p-6 border border-indigo-50 h-[calc(100%-4rem)]">
                                    <MarkdownContent content={project.evaluation} />
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
                                    <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                                        <BarChart className="w-5 h-5 text-pink-500" /> Indicadores (KPIs)
                                    </h3>
                                    <MarkdownContent content={project.kpis} />
                                </div>

                                <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-8 rounded-3xl text-white shadow-lg">
                                    <h3 className="font-bold mb-4 flex items-center gap-2 text-slate-200">
                                        <DollarSign className="w-5 h-5 text-emerald-400" /> Presupuesto & Recursos
                                    </h3>
                                    <div className="text-slate-300 text-sm">
                                        <MarkdownContent content={project.budget} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}
