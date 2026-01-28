'use client';

import { useState } from 'react';
import {
    Calendar, DollarSign, BarChart, ClipboardCheck,
    BookOpen, User, Briefcase, Clock, ChevronLeft, CheckSquare, Layers, Search,
    ChevronDown, ChevronUp, Clock3, Target, GraduationCap
} from 'lucide-react';
import Link from 'next/link';
import { Project } from '@prisma/client';

// Extend Project type to include teacher
type ProjectWithRelations = Project & {
    teacher: {
        name: string | null;
        avatarUrl: string | null;
        email: string | null;
    };
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

    return (
        <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8 pb-24 font-sans">
            {/* Navigation & Breadcrumbs */}
            <nav className="flex items-center gap-3 text-sm text-slate-500 mb-6">
                <Link href="/dashboard/projects/market" className="hover:text-slate-900 transition-colors flex items-center gap-1">
                    <ChevronLeft className="w-4 h-4" /> Volver al Mercado
                </Link>
                <span className="text-slate-300">/</span>
                <span className="font-medium text-slate-900 truncate max-w-[200px]">{project.title}</span>
            </nav>

            {/* Modern Hero Section */}
            <div className="relative overflow-hidden rounded-3xl bg-white border border-slate-100 shadow-xl shadow-slate-200/50">
                <div className={`absolute top-0 right-0 w-64 h-64 ${config.bg} rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/2`}></div>

                <div className="relative p-8 md:p-10">
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
                                        <img src={project.teacher.avatarUrl} alt={project.teacher.name || ""} className="w-10 h-10 rounded-full object-cover ring-2 ring-white shadow-md" />
                                    ) : (
                                        <div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-sm ring-2 ring-white shadow-md">
                                            {(project.teacher.name || "P")[0]}
                                        </div>
                                    )}
                                    <div className="leading-tight">
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Creado por</p>
                                        <p className="font-bold text-slate-800">{project.teacher.name}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Quick Stats Card in Hero */}
                        <div className="w-full md:w-80 bg-slate-50/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-100 flex flex-col gap-4">
                            {project.schedule && (
                                <div className="flex gap-3 items-start">
                                    <div className="p-2 bg-white rounded-lg shadow-sm text-blue-600">
                                        <Clock3 className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-slate-400 uppercase">Duración</p>
                                        <p className="text-sm font-semibold text-slate-700 line-clamp-2">{project.schedule.split('\n')[0]}</p>
                                    </div>
                                </div>
                            )}
                            <button className="w-full mt-2 py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-lg transition-all hover:translate-y-[-1px] active:translate-y-[1px] flex items-center justify-center gap-2">
                                Postularme Ahora
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Layout Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                {/* Left Column (Navigation Tabs) - Sticky */}
                <div className="lg:col-span-3 lg:sticky lg:top-8 space-y-2">
                    <p className="px-4 text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Contenido</p>
                    <button
                        onClick={() => setActiveTab('overview')}
                        className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-colors flex items-center gap-3 ${activeTab === 'overview' ? 'bg-white text-slate-900 shadow-md shadow-slate-200/50' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}
                    >
                        <BookOpen className="w-4 h-4" /> Generalidades
                    </button>
                    <button
                        onClick={() => setActiveTab('methodology')}
                        className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-colors flex items-center gap-3 ${activeTab === 'methodology' ? 'bg-white text-slate-900 shadow-md shadow-slate-200/50' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}
                    >
                        <Layers className="w-4 h-4" /> Metodología
                    </button>
                    <button
                        onClick={() => setActiveTab('logistics')}
                        className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-colors flex items-center gap-3 ${activeTab === 'logistics' ? 'bg-white text-slate-900 shadow-md shadow-slate-200/50' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}
                    >
                        <Target className="w-4 h-4" /> Evaluación y Recursos
                    </button>
                </div>

                {/* Right Column (Content) */}
                <div className="lg:col-span-9 space-y-10 min-h-[600px]">

                    {/* TAB: OVERVIEW */}
                    {activeTab === 'overview' && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">

                            {/* Justification Card */}
                            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
                                <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                                    <Target className="w-6 h-6 text-purple-600" />
                                    Por qué este proyecto
                                </h3>
                                <p className="text-lg text-slate-600 leading-relaxed max-w-3xl">
                                    {project.description}
                                </p>
                                <div className="mt-8 pt-8 border-t border-slate-100">
                                    <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Fundamentación</h4>
                                    <p className="text-slate-600 leading-relaxed">{project.justification}</p>
                                </div>
                            </div>

                            {/* Objectives Grid */}
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="bg-emerald-50 p-8 rounded-3xl border border-emerald-100">
                                    <h3 className="font-bold text-emerald-800 mb-4 flex items-center gap-2">
                                        <CheckSquare className="w-5 h-5" /> Objetivos de Aprendizaje
                                    </h3>
                                    <p className="text-emerald-700/80 leading-relaxed text-sm whitespace-pre-wrap">
                                        {project.objectives}
                                    </p>
                                </div>
                                <div className="bg-blue-50 p-8 rounded-3xl border border-blue-100">
                                    <h3 className="font-bold text-blue-800 mb-4 flex items-center gap-2">
                                        <GraduationCap className="w-5 h-5" /> Entregables Esperados
                                    </h3>
                                    <p className="text-blue-700/80 leading-relaxed text-sm whitespace-pre-wrap">
                                        {project.deliverables}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB: METHODOLOGY */}
                    {activeTab === 'methodology' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                            <div className="bg-white p-8 md:p-12 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-32 bg-slate-50 rounded-full -translate-y-1/2 translate-x-1/2 opacity-50"></div>
                                <h3 className="text-2xl font-bold text-slate-800 mb-8 relative">Ruta de Aprendizaje</h3>

                                {project.methodology ? (
                                    <div className="prose prose-lg prose-slate max-w-none">
                                        {/* Hacky way to style the markdown-like content nicely */}
                                        <div className="whitespace-pre-wrap font-serif text-slate-600">
                                            {project.methodology}
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-slate-500 italic">No se ha especificado una metodología detallada.</p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* TAB: LOGISTICS */}
                    {activeTab === 'logistics' && (
                        <div className="grid md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
                                <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                                    <ClipboardCheck className="w-5 h-5 text-indigo-500" /> Evaluación
                                </h3>
                                <div className="prose prose-sm prose-slate text-slate-600 whitespace-pre-wrap">
                                    {project.evaluation || "No especificada."}
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
                                    <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                                        <BarChart className="w-5 h-5 text-pink-500" /> KPIs de Éxito
                                    </h3>
                                    <div className="prose prose-sm prose-slate text-slate-600 whitespace-pre-wrap">
                                        {project.kpis || "No especificados."}
                                    </div>
                                </div>
                                <div className="bg-slate-900 p-8 rounded-3xl text-white shadow-xl">
                                    <h3 className="font-bold mb-4 flex items-center gap-2 opacity-90">
                                        <DollarSign className="w-5 h-5" /> Presupuesto & Recursos
                                    </h3>
                                    <div className="text-slate-300 text-sm whitespace-pre-wrap">
                                        {project.budget || "No disponible."}
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
