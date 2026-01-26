'use client';

import { useState } from 'react';
import { ExternalLink, Heart, CheckCircle, Video, FileText, File } from 'lucide-react';
import { cn } from '@/lib/utils';

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
            case 'VIDEO': return <Video className="w-5 h-5 text-purple-500" />;
            case 'FILE': return <File className="w-5 h-5 text-orange-500" />;
            default: return <FileText className="w-5 h-5 text-blue-500" />;
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 hover:shadow-md transition-shadow group relative">
            <div className="flex justify-between items-start">
                <div className={`text-xs px-2 py-1 rounded-full font-medium ${resource.category.color} w-fit`}>
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
                <div className="p-2 bg-slate-50 rounded-lg">
                    {getIcon()}
                </div>
                <a href={resource.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-slate-800 hover:text-blue-600 line-clamp-1 block flex-1 group-hover:underline">
                    {resource.title}
                </a>
            </div>

            <p className="text-sm text-slate-500 line-clamp-2 mb-4 h-10">
                {resource.description}
            </p>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <button
                    onClick={() => toggleInteraction('VIEW')}
                    className={cn(
                        "flex items-center gap-2 text-sm font-medium px-3 py-1.5 rounded-lg transition-colors border",
                        isViewed
                            ? "bg-green-50 text-green-700 border-green-200"
                            : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
                    )}
                >
                    <CheckCircle className="w-4 h-4" />
                    {isViewed ? 'Visto' : 'Marcar visto'}
                </button>

                <a
                    href={resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-slate-400 hover:text-blue-500 p-2"
                >
                    <ExternalLink className="w-4 h-4" />
                </a>
            </div>
        </div>
    );
}
