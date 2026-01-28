'use client';

import { useState, useEffect } from 'react';
import { Cloud, X, FileText, File, Loader2, Sparkles } from 'lucide-react';
import { getDriveFilesForOAAction } from '@/app/actions/oa-actions';

interface DrivePickerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (file: any) => void;
}

export function DrivePickerModal({ isOpen, onClose, onSelect }: DrivePickerModalProps) {
    const [files, setFiles] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (isOpen) {
            handleFetchFiles();
        }
    }, [isOpen]);

    const handleFetchFiles = async () => {
        setIsLoading(true);
        try {
            const data = await getDriveFilesForOAAction();
            setFiles(data);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="p-6 border-b flex justify-between items-center bg-slate-50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                            <Cloud className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-900">Seleccionar de Google Drive</h2>
                            <p className="text-xs text-slate-500">Archivos en la carpeta maestra de la plataforma</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                        <X className="w-5 h-5 text-slate-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4 text-slate-400">
                            <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
                            <p className="font-medium">Conectando con Google Drive...</p>
                        </div>
                    ) : files.length === 0 ? (
                        <div className="text-center py-20 text-slate-400">
                            <Cloud className="w-16 h-16 mx-auto mb-4 opacity-20" />
                            <p>No se encontraron archivos en la carpeta configurada.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {files.map((file) => (
                                <button
                                    key={file.id}
                                    onClick={() => onSelect(file)}
                                    className="flex items-center gap-4 p-4 rounded-xl border border-slate-100 hover:border-blue-300 hover:bg-blue-50/50 transition-all text-left group"
                                >
                                    <div className="p-2 bg-slate-100 rounded-lg group-hover:bg-blue-100 transition-colors text-slate-500 group-hover:text-blue-600">
                                        {file.mimeType.includes('document') ? <FileText className="w-6 h-6" /> : <File className="w-6 h-6" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-slate-800 truncate mb-0.5">{file.name}</p>
                                        <p className="text-[10px] text-slate-400 uppercase tracking-widest">{file.mimeType.split('.').pop()}</p>
                                    </div>
                                    <Sparkles className="w-4 h-4 text-purple-400 opacity-0 group-hover:opacity-100 transition-all" />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t bg-slate-50 flex justify-end">
                    <button onClick={onClose} className="px-6 py-2 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-200 transition-colors">
                        Cancelar
                    </button>
                </div>
            </div>
        </div>
    );
}
