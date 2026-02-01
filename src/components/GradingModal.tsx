'use client';

import { useState } from 'react';
import { gradeSubmissionAction } from '@/app/actions/rubric-actions';
import { Loader2, Save, X, FileText, Download } from 'lucide-react';

/* eslint-disable @typescript-eslint/no-explicit-any */
type RubricItem = {
    id: string;
    criterion: string;
    maxPoints: number;
    order: number;
};

type Submission = {
    id: string;
    fileUrl: string;
    fileName: string;
    student: {
        name: string | null;
        email: string;
    };
    rubricScores: { rubricItemId: string; score: number; feedback: string | null }[];
    feedback?: string | null;
};

export function GradingModal({ submission, rubricItems, onClose }: { submission: Submission; rubricItems: RubricItem[]; onClose: () => void }) {
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
    const [generalFeedback, setGeneralFeedback] = useState(submission.feedback || '');
    const [isSaving, setIsSaving] = useState(false);

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

        const res = await gradeSubmissionAction(submission.id, scoresPayload, generalFeedback);
        if (res.success) {
            alert("Calificación guardada");
            onClose();
        } else {
            alert("Error: " + res.error);
        }
        setIsSaving(false);
    };

    const currentTotal = Object.values(scores).reduce((sum, item) => sum + item.score, 0);
    const maxTotal = rubricItems.reduce((sum, item) => sum + item.maxPoints, 0);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl h-[90vh] flex overflow-hidden animate-in zoom-in-95 duration-200">

                {/* Left: Document Viewer */}
                <div className="w-1/2 bg-slate-100 border-r border-slate-200 flex flex-col">
                    <div className="bg-white p-4 border-b border-slate-200 flex justify-between items-center shadow-sm z-10">
                        <div>
                            <h4 className="font-bold text-slate-800">{submission.fileName}</h4>
                            <p className="text-xs text-slate-500">{submission.student.name || submission.student.email}</p>
                        </div>
                        <a href={submission.fileUrl} target="_blank" rel="noopener noreferrer" className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors" title="Descargar / Abrir original">
                            <Download className="w-5 h-5" />
                        </a>
                    </div>
                    <div className="flex-1 overflow-hidden relative">
                        {submission.fileUrl.includes('drive.google.com') ? (
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
                                <span className={`text-2xl font-black ${currentTotal >= maxTotal * 0.6 ? 'text-green-600' : 'text-amber-600'}`}>
                                    {currentTotal} <span className="text-slate-300 text-lg">/ {maxTotal}</span>
                                </span>
                            </div>
                            <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-8">
                        {rubricItems.length === 0 ? (
                            <div className="text-center py-20 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                <p className="text-slate-500">No hay rúbrica definida para esta tarea.</p>
                                <p className="text-xs text-slate-400 mt-1">Define los criterios en la pantalla anterior.</p>
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

                    <div className="p-6 border-t border-slate-100 bg-slate-50">
                        <button
                            onClick={handleSave}
                            disabled={isSaving || rubricItems.length === 0}
                            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-200 disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2 transition-all"
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
