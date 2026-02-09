'use client';

import { useState, useEffect } from 'react';
import { submitAssignmentAction } from './actions';
import { Upload, X, FileText, CheckCircle, Clock, Paperclip, Loader2, ExternalLink, Calendar, AlertCircle, Link as LinkIcon, HelpCircle, Filter } from 'lucide-react';
import StatusModal from '@/components/StatusModal';
import Link from 'next/link';
import { QuizRunner } from '@/components/QuizRunner';

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
    rubricItems: any[];
    task: {
        status: string;
        priority: string;
        allowedFileTypes: string[];
        maxDate: string | null;
        comments: any[];
        type?: 'TASK' | 'QUIZ';
        quizData?: { questions: any[] };
    } | null;
};

type ProjectOption = {
    id: string;
    title: string;
};

export default function AssignmentsTimelineClient({ assignments, initialSelectedId, projects = [] }: { assignments: Assignment[], initialSelectedId?: string, projects?: ProjectOption[] }) {
    const [filterProjectId, setFilterProjectId] = useState<string>('ALL');

    const filteredAssignments = filterProjectId === 'ALL'
        ? assignments
        : assignments.filter(a => a.project.id === filterProjectId);

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

        try {
            if (submissionType === 'FILE') {
                if (!file) {
                    setIsSubmitting(false);
                    return;
                }

                // Direct Upload for reliability and larger files (>4.5MB)
                console.log('Requesting presigned URL for:', file.name);

                // Dynamic import to avoid circular dep issues if any
                const { getUploadUrlAction } = await import('./actions');
                const presignedRes = await getUploadUrlAction(file.name, file.type);

                if (!presignedRes.success || !presignedRes.url) {
                    throw new Error(presignedRes.error || 'No se pudo obtener URL de carga');
                }

                console.log('Uploading directly to R2...');
                const uploadRes = await fetch(presignedRes.url, {
                    method: 'PUT',
                    body: file,
                    headers: {
                        'Content-Type': file.type
                    }
                });

                if (!uploadRes.ok) {
                    throw new Error('Falló la subida del archivo a la nube');
                }

                formData.append('submissionType', 'DIRECT_UPLOAD');
                formData.append('fileUrl', presignedRes.key); // Key acts as URL identifier in this app
                formData.append('fileName', file.name);
                formData.append('fileType', file.type);
                formData.append('fileSize', file.size.toString());

            } else {
                if (!url) {
                    setIsSubmitting(false);
                    return;
                }
                formData.append('submissionType', 'URL');
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
        } catch (error: any) {
            console.error('Submission error:', error);
            setStatusModal({
                type: 'error',
                title: 'Error de Envío',
                message: error.message || 'Error de conexión.'
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const isUrlAllowed = selectedAssignment?.task?.allowedFileTypes?.includes('URL');
    const isFileAllowed = selectedAssignment?.task?.allowedFileTypes?.some(t => t !== 'URL') || (!selectedAssignment?.task?.allowedFileTypes?.length); // Default to file if empty? Or block? usually empty means any file? assumed any file default.

    return (
        <div className="w-full max-w-5xl mx-auto pb-20">
            {/* Header with Filters */}
            <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4 mb-10">
                <div>
                    <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700">
                        Línea de Tiempo de Entregas
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">Gestiona tus entregas y revisiones pendientes</p>
                </div>

                {projects.length > 0 && (
                    <div className="relative group">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-hover:text-blue-500 transition-colors" />
                        <select
                            value={filterProjectId}
                            onChange={(e) => setFilterProjectId(e.target.value)}
                            className="pl-10 pr-8 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 shadow-sm focus:ring-4 focus:ring-blue-50 focus:border-blue-200 outline-none appearance-none cursor-pointer hover:border-blue-200 transition-all min-w-[200px]"
                        >
                            <option value="ALL">Todos los Proyectos</option>
                            {projects.map(p => (
                                <option key={p.id} value={p.id}>{p.title}</option>
                            ))}
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                            <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </div>
                    </div>
                )}
            </div>

            <div className="relative border-l-2 border-slate-100 ml-4 md:ml-6 space-y-12">
                {filteredAssignments.length === 0 ? (
                    <div className="pl-8 py-12">
                        <div className="bg-slate-50 rounded-2xl border border-dashed border-slate-200 p-8 text-center">
                            <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center mx-auto mb-4">
                                <Filter className="w-6 h-6 text-slate-300" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-700">No hay entregas</h3>
                            <p className="text-slate-500 text-sm mt-1">
                                {filterProjectId === 'ALL'
                                    ? 'No tienes entregas asignadas actualmente.'
                                    : 'No hay entregas para este proyecto.'}
                            </p>
                            {filterProjectId !== 'ALL' && (
                                <button
                                    onClick={() => setFilterProjectId('ALL')}
                                    className="mt-4 text-blue-600 text-sm font-bold hover:underline"
                                >
                                    Ver todos los proyectos
                                </button>
                            )}
                        </div>
                    </div>
                ) : (
                    filteredAssignments.map((assignment, index) => {
                        const isSubmitted = assignment.submissions && assignment.submissions.length > 0;
                        const submission = isSubmitted ? assignment.submissions[0] : null;
                        const isGraded = submission && submission.grade != null;

                        return (
                            <div key={assignment.id} className="relative pl-8 animate-in slide-in-from-bottom-5 duration-500" style={{ animationDelay: `${index * 100}ms` }}>
                                {/* Dot */}
                                <div className={`absolute -left-[9px] top-6 w-5 h-5 rounded-full border-4 border-white shadow-sm ${isGraded ? 'bg-indigo-500' : isSubmitted ? 'bg-emerald-500' : 'bg-blue-500'}`} />

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
                                <div className={`rounded-2xl border p-6 transition-all hover:shadow-md ${isGraded ? 'bg-indigo-50/50 border-indigo-100' : isSubmitted ? 'bg-emerald-50/50 border-emerald-100' : 'bg-white border-slate-200'}`}>
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
                                        {isGraded ? (
                                            <div className="flex items-center gap-1.5 text-indigo-600 bg-indigo-100 px-3 py-1 rounded-lg text-xs font-bold">
                                                <CheckCircle className="w-4 h-4" /> Revisado
                                            </div>
                                        ) : isSubmitted ? (
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
                                                    <a href={submission.fileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-bold hover:bg-slate-200 transition-colors">
                                                        <ExternalLink className="w-4 h-4" /> Ver Enlace
                                                    </a>
                                                ) : (
                                                    <a href={submission.fileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-bold hover:bg-slate-200 transition-colors">
                                                        <FileText className="w-4 h-4" /> Ver Archivo
                                                    </a>
                                                )}
                                                <button
                                                    onClick={() => handleSelectAssignment(assignment)}
                                                    className={`px-4 py-2 border rounded-lg text-sm font-bold transition-colors ${isGraded ? 'border-indigo-200 text-indigo-600 hover:bg-indigo-50' : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'}`}
                                                >
                                                    {isGraded ? 'Ver Retroalimentación' : 'Ver Detalles'}
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
                    }))}
            </div>

            {/* Modal de Detalles y Entrega */}
            {selectedAssignment && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col md:flex-row animate-in zoom-in-95 duration-200 relative">
                        <button
                            onClick={() => setSelectedAssignment(null)}
                            className="absolute top-4 right-4 p-2 bg-slate-100/50 hover:bg-slate-100 text-slate-500 hover:text-slate-800 rounded-full transition-colors z-10"
                        >
                            <X className="w-5 h-5" />
                        </button>
                        {/* LEFT COLUMN: Details */}
                        <div className={`p-8 ${showSubmissionForm ? 'hidden md:block md:w-1/2 border-r border-slate-100' : 'w-full'}`}>
                            {(() => {
                                const sub = selectedAssignment.submissions && selectedAssignment.submissions.length > 0 ? selectedAssignment.submissions[0] : null;
                                const isGraded = sub && sub.grade != null;

                                return (
                                    <>
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
                                            {isGraded && (
                                                <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 animate-in slide-in-from-top-2">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <h4 className="font-bold text-indigo-700 flex items-center gap-2">
                                                            <CheckCircle className="w-4 h-4" /> Calificación
                                                        </h4>
                                                        <span className="text-2xl font-black text-indigo-600">{sub.grade} pts</span>
                                                    </div>
                                                    {sub.feedback && (
                                                        <div className="text-sm text-indigo-800 bg-white/50 p-3 rounded-lg border border-indigo-100/50 italic">
                                                            &quot;{sub.feedback}&quot;
                                                        </div>
                                                    )}
                                                </div>
                                            )}

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
                                                        {selectedAssignment.rubricItems.map((item: any, i: number) => {
                                                            const score = sub?.rubricScores?.find((s: any) => s.rubricItemId === item.id);
                                                            return (
                                                                <div key={i} className={`flex flex-col text-sm p-2 rounded-lg border ${score ? 'bg-indigo-50 border-indigo-100' : 'bg-slate-50 border-slate-100'}`}>
                                                                    <div className="flex justify-between items-start w-full">
                                                                        <span className="text-slate-700 font-medium">{item.criterion}</span>
                                                                        <span className={`font-bold text-xs whitespace-nowrap ml-2 ${score ? 'text-indigo-600' : 'text-slate-400'}`}>
                                                                            {score ? `${score.score} / ` : ''}{item.maxPoints} pts
                                                                        </span>
                                                                    </div>
                                                                    {score?.feedback && (
                                                                        <p className="text-xs text-indigo-500 mt-1 italic pl-2 border-l-2 border-indigo-200">
                                                                            {score.feedback}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            );
                                                        })}
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

                                                {!showSubmissionForm && !sub && (
                                                    <button
                                                        onClick={() => setShowSubmissionForm(true)}
                                                        className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-200 transition-all"
                                                    >
                                                        Hacer Entrega
                                                    </button>
                                                )}

                                                {!showSubmissionForm && sub && !isGraded && (
                                                    <button
                                                        onClick={() => setShowSubmissionForm(true)}
                                                        className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-lg shadow-emerald-200 transition-all"
                                                    >
                                                        Editar Entrega
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </>
                                );
                            })()}
                        </div>

                        {/* RIGHT COLUMN: Submission Form OR Quiz Runner Trigger */}
                        {showSubmissionForm && (
                            selectedAssignment.task?.type === 'QUIZ' ? (
                                // If it's a quiz, we don't show the side panel form, we show the full screen runner
                                // But we are inside the modal structure. 
                                // Actually, QuizRunner is a full screen modal itself.
                                // So if we are here, we should hide this modal and show QuizRunner?
                                // OR render QuizRunner INSTEAD of this entire modal?
                                // Let's render QuizRunner as an overlay on top of this, 
                                // or better: logic in the parent return.
                                null
                            ) : (
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
                            ))}
                    </div>
                </div>
            )}
            {/* Quiz Runner Overlay */}
            {selectedAssignment && showSubmissionForm && selectedAssignment.task?.type === 'QUIZ' && selectedAssignment.task.quizData && (
                <QuizRunner
                    title={selectedAssignment.title}
                    questions={selectedAssignment.task.quizData.questions}
                    assignmentId={selectedAssignment.id}
                    onClose={() => setShowSubmissionForm(false)}
                    onSuccess={() => {
                        setSelectedAssignment(null);
                        // Optional: Refresh data
                    }}
                />
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
