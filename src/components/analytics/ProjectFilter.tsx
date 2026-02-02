'use client';

import { useState, useEffect } from 'react';
import { FolderKanban, Search } from 'lucide-react';

interface Project {
    id: string;
    title: string;
}

interface ProjectFilterProps {
    onFilterChange: (projectId: string | null) => void;
}

export function ProjectFilter({ onFilterChange }: ProjectFilterProps) {
    const [projects, setProjects] = useState<Project[]>([]);
    const [selectedProject, setSelectedProject] = useState<string>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchProjects() {
            try {
                const response = await fetch('/api/analytics/professor/projects');
                if (response.ok) {
                    const data = await response.json();
                    setProjects(data.projects || []);
                }
            } catch (error) {
                console.error('Error fetching projects:', error);
            } finally {
                setLoading(false);
            }
        }

        fetchProjects();
    }, []);

    const handleProjectChange = (projectId: string) => {
        setSelectedProject(projectId);
        onFilterChange(projectId === 'all' ? null : projectId);
    };

    const filteredProjects = projects.filter(project =>
        project.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 mb-6">
            <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                    <FolderKanban className="w-5 h-5 text-slate-600" />
                    <span className="text-sm font-semibold text-slate-700">Proyecto:</span>
                </div>

                <div className="flex-1 min-w-[250px] max-w-md relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Buscar proyecto..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>

                <select
                    value={selectedProject}
                    onChange={(e) => handleProjectChange(e.target.value)}
                    disabled={loading}
                    className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 bg-white hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors disabled:bg-slate-100 disabled:cursor-not-allowed min-w-[200px]"
                >
                    <option value="all">Todos los Proyectos ({projects.length})</option>
                    {filteredProjects.map((project) => (
                        <option key={project.id} value={project.id}>
                            {project.title}
                        </option>
                    ))}
                </select>

                {selectedProject !== 'all' && (
                    <button
                        onClick={() => handleProjectChange('all')}
                        className="px-4 py-2 bg-slate-100 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-200 transition-colors"
                    >
                        Ver Todos
                    </button>
                )}
            </div>
        </div>
    );
}
