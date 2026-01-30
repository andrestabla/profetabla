'use client';

import { useState, useEffect } from 'react';
import { Loader2, X } from 'lucide-react';
import { updateResourceAction, updateLearningObjectAction } from '@/app/(dashboard)/dashboard/learning/actions';
import { useRouter } from 'next/navigation';

interface Project {
    id: string;
    title: string;
}

interface EditResourceModalProps {
    isOpen: boolean;
    onClose: () => void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resource: any; // Resource or OA
    projects: Project[];
}

export function EditResourceModal({ isOpen, onClose, resource, projects }: EditResourceModalProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [selectedProjectId, setSelectedProjectId] = useState<string>('GLOBAL'); // 'GLOBAL' or projectId
    const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]); // For OA (many-to-many)

    useEffect(() => {
        if (resource) {
            setTitle(resource.title || '');
            setDescription(resource.description || '');

            if (resource.isOA) {
                // OA can have multiple projects
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                setSelectedProjectIds(resource.projects?.map((p: any) => p.id) || []);
            } else {
                // Resource has one project or null
                setSelectedProjectId(resource.project?.id || 'GLOBAL');
            }
        }
    }, [resource]);

    const handleSave = async () => {
        if (!resource) return;
        setLoading(true);
        try {
            if (resource.isOA) {
                await updateLearningObjectAction(resource.id, {
                    title,
                    description,
                    projectIds: selectedProjectIds
                });
            } else {
                await updateResourceAction(resource.id, {
                    title,
                    description,
                    projectId: selectedProjectId
                });
            }
            router.refresh();
            onClose();
            window.location.reload();
        } catch (error) {
            console.error(error);
            alert("Error al actualizar");
        } finally {
            setLoading(false);
        }
    };

    const toggleProject = (projectId: string) => {
        setSelectedProjectIds(prev =>
            prev.includes(projectId)
                ? prev.filter(id => id !== projectId)
                : [...prev, projectId]
        );
    };

    if (!isOpen || !resource) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto relative animate-in fade-in zoom-in duration-200">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                <h2 className="text-xl font-bold text-slate-800 mb-6">Editar {resource.isOA ? 'OA' : 'Recurso'}</h2>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Título</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Descripción</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={3}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Asociar a Proyecto(s)</label>

                        {resource.isOA ? (
                            <div className="border border-slate-200 rounded-lg p-3 max-h-40 overflow-y-auto space-y-2 bg-slate-50">
                                {projects.map(project => (
                                    <div key={project.id} className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            id={`p-${project.id}`}
                                            checked={selectedProjectIds.includes(project.id)}
                                            onChange={() => toggleProject(project.id)}
                                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                        />
                                        <label htmlFor={`p-${project.id}`} className="text-sm cursor-pointer select-none text-slate-700">
                                            {project.title}
                                        </label>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="relative">
                                <select
                                    value={selectedProjectId}
                                    onChange={(e) => setSelectedProjectId(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
                                >
                                    <option value="GLOBAL">🌐 Global (Visible para todos)</option>
                                    {projects.map(project => (
                                        <option key={project.id} value={project.id}>
                                            {project.title}
                                        </option>
                                    ))}
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                                </div>
                            </div>
                        )}
                        <p className="text-xs text-slate-500 mt-2">
                            {resource.isOA
                                ? "Los OAs pueden vincularse a múltiples proyectos."
                                : "Los recursos pertenecen a un solo proyecto o son globales."}
                        </p>
                    </div>
                </div>

                <div className="flex justify-end gap-3 mt-8">
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className="px-4 py-2 text-sm font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-70"
                    >
                        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                        Guardar Cambios
                    </button>
                </div>
            </div>
        </div>
    );
}
