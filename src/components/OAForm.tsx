'use client';

import { useState } from 'react';
import { Save, Plus, Trash2, FileText, Video, Link as LinkIcon, Box, Cloud, Loader2, Sparkles, Edit } from 'lucide-react';
import { DrivePickerModal } from './DrivePickerModal';
import { processDriveFileForOAAction } from '@/app/actions/oa-actions';
import { extractResourceMetadataAction } from '@/app/(dashboard)/dashboard/professor/projects/[id]/actions';

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
    const [isGlobalGenerating, setIsGlobalGenerating] = useState(false);

    // Edit state
    const [editingItemId, setEditingItemId] = useState<string | null>(null);

    // Main form fields for AI auto-fill
    const [title, setTitle] = useState(initialData?.title || '');
    const [subject, setSubject] = useState(initialData?.subject || '');
    const [competency, setCompetency] = useState(initialData?.competency || '');
    const [keywords, setKeywords] = useState(initialData?.keywords?.join(', ') || '');
    const [presentation, setPresentation] = useState(initialData?.presentation || '');
    const [utility, setUtility] = useState(initialData?.utility || '');

    // New item metadata states
    const [newItemSubject, setNewItemSubject] = useState('');
    const [newItemCompetency, setNewItemCompetency] = useState('');
    const [newItemKeywords, setNewItemKeywords] = useState('');
    const [newItemPresentation, setNewItemPresentation] = useState('');
    const [newItemUtility, setNewItemUtility] = useState('');

    const handleAddItem = () => {
        if (!newItemTitle || !newItemUrl) {
            alert("Completa el título y la URL del ítem");
            return;
        }

        const itemData = {
            id: editingItemId || Math.random().toString(),
            title: newItemTitle,
            type: newItemType,
            url: newItemUrl,
            subject: newItemSubject,
            keywords: newItemKeywords ? newItemKeywords.split(',').map(s => s.trim()) : [],
            presentation: newItemPresentation,
            utility: newItemUtility
        };

        if (editingItemId) {
            setItems(items.map(i => i.id === editingItemId ? itemData : i));
            setEditingItemId(null);
        } else {
            setItems([...items, itemData]);
        }

        setNewItemTitle('');
        setNewItemUrl('');
        setNewItemSubject('');
        setNewItemCompetency('');
        setNewItemKeywords('');
        setNewItemPresentation('');
        setNewItemUtility('');
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleEditItem = (item: any) => {
        setEditingItemId(item.id);
        setNewItemTitle(item.title);
        setNewItemType(item.type);
        setNewItemUrl(item.url);
        setNewItemSubject(item.subject || '');
        setNewItemCompetency(item.competency || '');
        setNewItemKeywords(Array.isArray(item.keywords) ? item.keywords.join(', ') : (item.keywords || ''));
        setNewItemPresentation(item.presentation || '');
        setNewItemUtility(item.utility || '');
    };

    const cancelEdit = () => {
        setEditingItemId(null);
        setNewItemTitle('');
        setNewItemUrl('');
        setNewItemSubject('');
        setNewItemCompetency('');
        setNewItemKeywords('');
        setNewItemPresentation('');
        setNewItemUtility('');
    };

    const handleRemoveItem = (id: string) => {
        setItems(items.filter((i: { id: string }) => i.id !== id));
    };

    const handleAIAutoFillMain = async () => {
        if (!title && !subject) {
            alert("Escribe al menos el título o materia para orientar a la IA");
            return;
        }
        setIsGlobalGenerating(true);
        try {
            const { improveTextWithAIAction } = await import('@/app/actions/oa-actions');
            const data = await improveTextWithAIAction(title, `Materia: ${subject}\nKeywords: ${keywords}`);
            if (data) {
                if (data.title) setTitle(data.title);
                if (data.presentation) setPresentation(data.presentation);
                if (data.utility) setUtility(data.utility);
                if (data.subject) setSubject(data.subject);
                if (data.keywords) setKeywords(data.keywords.join(', '));
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsGlobalGenerating(false);
        }
    };

    const handleAIAutoFillItem = async () => {
        if (!newItemUrl) {
            alert("Ingresa una URL para analizar");
            return;
        }
        setIsExtractingMetadata(true);
        try {
            const res = await extractResourceMetadataAction(newItemUrl, newItemType);
            if (res.success && res.data) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const data = res.data as any;
                setNewItemTitle(data.title || newItemTitle);
                setNewItemSubject(data.subject || newItemSubject);
                setNewItemCompetency(data.competency || newItemCompetency);
                setNewItemKeywords(data.keywords?.join(', ') || newItemKeywords);
                setNewItemPresentation(data.presentation || newItemPresentation);
                setNewItemUtility(data.utility || newItemUtility);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsExtractingMetadata(false);
        }
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleDriveFileSelected = async (file: any) => {
        setIsDriveModalOpen(false);
        setNewItemTitle(file.name);
        setNewItemUrl(file.webViewLink);

        // AI Extraction
        setIsExtractingMetadata(true);
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const aiData = await processDriveFileForOAAction(file.id, file.mimeType) as any;
            if (aiData) {
                // Pre-fill main form if empty!
                if (!title) setTitle(aiData.title);
                if (!subject) setSubject(aiData.subject);
                if (!competency && aiData.competency) setCompetency(aiData.competency);
                if (!keywords) setKeywords(aiData.keywords.join(', '));
                if (!presentation) setPresentation(aiData.presentation);
                if (!utility) setUtility(aiData.utility);

                // Also update the item title to be more specific if AI suggests something better
                setNewItemTitle(aiData.title);
                setNewItemSubject(aiData.subject);
                setNewItemCompetency(aiData.competency || '');
                setNewItemKeywords(aiData.keywords.join(', '));
                setNewItemPresentation(aiData.presentation);
                setNewItemUtility(aiData.utility);
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
                    <div className="flex justify-between items-center mb-4 border-b pb-2">
                        <h2 className="font-bold text-slate-800">1. Configuración</h2>
                        <button
                            type="button"
                            onClick={handleAIAutoFillMain}
                            disabled={isGlobalGenerating}
                            className="text-xs font-bold text-purple-600 hover:text-purple-700 flex items-center gap-1 bg-purple-50 px-2 py-1 rounded-md transition-colors disabled:opacity-50"
                        >
                            {isGlobalGenerating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                            IA Auto-completar
                        </button>
                    </div>

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
                            <label className="block text-sm font-bold text-slate-700 mb-1">Presentación / Descripción</label>
                            <textarea name="presentation" value={presentation} onChange={e => setPresentation(e.target.value)} rows={3} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none" placeholder="¿Qué es este OA?"></textarea>
                            <input type="hidden" name="description" value="" />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Utilidad Pedagógica</label>
                            <textarea name="utility" value={utility} onChange={e => setUtility(e.target.value)} rows={3} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none" placeholder="¿Cómo ayuda al aprendizaje?"></textarea>
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
                                {newItemType === 'DRIVE' ? (
                                    <button
                                        type="button"
                                        onClick={() => setIsDriveModalOpen(true)}
                                        className="bg-blue-100 text-blue-700 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-blue-200 transition-colors"
                                    >
                                        <Cloud className="w-4 h-4" /> Seleccionar
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={handleAIAutoFillItem}
                                        disabled={isExtractingMetadata}
                                        className="bg-purple-100 text-purple-700 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-purple-200 transition-colors disabled:opacity-50"
                                        title="Extraer metadatos con IA"
                                    >
                                        {isExtractingMetadata ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                                        Mágico
                                    </button>
                                )}
                            </div>

                            {/* Item Metadata */}
                            <div className="md:col-span-2">
                                <label className="text-[10px] font-bold text-slate-400 uppercase">Materia</label>
                                <input
                                    value={newItemSubject} onChange={(e) => setNewItemSubject(e.target.value)}
                                    placeholder="Ej: Matemáticas"
                                    className="w-full px-3 py-2 border rounded-lg text-sm"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="text-[10px] font-bold text-slate-400 uppercase">Competencia</label>
                                <input
                                    value={newItemCompetency} onChange={(e) => setNewItemCompetency(e.target.value)}
                                    placeholder="Ej: Resolución de problemas"
                                    className="w-full px-3 py-2 border rounded-lg text-sm"
                                />
                            </div>
                            <div className="md:col-span-4">
                                <label className="text-[10px] font-bold text-slate-400 uppercase">Keywords</label>
                                <input
                                    value={newItemKeywords} onChange={(e) => setNewItemKeywords(e.target.value)}
                                    placeholder="React, Hooks, State"
                                    className="w-full px-3 py-2 border rounded-lg text-sm"
                                />
                            </div>
                            <div className="md:col-span-4">
                                <label className="text-[10px] font-bold text-slate-400 uppercase">Presentación / Contexto</label>
                                <textarea
                                    value={newItemPresentation} onChange={(e) => setNewItemPresentation(e.target.value)}
                                    placeholder="Contexto del recurso..."
                                    rows={2}
                                    className="w-full px-3 py-2 border rounded-lg text-sm resize-none"
                                />
                            </div>
                            <div className="md:col-span-4">
                                <label className="text-[10px] font-bold text-slate-400 uppercase">Utilidad Pedagógica</label>
                                <textarea
                                    value={newItemUtility} onChange={(e) => setNewItemUtility(e.target.value)}
                                    placeholder="¿Para qué sirve?"
                                    rows={2}
                                    className="w-full px-3 py-2 border rounded-lg text-sm resize-none"
                                />
                            </div>

                            {isExtractingMetadata && (
                                <div className="md:col-span-4 bg-purple-50 p-3 rounded-lg border border-purple-100 flex items-center gap-3 animate-pulse">
                                    <Loader2 className="w-4 h-4 text-purple-600 animate-spin" />
                                    <span className="text-xs font-bold text-purple-700">Asistente IA está analizando el documento y extrayendo metadatos...</span>
                                </div>
                            )}
                        </div>
                        <div className="flex justify-end gap-2">
                            {editingItemId && (
                                <button type="button" onClick={cancelEdit} className="bg-slate-200 text-slate-700 text-sm font-bold py-2 px-4 rounded-lg hover:bg-slate-300">
                                    Cancelar
                                </button>
                            )}
                            <button type="button" onClick={handleAddItem} className="bg-blue-600 text-white text-sm font-bold py-2 px-4 rounded-lg hover:bg-blue-700">
                                {editingItemId ? 'Actualizar Recurso' : 'Agregar a la Lista'}
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
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            type="button"
                                            onClick={() => handleEditItem(item)}
                                            className="p-2 text-blue-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                            title="Editar Recurso"
                                        >
                                            <Edit className="w-4 h-4" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveItem(item.id)}
                                            className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Eliminar Recurso"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
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
