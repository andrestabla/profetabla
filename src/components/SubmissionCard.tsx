'use client';

import { useState } from 'react';
import { FileIcon, CheckCircle, Clock, Edit2, Gavel, BarChart3, RotateCcw } from 'lucide-react';
import { RubricEditor } from './RubricEditor';
import { GradingModal } from './GradingModal';
import { QuizAnalyticsModal } from './QuizAnalyticsModal';
import { useSession } from 'next-auth/react';
import { resetSubmissionAction } from '@/app/actions/rubric-actions';
import { useModals } from '@/components/ModalProvider';

/* eslint-disable @typescript-eslint/no-explicit-any */
export function SubmissionCard({ assignment }: { assignment: any }) {
    const { data: session } = useSession();
    const { showConfirm, showAlert } = useModals();

    const [submission, setSubmission] = useState<any | null>(
        assignment.submissions?.[0] || null
    );
    const [isRubricOpen, setIsRubricOpen] = useState(false);
    const [isGradingOpen, setIsGradingOpen] = useState(false);
    const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);

    const isLate = assignment.dueDate ? new Date() > new Date(assignment.dueDate) : false;
    const isTeacher = session?.user?.role === 'TEACHER' || session?.user?.role === 'ADMIN';
    const isQuiz = assignment.task?.type === 'QUIZ';

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 relative group">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-bold text-slate-800">{assignment.title}</h3>
                        {isQuiz && (
                            <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-[10px] font-bold rounded uppercase tracking-wider">Quiz</span>
                        )}
                    </div>
                    <p className="text-slate-500 text-sm">{assignment.description}</p>

                    <div className="flex items-center gap-4 mt-2">
                        {/* Rubric Button (Teacher Only) */}
                        {isTeacher && (
                            <button
                                onClick={() => setIsRubricOpen(true)}
                                className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <Edit2 className="w-3 h-3" /> Editar Rúbrica
                            </button>
                        )}

                        {/* Analytics Button (Teacher Only, Quiz Only) */}
                        {isTeacher && isQuiz && (
                            <button
                                onClick={() => setIsAnalyticsOpen(true)}
                                className="text-xs font-bold text-purple-600 hover:text-purple-800 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <BarChart3 className="w-3 h-3" /> Ver Analítica
                            </button>
                        )}
                    </div>
                </div>
                {assignment.dueDate && (
                    <div className={`text-xs px-2 py-1 rounded-full font-medium flex items-center gap-1 ${isLate ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                        <Clock className="w-3 h-3" />
                        {new Date(assignment.dueDate).toLocaleDateString()}
                    </div>
                )}
            </div>

            <div className="mt-6">
                {submission ? (
                    <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                                <CheckCircle className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="font-semibold text-slate-700">{isQuiz ? 'Cuestionario Completado' : 'Tarea Enviada'}</h4>
                                {submission.student && (
                                    <div className="flex items-center gap-2 mt-1 mb-1">
                                        {submission.student.avatarUrl ? (
                                            /* eslint-disable-next-line @next/next/no-img-element */
                                            <img src={submission.student.avatarUrl} alt={submission.student.name} className="w-5 h-5 rounded-full object-cover" />
                                        ) : (
                                            <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-[10px] font-bold text-blue-600">
                                                {submission.student.name?.charAt(0) || '?'}
                                            </div>
                                        )}
                                        <span className="text-sm font-medium text-slate-600">{submission.student.name}</span>
                                    </div>
                                )}
                                <p className="text-xs text-slate-400">
                                    {new Date(submission.createdAt).toLocaleString()}
                                </p>
                            </div>
                            {isTeacher && (
                                <div className="ml-auto flex items-center gap-2">
                                    {isQuiz && (
                                        <button
                                            onClick={async () => {
                                                const confirm = await showConfirm(
                                                    "¿Reiniciar Cuestionario?",
                                                    "Esta acción eliminará la entrega actual de este estudiante. No se puede deshacer.",
                                                    "danger"
                                                );
                                                if (confirm) {
                                                    const res = await resetSubmissionAction(submission.id);
                                                    if (res.success) {
                                                        await showAlert("Cuestionario Reiniciado", "La entrega ha sido eliminada.", "success");
                                                        setSubmission(null);
                                                    } else {
                                                        await showAlert("Error", res.error, "error");
                                                    }
                                                }
                                            }}
                                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                                            title="Reiniciar Cuestionario"
                                        >
                                            <RotateCcw className="w-4 h-4" />
                                        </button>
                                    )}
                                    <button
                                        onClick={() => setIsGradingOpen(true)}
                                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm transition-colors"
                                    >
                                        <Gavel className="w-3 h-3" /> Calificar
                                    </button>
                                </div>
                            )}
                        </div>

                        {!isQuiz && (
                            <div className="flex items-center gap-2 text-sm text-slate-600 bg-white p-2 rounded border border-slate-100 mb-3">
                                <FileIcon className="w-4 h-4 text-slate-400" />
                                <a href={submission.fileUrl} target="_blank" className="truncate hover:underline hover:text-blue-600">
                                    {submission.fileName}
                                </a>
                            </div>
                        )}

                        {submission.grade !== null && (
                            <div className="mt-3 pt-3 border-t border-slate-200">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm font-bold text-slate-600">Calificación:</span>
                                    <span className="text-xl font-bold text-blue-600">{submission.grade} pts</span>
                                </div>
                                {submission.feedback && (
                                    <div className="text-sm text-slate-500 italic bg-amber-50 p-2 rounded border border-amber-100">
                                        &quot;{submission.feedback}&quot;
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="text-center py-6 border-2 border-dashed border-slate-200 rounded-lg">
                        <p className="text-sm text-slate-400">Sin entrega aún</p>
                    </div>
                )}
            </div>

            {/* Modals */}
            {isRubricOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <RubricEditor
                        assignmentId={assignment.id}
                        initialItems={assignment.rubricItems || []}
                        onClose={() => setIsRubricOpen(false)}
                    />
                </div>
            )}

            {isGradingOpen && submission && (
                <GradingModal
                    submission={submission}
                    rubricItems={assignment.rubricItems || []}
                    quizData={assignment.task?.type === 'QUIZ' ? assignment.task.quizData : null}
                    onClose={() => setIsGradingOpen(false)}
                />
            )}

            {isAnalyticsOpen && (
                <QuizAnalyticsModal
                    assignment={assignment}
                    onClose={() => setIsAnalyticsOpen(false)}
                />
            )}
        </div>
    );
}

