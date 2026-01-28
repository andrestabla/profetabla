'use client';

import { useState, useTransition } from 'react';
import {
    Calendar, DollarSign, BarChart, ClipboardCheck,
    BookOpen, Briefcase, ChevronLeft, CheckSquare, Layers, Search,
    Clock3, Target, GraduationCap, Map, Layout
} from 'lucide-react';
import Link from 'next/link';
import { Project } from '@prisma/client';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { applyToProjectAction } from '@/app/actions/project-actions';

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

export default function ProjectDetailClient({ project, initialStatus }: { project: ProjectWithRelations, initialStatus: string }) {
    const [activeTab, setActiveTab] = useState<'overview' | 'methodology' | 'logistics'>('overview');
    const [isPending, startTransition] = useTransition();
    const [applicationStatus, setApplicationStatus] = useState(initialStatus);

    const handleApply = () => {
        console.log("🖱️ [Client] Postularme button clicked");
        startTransition(async () => {
            try {
                console.log("⏳ [Client] Calling applyToProjectAction...");
                await applyToProjectAction(project.id);
                console.log("✅ [Client] applyToProjectAction successful");
                setApplicationStatus('PENDING');
            } catch (error) {
                console.error("❌ [Client] Error in applyToProjectAction:", error);
                alert("Error al postularse. Revisa la consola para más detalles.");
            }
        });
    };

    const typeConfig = {
        PROJECT: { label: "Proyecto", icon: Layers, color: "text-blue-600", bg: "bg-blue-50", ring: "ring-blue-100" },
        CHALLENGE: { label: "Reto", icon: CheckSquare, color: "text-orange-600", bg: "bg-orange-50", ring: "ring-orange-100" },
        PROBLEM: { label: "Problema", icon: Search, color: "text-red-600", bg: "bg-red-50", ring: "ring-red-100" }
    };

    // Safe type fallback
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const projectType = (project as any).type || 'PROJECT';
    const config = typeConfig[projectType as keyof typeof typeConfig] || typeConfig.PROJECT;
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
                prose-ul:list-disc prose-ol:list-decimal
            ">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {content}
                </ReactMarkdown>
            </div>
        );
    };

    return (
        <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-6 pb-24 font-sans bg-slate-50/50 min-h-screen">
            {/* Navigation & Breadcrumbs */}
            <nav className="flex items-center gap-3 text-sm text-slate-500 mb-2">
                <Link href="/dashboard/projects/market" className="hover:text-slate-900 transition-colors flex items-center gap-1">
                    <ChevronLeft className="w-4 h-4" /> Volver al Mercado
                </Link>
                <span className="text-slate-300">/</span>
                <span className="font-medium text-slate-900 truncate max-w-[200px]">{project.title}</span>
            </nav>

            {/* Modern Hero Section */}
            <div className="relative overflow-hidden rounded-3xl bg-white border border-slate-200 shadow-xl shadow-slate-200/50 p-1">
                <div className={`absolute top-0 right-0 w-96 h-96 ${config.bg} rounded-full blur-3xl opacity-30 -translate-y-1/2 translate-x-1/2`}></div>

                <div className="relative p-6 md:p-10 bg-white/50 backdrop-blur-sm rounded-[20px]">
                    <div className="flex flex-col md:flex-row gap-8 items-start">
                        <div className="flex-1 space-y-5">
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

                            <h1 className="text-2xl md:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight leading-[1.1]">
                                {project.title}
                            </h1>

                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-3 bg-white/60 px-4 py-2 rounded-full border border-slate-100 shadow-sm">
                                    {project.teacher.avatarUrl ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={project.teacher.avatarUrl} alt={project.teacher.name || ""} className="w-8 h-8 rounded-full object-cover ring-2 ring-white" />
                                    ) : (
                                        <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs ring-2 ring-white">
                                            {(project.teacher.name || "P")[0]}
                                        </div>
                                    )}
                                    <div className="leading-tight">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Liderado por</p>
                                        <p className="text-sm font-bold text-slate-800">{project.teacher.name}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Quick Stats / CTA Card */}
                        <div className="w-full md:w-80 bg-white/80 backdrop-blur-md rounded-2xl p-5 border border-slate-100 shadow-sm flex flex-col gap-4 relative z-10">
                            {project.schedule && (
                                <div className="flex gap-4 items-start pb-4 border-b border-slate-100">
                                    <div className="p-2.5 bg-blue-50 rounded-xl text-blue-600 shrink-0">
                                        <Clock3 className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-0.5">Duración Estimada</p>
                                        <div className="text-xs font-semibold text-slate-700 line-clamp-2 leading-snug">
                                            <MarkdownContent content={project.schedule?.split('\n')[0] || "No especificada"} />
                                        </div>
                                    </div>
                                </div>
                            )}
                            <button className="w-full py-3.5 bg-slate-900 hover:bg-black text-white font-bold rounded-xl shadow-lg shadow-slate-900/20 transition-all hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 group text-sm">
                                Postularme Ahora
                                <span className="inline-block transition-transform group-hover:translate-x-1">→</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* HORIZONTAL TABS */}
            <div className="border-b border-slate-200">
                <div className="flex gap-8 overflow-x-auto pb-px">
                    <button
                        onClick={() => setActiveTab('overview')}
                        className={`pb-3 text-sm font-bold transition-all whitespace-nowrap border-b-2 flex items-center gap-2 ${activeTab === 'overview'
                            ? 'border-indigo-600 text-indigo-600'
                            : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'}`}
                    >
                        <Layout className="w-4 h-4" /> Resumen & Objetivos
                    </button>
                    <button
                        onClick={() => setActiveTab('methodology')}
                        className={`pb-3 text-sm font-bold transition-all whitespace-nowrap border-b-2 flex items-center gap-2 ${activeTab === 'methodology'
                            ? 'border-orange-500 text-orange-600'
                            : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'}`}
                    >
                        <Map className="w-4 h-4" /> Ruta de Trabajo
                    </button>
                    <button
                        onClick={() => setActiveTab('logistics')}
                        className={`pb-3 text-sm font-bold transition-all whitespace-nowrap border-b-2 flex items-center gap-2 ${activeTab === 'logistics'
                            ? 'border-emerald-500 text-emerald-600'
                            : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'}`}
                    >
                        <Target className="w-4 h-4" /> Evaluación y Recursos
                    </button>
                </div>
            </div>

            {/* TAB CONTENT AREAD (Full Width) */}
            <div className="min-h-[500px]">

                {/* TAB: OVERVIEW */}
                {activeTab === 'overview' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        {/* Main Column */}
                        <div className="lg:col-span-2 space-y-6">
                            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden">
                                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                                    <Target className="w-5 h-5 text-purple-600" />
                                    Contexto y Justificación
                                </h3>
                                <MarkdownContent content={project.description} />

                                {project.justification && (
                                    <div className="mt-6 pt-6 border-t border-slate-100">
                                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Fundamentación Teórica</h4>
                                        <MarkdownContent content={project.justification} />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Side Column */}
                        <div className="space-y-6">
                            <div className="bg-emerald-50 p-6 rounded-3xl border border-emerald-100">
                                <h3 className="font-bold text-emerald-800 mb-3 flex items-center gap-2 text-sm uppercase tracking-wide">
                                    <CheckSquare className="w-4 h-4" /> Objetivos
                                </h3>
                                <div className="text-emerald-900/80 text-sm">
                                    <MarkdownContent content={project.objectives} />
                                </div>
                            </div>
                            <div className="bg-blue-50 p-6 rounded-3xl border border-blue-100">
                                <h3 className="font-bold text-blue-800 mb-3 flex items-center gap-2 text-sm uppercase tracking-wide">
                                    <GraduationCap className="w-4 h-4" /> Entregables
                                </h3>
                                <div className="text-blue-900/80 text-sm">
                                    <MarkdownContent content={project.deliverables} />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB: METHODOLOGY */}
                {activeTab === 'methodology' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
                            <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                                <Map className="w-6 h-6 text-orange-500" />
                                Metodología Detallada
                            </h3>
                            {project.methodology ? (
                                <div className="pl-4 border-l-4 border-orange-100">
                                    <MarkdownContent content={project.methodology} />
                                </div>
                            ) : (
                                <p className="text-slate-400 italic">No especificada.</p>
                            )}
                        </div>

                        <div>
                            {project.schedule && (
                                <div className="bg-slate-900 text-slate-200 p-8 rounded-3xl shadow-xl sticky top-8">
                                    <h3 className="font-bold text-white mb-6 flex items-center gap-2">
                                        <Calendar className="w-5 h-5 text-blue-400" /> Cronograma
                                    </h3>
                                    <div className="prose prose-invert prose-sm max-w-none">
                                        <MarkdownContent content={project.schedule} />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* TAB: LOGISTICS */}
                {activeTab === 'logistics' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
                            <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                                <ClipboardCheck className="w-5 h-5 text-indigo-500" /> Criterios de Evaluación
                            </h3>
                            <div className="bg-indigo-50/50 rounded-2xl p-6 border border-indigo-50">
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
    );
}
