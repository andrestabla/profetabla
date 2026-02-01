'use client';

import { useState, useEffect } from 'react';
import { submitAssignmentAction } from './actions';
import { Upload, X, FileText, CheckCircle, Clock, Paperclip, Loader2, ExternalLink, Calendar, AlertCircle, Link as LinkIcon, HelpCircle } from 'lucide-react';
import StatusModal from '@/components/StatusModal';
import Link from 'next/link';

/* eslint-disable @typescript-eslint/no-explicit-any */
type Assignment = {
    id: string;
    title: string;
    description: string | null;
    dueDate: string | null;
    evaluationCriteria: string | null;
    project: {
        id: string;
        title: string;
    };
    submissions: any[];
    task: {
        status: string;
        priority: string;
        allowedFileTypes: string[];
        maxDate: string | null;
        comments: any[];
    } | null;
    rubricItems: any[];
};

export default function AssignmentsTimelineClient({ assignments, initialSelectedId }: { assignments: Assignment[], initialSelectedId?: string }) {
    const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(() => {
        if (initialSelectedId) {
            return assignments.find(a => a.id === initialSelectedId) || null;
        }
        return null;
    });

    const [submissionType, setSubmissionType] = useState<'FILE' | 'URL'>(() => {
        if (initialSelectedId) {
            const found = assignments.find(a => a.id === initialSelectedId);
            if (found?.task) {
                const allowed = found.task.allowedFileTypes || [];
                if (allowed.includes('URL') && !allowed.some(t => ['PDF', 'DOC', 'PPTX', 'XLS', 'IMG'].includes(t))) {
                    return 'URL';
                }
            }
        }
        return 'FILE';
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [url, setUrl] = useState('');
    const [statusModal, setStatusModal] = useState<{ type: 'success' | 'error', title: string, message: string } | null>(null);
    const [showSubmissionForm, setShowSubmissionForm] = useState(false);

    const handleSelectAssignment = (assignment: Assignment) => {
        setSelectedAssignment(assignment);
        if (assignment.task) {
            const allowed = assignment.task.allowedFileTypes || [];
            if (allowed.includes('URL') && !allowed.some(t => ['PDF', 'DOC', 'PPTX', 'XLS', 'IMG'].includes(t))) {
                setSubmissionType('URL');
            } else {
                setSubmissionType('FILE');
            }
        }
        setShowSubmissionForm(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedAssignment) return;

        setIsSubmitting(true);
        const formData = new FormData();
        formData.append('assignmentId', selectedAssignment.id);
        formData.append('submissionType', submissionType);

        if (submissionType === 'FILE') {
            if (!file) return;
            formData.append('file', file);
        } else {
            if (!url) return;
            formData.append('url', url);
        }

        const res = await submitAssignmentAction(formData);

        if (res.success) {
            setStatusModal({
                type: 'success',
                title: '¡Tarea Enviada!',
                message: 'Tu entrega se ha registrado correctamente.'
            });
            setSelectedAssignment(null);
            setFile(null);
            setUrl('');
        } else {
            console.error(res.error);
            setStatusModal({
                type: 'error',
                title: 'Error de Envío',
                message: res.error || 'Ocurrió un error inesperado.'
            });
        }
        setIsSubmitting(false);
    };

    const isUrlAllowed = selectedAssignment?.task?.allowedFileTypes?.includes('URL');
    const isFileAllowed = selectedAssignment?.task?.allowedFileTypes?.some(t => t !== 'URL') || (!selectedAssignment?.task?.allowedFileTypes?.length); // Default to file if empty? Or block? usually empty means any file? assumed any file default.

    return (
        <div className="max-w-4xl mx-auto font-sans">
            <h2 className="text-2xl font-bold text-slate-800 mb-8 flex items-center gap-3">
                <CheckCircle className="text-emerald-500 w-8 h-8" />
                Línea de Tiempo de Entregas
            </h2>

            <div className="relative border-l-2 border-slate-200 ml-4 space-y-12 pb-12">
                {assignments.map((assignment, index) => {
                    const isSubmitted = assignment.submissions && assignment.submissions.length > 0;
                    const submission = isSubmitted ? assignment.submissions[0] : null;

                    return (
                        <div key={assignment.id} className="relative pl-8 animate-in slide-in-from-bottom-5 duration-500" style={{ animationDelay: `${index * 100}ms` }}>
                            {/* Dot */}
                            <div className={`absolute -left-[9px] top-6 w-5 h-5 rounded-full border-4 border-white shadow-sm ${isSubmitted ? 'bg-emerald-500' : 'bg-blue-500'}`} />

                            {/* Date Label */}
                            <div className="absolute -left-[140px] top-6 w-[120px] text-right hidden md:block">
                                <p className="text-sm font-bold text-slate-700">
                                    {assignment.dueDate ? new Date(assignment.dueDate).toLocaleDateString() : 'Sin fecha'}
                                </p>
                                <p className="text-xs text-slate-400">
                                    {assignment.dueDate ? new Date(assignment.dueDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Flexible'}
                                </p>
                            </div>

                            {/* Card */}
                            <div className={`rounded-2xl border p-6 transition-all hover:shadow-md ${isSubmitted ? 'bg-emerald-50/50 border-emerald-100' : 'bg-white border-slate-200'}`}>
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
                                                {assignment.project.title}
                                            </span>
                                            {assignment.task && (
                                                <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${assignment.task.priority === 'HIGH' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                                                    {assignment.task?.priority}
                                                </span>
                                            )}
                                        </div>
                                        <h3 className="text-lg font-bold text-slate-800">{assignment.title}</h3>
                                    </div>
                                    {isSubmitted ? (
                                        <div className="flex items-center gap-1.5 text-emerald-600 bg-emerald-100 px-3 py-1 rounded-lg text-xs font-bold">
                                            <CheckCircle className="w-4 h-4" /> Entregado
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-1.5 text-amber-600 bg-amber-50 px-3 py-1 rounded-lg text-xs font-bold border border-amber-100">
                                            <Clock className="w-4 h-4" /> Pendiente
                                        </div>
                                    )}
                                </div>

                                <div className="text-sm text-slate-600 mb-6 bg-slate-50 p-4 rounded-xl border border-slate-100 leading-relaxed line-clamp-3">
                                    {assignment.description || 'Sin descripción detallada.'}
                                </div>

                                <div className="flex justify-end gap-3">
                                    {isSubmitted ? (
                                        <div className="flex gap-2">
                                            {/* If URL, open directly */}
                                            {submission.fileType === 'URL' ? (
                                                <a href={submission.fileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-700 rounded-lg text-sm font-bold hover:bg-emerald-200 transition-colors">
                                                    <ExternalLink className="w-4 h-4" /> Ir al Enlace
                                                </a>
                                            ) : (
                                                <a href={submission.fileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-700 rounded-lg text-sm font-bold hover:bg-emerald-200 transition-colors">
                                                    <FileText className="w-4 h-4" /> Ver Archivo
                                                </a>
                                            )}
                                            <button
                                                onClick={() => handleSelectAssignment(assignment)}
                                                className="px-4 py-2 border border-emerald-200 text-emerald-600 rounded-lg text-sm font-bold hover:bg-emerald-50 transition-colors"
                                            >
                                                Ver Detalles
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => handleSelectAssignment(assignment)}
                                            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold shadow-md shadow-blue-200 hover:bg-blue-700 hover:shadow-lg transition-all"
                                        >
                                            <FileText className="w-4 h-4" /> Ver Detalles & Entregar
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Modal de Detalles y Entrega */}
            {selectedAssignment && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col md:flex-row animate-in zoom-in-95 duration-200">

                        {/* LEFT COLUMN: Details */}
                        <div className={`p-8 ${showSubmissionForm ? 'hidden md:block md:w-1/2 border-r border-slate-100' : 'w-full'}`}>
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Actividad</span>
                                    <h2 className="text-xl font-bold text-slate-800 mt-1">{selectedAssignment.title}</h2>
                                </div>
                                {!showSubmissionForm && (
                                    <button onClick={() => setSelectedAssignment(null)} className="text-slate-400 hover:text-slate-600 md:hidden">
                                        <X className="w-6 h-6" />
                                    </button>
                                )}
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">Descripción</h4>
                                    <p className="text-sm text-slate-600 leading-relaxed">{selectedAssignment.description}</p>
                                </div>

                                <div className="flex gap-4">
                                    <div className="flex-1 bg-slate-50 p-3 rounded-lg border border-slate-100">
                                        <div className="flex items-center gap-2 text-slate-400 mb-1">
                                            <Calendar className="w-3 h-3" />
                                            <span className="text-[10px] font-bold uppercase">Entrega</span>
                                        </div>
                                        <p className="text-sm font-semibold text-slate-700">
                                            {selectedAssignment.dueDate ? new Date(selectedAssignment.dueDate).toLocaleDateString() : 'Sin fecha'}
                                        </p>
                                    </div>
                                    <div className="flex-1 bg-slate-50 p-3 rounded-lg border border-slate-100">
                                        <div className="flex items-center gap-2 text-slate-400 mb-1">
                                            <AlertCircle className="w-3 h-3" />
                                            <span className="text-[10px] font-bold uppercase">Límite</span>
                                        </div>
                                        <p className="text-sm font-semibold text-slate-700">
                                            {selectedAssignment.task?.maxDate ? new Date(selectedAssignment.task.maxDate).toLocaleDateString() : 'No definido'}
                                        </p>
                                    </div>
                                </div>

                                {selectedAssignment.rubricItems && selectedAssignment.rubricItems.length > 0 && (
                                    <div>
                                        <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">Criterios de Éxito (Rúbrica)</h4>
                                        <div className="space-y-2">
                                            {selectedAssignment.rubricItems.map((item: any, i: number) => (
                                                <div key={i} className="flex justify-between items-start text-sm bg-blue-50/50 p-2 rounded-lg border border-blue-50">
                                                    <span className="text-slate-700">{item.criterion}</span>
                                                    <span className="font-bold text-blue-600 text-xs whitespace-nowrap ml-2">{item.maxPoints} pts</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">Comentarios</h4>
                                    {selectedAssignment.task?.comments && selectedAssignment.task.comments.length > 0 ? (
                                        <div className="space-y-2 max-h-32 overflow-y-auto pr-2 custom-scrollbar">
                                            {selectedAssignment.task.comments.map((c: any) => (
                                                <div key={c.id} className="text-xs border-l-2 border-slate-200 pl-2">
                                                    <p className="text-slate-600">{c.content}</p>
                                                    <p className="text-[10px] text-slate-400 mt-1">{c.user?.name} &bull; {new Date(c.createdAt).toLocaleDateString()}</p>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-xs text-slate-400 italic">No hay comentarios en la tarea.</p>
                                    )}
                                </div>

                                <div className="pt-4 flex flex-col gap-3">
                                    <Link href="/dashboard/mentorship" className="w-full py-2 border border-amber-200 text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-xl font-bold text-center text-sm transition-colors flex items-center justify-center gap-2">
                                        <HelpCircle className="w-4 h-4" /> Solicitar Mentoría
                                    </Link>

                                    {!showSubmissionForm && (
                                        <button
                                            onClick={() => setShowSubmissionForm(true)}
                                            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-200 transition-all"
                                        >
                                            Hacer Entrega
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* RIGHT COLUMN: Submission Form */}
                        {showSubmissionForm && (
                            <div className="w-full md:w-1/2 bg-slate-50 p-8 flex flex-col relative md:border-l md:border-slate-100">
                                <button onClick={() => { setShowSubmissionForm(false); setSelectedAssignment(null); }} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
                                    <X className="w-6 h-6" />
                                </button>

                                <div className="mb-6 mt-2">
                                    <h3 className="text-lg font-bold text-slate-800">Tu Entrega</h3>
                                    <p className="text-sm text-slate-500">Completa el formulario para enviar tu trabajo.</p>
                                </div>

                                <form onSubmit={handleSubmit} className="flex-1 flex flex-col justify-between">
                                    <div className="space-y-6">
                                        {/* File Type Selector if multiple allowed or just visual indicator */}
                                        <div className="bg-white p-4 rounded-xl border border-slate-200">
                                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Formato Requerido</label>
                                            <div className="flex flex-wrap gap-2">
                                                {selectedAssignment.task?.allowedFileTypes.length ? (
                                                    selectedAssignment.task.allowedFileTypes.map((t: string) => (
                                                        <span key={t} className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs font-bold border border-slate-200">{t}</span>
                                                    ))
                                                ) : <span className="text-xs text-slate-400">Cualquier formato</span>}
                                            </div>
                                        </div>

                                        {/* Format Toggle */}
                                        {isUrlAllowed && (
                                            <div className="flex gap-2 p-1 bg-white border border-slate-200 rounded-lg">
                                                {isFileAllowed && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setSubmissionType('FILE')}
                                                        className={`flex-1 py-2 text-xs font-bold rounded-md transition-all ${submissionType === 'FILE' ? 'bg-blue-100 text-blue-700 shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}
                                                    >
                                                        Subir Archivo
                                                    </button>
                                                )}
                                                <button
                                                    type="button"
                                                    onClick={() => setSubmissionType('URL')}
                                                    className={`flex-1 py-2 text-xs font-bold rounded-md transition-all ${submissionType === 'URL' ? 'bg-blue-100 text-blue-700 shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}
                                                >
                                                    Enlace / URL
                                                </button>
                                            </div>
                                        )}

                                        {/* Input Area */}
                                        {submissionType === 'URL' ? (
                                            <div className="bg-white rounded-xl p-4 border border-slate-200 animate-in fade-in slide-in-from-top-2 duration-300">
                                                <label className="block text-sm font-bold text-slate-700 mb-2">Enlace del Trabajo</label>
                                                <div className="relative">
                                                    <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                                    <input
                                                        type="url"
                                                        value={url}
                                                        onChange={(e) => setUrl(e.target.value)}
                                                        placeholder="https://docs.google.com/..."
                                                        className="w-full pl-9 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all"
                                                        required
                                                    />
                                                </div>
                                                <p className="text-xs text-slate-400 mt-2">Asegúrate de que el enlace sea público o accesible.</p>
                                            </div>
                                        ) : (
                                            <div className="border-2 border-dashed border-slate-300 bg-white rounded-xl p-8 hover:bg-blue-50/30 transition-colors relative text-center animate-in fade-in slide-in-from-top-2 duration-300">
                                                <input
                                                    type="file"
                                                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                                                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                                                    required={submissionType === 'FILE'}
                                                />
                                                {file ? (
                                                    <div>
                                                        <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
                                                            <FileText className="w-6 h-6" />
                                                        </div>
                                                        <p className="font-bold text-blue-700 text-sm truncate max-w-[200px] mx-auto">{file.name}</p>
                                                        <p className="text-xs text-blue-400 mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                                        <p className="text-xs text-slate-400 mt-3">Clic para cambiar archivo</p>
                                                    </div>
                                                ) : (
                                                    <div>
                                                        <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-3">
                                                            <Paperclip className="w-6 h-6" />
                                                        </div>
                                                        <p className="font-medium text-slate-600 text-sm">Arrastra tu archivo aquí o clic para seleccionar</p>
                                                        <p className="text-xs text-slate-400 mt-2">Formatos permitidos: {selectedAssignment.task?.allowedFileTypes?.join(', ') || 'Todos'}</p>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    <div className="mt-8 flex flex-col gap-3">
                                        <button
                                            type="submit"
                                            disabled={isSubmitting || (submissionType === 'FILE' && !file) || (submissionType === 'URL' && !url)}
                                            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-200 disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2 transition-all"
                                        >
                                            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                                            {isSubmitting ? 'Enviando...' : 'Confirmar Entrega'}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setShowSubmissionForm(false)} // Back to details
                                            disabled={isSubmitting}
                                            className="w-full py-3 text-slate-500 hover:text-slate-800 font-bold transition-colors text-sm"
                                        >
                                            Volver a detalles
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Status Modal for Success/Error */}
            <StatusModal
                isOpen={!!statusModal}
                onClose={() => setStatusModal(null)}
                type={statusModal?.type || 'success'}
                title={statusModal?.title || ''}
                message={statusModal?.message || ''}
            />
        </div>
    );
}
