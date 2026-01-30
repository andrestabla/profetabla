'use client';

import { useState } from 'react';
import { ExternalLink, Heart, CheckCircle, Video, FileText, File, BookOpen, Eye, Globe, Cloud, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface Resource {
    id: string;
    title: string;
    description: string | null;
    url: string;
    type: string;
    isViewed: boolean;
    isFavorite: boolean;
    category: {
        name: string;
        color: string;
    };
    isOA: boolean;
    projects?: { id: string; title: string }[];
    project?: { id: string; title: string };
}

export function ResourceCard({ resource, canEdit, onEdit }: { resource: Resource, canEdit?: boolean, onEdit?: (r: Resource) => void }) {
    const [isFavorite, setIsFavorite] = useState(resource.isFavorite);
    const [isViewed, setIsViewed] = useState(resource.isViewed);

    const toggleInteraction = async (action: 'FAVORITE' | 'VIEW') => {
        const newValue = action === 'FAVORITE' ? !isFavorite : !isViewed;

        // Optimistic UI
        if (action === 'FAVORITE') setIsFavorite(newValue);
        if (action === 'VIEW') setIsViewed(newValue);

        try {
            await fetch('/api/resources/interact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    resourceId: resource.id,
                    action,
                    value: newValue
                })
            });
        } catch (error) {
            // Revert on error
            if (action === 'FAVORITE') setIsFavorite(!newValue);
            if (action === 'VIEW') setIsViewed(!newValue);
        }
    };

    const getIcon = () => {
        switch (resource.type) {
            case 'COURSE': return <BookOpen className="w-5 h-5 text-indigo-600" />;
            case 'VIDEO': return <Video className="w-5 h-5 text-purple-500" />;
            case 'FILE': case 'PDF': return <File className="w-5 h-5 text-orange-500" />;
            case 'DRIVE': return <Cloud className="w-5 h-5 text-emerald-500" />;
            case 'EMBED': return <Sparkles className="w-5 h-5 text-pink-500" />;
            case 'LINK': return <Globe className="w-5 h-5 text-blue-500" />;
            default: return <FileText className="w-5 h-5 text-blue-500" />;
        }
    };

    // Lógica de navegación: Usar visor interno para todo excepto cursos (si aplican lógica distinta)
    const shouldUseViewer = resource.type !== 'COURSE';
    const targetUrl = shouldUseViewer ? `/dashboard/learning/resource/${resource.id}` : resource.url;
    const isExternalLink = !shouldUseViewer && !resource.url.startsWith('/');

    // Determine Project Label
    const projectLabel = resource.isOA
        ? (resource.projects && resource.projects.length > 0 ? `${resource.projects.length} Proyectos` : null)
        : (resource.project?.title || null);

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 hover:shadow-md transition-all group relative flex flex-col h-full ring-1 ring-transparent hover:ring-blue-100">
            {/* Header: Category & Actions */}
            <div className="flex justify-between items-start mb-3">
                <div className="flex gap-2 items-center max-w-[70%]">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider truncate ${resource.type === 'COURSE' ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-100 text-slate-600'}`}>
                        {resource.category.name}
                    </span>
                    {projectLabel && canEdit && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-blue-50 text-blue-600 truncate max-w-[100px]" title={resource.isOA ? 'Objetos de Aprendizaje' : projectLabel}>
                            {projectLabel}
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-1">
                    {canEdit && onEdit && (
                        <button
                            onClick={(e) => { e.preventDefault(); onEdit(resource); }}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors order-first"
                            title="Editar"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
                        </button>
                    )}
                    <button
                        onClick={() => toggleInteraction('FAVORITE')}
                        className="p-1.5 hover:bg-pink-50 rounded-full transition-colors"
                    >
                        <Heart className={cn("w-4 h-4 transition-colors", isFavorite ? "fill-pink-500 text-pink-500" : "text-slate-300 hover:text-pink-400")} />
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="flex flex-1 flex-col gap-2">
                <div className="flex items-start gap-3">
                    <div className="p-2.5 bg-slate-50 rounded-xl shrink-0 mt-0.5">
                        {getIcon()}
                    </div>
                    <div>
                        {isExternalLink ? (
                            <a href={targetUrl} target="_blank" rel="noopener noreferrer" className="font-bold text-slate-800 hover:text-blue-600 line-clamp-2 text-sm leading-snug">
                                {resource.title}
                            </a>
                        ) : (
                            <Link href={targetUrl} className="font-bold text-slate-800 hover:text-blue-600 line-clamp-2 text-sm leading-snug">
                                {resource.title}
                            </Link>
                        )}
                        <p className="text-xs text-slate-500 line-clamp-2 mt-1.5 font-medium leading-relaxed">
                            {resource.description || 'Sin descripción disponible.'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-50">
                <button
                    onClick={() => toggleInteraction('VIEW')}
                    className={cn(
                        "flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-lg transition-colors border",
                        isViewed
                            ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                            : "bg-white text-slate-400 border-slate-100 hover:bg-slate-50 hover:text-slate-600"
                    )}
                >
                    <CheckCircle className="w-3.5 h-3.5" />
                    {isViewed ? 'Visto' : 'Marcar visto'}
                </button>

                {shouldUseViewer ? (
                    <Link
                        href={targetUrl}
                        className="flex items-center gap-1.5 text-[11px] font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors"
                    >
                        Ver Ahora
                    </Link>
                ) : (
                    <a
                        href={targetUrl}
                        target={isExternalLink ? "_blank" : undefined}
                        rel={isExternalLink ? "noopener noreferrer" : undefined}
                        className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 hover:text-blue-600 transition-colors px-2 py-1.5"
                    >
                        Abrir <ExternalLink className="w-3 h-3" />
                    </a>
                )}
            </div>
        </div>
    );
}
