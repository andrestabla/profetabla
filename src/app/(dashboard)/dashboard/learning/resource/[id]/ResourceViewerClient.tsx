'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ExternalLink, Info, BookOpen, Video, FileText, Globe, Sparkles, Cloud, MessageSquare, Trash2, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ResourceComments } from './ResourceComments';

// Types
type Resource = {
    id: string;
    title: string;
    type: string;
    url: string;
    presentation?: string | null;
    utility?: string | null;
    categoryId: string;
    category: { name: string; color: string; };
    project: { title: string; studentName?: string | null };
    createdAt: string;
};

// ... Comment type ...

import { DrivePickerModal } from '@/components/DrivePickerModal';

export default function ResourceViewerClient({ resource, currentUserId, comments: initialComments }: {
    resource: Resource;
    currentUserId: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    comments: any[];
}) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [comments, setComments] = useState(initialComments);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [activeTab, setActiveTab] = useState<'info' | 'comments'>('info');

    // ... State ...
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isExtracting, setIsExtracting] = useState(false);
    const [isDriveModalOpen, setIsDriveModalOpen] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // ... Form State ...

    const [formData, setFormData] = useState({
        title: resource.title,
        url: resource.url,
        type: resource.type,
        description: resource.presentation || '',
        presentation: resource.presentation || '',
        utility: resource.utility || ''
    });

    // Helper to extract file ID from Drive URL
    const getDriveId = (url: string) => {
        // Tries to find 25+ chars, which covers Drive IDs. 
        // We can be more specific: /d/([a-zA-Z0-9_-]{25,}) or id=([a-zA-Z0-9_-]{25,})
        const match = url.match(/[-\w]{25,}/);
        return match ? match[0] : null;
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleDriveFileSelected = async (file: any) => {
        setIsDriveModalOpen(false);
        setFormData(prev => ({ ...prev, url: file.webViewLink, title: file.name }));

        // Auto-trigger AI for new file
        setIsExtracting(true);
        try {
            const { processDriveFileForOAAction } = await import('@/app/actions/oa-actions');
            const aiData = await processDriveFileForOAAction(file.id, file.mimeType);

            if (aiData) {
                setFormData(prev => ({
                    ...prev,
                    title: aiData.title || prev.title,
                    presentation: aiData.description || prev.presentation,
                    utility: aiData.competency ? `Competencia: ${aiData.competency}` : prev.utility
                }));
            }
        } catch (e) {
            console.error("AI Error", e);
        } finally {
            setIsExtracting(false);
        }
    };

    const handleAIImprovement = async () => {
        setIsExtracting(true);
        try {
            let aiData = null;
            // Use selected type logic
            if (formData.type === 'DRIVE') {
                const fileId = getDriveId(formData.url);
                if (fileId) {
                    const { processDriveFileForOAAction } = await import('@/app/actions/oa-actions');
                    // Pass 'auto' to let backend resolve mimeType
                    aiData = await processDriveFileForOAAction(fileId, 'auto');
                } else {
                    alert("No se pudo identificar el ID del archivo de Drive en la URL.");
                    setIsExtracting(false);
                    return;
                }
            } else {
                const { improveTextWithAIAction } = await import('@/app/actions/oa-actions');
                const context = `Tipo: ${formData.type}\nURL: ${formData.url}\nDescripción Actual: ${formData.presentation || ''}`;
                aiData = await improveTextWithAIAction(formData.title, context);
            }

            if (aiData) {
                setFormData(prev => ({
                    ...prev,
                    title: aiData.title || prev.title,
                    presentation: aiData.description || prev.presentation,
                    utility: aiData.competency ? `Competencia: ${aiData.competency}` : prev.utility
                }));
            } else {
                alert("No se pudo extraer información automática de este recurso.");
            }
        } catch (e) {
            console.error("AI Error", e);
            alert("Error consultando al asistente IA");
        } finally {
            setIsExtracting(false);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const { updateResourceAction } = await import('@/app/(dashboard)/dashboard/learning/actions');

            await updateResourceAction(resource.id, {
                title: formData.title,
                description: formData.presentation,
                presentation: formData.presentation,
                utility: formData.utility,
                url: formData.url,
                type: formData.type
            });

            setIsEditing(false);
            window.location.reload();
        } catch (e) {
            console.error(e);
            alert("Error al guardar");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            const { deleteResourceAction } = await import('@/app/(dashboard)/dashboard/learning/actions');
            const res = await deleteResourceAction(resource.id);
            if (res.success) {
                window.location.href = '/dashboard/learning';
            } else {
                alert(res.error || "Error al eliminar");
            }
        } catch (e) {
            console.error(e);
            alert("Error al eliminar");
        } finally {
            setIsDeleting(false);
            setShowDeleteConfirm(false);
        }
    };

    const getIcon = () => {
        switch (resource.type) {
            case 'VIDEO': return <Video className="w-5 h-5" />;
            case 'ARTICLE': return <FileText className="w-5 h-5" />;
            case 'EMBED': return <Sparkles className="w-5 h-5" />;
            case 'DRIVE': return <Cloud className="w-5 h-5" />;
            default: return <BookOpen className="w-5 h-5" />;
        }
    };

    const getTypeLabel = (type: string) => {
        switch (type) {
            case 'VIDEO': return 'Enlace de Video (YouTube)';
            case 'DRIVE': return 'Enlace de Drive';
            case 'EMBED': return 'Código Embed / Iframe';
            case 'ARTICLE': return 'Enlace de Artículo/Web';
            default: return 'URL del Recurso';
        }
    };

    return (
        <div className="h-[calc(100vh-80px)] bg-slate-100 flex flex-col md:flex-row overflow-hidden rounded-xl border border-slate-200 relative">
            {/* Content Area */}
            <div className="flex-1 flex flex-col bg-slate-900 overflow-hidden relative">
                <header className="bg-white border-b border-slate-200 p-4 flex justify-between items-center shrink-0 z-10 shadow-sm">
                    <div className="flex items-center gap-4 flex-1">
                        <Link href="/dashboard/learning" className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors">
                            <ArrowLeft className="w-5 h-5" />
                        </Link>

                        {isEditing ? (
                            <div className="flex-1 mr-4 space-y-2">
                                <input
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full text-lg font-bold text-slate-900 border-b border-slate-300 focus:border-blue-500 outline-none px-1"
                                    placeholder="Título del recurso"
                                />
                                <div className="flex gap-2">
                                    <select
                                        value={formData.type}
                                        onChange={e => setFormData({ ...formData, type: e.target.value })}
                                        className="text-xs border border-slate-200 rounded px-2 py-1 bg-slate-50 text-slate-700 focus:border-blue-500 outline-none font-bold uppercase"
                                    >
                                        <option value="VIDEO">VIDEO</option>
                                        <option value="ARTICLE">ARTÍCULO</option>
                                        <option value="DRIVE">DRIVE</option>
                                        <option value="EMBED">EMBED</option>
                                        <option value="WEBSITE">WEBSITE</option>
                                    </select>

                                    {formData.type === 'DRIVE' ? (
                                        <div className="flex-1 flex gap-2">
                                            <input
                                                value={formData.url}
                                                readOnly
                                                className="flex-1 text-xs text-slate-500 border-b border-slate-200 bg-slate-50 px-1 font-mono truncate"
                                                placeholder="Selecciona un archivo..."
                                            />
                                            <button
                                                onClick={() => setIsDriveModalOpen(true)}
                                                className="flex items-center gap-1.5 px-3 py-1 bg-blue-100 text-blue-700 rounded text-xs font-bold hover:bg-blue-200 transition-colors whitespace-nowrap"
                                            >
                                                <Cloud className="w-3 h-3" /> Seleccionar
                                            </button>
                                        </div>
                                    ) : formData.type === 'EMBED' ? (
                                        <textarea
                                            value={formData.url}
                                            onChange={e => setFormData({ ...formData, url: e.target.value })}
                                            className="flex-1 text-xs text-slate-500 border border-slate-200 rounded p-1 font-mono focus:border-blue-500 outline-none h-16 resize-none"
                                            placeholder="<iframe src='...'></iframe>"
                                            rows={2}
                                        />
                                    ) : (
                                        <input
                                            value={formData.url}
                                            onChange={e => setFormData({ ...formData, url: e.target.value })}
                                            className="flex-1 text-xs text-slate-500 border-b border-slate-200 focus:border-blue-500 outline-none px-1 font-mono"
                                            placeholder={getTypeLabel(formData.type)}
                                        />
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className={cn("text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 flex items-center gap-1.5 w-fit")}>
                                        {getIcon()}
                                        {resource.type}
                                    </span>
                                    <span className="text-[10px] text-slate-400 font-medium">|</span>
                                    <span className="text-[10px] text-slate-400 font-medium truncate max-w-[150px]">{resource.project.title}</span>
                                </div>
                                <h1 className="text-lg font-bold text-slate-900 leading-tight truncate max-w-md md:max-w-2xl" title={resource.title}>
                                    {resource.title}
                                </h1>
                            </div>
                        )}
                    </div>

                    <div className="flex gap-2">
                        {/* Edit Actions */}
                        {!isEditing ? (
                            <button
                                onClick={() => setIsEditing(true)}
                                className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 flex items-center gap-2 transition-colors"
                                title="Editar Contenido"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
                            </button>
                        ) : (
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handleAIImprovement}
                                    disabled={isExtracting}
                                    className="px-3 py-2 bg-purple-50 text-purple-600 hover:bg-purple-100 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors disabled:opacity-50"
                                >
                                    <Sparkles className={cn("w-4 h-4", isExtracting && "animate-spin")} />
                                    {isExtracting ? 'Analizando...' : 'Mejorar con IA'}
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={isSaving}
                                    className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg text-sm font-bold transition-colors disabled:opacity-50"
                                >
                                    {isSaving ? 'Guardando...' : 'Guardar'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowDeleteConfirm(true)}
                                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Eliminar Recurso"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={() => setIsEditing(false)}
                                    className="px-3 py-2 text-slate-500 hover:bg-slate-100 rounded-lg text-sm font-bold"
                                >
                                    Cancelar
                                </button>
                            </div>
                        )}

                        <div className="w-px h-8 bg-slate-200 mx-1"></div>

                        <button
                            onClick={() => {
                                if (sidebarOpen && activeTab === 'comments') {
                                    setSidebarOpen(false);
                                } else {
                                    setSidebarOpen(true);
                                    setActiveTab('comments');
                                }
                            }}
                            className={cn("p-2 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium", sidebarOpen && activeTab === 'comments' ? "bg-blue-50 text-blue-600" : "hover:bg-slate-50 text-slate-500")}
                        >
                            <MessageSquare className="w-5 h-5" />
                            <span className="hidden md:inline">Comentarios</span>
                        </button>
                        <button
                            onClick={() => {
                                if (sidebarOpen && activeTab === 'info') {
                                    setSidebarOpen(false);
                                } else {
                                    setSidebarOpen(true);
                                    setActiveTab('info');
                                }
                            }}
                            className={cn("p-2 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium", sidebarOpen && activeTab === 'info' ? "bg-blue-50 text-blue-600" : "hover:bg-slate-50 text-slate-500")}
                        >
                            <Info className="w-5 h-5" />
                            <span className="hidden md:inline">Detalles</span>
                        </button>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto bg-slate-50 p-4 flex items-center justify-center">
                    <ResourceRenderer resource={resource} />
                </div>
            </div>

            {/* Sidebar */}
            {sidebarOpen && (
                <aside className="w-full md:w-96 bg-white border-l border-slate-200 overflow-hidden shrink-0 animate-in slide-in-from-right duration-300 absolute md:relative right-0 h-full z-20 shadow-2xl md:shadow-none flex flex-col">
                    {activeTab === 'info' && (
                        <div className="p-6 space-y-8 overflow-y-auto h-full">
                            <div>
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Presentación</h3>
                                {isEditing ? (
                                    <textarea
                                        value={formData.presentation}
                                        onChange={e => setFormData({ ...formData, presentation: e.target.value })}
                                        className="w-full p-3 bg-white rounded-xl border border-slate-200 text-sm text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                                        rows={6}
                                        placeholder="Descripción o presentación del recurso..."
                                    />
                                ) : (
                                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-sm text-slate-600 leading-relaxed italic">
                                        &ldquo;{formData.presentation || resource.presentation || 'Sin descripción disponible.'}&rdquo;
                                    </div>
                                )}
                            </div>

                            <div>
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                    <Sparkles className="w-3 h-3 text-amber-500" /> Utilidad Pedagógica
                                </h3>
                                {isEditing ? (
                                    <textarea
                                        value={formData.utility}
                                        onChange={e => setFormData({ ...formData, utility: e.target.value })}
                                        className="w-full p-3 bg-white rounded-xl border border-slate-200 text-sm text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                                        rows={4}
                                        placeholder="¿Para qué sirve este recurso?"
                                    />
                                ) : (
                                    <div className="p-4 bg-amber-50/50 rounded-xl border border-amber-100/50 text-sm text-slate-700 leading-relaxed font-medium">
                                        {formData.utility || resource.utility || 'No especificada.'}
                                    </div>
                                )}
                            </div>

                            {!isEditing && (
                                <div>
                                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Detalles</h3>
                                    <ul className="space-y-3">
                                        <li className="flex justify-between text-xs">
                                            <span className="text-slate-500">Categoría</span>
                                            <span className="font-bold text-slate-700">{resource.category.name}</span>
                                        </li>
                                        <li className="flex justify-between text-xs">
                                            <span className="text-slate-500">Fecha</span>
                                            <span className="font-bold text-slate-700">{new Date(resource.createdAt).toLocaleDateString()}</span>
                                        </li>
                                        <li className="pt-4 mt-4 border-t border-slate-100">
                                            <a
                                                href={resource.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center justify-center gap-2 w-full py-2.5 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800 transition-colors"
                                            >
                                                <ExternalLink className="w-4 h-4" /> Abrir Fuente Original
                                            </a>
                                        </li>
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'comments' && (
                        <ResourceComments
                            resourceId={resource.id}
                            initialComments={comments}
                            currentUserId={currentUserId}
                        />
                    )}
                </aside>
            )}

            <DrivePickerModal
                isOpen={isDriveModalOpen}
                onClose={() => setIsDriveModalOpen(false)}
                onSelect={handleDriveFileSelected}
            />

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center shrink-0">
                                    <AlertTriangle className="w-6 h-6 text-red-600" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-slate-900">¿Eliminar Recurso?</h3>
                                    <p className="text-slate-500 text-sm">Esta acción no se puede deshacer y el recurso desaparecerá de proyectos y biblioteca.</p>
                                </div>
                            </div>

                            <div className="bg-slate-50 p-4 rounded-xl mb-6 border border-slate-100">
                                <p className="text-sm font-bold text-slate-700 truncate">{resource.title}</p>
                                <p className="text-xs text-slate-500 mt-1">{resource.type} • {resource.category.name}</p>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowDeleteConfirm(false)}
                                    disabled={isDeleting}
                                    className="flex-1 py-3 px-4 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-colors disabled:opacity-50"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleDelete}
                                    disabled={isDeleting}
                                    className="flex-1 py-3 px-4 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 shadow-lg shadow-red-100 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {isDeleting ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> : null}
                                    {isDeleting ? 'Eliminando...' : 'Sí, Eliminar'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function ResourceRenderer({ resource }: { resource: Resource }) {
    if (resource.type === 'VIDEO') {
        let embedUrl = resource.url;
        if (resource.url.includes("watch?v=")) {
            embedUrl = resource.url.replace("watch?v=", "embed/").split('&')[0];
        } else if (resource.url.includes("youtu.be/")) {
            embedUrl = resource.url.replace("youtu.be/", "youtube.com/embed/").split('?')[0];
        }

        return (
            <div className="w-full max-w-4xl aspect-video rounded-xl overflow-hidden shadow-2xl bg-black">
                <iframe
                    src={embedUrl}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                />
            </div>
        );
    }

    if (resource.type === 'EMBED') {
        // Si es un iframe string, lo renderizamos
        if (resource.url.includes('<iframe')) {
            return (
                <div
                    className="w-full h-full flex items-center justify-center p-4"
                    dangerouslySetInnerHTML={{ __html: resource.url }}
                />
            );
        }
        // Si es URL
        return (
            <iframe
                src={resource.url}
                className="w-full h-full bg-white rounded-lg shadow-lg"
                title={resource.title}
            />
        );
    }

    if (resource.type === 'DRIVE') {
        // Transformar link de view/edit a preview para mejor experiencia embedded
        const previewUrl = resource.url.includes('drive.google.com')
            ? resource.url.replace(/\/view.*$/, '/preview').replace(/\/edit.*$/, '/preview')
            : resource.url;

        return (
            <iframe
                src={previewUrl}
                className="w-full h-full max-w-5xl bg-white rounded-lg shadow-lg border-0"
                title={resource.title}
            />
        );
    }

    // Default (ARTICLE, PDF links, etc)
    return (
        <div className="text-center max-w-md w-full p-8 bg-white rounded-2xl shadow-xl border border-slate-100">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Globe className="w-8 h-8 text-blue-500" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">{resource.title}</h3>
            <p className="text-slate-500 text-sm mb-6">
                Este recurso es un enlace externo o documento no previsualizable directamente.
            </p>
            <a
                href={resource.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg hover:shadow-blue-200 hover:-translate-y-0.5"
            >
                <ExternalLink className="w-5 h-5" /> Abrir Recurso
            </a>
        </div>
    );
}
