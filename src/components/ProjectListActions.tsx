'use client';

import Link from 'next/link';
import { Eye, ArrowRight, Trash2, Loader2, AlertTriangle } from 'lucide-react';
import { useState } from 'react';
import { deleteProjectAction } from '@/app/actions/project-actions';
import { getProjectRoute } from '@/lib/routes';
import { useModals } from '@/components/ModalProvider';

interface ProjectListActionsProps {
    projectId: string;
    projectTitle: string;
    projectType: string;
}

export function ProjectListActions({ projectId, projectTitle, projectType }: ProjectListActionsProps) {
    const { showAlert, showConfirm: confirmDialog } = useModals();
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            const result = await deleteProjectAction(projectId);
            if (!result.success) {
                await showAlert("Error", result.error || "No se pudo eliminar el proyecto", "error");
                setIsDeleting(false);
            } else {
                // Success: list checks will re-render or page will refresh
                window.location.reload();
            }
        } catch (error) {
            console.error(error);
            await showAlert("Error", "Error crítico al eliminar el proyecto", "error");
            setIsDeleting(false);
        }
    };

    return (
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-2">
            <Link
                href={getProjectRoute(projectId, projectType)}
                className="flex-1 bg-white border border-slate-200 text-slate-700 font-bold py-2 rounded-lg text-sm flex items-center justify-center gap-2 hover:bg-slate-50 hover:text-blue-600 hover:border-blue-200 transition-colors"
                title="Ver y Gestionar Detalles"
            >
                <Eye className="w-4 h-4" /> Gestionar
            </Link>
            <Link
                href={`${getProjectRoute(projectId, projectType)}/kanban`}
                className="flex-1 bg-slate-900 text-white font-bold py-2 rounded-lg text-sm flex items-center justify-center gap-2 hover:bg-black transition-colors"
            >
                Kanban <ArrowRight className="w-4 h-4" />
            </Link>
            <button
                onClick={async () => {
                    const confirm = await confirmDialog(
                        "¿Eliminar Proyecto?",
                        `¿Estás seguro de eliminar "${projectTitle}"? Esta acción borrará todos sus datos y la carpeta de Drive.`,
                        "danger"
                    );
                    if (confirm) handleDelete();
                }}
                disabled={isDeleting}
                className="px-3 py-2 bg-red-50 text-red-600 border border-red-100 rounded-lg hover:bg-red-100 hover:border-red-200 transition-colors disabled:opacity-50"
                title="Eliminar Proyecto"
            >
                {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            </button>
        </div>
    );
}
