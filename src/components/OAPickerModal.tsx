'use client';

import { useState, useEffect, useCallback } from 'react';
import { BookOpen, X, Loader2, Plus } from 'lucide-react';
import { getAvailableLearningObjectsAction, linkLearningObjectToProjectAction } from '@/app/(dashboard)/dashboard/professor/projects/[id]/actions';

interface OAPickerModalProps {
    isOpen: boolean;
    onClose: () => void;
    projectId: string;
}

export function OAPickerModal({ isOpen, onClose, projectId }: OAPickerModalProps) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [oas, setOas] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isLinking, setIsLinking] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            handleFetchOAs();
        }
    }, [isOpen]);

    const handleFetchOAs = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await getAvailableLearningObjectsAction(projectId);
            setOas(data);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    }, [projectId]);

    useEffect(() => {
        if (isOpen) {
            handleFetchOAs();
        }
    }, [isOpen, handleFetchOAs]);

    const handleLink = async (oaId: string) => {
        setIsLinking(oaId);
        try {
            const result = await linkLearningObjectToProjectAction(projectId, oaId);
            if (result.success) {
                onClose();
            } else {
                alert(result.error || 'Error al vincular el OA');
            }
        } catch (e) {
            console.error(e);
            alert('Error desconocido al vincular');
        } finally {
            setIsLinking(null);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="p-6 border-b flex justify-between items-center bg-slate-50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                            <BookOpen className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-900">Vincular Objeto de Aprendizaje</h2>
                            <p className="text-xs text-slate-500">Selecciona un OA disponible para añadirlo a este proyecto</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                        <X className="w-5 h-5 text-slate-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4 text-slate-400">
                            <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
                            <p className="font-medium">Cargando OAs disponibles...</p>
                        </div>
                    ) : oas.length === 0 ? (
                        <div className="text-center py-20 text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200">
                            <BookOpen className="w-16 h-16 mx-auto mb-4 opacity-20" />
                            <p className="font-medium text-slate-900">No hay OAs disponibles</p>
                            <p className="text-xs mt-1">Todos tus OAs ya están vinculados o no has creado ninguno.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4">
                            {oas.map((oa) => (
                                <div
                                    key={oa.id}
                                    className="flex flex-col md:flex-row items-start md:items-center gap-4 p-5 bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all group"
                                >
                                    <div className="p-3 bg-indigo-50 rounded-lg text-indigo-500 group-hover:bg-indigo-100 transition-colors">
                                        <BookOpen className="w-6 h-6" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h4 className="font-bold text-slate-800 text-sm">{oa.title}</h4>
                                            <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-bold uppercase rounded-full">{oa.subject}</span>
                                        </div>
                                        <p className="text-xs text-slate-500 line-clamp-2">{oa.description || 'Sin descripción'}</p>
                                        <div className="flex items-center gap-2 mt-2">
                                            <span className="text-[10px] text-slate-400 font-medium bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                                                {oa.items?.length || 0} recursos internos
                                            </span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleLink(oa.id)}
                                        disabled={!!isLinking}
                                        className="shrink-0 px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-lg hover:bg-indigo-600 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed min-w-[100px] justify-center"
                                    >
                                        {isLinking === oa.id ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <>
                                                <Plus className="w-4 h-4" /> Vincular
                                            </>
                                        )}
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t bg-white flex justify-between items-center text-xs text-slate-400">
                    <span>Mostrando solo OAs creados por ti y no vinculados actualmente.</span>
                    <button onClick={onClose} className="px-5 py-2 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-colors">
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
}
