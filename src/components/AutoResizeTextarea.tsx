'use client';

import { useEffect, useRef, useState } from 'react';
import { Maximize2, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface AutoResizeTextareaProps {
    name: string;
    defaultValue?: string | null;
    placeholder?: string;
    required?: boolean;
    label?: string;
    minRows?: number;
    maxRows?: number;
    showPreview?: boolean;
}

export default function AutoResizeTextarea({
    name,
    defaultValue = '',
    placeholder = '',
    required = false,
    label,
    minRows = 3,
    maxRows = 20,
    showPreview = false
}: AutoResizeTextareaProps) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [isMaximized, setIsMaximized] = useState(false);
    const [value, setValue] = useState(defaultValue || '');
    const [showPreviewTab, setShowPreviewTab] = useState(false);

    // Auto-resize function
    const adjustHeight = () => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        // Reset height to auto to get the correct scrollHeight
        textarea.style.height = 'auto';

        // Calculate new height
        const lineHeight = parseInt(getComputedStyle(textarea).lineHeight);
        const minHeight = lineHeight * minRows;
        const maxHeight = lineHeight * maxRows;
        const newHeight = Math.min(Math.max(textarea.scrollHeight, minHeight), maxHeight);

        textarea.style.height = `${newHeight}px`;
    };

    // Adjust height on mount and when value changes
    useEffect(() => {
        adjustHeight();
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setValue(e.target.value);
        adjustHeight();
    };

    return (
        <>
            <div className="relative">
                {label && (
                    <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-bold text-slate-700">{label}</label>
                        <button
                            type="button"
                            onClick={() => setIsMaximized(true)}
                            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Maximizar editor"
                        >
                            <Maximize2 className="w-4 h-4" />
                        </button>
                    </div>
                )}
                <textarea
                    ref={textareaRef}
                    name={name}
                    value={value}
                    onChange={handleChange}
                    placeholder={placeholder}
                    required={required}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none transition-all"
                    style={{ overflow: 'hidden' }}
                />
            </div>

            {/* Maximized Modal */}
            {isMaximized && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col animate-in zoom-in slide-in-from-bottom-4 duration-300">
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-slate-200">
                            <div>
                                <h3 className="text-xl font-bold text-slate-900">{label || 'Editor'}</h3>
                                {showPreview && (
                                    <div className="flex gap-2 mt-3">
                                        <button
                                            type="button"
                                            onClick={() => setShowPreviewTab(false)}
                                            className={`px-4 py-1.5 text-sm font-bold rounded-lg transition-colors ${!showPreviewTab
                                                    ? 'bg-blue-100 text-blue-700'
                                                    : 'text-slate-500 hover:bg-slate-100'
                                                }`}
                                        >
                                            Editar
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setShowPreviewTab(true)}
                                            className={`px-4 py-1.5 text-sm font-bold rounded-lg transition-colors ${showPreviewTab
                                                    ? 'bg-blue-100 text-blue-700'
                                                    : 'text-slate-500 hover:bg-slate-100'
                                                }`}
                                        >
                                            Vista Previa
                                        </button>
                                    </div>
                                )}
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsMaximized(false)}
                                className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                            >
                                <X className="w-6 h-6 text-slate-400" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-hidden p-6">
                            {showPreview && showPreviewTab ? (
                                <div className="h-full overflow-auto prose prose-slate max-w-none">
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                        {value || '*No hay contenido para previsualizar*'}
                                    </ReactMarkdown>
                                </div>
                            ) : (
                                <textarea
                                    value={value}
                                    onChange={(e) => setValue(e.target.value)}
                                    placeholder={placeholder}
                                    className="w-full h-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none font-mono text-sm"
                                />
                            )}
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-between p-6 border-t border-slate-200 bg-slate-50">
                            <p className="text-sm text-slate-500">
                                {value.length} caracteres
                            </p>
                            <button
                                type="button"
                                onClick={() => setIsMaximized(false)}
                                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors"
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
