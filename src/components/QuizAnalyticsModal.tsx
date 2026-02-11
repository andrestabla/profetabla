'use client';

import { useState, useMemo } from 'react';
import { X, Users, BarChart3, ChevronRight, GraduationCap, CheckCircle2, XCircle, Clock, Search, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';

/* eslint-disable @typescript-eslint/no-explicit-any */

interface QuizAnalyticsModalProps {
    assignment: any;
    onClose: () => void;
}

export function QuizAnalyticsModal({ assignment, onClose }: QuizAnalyticsModalProps) {
    const [activeTab, setActiveTab] = useState<'GLOBAL' | 'STUDENTS'>('GLOBAL');
    const [searchQuery, setSearchQuery] = useState('');

    const submissions = assignment.submissions || [];
    const questions = assignment.task?.quizData?.questions || [];

    // Global Statistics
    const stats = useMemo(() => {
        if (submissions.length === 0) return { avgGrade: 0, total: 0, maxScore: 0 };

        const maxScore = questions.reduce((acc: number, q: any) => acc + (q.points || 1), 0);
        const totalGrades = submissions.reduce((acc: number, s: any) => acc + (s.grade || 0), 0);

        return {
            avgGrade: (totalGrades / submissions.length).toFixed(1),
            total: submissions.length,
            maxScore
        };
    }, [submissions, questions]);

    // Question Performance
    const questionStats = useMemo(() => {
        return questions.map((q: any) => {
            let correctCount = 0;
            let totalRating = 0;
            let respondedCount = 0;

            submissions.forEach((s: any) => {
                const answer = s.answers?.[q.id];
                if (answer !== undefined && answer !== null && answer !== '') {
                    respondedCount++;
                    if (q.type === 'RATING') {
                        totalRating += parseInt(answer);
                    } else if (answer === q.correctAnswer) {
                        correctCount++;
                    }
                }
            });

            let rate = 0;
            let avgValue = 0;
            if (q.type === 'RATING') {
                avgValue = respondedCount > 0 ? totalRating / respondedCount : 0;
                rate = (avgValue / 5) * 100; // Assuming 1-5 scale
            } else {
                rate = respondedCount > 0 ? (correctCount / respondedCount) * 100 : 0;
            }

            return {
                ...q,
                correctCount,
                avgValue: avgValue.toFixed(1),
                successRate: rate.toFixed(0),
                respondedCount
            };
        });
    }, [questions, submissions]);

    const filteredSubmissions = useMemo(() => {
        return submissions.filter((s: any) =>
            s.student?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.student?.email?.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [submissions, searchQuery]);

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">
                {/* Header */}
                <header className="p-8 border-b border-slate-100 bg-slate-50/50">
                    <div className="flex justify-between items-start">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-[10px] font-bold rounded-lg uppercase tracking-wider">Analítica Retroalimentación</span>
                                <span className="text-slate-300">/</span>
                                <span className="text-slate-500 text-xs font-medium">Cuestionario</span>
                            </div>
                            <h2 className="text-2xl font-black text-slate-800 tracking-tight">{assignment.title}</h2>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-3 hover:bg-white hover:shadow-md text-slate-400 hover:text-slate-600 rounded-2xl transition-all"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    <div className="flex gap-4 mt-8">
                        <button
                            onClick={() => setActiveTab('GLOBAL')}
                            className={cn(
                                "flex items-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all text-sm",
                                activeTab === 'GLOBAL'
                                    ? "bg-blue-600 text-white shadow-xl shadow-blue-100 scale-105"
                                    : "bg-white border border-slate-100 text-slate-500 hover:bg-slate-50"
                            )}
                        >
                            <BarChart3 className="w-4 h-4" /> Rendimiento Global
                        </button>
                        <button
                            onClick={() => setActiveTab('STUDENTS')}
                            className={cn(
                                "flex items-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all text-sm",
                                activeTab === 'STUDENTS'
                                    ? "bg-blue-600 text-white shadow-xl shadow-blue-100 scale-105"
                                    : "bg-white border border-slate-100 text-slate-500 hover:bg-slate-50"
                            )}
                        >
                            <Users className="w-4 h-4" /> Desglose por Estudiante
                        </button>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto p-8">
                    {activeTab === 'GLOBAL' ? (
                        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {/* Stats Summary Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="bg-blue-50 p-6 rounded-[24px] border border-blue-100 flex items-center gap-4">
                                    <div className="p-4 bg-white rounded-2xl shadow-sm text-blue-600">
                                        <TrendingUp className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Promedio Notas</p>
                                        <p className="text-3xl font-black text-blue-700">{stats.avgGrade} <span className="text-sm opacity-60">/ {stats.maxScore}</span></p>
                                    </div>
                                </div>
                                <div className="bg-emerald-50 p-6 rounded-[24px] border border-emerald-100 flex items-center gap-4">
                                    <div className="p-4 bg-white rounded-2xl shadow-sm text-emerald-600">
                                        <Users className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Entregas</p>
                                        <p className="text-3xl font-black text-emerald-700">{stats.total}</p>
                                    </div>
                                </div>
                                <div className="bg-purple-50 p-6 rounded-[24px] border border-purple-100 flex items-center gap-4">
                                    <div className="p-4 bg-white rounded-2xl shadow-sm text-purple-600">
                                        <CheckCircle2 className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest">Efectividad</p>
                                        <p className="text-3xl font-black text-purple-700">
                                            {submissions.length > 0 ? (parseFloat(stats.avgGrade as string) / stats.maxScore * 100).toFixed(0) : 0}%
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Question Success Rates */}
                            <div className="space-y-6">
                                <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                    <ChevronRight className="w-5 h-5 text-blue-600" /> Rendimiento por Pregunta
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {questionStats.map((q: any, i: number) => {
                                        const successRate = parseFloat(q.successRate);
                                        return (
                                            <div key={q.id} className="p-5 bg-white border border-slate-100 rounded-3xl hover:border-blue-200 transition-all group">
                                                <div className="flex justify-between items-start mb-4">
                                                    <div className="flex gap-3">
                                                        <span className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-xs font-black text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                                                            {i + 1}
                                                        </span>
                                                        <p className="text-xs font-bold text-slate-700 leading-relaxed line-clamp-2 max-w-[200px]">
                                                            {q.prompt}
                                                        </p>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className={cn(
                                                            "text-lg font-black",
                                                            successRate >= 80 ? "text-emerald-500" : successRate >= 50 ? "text-blue-500" : "text-amber-500"
                                                        )}>
                                                            {q.type === 'RATING' ? q.avgValue : `${q.successRate}%`}
                                                        </span>
                                                        <p className="text-[9px] text-slate-400 font-bold uppercase">
                                                            {q.type === 'RATING' ? 'Promedio' : 'Éxito'}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                                    <div
                                                        className={cn(
                                                            "h-full transition-all duration-1000",
                                                            successRate >= 80 ? "bg-emerald-500" : successRate >= 50 ? "bg-blue-500" : "bg-amber-500"
                                                        )}
                                                        style={{ width: `${q.successRate}%` }}
                                                    />
                                                </div>
                                                <div className="flex justify-between items-center mt-3">
                                                    <p className="text-[10px] text-slate-400 font-medium">
                                                        {q.type === 'RATING' ? 'Respondido por: ' : 'Correctas: '}
                                                        <span className="text-slate-700 font-bold">{q.type === 'RATING' ? q.respondedCount : q.correctCount}</span>
                                                    </p>
                                                    <p className="text-[10px] text-slate-400 font-medium">Peso: <span className="text-blue-600 font-black">{q.points || 1} pts</span></p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {/* Search Students */}
                            <div className="relative group">
                                <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-blue-600 transition-all" />
                                <input
                                    type="text"
                                    placeholder="Buscar por nombre o correo..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-16 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-[24px] text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-200 transition-all"
                                />
                            </div>

                            <div className="bg-white border border-slate-100 rounded-[32px] overflow-hidden">
                                <table className="w-full">
                                    <thead>
                                        <tr className="bg-slate-50/50">
                                            <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Estudiante</th>
                                            <th className="px-8 py-5 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Puntaje</th>
                                            <th className="px-8 py-5 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Preguntas</th>
                                            <th className="px-8 py-5 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Fecha Entrega</th>
                                            <th className="px-8 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Estado</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {filteredSubmissions.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="px-6 py-20 text-center">
                                                    <div className="flex flex-col items-center gap-3">
                                                        <Users className="w-12 h-12 text-slate-200" />
                                                        <p className="text-slate-400 font-medium">No se encontraron entregas para esta búsqueda.</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : filteredSubmissions.map((s: any) => {
                                            // Calculate actual points vs max points for display purposes
                                            const correctCount = questions.filter((q: any) => {
                                                const answer = s.answers?.[q.id];
                                                if (q.type === 'RATING') return parseInt(answer) >= 3; // Arbitrary "positive" rating
                                                return answer === q.correctAnswer;
                                            }).length;

                                            return (
                                                <tr key={s.id} className="hover:bg-slate-50/50 transition-colors group">
                                                    <td className="px-8 py-5">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold overflow-hidden border border-slate-200 relative">
                                                                {s.student?.avatarUrl ? (
                                                                    <Image src={s.student.avatarUrl} alt={s.student.name || ''} fill className="object-cover" />
                                                                ) : s.student?.name?.[0]}
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-bold text-slate-800">{s.student?.name}</p>
                                                                <p className="text-[10px] text-slate-500 font-medium">{s.student?.email}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-5 text-center">
                                                        <span className={cn(
                                                            "text-lg font-black",
                                                            (s.grade || 0) >= stats.maxScore * 0.6 ? "text-emerald-600" : "text-blue-600"
                                                        )}>
                                                            {s.grade || 0}
                                                        </span>
                                                        <span className="text-[10px] text-slate-400 font-bold ml-1">pts</span>
                                                    </td>
                                                    <td className="px-8 py-5 text-center">
                                                        <div className="flex items-center justify-center gap-2">
                                                            <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md" title="Respuestas Correctas / Calificaciones Altas">
                                                                <CheckCircle2 className="w-3 h-3" /> {correctCount}
                                                            </div>
                                                            <div className="flex items-center gap-1 text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-1 rounded-md" title="Respuestas Incorrectas / Calificaciones Bajas">
                                                                <XCircle className="w-3 h-3" /> {questions.length - correctCount}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-5 text-center">
                                                        <div className="flex flex-col items-center">
                                                            <span className="text-xs text-slate-600 font-bold">{new Date(s.createdAt).toLocaleDateString()}</span>
                                                            <span className="text-[9px] text-slate-400 font-medium uppercase tracking-tighter">{new Date(s.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-5 text-right">
                                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-700 text-[10px] font-black rounded-lg uppercase tracking-wider">
                                                            <CheckCircle2 className="w-3 h-3" /> Completado
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>

                <footer className="p-8 border-t border-slate-100 bg-slate-50/50 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-8 py-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-[20px] shadow-lg shadow-slate-200 transition-all hover:-translate-y-0.5"
                    >
                        Cerrar Analítica
                    </button>
                </footer>
            </div>
        </div>
    );
}
