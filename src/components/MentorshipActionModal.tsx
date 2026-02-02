'use client';

import { useState, useEffect } from 'react';
import { X, Calendar, MessageSquare, Trash2, CheckCircle, XCircle, Loader2, AlertTriangle, BookOpen } from 'lucide-react';

export type MentorshipActionType = 'BOOK' | 'DELETE' | 'EDIT' | 'SUCCESS' | 'ERROR';

interface MentorshipActionModalProps {
    isOpen: boolean;
    onClose: () => void;
    type: MentorshipActionType;
    title: string;
    message?: string;
    slotInfo?: {
        time: string;
        teacherName: string;
        date: string;
    };
    initialNote?: string;
    onConfirm?: (note?: string) => Promise<void>;
}

export function MentorshipActionModal({
    isOpen,
    onClose,
    type,
    title,
    message,
    slotInfo,
    initialNote = '',
    onConfirm
}: MentorshipActionModalProps) {
    const [note, setNote] = useState(initialNote);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) {
            window.addEventListener('keydown', handleEsc);
        }
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isOpen, onClose]);

    useEffect(() => {
        if (isOpen) {
            setNote(initialNote);
            setLoading(false);
        }
    }, [isOpen, initialNote]);

    if (!isOpen) return null;

    const handleConfirm = async () => {
        if (!onConfirm) {
            onClose();
            return;
        }
        setLoading(true);
        try {
            await onConfirm(note);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const config = {
        BOOK: {
            icon: Calendar,
            iconBg: 'bg-blue-100',
            iconColor: 'text-blue-600',
            confirmText: 'Confirmar Reserva',
            confirmColor: 'bg-blue-600 hover:bg-blue-700',
        },
        DELETE: {
            icon: Trash2,
            iconBg: 'bg-red-100',
            iconColor: 'text-red-600',
            confirmText: 'Eliminar Horario',
            confirmColor: 'bg-red-600 hover:bg-red-700',
        },
        EDIT: {
            icon: BookOpen,
            iconBg: 'bg-indigo-100',
            iconColor: 'text-indigo-600',
            confirmText: 'Guardar Cambios',
            confirmColor: 'bg-indigo-600 hover:bg-indigo-700',
        },
        SUCCESS: {
            icon: CheckCircle,
            iconBg: 'bg-emerald-100',
            iconColor: 'text-emerald-600',
            confirmText: 'Entendido',
            confirmColor: 'bg-emerald-600 hover:bg-emerald-700',
        },
        ERROR: {
            icon: XCircle,
            iconBg: 'bg-red-100',
            iconColor: 'text-red-600',
            confirmText: 'Cerrar',
            confirmColor: 'bg-slate-800 hover:bg-slate-900',
        }
    }[type];

    const Icon = config.icon;

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 relative"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header-ish area with icon */}
                <div className="pt-8 pb-4 px-8 text-center">
                    <div className={`w-20 h-20 ${config.iconBg} ${config.iconColor} rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner`}>
                        <Icon className="w-10 h-10" />
                    </div>

                    <h3 className="text-2xl font-black text-slate-800 mb-2 leading-tight">
                        {title}
                    </h3>

                    {message && (
                        <p className="text-slate-500 text-sm font-medium leading-relaxed">
                            {message}
                        </p>
                    )}
                </div>

                {/* Slot Detail Card (Optional) */}
                {slotInfo && (type === 'BOOK' || type === 'DELETE' || type === 'EDIT') && (
                    <div className="mx-8 mb-6 p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-4">
                        <div className="p-3 bg-white rounded-xl shadow-sm">
                            <Calendar className="w-5 h-5 text-slate-400" />
                        </div>
                        <div className="text-left flex-1">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">
                                {slotInfo.date}
                            </p>
                            <p className="text-sm font-bold text-slate-700 leading-none">
                                {slotInfo.time} • {slotInfo.teacherName}
                            </p>
                        </div>
                    </div>
                )}

                {/* Body (Inputs) */}
                <div className="px-8 pb-8 space-y-6">
                    {(type === 'BOOK' || type === 'EDIT') && (
                        <div className="space-y-3">
                            <label className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest pl-1">
                                <MessageSquare className="w-3" />
                                Motivo / Temas a tratar
                            </label>
                            <textarea
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                placeholder="Ej: Revisión de avance del marco teórico..."
                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-medium focus:ring-4 focus:ring-blue-500/10 outline-none h-32 resize-none transition-all focus:bg-white"
                                autoFocus
                            />
                        </div>
                    )}

                    {type === 'DELETE' && (
                        <div className="p-4 bg-red-50 rounded-2xl border border-red-100 flex gap-3">
                            <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                            <p className="text-xs text-red-700 font-medium leading-relaxed">
                                ⚠️ Se cancelarán todas las reservas asociadas y el evento de **Google Calendar** será eliminado permanentemente de ambos calendarios.
                            </p>
                        </div>
                    )}

                    {/* Footer Actions */}
                    <div className="flex gap-3">
                        {(type === 'BOOK' || type === 'DELETE' || type === 'EDIT') && (
                            <button
                                onClick={onClose}
                                disabled={loading}
                                className="flex-1 py-4 text-slate-500 font-bold text-sm hover:bg-slate-100 rounded-2xl transition-colors disabled:opacity-50"
                            >
                                Cancelar
                            </button>
                        )}
                        <button
                            onClick={handleConfirm}
                            disabled={loading || ((type === 'BOOK' || type === 'EDIT') && !note.trim())}
                            className={`flex-[2] py-4 ${config.confirmColor} text-white font-black text-sm rounded-2xl shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:grayscale`}
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                            {config.confirmText}
                        </button>
                    </div>
                </div>

                {/* Close Button (Top corner) */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
}
