'use client';

import { useState } from 'react';
import { createGlobalResourceAction } from '../../actions';
import { extractResourceMetadataAction } from '@/app/(dashboard)/dashboard/professor/projects/[id]/actions';
import { Save, Loader2, Sparkles, Youtube, FileText, Link as LinkIcon, Box, ArrowLeft, Cloud, Monitor, ExternalLink, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { DrivePickerModal } from '@/components/DrivePickerModal';


export default function GlobalResourceForm({ projects }: { projects: { id: string, title: string, type: string }[] }) {
    const [isSaving, setIsSaving] = useState(false);
    const [title, setTitle] = useState('');
    const [url, setUrl] = useState('');
    const [type, setType] = useState('VIDEO');
    const [presentation, setPresentation] = useState('');
    const [utility, setUtility] = useState('');
    const [subject, setSubject] = useState('');
    const [competency, setCompetency] = useState('');
    const [keywords, setKeywords] = useState('');
    const [projectId, setProjectId] = useState('GLOBAL');

    // AI State
    const [isThinking, setIsThinking] = useState(false);

    // Drive State
    const [driveFile, setDriveFile] = useState<File | null>(null);
    const [isDriveModalOpen, setIsDriveModalOpen] = useState(false);

    // Modal State
    const [showConfirmModal, setShowConfirmModal] = useState(false);

    const handleAI = async () => {
        // Validation depends on type
        if (type !== 'DRIVE' && !url) return alert("Ingresa una URL o código primero");

        setIsThinking(true);
        try {
            if (type === 'DRIVE' && url) {
                // If we have a drive URL from picker
                const { processDriveFileForOAAction } = await import('@/app/actions/oa-actions');
                const fileId = url.match(/[-\w]{25,}/)?.[0];
                if (fileId) {
                    const aiData = await processDriveFileForOAAction(fileId, 'auto');
                    if (aiData) {
                        setTitle(aiData.title || title);
                        setPresentation(aiData.presentation || presentation);
                        setUtility(aiData.utility || utility);
                        setSubject(aiData.subject || subject);
                        setCompetency(aiData.competency || competency);
                        setKeywords(aiData.keywords?.join(', ') || keywords);
                    }
                    return;
                }
            }

            // Standard extraction
            const res = await extractResourceMetadataAction(url, type);
            if (res.success && res.data) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const data = res.data as any;
                setTitle(data.title);
                setPresentation(data.presentation || '');
                setUtility(data.utility || '');
                setSubject(data.subject || '');
                setCompetency(data.competency || '');
                setKeywords(data.keywords?.join(', ') || '');
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleDriveFileSelected = async (file: any) => {
        setIsDriveModalOpen(false);
        setUrl(file.webViewLink);
        setTitle(file.name);
        setDriveFile(null); // Clear local upload if picker used
    };

    const handleSubmit = async (formData: FormData) => {
        setIsSaving(true);
        const res = await createGlobalResourceAction(formData);
        if (res && !res.success) {
            alert(res.error || "Error al crear el recurso");
            setIsSaving(false);
        }
        // No catch block here to avoid catching NEXT_REDIRECT
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
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-bold"
                        >
                            <option value="VIDEO">📹 Video (YT/Vimeo)</option>
                            <option value="ARTICLE">📄 Artículo / Blog</option>
                            <option value="DRIVE">☁️ Google Drive</option>
                            <option value="EMBED">🔣 Código Embed</option>
                            <option value="LINK">🔗 Link Externo</option>
                        </select>
                        <div className="mt-4 flex justify-center">
                            {type === 'VIDEO' && <Youtube className="w-12 h-12 text-red-500 opacity-20" />}
                            {type === 'ARTICLE' && <FileText className="w-12 h-12 text-slate-500 opacity-20" />}
                            {type === 'DRIVE' && <Cloud className="w-12 h-12 text-blue-500 opacity-20" />}
                            {type === 'EMBED' && <Monitor className="w-12 h-12 text-indigo-500 opacity-20" />}
                            {type === 'LINK' && <ExternalLink className="w-12 h-12 text-slate-500 opacity-20" />}
                        </div>
                    </div>

                    {/* URL & AI */}
                    <div className="md:col-span-3 space-y-4">
                        {type === 'DRIVE' ? (
                            <div className="space-y-3">
                                <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg flex flex-col md:flex-row gap-4 items-center">
                                    <div className="flex-1 w-full">
                                        <label className="block text-xs font-bold text-blue-800 mb-1 uppercase">Opción 1: Cargar Archivo Nuevo</label>
                                        <input
                                            type="file"
                                            name="file"
                                            className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200"
                                            onChange={(e) => {
                                                if (e.target.files?.[0]) {
                                                    const f = e.target.files[0];
                                                    setDriveFile(f);
                                                    setTitle(f.name.replace(/\.[^/.]+$/, ""));
                                                    setUrl(''); // Clear link URL if file uploading
                                                }
                                            }}
                                        />
                                    </div>
                                    <div className="text-slate-400 font-bold text-xs">O</div>
                                    <div className="flex-none w-full md:w-auto">
                                        <label className="block text-xs font-bold text-blue-800 mb-1 uppercase">Opción 2: Seleccionar de Drive</label>
                                        <button
                                            type="button"
                                            onClick={() => setIsDriveModalOpen(true)}
                                            className="w-full bg-white border border-blue-300 text-blue-600 px-4 py-2 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-blue-50 transition-colors"
                                        >
                                            <Cloud className="w-4 h-4" /> Buscar en Drive
                                        </button>
                                    </div>
                                </div>
                                {url && url.includes('drive.google.com') && (
                                    <div className="flex items-center justify-between px-3 py-2 bg-green-50 text-green-700 rounded-lg text-xs font-medium border border-green-100">
                                        <div className="flex items-center gap-2 overflow-hidden">
                                            <LinkIcon className="w-3 h-3 shrink-0" />
                                            <span className="truncate">Archivo vinculado: {url.substring(0, 60)}...</span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={handleAI}
                                            disabled={isThinking}
                                            className="flex-none flex items-center gap-1.5 px-2 py-1 bg-green-600 text-white rounded font-bold hover:bg-green-700 transition-colors disabled:opacity-50 ml-2"
                                        >
                                            {isThinking ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                                            Asistente IA
                                        </button>
                                    </div>
                                )}
                                <input type="hidden" name="url" value={url} />
                                <input type="hidden" name="driveTitle" value={title} />
                            </div>
                        ) : (
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">
                                    {type === 'EMBED' ? 'Código Embed / Iframe' : 'URL del Recurso'}
                                </label>
                                <div className="flex gap-2">
                                    {type === 'EMBED' ? (
                                        <textarea
                                            name="url"
                                            value={url}
                                            onChange={(e) => setUrl(e.target.value)}
                                            rows={2}
                                            placeholder="<iframe ...></iframe>"
                                            className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-mono text-xs"
                                        />
                                    ) : (
                                        <input
                                            name="url"
                                            value={url}
                                            onChange={(e) => setUrl(e.target.value)}
                                            placeholder="https://..."
                                            className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                        />
                                    )}
                                    <button
                                        type="button"
                                        onClick={handleAI}
                                        disabled={isThinking || (!url && type !== 'DRIVE')}
                                        className="bg-indigo-100 text-indigo-700 px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-indigo-200 disabled:opacity-50 transition-colors"
                                    >
                                        {isThinking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-indigo-600" />}
                                        <span className="hidden sm:inline">Asistente IA</span>
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
                                <label className="block text-sm font-bold text-slate-700 mb-2">Materia / Categoría</label>
                                <input
                                    name="subject"
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                    placeholder="Ej: Matemáticas, Historia..."
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Competencia</label>
                                <input
                                    name="competency"
                                    value={competency}
                                    onChange={(e) => setCompetency(e.target.value)}
                                    placeholder="Competencia principal"
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Keywords (separadas por coma)</label>
                            <input
                                name="keywords"
                                value={keywords}
                                onChange={(e) => setKeywords(e.target.value)}
                                placeholder="tag1, tag2, tag3"
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
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
                        type="button"
                        onClick={() => setShowConfirmModal(true)}
                        disabled={isSaving || (!url && !driveFile)}
                        className="bg-slate-900 text-white font-bold py-3 px-8 rounded-xl hover:bg-black transition-all shadow-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                        {isSaving ? 'Guardando...' : 'Crear Recurso'}
                    </button>
                </div>

                {/* Submitting hidden button for form action */}
                <button type="submit" id="submit-form-hidden" className="hidden" />

            </form>

            <DrivePickerModal
                isOpen={isDriveModalOpen}
                onClose={() => setIsDriveModalOpen(false)}
                onSelect={handleDriveFileSelected}
            />

            {/* Confirmation Modal */}
            {showConfirmModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center shrink-0">
                                    <AlertTriangle className="w-6 h-6 text-indigo-600" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-xl font-bold text-slate-900">Confirmar Creación</h3>
                                    <p className="text-slate-500 text-sm">¿Estás seguro de agregar este nuevo recurso a la biblioteca?</p>
                                </div>
                            </div>

                            <div className="bg-slate-50 p-4 rounded-xl mb-6 border border-slate-100 italic text-sm text-slate-600">
                                <p className="font-bold text-slate-800 not-italic">{title || "Sin título"}</p>
                                <p className="mt-1">{type} • {projectId === 'GLOBAL' ? 'Biblioteca Global' : 'Proyecto Específico'}</p>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmModal(false)}
                                    className="flex-1 py-3 px-4 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowConfirmModal(false);
                                        document.getElementById('submit-form-hidden')?.click();
                                    }}
                                    className="flex-1 py-3 px-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all"
                                >
                                    Sí, Crear
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
