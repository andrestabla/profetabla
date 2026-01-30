'use client';

import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react';
import { useEffect } from 'react';

interface StatusModalProps {
    isOpen: boolean;
    onClose: () => void;
    type: 'success' | 'error' | 'warning';
    title: string;
    message: string;
}

export default function StatusModal({ isOpen, onClose, type, title, message }: StatusModalProps) {

    // Close on escape key
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const config = {
        success: {
            icon: CheckCircle,
            color: 'text-emerald-500',
            bg: 'bg-emerald-50',
            border: 'border-emerald-100',
            button: 'bg-emerald-600 hover:bg-emerald-700'
        },
        error: {
            icon: XCircle,
            color: 'text-red-500',
            bg: 'bg-red-50',
            border: 'border-red-100',
            button: 'bg-red-600 hover:bg-red-700'
        },
        warning: {
            icon: AlertCircle,
            color: 'text-amber-500',
            bg: 'bg-amber-50',
            border: 'border-amber-100',
            button: 'bg-amber-600 hover:bg-amber-700'
        }
    }[type];

    const Icon = config.icon;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-6 text-center">
                    <div className={`w-16 h-16 ${config.bg} ${config.color} rounded-full flex items-center justify-center mx-auto mb-4 animate-in bounce-in duration-500`}>
                        <Icon className="w-8 h-8" />
                    </div>

                    <h3 className="text-xl font-bold text-slate-800 mb-2">{title}</h3>
                    <p className="text-slate-500 text-sm mb-6 leading-relaxed">
                        {message}
                    </p>

                    <button
                        onClick={onClose}
                        className={`w-full py-3 ${config.button} text-white font-bold rounded-xl shadow-lg transition-transform active:scale-95`}
                    >
                        Entendido
                    </button>
                </div>
            </div>
        </div>
    );
}
