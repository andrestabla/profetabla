'use client';

import { useState, useEffect } from 'react';
import { ResourceCard } from './ResourceCard';
import { Search, Filter, Loader2 } from 'lucide-react';

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

export function ResourceList({ projectId }: { projectId?: string }) {
    const [resources, setResources] = useState<Resource[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filter, setFilter] = useState<'ALL' | 'FAVORITES'>('ALL');

    useEffect(() => {
        const url = projectId ? `/api/resources?projectId=${projectId}` : '/api/resources';
        fetch(url)
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setResources(data);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, [projectId]);

    const filteredResources = resources.filter(r => {
        const matchesSearch = r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            r.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            r.category.name.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesFilter = filter === 'ALL' || (filter === 'FAVORITES' && r.isFavorite);

        return matchesSearch && matchesFilter;
    });

    if (loading) {
        return (
            <div className="flex justify-center py-20">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
        );
    }

    return (
        <div>
            {/* Search & Filter Bar */}
            <div className="flex flex-col md:flex-row gap-4 mb-8">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Buscar por título, tema o descripción..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
                    />
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={() => setFilter('ALL')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === 'ALL' ? 'bg-slate-800 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                            }`}
                    >
                        Todos
                    </button>
                    <button
                        onClick={() => setFilter('FAVORITES')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${filter === 'FAVORITES' ? 'bg-pink-50 text-pink-600 border border-pink-200' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                            }`}
                    >
                        <HeartIcon filled={filter === 'FAVORITES'} /> Favoritos
                    </button>
                </div>
            </div>

            {/* Grid */}
            {filteredResources.length === 0 ? (
                <div className="text-center py-20 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                    <p className="text-slate-500 font-medium">No se encontraron recursos.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredResources.map(resource => (
                        <ResourceCard key={resource.id} resource={resource} />
                    ))}
                </div>
            )}
        </div>
    );
}

function HeartIcon({ filled }: { filled: boolean }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill={filled ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-4 h-4"
        >
            <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
        </svg>
    )
}
