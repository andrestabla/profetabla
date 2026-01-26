'use client';

import { useState } from 'react';
import { BookOpen, Video, FileText, Plus, Link as LinkIcon, Calendar, Kanban } from 'lucide-react';
import { addResourceToProjectAction } from './actions';

// Tipos basados en nuestro esquema Prisma actualizado
type Resource = {
    id: string;
    title: string;
    url: string;
    type: string;
    createdAt: Date;
};

type Project = {
    id: string;
    title: string;
    description: string | null;
    industry: string | null;
    justification: string | null;
    objectives: string | null;
    student: { name: string | null; avatarUrl: string | null } | null;
};

export default function ProjectWorkspaceClient({ project, resources }: { project: Project, resources: Resource[] }) {
    const [activeTab, setActiveTab] = useState<'KANBAN' | 'RESOURCES' | 'MENTORSHIP'>('RESOURCES');
    const [isUploading, setIsUploading] = useState(false);
    const [showContext, setShowContext] = useState(false);

    // Iconos por tipo de recurso
     
    const ResourceIcon = ({ type }: { type: string }) => {
        switch (type) {
            case 'VIDEO': return <Video className="w-5 h-5 text-red-500" />;
            case 'FILE': return <FileText className="w-5 h-5 text-blue-500" />;
            default: return <BookOpen className="w-5 h-5 text-emerald-500" />;
        }
    };

    return (
        <div className="max-w-6xl mx-auto p-6">
            {/* Cabecera del Proyecto */}
            <header className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm mb-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                    <div>
                        <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider mb-2 inline-block">
                            {project.industry || 'Proyecto Institucional'}
                        </span>
                        <h1 className="text-2xl font-bold text-slate-800">{project.title}</h1>
                        <p className="text-slate-500 font-medium flex items-center gap-2 mt-1">
                            Estudiante: <span className="text-slate-700 font-bold">{project.student?.name || 'Sin Asignar'}</span>
                        </p>
                    </div>

                    {/* Navegación de Pestañas */}
                    <div className="flex bg-slate-100 p-1 rounded-xl">
                        <button onClick={() => setActiveTab('KANBAN')} className={`px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition-all ${activeTab === 'KANBAN' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                            <Kanban className="w-4 h-4" /> Kanban
                        </button>
                        <button onClick={() => setActiveTab('RESOURCES')} className={`px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition-all ${activeTab === 'RESOURCES' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                            <BookOpen className="w-4 h-4" /> Recursos
                        </button>
                        <button onClick={() => setActiveTab('MENTORSHIP')} className={`px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition-all ${activeTab === 'MENTORSHIP' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                            <Calendar className="w-4 h-4" /> Mentorías
                        </button>
                    </div>
                </div>

                <div className="pt-4 border-t border-slate-100">
                    <button
                        onClick={() => setShowContext(!showContext)}
                        className="text-xs font-bold text-slate-400 hover:text-slate-600 flex items-center gap-1 transition-colors"
                    >
                        {showContext ? 'Ocultar Contexto del Proyecto ↑' : 'Ver Contexto del Proyecto (Justificación y Objetivos) ↓'}
                    </button>

                    {showContext && (
                        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-top-2 duration-300">
                            <div>
                                <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">Justificación</h4>
                                <p className="text-sm text-slate-600 italic bg-slate-50 p-3 rounded-xl border border-slate-100">
                                    &ldquo;{project.justification || 'No definida'}&rdquo;
                                </p>
                            </div>
                            <div>
                                <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">Objetivos de Aprendizaje</h4>
                                <div className="text-sm text-slate-600 whitespace-pre-wrap bg-slate-50 p-3 rounded-xl border border-slate-100">
                                    {project.objectives || 'Sin objetivos definidos'}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </header>

            {/* CONTENIDO DE LA PESTAÑA RECURSOS */}
            {activeTab === 'RESOURCES' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                    {/* Formulario para Añadir Recurso */}
                    <div className="md:col-span-1 bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-fit">
                        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <Plus className="w-5 h-5 text-blue-600" /> Añadir Material
                        </h3>
                        <form action={async (formData) => {
                            setIsUploading(true);
                            await addResourceToProjectAction(formData);
                            setIsUploading(false);
                            // Reset form? In standard actions, we might need to reset manually or use useFormStatus etc. 
                            // For simplified UX here, assuming revalidatePath refreshes data.
                        }} className="space-y-4">
                            <input type="hidden" name="projectId" value={project.id} />

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Título del Recurso</label>
                                <input name="title" required placeholder="Ej: Guía de Arquitectura" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-500" />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Tipo</label>
                                <select name="type" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-500 font-medium text-slate-700">
                                    <option value="ARTICLE">📖 Artículo / Blog</option>
                                    <option value="VIDEO">▶️ Video Tutorial</option>
                                    <option value="FILE">📄 Archivo / PDF</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">URL o Enlace</label>
                                <div className="relative">
                                    <LinkIcon className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                                    <input name="url" required type="url" placeholder="https://..." className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-500" />
                                </div>
                            </div>

                            <button disabled={isUploading} className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 rounded-lg transition-colors flex justify-center items-center gap-2 disabled:opacity-50">
                                {isUploading ? 'Guardando...' : 'Publicar Recurso'}
                            </button>
                        </form>
                    </div>

                    {/* Lista de Recursos del Proyecto */}
                    <div className="md:col-span-2 space-y-4">
                        {resources.length === 0 ? (
                            <div className="bg-slate-50 border-2 border-dashed border-slate-200 p-12 rounded-xl text-center text-slate-400 font-medium">
                                <BookOpen className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                                Aún no hay recursos para este proyecto. Añade el primer material a la izquierda.
                            </div>
                        ) : (
                            resources.map(resource => (
                                <div key={resource.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex items-center gap-4">
                                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                                        <ResourceIcon type={resource.type} />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-bold text-slate-800 leading-tight">{resource.title}</h4>
                                        <a href={resource.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline flex items-center gap-1 mt-1 font-medium">
                                            <LinkIcon className="w-3 h-3" /> Ver recurso completo
                                        </a>
                                    </div>
                                    <div className="text-xs font-medium text-slate-400 bg-slate-50 px-2 py-1 rounded">
                                        {new Date(resource.createdAt).toLocaleDateString()}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                </div>
            )}

            {activeTab === 'KANBAN' && (
                <div className="mt-8 text-center p-12 bg-slate-50 rounded-xl border border-dashed text-slate-400">
                    <Kanban className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                    <p>El tablero Kanban del proyecto se cargará aquí.</p>
                    <a href={`/dashboard/professor/projects/${project.id}/kanban`} className="text-blue-600 underline text-sm mt-2 inline-block">Ir a vista completa</a>
                </div>
            )}

            {activeTab === 'MENTORSHIP' && (
                <div className="mt-8 text-center p-12 bg-slate-50 rounded-xl border border-dashed text-slate-400">
                    <Calendar className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                    <p>La gestión de mentorías del proyecto se cargará aquí.</p>
                </div>
            )}
        </div>
    );
}
