'use client';

import { useState } from 'react';
import { Search, Briefcase, BookOpen, Target, Send, User, Loader2 } from 'lucide-react';
import { applyToProjectAction } from './actions';

// Tipado basado en nuestro nuevo esquema Prisma
type Project = {
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
    teacher: { name: string | null; avatarUrl: string | null };
};

export default function ProjectMarketClient({ availableProjects }: { availableProjects: Project[] }) {
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const [isApplying, setIsApplying] = useState(false);

    return (
        <div className="max-w-6xl mx-auto p-6">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-slate-800">Mercado de Proyectos</h1>
                <p className="text-slate-500">Explora los retos disponibles y postúlate al que mejor se adapte a tus objetivos.</p>
            </header>

            {/* Barra de Búsqueda y Filtros */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4 mb-8">
                <Search className="w-5 h-5 text-slate-400" />
                <input
                    placeholder="Buscar por industria, tecnología o profesor..."
                    className="flex-1 outline-none text-slate-700 placeholder:text-slate-400"
                />
                <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-sm font-medium">
                    {availableProjects.length} Disponibles
                </span>
            </div>

            {/* Grid de Proyectos */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {availableProjects.map((project) => (
                    <div key={project.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col">
                        <div className="flex justify-between items-start mb-4">
                            <span className="bg-purple-50 text-purple-700 text-xs font-bold px-2 py-1 rounded uppercase tracking-wider">
                                {project.industry || 'General'}
                            </span>
                            <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                                <User className="w-3 h-3" /> {project.teacher.name}
                            </div>
                        </div>

                        <h3 className="text-lg font-bold text-slate-800 mb-2 leading-tight">{project.title}</h3>
                        <p className="text-sm text-slate-500 line-clamp-3 mb-6 flex-1">{project.description}</p>

                        <button
                            onClick={() => setSelectedProject(project)}
                            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium py-2.5 rounded-lg transition-colors"
                        >
                            Ver Detalles y Aplicar
                        </button>
                    </div>
                ))}

                {availableProjects.length === 0 && (
                    <div className="col-span-full py-12 text-center text-slate-400">
                        No hay proyectos abiertos disponibles en este momento.
                    </div>
                )}
            </div>

            {/* Modal de Postulación */}
            {selectedProject && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                        <h2 className="text-2xl font-bold text-slate-800 mb-2">{selectedProject.title}</h2>
                        <p className="text-purple-600 font-medium mb-6 flex items-center gap-2">
                            <Briefcase className="w-4 h-4" /> Industria: {selectedProject.industry || 'General'}
                        </p>

                        <div className="space-y-6 mb-8">
                            <div className="bg-slate-50 p-4 rounded-lg">
                                <h4 className="font-bold text-slate-700 mb-2 flex items-center gap-2"><Target className="w-4 h-4 text-emerald-500" /> Objetivos de Aprendizaje</h4>
                                <p className="text-sm text-slate-600 whitespace-pre-line">{selectedProject.objectives || 'No especificados.'}</p>
                            </div>
                            <div className="bg-slate-50 p-4 rounded-lg">
                                <h4 className="font-bold text-slate-700 mb-2 flex items-center gap-2"><BookOpen className="w-4 h-4 text-blue-500" /> Entregables Esperados</h4>
                                <p className="text-sm text-slate-600 whitespace-pre-line">{selectedProject.deliverables || 'No especificados.'}</p>
                            </div>

                            {/* Mostrar metadatos adicionales si existen */}
                            {(selectedProject.methodology || selectedProject.schedule) && (
                                <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
                                    <h4 className="font-bold text-purple-700 mb-2 flex items-center gap-2">Planificación y Fases</h4>
                                    {selectedProject.methodology && <p className="text-sm text-slate-600 whitespace-pre-line mb-3">{selectedProject.methodology}</p>}
                                    {selectedProject.schedule && <p className="text-sm text-slate-600 font-medium">Cronograma: {selectedProject.schedule}</p>}
                                </div>
                            )}

                            {(selectedProject.budget || selectedProject.evaluation) && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {selectedProject.budget && (
                                        <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-100">
                                            <h4 className="font-bold text-emerald-700 mb-1 text-xs uppercase tracking-wider">Presupuesto</h4>
                                            <p className="text-sm text-slate-700">{selectedProject.budget}</p>
                                        </div>
                                    )}
                                    {selectedProject.evaluation && (
                                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                                            <h4 className="font-bold text-blue-700 mb-1 text-xs uppercase tracking-wider">Evaluación</h4>
                                            <p className="text-sm text-slate-700">{selectedProject.evaluation}</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <form action={applyToProjectAction} onSubmit={() => setIsApplying(true)}>
                            <input type="hidden" name="projectId" value={selectedProject.id} />

                            <div className="mb-6">
                                <label className="block text-sm font-bold text-slate-700 mb-2">Tu carta de motivación</label>
                                <textarea
                                    name="motivation"
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
                    </div>
                </div>
            )}
        </div>
    );
}
