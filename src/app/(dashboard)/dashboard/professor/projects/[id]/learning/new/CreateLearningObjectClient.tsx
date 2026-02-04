'use client';

import { useState } from 'react';
import { Package, Plus, FileText, Tag, Loader2 } from 'lucide-react';
import { createLearningObjectAction } from './actions';

type Item = {
    id: number;
    type: 'PDF' | 'VIDEO' | 'DRIVE' | 'S3' | 'EMBED' | 'LINK' | 'DOC';
    title: string;
    url: string;
}

export default function CreateLearningObjectClient({ projectId }: { projectId: string }) {
    const [items, setItems] = useState<Item[]>([{ id: 1, type: 'PDF', title: '', url: '' }]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const addItem = () => {
        setItems([...items, { id: Date.now(), type: 'LINK', title: '', url: '' }]);
    };

    const updateItem = (id: number, field: keyof Item, value: string) => {
        setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
    };

    const removeItem = (id: number) => {
        setItems(items.filter(item => item.id !== id));
    };

    return (
        <div className="max-w-4xl mx-auto p-6">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
                    <Package className="w-8 h-8 text-blue-600" /> Nuevo Objeto de Aprendizaje (OA)
                </h1>
                <p className="text-slate-500 mt-1">Crea un paquete de contenidos y asígnalo a tu proyecto mediante metadatos.</p>
            </header>

            <form
                action={async (formData) => {
                    setIsSubmitting(true);
                    await createLearningObjectAction(formData);
                }}
                className="space-y-8"
            >
                <input type="hidden" name="projectId" value={projectId} />
                {/* Pass complex items array as JSON string for server action parsing */}
                <input type="hidden" name="itemsJson" value={JSON.stringify(items)} />

                {/* SECCIÓN 1: Metadatos del OA (El contexto) */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <Tag className="w-5 h-5 text-purple-600" /> 1. Metadatos y Clasificación
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                            <label className="block text-sm font-bold text-slate-700 mb-1">Título del OA</label>
                            <input name="title" required placeholder="Ej: Fundamentos de Arquitectura de Software" className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:border-blue-500" />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Materia / Área</label>
                            <input name="subject" required placeholder="Ej: Ingeniería de Software" className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:border-blue-500" />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Competencia Asociada</label>
                            <input name="competency" placeholder="Ej: Diagramación UML" className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:border-blue-500" />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Autor / Entidad</label>
                            <input name="citationAuthor" placeholder="Ej: John Doe, Universidad X" className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:border-blue-500" />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Referencia APA 7</label>
                            <input name="apaReference" placeholder="Ej: Doe, J. (2023)..." className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:border-blue-500" />
                        </div>
                    </div>
                </div>

                {/* SECCIÓN 2: El "Paquete SCORM" (Los recursos) */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <FileText className="w-5 h-5 text-emerald-600" /> 2. Contenidos del Paquete
                        </h2>
                        <button type="button" onClick={addItem} className="flex items-center gap-1 text-sm bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg font-bold hover:bg-blue-100 transition-colors">
                            <Plus className="w-4 h-4" /> Agregar Recurso
                        </button>
                    </div>

                    <div className="space-y-4">
                        {items.map((item) => (
                            <div key={item.id} className="p-4 bg-slate-50 border border-slate-200 rounded-lg flex gap-4 items-start relative group">
                                <div className="w-1/4">
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Tipo de Recurso</label>
                                    <select
                                        value={item.type}
                                        onChange={(e) => updateItem(item.id, 'type', e.target.value)}
                                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium outline-none focus:border-blue-500"
                                    >
                                        <option value="PDF">📄 Archivo PDF</option>
                                        <option value="VIDEO">▶️ Video / Youtube</option>
                                        <option value="DRIVE">☁️ Google Drive</option>
                                        <option value="S3">📦 AWS S3</option>
                                        <option value="EMBED">🌐 Iframe Embed</option>
                                        <option value="LINK">🔗 Enlace Web</option>
                                    </select>
                                </div>
                                <div className="flex-1">
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Título del Recurso</label>
                                    <input
                                        value={item.title}
                                        onChange={(e) => updateItem(item.id, 'title', e.target.value)}
                                        placeholder="Ej: Lectura principal (PDF)"
                                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm mb-2 outline-none focus:border-blue-500"
                                    />

                                    <label className="block text-xs font-bold text-slate-500 mb-1">URL / Enlace / ID</label>
                                    <input
                                        value={item.url}
                                        onChange={(e) => updateItem(item.id, 'url', e.target.value)}
                                        placeholder="https://..."
                                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm outline-none focus:border-blue-500"
                                    />
                                </div>
                                {items.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => removeItem(item.id)}
                                        className="absolute top-2 right-2 text-slate-300 hover:text-red-500 p-1"
                                    >
                                        ✕
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-slate-900 text-white font-bold py-3 rounded-xl shadow-lg hover:bg-slate-800 transition-all disabled:opacity-70 flex justify-center items-center gap-2"
                >
                    {isSubmitting ? <Loader2 className="animate-spin" /> : 'Empaquetar y Vincular al Proyecto'}
                </button>
            </form>
        </div>
    );
}
