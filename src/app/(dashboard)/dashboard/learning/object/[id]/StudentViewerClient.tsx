'use client';

import { useEffect, useState } from 'react';
import { BookOpen, Video, FileText, Globe, CheckCircle2, ChevronLeft, ChevronRight, PlayCircle, Link as LinkIcon, Menu, AlertTriangle, Trash2, MessageSquare, Sparkles } from 'lucide-react';
import { trackClientActivity } from '@/lib/client-activity';

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
import { useModals } from '@/components/ModalProvider';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function StudentViewerClient({ learningObject, comments, currentUserId, currentUserRole }: { learningObject: LearningObject, comments: any[], currentUserId?: string, currentUserRole?: string }) {
    const { showAlert, showConfirm } = useModals();
    // Ordenar los items y definir el estado inicial
    const sortedItems = [...learningObject.items].sort((a, b) => a.order - b.order);
    const [currentIndex, setCurrentIndex] = useState(-1); // -1 is Intro
    const activeItem = currentIndex >= 0 ? sortedItems[currentIndex] : null;

    const [isDeleting, setIsDeleting] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isCommentsOpen, setIsCommentsOpen] = useState(false);

    useEffect(() => {
        trackClientActivity(
            {
                action: 'VIEW_LEARNING_OBJECT',
                description: `Visualizó OA "${learningObject.title}"`,
                metadata: {
                    learningObjectId: learningObject.id,
                    subject: learningObject.subject,
                    totalItems: learningObject.items.length,
                }
            },
            {
                debounceKey: `view-oa:${learningObject.id}`,
                minIntervalMs: 60000
            }
        );
    }, [learningObject.id, learningObject.items.length, learningObject.subject, learningObject.title]);

    useEffect(() => {
        if (!activeItem) return;

        trackClientActivity(
            {
                action: 'VIEW_LEARNING_ITEM',
                description: `Visualizó recurso del OA "${activeItem.title}"`,
                metadata: {
                    learningObjectId: learningObject.id,
                    resourceItemId: activeItem.id,
                    itemType: activeItem.type,
                    index: currentIndex,
                }
            },
            {
                debounceKey: `view-oa-item:${activeItem.id}`,
                minIntervalMs: 45000
            }
        );
    }, [activeItem, currentIndex, learningObject.id]);

    const handleDelete = async () => {
        const confirm = await showConfirm(
            "¿Eliminar Objeto de Aprendizaje?",
            `Esta acción eliminará "${learningObject.title}" y todos sus recursos de forma permanente.`,
            "danger"
        );

        if (!confirm) return;

        setIsDeleting(true);
        try {
            await deleteLearningObjectAction(learningObject.id);
        } catch {
            await showAlert("Error al eliminar", "No se pudo completar la eliminación. Inténtalo de nuevo.", "error");
            setIsDeleting(false);
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


            {/* BARRA LATERAL: Índice de Contenidos */}
            <aside className={`bg-white border-r border-slate-200 flex-col shrink-0 transition-all duration-300 ease-in-out hidden md:flex ${isSidebarOpen ? 'w-80 opacity-100' : 'w-0 opacity-0 overflow-hidden border-none'}`}>
                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                    <div>
                        <h2 className="text-sm font-bold text-slate-800 truncate px-1">Índice del Curso</h2>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest px-1">{learningObject.subject}</p>
                    </div>
                    {(currentUserRole === 'ADMIN' || currentUserRole === 'TEACHER') && (
                        <div className="flex gap-1">
                            <a href={`/dashboard/learning/${learningObject.id}/edit`} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors" title="Editar">
                                <Sparkles className="w-4 h-4" />
                            </a>
                        </div>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto py-4">
                    <div className="space-y-1 px-3">
                        {/* Botón de Inicio/Intro */}
                        <button
                            onClick={() => setCurrentIndex(-1)}
                            className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left group ${currentIndex === -1 ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'}`}
                        >
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-colors ${currentIndex === -1 ? 'bg-blue-500 border-blue-400' : 'bg-white border-slate-200'}`}>
                                <BookOpen className={`w-4 h-4 ${currentIndex === -1 ? 'text-white' : 'text-slate-400'}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="text-xs font-bold truncate">Inicio del OA</h4>
                                <p className={`text-[10px] font-medium ${currentIndex === -1 ? 'text-blue-100' : 'text-slate-400'}`}>Generalidades</p>
                            </div>
                        </button>

                        <div className="my-4 px-2">
                            <div className="h-px bg-slate-100 w-full" />
                        </div>

                        {sortedItems.map((item, index) => {
                            const isActive = currentIndex === index;
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => setCurrentIndex(index)}
                                    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left group ${isActive ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'}`}
                                >
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-colors ${isActive ? 'bg-blue-500 border-blue-400' : 'bg-white border-slate-200'}`}>
                                        <div className={isActive ? 'text-white' : 'text-slate-400'}>
                                            {getItemIcon(item.type, isActive)}
                                        </div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-xs font-bold truncate">{index + 1}. {item.title}</h4>
                                        <p className={`text-[10px] font-medium ${isActive ? 'text-blue-100' : 'text-slate-400 uppercase'}`}>{item.type}</p>
                                    </div>
                                    {isActive && <ChevronRight className="w-4 h-4 text-blue-200 shrink-0" />}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="p-4 border-t border-slate-100 bg-slate-50/50">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest text-center">Progreso</p>
                    <div className="mt-2 h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-blue-600 transition-all duration-1000"
                            style={{ width: `${((currentIndex + 1) / sortedItems.length) * 100}%` }}
                        />
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
                            title={isSidebarOpen ? "Ocultar Índice" : "Mostrar Índice"}
                        >
                            {isSidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
                        </button>

                        {currentIndex === -1 ? (
                            <h2 className="text-lg font-bold">Introducción al Objeto de Aprendizaje</h2>
                        ) : activeItem && (
                            <>
                                <span className="bg-slate-800 text-slate-300 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">
                                    {activeItem.type}
                                </span>
                                <h2 className="text-lg font-bold truncate max-w-[200px] md:max-w-md">{activeItem.title}</h2>
                            </>
                        )}
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-sm font-medium text-slate-400 hidden lg:inline">
                            {currentIndex === -1 ? 'Bienvenida' : `Recurso ${currentIndex + 1} de ${sortedItems.length}`}
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

                <div className="flex flex-1 overflow-hidden relative">
                    {/* CONTENEDOR DE RENDERIZADO DINÁMICO */}
                    <div className="flex-1 relative bg-white flex flex-col overflow-y-auto">
                        {currentIndex === -1 ? (
                            <div className="flex-1 flex flex-col items-center justify-center p-6 bg-slate-50">
                                <div className="max-w-4xl w-full space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
                                    {/* Cabecera Hero */}
                                    <div className="text-center space-y-3">
                                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-black uppercase tracking-widest">
                                            <Sparkles className="w-3 h-3" /> Objeto de Aprendizaje
                                        </div>
                                        <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight leading-tight">
                                            {learningObject.title}
                                        </h1>
                                        <p className="text-base text-slate-500 font-medium">
                                            {learningObject.subject} • {learningObject.competency || 'Competencia General'}
                                        </p>
                                    </div>

                                    {/* Grid de Metadatos */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow space-y-3">
                                            <div className="flex items-center gap-3 mb-2">
                                                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                                                    <FileText className="w-5 h-5" />
                                                </div>
                                                <h3 className="text-lg font-bold text-slate-800">Presentación</h3>
                                            </div>
                                            <p className="text-sm text-slate-600 leading-relaxed">
                                                {learningObject.presentation || "Este objeto de aprendizaje ha sido diseñado para fortalecer tus competencias en la materia de manera interactiva y práctica."}
                                            </p>
                                        </div>

                                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow space-y-3 text-left">
                                            <div className="flex items-center gap-3 mb-2">
                                                <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600">
                                                    <Sparkles className="w-5 h-5" />
                                                </div>
                                                <h3 className="text-lg font-bold text-slate-800">Utilidad Pedagógica</h3>
                                            </div>
                                            <p className="text-sm text-slate-600 leading-relaxed">
                                                {learningObject.utility || "Al finalizar este recurso, habrás adquirido herramientas clave y conocimientos aplicables a situaciones reales del entorno educativo."}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Botón Central */}
                                    <div className="flex flex-col items-center gap-6">
                                        <button
                                            onClick={() => setCurrentIndex(0)}
                                            className="group relative flex items-center gap-3 bg-slate-900 hover:bg-blue-600 text-white px-8 py-4 rounded-xl font-black text-lg transition-all hover:scale-105 active:scale-95 shadow-xl shadow-blue-500/10"
                                        >
                                            <PlayCircle className="w-6 h-6" />
                                            Empezar Curso
                                            <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                        </button>
                                        <div className="flex flex-wrap justify-center gap-2">
                                            {learningObject.keywords.map((kw, i) => (
                                                <span key={i} className="text-[10px] font-bold bg-slate-200 text-slate-500 px-2 py-1 rounded-lg uppercase">
                                                    #{kw}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col h-full bg-slate-900">
                                {/* Visor de Recurso (Top) - Fixed Flex height */}
                                <div className="flex-[3] relative flex items-center justify-center p-4 min-h-[400px]">
                                    {activeItem && <ResourceRenderer item={activeItem} />}
                                </div>

                                {/* Metadatos del Recurso (Bottom) - Unified Scroll Container */}
                                <div className="flex-[2] bg-white border-t border-slate-200 overflow-y-auto custom-scrollbar shadow-[0_-10px_20px_rgba(0,0,0,0.02)]">
                                    {activeItem && (
                                        <div className="max-w-6xl mx-auto p-6 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
                                            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
                                                <div className="space-y-1">
                                                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                                                        {activeItem.title}
                                                    </h2>
                                                    <div className="flex items-center gap-3 text-slate-500 text-xs font-medium">
                                                        <span className="flex items-center gap-1.5 px-2 py-0.5 bg-slate-100 rounded-md uppercase tracking-wider">
                                                            {getItemIcon(activeItem.type, false)}
                                                            {activeItem.type}
                                                        </span>
                                                        {activeItem.subject && (
                                                            <>
                                                                <span className="w-1 h-1 bg-slate-300 rounded-full" />
                                                                <span>{activeItem.subject}</span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>

                                                {activeItem.competency && (
                                                    <div className="px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100 flex items-center gap-2 text-xs font-bold">
                                                        <CheckCircle2 className="w-4 h-4" />
                                                        {activeItem.competency}
                                                    </div>
                                                )}
                                            </div>

                                            <div className={`grid grid-cols-1 ${!isSidebarOpen ? 'lg:grid-cols-2' : ''} gap-8`}>
                                                <div className="space-y-6">
                                                    {activeItem.presentation && (
                                                        <div className="space-y-2">
                                                            <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] flex items-center gap-2">
                                                                <div className="w-4 h-px bg-blue-600/30" /> Presentación
                                                            </h4>
                                                            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 text-slate-700 leading-relaxed text-sm shadow-sm">
                                                                {activeItem.presentation}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {activeItem.keywords && activeItem.keywords.length > 0 && (
                                                        <div className="space-y-2 pt-2">
                                                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Conceptos Clave</h4>
                                                            <div className="flex flex-wrap gap-2">
                                                                {activeItem.keywords.map((kw, i) => (
                                                                    <span key={i} className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-[10px] font-bold text-slate-600 hover:border-blue-300 hover:text-blue-600 transition-colors cursor-default">
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
                                                            <h4 className="text-[10px] font-black text-amber-600 uppercase tracking-[0.2em] flex items-center gap-2">
                                                                <div className="w-4 h-px bg-amber-600/30" /> Utilidad Pedagógica
                                                            </h4>
                                                            <div className="p-5 bg-amber-50/50 rounded-2xl border border-amber-100 text-slate-700 leading-relaxed italic text-sm shadow-inner">
                                                                &quot;{activeItem.utility}&quot;
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

                {/* Controles de Navegación Inferior - Persistentes */}
                <footer className="bg-slate-900 border-t border-slate-800 p-4 flex justify-between items-center shrink-0">
                    <button
                        onClick={() => setCurrentIndex(prev => prev - 1)}
                        disabled={currentIndex === -1}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-medium disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                        <ChevronLeft className="w-5 h-5" /> Anterior
                    </button>

                    <button
                        onClick={() => setCurrentIndex(prev => Math.min(sortedItems.length - 1, prev + 1))}
                        disabled={currentIndex === sortedItems.length - 1}
                        className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold shadow-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                        {currentIndex === -1 ? 'Empezar' : 'Siguiente'} <ChevronRight className="w-5 h-5" />
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
