'use client';

import Link from 'next/link';
import { Eye, ArrowRight, Trash2, Loader2, AlertTriangle } from 'lucide-react';
import { useState } from 'react';
import { deleteProjectAction } from '@/app/actions/project-actions';

interface ProjectListActionsProps {
    projectId: string;
    projectTitle: string;
}

export function ProjectListActions({ projectId, projectTitle }: ProjectListActionsProps) {
    const [isDeleting, setIsDeleting] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            const result = await deleteProjectAction(projectId);
            if (!result.success) {
                alert(result.error);
                setIsDeleting(false);
            } else {
                // Success: Modal will close and list checks will re-render
                setShowConfirm(false);
            }
        } catch (error) {
            console.error(error);
            alert("Error al eliminar el proyecto");
            setIsDeleting(false);
        }
    };

    return (
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-2">
            <Link
                href={`/dashboard/professor/projects/${projectId}`}
                className="flex-1 bg-white border border-slate-200 text-slate-700 font-bold py-2 rounded-lg text-sm flex items-center justify-center gap-2 hover:bg-slate-50 hover:text-blue-600 hover:border-blue-200 transition-colors"
                title="Ver y Editar Detalles"
            >
                <Eye className="w-4 h-4" /> Editar
            </Link>
            <Link
                href={`/dashboard/professor/projects/${projectId}/kanban`}
                className="flex-1 bg-slate-900 text-white font-bold py-2 rounded-lg text-sm flex items-center justify-center gap-2 hover:bg-black transition-colors"
            >
                Kanban <ArrowRight className="w-4 h-4" />
            </Link>
            <button
                onClick={() => setShowConfirm(true)}
                className="px-3 py-2 bg-red-50 text-red-600 border border-red-100 rounded-lg hover:bg-red-100 hover:border-red-200 transition-colors"
                title="Eliminar Proyecto"
            >
                <Trash2 className="w-4 h-4" />
            </button>

            {/* Confirmation Modal */}
            {showConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-md rounded-2xl shadow-xl p-6 animate-in zoom-in-95 duration-200">
                        <div className="flex items-center gap-3 mb-4 text-red-600">
                            <div className="p-2 bg-red-100 rounded-full">
                                <AlertTriangle className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900">¿Eliminar Proyecto?</h3>
                        </div>

                        <p className="text-slate-600 mb-6">
                            Estás a punto de eliminar <strong>&quot;{projectTitle}&quot;</strong>.
                            <br /><br />
                            <span className="text-sm bg-red-50 p-2 rounded block border border-red-100 text-red-800">
                                ⚠️ Esta acción eliminará permanentemente todos los datos, entregas, tareas y <strong>la carpeta de Google Drive</strong> asociada. No se puede deshacer.
                            </span>
                        </p>

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setShowConfirm(false)}
                                disabled={isDeleting}
                                className="px-4 py-2 text-slate-600 font-bold hover:bg-slate-100 rounded-lg transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={isDeleting}
                                className="px-4 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                            >
                                {isDeleting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" /> Eliminando...
                                    </>
                                ) : (
                                    <>
                                        <Trash2 className="w-4 h-4" /> Sí, eliminar
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
