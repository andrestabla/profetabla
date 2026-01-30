'use client';

import { useState } from 'react';
import { BookOpen, Video, FileText, Globe, CheckCircle2, ChevronLeft, ChevronRight, PlayCircle, Link as LinkIcon, Menu, AlertTriangle, Trash2, MessageSquare, Sparkles } from 'lucide-react';

import { CommentsSection } from '../../components/CommentsSection';

// Tipos adaptados al esquema Prisma
type ItemType = 'PDF' | 'VIDEO' | 'EMBED' | 'DRIVE' | 'S3' | 'LINK' | 'DOC';

type ResourceItem = {
    id: string;
    title: string;
    type: ItemType;
    url: string;
    order: number;
    presentation?: string | null;
    utility?: string | null;
    subject?: string | null;
    competency?: string | null;
    keywords?: string[];
};

type LearningObject = {
    id: string;
    title: string;
    subject: string;
    competency: string | null;
    presentation: string | null;
    utility: string | null;
    keywords: string[];
    items: ResourceItem[];
};

import { deleteLearningObjectAction } from '../../actions';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function StudentViewerClient({ learningObject, comments, currentUserId, currentUserRole }: { learningObject: LearningObject, comments: any[], currentUserId?: string, currentUserRole?: string }) {
    // Ordenar los items y definir el estado inicial
    const sortedItems = [...learningObject.items].sort((a, b) => a.order - b.order);
    const [currentIndex, setCurrentIndex] = useState(-1); // -1 means no item selected (List view)
    const [viewMode, setViewMode] = useState<'LIST' | 'CONTENT'>('LIST');
    const activeItem = currentIndex >= 0 ? sortedItems[currentIndex] : null;

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isCommentsOpen, setIsCommentsOpen] = useState(false);

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            await deleteLearningObjectAction(learningObject.id);
        } catch {
            alert("Error al eliminar");
            setIsDeleting(false);
            setShowDeleteModal(false);
        }
    };

    // Función para obtener el ícono correcto
    const getItemIcon = (type: ItemType, isActive: boolean) => {
        const iconClass = `w-5 h-5 ${isActive ? 'text-white' : 'text-slate-500'}`;
        switch (type) {
            case 'VIDEO': return <Video className={iconClass} />;
            case 'PDF': return <FileText className={iconClass} />;
            case 'DRIVE': return <Globe className={iconClass} />;
            case 'LINK': return <LinkIcon className={iconClass} />;
            default: return <BookOpen className={iconClass} />;
        }
    };

    if (sortedItems.length === 0) {
        return (
            <div className="p-8 text-center text-slate-500">
                Este objeto de aprendizaje aún no tiene recursos educativos.
            </div>
        )
    }

    // const session = { user: { id: currentUserId, role: currentUserRole } };

    return (
        <div className="h-[calc(100vh-80px)] bg-slate-100 flex overflow-hidden rounded-xl border border-slate-200 relative">

            {/* DELETE MODAL */}
            {showDeleteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-in zoom-in-95 duration-200">
                        <div className="flex flex-col items-center text-center">
                            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                                <AlertTriangle className="w-6 h-6 text-red-600" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 mb-2">¿Eliminar Objeto de Aprendizaje?</h3>
                            <p className="text-slate-500 mb-6 text-sm">
                                Esta acción es <strong>irreversible</strong>. Se eliminará permanentemente:
                                <ul className="mt-2 text-left list-disc list-inside bg-red-50 p-3 rounded-lg text-red-700 font-medium">
                                    <li>El objeto &quot;{learningObject.title}&quot;</li>
                                    <li>Los {learningObject.items.length} recursos contenidos</li>
                                    <li>Todos los comentarios e historial de progreso de los estudiantes</li>
                                </ul>
                            </p>

                            <div className="flex gap-3 w-full">
                                <button
                                    onClick={() => setShowDeleteModal(false)}
                                    className="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-bold hover:bg-slate-50"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleDelete}
                                    disabled={isDeleting}
                                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {isDeleting ? 'Eliminando...' : 'Sí, Eliminar'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* BARRA LATERAL: Índice del Paquete SCORM */}
            <aside className="w-80 bg-white border-r border-slate-200 flex flex-col hidden md:flex">
                <div className="p-6 border-b border-slate-100">
                    <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-md uppercase tracking-wider mb-2 inline-block">
                        {learningObject.subject}
                    </span>
                    <h1 className="text-lg font-bold text-slate-800 leading-tight mb-2">
                        {learningObject.title}
                    </h1>
                    <p className="text-xs text-slate-500 font-medium mb-4">Competencia: {learningObject.competency || 'General'}</p>

                    {/* EDIT & DELETE ACTIONS */}
                    {(currentUserRole === 'ADMIN' || currentUserRole === 'TEACHER') && (
                        <div className="flex gap-2 mb-4">
                            <a href={`/dashboard/learning/${learningObject.id}/edit`} className="flex-1 text-center block text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-2 rounded-lg transition-colors">
                                Editar
                            </a>
                            <button
                                onClick={() => setShowDeleteModal(true)}
                                className="px-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
                                title="Eliminar Objeto"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    )}

                    {/* OA METADATA */}
                    <div className="space-y-3 pt-4 border-t border-slate-100">
                        {learningObject.presentation && (
                            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                                <h4 className="text-[10px] font-bold text-slate-400 uppercase mb-1">Presentación</h4>
                                <p className="text-xs text-slate-600 leading-relaxed line-clamp-4 hover:line-clamp-none transition-all">{learningObject.presentation}</p>
                            </div>
                        )}
                        {learningObject.utility && (
                            <div className="bg-amber-50 p-2.5 rounded-lg border border-amber-100">
                                <h4 className="text-[10px] font-bold text-amber-600 uppercase mb-1 flex items-center gap-1">
                                    <Sparkles className="w-3 h-3" /> Utilidad Pedagógica
                                </h4>
                                <p className="text-xs text-slate-600 leading-relaxed line-clamp-4 hover:line-clamp-none transition-all">{learningObject.utility}</p>
                            </div>
                        )}
                        {learningObject.keywords && learningObject.keywords.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                                {learningObject.keywords.map((kw, i) => (
                                    <span key={i} className="text-[8px] font-bold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded uppercase">
                                        {kw}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 px-2">
                        Resumen del Módulo
                    </h3>
                    <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 text-slate-600 text-sm italic">
                        Selecciona un recurso del panel derecho para comenzar a estudiar.
                    </div>
                </div>
            </aside>

            {/* ÁREA PRINCIPAL: El Player / Visor */}
            <main className="flex-1 flex flex-col w-full relative">
                {/* Cabecera del Visor */}
                <header className="bg-slate-900 border-b border-slate-800 p-4 flex justify-between items-center text-white shrink-0">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 transition-colors"
                            title={isSidebarOpen ? "Ocultar Menú" : "Mostrar Menú"}
                        >
                            {isSidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
                        </button>

                        {viewMode === 'CONTENT' && activeItem && (
                            <button
                                onClick={() => setViewMode('LIST')}
                                className="flex items-center gap-1 text-xs font-bold bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg text-blue-400 transition-all"
                            >
                                <ChevronLeft className="w-3 h-3" /> Volver al Índice
                            </button>
                        )}

                        {activeItem ? (
                            <>
                                <span className="bg-slate-800 text-slate-300 text-xs font-bold px-2 py-1 rounded">
                                    {activeItem.type}
                                </span>
                                <h2 className="text-lg font-bold truncate max-w-[200px] md:max-w-md">{activeItem.title}</h2>
                            </>
                        ) : (
                            <h2 className="text-lg font-bold">Contenidos Disponibles</h2>
                        )}
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-sm font-medium text-slate-400 hidden md:inline">
                            Paso {currentIndex + 1} de {sortedItems.length}
                        </span>

                        <div className="h-6 w-px bg-slate-700 mx-2 hidden md:block"></div>

                        <button
                            onClick={() => setIsCommentsOpen(!isCommentsOpen)}
                            className={`p-2 rounded-lg transition-colors flex items-center gap-2 ${isCommentsOpen ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
                            title={isCommentsOpen ? "Ocultar Comentarios" : "Mostrar Comentarios"}
                        >
                            <MessageSquare className="w-4 h-4" />
                            <span className="text-xs font-bold hidden sm:inline">Comentarios</span>
                        </button>
                    </div>
                </header>

                <div className="flex flex-1 overflow-hidden">
                    {/* CONTENEDOR DE RENDERIZADO DINÁMICO */}
                    <div className="flex-1 relative bg-white flex flex-col overflow-y-auto">
                        {viewMode === 'LIST' ? (
                            <div className="p-8 space-y-4">
                                <p className="text-slate-500 font-medium mb-6">Explora los recursos de este objeto de aprendizaje:</p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {sortedItems.map((item, index) => (
                                        <button
                                            key={item.id}
                                            onClick={() => {
                                                setCurrentIndex(index);
                                                setViewMode('CONTENT');
                                            }}
                                            className="flex items-center gap-4 p-5 bg-slate-50 border border-slate-200 rounded-2xl hover:border-blue-500 hover:bg-blue-50/50 hover:shadow-md transition-all group text-left"
                                        >
                                            <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center group-hover:border-blue-200 group-hover:bg-blue-100 transition-colors">
                                                {getItemIcon(item.type, false)}
                                            </div>
                                            <div className="flex-1">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.type}</span>
                                                <h3 className="font-bold text-slate-800 line-clamp-1">{index + 1}. {item.title}</h3>
                                                <p className="text-xs text-slate-500 line-clamp-1">{item.subject || 'Sin materia'}</p>
                                            </div>
                                            <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-blue-500 transition-colors" />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col h-full bg-slate-50">
                                {/* Visor de Recurso (Top) */}
                                <div className="flex-[3] bg-black min-h-[400px] flex items-center justify-center p-4">
                                    {activeItem && <ResourceRenderer item={activeItem} />}
                                </div>

                                {/* Metadatos del Recurso (Bottom) */}
                                <div className="flex-[2] bg-white border-t border-slate-200 overflow-y-auto p-8">
                                    {activeItem && (
                                        <div className="max-w-4xl mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                                            <div className="flex flex-wrap items-center gap-4">
                                                <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg border border-blue-100">
                                                    {getItemIcon(activeItem.type, false)}
                                                    <span className="text-xs font-bold uppercase">{activeItem.type}</span>
                                                </div>
                                                {activeItem.subject && (
                                                    <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg">
                                                        {activeItem.subject}
                                                    </span>
                                                )}
                                                {activeItem.competency && (
                                                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100">
                                                        {activeItem.competency}
                                                    </span>
                                                )}
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                <div className="space-y-6">
                                                    {activeItem.presentation && (
                                                        <div className="space-y-2">
                                                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                                                <FileText className="w-4 h-4" /> Presentación del Recurso
                                                            </h4>
                                                            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 text-slate-700 leading-relaxed">
                                                                {activeItem.presentation}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {activeItem.keywords && activeItem.keywords.length > 0 && (
                                                        <div className="space-y-2">
                                                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Palabras Clave</h4>
                                                            <div className="flex flex-wrap gap-2">
                                                                {activeItem.keywords.map((kw, i) => (
                                                                    <span key={i} className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-600">
                                                                        #{kw}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="space-y-6">
                                                    {activeItem.utility && (
                                                        <div className="space-y-2">
                                                            <h4 className="text-xs font-bold text-amber-600 uppercase tracking-wider flex items-center gap-2">
                                                                <Sparkles className="w-4 h-4" /> Utilidad Pedagógica
                                                            </h4>
                                                            <div className="p-5 bg-amber-50 rounded-2xl border border-amber-100 text-slate-700 leading-relaxed">
                                                                {activeItem.utility}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* COMMENTS SIDEBAR (Right side, collapsible) */}
                    {isCommentsOpen && (
                        <div className="w-80 border-l border-slate-200 bg-white flex flex-col h-full animate-in slide-in-from-right duration-300 absolute md:static inset-y-0 right-0 z-10 shadow-xl md:shadow-none">
                            <div className="flex justify-between items-center p-4 border-b md:hidden">
                                <h3 className="font-bold text-slate-700">Comentarios</h3>
                                <button onClick={() => setIsCommentsOpen(false)}><ChevronRight /></button>
                            </div>
                            <CommentsSection
                                learningObjectId={learningObject.id}
                                comments={comments}
                                currentUserId={currentUserId}
                            />
                        </div>
                    )}
                </div>

                {/* Controles de Navegación Inferior */}
                <footer className="bg-slate-900 border-t border-slate-800 p-4 flex justify-between items-center shrink-0">
                    <button
                        onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
                        disabled={currentIndex === 0}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-medium disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                        <ChevronLeft className="w-5 h-5" /> Anterior
                    </button>

                    <button
                        onClick={() => setCurrentIndex(prev => Math.min(sortedItems.length - 1, prev + 1))}
                        disabled={currentIndex === sortedItems.length - 1}
                        className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold shadow-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                        Siguiente <ChevronRight className="w-5 h-5" />
                    </button>
                </footer>
            </main>
        </div>
    );
}

// ----------------------------------------------------------------------
// Sub-Componente: El "Cerebro" que decide cómo mostrar cada archivo
// ----------------------------------------------------------------------
function ResourceRenderer({ item }: { item: ResourceItem }) {
    // 1. VIDEOS DE YOUTUBE / VIMEO
    if (item.type === 'VIDEO') {
        // Convierte links de YT en formato embed automáticamente (Lógica simplificada)
        let embedUrl = item.url;
        if (item.url.includes("watch?v=")) {
            embedUrl = item.url.replace("watch?v=", "embed/");
        } else if (item.url.includes("youtu.be/")) {
            embedUrl = item.url.replace("youtu.be/", "youtube.com/embed/");
        }

        return (
            <iframe
                src={embedUrl}
                className="w-full h-full rounded-lg"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
            />
        );
    }

    // 2. DOCUMENTOS PDF, DRIVE o iFRAMES GENERALES y EMBEDS RAW HTML
    if (item.type === 'PDF' || item.type === 'DRIVE' || item.type === 'EMBED' || item.type === 'S3') {
        let finalUrl = item.url;

        // Transform Google Drive links for better embedding
        if (item.type === 'DRIVE' || item.url.includes('drive.google.com')) {
            if (item.url.includes('/view')) {
                finalUrl = item.url.replace('/view', '/preview');
            } else if (!item.url.includes('/preview') && item.url.includes('id=')) {
                // If it's a direct ID link but not formatted as /preview
                const idMatch = item.url.match(/id=([^&]+)/);
                if (idMatch) {
                    finalUrl = `https://docs.google.com/viewer?srcid=${idMatch[1]}&pid=explorer&efp=explorer_feedout&embedded=true`;
                }
            }
        }

        // Special case for Raw HTML/Embed Codes
        if (item.type === 'EMBED' && item.url.trim().startsWith('<')) {
            return (
                <div
                    className="w-full h-full bg-white rounded-lg overflow-hidden flex items-center justify-center [&>iframe]:w-full [&>iframe]:h-full [&>iframe]:border-0"
                    dangerouslySetInnerHTML={{ __html: item.url }}
                />
            );
        }

        return (
            <iframe
                src={finalUrl}
                className="w-full h-full bg-white rounded-lg"
                title={item.title}
                allowFullScreen
            />
        );
    }

    // 3. ENLACES EXTERNOS (LINK) o DOCS NO EMBEBIBLES
    if (item.type === 'LINK' || item.type === 'DOC') {
        return (
            <div className="text-center p-8 bg-slate-800 rounded-2xl max-w-md shadow-2xl">
                <Globe className="w-16 h-16 text-blue-500 mx-auto mb-6" />
                <h3 className="text-xl font-bold text-white mb-2">Material Externo</h3>
                <p className="text-slate-400 mb-8 text-sm leading-relaxed">
                    Este recurso se abrirá en una nueva pestaña para no interrumpir tu sesión en Profe Tabla.
                </p>
                <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-lg font-bold transition-all shadow-lg shadow-blue-500/30"
                >
                    <PlayCircle className="w-5 h-5" /> Abrir &quot;{item.title}&quot;
                </a>
            </div>
        );
    }

    return <div className="text-white">Formato no soportado</div>;
}
