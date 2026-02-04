
import React, { useState } from 'react';
import { X, Search, FileText, Image as ImageIcon, Film, File, Cloud, Folder } from 'lucide-react';

type DriveFile = {
    id: string;
    name: string;
    mimeType: string;
    webViewLink?: string;
    iconLink?: string;
    thumbnailLink?: string;
};

interface DriveSelectorModalProps {
    isOpen: boolean;
    onClose: () => void;
    files: DriveFile[];
    onSelect: (file: DriveFile) => void;
    isLoading?: boolean;
}

export function DriveSelectorModal({ isOpen, onClose, files, onSelect, isLoading }: DriveSelectorModalProps) {
    const [searchTerm, setSearchTerm] = useState('');

    if (!isOpen) return null;

    const filteredFiles = files.filter(f => f.name.toLowerCase().includes(searchTerm.toLowerCase()));

    const getIcon = (mimeType: string) => {
        if (mimeType.includes('folder')) return <Folder className="w-8 h-8 text-slate-400" />;
        if (mimeType.includes('image')) return <ImageIcon className="w-8 h-8 text-purple-500" />;
        if (mimeType.includes('video')) return <Film className="w-8 h-8 text-rose-500" />;
        if (mimeType.includes('pdf')) return <FileText className="w-8 h-8 text-orange-500" />;
        return <File className="w-8 h-8 text-blue-400" />;
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
                    <div>
                        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                            <Cloud className="w-5 h-5 text-blue-600" /> Explorador de Google Drive
                        </h3>
                        <p className="text-xs text-slate-500">Selecciona un archivo para vincular al proyecto</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-400 hover:text-slate-600">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Search */}
                <div className="p-4 bg-slate-50 border-b border-slate-100">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Buscar en esta carpeta..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all"
                            autoFocus
                        />
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center h-48 text-slate-400">
                            <div className="w-8 h-8 border-2 border-current border-t-transparent rounded-full animate-spin mb-2" />
                            <p className="text-xs font-medium">Cargando archivos...</p>
                        </div>
                    ) : filteredFiles.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                <Folder className="w-8 h-8 text-slate-300" />
                            </div>
                            <p className="text-sm font-medium text-slate-600">No se encontraron archivos.</p>
                            <p className="text-xs text-slate-400">Intenta buscar con otro término o verifica la carpeta.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {filteredFiles.map(file => (
                                <div
                                    key={file.id}
                                    onClick={() => onSelect(file)}
                                    className="group bg-white p-4 rounded-xl border border-slate-200 hover:border-blue-300 hover:shadow-md cursor-pointer transition-all flex flex-col items-center text-center relative overflow-hidden"
                                >
                                    <div className="w-16 h-16 bg-slate-50 rounded-lg flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                                        {file.thumbnailLink ? (
                                            <img src={file.thumbnailLink} alt="" className="w-full h-full object-cover rounded-lg opacity-80 group-hover:opacity-100" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                                        ) : getIcon(file.mimeType)}
                                    </div>
                                    <h4 className="text-sm font-medium text-slate-700 group-hover:text-blue-700 line-clamp-2 w-full leading-snug mb-1">{file.name}</h4>
                                    <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full mt-auto">
                                        {(file.mimeType.split('/').pop() || 'file').toUpperCase()}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
