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
            <div className="flex flex-col gap-4 mb-8">
                <div className="flex flex-col md:flex-row gap-4">
                    {/* Search */}
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

                    {/* Project Filter (Admin/Teacher only) */}
                    {canEdit && (
                        <select
                            value={selectedProjectFilter}
                            onChange={(e) => setSelectedProjectFilter(e.target.value)}
                            className="px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-100"
                        >
                            <option value="ALL">Todos los Proyectos</option>
                            <option value="GLOBAL">🌐 Globales</option>
                            {availableProjects.map(p => (
                                <option key={p.id} value={p.id}>{p.title}</option>
                            ))}
                        </select>
                    )}

                    {/* Topic Filter */}
                    <select
                        value={selectedTopic}
                        onChange={(e) => setSelectedTopic(e.target.value)}
                        className="px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    >
                        <option value="ALL">Todos los Temas</option>
                        {uniqueTopics.map(topic => (
                            <option key={topic} value={topic}>{topic}</option>
                        ))}
                    </select>
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
            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                </div>
            ) : filteredClientSide.length === 0 ? (
                <div className="text-center py-20 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                    <p className="text-slate-500 font-medium">No se encontraron recursos.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredClientSide.map(resource => (
                        <div key={resource.id} className="relative group">
                            <ResourceCard resource={resource} />

                            {/* Edit Button Overlay */}
                            {canEdit && (
                                <button
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        handleEdit(resource);
                                    }}
                                    className="absolute top-4 right-4 p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:text-blue-600 z-10"
                                    title="Editar Recurso"
                                >
                                    <Edit className="w-4 h-4" />
                                </button>
                            )}

                            {/* Badges for Project Association */}
                            {(resource.project || (resource.projects && resource.projects.length > 0)) && canEdit && (
                                <div className="absolute bottom-4 right-4 z-10">
                                    <span className="bg-slate-100/90 text-[10px] px-2 py-1 rounded-full text-slate-600 font-medium border border-slate-200 shadow-sm backdrop-blur-sm">
                                        {resource.isOA
                                            ? `${resource.projects?.length} Proyectos`
                                            : (resource.project?.title || 'Global')}
                                    </span>
                                </div>
                            )}
                        </div>
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
