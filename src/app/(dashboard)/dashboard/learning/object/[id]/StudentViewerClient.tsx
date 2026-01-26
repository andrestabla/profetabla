'use client';

import { useState } from 'react';
import { BookOpen, Video, FileText, Globe, CheckCircle2, ChevronLeft, ChevronRight, PlayCircle, Link as LinkIcon } from 'lucide-react';

import { CommentsSection } from '../../components/CommentsSection';

// Tipos adaptados al esquema Prisma
type ItemType = 'PDF' | 'VIDEO' | 'EMBED' | 'DRIVE' | 'S3' | 'LINK' | 'DOC';

type ResourceItem = {
    id: string;
    title: string;
    type: ItemType;
    url: string;
    order: number;
};

type LearningObject = {
    id: string;
    title: string;
    subject: string;
    competency: string | null;
    items: ResourceItem[];
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function StudentViewerClient({ learningObject, comments, currentUserId, currentUserRole }: { learningObject: LearningObject, comments: any[], currentUserId?: string, currentUserRole?: string }) {
    // Ordenar los items y definir el estado inicial
    const sortedItems = [...learningObject.items].sort((a, b) => a.order - b.order);
    const [currentIndex, setCurrentIndex] = useState(0);
    const activeItem = sortedItems[currentIndex];

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

    if (!activeItem) {
        return (
            <div className="p-8 text-center text-slate-500">
                Este objeto de aprendizaje no tiene contenido.
            </div>
        )
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const session = { user: { id: currentUserId, role: currentUserRole } }; // Mock for simpler check, pass real props if cleaner

    return (
        <div className="h-[calc(100vh-80px)] bg-slate-100 flex overflow-hidden rounded-xl border border-slate-200">

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

                    {/* EDIT BUTTON (Only for Admin/Author) */}
                    {(currentUserRole === 'ADMIN' || currentUserRole === 'TEACHER') && (
                        <a href={`/dashboard/learning/${learningObject.id}/edit`} className="w-full text-center block text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-2 rounded-lg transition-colors">
                            Editar Objeto
                        </a>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 px-2">
                        Contenido del Módulo
                    </h3>
                    {sortedItems.map((item, index) => {
                        const isActive = index === currentIndex;
                        // TODO: Integrar lógica de "isViewed" de la base de datos
                        const isCompleted = index < currentIndex;

                        return (
                            <button
                                key={item.id}
                                onClick={() => setCurrentIndex(index)}
                                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all font-medium text-sm text-left ${isActive
                                    ? 'bg-blue-600 text-white shadow-md'
                                    : isCompleted
                                        ? 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                                        : 'text-slate-600 hover:bg-slate-50'
                                    }`}
                            >
                                {isCompleted ? (
                                    <CheckCircle2 className={`w-5 h-5 ${isActive ? 'text-blue-200' : 'text-emerald-500'}`} />
                                ) : (
                                    getItemIcon(item.type, isActive)
                                )}
                                <span className="flex-1 line-clamp-2">{index + 1}. {item.title}</span>
                            </button>
                        );
                    })}
                </div>
            </aside>

            {/* ÁREA PRINCIPAL: El Player / Visor */}
            <main className="flex-1 flex flex-col w-full relative">
                {/* Cabecera del Visor */}
                <header className="bg-slate-900 border-b border-slate-800 p-4 flex justify-between items-center text-white shrink-0">
                    <div className="flex items-center gap-3">
                        <span className="bg-slate-800 text-slate-300 text-xs font-bold px-2 py-1 rounded">
                            {activeItem.type}
                        </span>
                        <h2 className="text-lg font-bold truncate max-w-[200px] md:max-w-md">{activeItem.title}</h2>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-sm font-medium text-slate-400 hidden md:inline">
                            Paso {currentIndex + 1} de {sortedItems.length}
                        </span>
                        {/* Mobile Toggle: Not implemented for brevity, but needed for Comments toggle on mobile */}
                    </div>
                </header>

                <div className="flex flex-1 overflow-hidden">
                    {/* CONTENEDOR DE RENDERIZADO DINÁMICO */}
                    <div className="flex-1 relative bg-black flex items-center justify-center p-4 overflow-y-auto">
                        <ResourceRenderer item={activeItem} />
                    </div>

                    {/* COMMENTS SIDEBAR (Right side, collapsible?) - Let's keep it fixed width for now or overlays */}
                    <div className="w-80 border-l border-slate-200 bg-white hidden lg:flex flex-col h-full">
                        <CommentsSection
                            learningObjectId={learningObject.id}
                            comments={comments}
                            currentUserId={currentUserId}
                        />
                    </div>
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

    // 2. DOCUMENTOS PDF, DRIVE o iFRAMES GENERALES
    if (item.type === 'PDF' || item.type === 'DRIVE' || item.type === 'EMBED' || item.type === 'S3') {
        return (
            <iframe
                src={item.url}
                className="w-full h-full bg-white rounded-lg"
                title={item.title}
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
                    <PlayCircle className="w-5 h-5" /> Abrir "{item.title}"
                </a>
            </div>
        );
    }

    return <div className="text-white">Formato no soportado</div>;
}
