'use client';

import { useState } from 'react';
import { submitAssignmentAction, getUploadUrlAction } from '@/app/(dashboard)/dashboard/assignments/actions';
import { Upload, FileText, CheckCircle, Clock, Loader2, ExternalLink, Calendar, AlertCircle, HelpCircle, ArrowLeft } from 'lucide-react';
import StatusModal from '@/components/StatusModal';
import Link from 'next/link';
import { QuizRunner } from '@/components/QuizRunner';
import { QuizResultView } from '@/components/QuizResultView';
import { calculateTotalQuizScore } from '@/lib/quiz-utils';
import { useRouter } from 'next/navigation';

/* eslint-disable @typescript-eslint/no-explicit-any */
type Assignment = {
    id: string;
    title: string;
    description: string | null;
    dueDate: string | null; // serialized date
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
        maxDate: string | null; // serialized
        type?: 'TASK' | 'QUIZ';
        quizData?: any;
    } | null;
};

export default function AssignmentDetailClient({ assignment }: { assignment: Assignment }) {
    const router = useRouter();


    const [submissionType, setSubmissionType] = useState<'FILE' | 'URL'>(() => {
        if (assignment.task) {
            const allowed = assignment.task.allowedFileTypes || [];
            if (allowed.includes('URL') && !allowed.some(t => ['PDF', 'DOC', 'PPTX', 'XLS', 'IMG'].includes(t))) {
                return 'URL';
            }
        }
        return 'FILE';
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [url, setUrl] = useState('');
    const [statusModal, setStatusModal] = useState<{ type: 'success' | 'error', title: string, message: string } | null>(null);

    // Quiz State
    const [isQuizRunning, setIsQuizRunning] = useState(false);

    const submission = assignment.submissions && assignment.submissions.length > 0 ? assignment.submissions[0] : null;
    let grade = submission?.grade;

    if (grade === null && assignment.task?.type === 'QUIZ' && (assignment.task as any)?.quizData?.gradingMethod === 'AUTO' && submission) {
        grade = calculateTotalQuizScore((assignment.task as any).quizData.questions || [], submission.answers || {});
    }
    const isGraded = grade != null;
    const isSubmitted = !!submission;

    const isUrlAllowed = assignment.task?.allowedFileTypes?.includes('URL');
    const isFileAllowed = assignment.task?.allowedFileTypes?.some(t => t !== 'URL') || (!assignment.task?.allowedFileTypes?.length);


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        setIsSubmitting(true);
        const formData = new FormData();
        formData.append('assignmentId', assignment.id);

        try {
            if (submissionType === 'FILE') {
                if (!file) {
                    setIsSubmitting(false);
                    return;
                }

                console.log('Requesting presigned URL for:', file.name);
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
                formData.append('fileUrl', presignedRes.key);
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
                setFile(null);
                setUrl('');
                router.refresh(); // Refresh to show submission state
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


    // Render Quiz Runner Overlay
    if (isQuizRunning) {
        return (
            <div className="fixed inset-0 z-50 bg-white overflow-y-auto">
                <QuizRunner
                    assignment={{
                        id: assignment.id,
                        title: assignment.title,
                        questions: assignment.task?.quizData?.questions || []
                    }}
                    onCancel={() => setIsQuizRunning(false)}
                    onComplete={() => {
                        setIsQuizRunning(false);
                        window.location.reload();
                    }}
                />
            </div>
        )
    }

    return (
        <div className="bg-slate-50 min-h-screen pb-20">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center gap-4 sticky top-0 z-20 shadow-sm">
                <button
                    onClick={() => router.back()}
                    className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                    <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
                            {assignment.project.title}
                        </span>
                        {assignment.task && (
                            <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${assignment.task.priority === 'HIGH' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                                {assignment.task?.priority}
                            </span>
                        )}
                        {isGraded ? (
                            <span className="flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                                <CheckCircle className="w-3 h-3" /> Revisado
                            </span>
                        ) : isSubmitted ? (
                            <span className="flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                                <CheckCircle className="w-3 h-3" /> Entregado
                            </span>
                        ) : (
                            <span className="flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                                <Clock className="w-3 h-3" /> Pendiente
                            </span>
                        )}
                    </div>
                    <h1 className="text-xl font-bold text-slate-800">{assignment.title}</h1>
                </div>
            </div>

            <div className="max-w-6xl mx-auto p-6 md:p-8 grid md:grid-cols-2 gap-8">
                {/* Left Column: Details & Feedback */}
                <div className="space-y-6">
                    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                        <h4 className="text-xs font-bold text-slate-400 uppercase mb-3">Descripción de la Actividad</h4>
                        <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                            {assignment.description || 'Sin descripción detallada.'}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white p-4 rounded-xl border border-slate-200">
                            <div className="flex items-center gap-2 text-slate-400 mb-1">
                                <Calendar className="w-4 h-4" />
                                <span className="text-[10px] font-bold uppercase">Entrega</span>
                            </div>
                            <p className="text-sm font-semibold text-slate-700">
                                {assignment.dueDate ? new Date(assignment.dueDate).toLocaleDateString() : 'Sin fecha'}
                            </p>
                            <p className="text-xs text-slate-400">
                                {assignment.dueDate ? new Date(assignment.dueDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Flexible'}
                            </p>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-slate-200">
                            <div className="flex items-center gap-2 text-slate-400 mb-1">
                                <AlertCircle className="w-4 h-4" />
                                <span className="text-[10px] font-bold uppercase">Límite Final</span>
                            </div>
                            <p className="text-sm font-semibold text-slate-700">
                                {assignment.task?.maxDate ? new Date(assignment.task.maxDate).toLocaleDateString() : 'No definido'}
                            </p>
                        </div>
                    </div>

                    {isGraded && (
                        <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-6 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                <CheckCircle className="w-24 h-24 text-indigo-600" />
                            </div>
                            <div className="flex items-center justify-between mb-4 relative z-10">
                                <h4 className="font-bold text-indigo-800 flex items-center gap-2 text-lg">
                                    <CheckCircle className="w-6 h-6" /> Calificación
                                </h4>
                                <span className="text-4xl font-black text-indigo-600 tracking-tighter shadow-sm">{grade} <span className="text-lg text-indigo-400 font-bold">pts</span></span>
                            </div>
                            {submission.feedback && (
                                <div className="text-sm text-indigo-800 bg-white/60 backdrop-blur-sm p-4 rounded-xl border border-indigo-100/50 italic relative z-10">
                                    &quot;{submission.feedback}&quot;
                                </div>
                            )}
                        </div>
                    )}

                    {assignment.rubricItems && assignment.rubricItems.length > 0 && (
                        <div className="bg-white rounded-2xl border border-slate-200 p-6">
                            <h4 className="text-xs font-bold text-slate-400 uppercase mb-4">Criterios de Evaluación</h4>
                            <div className="space-y-3">
                                {assignment.rubricItems.map((item: any, i: number) => {
                                    const score = submission?.rubricScores?.find((s: any) => s.rubricItemId === item.id);
                                    return (
                                        <div key={i} className={`flex flex-col text-sm p-3 rounded-xl border transition-all ${score ? 'bg-indigo-50 border-indigo-100' : 'bg-slate-50 border-slate-100'}`}>
                                            <div className="flex justify-between items-start w-full">
                                                <span className="text-slate-700 font-medium">{item.criterion}</span>
                                                <span className={`font-bold text-xs whitespace-nowrap ml-2 ${score ? 'text-indigo-600' : 'text-slate-400'}`}>
                                                    {score ? `${score.score} / ` : ''}{item.maxPoints} pts
                                                </span>
                                            </div>
                                            {score?.feedback && (
                                                <p className="text-xs text-indigo-500 mt-2 italic pl-2 border-l-2 border-indigo-200">
                                                    {score.feedback}
                                                </p>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    <Link href="/dashboard/mentorship" className="block w-full py-3 border border-amber-200 text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-xl font-bold text-center text-sm transition-colors flex items-center justify-center gap-2">
                        <HelpCircle className="w-4 h-4" /> Solicitar Mentoría para esta actividad
                    </Link>
                </div>

                {/* Right Column: Submission Form / Status */}
                <div>
                    {submission ? (
                        assignment.task?.type === 'QUIZ' ? (
                            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                                <h3 className="text-lg font-bold text-slate-800 mb-4">Resultados del Cuestionario</h3>
                                <QuizResultView
                                    questions={assignment.task?.quizData?.questions || []}
                                    answers={submission.answers || {}}
                                    gradingMethod={assignment.task?.quizData?.gradingMethod}
                                    score={submission.grade ?? undefined}
                                    maxScore={assignment.task?.quizData?.questions.reduce((acc: number, q: any) => acc + (q.points || 1), 0) || 0}
                                    onBack={() => { }}
                                    hideBack={true}
                                />
                            </div>
                        ) : (
                            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm sticky top-24">
                                <div className="mb-6">
                                    <h3 className="text-xl font-bold text-slate-800">Tu Entrega</h3>
                                    <p className="text-sm text-slate-500">Ya has enviado esta tarea.</p>
                                </div>

                                <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 space-y-5">
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Tipo</label>
                                        <span className="inline-block px-3 py-1 bg-white text-slate-600 rounded-lg text-xs font-bold border border-slate-200 shadow-sm">
                                            {submission.fileType === 'URL' ? 'Enlace / URL' : 'Archivo'}
                                        </span>
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Contenido</label>
                                        {submission.fileType === 'URL' ? (
                                            <a
                                                href={submission.fileUrl || '#'}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-3 text-blue-600 font-bold hover:underline bg-blue-50 p-4 rounded-xl border border-blue-100 transition-colors"
                                            >
                                                <ExternalLink className="w-5 h-5" />
                                                <span className="truncate">{submission.fileUrl}</span>
                                            </a>
                                        ) : (
                                            <a
                                                href={submission.fileUrl || '#'}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-3 text-indigo-600 font-bold hover:underline bg-indigo-50 p-4 rounded-xl border border-indigo-100 transition-colors"
                                            >
                                                <FileText className="w-5 h-5" />
                                                <div className="flex flex-col min-w-0">
                                                    <span className="truncate">{submission.fileName || 'Descargar archivo'}</span>
                                                    {submission.fileSize && <span className="text-[10px] text-indigo-400 font-normal">{(submission.fileSize / 1024 / 1024).toFixed(2)} MB</span>}
                                                </div>
                                            </a>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Enviado el</label>
                                        <p className="text-sm text-slate-600 font-medium">{new Date(submission.createdAt).toLocaleString()}</p>
                                    </div>
                                </div>
                            </div>
                        )
                    ) : (
                        // SUBMISSION FORM
                        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm sticky top-24">
                            <div className="mb-6">
                                <h3 className="text-xl font-bold text-slate-800">Realizar Entrega</h3>
                                <p className="text-sm text-slate-500">Sube tu trabajo o completa la actividad.</p>
                            </div>

                            {assignment.task?.type === 'QUIZ' ? (
                                <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                    <div className="p-4 bg-white rounded-full shadow-sm w-16 h-16 flex items-center justify-center mx-auto mb-4">
                                        <HelpCircle className="w-8 h-8 text-blue-500" />
                                    </div>
                                    <h4 className="font-bold text-slate-700 text-lg mb-2">Cuestionario Disponible</h4>
                                    <p className="text-slate-500 text-sm max-w-xs mx-auto mb-6">Esta actividad es un cuestionario interactivo. Tienes un intento para completarlo.</p>
                                    <button
                                        onClick={() => setIsQuizRunning(true)}
                                        className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-200 transition-all font-[Inter]"
                                    >
                                        Comenzar Cuestionario
                                    </button>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    {isUrlAllowed && (
                                        <div className="flex gap-2 p-1 bg-slate-100 rounded-xl">
                                            {isFileAllowed && (
                                                <button
                                                    type="button"
                                                    onClick={() => setSubmissionType('FILE')}
                                                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${submissionType === 'FILE' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                                >
                                                    Subir Archivo
                                                </button>
                                            )}
                                            <button
                                                type="button"
                                                onClick={() => setSubmissionType('URL')}
                                                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${submissionType === 'URL' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                            >
                                                Enlace / URL
                                            </button>
                                        </div>
                                    )}

                                    {submissionType === 'URL' ? (
                                        <div className="space-y-2">
                                            <label className="block text-sm font-bold text-slate-700">Enlace del Trabajo</label>
                                            <input
                                                type="url"
                                                value={url}
                                                onChange={(e) => setUrl(e.target.value)}
                                                placeholder="https://..."
                                                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all outline-none"
                                                required
                                            />
                                        </div>
                                    ) : (
                                        <div className="border-2 border-dashed border-slate-300 bg-slate-50 hover:bg-blue-50/50 rounded-2xl p-10 text-center relative transition-colors group cursor-pointer">
                                            <input
                                                type="file"
                                                onChange={(e) => setFile(e.target.files?.[0] || null)}
                                                className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                                required
                                            />
                                            <div className="p-4 bg-white rounded-full shadow-sm w-16 h-16 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                                                <Upload className="w-8 h-8 text-blue-500" />
                                            </div>
                                            <h4 className="font-bold text-slate-700 mb-1">{file ? file.name : 'Haz clic para subir'}</h4>
                                            <p className="text-xs text-slate-400">{file ? 'Archivo seleccionado' : 'PDF, DOCX, PPTX, Img (Max 10MB)'}</p>
                                        </div>
                                    )}

                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-200 disabled:opacity-50 transition-all flex items-center justify-center gap-2 text-lg"
                                    >
                                        {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
                                        {isSubmitting ? 'Enviando...' : 'Confirmar Entrega'}
                                    </button>
                                </form>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Status Modal */}
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
