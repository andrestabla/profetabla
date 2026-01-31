'use client';

import { useState, useEffect } from 'react';
import { submitAssignmentAction } from './actions';
import { Upload, X, FileText, CheckCircle, Clock, Paperclip, Loader2 } from 'lucide-react';
import StatusModal from '@/components/StatusModal';

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
    } | null;
    rubricItems: any[];
};

export default function AssignmentsTimelineClient({ assignments, initialSelectedId }: { assignments: Assignment[], initialSelectedId?: string }) {
    const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [statusModal, setStatusModal] = useState<{ type: 'success' | 'error', title: string, message: string } | null>(null);

    useEffect(() => {
        if (initialSelectedId) {
            const found = assignments.find(a => a.id === initialSelectedId);
            if (found) {
                // eslint-disable-next-line react-hooks/set-state-in-effect
                setSelectedAssignment(found);
            }
        }
    }, [initialSelectedId, assignments]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file || !selectedAssignment) return;

        setIsSubmitting(true);
        const formData = new FormData();
        formData.append('assignmentId', selectedAssignment.id);
        formData.append('file', file);

        const res = await submitAssignmentAction(formData);

        if (res.success) {
            setStatusModal({
                type: 'success',
                title: '¡Tarea Enviada!',
                message: 'Tu archivo se ha subido correctamente a la plataforma.'
            });
            setSelectedAssignment(null);
            setFile(null);
        } else {
            console.error(res.error);
            setStatusModal({
                type: 'error',
                title: 'Error de Envío',
                message: res.error || 'Ocurrió un error inesperado al subir el archivo.'
            });
        }
        setIsSubmitting(false);
    };

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

                                <div className="text-sm text-slate-600 mb-6 bg-slate-50 p-4 rounded-xl border border-slate-100 leading-relaxed">
                                    {assignment.description || 'Sin descripción detallada.'}
                                    {assignment.evaluationCriteria && (
                                        <div className="mt-4 pt-4 border-t border-slate-200">
                                            <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">Criterios de Evaluación</h4>
                                            <p className="italic text-slate-500">{assignment.evaluationCriteria}</p>
                                        </div>
                                    )}
                                </div>

                                <div className="flex justify-end gap-3">
                                    {isSubmitted ? (
                                        <a href={submission.fileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-700 rounded-lg text-sm font-bold hover:bg-emerald-200 transition-colors">
                                            <FileText className="w-4 h-4" /> Ver Entrega ({submission.fileName})
                                        </a>
                                    ) : (
                                        <button
                                            onClick={() => setSelectedAssignment(assignment)}
                                            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold shadow-md shadow-blue-200 hover:bg-blue-700 hover:shadow-lg transition-all"
                                        >
                                            <Upload className="w-4 h-4" /> Subir Tarea
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Modal de Entrega */}
            {selectedAssignment && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                            <h3 className="font-bold text-slate-800">Entregar Tarea</h3>
                            <button onClick={() => setSelectedAssignment(null)} className="text-slate-400 hover:text-slate-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6">
                            <div className="mb-6">
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Actividad</label>
                                <p className="font-bold text-slate-800">{selectedAssignment.title}</p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 hover:bg-slate-50 transition-colors relative text-center">
                                    <input
                                        type="file"
                                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                        required
                                    />
                                    {file ? (
                                        <div>
                                            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
                                                <FileText className="w-6 h-6" />
                                            </div>
                                            <p className="font-bold text-blue-700 text-sm">{file.name}</p>
                                            <p className="text-xs text-blue-400 mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                            <p className="text-xs text-slate-400 mt-3">Clic para cambiar archivo</p>
                                        </div>
                                    ) : (
                                        <div>
                                            <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-3">
                                                <Paperclip className="w-6 h-6" />
                                            </div>
                                            <p className="font-medium text-slate-600 text-sm">Arrastra tu archivo aquí o <span className="text-blue-600 underline">haz clic</span></p>
                                            <p className="text-xs text-slate-400 mt-2">PDF, DOCX, ZIP, IMÁGENES</p>
                                        </div>
                                    )}
                                </div>

                                <div className="flex flex-col gap-3">
                                    <button
                                        type="submit"
                                        disabled={isSubmitting || !file}
                                        className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-200 disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2 transition-all"
                                    >
                                        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                                        {isSubmitting ? 'Subiendo...' : 'Enviar Entrega'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setSelectedAssignment(null)}
                                        disabled={isSubmitting}
                                        className="w-full py-3 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl font-bold transition-all"
                                    >
                                        Cancelar
                                    </button>
                                </div>
                            </form>
                        </div>
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
