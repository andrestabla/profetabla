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
}

export function ResourceCard({ resource }: { resource: Resource }) {
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

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 hover:shadow-md transition-shadow group relative flex flex-col h-full">
            <div className="flex justify-between items-start">
                <div className={`text-xs px-2 py-1 rounded-full font-bold w-fit ${resource.type === 'COURSE' ? 'bg-indigo-100 text-indigo-800' : resource.category.color
                    }`}>
                    {resource.category.name}
                </div>
                <button
                    onClick={() => toggleInteraction('FAVORITE')}
                    className="p-1 hover:bg-slate-50 rounded-full transition-colors"
                >
                    <Heart className={cn("w-5 h-5 transition-colors", isFavorite ? "fill-red-500 text-red-500" : "text-slate-300")} />
                </button>
            </div>

            <div className="mt-4 mb-2 flex items-center gap-3">
                <div className="p-2 bg-slate-50 rounded-lg shrink-0">
                    {getIcon()}
                </div>
                {isExternalLink ? (
                    <a href={targetUrl} target="_blank" rel="noopener noreferrer" className="font-bold text-slate-800 hover:text-blue-600 line-clamp-2 block flex-1 group-hover:underline text-sm leading-tight">
                        {resource.title}
                    </a>
                ) : (
                    <Link href={targetUrl} className="font-bold text-slate-800 hover:text-blue-600 line-clamp-2 block flex-1 group-hover:underline text-sm leading-tight">
                        {resource.title}
                    </Link>
                )}
            </div>

            <p className="text-xs text-slate-500 line-clamp-3 mb-6 flex-1">
                {resource.description || 'Sin descripción disponible.'}
            </p>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-auto">
                <button
                    onClick={() => toggleInteraction('VIEW')}
                    className={cn(
                        "flex items-center gap-2 text-xs font-bold px-3 py-2 rounded-lg transition-colors border",
                        isViewed
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
                    )}
                >
                    <CheckCircle className="w-4 h-4" />
                    {isViewed ? 'Completado' : 'Marcar visto'}
                </button>

                {shouldUseViewer ? (
                    <Link
                        href={targetUrl}
                        className="flex items-center gap-1.5 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-2 rounded-lg transition-colors"
                    >
                        Ver Recurso
                    </Link>
                ) : (
                    <a
                        href={targetUrl}
                        target={isExternalLink ? "_blank" : undefined}
                        rel={isExternalLink ? "noopener noreferrer" : undefined}
                        className="text-slate-400 hover:text-blue-500 p-2"
                        title="Abrir enlace"
                    >
                        <ExternalLink className="w-4 h-4" />
                    </a>
                )}
            </div>
        </div>
    );
}
