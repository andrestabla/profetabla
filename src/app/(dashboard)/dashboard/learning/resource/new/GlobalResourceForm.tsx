'use client';

import { useState } from 'react';
import { createGlobalResourceAction } from '../../actions';
import { extractResourceMetadataAction } from '@/app/(dashboard)/dashboard/professor/projects/[id]/actions';
import { Save, Loader2, Sparkles, Youtube, FileText, Link as LinkIcon, Box, ArrowLeft } from 'lucide-react';
import Link from 'next/link';


export default function GlobalResourceForm({ projects }: { projects: { id: string, title: string, type: string }[] }) {
    const [isSaving, setIsSaving] = useState(false);
    const [title, setTitle] = useState('');
    const [url, setUrl] = useState('');
    const [type, setType] = useState('VIDEO');
    const [presentation, setPresentation] = useState('');
    const [utility, setUtility] = useState('');
    const [projectId, setProjectId] = useState('GLOBAL');

    // AI State
    const [isThinking, setIsThinking] = useState(false);

    // Drive State
    const [driveFile, setDriveFile] = useState<File | null>(null);

    const handleAI = async () => {
        if (!url) return alert("Ingresa una URL primero");
        setIsThinking(true);
        try {
            const res = await extractResourceMetadataAction(url, type);
            if (res.success && res.data) {
                setTitle(res.data.title);
                setPresentation(res.data.presentation || '');
                setUtility(res.data.utility || '');
            } else {
                alert("No se pudo extraer información. " + (res.error || ""));
            }
        } catch (e) {
            console.error(e);
            alert("Error de conexión con IA");
        } finally {
            setIsThinking(false);
        }
    };

    const handleSubmit = async (formData: FormData) => {
        setIsSaving(true);
        try {
            const res = await createGlobalResourceAction(formData);
            if (res && !res.success) {
                alert(res.error || "Error al crear el recurso");
                setIsSaving(false);
            }
        } catch (e) {
            console.error(e);
            alert("Error desconocido");
            setIsSaving(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto p-6">
            <Link href="/dashboard/learning" className="flex items-center gap-2 text-slate-500 hover:text-slate-800 mb-6 transition-colors">
                <ArrowLeft className="w-4 h-4" /> Volver a la Biblioteca
            </Link>

            <header className="mb-8 border-b pb-6">
                <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
                    <Box className="w-8 h-8 text-indigo-600" /> Nuevo Recurso Individual
                </h1>
                <p className="text-slate-500 mt-2">
                    Agrega videos, artículos o documentos a la biblioteca global o asígnalos a un proyecto específico.
                </p>
            </header>

            <form action={handleSubmit} className="space-y-6 bg-white p-8 rounded-xl border border-slate-200 shadow-sm">

                {/* 1. Project Selection */}
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Asignar a Proyecto (Opcional)</label>
                    <select
                        name="projectId"
                        value={projectId}
                        onChange={(e) => setProjectId(e.target.value)}
                        className="w-full px-4 py-2 border rounded-lg bg-slate-50 focus:ring-2 focus:ring-indigo-500 outline-none"
                    >
                        <option value="GLOBAL">📚 Biblioteca Global (Disponible para todos)</option>
                        {projects.map(p => (
                            <option key={p.id} value={p.id}>📂 {p.title} ({p.type})</option>
                        ))}
                    </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {/* Type */}
                    <div className="md:col-span-1">
                        <label className="block text-sm font-bold text-slate-700 mb-2">Tipo</label>
                        <select
                            name="type"
                            value={type}
                            onChange={(e) => setType(e.target.value)}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                        >
                            <option value="VIDEO">Video</option>
                            <option value="ARTICLE">Artículo</option>
                            <option value="PDF">Documento PDF</option>
                            <option value="DRIVE">Google Drive</option>
                            <option value="EMBED">Embed/Iframe</option>
                            <option value="LINK">Link Externo</option>
                        </select>
                        <div className="mt-4 flex justify-center">
                            {type === 'VIDEO' && <Youtube className="w-12 h-12 text-red-500 opacity-20" />}
                            {type === 'ARTICLE' && <FileText className="w-12 h-12 text-slate-500 opacity-20" />}
                            {type !== 'VIDEO' && type !== 'ARTICLE' && <LinkIcon className="w-12 h-12 text-slate-500 opacity-20" />}
                        </div>
                    </div>

                    {/* URL & AI */}
                    <div className="md:col-span-3 space-y-4">
                        {type === 'DRIVE' ? (
                            <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg">
                                <label className="block text-sm font-bold text-blue-800 mb-1">Subir Archivo a Drive</label>
                                <input
                                    type="file"
                                    name="file"
                                    className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200"
                                    onChange={(e) => {
                                        if (e.target.files?.[0]) {
                                            const f = e.target.files[0];
                                            setDriveFile(f);
                                            setTitle(f.name.replace(/\.[^/.]+$/, "")); // Auto title
                                        }
                                    }}
                                />
                                <input type="hidden" name="driveTitle" value={title} />
                            </div>
                        ) : (
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">
                                    {type === 'EMBED' ? 'Código Embed' : 'URL del Recurso'}
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        name="url"
                                        value={url}
                                        onChange={(e) => setUrl(e.target.value)}
                                        placeholder="https://..."
                                        className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleAI}
                                        disabled={isThinking || !url}
                                        className="bg-indigo-100 text-indigo-700 px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-indigo-200 disabled:opacity-50 transition-colors"
                                    >
                                        {isThinking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-indigo-600" />}
                                        <span className="hidden sm:inline">IA</span>
                                    </button>
                                </div>
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Título</label>
                            <input
                                name="title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                required
                                placeholder="Nombre descriptivo del recurso"
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Presentación (Qué es)</label>
                                <textarea
                                    name="presentation"
                                    value={presentation}
                                    onChange={(e) => setPresentation(e.target.value)}
                                    rows={3}
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none resize-none text-sm"
                                    placeholder="Descripción breve..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Utilidad (Para qué sirve)</label>
                                <textarea
                                    name="utility"
                                    value={utility}
                                    onChange={(e) => setUtility(e.target.value)}
                                    rows={3}
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none resize-none text-sm"
                                    placeholder="Aplicación práctica..."
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="pt-6 border-t flex justify-end">
                    <button
                        type="submit"
                        disabled={isSaving || (!url && !driveFile)}
                        className="bg-slate-900 text-white font-bold py-3 px-8 rounded-xl hover:bg-black transition-all shadow-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                        {isSaving ? 'Guardando...' : 'Crear Recurso'}
                    </button>
                </div>

            </form>
        </div>
    );
}
