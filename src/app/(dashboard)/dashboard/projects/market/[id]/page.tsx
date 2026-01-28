import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { notFound, redirect } from 'next/navigation';
import {
    Calendar, DollarSign, BarChart, ClipboardCheck,
    BookOpen, User, Briefcase, Clock, ChevronLeft, CheckSquare, Layers, Search
} from 'lucide-react';
import Link from 'next/link';

export default async function ProjectDetailPage({ params }: { params: { id: string } }) {
    const session = await getServerSession(authOptions);
    if (!session) redirect('/auth/login');

    const project = await prisma.project.findUnique({
        where: { id: params.id },
        include: {
            teacher: {
                select: {
                    name: true,
                    avatarUrl: true,
                    email: true
                }
            },
            learningObjects: true
        }
    });

    if (!project) notFound();

    // Mapping icons/colors based on type
    const typeConfig = {
        PROJECT: { label: "Proyecto", icon: Layers, color: "text-blue-600", bg: "bg-blue-50" },
        CHALLENGE: { label: "Reto", icon: CheckSquare, color: "text-orange-600", bg: "bg-orange-50" },
        PROBLEM: { label: "Problema", icon: Search, color: "text-red-600", bg: "bg-red-50" }
    };

    const config = typeConfig[project.type] || typeConfig.PROJECT;

    return (
        <div className="max-w-5xl mx-auto p-6 space-y-8 pb-24">
            {/* Header / Nav */}
            <div className="flex items-center gap-4 mb-8">
                <Link href="/dashboard/projects/market" className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                    <ChevronLeft className="w-6 h-6 text-slate-600" />
                </Link>
                <div>
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${config.bg} ${config.color} mb-1 inline-block`}>
                        {config.label.toUpperCase()}
                    </span>
                    <h1 className="text-3xl font-bold text-slate-900 leading-tight">{project.title}</h1>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column (Details) */}
                <div className="lg:col-span-2 space-y-8">

                    {/* Hero Description */}
                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
                        <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <Briefcase className="w-5 h-5 text-purple-600" /> Descripción General
                        </h2>
                        <div className="prose prose-slate max-w-none text-slate-600 whitespace-pre-wrap">
                            {project.description}
                        </div>
                        {project.industry && (
                            <div className="mt-4 flex items-center gap-2 text-sm font-medium text-slate-500 bg-slate-50 p-3 rounded-lg">
                                <Briefcase className="w-4 h-4" /> Industria: {project.industry}
                            </div>
                        )}
                    </div>

                    {/* Justification & Objectives */}
                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 space-y-6">
                        <div>
                            <h3 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
                                <BookOpen className="w-5 h-5 text-blue-600" /> Fundamentación
                            </h3>
                            <p className="text-slate-600 whitespace-pre-wrap">{project.justification}</p>
                        </div>
                        <div className="border-t border-slate-100 pt-6">
                            <h3 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
                                <checkSquare className="w-5 h-5 text-emerald-600" /> Objetivos de Aprendizaje
                            </h3>
                            <div className="bg-emerald-50/50 p-6 rounded-xl border border-emerald-100">
                                <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">{project.objectives}</p>
                            </div>
                        </div>
                    </div>

                    {/* Methodology & Phases */}
                    {project.methodology && (
                        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
                            <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                                <Layers className="w-5 h-5 text-indigo-600" /> Metodología y Fases
                            </h2>
                            <div className="prose prose-slate max-w-none text-slate-600 whitespace-pre-wrap">
                                {project.methodology}
                            </div>
                        </div>
                    )}

                    {/* Evaluation & KPIs */}
                    {(project.evaluation || project.kpis) && (
                        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 grid md:grid-cols-2 gap-8">
                            {project.evaluation && (
                                <div>
                                    <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2 text-sm uppercase tracking-wide">
                                        <ClipboardCheck className="w-4 h-4 text-slate-400" /> Sistema de Evaluación
                                    </h3>
                                    <p className="text-sm text-slate-600 whitespace-pre-wrap">{project.evaluation}</p>
                                </div>
                            )}
                            {project.kpis && (
                                <div>
                                    <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2 text-sm uppercase tracking-wide">
                                        <BarChart className="w-4 h-4 text-slate-400" /> Indicadores (KPIs)
                                    </h3>
                                    <p className="text-sm text-slate-600 whitespace-pre-wrap">{project.kpis}</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Right Column (Sidebar) */}
                <div className="space-y-6">
                    {/* Key Info Card */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-6 sticky top-6">
                        <div className="flex items-center gap-3 pb-6 border-b border-slate-100">
                            {project.teacher.avatarUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={project.teacher.avatarUrl} alt={project.teacher.name || "Profesor"} className="w-12 h-12 rounded-full object-cover" />
                            ) : (
                                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg">
                                    {(project.teacher.name || "P")[0]}
                                </div>
                            )}
                            <div>
                                <p className="text-xs text-slate-400 font-bold uppercase">Liderado por</p>
                                <h3 className="font-bold text-slate-800">{project.teacher.name || "Profesor"}</h3>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {project.schedule && (
                                <div className="flex items-start gap-3">
                                    <Clock className="w-5 h-5 text-slate-400 mt-0.5" />
                                    <div>
                                        <p className="text-xs font-bold text-slate-500 uppercase">Cronograma</p>
                                        <p className="text-sm text-slate-700">{project.schedule}</p>
                                    </div>
                                </div>
                            )}
                            {project.budget && (
                                <div className="flex items-start gap-3">
                                    <DollarSign className="w-5 h-5 text-slate-400 mt-0.5" />
                                    <div>
                                        <p className="text-xs font-bold text-slate-500 uppercase">Presupuesto / Recursos</p>
                                        <p className="text-sm text-slate-700">{project.budget}</p>
                                    </div>
                                </div>
                            )}
                            {project.deliverables && (
                                <div className="flex items-start gap-3">
                                    <BookOpen className="w-5 h-5 text-slate-400 mt-0.5" />
                                    <div>
                                        <p className="text-xs font-bold text-slate-500 uppercase">Entregables</p>
                                        <p className="text-sm text-slate-700 whitespace-pre-wrap">{project.deliverables}</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* CTA Application */}
                        <div className="pt-6 border-t border-slate-100">
                            {/* NOTE: We will likely add client-side interactivity here later for Applying */}
                            <button className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-lg transition-transform hover:scale-[1.02] active:scale-[0.98]">
                                Postularme Ahora
                            </button>
                            <p className="text-xs text-center text-slate-400 mt-3">
                                Al postularte, estarás iniciando el proceso de selección.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
