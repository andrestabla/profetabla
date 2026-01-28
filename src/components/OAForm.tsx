'use client';

import { useState } from 'react';
import { BookOpen, Save, ArrowLeft, Plus, Trash2, FileText, Video, Link as LinkIcon, Box, Cloud, Sparkles, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { DrivePickerModal } from './DrivePickerModal';
import { processDriveFileForOAAction } from '@/app/actions/oa-actions';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function OAForm({ initialData, action }: { initialData?: any, action: (fd: FormData) => Promise<void> }) {
    const [isSaving, setIsSaving] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [items, setItems] = useState<any[]>(initialData?.items || []);

    const [newItemTitle, setNewItemTitle] = useState('');
    const [newItemUrl, setNewItemUrl] = useState('');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [newItemType, setNewItemType] = useState<any>('VIDEO');

    // AI & Drive states
    const [isDriveModalOpen, setIsDriveModalOpen] = useState(false);
    const [isExtractingMetadata, setIsExtractingMetadata] = useState(false);

    // Main form fields for AI auto-fill
    const [title, setTitle] = useState(initialData?.title || '');
    const [subject, setSubject] = useState(initialData?.subject || '');
    const [competency, setCompetency] = useState(initialData?.competency || '');
    const [keywords, setKeywords] = useState(initialData?.keywords?.join(', ') || '');
    const [description, setDescription] = useState(initialData?.description || '');

    const handleAddItem = () => {
        if (!newItemTitle || !newItemUrl) {
            alert("Completa el título y la URL del ítem");
            return;
        }
        setItems([...items, { id: Math.random().toString(), title: newItemTitle, type: newItemType, url: newItemUrl }]);
        setNewItemTitle('');
        setNewItemUrl('');
    };

    const handleRemoveItem = (id: string) => {
        setItems(items.filter((i: { id: string }) => i.id !== id));
    };

    const handleDriveFileSelected = async (file: any) => {
        setIsDriveModalOpen(false);
        setNewItemTitle(file.name);
        setNewItemUrl(file.webViewLink);

        // AI Extraction
        setIsExtractingMetadata(true);
        try {
            const aiData = await processDriveFileForOAAction(file.id, file.mimeType);
            if (aiData) {
                // Pre-fill main form!
                if (!title) setTitle(aiData.title);
                if (!subject) setSubject(aiData.subject);
                if (!competency && aiData.competency) setCompetency(aiData.competency);
                if (!keywords) setKeywords(aiData.keywords.join(', '));
                if (!description) setDescription(aiData.description);

                // Also update the item title to be more specific if AI suggests something better
                setNewItemTitle(aiData.title);
            }
        } catch (e) {
            console.error("AI Extraction failed", e);
        } finally {
            setIsExtractingMetadata(false);
        }
    };

    return (
        <form action={async (fd) => { setIsSaving(true); await action(fd); }} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {initialData && <input type="hidden" name="id" value={initialData.id} />}

            {/* LEFT COLUMN: Metadata */}
            <div className="lg:col-span-1 space-y-6">
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <h2 className="font-bold text-slate-800 mb-4 border-b pb-2">1. Configuración</h2>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Título del OA *</label>
                            <input name="title" value={title} onChange={e => setTitle(e.target.value)} required placeholder="Ej: Fundamentos React" className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Materia / Categoría *</label>
                            <input name="subject" value={subject} onChange={e => setSubject(e.target.value)} required placeholder="Ej: Frontend" className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Competencia (Opcional)</label>
                            <input name="competency" value={competency} onChange={e => setCompetency(e.target.value)} placeholder="Ej: Implementar Hooks" className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Keywords (Separa por comas)</label>
                            <input name="keywords" value={keywords} onChange={e => setKeywords(e.target.value)} placeholder="react, hooks, state" className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Descripción</label>
                            <textarea name="description" value={description} onChange={e => setDescription(e.target.value)} rows={3} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"></textarea>
                        </div>
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={isSaving}
                    className="w-full bg-slate-900 hover:bg-black text-white font-bold py-3 px-8 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                    {isSaving ? 'Guardando...' : <><Save className="w-5 h-5" /> {initialData ? 'Actualizar' : 'Crear'} Objeto</>}
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
                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mb-6">
                        <h3 className="text-sm font-bold text-slate-600 mb-3 flex items-center gap-2">
                            <Plus className="w-4 h-4" /> Agregar Nuevo Recurso
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
                            <div className="md:col-span-2">
                                <input
                                    value={newItemTitle} onChange={(e) => setNewItemTitle(e.target.value)}
                                    placeholder="Título del recurso (ej: Video Introductorio)"
                                    className="w-full px-3 py-2 border rounded-lg text-sm"
                                />
                            </div>
                            <div>
                                <select
                                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                    value={newItemType} onChange={(e) => setNewItemType(e.target.value as any)}
                                    className="w-full px-3 py-2 border rounded-lg text-sm"
                                >
                                    <option value="VIDEO">Video</option>
                                    <option value="PDF">Documento PDF</option>
                                    <option value="DRIVE">Google Drive</option>
                                    <option value="EMBED">Embed/Iframe</option>
                                    <option value="LINK">Enlace Externo</option>
                                </select>
                            </div>
                            <div className="md:col-span-4 flex gap-2">
                                <input
                                    value={newItemUrl} onChange={(e) => setNewItemUrl(e.target.value)}
                                    placeholder={newItemType === 'DRIVE' ? "Selecciona un archivo de Drive..." : "URL del recurso (Youtube, PDF link, Drive link...)"}
                                    readOnly={newItemType === 'DRIVE'}
                                    className="flex-1 px-3 py-2 border rounded-lg text-sm bg-white"
                                />
                                {newItemType === 'DRIVE' && (
                                    <button
                                        type="button"
                                        onClick={() => setIsDriveModalOpen(true)}
                                        className="bg-blue-100 text-blue-700 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-blue-200 transition-colors"
                                    >
                                        <Cloud className="w-4 h-4" /> Seleccionar
                                    </button>
                                )}
                            </div>
                            {isExtractingMetadata && (
                                <div className="md:col-span-4 bg-purple-50 p-3 rounded-lg border border-purple-100 flex items-center gap-3 animate-pulse">
                                    <Loader2 className="w-4 h-4 text-purple-600 animate-spin" />
                                    <span className="text-xs font-bold text-purple-700">Asistente IA está analizando el documento y extrayendo metadatos...</span>
                                </div>
                            )}
                        </div>
                        <div className="flex justify-end">
                            <button type="button" onClick={handleAddItem} className="bg-blue-600 text-white text-sm font-bold py-2 px-4 rounded-lg hover:bg-blue-700">
                                Agregar a la Lista
                            </button>
                        </div>
                    </div>

                    {/* ITEM LIST */}
                    <div className="flex-1 space-y-2">
                        {items.length === 0 ? (
                            <div className="text-center py-10 text-slate-400 border-2 border-dashed border-slate-200 rounded-lg">
                                <Box className="w-10 h-10 mx-auto mb-2 opacity-50" />
                                <p>No hay recursos agregados aún.</p>
                            </div>
                        ) : (
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            items.map((item: any, idx: number) => (
                                <div key={item.id || idx} className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-lg hover:shadow-sm transition-shadow group">
                                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500">
                                        {idx + 1}
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-semibold text-slate-800 text-sm">{item.title}</p>
                                        <div className="flex items-center gap-2 text-xs text-slate-500">
                                            {item.type === 'VIDEO' && <Video className="w-3 h-3" />}
                                            {item.type === 'PDF' && <FileText className="w-3 h-3" />}
                                            {item.type === 'LINK' && <LinkIcon className="w-3 h-3" />}
                                            {item.type === 'DRIVE' && <Cloud className="w-3 h-3 text-blue-500" />}
                                            <span className="truncate max-w-[200px]">{item.url}</span>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveItem(item.id)}
                                        className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Hidden Input for Items JSON */}
                    <input type="hidden" name="itemsJson" value={JSON.stringify(items)} />
                </div>
            </div>

            <DrivePickerModal
                isOpen={isDriveModalOpen}
                onClose={() => setIsDriveModalOpen(false)}
                onSelect={handleDriveFileSelected}
            />
        </form>
    );
}
