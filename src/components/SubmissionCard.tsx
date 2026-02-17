'use client';

import { useState } from 'react';
import { FileIcon, CheckCircle, Clock, Edit2, Gavel, BarChart3, RotateCcw } from 'lucide-react';
import { RubricEditor } from './RubricEditor';
// import { GradingModal } from './GradingModal'; // Removed
import { QuizAnalyticsModal } from './QuizAnalyticsModal';
import { useSession } from 'next-auth/react';
import { createManualSubmissionAction, resetSubmissionAction } from '@/app/actions/rubric-actions';
import { useModals } from '@/components/ModalProvider';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

/* eslint-disable @typescript-eslint/no-explicit-any */
export function SubmissionCard({ assignment, projectStudents = [] }: { assignment: any, projectStudents?: any[] }) {
    const { data: session } = useSession();
    const { showConfirm, showAlert } = useModals();
    const router = useRouter();
    const [isCreating, setIsCreating] = useState<string | null>(null);
    const [isRubricOpen, setIsRubricOpen] = useState(false);
    const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);

    const submissions = assignment.submissions || [];
    const submittedStudentIds = new Set(submissions.map((s: any) => s.studentId || s.student?.id));

    // Calculate non-submitters who are in the project but haven't submitted this assignment
    const nonSubmitters = projectStudents.filter(student => !submittedStudentIds.has(student.id));

    const isLate = assignment.dueDate ? new Date() > new Date(assignment.dueDate) : false;
    const isTeacher = session?.user?.role === 'TEACHER' || session?.user?.role === 'ADMIN';
    const isQuiz = assignment.task?.type === 'QUIZ';

    const handleCreateManualGrade = async (studentId: string) => {
        setIsCreating(studentId);
        try {
            const res = await createManualSubmissionAction(assignment.id, studentId);
            if (res.success && res.submissionId) {
                router.push(`/dashboard/professor/grading/${res.submissionId}`);
            } else {
                await showAlert("Error", res.error || "No se pudo crear la calificación manual", "error");
            }
        } catch (e) {
            console.error(e);
            await showAlert("Error", "Error inesperado", "error");
        } finally {
            setIsCreating(null);
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 relative group h-full flex flex-col">
            <div className="flex justify-between items-start mb-4 shrink-0">
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
                    <div className={`text-xs px-2 py-1 rounded-full font-medium flex items-center gap-1 shrink-0 ${isLate ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                        <Clock className="w-3 h-3" />
                        {new Date(assignment.dueDate).toLocaleDateString()}
                    </div>
                )}
            </div>

            <div className="mt-4 flex-1 overflow-auto space-y-4 pr-1 custom-scrollbar">
                {submissions.length > 0 || (isTeacher && nonSubmitters.length > 0) ? (
                    <>
                        {/* Render existing submissions */}
                        {submissions.map((sub: any) => (
                            <div key={sub.id} className="bg-slate-50 rounded-xl p-4 border border-slate-200 hover:border-blue-200 transition-all">
                                <div className="flex items-center justify-between gap-3 mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 md:w-10 md:h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600 shrink-0">
                                            <CheckCircle className="w-4 h-4 md:w-5 md:h-5" />
                                        </div>
                                        <div className="min-w-0">
                                            {sub.student && (
                                                <div className="flex items-center gap-2 mb-0.5">
                                                    {sub.student.avatarUrl ? (
                                                        <img src={sub.student.avatarUrl} alt={sub.student.name} className="w-4 h-4 rounded-full object-cover" />
                                                    ) : (
                                                        <div className="w-4 h-4 rounded-full bg-blue-100 flex items-center justify-center text-[8px] font-bold text-blue-600">
                                                            {sub.student.name?.charAt(0) || '?'}
                                                        </div>
                                                    )}
                                                    <span className="text-xs font-bold text-slate-700 truncate">{sub.student.name}</span>
                                                </div>
                                            )}
                                            <p className="text-[10px] text-slate-400 font-medium">
                                                Entregado: {new Date(sub.createdAt).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>

                                    {isTeacher && (
                                        <div className="flex items-center gap-2 shrink-0">
                                            <button
                                                onClick={async () => {
                                                    const confirm = await showConfirm(
                                                        "¿Reiniciar Entrega?",
                                                        `¿Estás seguro de reiniciar la entrega de ${sub.student?.name}? Esta acción eliminará la entrega actual y permitirá un nuevo intento. No se puede deshacer.`,
                                                        "danger"
                                                    );
                                                    if (confirm) {
                                                        const res = await resetSubmissionAction(sub.id);
                                                        if (res.success) {
                                                            await showAlert("Éxito", "Entrega reiniciada.", "success");
                                                            window.location.reload();
                                                        } else {
                                                            await showAlert("Error", res.error || "Algo salió mal", "error");
                                                        }
                                                    }
                                                }}
                                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                                                title="Reiniciar Entrega"
                                            >
                                                <RotateCcw className="w-4 h-4" />
                                            </button>
                                            <Link
                                                href={`/dashboard/professor/grading/${sub.id}`}
                                                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 shadow-sm transition-colors"
                                            >
                                                <Gavel className="w-3 h-3" /> Calificar
                                            </Link>
                                        </div>
                                    )}
                                </div>

                                {!isQuiz && sub.fileUrl && (
                                    <div className="flex items-center gap-2 text-[11px] text-slate-600 bg-white p-2 rounded border border-slate-100 mb-3 group/file">
                                        <FileIcon className="w-3.5 h-3.5 text-slate-400" />
                                        <a href={sub.fileUrl} target="_blank" className="truncate hover:underline hover:text-blue-600 font-medium">
                                            {sub.fileName}
                                        </a>
                                    </div>
                                )}

                                {!sub.fileUrl && sub.fileType === 'MANUAL' && (
                                    <div className="flex items-center gap-2 text-[10px] text-amber-600 bg-amber-50 p-2 rounded border border-amber-100 mb-3">
                                        <Edit2 className="w-3.5 h-3.5" />
                                        <span>Evaluación manual: Sin archivo adjunto</span>
                                    </div>
                                )}

                                {sub.grade !== null && (
                                    <div className="mt-2 pt-2 border-t border-slate-200">
                                        <div className="flex justify-between items-center bg-blue-50/50 px-2 py-1.5 rounded-lg border border-blue-100/50">
                                            <span className="text-[10px] font-bold text-blue-800 uppercase tracking-wider">Calificación:</span>
                                            <span className="text-sm font-black text-blue-600">{sub.grade} pts</span>
                                        </div>
                                        {sub.feedback && (
                                            <div className="mt-2 text-[10px] text-slate-500 italic bg-amber-50/50 p-2 rounded border border-amber-100/50 leading-relaxed">
                                                &quot;{sub.feedback}&quot;
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}

                        {/* Render non-submitters (Teacher only) */}
                        {isTeacher && nonSubmitters.map((student: any) => (
                            <div key={student.id} className="bg-white rounded-xl p-4 border border-slate-100 border-dashed hover:border-slate-200 transition-all">
                                <div className="flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-3 opacity-60">
                                        <div className="w-8 h-8 md:w-10 md:h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 shrink-0">
                                            <Clock className="w-4 h-4 md:w-5 md:h-5" />
                                        </div>
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2 mb-0.5">
                                                {student.avatarUrl ? (
                                                    <img src={student.avatarUrl} alt={student.name} className="w-4 h-4 rounded-full object-cover" />
                                                ) : (
                                                    <div className="w-4 h-4 rounded-full bg-slate-200 flex items-center justify-center text-[8px] font-bold text-slate-500">
                                                        {student.name?.charAt(0) || '?'}
                                                    </div>
                                                )}
                                                <span className="text-xs font-bold text-slate-600 truncate">{student.name}</span>
                                            </div>
                                            <p className="text-[10px] text-slate-400 font-medium">Sin entregas por ahora</p>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => handleCreateManualGrade(student.id)}
                                        disabled={isCreating === student.id}
                                        className="px-3 py-1.5 bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-600 rounded-lg text-[10px] font-bold flex items-center gap-1 shadow-sm transition-all disabled:opacity-50"
                                    >
                                        {isCreating === student.id ? (
                                            <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                        ) : (
                                            <Gavel className="w-3 h-3" />
                                        )}
                                        Calificar
                                    </button>
                                </div>
                            </div>
                        ))}
                    </>
                ) : (
                    <div className="text-center py-10 border-2 border-dashed border-slate-100 rounded-xl bg-slate-50/30 flex flex-col items-center justify-center">
                        <div className="p-3 bg-white rounded-full shadow-sm mb-3">
                            <Clock className="w-5 h-5 text-slate-300" />
                        </div>
                        <p className="text-sm text-slate-400 font-medium">Sin entregas por ahora</p>
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

            {isAnalyticsOpen && (
                <QuizAnalyticsModal
                    assignment={assignment}
                    onClose={() => setIsAnalyticsOpen(false)}
                />
            )}
        </div>
    );
}
