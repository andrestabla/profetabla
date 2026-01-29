'use client';

import { useState } from 'react';
import { BookOpen, Video, FileText, Plus, Link as LinkIcon, Calendar, Kanban, Sparkles, FileCheck, Edit3, Cloud, Upload, X, Play, Maximize2, Wand2 } from 'lucide-react';
import Link from 'next/link';
import { addResourceToProjectAction, getProjectDriveFilesAction, uploadProjectFileToDriveAction, extractResourceMetadataAction } from './actions';
import { BookingList } from '@/components/BookingList';
import { CreateAssignmentForm } from '@/components/CreateAssignmentForm';
import { SubmissionCard } from '@/components/SubmissionCard';

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

    const ResourceIcon = ({ type }: { type: string }) => {
        switch (type) {
            case 'VIDEO': return <Video className="w-5 h-5 text-red-500" />;
            case 'FILE': return <FileText className="w-5 h-5 text-blue-500" />;
            case 'EMBED': return <Sparkles className="w-5 h-5 text-amber-500" />;
            case 'DRIVE': return <Cloud className="w-5 h-5 text-blue-600" />;
            default: return <BookOpen className="w-5 h-5 text-emerald-500" />;
        }
    };

    return (
        <div className="max-w-6xl mx-auto p-6">
            {/* Cabecera del Proyecto */}
            <header className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm mb-6">
                <div className="flex flex-col gap-6">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider mb-2 inline-block">
                                {project.industry || 'Proyecto Institucional'}
                            </span>
                            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">{project.title}</h1>
                            <p className="text-slate-500 font-medium flex items-center gap-2 mt-1 text-sm">
                                Estudiante: <span className="text-slate-700 font-bold">{project.student?.name || 'Sin Asignar'}</span>
                            </p>
                        </div>

                        <div className="flex items-center gap-2">
                            <Link
                                href={`/dashboard/professor/projects/${project.id}/edit`}
                                className="flex items-center gap-2 px-4 py-2 text-slate-600 font-bold bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition-all text-xs"
                            >
                                <Edit3 className="w-4 h-4" /> Editar Metadatos
                            </Link>

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
                                <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">Objetivos de Aprendizaje</h4>
                                <div className="text-sm text-slate-600 whitespace-pre-wrap bg-slate-50 p-3 rounded-xl border border-slate-100">
                                    {project.objectives || 'Sin objetivos definidos'}
                                </div>
                            </div>
                            <div className="md:col-span-2">
                                <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">Fases y Actividades</h4>
                                <div className="text-sm text-slate-600 whitespace-pre-wrap bg-slate-50 p-3 rounded-xl border border-slate-100 italic">
                                    {project.methodology || 'No definido'}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </header>

            {/* TAB: RECURSOS */}
            {activeTab === 'RESOURCES' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Formulario */}
                    <div className="md:col-span-1 bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-fit">
                        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <Plus className="w-5 h-5 text-blue-600" /> Añadir Material
                        </h3>
                        <form action={async (formData) => {
                            setIsUploading(true);
                            try {
                                let result;
                                if (resourceType === 'DRIVE' && driveMode === 'UPLOAD') {
                                    result = await uploadProjectFileToDriveAction(formData);
                                } else {
                                    result = await addResourceToProjectAction(formData);
                                }
                                if (result?.success === false) {
                                    alert(`Error: ${result.error}`);
                                } else {
                                    setMetaTitle(''); setMetaPresentation(''); setMetaUtility(''); setMetaUrl(''); setSelectedDriveFile(null);
                                }
                            } catch (e: any) {
                                alert(`Crash crítico: ${e.message || 'Error desconocido'}`);
                            } finally {
                                setIsUploading(false);
                            }
                        }} className="space-y-4">
                            <input type="hidden" name="projectId" value={project.id} />

                            {resourceType !== 'DRIVE' && (
                                <div>
                                    <div className="flex justify-between items-center mb-1">
                                        <label className="block text-xs font-bold text-slate-500 uppercase">Enlace</label>
                                        <button
                                            type="button"
                                            disabled={isExtracting || (!metaUrl && resourceType !== 'EMBED')}
                                            onClick={async () => {
                                                setIsExtracting(true);
                                                try {
                                                    const result = await extractResourceMetadataAction(metaUrl, resourceType);
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
                                            className="text-[10px] flex items-center gap-1 text-blue-600 font-bold disabled:opacity-50"
                                        >
                                            <Wand2 className="w-3 h-3" /> {isExtracting ? 'Analizando...' : 'Extraer con IA'}
                                        </button>
                                    </div>
                                    <div className="relative">
                                        {resourceType === 'EMBED' ? (
                                            <textarea name="url" value={metaUrl} onChange={(e) => setMetaUrl(e.target.value)} required rows={3} placeholder="<iframe>...</iframe>" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-[10px]" />
                                        ) : (
                                            <>
                                                <LinkIcon className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                                                <input name="url" value={metaUrl} onChange={(e) => setMetaUrl(e.target.value)} required type="url" placeholder="https://..." className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm" />
                                            </>
                                        )}
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Tipo</label>
                                <select name="type" value={resourceType} onChange={(e) => { setResourceType(e.target.value); if (e.target.value === 'DRIVE' && driveFiles.length === 0) handleFetchDriveFiles(); }} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm">
                                    <option value="ARTICLE">📖 Artículo / Blog</option>
                                    <option value="VIDEO">▶️ Video</option>
                                    <option value="EMBED">✨ Embeb</option>
                                    <option value="DRIVE">📁 Google Drive</option>
                                </select>
                            </div>

                            {resourceType === 'DRIVE' && project.googleDriveFolderId && (
                                <div className="space-y-2">
                                    <div className="flex p-0.5 bg-slate-100 rounded-lg">
                                        <button type="button" onClick={() => setDriveMode('LINK')} className={`flex-1 py-1.5 text-[10px] font-bold rounded-md ${driveMode === 'LINK' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}>Vincular</button>
                                        <button type="button" onClick={() => setDriveMode('UPLOAD')} className={`flex-1 py-1.5 text-[10px] font-bold rounded-md ${driveMode === 'UPLOAD' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}>Cargar</button>
                                    </div>
                                    {driveMode === 'LINK' ? (
                                        <select className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm" onChange={(e) => { const file = driveFiles.find(f => f.id === e.target.value); if (file) { setSelectedDriveFile({ title: file.name, url: file.webViewLink! }); setMetaTitle(file.name); } }}>
                                            <option value="">Selecciona un archivo...</option>
                                            {driveFiles.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                                        </select>
                                    ) : (
                                        <input type="file" name="file" required className="w-full text-xs" />
                                    )}
                                    <input type="hidden" name="url" value={selectedDriveFile?.url || metaUrl} />
                                    <input type="hidden" name="driveTitle" value={selectedDriveFile?.title || ''} />
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nombre</label>
                                <input name="title" value={metaTitle} onChange={(e) => setMetaTitle(e.target.value)} required placeholder="Ej: Guía de Introducción" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Presentación</label>
                                <textarea name="presentation" value={metaPresentation} onChange={(e) => setMetaPresentation(e.target.value)} rows={2} placeholder="¿Qué es este material?" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Utilidad</label>
                                <textarea name="utility" value={metaUtility} onChange={(e) => setMetaUtility(e.target.value)} rows={2} placeholder="¿Para qué sirve?" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs" />
                            </div>

                            <button disabled={isUploading} className="w-full bg-slate-900 border border-slate-800 text-white font-bold py-2.5 rounded-lg disabled:opacity-50">
                                {isUploading ? 'Guardando...' : 'Publicar Recurso'}
                            </button>
                        </form>
                    </div>

                    {/* Lista */}
                    <div className="md:col-span-2 space-y-8">
                        {learningObjects.length > 0 && (
                            <section>
                                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2 italic">Contenido Sugerido</h3>
                                <div className="grid grid-cols-1 gap-4">
                                    {learningObjects.map((oa) => (
                                        <Link key={oa.id} href={`/dashboard/learning/object/${oa.id}`} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4 hover:shadow-md transition-all">
                                            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100"><BookOpen className="w-5 h-5 text-indigo-600" /></div>
                                            <div className="flex-1">
                                                <h4 className="font-bold text-slate-800 leading-tight">{oa.title}</h4>
                                                <p className="text-xs text-slate-500 line-clamp-1">{oa.description}</p>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </section>
                        )}

                        <section>
                            <h3 className="font-bold text-slate-800 mb-4 flex justify-between items-center">
                                <span className="flex items-center gap-2"><FileText className="w-5 h-5 text-blue-600" /> Material de Apoyo</span>
                                <Link href={`/dashboard/professor/projects/${project.id}/learning`} className="text-[10px] text-blue-600 uppercase font-bold">Curaduría OA</Link>
                            </h3>
                            <div className="space-y-4">
                                {resources.length === 0 ? <p className="text-center py-10 text-slate-400 italic">No hay recursos aún.</p> : resources.map(r => (
                                    <div key={r.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col gap-3">
                                        <div className="flex items-center gap-4">
                                            <div className="p-2 bg-slate-50 rounded-lg"><ResourceIcon type={r.type} /></div>
                                            <div className="flex-1">
                                                <h4 className="font-bold text-slate-800 text-sm">{r.title}</h4>
                                                <div className="flex gap-4 mt-1">
                                                    <button onClick={() => setViewerResource(r)} className="text-[10px] font-bold text-blue-600 hover:underline flex items-center gap-1"><Play className="w-3 h-3" /> Ver en visor</button>
                                                    {r.type !== 'EMBED' && (
                                                        <a href={r.url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-slate-400 hover:underline flex items-center gap-1"><Maximize2 className="w-3 h-3" /> Original</a>
                                                    )}
                                                </div>
                                            </div>
                                            <span className="text-[10px] text-slate-300">{new Date(r.createdAt).toLocaleDateString()}</span>
                                        </div>
                                        {(r.presentation || r.utility) && (
                                            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-50 text-[10px]">
                                                {r.presentation && <div className="text-slate-500 italic">&ldquo;{r.presentation}&rdquo;</div>}
                                                {r.utility && <div className="text-slate-700 font-medium">{r.utility}</div>}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>
                </div>
            )}

            {/* TAB: KANBAN */}
            {activeTab === 'KANBAN' && (
                <div className="mt-8 text-center p-12 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-400">
                    <Kanban className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                    <p className="font-medium text-sm">El tablero Kanban del proyecto se cargará aquí.</p>
                    <a href={`/dashboard/professor/projects/${project.id}/kanban`} className="text-blue-600 underline text-xs mt-2 inline-block font-bold">Ir a vista completa →</a>
                </div>
            )}

            {/* TAB: MENTORSHIP */}
            {activeTab === 'MENTORSHIP' && (
                <div className="mt-8">
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm mb-6">
                        <h3 className="text-xl font-bold text-slate-800">Mentorías</h3>
                        <p className="text-slate-500 text-sm">Reserva espacios exclusivos para este proyecto.</p>
                    </div>
                    <BookingList defaultProjectId={project.id} />
                </div>
            )}

            {/* TAB: ASSIGNMENTS */}
            {activeTab === 'ASSIGNMENTS' && (
                <div className="space-y-6">
                    <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <div>
                            <h3 className="text-xl font-bold text-slate-800">Entregables</h3>
                            <p className="text-slate-500 text-sm">Gestiona los envíos oficiales.</p>
                        </div>
                        <CreateAssignmentForm projectId={project.id} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {assignments.length === 0 ? (
                            <div className="md:col-span-2 text-center py-20 bg-slate-50 rounded-xl border border-dashed border-slate-300 text-slate-400">No hay entregables.</div>
                        ) : assignments.map((a: any) => <SubmissionCard key={a.id} assignment={a} />)}
                    </div>
                </div>
            )}

            {/* MODAL DEL VISOR */}
            {viewerResource && (
                <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-50 flex items-center justify-center p-4 md:p-10 animate-in fade-in zoom-in duration-200">
                    <div className="bg-white w-full max-w-6xl h-full rounded-2xl shadow-2xl flex flex-col overflow-hidden">
                        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-white">
                            <div className="flex items-center gap-3">
                                <ResourceIcon type={viewerResource.type} />
                                <div>
                                    <h3 className="font-bold text-slate-900 text-sm leading-none">{viewerResource.title}</h3>
                                    <p className="text-[10px] text-slate-500 mt-1">{viewerResource.type} • {new Date(viewerResource.createdAt).toLocaleDateString()}</p>
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
                            <div className="p-4 bg-white border-t border-slate-100 grid grid-cols-2 gap-6">
                                <div><h5 className="text-[8px] font-bold text-slate-400 uppercase mb-1">Presentación</h5><p className="text-xs text-slate-600 italic">&ldquo;{viewerResource.presentation}&rdquo;</p></div>
                                <div><h5 className="text-[8px] font-bold text-slate-400 uppercase mb-1">Utilidad</h5><p className="text-xs text-slate-700 font-medium">{viewerResource.utility}</p></div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
