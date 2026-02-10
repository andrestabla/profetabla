'use client';

import React from 'react';
import { CheckCircle2, XCircle, HelpCircle, ChevronLeft } from 'lucide-react';

interface Question {
    id: string;
    type: 'MULTIPLE_CHOICE' | 'TEXT' | 'RATING';
    prompt: string;
    options?: string[];
    correctAnswer?: string;
    points?: number;
}

interface QuizResultViewProps {
    questions: Question[];
    answers: Record<string, string>;
    gradingMethod?: 'AUTO' | 'MANUAL';
    onBack: () => void;
}

export function QuizResultView({ questions, answers, gradingMethod, onBack }: QuizResultViewProps) {
    return (
        <div className="flex flex-col h-full bg-white font-[Inter]">
            <div className="flex items-center gap-4 mb-8">
                <button
                    onClick={onBack}
                    className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500"
                >
                    <ChevronLeft className="w-6 h-6" />
                </button>
                <h2 className="text-2xl font-bold text-slate-800">Resultados de la Evaluación</h2>
            </div>

            <div className="flex-1 overflow-y-auto space-y-8 pr-2 custom-scrollbar">
                {questions.map((q, i) => {
                    const studentAnswer = answers[q.id];
                    const isCorrect = q.type === 'MULTIPLE_CHOICE' && q.correctAnswer === studentAnswer;
                    const showCorrection = q.type === 'MULTIPLE_CHOICE' && q.correctAnswer;

                    return (
                        <div key={q.id} className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                            <div className="flex justify-between items-start mb-4">
                                <h3 className="font-bold text-slate-700 flex gap-2">
                                    <span className="bg-slate-200 text-slate-600 px-2 rounded-md text-sm flex items-center justify-center h-6 w-6">{i + 1}</span>
                                    {q.prompt}
                                </h3>
                                {gradingMethod === 'AUTO' && q.type === 'MULTIPLE_CHOICE' && q.correctAnswer && (
                                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${isCorrect ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                        {isCorrect ? 'Correcta' : 'Incorrecta'}
                                    </span>
                                )}
                            </div>

                            <div className="space-y-3">
                                {q.type === 'TEXT' && (
                                    <div className="bg-white border border-slate-200 rounded-lg p-4 text-slate-600 italic">
                                        <p className="text-xs font-bold text-slate-400 uppercase mb-2">Tu respuesta:</p>
                                        {studentAnswer || 'Sin respuesta'}
                                    </div>
                                )}

                                {q.type === 'MULTIPLE_CHOICE' && (
                                    <div className="space-y-2">
                                        {q.options?.map((opt, idx) => {
                                            const isStudentSelected = studentAnswer === opt;
                                            const isCorrectChoice = q.correctAnswer === opt;

                                            let borderClass = 'border-slate-200 bg-white';
                                            let icon = null;

                                            if (isStudentSelected) {
                                                if (showCorrection) {
                                                    borderClass = isCorrectChoice ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50';
                                                    icon = isCorrectChoice ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <XCircle className="w-4 h-4 text-red-600" />;
                                                } else {
                                                    borderClass = 'border-blue-500 bg-blue-50';
                                                }
                                            } else if (isCorrectChoice && showCorrection) {
                                                borderClass = 'border-green-200 bg-green-50/50';
                                            }

                                            return (
                                                <div key={idx} className={`flex items-center justify-between p-3 rounded-lg border text-sm transition-all ${borderClass}`}>
                                                    <span className={`${isStudentSelected ? 'font-bold' : ''} ${isStudentSelected && !isCorrectChoice && showCorrection ? 'text-red-700' : isCorrectChoice && showCorrection ? 'text-green-700' : 'text-slate-600'}`}>
                                                        {opt}
                                                        {isStudentSelected && <span className="ml-2 text-[10px] opacity-70">(Tu elección)</span>}
                                                    </span>
                                                    {icon}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}

                                {q.type === 'RATING' && (
                                    <div className="flex justify-between px-4 py-2 bg-white rounded-lg border border-slate-100">
                                        {[1, 2, 3, 4, 5].map((val) => (
                                            <div
                                                key={val}
                                                className={`w-10 h-10 rounded-full font-bold text-sm flex items-center justify-center transition-all ${studentAnswer === val.toString() ? 'bg-blue-600 text-white shadow-lg scale-110' : 'bg-slate-50 text-slate-300'}`}
                                            >
                                                {val}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
