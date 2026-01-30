'use client';

import { useState, useEffect, useCallback } from 'react';
import { ResourceCard } from './ResourceCard';
import { Search, Loader2, Edit } from 'lucide-react';
import { EditResourceModal } from '@/components/learning/EditResourceModal';

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
    project?: { id: string, title: string };
    projects?: { id: string, title: string }[];
    isOA: boolean;
}

interface Project {
    id: string;
    title: string;
}

export function ResourceList({ projectId, availableProjects = [], userRole }: { projectId?: string, availableProjects?: Project[], userRole?: string }) {
    const [resources, setResources] = useState<Resource[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filter, setFilter] = useState<'ALL' | 'FAVORITES'>('ALL');
    const [selectedTopic, setSelectedTopic] = useState<string>('ALL');
    const [selectedProjectFilter, setSelectedProjectFilter] = useState<string>('ALL');

    // Modal State
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingResource, setEditingResource] = useState<Resource | null>(null);

    const canEdit = userRole === 'ADMIN' || userRole === 'TEACHER';

    const fetchResources = useCallback(() => {
        setLoading(true);
        const url = `/api/resources?`;

        // Add query params
        const params = new URLSearchParams();
        if (searchTerm) params.append('search', searchTerm);

        // Project Filter Logic:
        // If prop `projectId` is passed (e.g. Student view), use it.
        // If `selectedProjectFilter` is set (Admin view), use it.
        if (projectId) {
            params.append('projectId', projectId);
        } else if (selectedProjectFilter !== 'ALL') {
            params.append('projectId', selectedProjectFilter);
        }

        if (selectedTopic !== 'ALL') params.append('topic', selectedTopic);

        fetch(`${url}${params.toString()}`)
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setResources(data);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, [searchTerm, projectId, selectedProjectFilter, selectedTopic]);

    // Debounce search and initial load
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchResources();
        }, 500);
        return () => clearTimeout(timer);
    }, [fetchResources]);

    // Extract unique topics for dropdown
    const uniqueTopics = Array.from(new Set(resources.map(r => r.category.name)));

    // Handle Edit Click
    const handleEdit = (resource: Resource) => {
        setEditingResource(resource);
        setIsEditModalOpen(true);
    };

    const filteredClientSide = resources.filter(r => {
        const matchesFilter = filter === 'ALL' || (filter === 'FAVORITES' && r.isFavorite);
        return matchesFilter;
    });

    return (
        <div>
            {/* Search & Filter Bar */}
            <div className="flex flex-col gap-4 mb-8 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                <div className="flex flex-col md:flex-row gap-4">
                    {/* Search */}
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Buscar recursos..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm font-medium transition-all"
                        />
                    </div>

                    {/* Filters Group */}
                    <div className="flex flex-wrap gap-2">
                        {/* Project Filter (Admin/Teacher only) */}
                        {canEdit && (
                            <div className="relative min-w-[180px]">
                                <select
                                    value={selectedProjectFilter}
                                    onChange={(e) => setSelectedProjectFilter(e.target.value)}
                                    className="w-full appearance-none px-4 py-2.5 pr-8 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer hover:bg-slate-100 transition-colors"
                                >
                                    <option value="ALL">Todos los Proyectos</option>
                                    <option value="GLOBAL">🌐 Globales</option>
                                    {availableProjects.map(p => (
                                        <option key={p.id} value={p.id}>{p.title}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* Topic Filter */}
                        <div className="relative min-w-[160px]">
                            <select
                                value={selectedTopic}
                                onChange={(e) => setSelectedTopic(e.target.value)}
                                className="w-full appearance-none px-4 py-2.5 pr-8 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer hover:bg-slate-100 transition-colors"
                            >
                                <option value="ALL">Todos los Temas</option>
                                {uniqueTopics.map(topic => (
                                    <option key={topic} value={topic}>{topic}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                <div className="flex gap-2 border-t border-slate-50 pt-3 mt-1">
                    <button
                        onClick={() => setFilter('ALL')}
                        className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${filter === 'ALL' ? 'bg-slate-900 text-white shadow-md' : 'bg-transparent text-slate-500 hover:bg-slate-50'
                            }`}
                    >
                        Todos
                    </button>
                    <button
                        onClick={() => setFilter('FAVORITES')}
                        className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${filter === 'FAVORITES' ? 'bg-pink-100 text-pink-600 shadow-sm' : 'bg-transparent text-slate-500 hover:bg-pink-50 hover:text-pink-500'
                            }`}
                    >
                        <HeartIcon filled={filter === 'FAVORITES'} /> Favoritos
                    </button>
                </div>
            </div>

            {/* Grid */}
            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                </div>
            ) : filteredClientSide.length === 0 ? (
                <div className="text-center py-24 bg-white rounded-2xl border border-dashed border-slate-200">
                    <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Search className="w-6 h-6 text-slate-300" />
                    </div>
                    <p className="text-slate-900 font-bold mb-1">No se encontraron recursos</p>
                    <p className="text-slate-400 text-sm">Intenta ajustar los filtros de búsqueda</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-20">
                    {filteredClientSide.map(resource => (
                        <ResourceCard
                            key={resource.id}
                            resource={resource}
                            canEdit={canEdit}
                            onEdit={handleEdit}
                        />
                    ))}
                </div>
            )}

            <EditResourceModal
                isOpen={isEditModalOpen}
                onClose={() => {
                    setIsEditModalOpen(false);
                    setEditingResource(null);
                }}
                resource={editingResource}
                projects={availableProjects}
            />
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
