'use client';

import { useState } from 'react';
import { BookOpen, Video, FileText, Plus, Link as LinkIcon, Calendar, Kanban, Sparkles, FileCheck, Edit3, Cloud, Upload, X, Play, Maximize2, Wand2 } from 'lucide-react';
import Link from 'next/link';
import { addResourceToProjectAction, getProjectDriveFilesAction, uploadProjectFileToDriveAction, extractResourceMetadataAction, updateProjectResourceAction } from './actions';
import { BookingList } from '@/components/BookingList';
import { CreateAssignmentForm } from '@/components/CreateAssignmentForm';
import { SubmissionCard } from '@/components/SubmissionCard';
import { OAPickerModal } from '@/components/OAPickerModal';

// Tipos basados en nuestro esquema Prisma actualizado
type Resource = {
    id: string;
    title: string;
    url: string;
    type: string;
    presentation?: string | null;
    utility?: string | null;
    createdAt: Date;
};

type Project = {
    id: string;
    title: string;
    description: string | null;
    industry: string | null;
    justification: string | null;
    objectives: string | null;
    methodology: string | null;
    resourcesDescription: string | null;
    schedule: string | null;
    budget: string | null;
    evaluation: string | null;
    kpis: string | null;
    googleDriveFolderId: string | null;
    student: { name: string | null; avatarUrl: string | null } | null;
};

/* eslint-disable @typescript-eslint/no-explicit-any */
export default function ProjectWorkspaceClient({ project, resources, learningObjects, assignments }: { project: Project, resources: Resource[], learningObjects: any[], assignments: any[] }) {
    const [activeTab, setActiveTab] = useState<'KANBAN' | 'RESOURCES' | 'MENTORSHIP' | 'ASSIGNMENTS'>('RESOURCES');
    const [isUploading, setIsUploading] = useState(false);
    const [showContext, setShowContext] = useState(false);
    const [resourceType, setResourceType] = useState('ARTICLE');
    const [driveFiles, setDriveFiles] = useState<any[]>([]);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [isLoadingDrive, setIsLoadingDrive] = useState(false);
    const [selectedDriveFile, setSelectedDriveFile] = useState<{ title: string, url: string } | null>(null);
    const [driveMode, setDriveMode] = useState<'LINK' | 'UPLOAD'>('LINK');
    const [viewerResource, setViewerResource] = useState<Resource | null>(null);
    const [isExtracting, setIsExtracting] = useState(false);

    // Metadata form states
    const [metaTitle, setMetaTitle] = useState('');
    const [metaPresentation, setMetaPresentation] = useState('');
    const [metaUtility, setMetaUtility] = useState('');
    const [metaUrl, setMetaUrl] = useState('');
    const [editingResource, setEditingResource] = useState<Resource | null>(null);
    const [isOAModalOpen, setIsOAModalOpen] = useState(false);

    // Fetch drive files if configured
    const handleFetchDriveFiles = async () => {
        if (!project.googleDriveFolderId) return;
        setIsLoadingDrive(true);
        try {
            const files = await getProjectDriveFilesAction(project.googleDriveFolderId);
            setDriveFiles(files);
        } catch (e) {
            console.error("Error fetching drive files", e);
        } finally {
            setIsLoadingDrive(false);
        }
    };

    const handleEditResource = (resource: Resource) => {
        setEditingResource(resource);
        setResourceType(resource.type);
        setMetaTitle(resource.title);
        setMetaUrl(resource.url);
        setMetaPresentation(resource.presentation || '');
        setMetaUtility(resource.utility || '');

        // Scroll to form
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCancelEdit = () => {
        setEditingResource(null);
        setMetaTitle('');
        setMetaUrl('');
        setMetaPresentation('');
        setMetaUtility('');
        setResourceType('ARTICLE');
    };

    const ResourceIcon = ({ type }: { type: string }) => {
        switch (type) {
            case 'VIDEO': return <Video className="w-5 h-5 text-red-500" />;
            case 'ARTICLE': return <FileText className="w-5 h-5 text-blue-500" />;
            case 'EMBED': return <Sparkles className="w-5 h-5 text-purple-500" />;
            case 'DRIVE': return <Cloud className="w-5 h-5 text-emerald-500" />;
            default: return <BookOpen className="w-5 h-5 text-slate-400" />;
        }
    };

    return (
        <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8 font-sans">
            {/* Cabecera */}
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/2"></div>
                <div className="relative">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold rounded-lg uppercase tracking-wider">Proyecto Activo</span>
                                <span className="text-slate-300">/</span>
                                <span className="text-slate-500 text-xs font-medium">{project.industry || 'Educación'}</span>
                            </div>
                            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 leading-tight">
                                {project.title}
                            </h1>
                            {project.student && (
                                <p className="text-sm text-slate-500 mt-2 font-medium">Estudiante: <span className="text-slate-900 font-bold">{project.student.name}</span></p>
                            )}
                        </div>
                        <div className="flex items-center gap-3">
                            <button className="flex items-center gap-2 px-4 py-2 text-slate-600 font-bold bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition-all text-xs">
                                <Edit3 className="w-4 h-4" /> Editar Metadatos
                            </button>
                            {project.googleDriveFolderId && (
                                <a
                                    href={`https://drive.google.com/drive/folders/${project.googleDriveFolderId}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 px-4 py-2 text-blue-600 font-bold bg-blue-50 border border-blue-200 rounded-xl hover:bg-blue-100 transition-all text-xs"
                                >
                                    <Cloud className="w-4 h-4" /> Drive del Proyecto
                                </a>
                            )}
                        </div>
                    </div>

                    <div className="flex bg-slate-100 p-1 rounded-xl w-fit">
                        <button onClick={() => setActiveTab('KANBAN')} className={`px-5 py-2 rounded-lg font-bold flex items-center gap-2 transition-all text-sm ${activeTab === 'KANBAN' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                            <Kanban className="w-4 h-4" /> Kanban
                        </button>
                        <button onClick={() => setActiveTab('RESOURCES')} className={`px-5 py-2 rounded-lg font-bold flex items-center gap-2 transition-all text-sm ${activeTab === 'RESOURCES' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                            <BookOpen className="w-4 h-4" /> Recursos
                        </button>
                        <button onClick={() => setActiveTab('MENTORSHIP')} className={`px-5 py-2 rounded-lg font-bold flex items-center gap-2 transition-all text-sm ${activeTab === 'MENTORSHIP' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                            <Calendar className="w-4 h-4" /> Mentorías
                        </button>
                        <button onClick={() => setActiveTab('ASSIGNMENTS')} className={`px-5 py-2 rounded-lg font-bold flex items-center gap-2 transition-all text-sm ${activeTab === 'ASSIGNMENTS' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                            <FileCheck className="w-4 h-4" /> Entregables
                        </button>
                    </div>
                </div>

                <div className="pt-4 border-t border-slate-100 mt-4">
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
                                <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">Objetivos</h4>
                                <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                                    {project.objectives || 'No definidos'}
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Contenido Principal */}
            {activeTab === 'RESOURCES' && (
                <div className="animate-in fade-in duration-500 space-y-12">
                    {/* Sección 1: Crear Nuevo Recurso (Full Width & Spacious) */}
                    <section className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm max-w-4xl mx-auto">
                        <div className="flex items-center gap-3 mb-8 pb-4 border-b border-slate-100 justify-between">
                            <div className="flex items-center gap-3">
                                <div className={`p-3 rounded-xl ${editingResource ? 'bg-amber-50' : 'bg-blue-50'}`}>
                                    {editingResource ? <Edit3 className="w-6 h-6 text-amber-600" /> : <Plus className="w-6 h-6 text-blue-600" />}
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900">{editingResource ? 'Editar Material' : 'Añadir Nuevo Material'}</h3>
                                    <p className="text-slate-500 text-sm">{editingResource ? 'Modifica la información del recurso seleccionado.' : 'Sube archivos, enlaces o videos para enriquecer el proyecto.'}</p>
                                </div>
                            </div>
                            {editingResource && (
                                <button onClick={handleCancelEdit} type="button" className="text-slate-400 hover:text-slate-600">
                                    <X className="w-5 h-5" />
                                </button>
                            )}
                        </div>

                        <form action={async (formData) => {
                            setIsUploading(true);
                            try {
                                let result;
                                if (editingResource) {
                                    result = await updateProjectResourceAction(formData);
                                } else if (resourceType === 'DRIVE' && driveMode === 'UPLOAD') {
                                    result = await uploadProjectFileToDriveAction(formData);
                                } else {
                                    result = await addResourceToProjectAction(formData);
                                }

                                if (result?.success === false) {
                                    alert(`Error: ${result.error}`);
                                } else {
                                    if (editingResource) handleCancelEdit();
                                    else {
                                        setMetaTitle(''); setMetaPresentation(''); setMetaUtility(''); setMetaUrl(''); setSelectedDriveFile(null);
                                    }
                                }
                            } catch (e: any) {
                                alert(`Crash crítico: ${e.message || 'Error desconocido'}`);
                            } finally {
                                setIsUploading(false);
                            }
                        }} className="space-y-8">
                            <input type="hidden" name="projectId" value={project.id} />
                            {editingResource && <input type="hidden" name="resourceId" value={editingResource.id} />}

                            {/* Grid de Configuración Principal */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Columna Izquierda: Tipo y Fuente */}
                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Tipo de Recurso</label>
                                        <div className="relative">
                                            <select name="type" value={resourceType} onChange={(e) => { setResourceType(e.target.value); if (e.target.value === 'DRIVE' && driveFiles.length === 0) handleFetchDriveFiles(); }}
                                                className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-100 outline-none transition-all appearance-none cursor-pointer hover:bg-slate-100"
                                            >
                                                <option value="ARTICLE">📖 Artículo / Blog</option>
                                                <option value="VIDEO">▶️ Video (YouTube/Vimeo)</option>
                                                <option value="EMBED">✨ Embebido (Iframe)</option>
                                                <option value="DRIVE">📁 Google Drive</option>
                                            </select>
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">▼</div>
                                        </div>
                                    </div>

                                    <div>
                                        <div className="flex justify-between items-center mb-2">
                                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                                                {resourceType === 'DRIVE' ? 'Contexto para IA' : 'Enlace / Fuente'}
                                            </label>
                                            <button
                                                type="button"
                                                disabled={isExtracting || (resourceType !== 'DRIVE' && !metaUrl && resourceType !== 'EMBED') || (resourceType === 'DRIVE' && !selectedDriveFile && !metaTitle)}
                                                onClick={async () => {
                                                    setIsExtracting(true);
                                                    try {
                                                        const context = resourceType === 'DRIVE' ? (selectedDriveFile?.title || metaTitle) : metaUrl;
                                                        const result = await extractResourceMetadataAction(context, resourceType);
                                                        if (result.success && result.data) {
                                                            setMetaTitle(result.data.title);
                                                            setMetaPresentation(result.data.presentation);
                                                            setMetaUtility(result.data.utility);
                                                        } else {
                                                            alert(result.error || "No se pudo extraer metadatos");
                                                        }
                                                    } finally {
                                                        setIsExtracting(false);
                                                    }
                                                }}
                                                className="text-[10px] bg-indigo-50 hover:bg-indigo-100 text-indigo-600 px-3 py-1.5 rounded-lg font-bold transition-colors flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <Wand2 className="w-3.5 h-3.5" />
                                                {isExtracting ? 'Analizando...' : 'Autocompletar con IA'}
                                            </button>
                                        </div>

                                        {resourceType !== 'DRIVE' && (
                                            <div className="relative">
                                                {resourceType === 'EMBED' ? (
                                                    <textarea name="url" value={metaUrl} onChange={(e) => setMetaUrl(e.target.value)} required rows={4} placeholder="<iframe src='...'></iframe>" className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs focus:ring-2 focus:ring-blue-100 outline-none transition-all" />
                                                ) : (
                                                    <>
                                                        <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                                        <input name="url" value={metaUrl} onChange={(e) => setMetaUrl(e.target.value)} required type="url" placeholder="https://ejemplo.com/recurso" className="w-full pl-11 pr-5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-100 outline-none transition-all" />
                                                    </>
                                                )}
                                            </div>
                                        )}

                                        {resourceType === 'DRIVE' && project.googleDriveFolderId && (
                                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
                                                <div className="flex p-1 bg-white rounded-lg border border-slate-100 shadow-sm">
                                                    <button type="button" onClick={() => setDriveMode('LINK')} className={`flex-1 py-2 text-xs font-bold rounded-md transition-all ${driveMode === 'LINK' ? 'bg-blue-50 text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}>Vincular Existente</button>
                                                    <button type="button" onClick={() => setDriveMode('UPLOAD')} className={`flex-1 py-2 text-xs font-bold rounded-md transition-all ${driveMode === 'UPLOAD' ? 'bg-blue-50 text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}>Subir Nuevo</button>
                                                </div>
                                                {driveMode === 'LINK' ? (
                                                    <select className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-300" onChange={(e) => { const file = driveFiles.find(f => f.id === e.target.value); if (file) { setSelectedDriveFile({ title: file.name, url: file.webViewLink! }); setMetaTitle(file.name); } }}>
                                                        <option value="">Selecciona un archivo del Drive...</option>
                                                        {driveFiles.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                                                    </select>
                                                ) : (
                                                    <div className="border-2 border-dashed border-slate-300 rounded-lg p-4 text-center hover:bg-white transition-colors cursor-pointer relative">
                                                        <input type="file" name="file" required className="absolute inset-0 opacity-0 cursor-pointer" />
                                                        <div className="pointer-events-none">
                                                            <Upload className="w-6 h-6 text-slate-400 mx-auto mb-2" />
                                                            <span className="text-xs text-slate-500 font-medium">Haz clic o arrastra un archivo aquí</span>
                                                        </div>
                                                    </div>
                                                )}
                                                <input type="hidden" name="url" value={selectedDriveFile?.url || metaUrl} />
                                                <input type="hidden" name="driveTitle" value={selectedDriveFile?.title || ''} />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Columna Derecha: Metadatos */}
                                <div className="space-y-5">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Nombre del Recurso</label>
                                        <input name="title" value={metaTitle} onChange={(e) => setMetaTitle(e.target.value)} required placeholder="Ej: Guía completa de..." className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-100 outline-none transition-all" />
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Presentación</label>
                                            <textarea name="presentation" value={metaPresentation} onChange={(e) => setMetaPresentation(e.target.value)} rows={3} placeholder="Breve intro..." className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-100 outline-none transition-all resize-none" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-blue-400 uppercase tracking-wider mb-2">Utilidad Pedagógica</label>
                                            <textarea name="utility" value={metaUtility} onChange={(e) => setMetaUtility(e.target.value)} rows={3} placeholder="¿Para qué sirve?" className="w-full px-4 py-3 bg-blue-50/50 border border-blue-100 rounded-xl text-xs focus:ring-2 focus:ring-blue-100 outline-none transition-all resize-none" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-slate-100 flex justify-end">
                                <button disabled={isUploading} className="px-8 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-lg shadow-slate-200 hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:transform-none flex items-center gap-2">
                                    {isUploading ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Guardando...</> : (editingResource ? 'Actualizar Recurso' : 'Publicar Recurso')}
                                </button>
                            </div>
                        </form>
                    </section>

                    {/* Sección 2: Listados (Grid de Cards) */}
                    <div className="space-y-10">

                        {/* Lista de Recursos del Profesor */}
                        <section>
                            <div className="flex items-center gap-3 mb-6">
                                <h3 className="text-xl font-extrabold text-slate-800 tracking-tight">Material de Apoyo</h3>
                                <span className="px-3 py-1 bg-slate-100 text-slate-500 text-[10px] font-bold uppercase tracking-wider rounded-full">Curaduría</span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                {resources.length === 0 ? (
                                    <div className="col-span-full py-16 text-center bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                                            <BookOpen className="w-8 h-8 text-slate-300" />
                                        </div>
                                        <h4 className="text-slate-900 font-bold mb-1">Tu biblioteca está vacía</h4>
                                        <p className="text-slate-500 text-sm">Añade los primeros recursos arriba.</p>
                                    </div>
                                ) : resources.map((r) => (
                                    <div key={r.id} className="group bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg hover:border-blue-200 transition-all duration-300 flex flex-col h-auto min-h-[14rem] relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-slate-50 to-transparent rounded-bl-full z-0 opacity-50 transition-opacity group-hover:opacity-100 group-hover:from-blue-50" />

                                        <div className="relative z-10 flex flex-col h-full">
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="p-3 bg-slate-50 rounded-xl group-hover:bg-white group-hover:shadow-sm transition-all">
                                                    <ResourceIcon type={r.type} />
                                                </div>
                                                <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-full">{new Date(r.createdAt).toLocaleDateString()}</span>
                                            </div>

                                            <div className="flex-1">
                                                <h4 className="font-bold text-slate-800 leading-snug line-clamp-2 group-hover:text-blue-700 transition-colors mb-1">{r.title}</h4>
                                                <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">{r.type}</p>
                                            </div>

                                            <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-50">
                                                <button onClick={() => setViewerResource(r)} className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-blue-50 text-blue-700 rounded-lg text-xs font-bold hover:bg-blue-100 transition-colors">
                                                    <Play className="w-3 h-3 fill-current" /> Ver
                                                </button>
                                                <button onClick={() => handleEditResource(r)} className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors" title="Editar recurso">
                                                    <Edit3 className="w-4 h-4" />
                                                </button>
                                                {r.type !== 'EMBED' && (
                                                    <a href={r.url} target="_blank" rel="noopener noreferrer" className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors" title="Abrir original">
                                                        <Maximize2 className="w-4 h-4" />
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Contenido Sugerido (Learning Objects) */}
                        <section className="pt-8 border-t border-slate-100">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="font-bold text-slate-400 text-sm uppercase tracking-widest flex items-center gap-2">
                                    <Sparkles className="w-4 h-4" /> Objetos de Aprendizaje (OAs)
                                </h3>
                                <button
                                    onClick={() => setIsOAModalOpen(true)}
                                    className="text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
                                >
                                    <Plus className="w-3.5 h-3.5" /> Vincular OA
                                </button>
                            </div>

                            {learningObjects.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {learningObjects.map((oa) => (
                                        <Link key={oa.id} href={`/dashboard/learning/object/${oa.id}`} className="bg-slate-50 p-4 rounded-xl border border-slate-200/50 flex items-center gap-4 hover:bg-white hover:border-slate-300 hover:shadow-md transition-all group">
                                            <div className="p-3 bg-white rounded-lg border border-slate-100 group-hover:border-slate-200"><BookOpen className="w-5 h-5 text-indigo-400 group-hover:text-indigo-600 transition-colors" /></div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start">
                                                    <h4 className="font-bold text-slate-700 text-sm truncate group-hover:text-slate-900">{oa.title}</h4>
                                                </div>
                                                <p className="text-xs text-slate-500 line-clamp-1">{oa.description}</p>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                    <p className="text-xs text-slate-400 italic">No hay objetos de aprendizaje vinculados.</p>
                                    <button onClick={() => setIsOAModalOpen(true)} className="mt-2 text-xs font-bold text-indigo-500 hover:underline">Vincular uno ahora</button>
                                </div>
                            )}
                        </section>
                    </div>
                </div>
            )}

            {/* Modal del Visor */}
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
                                <iframe src={viewerResource.url.includes('drive.google.com') ? viewerResource.url.replace(/\/(view|edit).*$/, '/preview') : viewerResource.url} className="w-full h-full border-0 bg-white" title={viewerResource.title} />
                            )}
                        </div>
                        {(viewerResource.presentation || viewerResource.utility) && (
                            <div className="p-6 bg-white border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-8 max-h-[150px] overflow-auto">
                                <div>
                                    <h5 className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2">Presentación</h5>
                                    <p className="text-xs text-slate-600 italic leading-relaxed">&ldquo;{viewerResource.presentation}&rdquo;</p>
                                </div>
                                <div>
                                    <h5 className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2 text-blue-600">Utilidad Pedagógica</h5>
                                    <p className="text-xs text-slate-700 font-medium leading-relaxed">{viewerResource.utility || 'No especificada'}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Otras pestañas (Placeholders) */}
            {activeTab === 'KANBAN' && <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 shadow-sm animate-in fade-in duration-300"><Kanban className="w-12 h-12 text-slate-200 mx-auto mb-4" /><p className="text-slate-400 font-medium">Módulo Kanban en construcción...</p></div>}
            {activeTab === 'MENTORSHIP' && <div className="animate-in fade-in duration-300"><BookingList defaultProjectId={project.id} /></div>}
            {activeTab === 'ASSIGNMENTS' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in duration-300">
                    <div className="lg:col-span-1"><CreateAssignmentForm projectId={project.id} /></div>
                    <div className="lg:col-span-2 space-y-4">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-4"><FileCheck className="w-5 h-5 text-emerald-600" /> Entregas Recientes</h3>
                        {assignments.map(a => <SubmissionCard key={a.id} assignment={a} />)}
                    </div>
                </div>
            )}

            <OAPickerModal
                isOpen={isOAModalOpen}
                onClose={() => setIsOAModalOpen(false)}
                projectId={project.id}
            />
        </div>
    );
}
