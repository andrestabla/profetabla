'use client';

import { useState } from 'react';
import { gradeSubmissionAction, resetSubmissionAction } from '@/app/actions/rubric-actions';
import { type AIGradeResponse } from '@/types/grading';
import { calculateTotalQuizScore, calculateMaxQuizScore } from '@/lib/quiz-utils';
import { Loader2, Save, FileText, Download, AlertTriangle, RotateCcw, Sparkles, ArrowLeft } from 'lucide-react';
import { useModals } from '@/components/ModalProvider';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

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

interface GradingClientProps {
    submission: Submission;
    rubricItems: RubricItem[];
    quizData?: {
        questions: any[];
        gradingMethod?: 'AUTO' | 'MANUAL';
    } | null;
    projectId?: string; // Optional, for "Back to Dashboard" link context if needed
}

export default function GradingClient({ submission, rubricItems, quizData }: GradingClientProps) {
    const router = useRouter();
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
    const [gradingMode, setGradingMode] = useState<'AUTO' | 'MANUAL'>(
        quizData?.gradingMethod === 'MANUAL' ? 'MANUAL' : 'AUTO'
    );
    const [manualScore, setManualScore] = useState<number>(0);

    const [generalFeedback, setGeneralFeedback] = useState(submission.feedback || '');
    const [isSaving, setIsSaving] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const isQuiz = submission.type === 'QUIZ' || (!!submission.answers && !submission.fileUrl);

    // Initial Auto-Calculation Effect
    const calculateAutoScore = () => {
        return calculateTotalQuizScore(quizData?.questions || [], submission.answers || {});
    };

    const maxQuizScore = calculateMaxQuizScore(quizData?.questions || []);
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
            router.back();
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
                router.back();
            } else {
                await showAlert("Error", "No se pudo reiniciar: " + res.error, "error");
            }
            setIsSaving(false);
        }
    };

    const handleAutoGrade = async () => {
        if (!submission.fileUrl) {
            await showAlert("Error", "No hay archivo para analizar.", "error");
            return;
        }

        const confirm = await showConfirm(
            "¿Auto-Calificar con IA?",
            "La inteligencia artificial analizará el documento y sugerirá puntajes y feedback basados en la rúbrica. Esto reemplazará las notas actuales no guardadas.",
            "info"
        );

        if (!confirm) return;

        setIsAnalyzing(true);

        try {
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error("La solicitud excedió el tiempo de espera (120s).")), 120000);
            });

            const res = await Promise.race([
                generateGradeWithAI(submission.id, rubricItems),
                timeoutPromise
            ]) as AIGradeResponse;

            if (res.success && res.grades) {
                const newScores = { ...scores };
                res.grades.forEach(g => {
                    if (newScores[g.rubricItemId]) {
                        newScores[g.rubricItemId] = {
                            score: g.score,
                            feedback: g.feedback
                        };
                    }
                });
                setScores(newScores);

                if (res.generalFeedback) {
                    setGeneralFeedback(res.generalFeedback);
                }

                await showAlert("Análisis Completado", "Se han generado puntajes y feedback sugeridos. Por favor revisa y ajusta según sea necesario antes de guardar.", "success");
            } else {
                await showAlert("Error en Análisis", res.error || "No se pudo completar el análisis con IA.", "error");
            }
        } catch (error: any) {
            console.error(error);
            const msg = error.message === "La solicitud excedió el tiempo de espera (120s)."
                ? "El análisis está tardando demasiado. Es posible que el archivo sea muy grande o el servicio de IA esté lento."
                : "Ocurrió un error inesperado durante el análisis.";
            await showAlert("Error de Tiempo de Espera", msg, "error");
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleBack = async () => {
        const confirm = await showConfirm("¿Cerrar evaluación?", "Se perderán los cambios no guardados.", "warning");
        if (confirm) {
            router.back();
        }
    };

    const currentTotal = Object.values(scores).reduce((sum, item) => sum + item.score, 0);
    const maxTotal = rubricItems.reduce((sum, item) => sum + item.maxPoints, 0);

    const quizScoreResult = isQuiz ? (gradingMode === 'AUTO' ? autoScore : manualScore) : 0;
    const displayedTotal = rubricItems.length > 0 ? currentTotal : quizScoreResult;
    const displayedMax = rubricItems.length > 0 ? maxTotal : (isQuiz ? maxQuizScore : 0);

    return (
        <div className="flex flex-col h-screen bg-slate-50">
            {/* Header / Navbar */}
            <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-20 shadow-sm">
                <div className="flex items-center gap-4">
                    <button
                        onClick={handleBack}
                        className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            Evaluación de {submission.student.name || submission.student.email}
                        </h1>
                        <p className="text-xs text-slate-500">{isQuiz ? 'Cuestionario' : submission.fileName || 'Sin archivo'}</p>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <div className="text-right">
                        <span className="block text-[10px] uppercase text-slate-400 font-bold tracking-wider">Nota Actual</span>
                        <span className={`text-2xl font-black ${displayedTotal >= (displayedMax || 1) * 0.6 ? 'text-green-600' : 'text-amber-600'}`}>
                            {displayedTotal} <span className="text-slate-300 text-lg">/ {displayedMax}</span>
                        </span>
                    </div>

                    <div className="flex gap-2">
                        {isQuiz && (
                            <button
                                onClick={handleReset}
                                disabled={isSaving}
                                className="px-4 py-2 border border-slate-200 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 text-slate-600 rounded-lg font-bold flex items-center gap-2 text-sm transition-all"
                            >
                                <RotateCcw className="w-4 h-4" />
                                Reiniciar
                            </button>
                        )}
                        <button
                            onClick={handleSave}
                            disabled={isSaving || (rubricItems.length === 0 && !isQuiz)}
                            className={cn(
                                "px-6 py-2 text-white rounded-lg font-bold shadow-lg shadow-blue-200 hover:shadow-xl transition-all disabled:opacity-50 disabled:shadow-none flex items-center gap-2 text-sm",
                                "bg-blue-600 hover:bg-blue-700"
                            )}
                        >
                            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            Guardar
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex overflow-hidden">
                {/* Left: Content Viewer */}
                <div className="flex-1 bg-slate-100 border-r border-slate-200 flex flex-col relative overflow-hidden">
                    {/* Toolbar for Viewer */}
                    {(!isQuiz && submission.fileUrl) && (
                        <div className="absolute top-4 right-4 z-10 flex gap-2">
                            <a
                                href={submission.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 bg-white/90 backdrop-blur shadow-sm border border-slate-200 text-slate-600 rounded-lg hover:bg-white hover:text-blue-600 transition-colors"
                                title="Descargar / Abrir original"
                            >
                                <Download className="w-5 h-5" />
                            </a>
                        </div>
                    )}

                    <div className="flex-1 overflow-y-auto w-full h-full">
                        {isQuiz ? (
                            <div className="p-8 max-w-3xl mx-auto space-y-6">
                                {quizData?.questions?.map((q: any, i: number) => {
                                    const answer = submission.answers?.[q.id];
                                    return (
                                        <div key={q.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                                            <div className="flex gap-4 mb-4">
                                                <span className="bg-slate-100 text-slate-500 font-bold px-3 py-1 rounded-lg text-sm h-fit">{i + 1}</span>
                                                <div className="flex-1">
                                                    <p className="font-bold text-slate-800 text-lg mb-1">{q.prompt}</p>
                                                    <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">{q.type}</p>
                                                </div>
                                                <span className="text-sm font-bold text-slate-400">{q.points || 1} pts</span>
                                            </div>
                                            <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 text-base text-slate-700">
                                                {answer || <span className="text-slate-400 italic">Sin respuesta</span>}
                                                {q.type === 'RATING' && answer && (
                                                    <span className="ml-3 text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-full border border-blue-100">
                                                        {(parseInt(answer) / 5 * (q.points || 1)).toFixed(1)} pts
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    )
                                }) || (
                                        <div className="text-center p-20 text-slate-400">
                                            <AlertTriangle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                            No se pudieron cargar las preguntas del cuestionario.
                                            <pre className="text-xs mt-4 text-left bg-slate-200 p-4 rounded overflow-auto max-w-lg mx-auto">
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
                                    <div className="flex flex-col items-center justify-center h-full text-slate-400 p-10">
                                        <FileText className="w-20 h-20 mb-6 text-slate-300" />
                                        <p className="text-lg font-medium text-slate-500">Vista previa no disponible para este tipo de archivo</p>
                                        <a
                                            href={submission.fileUrl}
                                            target="_blank"
                                            className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all mt-6"
                                        >
                                            Abrir Archivo Externamente
                                        </a>
                                    </div>
                                )
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-slate-400">
                                    <AlertTriangle className="w-16 h-16 mb-4 text-amber-300" />
                                    <p className="font-medium text-slate-500">No hay archivo adjunto ni datos de cuestionario.</p>
                                </div>
                            )
                        )}
                    </div>
                </div>

                {/* Right: Grading Sidebar */}
                <div className="w-[400px] lg:w-[450px] bg-white border-l border-slate-200 flex flex-col shadow-xl z-10">
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white">
                        <h3 className="font-bold text-slate-600 uppercase text-sm tracking-wider">Criterios de Evaluación</h3>
                        {!isQuiz && rubricItems.length > 0 && submission.fileUrl && (
                            <button
                                onClick={handleAutoGrade}
                                disabled={isAnalyzing || isSaving}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-bold hover:bg-indigo-100 transition-colors disabled:opacity-50"
                                title="Analizar documento y sugerir notas"
                            >
                                {isAnalyzing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                                {isAnalyzing ? "Analizando..." : "IA Scan"}
                            </button>
                        )}
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-8">
                        {isQuiz ? (
                            <div className="space-y-6">
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
                                    <div className="p-8 bg-blue-50 border border-blue-100 rounded-2xl text-center">
                                        <p className="text-blue-500 text-xs font-bold uppercase tracking-widest mb-4">Puntuación Automática</p>
                                        <div className="text-6xl font-black text-blue-600 tracking-tighter">
                                            {autoScore}
                                        </div>
                                        <div className="text-blue-400 font-bold mt-1">de {maxQuizScore} puntos</div>
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
                                            className="w-full text-4xl font-bold p-4 text-center border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-50 outline-none transition-all"
                                        />
                                        <p className="text-xs text-center text-slate-400 mt-2 font-medium">Máximo: {maxQuizScore} pts</p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            rubricItems.length === 0 ? (
                                <div className="text-center py-20 bg-slate-50 rounded-xl border border-dashed border-slate-200 px-6">
                                    <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                                    <p className="text-slate-600 font-medium">Sin Rúbrica</p>
                                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">No hay criterios definidos. Puedes asignar una nota manual si es necesario.</p>
                                </div>
                            ) : (
                                rubricItems.map((item) => {
                                    const currentScore = scores[item.id]?.score || 0;
                                    return (
                                        <div key={item.id} className="animate-in slide-in-from-right-4 duration-500">
                                            <div className="flex justify-between items-baseline mb-3">
                                                <label className="font-bold text-slate-700 text-sm leading-tight max-w-[70%]">{item.criterion}</label>
                                                <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded border border-blue-100">
                                                    {currentScore} / {item.maxPoints}
                                                </span>
                                            </div>

                                            <input
                                                type="range"
                                                min="0"
                                                max={item.maxPoints}
                                                value={currentScore}
                                                onChange={(e) => handleScoreChange(item.id, parseInt(e.target.value))}
                                                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600 hover:accent-blue-700 mb-4"
                                            />

                                            <textarea
                                                value={scores[item.id]?.feedback || ''}
                                                onChange={(e) => handleFeedbackChange(item.id, e.target.value)}
                                                placeholder="Comentarios específicos..."
                                                className="w-full text-xs text-slate-600 border-slate-200 rounded-lg focus:ring-4 focus:ring-blue-50 focus:border-blue-300 min-h-[60px] resize-y bg-slate-50 placeholder-slate-400 transition-all"
                                            />
                                        </div>
                                    );
                                })
                            )
                        )}

                        {/* General Feedback Section */}
                        <div className="pt-8 border-t border-slate-100">
                            <h4 className="font-bold text-slate-600 uppercase text-xs tracking-wider mb-3">Feedback General</h4>
                            <textarea
                                value={generalFeedback}
                                onChange={(e) => setGeneralFeedback(e.target.value)}
                                placeholder="Escribe un comentario general para el estudiante..."
                                className="w-full text-sm border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-50 focus:border-blue-300 min-h-[120px] resize-y bg-white placeholder-slate-400 p-4 shadow-sm border transition-all"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
