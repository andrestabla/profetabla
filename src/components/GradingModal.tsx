'use client';

import { useState } from 'react';
import { gradeSubmissionAction, resetSubmissionAction } from '@/app/actions/rubric-actions';
import { Loader2, Save, X, FileText, Download, AlertTriangle, RotateCcw } from 'lucide-react';
import { useModals } from '@/components/ModalProvider';
import { cn } from '@/lib/utils';

/* eslint-disable @typescript-eslint/no-explicit-any */
type RubricItem = {
    id: string;
    criterion: string;
    maxPoints: number;
    order: number;
};



type Submission = {
    id: string;
    fileUrl?: string | null;
    fileName?: string | null;
    answers?: any; // JSON for quiz answers
    type?: 'FILE' | 'URL' | 'QUIZ';
    student: {
        name: string | null;
        email: string;
    };
    rubricScores: { rubricItemId: string; score: number; feedback: string | null }[];
    feedback?: string | null;
};

interface GradingModalProps {
    submission: Submission;
    rubricItems: RubricItem[];
    quizData?: {
        questions: any[];
        gradingMethod?: 'AUTO' | 'MANUAL';
    } | null;
    onClose: () => void;
}

export function GradingModal({ submission, rubricItems, quizData, onClose }: GradingModalProps) {
    const { showAlert, showConfirm } = useModals();
    const [scores, setScores] = useState<{ [key: string]: { score: number; feedback: string } }>(() => {
        const initialScores: any = {};
        rubricItems.forEach(item => {
            const existing = submission.rubricScores.find(s => s.rubricItemId === item.id);
            initialScores[item.id] = {
                score: existing ? existing.score : item.maxPoints,
                feedback: existing?.feedback || ''
            };
        });
        return initialScores;
    });

    // Quiz Grading State
    // Default to the quiz's configured method, or AUTO as fallback
    const [gradingMode, setGradingMode] = useState<'AUTO' | 'MANUAL'>(
        quizData?.gradingMethod === 'MANUAL' ? 'MANUAL' : 'AUTO'
    );
    const [manualScore, setManualScore] = useState<number>(0);

    const [generalFeedback, setGeneralFeedback] = useState(submission.feedback || '');
    const [isSaving, setIsSaving] = useState(false);

    const isQuiz = submission.type === 'QUIZ' || (!!submission.answers && !submission.fileUrl);

    // Initial Auto-Calculation Effect
    const calculateAutoScore = () => {
        if (!quizData?.questions) return 0;
        let total = 0;
        quizData.questions.forEach((q: any) => {
            const answer = submission.answers?.[q.id];
            if (q.type === 'RATING') {
                const val = parseInt(answer);
                if (!isNaN(val)) {
                    // Assuming scale is 1-5, awarded points are proportional
                    total += (val / 5) * (q.points || 1);
                }
            } else if (q.correctAnswer && answer === q.correctAnswer) {
                total += (q.points || 1);
            }
        });
        return Math.round(total * 10) / 10;
    };

    // Calculate Max Score for Quiz
    const maxQuizScore = quizData?.questions?.reduce((acc: number, q: any) => acc + (q.points || 1), 0) || 0;
    const autoScore = calculateAutoScore();

    const handleScoreChange = (itemId: string, val: number) => {
        setScores(prev => ({
            ...prev,
            [itemId]: { ...prev[itemId], score: val }
        }));
    };

    const handleFeedbackChange = (itemId: string, val: string) => {
        setScores(prev => ({
            ...prev,
            [itemId]: { ...prev[itemId], feedback: val }
        }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        const scoresPayload = Object.entries(scores).map(([itemId, data]) => ({
            rubricItemId: itemId,
            score: data.score,
            feedback: data.feedback
        }));

        const finalQuizScore = isQuiz ? (gradingMode === 'AUTO' ? autoScore : manualScore) : undefined;

        const res = await gradeSubmissionAction(submission.id, scoresPayload, generalFeedback, finalQuizScore);
        if (res.success) {
            await showAlert("Calificación Guardada", "La evaluación se ha registrado correctamente.", "success");
            onClose();
        } else {
            await showAlert("Error", "No se pudo guardar la calificación: " + res.error, "error");
        }
        setIsSaving(false);
    };

    const handleReset = async () => {
        const confirm = await showConfirm(
            "¿Reiniciar Cuestionario?",
            "Esta acción eliminará la entrega actual y permitirá que el estudiante realice el cuestionario nuevamente. No se puede deshacer.",
            "danger"
        );

        if (confirm) {
            setIsSaving(true);
            const res = await resetSubmissionAction(submission.id);
            if (res.success) {
                await showAlert("Cuestionario Reiniciado", "La entrega ha sido eliminada correctamente.", "success");
                onClose();
            } else {
                await showAlert("Error", "No se pudo reiniciar: " + res.error, "error");
            }
            setIsSaving(false);
        }
    };

    const currentTotal = Object.values(scores).reduce((sum, item) => sum + item.score, 0);
    const maxTotal = rubricItems.reduce((sum, item) => sum + item.maxPoints, 0);

    const quizScoreResult = isQuiz ? (gradingMode === 'AUTO' ? autoScore : manualScore) : 0;
    const displayedTotal = rubricItems.length > 0 ? currentTotal : quizScoreResult;
    const displayedMax = rubricItems.length > 0 ? maxTotal : (isQuiz ? maxQuizScore : 0);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl h-[90vh] flex overflow-hidden animate-in zoom-in-95 duration-200">

                {/* Left: Content Viewer (File or Quiz) */}
                <div className="w-1/2 bg-slate-100 border-r border-slate-200 flex flex-col">
                    <div className="bg-white p-4 border-b border-slate-200 flex justify-between items-center shadow-sm z-10">
                        <div>
                            <h4 className="font-bold text-slate-800">{isQuiz ? 'Respuestas del Cuestionario' : submission.fileName}</h4>
                            <p className="text-xs text-slate-500">{submission.student.name || submission.student.email}</p>
                        </div>
                        {!isQuiz && submission.fileUrl && (
                            <a href={submission.fileUrl} target="_blank" rel="noopener noreferrer" className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors" title="Descargar / Abrir original">
                                <Download className="w-5 h-5" />
                            </a>
                        )}
                    </div>

                    <div className="flex-1 overflow-y-auto relative bg-slate-50/50">
                        {isQuiz ? (
                            <div className="p-6 space-y-6">
                                {quizData?.questions?.map((q: any, i: number) => {
                                    const answer = submission.answers?.[q.id];
                                    return (
                                        <div key={q.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                            <div className="flex gap-3 mb-2">
                                                <span className="bg-purple-100 text-purple-700 font-bold px-2 py-0.5 rounded text-xs h-fit mt-0.5">{i + 1}</span>
                                                <p className="font-bold text-slate-800 text-sm">{q.prompt}</p>
                                            </div>
                                            <div className="ml-9 p-3 bg-slate-50 rounded-lg border border-slate-100 text-sm text-slate-700">
                                                {answer || <span className="text-slate-400 italic">Sin respuesta</span>}
                                                {q.type === 'RATING' && answer && (
                                                    <span className="ml-2 text-[10px] font-bold text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded">
                                                        {(parseInt(answer) / 5 * (q.points || 1)).toFixed(1)} / {q.points || 1} pts
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    )
                                }) || (
                                        <div className="text-center p-10 text-slate-400">
                                            No se pudieron cargar las preguntas del cuestionario.
                                            <pre className="text-xs mt-2 text-left bg-slate-200 p-2 rounded overflow-auto">
                                                {JSON.stringify(submission.answers, null, 2)}
                                            </pre>
                                        </div>
                                    )}
                            </div>
                        ) : (
                            submission.fileUrl ? (
                                submission.fileUrl.includes('drive.google.com') ? (
                                    <iframe
                                        src={submission.fileUrl.replace('/view', '/preview')}
                                        className="w-full h-full border-0"
                                        title="Visor de Documento"
                                    />
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full text-slate-400">
                                        <FileText className="w-16 h-16 mb-4" />
                                        <p>Vista previa no disponible</p>
                                        <a href={submission.fileUrl} target="_blank" className="text-blue-500 underline text-sm mt-2">Abrir archivo</a>
                                    </div>
                                )
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-slate-400">
                                    <AlertTriangle className="w-16 h-16 mb-4 text-amber-400" />
                                    <p>No hay archivo adjunto ni datos de cuestionario.</p>
                                </div>
                            )
                        )}
                    </div>
                </div>

                {/* Right: Grading Panel */}
                <div className="w-1/2 flex flex-col bg-white">
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10">
                        <h3 className="text-xl font-bold text-slate-800">Evaluación</h3>
                        <div className="flex items-center gap-4">
                            <div className="text-right">
                                <span className="block text-xs uppercase text-slate-400 font-bold tracking-wider">Nota Final</span>
                                <span className={`text-2xl font-black ${displayedTotal >= (displayedMax || 1) * 0.6 ? 'text-green-600' : 'text-amber-600'}`}>
                                    {displayedTotal} <span className="text-slate-300 text-lg">/ {displayedMax}</span>
                                </span>
                            </div>
                            <button onClick={async () => {
                                const confirm = await showConfirm("¿Cerrar evaluación?", "Se perderán los cambios no guardados.", "warning");
                                if (confirm) onClose();
                            }} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-8">
                        {isQuiz ? (
                            <div className="space-y-6">
                                {/* Auto/Manual Toggle */}
                                <div className="bg-slate-50 p-1 rounded-xl border border-slate-200 flex text-sm font-bold">
                                    <button
                                        onClick={() => setGradingMode('AUTO')}
                                        className={`flex-1 py-2 rounded-lg transition-all ${gradingMode === 'AUTO' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                    >
                                        Automático
                                    </button>
                                    <button
                                        onClick={() => setGradingMode('MANUAL')}
                                        className={`flex-1 py-2 rounded-lg transition-all ${gradingMode === 'MANUAL' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                    >
                                        Manual
                                    </button>
                                </div>

                                {gradingMode === 'AUTO' && (
                                    <div className="p-6 bg-blue-50 border border-blue-100 rounded-xl text-center">
                                        <p className="text-slate-500 text-sm mb-2">Puntuación calculada automáticamente</p>
                                        <div className="text-4xl font-black text-blue-600">
                                            {autoScore} <span className="text-xl text-blue-300">/ {maxQuizScore}</span>
                                        </div>
                                        <p className="text-xs text-blue-400 mt-2">Basado en {quizData?.questions?.filter(q => q.correctAnswer).length || 0} respuestas configuradas</p>
                                    </div>
                                )}

                                {gradingMode === 'MANUAL' && (
                                    <div className="p-6 bg-white border border-slate-200 rounded-xl shadow-sm">
                                        <label className="block text-sm font-bold text-slate-700 mb-2">Ingresa la Calificación Manual</label>
                                        <input
                                            type="number"
                                            min="0"
                                            max={maxQuizScore}
                                            value={manualScore}
                                            onChange={(e) => setManualScore(parseInt(e.target.value) || 0)}
                                            className="w-full text-3xl font-bold p-4 text-center border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                        />
                                        <p className="text-xs text-center text-slate-400 mt-2">Máximo sugerido: {maxQuizScore} pts</p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            // FILE SUBMISSION GRADING (Existing Rubric Logic)
                            rubricItems.length === 0 ? (
                                <div className="text-center py-20 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                    <p className="text-slate-500">No hay rúbrica definida para esta tarea.</p>
                                    <p className="text-xs text-slate-400 mt-1">Define los criterios en la pantalla anterior.</p>

                                    {/* Manual Score Override if no rubric? */}
                                    <div className="mt-4 pt-4 border-t border-slate-200">
                                        <p className="text-xs font-bold text-slate-400 mb-2">CALIFICACIÓN MANUAL</p>
                                        <p className="text-xs text-amber-600">Para calificar sin rúbrica, edita la tarea y añade criterios.</p>
                                    </div>
                                </div>
                            ) : (
                                rubricItems.map((item) => {
                                    const currentScore = scores[item.id]?.score || 0;
                                    return (
                                        <div key={item.id} className="animate-in slide-in-from-right-4 duration-500">
                                            <div className="flex justify-between items-baseline mb-2">
                                                <label className="font-bold text-slate-700">{item.criterion}</label>
                                                <span className="font-mono text-sm font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                                                    {currentScore} / {item.maxPoints} pts
                                                </span>
                                            </div>

                                            <input
                                                type="range"
                                                min="0"
                                                max={item.maxPoints}
                                                value={currentScore}
                                                onChange={(e) => handleScoreChange(item.id, parseInt(e.target.value))}
                                                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600 hover:accent-blue-700 mb-3"
                                            />

                                            <textarea
                                                value={scores[item.id]?.feedback || ''}
                                                onChange={(e) => handleFeedbackChange(item.id, e.target.value)}
                                                placeholder="Feedback específico para este criterio..."
                                                className="w-full text-sm border-slate-200 rounded-lg focus:ring-blue-500 min-h-[60px] resize-y bg-slate-50 placeholder-slate-400"
                                            />
                                        </div>
                                    );
                                })
                            )
                        )}

                        {/* General Feedback Section */}
                        <div className="pt-6 border-t border-slate-100">
                            <h4 className="font-bold text-slate-800 mb-2">Feedback General</h4>
                            <textarea
                                value={generalFeedback}
                                onChange={(e) => setGeneralFeedback(e.target.value)}
                                placeholder="Comentarios generales sobre la entrega..."
                                className="w-full text-sm border-slate-200 rounded-lg focus:ring-blue-500 min-h-[100px] resize-y bg-white placeholder-slate-400 p-3 shadow-sm border"
                            />
                        </div>
                    </div>

                    <div className="p-6 border-t border-slate-100 bg-slate-50 flex gap-3">
                        {isQuiz && (
                            <button
                                onClick={handleReset}
                                disabled={isSaving}
                                className="flex-1 py-3 bg-white border border-slate-200 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 text-slate-600 rounded-xl font-bold flex items-center justify-center gap-2 transition-all"
                                title="Reiniciar entrega para que el estudiante pueda repetir"
                            >
                                <RotateCcw className="w-5 h-5" />
                                Reiniciar
                            </button>
                        )}
                        <button
                            onClick={handleSave}
                            disabled={isSaving || (rubricItems.length === 0 && !isQuiz)} // Allow save for quiz without rubric
                            className={cn(
                                "py-3 text-white rounded-xl font-bold shadow-lg disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2 transition-all",
                                isQuiz ? "flex-[2] bg-blue-600 hover:bg-blue-700 shadow-blue-200" : "w-full bg-blue-600 hover:bg-blue-700 shadow-blue-200"
                            )}
                        >
                            {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                            Guardar Evaluación
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
