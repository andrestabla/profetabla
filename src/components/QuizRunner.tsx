'use client';

import { useState } from 'react';
import { X, Send } from 'lucide-react';

 
type QuestionType = 'MULTIPLE_CHOICE' | 'TEXT' | 'RATING';

interface Question {
    id: string;
    type: QuestionType;
    prompt: string;
    options?: string[];
}

interface QuizRunnerProps {
    title: string;
    questions: Question[];
    assignmentId?: string;
    onClose: () => void;
    onSuccess?: () => void;
}

export function QuizRunner({ title, questions, assignmentId, onClose, onSuccess }: QuizRunnerProps) {
    const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const submitQuiz = async () => {
        if (!assignmentId) {
            alert("Error: No se encontró la asignación para este cuestionario.");
            return;
        }
        if (!confirm("¿Enviar respuestas? No podrás modificarlas.")) return;

        setIsSubmitting(true);
        try {
            const res = await fetch('/api/submissions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    assignmentId: assignmentId,
                    answers: quizAnswers,
                    type: 'QUIZ'
                })
            });

            if (res.ok) {
                alert("Evaluación enviada correctamente");
                if (onSuccess) onSuccess();
                onClose();
            } else {
                const data = await res.json();
                alert(data.error || "Error al enviar evaluación");
            }
        } catch (e) {
            console.error(e);
            alert("Error de conexión");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-white p-4 font-[Inter] animate-in slide-in-from-bottom-5 duration-200">
            <div className="w-full max-w-2xl h-full max-h-[90vh] flex flex-col bg-white rounded-xl shadow-none md:shadow-2xl md:border md:border-slate-100">
                <div className="flex justify-between items-center p-6 border-b border-slate-100">
                    <div>
                        <span className="text-xs font-bold text-purple-600 uppercase tracking-wider">Cuestionario</span>
                        <h2 className="text-2xl font-bold text-slate-800">{title}</h2>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors p-2 hover:bg-slate-50 rounded-full">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto space-y-8 p-6 bg-slate-50/50">
                    {questions.length === 0 && (
                        <div className="text-center py-10 text-slate-400">
                            No hay preguntas configuradas para este cuestionario.
                        </div>
                    )}

                    {questions.map((q, i) => (
                        <div key={q.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm transition-shadow hover:shadow-md">
                            <h3 className="font-bold text-slate-700 mb-4 flex gap-3 text-lg">
                                <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded-md text-sm flex items-center justify-center h-7 w-7 shrink-0 font-mono mt-0.5">{i + 1}</span>
                                {q.prompt}
                            </h3>

                            {q.type === 'TEXT' && (
                                <textarea
                                    className="w-full border border-slate-300 rounded-xl p-4 h-32 focus:ring-4 focus:ring-purple-100 focus:border-purple-400 outline-none transition-all text-slate-700 placeholder:text-slate-300"
                                    placeholder="Escribe tu respuesta aquí..."
                                    value={quizAnswers[q.id] || ''}
                                    onChange={(e) => setQuizAnswers({ ...quizAnswers, [q.id]: e.target.value })}
                                />
                            )}

                            {q.type === 'MULTIPLE_CHOICE' && (
                                <div className="space-y-3">
                                    {q.options?.map((opt, idx) => (
                                        <label key={idx} className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all group ${quizAnswers[q.id] === opt ? 'bg-purple-50 border-purple-500 shadow-sm ring-1 ring-purple-500' : 'bg-white border-slate-200 hover:border-purple-300 hover:bg-slate-50'}`}>
                                            <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-colors ${quizAnswers[q.id] === opt ? 'border-purple-600 bg-purple-600' : 'border-slate-300 group-hover:border-purple-400'}`}>
                                                {quizAnswers[q.id] === opt && <div className="w-2 h-2 rounded-full bg-white" />}
                                            </div>
                                            <input
                                                type="radio"
                                                name={`q-${q.id}`}
                                                value={opt}
                                                checked={quizAnswers[q.id] === opt}
                                                onChange={() => setQuizAnswers({ ...quizAnswers, [q.id]: opt })}
                                                className="hidden"
                                            />
                                            <span className={`text-base ${quizAnswers[q.id] === opt ? 'text-purple-900 font-medium' : 'text-slate-600'}`}>{opt}</span>
                                        </label>
                                    ))}
                                </div>
                            )}

                            {q.type === 'RATING' && (
                                <div className="flex justify-between px-2 md:px-8 py-4">
                                    {[1, 2, 3, 4, 5].map((val) => (
                                        <button
                                            key={val}
                                            onClick={() => setQuizAnswers({ ...quizAnswers, [q.id]: val.toString() })}
                                            className={`w-12 h-12 md:w-14 md:h-14 rounded-full font-bold text-lg md:text-xl transition-all flex items-center justify-center ${quizAnswers[q.id] === val.toString() ? 'bg-purple-600 text-white shadow-lg scale-110 ring-4 ring-purple-100' : 'bg-white border-2 border-slate-100 text-slate-400 hover:border-purple-200 hover:text-purple-600 hover:bg-purple-50'}`}
                                        >
                                            {val}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                <div className="p-6 border-t border-slate-100 bg-white rounded-b-xl z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                    <button
                        onClick={submitQuiz}
                        disabled={isSubmitting}
                        className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-purple-500/20 disabled:opacity-70 disabled:cursor-not-allowed hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 text-lg"
                    >
                        {isSubmitting ? (
                            <span>Enviando...</span>
                        ) : (
                            <>
                                <Send className="w-5 h-5" /> Enviar Respuestas
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
