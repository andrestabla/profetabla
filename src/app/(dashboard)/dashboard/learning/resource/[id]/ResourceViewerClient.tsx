'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ExternalLink, Info, BookOpen, Video, FileText, Globe, Sparkles, Cloud } from 'lucide-react';
import { cn } from '@/lib/utils';

// Tipos
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
    createdAt: Date;
};

export default function ResourceViewerClient({ resource }: { resource: Resource }) {
    const [showInfo, setShowInfo] = useState(true);

    const getIcon = () => {
        switch (resource.type) {
            case 'VIDEO': return <Video className="w-5 h-5" />;
            case 'ARTICLE': return <FileText className="w-5 h-5" />;
            case 'EMBED': return <Sparkles className="w-5 h-5" />;
            case 'DRIVE': return <Cloud className="w-5 h-5" />;
            default: return <BookOpen className="w-5 h-5" />;
        }
    };

    return (
        <div className="h-[calc(100vh-80px)] bg-slate-100 flex flex-col md:flex-row overflow-hidden rounded-xl border border-slate-200 relative">
            {/* Header / Info Sidebar (Mobile: Top, Desktop: Left/Right depending on preference, let's do Right Sidebar) */}

            {/* Content Area */}
            <div className="flex-1 flex flex-col bg-slate-900 overflow-hidden relative">
                <header className="bg-white border-b border-slate-200 p-4 flex justify-between items-center shrink-0 z-10 shadow-sm">
                    <div className="flex items-center gap-4">
                        <Link href="/dashboard/learning" className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors">
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
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
                    </div>

                    <button
                        onClick={() => setShowInfo(!showInfo)}
                        className={cn("p-2 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium", showInfo ? "bg-blue-50 text-blue-600" : "hover:bg-slate-50 text-slate-500")}
                    >
                        <Info className="w-5 h-5" />
                        <span className="hidden md:inline">Detalles</span>
                    </button>
                </header>

                <div className="flex-1 overflow-y-auto bg-slate-50 p-4 flex items-center justify-center">
                    <ResourceRenderer resource={resource} />
                </div>
            </div>

            {/* Sidebar de Detalles */}
            {showInfo && (
                <aside className="w-full md:w-80 bg-white border-l border-slate-200 overflow-y-auto shrink-0 animate-in slide-in-from-right duration-300 absolute md:relative right-0 h-full z-20 shadow-2xl md:shadow-none">
                    <div className="p-6 space-y-8">
                        <div>
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Presentación</h3>
                            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-sm text-slate-600 leading-relaxed italic">
                                &ldquo;{resource.presentation || 'Sin descripción disponible.'}&rdquo;
                            </div>
                        </div>

                        <div>
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                <Sparkles className="w-3 h-3 text-amber-500" /> Utilidad Pedagógica
                            </h3>
                            <div className="p-4 bg-amber-50/50 rounded-xl border border-amber-100/50 text-sm text-slate-700 leading-relaxed font-medium">
                                {resource.utility || 'No especificada.'}
                            </div>
                        </div>

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
                    </div>
                </aside>
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
