'use client';

import { useState } from 'react';
import { X, MessageSquare, Flag, Save } from 'lucide-react';

interface CreateTaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (data: { title: string, description: string, priority: 'LOW' | 'MEDIUM' | 'HIGH' }) => void;
    initialStatus: string;
}

export function CreateTaskModal({ isOpen, onClose, onConfirm, initialStatus }: CreateTaskModalProps) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [priority, setPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('MEDIUM');

    if (!isOpen) return null;

    const handleConfirm = () => {
        if (!title.trim()) return;
        onConfirm({ title, description, priority });
        setTitle('');
        setDescription('');
        setPriority('MEDIUM');
        onClose();
    };

    const statusLabel = initialStatus === 'TODO' ? 'Por Hacer' : initialStatus === 'IN_PROGRESS' ? 'En Progreso' : 'Terminado';

    return (
        <div
            onClick={onClose}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 transition-all duration-300"
        >
            <div
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
            >
                {/* Header */}
                <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 bg-white">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">Nueva Tarea</h2>
                        <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mt-1">Columna: {statusLabel}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6">
                    {/* Title */}
                    <div>
                        <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Título de la Tarea</label>
                        <input
                            autoFocus
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 font-medium focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                            placeholder="Ej: Investigar referentes..."
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="text-xs font-bold text-slate-400 uppercase mb-2 block flex items-center gap-2">
                            <MessageSquare className="w-3 h-3" /> Descripción (Opcional)
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-600 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none h-32"
                            placeholder="Explica brevemente de qué trata esta tarea..."
                        />
                    </div>

                    {/* Priority */}
                    <div>
                        <label className="text-xs font-bold text-slate-400 uppercase mb-2 block flex items-center gap-2">
                            <Flag className="w-3 h-3" /> Prioridad
                        </label>
                        <div className="grid grid-cols-3 gap-3">
                            {(['LOW', 'MEDIUM', 'HIGH'] as const).map((p) => (
                                <button
                                    key={p}
                                    onClick={() => setPriority(p)}
                                    className={`py-2 px-3 rounded-lg text-xs font-bold transition-all border ${priority === p
                                            ? p === 'HIGH' ? 'bg-red-50 border-red-200 text-red-700' :
                                                p === 'MEDIUM' ? 'bg-amber-50 border-amber-200 text-amber-700' :
                                                    'bg-green-50 border-green-200 text-green-700'
                                            : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'
                                        }`}
                                >
                                    {p === 'LOW' ? 'Baja' : p === 'MEDIUM' ? 'Media' : 'Alta'}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-50 bg-slate-50/50 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 px-6 py-3 rounded-xl text-slate-500 font-bold hover:bg-slate-100 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={!title.trim()}
                        className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        <Save className="w-4 h-4" /> Crear Tarea
                    </button>
                </div>
            </div>
        </div>
    );
}
