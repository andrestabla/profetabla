'use client';

import { useState } from 'react';
import { createLearningObjectAction } from '../actions';
import { extractResourceMetadataAction } from '@/app/(dashboard)/dashboard/professor/projects/[id]/actions';
import { BookOpen, Save, ArrowLeft, Plus, Trash2, Box, Sparkles, Loader2 } from 'lucide-react';
import Link from 'next/link';

type NewItem = {
    id: string; // Temp ID
    title: string;
    type: 'PDF' | 'VIDEO' | 'EMBED' | 'LINK' | 'DRIVE' | 'DOC';
    url: string;
    presentation?: string;
    utility?: string;
};

export default function NewLearningObjectPage() {
    const [isSaving, setIsSaving] = useState(false);
    const [items, setItems] = useState<NewItem[]>([]);

    const [newItemTitle, setNewItemTitle] = useState('');
    const [newItemUrl, setNewItemUrl] = useState('');
    const [newItemType, setNewItemType] = useState<NewItem['type']>('VIDEO');
    const [newItemPresentation, setNewItemPresentation] = useState('');
    const [newItemUtility, setNewItemUtility] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

    const handleAddItem = () => {
        if (!newItemTitle || !newItemUrl) {
            alert("Completa el título y la URL del ítem");
            return;
        }
        setItems([...items, {
            id: Math.random().toString(),
            title: newItemTitle,
            type: newItemType,
            url: newItemUrl,
            presentation: newItemPresentation,
            utility: newItemUtility
        }]);

        // Reset fields
        setNewItemTitle('');
        setNewItemUrl('');
        setNewItemPresentation('');
        setNewItemUtility('');
    };

    const handleRemoveItem = (id: string) => {
        setItems(items.filter(i => i.id !== id));
    };

    const handleAIAutoFill = async () => {
        if (!newItemUrl) {
            alert('Ingresa una URL primero');
            return;
        }

        setIsGenerating(true);
        try {
            const result = await extractResourceMetadataAction(newItemUrl, newItemType);
            if (result.success && result.data) {
                if (result.data.title) setNewItemTitle(result.data.title);
                if (result.data.presentation) setNewItemPresentation(result.data.presentation);
                if (result.data.utility) setNewItemUtility(result.data.utility);
            } else {
                alert('No se pudieron extraer datos. Intenta llenarlos manualmente.');
            }
        } catch (e) {
            console.error(e);
            alert('Error al conectar con el asistente IA.');
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto p-6">
            <Link href="/dashboard/learning" className="flex items-center gap-2 text-slate-500 hover:text-slate-800 mb-6 transition-colors">
                <ArrowLeft className="w-4 h-4" /> Volver a la Biblioteca
            </Link>

            <header className="mb-8">
                <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
                    <BookOpen className="w-8 h-8 text-blue-600" /> Nuevo Objeto de Aprendizaje
                </h1>
                <p className="text-slate-500 mt-2">
                    Diseña una cápsula de conocimiento con múltiples recursos multimedia.
                </p>
            </header>

            <form action={async (fd) => { setIsSaving(true); await createLearningObjectAction(fd); }} className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* LEFT COLUMN: Metadata */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                        <h2 className="font-bold text-slate-800 mb-4 border-b pb-2">1. Configuración</h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Título del OA *</label>
                                <input name="title" required placeholder="Ej: Fundamentos React" className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Materia / Categoría *</label>
                                <input name="subject" required placeholder="Ej: Frontend" className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Competencia (Opcional)</label>
                                <input name="competency" placeholder="Ej: Implementar Hooks" className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Keywords (Separa por comas)</label>
                                <input name="keywords" placeholder="react, hooks, state" className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Descripción</label>
                                <textarea name="description" rows={3} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"></textarea>
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isSaving}
                        className="w-full bg-slate-900 hover:bg-black text-white font-bold py-3 px-8 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                    >
                        {isSaving ? 'Guardando...' : <><Save className="w-5 h-5" /> Crear Objeto</>}
                    </button>
                </div>

                {/* RIGHT COLUMN: Content Builder */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-full flex flex-col">
                        <h2 className="font-bold text-slate-800 mb-4 border-b pb-2 flex justify-between items-center">
                            <span>2. Contenido (Items)</span>
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">{items.length} Recursos</span>
                        </h2>

                        {/* ADD ITEM FORM */}
                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mb-6 relative">
                            <h3 className="text-sm font-bold text-slate-600 mb-3 flex items-center gap-2">
                                <Plus className="w-4 h-4" /> Agregar Nuevo Recurso
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
                                {/* Type Selector */}
                                <div className="md:col-span-1">
                                    <label className="text-xs font-bold text-slate-500 mb-1 block">Tipo</label>
                                    <select
                                        value={newItemType} onChange={(e) => setNewItemType(e.target.value as NewItem['type'])}
                                        className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
                                    >
                                        <option value="VIDEO">Video</option>
                                        <option value="PDF">Documento PDF</option>
                                        <option value="DRIVE">Google Drive</option>
                                        <option value="EMBED">Embed/Iframe</option>
                                        <option value="LINK">Enlace Externo</option>
                                    </select>
                                </div>

                                {/* URL Input or Embed Code */}
                                <div className="md:col-span-3">
                                    <label className="text-xs font-bold text-slate-500 mb-1 block">
                                        {newItemType === 'EMBED' ? 'Código Embed/Iframe' : 'URL del Recurso'}
                                    </label>
                                    <div className="flex gap-2">
                                        {newItemType === 'EMBED' ? (
                                            <textarea
                                                value={newItemUrl}
                                                onChange={(e) => setNewItemUrl(e.target.value)}
                                                placeholder="<iframe src='...'></iframe>"
                                                rows={3}
                                                className="flex-1 px-3 py-2 border rounded-lg text-sm resize-none font-mono text-xs"
                                            />
                                        ) : (
                                            <input
                                                value={newItemUrl}
                                                onChange={(e) => setNewItemUrl(e.target.value)}
                                                placeholder="https://..."
                                                className="flex-1 px-3 py-2 border rounded-lg text-sm"
                                            />
                                        )}

                                        <button
                                            type="button"
                                            onClick={handleAIAutoFill}
                                            disabled={isGenerating || !newItemUrl}
                                            className="bg-purple-100 text-purple-700 px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1 hover:bg-purple-200 transition-colors disabled:opacity-50 h-fit"
                                            title="Autocompletar datos con IA"
                                        >
                                            {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                                            <span className="hidden sm:inline">IA</span>
                                        </button>
                                    </div>
                                </div>

                                {/* Title Input */}
                                <div className="md:col-span-4">
                                    <label className="text-xs font-bold text-slate-500 mb-1 block">Título</label>
                                    <input
                                        value={newItemTitle} onChange={(e) => setNewItemTitle(e.target.value)}
                                        placeholder="Título del recurso..."
                                        className="w-full px-3 py-2 border rounded-lg text-sm"
                                    />
                                </div>

                                {/* Presentation */}
                                <div className="md:col-span-4">
                                    <label className="text-xs font-bold text-slate-500 mb-1 block">Presentación (Contexto)</label>
                                    <textarea
                                        value={newItemPresentation} onChange={(e) => setNewItemPresentation(e.target.value)}
                                        placeholder="¿Qué es este recurso?"
                                        rows={2}
                                        className="w-full px-3 py-2 border rounded-lg text-sm resize-none focus:ring-2 focus:ring-blue-100 outline-none"
                                    />
                                </div>

                                {/* Utility */}
                                <div className="md:col-span-4">
                                    <label className="text-xs font-bold text-slate-500 mb-1 block">Utilidad Pedagógica</label>
                                    <textarea
                                        value={newItemUtility} onChange={(e) => setNewItemUtility(e.target.value)}
                                        placeholder="¿Para qué le sirve al estudiante?"
                                        rows={2}
                                        className="w-full px-3 py-2 border rounded-lg text-sm resize-none focus:ring-2 focus:ring-amber-100 outline-none"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end pt-2 border-t border-slate-100 mt-2">
                                <button type="button" onClick={handleAddItem} className="bg-blue-600 text-white text-sm font-bold py-2 px-6 rounded-lg hover:bg-blue-700 shadow-sm transition-all hover:shadow-md">
                                    Agregar Recurso
                                </button>
                            </div>
                        </div>

                        {/* ITEM LIST */}
                        <div className="flex-1 space-y-3 overflow-y-auto max-h-[500px] pr-1">
                            {items.length === 0 ? (
                                <div className="text-center py-10 text-slate-400 border-2 border-dashed border-slate-200 rounded-lg">
                                    <Box className="w-10 h-10 mx-auto mb-2 opacity-50" />
                                    <p>No hay recursos agregados aún.</p>
                                </div>
                            ) : (
                                items.map((item, idx) => (
                                    <div key={item.id} className="p-4 bg-white border border-slate-200 rounded-lg hover:shadow-md transition-all group">
                                        <div className="flex items-start gap-3">
                                            <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500 shrink-0 mt-0.5">
                                                {idx + 1}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between">
                                                    <h4 className="font-bold text-slate-800 text-sm truncate pr-2">{item.title}</h4>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[10px] uppercase font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">{item.type}</span>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRemoveItem(item.id)}
                                                            className="text-slate-300 hover:text-red-500 transition-colors"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>

                                                <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline truncate block mb-2">
                                                    {item.url}
                                                </a>

                                                {(item.presentation || item.utility) && (
                                                    <div className="mt-2 space-y-2">
                                                        {item.presentation && (
                                                            <div className="text-xs text-slate-600 bg-slate-50 p-2 rounded border border-slate-100">
                                                                <span className="font-bold text-slate-700 block mb-0.5">Presentación:</span>
                                                                {item.presentation}
                                                            </div>
                                                        )}
                                                        {item.utility && (
                                                            <div className="text-xs text-slate-600 bg-amber-50 p-2 rounded border border-amber-100">
                                                                <span className="font-bold text-slate-700 block mb-0.5 flex items-center gap-1"><Sparkles className="w-3 h-3 text-amber-500" /> Utilidad:</span>
                                                                {item.utility}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Hidden Input for Items JSON */}
                        <input type="hidden" name="itemsJson" value={JSON.stringify(items)} />
                    </div>
                </div>
            </form>
        </div>
    );
}

