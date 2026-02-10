'use client';

import React, { useState } from 'react';
import { X, MessageSquare } from 'lucide-react';

interface PromptModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    defaultValue?: string;
    onConfirm: (value: string) => void;
    onCancel: () => void;
    placeholder?: string;
}

export default function PromptModal({
    isOpen,
    title,
    message,
    defaultValue = '',
    onConfirm,
    onCancel,
    placeholder = 'Escribe aquí...'
}: PromptModalProps) {
    const [value, setValue] = useState(defaultValue);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[500] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <MessageSquare className="w-5 h-5 text-blue-600" />
                        {title}
                    </h3>
                    <button onClick={onCancel} className="p-2 hover:bg-white rounded-full transition-colors text-slate-400 hover:text-slate-600">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-8 space-y-4">
                    <p className="text-slate-600 text-sm font-medium">{message}</p>
                    <textarea
                        autoFocus
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        placeholder={placeholder}
                        rows={4}
                        className="w-full p-4 border-2 border-slate-100 rounded-2xl focus:border-blue-500 outline-none transition-all text-sm font-medium bg-slate-50"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && e.ctrlKey) {
                                onConfirm(value);
                            }
                        }}
                    />
                    <p className="text-[10px] text-slate-400 text-center uppercase font-bold tracking-widest">
                        Ctrl + Enter para confirmar
                    </p>
                </div>

                <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3">
                    <button
                        onClick={onCancel}
                        className="flex-1 py-3 text-slate-500 font-bold hover:bg-white border border-transparent hover:border-slate-200 rounded-xl transition-all"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={() => onConfirm(value)}
                        className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 hover:-translate-y-0.5 transition-all"
                    >
                        Confirmar
                    </button>
                </div>
            </div>
        </div>
    );
}
