'use client';

import { AlertTriangle, HelpCircle, X } from 'lucide-react';
import { useEffect } from 'react';

interface ConfirmationModalProps {
    isOpen: boolean;
    onConfirm: () => void;
    onCancel: () => void;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    type?: 'warning' | 'danger' | 'info';
}

export default function ConfirmationModal({
    isOpen,
    onConfirm,
    onCancel,
    title,
    message,
    confirmLabel = 'Confirmar',
    cancelLabel = 'Cancelar',
    type = 'warning'
}: ConfirmationModalProps) {

    // Close on escape key
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onCancel();
        };
        if (isOpen) window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isOpen, onCancel]);

    if (!isOpen) return null;

    const config = {
        warning: {
            icon: HelpCircle,
            color: 'text-amber-500',
            bg: 'bg-amber-50',
            button: 'bg-black hover:bg-slate-800'
        },
        danger: {
            icon: AlertTriangle,
            color: 'text-red-500',
            bg: 'bg-red-50',
            button: 'bg-red-600 hover:bg-red-700'
        },
        info: {
            icon: HelpCircle,
            color: 'text-blue-500',
            bg: 'bg-blue-50',
            button: 'bg-blue-600 hover:bg-blue-700'
        }
    }[type];

    const Icon = config.icon;

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-6 text-center">
                    <div className={`w-16 h-16 ${config.bg} ${config.color} rounded-full flex items-center justify-center mx-auto mb-4 animate-in bounce-in duration-500`}>
                        <Icon className="w-8 h-8" />
                    </div>

                    <h3 className="text-xl font-bold text-slate-800 mb-2">{title}</h3>
                    <p className="text-slate-500 text-sm mb-8 leading-relaxed">
                        {message}
                    </p>

                    <div className="flex flex-col gap-2">
                        <button
                            onClick={onConfirm}
                            className={`w-full py-3.5 ${config.button} text-white font-bold rounded-xl shadow-lg transition-all active:scale-95 hover:shadow-xl`}
                        >
                            {confirmLabel}
                        </button>
                        <button
                            onClick={onCancel}
                            className="w-full py-3 text-slate-500 font-bold rounded-xl hover:bg-slate-50 transition-colors"
                        >
                            {cancelLabel}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
