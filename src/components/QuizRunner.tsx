'use client';

import { useState, useEffect } from 'react';
import { CheckCircle2, ChevronLeft, ChevronRight, Send, HelpCircle, Clock, AlertTriangle, X } from 'lucide-react';
import { useModals } from './ModalProvider';
import { RATING_TYPES_CONFIG } from '@/lib/quiz-utils';


type QuestionType = 'MULTIPLE_CHOICE' | 'TEXT' | 'RATING';

interface Question {
    id: string;
    type: QuestionType;
    prompt: string;
    options?: string[];
    maxRating?: number;
    ratingType?: 'NUMERIC' | 'SATISFACTION' | 'AGREEMENT' | 'PERFORMANCE' | 'FREQUENCY' | 'INTENSITY';
}

interface QuizRunnerProps {
    assignment: {
        id: string;
        title: string;
        questions: Question[];
    };
    onCancel: () => void;
    onComplete: (submissionId: string) => void;
}

export function QuizRunner({ assignment, onComplete, onCancel }: QuizRunnerProps) {
    const { showAlert, showConfirm } = useModals();
    const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

    const questions = assignment.questions; // Extract questions from assignment prop
    const totalQuestions = questions.length;
    const currentQuestion = questions[currentQuestionIndex];
    const progress = totalQuestions > 0 ? ((currentQuestionIndex + 1) / totalQuestions) * 100 : 0;
    const isLastQuestion = currentQuestionIndex === totalQuestions - 1;
    const hasAnsweredCurrent = !!quizAnswers[currentQuestion?.id];

    const handleNext = () => {
        if (currentQuestionIndex < totalQuestions - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        }
    };

    const handlePrev = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(prev => prev - 1);
        }
    };

    const submitQuiz = async () => {
        if (!assignment?.id) {
            await showAlert("Error", "No se encontró la asignación para este cuestionario.", "error");
            return;
        }

        // Validation: Verify all questions are answered or warn
        const answeredCount = Object.keys(quizAnswers).length;

        if (answeredCount < totalQuestions) {
            const confirmSubmission = await showConfirm(
                "Preguntas pendientes",
                `Has respondido ${answeredCount} de ${totalQuestions} preguntas. ¿Seguro que quieres enviar?`,
                "warning"
            );
            if (!confirmSubmission) return;
        } else {
            const confirmSubmission = await showConfirm(
                "¿Enviar respuestas?",
                "No podrás modificarlas una vez enviadas.",
                "warning"
            );
            if (!confirmSubmission) return;
        }

        setIsSubmitting(true);
        try {
            const res = await fetch('/api/submissions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    assignmentId: assignment.id,
                    answers: quizAnswers,
                    type: 'QUIZ'
                })
            });

            if (res.ok) {
                const data = await res.json();
                onComplete(data.submissionId);
            } else {
                const data = await res.json();
                await showAlert("Error", data.error || "Error al enviar evaluación", "error");
            }
        } catch (error) {
            console.error('Submit error:', error);
            await showAlert("Error", "Error de conexión", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!questions || questions.length === 0) {
        return (
            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-white/90 backdrop-blur-sm p-4 font-[Inter]">
                <div className="bg-white p-8 rounded-xl shadow-xl text-center max-w-md border border-slate-100">
                    <h3 className="text-xl font-bold text-slate-800 mb-2">Cuestionario Vacío</h3>
                    <p className="text-slate-500 mb-6">Este cuestionario no tiene preguntas configuradas.</p>
                    <button onClick={onCancel} className="px-6 py-2 bg-slate-100 text-slate-700 font-bold rounded-lg hover:bg-slate-200 transition-colors">
                        Cerrar
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="fixed inset-0 z-[60] bg-slate-50/95 backdrop-blur-sm font-[Inter] flex flex-col h-full overflow-hidden animate-in fade-in duration-200">
            {/* Header / Progress */}
            <div className="bg-white border-b border-slate-200 px-4 py-4 md:px-8 shrink-0">
                <div className="max-w-3xl mx-auto w-full flex items-center justify-between mb-4">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <div className="bg-purple-100 text-purple-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                                Cuestionario
                            </div>
                            <span className="text-xs text-slate-400 font-medium">
                                Pregunta {currentQuestionIndex + 1} de {totalQuestions}
                            </span>
                        </div>
                        <h2 className="text-lg md:text-xl font-bold text-slate-800 truncate max-w-[200px] md:max-w-md">{assignment.title}</h2>
                    </div>
                    <button onClick={onCancel} className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-100 rounded-full transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Progress Bar */}
                <div className="max-w-3xl mx-auto w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-500 ease-out rounded-full"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>

            {/* Main Content Area - Center the Current Question */}
            <div className="flex-1 overflow-y-auto flex items-center justify-center p-4 md:p-8">
                <div className="w-full max-w-3xl mx-auto">
                    {/* Enter animation key changes when index changes */}
                    <div key={currentQuestion.id} className="animate-in slide-in-from-right-8 fade-in duration-300">
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-10">
                            <h3 className="text-xl md:text-2xl font-bold text-slate-800 mb-8 leading-relaxed">
                                {currentQuestion.prompt}
                            </h3>

                            <div className="space-y-4">
                                {currentQuestion.type === 'TEXT' && (
                                    <div className="relative">
                                        <textarea
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-5 text-lg min-h-[160px] focus:ring-4 focus:ring-purple-100 focus:border-purple-400 outline-none transition-all text-slate-700 placeholder:text-slate-300 resize-none"
                                            placeholder="Escribe tu respuesta detallada aquí..."
                                            value={quizAnswers[currentQuestion.id] || ''}
                                            onChange={(e) => setQuizAnswers({ ...quizAnswers, [currentQuestion.id]: e.target.value })}
                                            autoFocus
                                        />
                                        <div className="absolute bottom-4 right-4 text-xs text-slate-400 font-medium pointer-events-none">
                                            {(quizAnswers[currentQuestion.id] || '').length} caracteres
                                        </div>
                                    </div>
                                )}

                                {currentQuestion.type === 'MULTIPLE_CHOICE' && (
                                    <div className="grid gap-3">
                                        {currentQuestion.options?.map((opt, idx) => {
                                            const isSelected = quizAnswers[currentQuestion.id] === opt;
                                            return (
                                                <label
                                                    key={idx}
                                                    className={`
                                                      relative flex items-center gap-4 p-5 rounded-xl border-2 cursor-pointer transition-all duration-200 group
                                                      ${isSelected
                                                            ? 'bg-purple-50/50 border-purple-500 shadow-md transform scale-[1.01]'
                                                            : 'bg-white border-slate-100 hover:border-purple-200 hover:bg-slate-50'
                                                        }
                                                    `}
                                                >
                                                    <div className={`
                                                        w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors
                                                        ${isSelected
                                                            ? 'border-purple-600 bg-purple-600'
                                                            : 'border-slate-300 group-hover:border-purple-300'
                                                        }
                                                    `}>
                                                        {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-white" />}
                                                    </div>

                                                    <input
                                                        type="radio"
                                                        name={`q-${currentQuestion.id}`}
                                                        value={opt}
                                                        checked={isSelected}
                                                        onChange={() => setQuizAnswers({ ...quizAnswers, [currentQuestion.id]: opt })}
                                                        className="hidden"
                                                    />
                                                    <span className={`text-lg ${isSelected ? 'text-purple-900 font-bold' : 'text-slate-600 font-medium'}`}>
                                                        {opt}
                                                    </span>

                                                    {isSelected && (
                                                        <div className="absolute right-5 text-purple-600 animate-in zoom-in spin-in-180 duration-300">
                                                            <CheckCircle2 className="w-6 h-6" />
                                                        </div>
                                                    )}
                                                </label>
                                            );
                                        })}
                                    </div>
                                )}

                                {currentQuestion.type === 'RATING' && (
                                    <div className="py-8">
                                        <div className="flex justify-between items-center max-w-xl mx-auto">
                                            {Array.from({ length: currentQuestion.maxRating || 5 }, (_, i) => i + 1).map((val) => {
                                                const isSelected = quizAnswers[currentQuestion.id] === val.toString();
                                                return (
                                                    <button
                                                        key={val}
                                                        onClick={() => setQuizAnswers({ ...quizAnswers, [currentQuestion.id]: val.toString() })}
                                                        className={`
                                                            w-12 h-12 md:w-14 md:h-14 rounded-2xl font-bold text-lg md:text-xl transition-all duration-300 flex items-center justify-center
                                                            ${isSelected
                                                                ? 'bg-purple-600 text-white shadow-xl shadow-purple-200 scale-110 -translate-y-2'
                                                                : 'bg-white border-2 border-slate-100 text-slate-400 hover:border-purple-200 hover:text-purple-600 hover:bg-purple-50'
                                                            }
                                                        `}
                                                    >
                                                        {val}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                        <div className="flex justify-between max-w-xl mx-auto mt-6 px-2 text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest text-center">
                                            <span className="max-w-[100px] leading-tight text-left italic">
                                                {RATING_TYPES_CONFIG[currentQuestion.ratingType || 'NUMERIC'].minLabel}
                                            </span>
                                            <span className="max-w-[100px] leading-tight text-right italic">
                                                {RATING_TYPES_CONFIG[currentQuestion.ratingType || 'NUMERIC'].maxLabel}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer / Controls */}
            <div className="bg-white border-t border-slate-200 p-4 shrink-0 z-10">
                <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
                    <button
                        onClick={handlePrev}
                        disabled={currentQuestionIndex === 0}
                        className={`
                            flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all
                            ${currentQuestionIndex === 0
                                ? 'text-slate-300 cursor-not-allowed'
                                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                            }
                        `}
                    >
                        <ChevronLeft className="w-5 h-5" />
                        <span className="hidden md:inline">Anterior</span>
                    </button>

                    <div className="text-sm font-medium text-slate-400 md:hidden">
                        {currentQuestionIndex + 1} / {totalQuestions}
                    </div>

                    {isLastQuestion ? (
                        <button
                            onClick={submitQuiz}
                            disabled={isSubmitting || !hasAnsweredCurrent} // Maybe require answer?
                            className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-purple-200 hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:translate-y-0"
                        >
                            {isSubmitting ? (
                                <span>Enviando...</span>
                            ) : (
                                <>
                                    Finalizar <Send className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    ) : (
                        <button
                            onClick={handleNext}
                            className={`
                                flex items-center gap-2 px-8 py-3 bg-slate-900 text-white font-bold rounded-xl shadow-lg shadow-slate-200 transition-all
                                hover:bg-slate-800 hover:-translate-y-0.5
                            `}
                        >
                            Siguiente <ChevronRight className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
