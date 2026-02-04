'use client';

import { useState, useTransition, useEffect } from 'react';
import {
    Calendar, DollarSign, BarChart, ClipboardCheck,
    BookOpen, Briefcase, ChevronLeft, CheckSquare, Layers, Search,
    Clock3, Target, GraduationCap, Map, Layout, Video, FileText, Play, X, Maximize2
} from 'lucide-react';
import Link from 'next/link';
import { Project } from '@prisma/client';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { applyToProjectAction } from '@/app/actions/project-actions';

interface Resource {
    id: string;
    title: string;
    type: string;
    url: string;
    presentation?: string | null;
    utility?: string | null;
    createdAt: Date | string;
}

type ProjectWithRelations = Project & {
    teachers: {
        name: string | null;
        avatarUrl: string | null;
        email: string | null;
    }[];
    learningObjects: { id: string; title: string }[];
    resources: Resource[];
};

export default function ProjectDetailClient({ project, initialStatus }: { project: ProjectWithRelations, initialStatus: string }) {
    const [activeTab, setActiveTab] = useState<'overview' | 'methodology' | 'logistics' | 'resources'>('overview');
    const [isPending, startTransition] = useTransition();
    const [applicationStatus, setApplicationStatus] = useState(initialStatus);
    const [viewerResource, setViewerResource] = useState<Resource | null>(null);

    // Helper to get primary teacher
    const teacher = project.teachers?.[0] || { name: 'Sin Asignar', avatarUrl: null, email: null };

    // Sync state with server prop updates (from revalidatePath)
    useEffect(() => {
        setApplicationStatus(initialStatus);
    }, [initialStatus]);

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

    // Helper for Markdown/HTML Content Rendering
    const MarkdownContent = ({ content }: { content: string | null }) => {
        if (!content) return <span className="text-slate-400 italic">No disponible</span>;

        // Detect if content is HTML (contains HTML tags)
        const isHTML = /<[a-z][\s\S]*>/i.test(content);

        const proseClasses = `prose prose-sm prose-slate max-w-none 
            prose-headings:font-extrabold prose-headings:text-slate-900 prose-headings:tracking-tight
            prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg
            prose-p:text-slate-700 prose-p:leading-relaxed prose-p:mb-4
            prose-li:text-slate-700 prose-li:leading-relaxed prose-li:marker:text-blue-600 prose-li:marker:font-bold
            prose-strong:text-slate-900 prose-strong:font-bold
            prose-em:text-slate-600 prose-em:italic
            prose-a:text-blue-600 prose-a:font-semibold prose-a:no-underline hover:prose-a:underline hover:prose-a:text-blue-700
            prose-ul:my-4 prose-ul:space-y-2 prose-ol:my-4 prose-ol:space-y-2
            prose-code:text-sm prose-code:bg-slate-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-slate-800
            prose-blockquote:border-l-4 prose-blockquote:border-blue-500 prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-slate-600
        `;

        if (isHTML) {
            // Render HTML content
            return (
                <div
                    className={proseClasses}
                    dangerouslySetInnerHTML={{ __html: content }}
                />
            );
        }

        // Render Markdown content
        return (
            <div className={proseClasses}>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {content}
                </ReactMarkdown>
            </div>
        );
    };

    const ResourceIcon = ({ type }: { type: string }) => {
        switch (type) {
            case 'VIDEO': return <Video className="w-5 h-5 text-red-500" />;
            case 'ARTICLE': return <FileText className="w-5 h-5 text-blue-500" />;
            case 'EMBED': return <Layers className="w-5 h-5 text-purple-500" />;
            case 'DRIVE': return <BookOpen className="w-5 h-5 text-emerald-500" />;
            default: return <BookOpen className="w-5 h-5 text-slate-400" />;
        }
    };

    return (
        <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-6 pb-24 font-sans bg-slate-50/50 min-h-screen">
            {/* Navigation & Breadcrumbs */}
            <nav className="flex items-center gap-3 text-sm text-slate-500 mb-2">
                <Link
                    href="/dashboard/market"
                    className="flex items-center gap-2 text-slate-500 hover:text-slate-700 transition-colors mb-4 w-fit"
                >    <ChevronLeft className="w-4 h-4" /> Volver al Mercado
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
                                    {teacher.avatarUrl ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={teacher.avatarUrl} alt={teacher.name || ""} className="w-8 h-8 rounded-full object-cover ring-2 ring-white" />
                                    ) : (
                                        <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs ring-2 ring-white">
                                            {(teacher.name || "P")[0]}
                                        </div>
                                    )}
                                    <div className="leading-tight">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Liderado por</p>
                                        <p className="text-sm font-bold text-slate-800">{teacher.name}</p>
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
                            <div className="w-full">
                                {applicationStatus === 'ACCEPTED' ? (
                                    <Link
                                        href="/dashboard"
                                        className="w-full py-3.5 font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 group text-sm bg-green-600 text-white shadow-green-900/20 hover:bg-green-700"
                                    >
                                        ¡Aceptado! Ir al Dashboard <span className="inline-block transition-transform group-hover:translate-x-1">→</span>
                                    </Link>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={handleApply}
                                        disabled={isPending || applicationStatus === 'PENDING'}
                                        className={`w-full py-3.5 font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 group text-sm disabled:opacity-80 disabled:cursor-not-allowed
                                            ${applicationStatus === 'PENDING'
                                                ? 'bg-yellow-500 text-white shadow-yellow-900/20'
                                                : 'bg-slate-900 hover:bg-black text-white shadow-slate-900/20 hover:-translate-y-0.5 active:translate-y-0'
                                            }
                                        `}
                                    >
                                        {isPending ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                Enviando...
                                            </>
                                        ) : applicationStatus === 'PENDING' ? (
                                            <>
                                                Solicitud Pendiente
                                            </>
                                        ) : (
                                            <>
                                                Postularme Ahora <span className="inline-block transition-transform group-hover:translate-x-1">→</span>
                                            </>
                                        )}
                                    </button>
                                )}
                            </div>
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
                            <div className="bg-gradient-to-br from-white via-white to-purple-50/30 p-8 md:p-10 rounded-3xl border border-slate-200 shadow-lg shadow-slate-200/50 relative overflow-hidden">
                                {/* Decorative element */}
                                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-purple-100/40 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>

                                <div className="relative">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="p-2.5 bg-purple-100 rounded-xl">
                                            <Target className="w-6 h-6 text-purple-600" />
                                        </div>
                                        <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">
                                            Contexto y Justificación
                                        </h3>
                                    </div>
                                    <div className="space-y-4">
                                        <MarkdownContent content={project.description} />
                                    </div>

                                    {project.justification && (
                                        <div className="mt-8 pt-8 border-t-2 border-slate-200">
                                            <h4 className="text-xs font-extrabold text-purple-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                                                <div className="w-1 h-4 bg-purple-600 rounded-full"></div>
                                                Fundamentación Teórica
                                            </h4>
                                            <MarkdownContent content={project.justification} />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Side Column */}
                        <div className="space-y-6">
                            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 p-7 rounded-3xl border-2 border-emerald-200 shadow-md shadow-emerald-200/30 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-200/30 rounded-full blur-2xl"></div>
                                <div className="relative">
                                    <div className="flex items-center gap-2.5 mb-4">
                                        <div className="p-2 bg-emerald-600 rounded-xl shadow-sm">
                                            <CheckSquare className="w-4 h-4 text-white" />
                                        </div>
                                        <h3 className="font-extrabold text-emerald-900 text-sm uppercase tracking-wide">
                                            Objetivos
                                        </h3>
                                    </div>
                                    <div className="prose prose-sm prose-emerald max-w-none prose-p:text-emerald-900 prose-li:text-emerald-900 prose-strong:text-emerald-950">
                                        <MarkdownContent content={project.objectives} />
                                    </div>
                                </div>
                            </div>
                            <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 p-7 rounded-3xl border-2 border-blue-200 shadow-md shadow-blue-200/30 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-200/30 rounded-full blur-2xl"></div>
                                <div className="relative">
                                    <div className="flex items-center gap-2.5 mb-4">
                                        <div className="p-2 bg-blue-600 rounded-xl shadow-sm">
                                            <GraduationCap className="w-4 h-4 text-white" />
                                        </div>
                                        <h3 className="font-extrabold text-blue-900 text-sm uppercase tracking-wide">
                                            Entregables
                                        </h3>
                                    </div>
                                    <div className="prose prose-sm prose-blue max-w-none prose-p:text-blue-900 prose-li:text-blue-900 prose-strong:text-blue-950">
                                        <MarkdownContent content={project.deliverables} />
                                    </div>
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

                {/* TAB: RESOURCES */}
                {activeTab === 'resources' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
                            <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                                <BookOpen className="w-6 h-6 text-blue-600" />
                                Biblioteca del Proyecto
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {project.resources.length === 0 ? (
                                    <div className="col-span-full py-20 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-400 italic">
                                        No hay materiales de apoyo publicados todavía.
                                    </div>
                                ) : project.resources.map((r: Resource) => (
                                    <div key={r.id} className="group bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col gap-4">
                                        <div className="flex items-start gap-4">
                                            <div className="p-3 bg-slate-50 rounded-xl group-hover:bg-blue-50 transition-colors">
                                                <ResourceIcon type={r.type} />
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="font-bold text-slate-800 group-hover:text-blue-600 transition-colors line-clamp-2">{r.title}</h4>
                                                <p className="text-[10px] text-slate-400 uppercase mt-1">Recurso {r.type}</p>
                                            </div>
                                        </div>

                                        {(r.presentation || r.utility) && (
                                            <div className="space-y-3 pt-3 border-t border-slate-50">
                                                {r.presentation && (
                                                    <div>
                                                        <h5 className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Presentación</h5>
                                                        <p className="text-xs text-slate-600 line-clamp-2 italic leading-relaxed">&ldquo;{r.presentation}&rdquo;</p>
                                                    </div>
                                                )}
                                                {r.utility && (
                                                    <div>
                                                        <h5 className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Utilidad</h5>
                                                        <p className="text-xs text-slate-700 font-medium leading-relaxed">{r.utility}</p>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        <div className="flex items-center gap-3 pt-2">
                                            <button
                                                onClick={() => setViewerResource(r)}
                                                className="flex-1 py-2 px-4 bg-slate-900 text-white text-[11px] font-bold rounded-xl hover:bg-black transition-all flex items-center justify-center gap-2"
                                            >
                                                <Play className="w-3 h-3" /> Ver ahora
                                            </button>
                                            {r.type !== 'EMBED' && (
                                                <a
                                                    href={r.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="p-2 border border-slate-100 rounded-xl hover:bg-slate-50 text-slate-400 transition-all hover:text-slate-600"
                                                    title="Abrir original"
                                                >
                                                    <Maximize2 className="w-4 h-4" />
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

            </div>

            {/* VIEWER MODAL */}
            {viewerResource && (
                <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-50 flex items-center justify-center p-4 md:p-10 animate-in fade-in zoom-in duration-200">
                    <div className="bg-white w-full max-w-6xl h-full rounded-2xl shadow-2xl flex flex-col overflow-hidden">
                        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-white">
                            <div className="flex items-center gap-3">
                                <ResourceIcon type={viewerResource.type} />
                                <div>
                                    <h3 className="font-bold text-slate-900 text-sm leading-none">{viewerResource.title}</h3>
                                    <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-widest">{viewerResource.type} • Publicado el {new Date(viewerResource.createdAt).toLocaleDateString()}</p>
                                </div>
                            </div>
                            <button onClick={() => setViewerResource(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X className="w-5 h-5 text-slate-400" /></button>
                        </div>
                        <div className="flex-1 bg-black relative">
                            {viewerResource.type === 'VIDEO' ? (
                                <iframe src={viewerResource.url.replace('watch?v=', 'embed/').split('&')[0]} className="w-full h-full" allowFullScreen allow="autoplay; encrypted-media" />
                            ) : viewerResource.type === 'EMBED' ? (
                                <div className="w-full h-full bg-white p-4 overflow-auto items-center justify-center flex" dangerouslySetInnerHTML={{ __html: viewerResource.url }} />
                            ) : (
                                <iframe
                                    src={viewerResource.url.includes('drive.google.com')
                                        ? viewerResource.url.replace(/\/(view|edit).*$/, '/preview')
                                        : viewerResource.url}
                                    className="w-full h-full border-0 bg-white"
                                    title={viewerResource.title}
                                />
                            )}
                        </div>
                        {viewerResource.presentation && (
                            <div className="p-6 bg-white border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-8 max-h-[150px] overflow-auto">
                                <div>
                                    <h5 className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2">Presentación</h5>
                                    <p className="text-xs text-slate-600 italic leading-relaxed">&ldquo;{viewerResource.presentation}&rdquo;</p>
                                </div>
                                {viewerResource.utility && (
                                    <div>
                                        <h5 className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2 text-blue-600">Por qué es relevante para tu aprendizaje</h5>
                                        <p className="text-xs text-slate-700 font-medium leading-relaxed">{viewerResource.utility}</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
