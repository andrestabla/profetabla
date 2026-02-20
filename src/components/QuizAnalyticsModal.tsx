'use client';

import { useState, useMemo } from 'react';
import { X, Users, BarChart3, ChevronRight, GraduationCap, CheckCircle2, XCircle, Clock, Search, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';

/* eslint-disable @typescript-eslint/no-explicit-any */

interface QuizAnalyticsModalProps {
    assignment: any;
    projectStudents?: any[];
    onClose: () => void;
}

export function QuizAnalyticsModal({ assignment, projectStudents = [], onClose }: QuizAnalyticsModalProps) {
    const [activeTab, setActiveTab] = useState<'GLOBAL' | 'STUDENTS'>('GLOBAL');
    const [searchQuery, setSearchQuery] = useState('');
    const [computeMode, setComputeMode] = useState<'PARTICIPANTS' | 'ALL'>('PARTICIPANTS');
    const [isExporting, setIsExporting] = useState(false);

    const submissions = useMemo(() => {
        const rawSubmissions = assignment.submissions || [];
        // Only include submissions from students currently in the project
        return rawSubmissions.filter((s: any) =>
            projectStudents.some(ps => ps.id === s.studentId)
        );
    }, [assignment.submissions, projectStudents]);

    const questions = assignment.task?.quizData?.questions || [];

    // Global Statistics
    const stats = useMemo(() => {
        const targetSubmissions = computeMode === 'PARTICIPANTS'
            ? submissions
            : [
                ...submissions,
                ...projectStudents
                    .filter(ps => !submissions.some((s: any) => String(s.studentId || s.student?.id) === String(ps.id)))
                    .map(ps => ({ grade: 0, student: ps }))
            ];

        if (targetSubmissions.length === 0) return { avgGrade: '0.0', total: 0, maxScore: 0, effectiveness: '0' };

        const maxScore = questions.reduce((acc: number, q: any) => acc + (q.points || 1), 0);
        const totalGrades = targetSubmissions.reduce((acc: number, s: any) => acc + (s.grade || 0), 0);
        const avgNum = totalGrades / targetSubmissions.length;

        return {
            avgGrade: avgNum.toFixed(1),
            total: targetSubmissions.length,
            maxScore,
            effectiveness: maxScore > 0 ? ((avgNum / maxScore) * 100).toFixed(0) : '0'
        };
    }, [submissions, questions, computeMode, projectStudents]);

    // Question Performance
    const questionStats = useMemo(() => {
        return questions.map((q: any) => {
            let correctCount = 0;
            let totalRating = 0;
            let respondedCount = 0;
            const qualitativeAnswers: string[] = [];

            submissions.forEach((s: any) => {
                const answer = s.answers?.[q.id];
                if (answer !== undefined && answer !== null && answer !== '') {
                    respondedCount++;
                    if (q.type === 'RATING') {
                        totalRating += parseInt(answer);
                    } else if (answer === q.correctAnswer) {
                        correctCount++;
                    }

                    // Collect qualitative answers for text/open questions or unscored questions
                    if (q.type === 'TEXT' || (q.points === 0 && q.type !== 'RATING')) {
                        qualitativeAnswers.push(answer);
                    }
                }
            });

            // If computeMode is ALL, we consider non-respondents as failures (score 0)
            const divisor = computeMode === 'PARTICIPANTS' ? respondedCount : projectStudents.length;

            let rate = 0;
            let avgValue = 0;
            if (q.type === 'RATING') {
                avgValue = divisor > 0 ? totalRating / divisor : 0;
                rate = (avgValue / 5) * 100; // Assuming 1-5 scale
            } else {
                rate = divisor > 0 ? (correctCount / divisor) * 100 : 0;
            }

            return {
                ...q,
                correctCount,
                avgValue: avgValue.toFixed(1),
                successRate: rate.toFixed(0),
                respondedCount,
                qualitativeAnswers,
                isQualitative: q.type === 'TEXT' || (q.points === 0 && q.type !== 'RATING')
            };
        });
    }, [questions, submissions, computeMode, projectStudents]);

    const handleExportPDF = async () => {
        setIsExporting(true);
        try {
            const { jsPDF } = await import('jspdf');
            const { default: autoTable } = await import('jspdf-autotable');

            const doc = new jsPDF();
            const title = `Reporte de Analítica: ${assignment.title}`;

            // Header
            doc.setFontSize(18);
            doc.setTextColor(37, 99, 235);
            doc.text(title, 14, 22);

            doc.setFontSize(10);
            doc.setTextColor(100);
            doc.text(`Fecha del reporte: ${new Date().toLocaleString()}`, 14, 30);
            doc.text(`Modo de cómputo: ${computeMode === 'PARTICIPANTS' ? 'Solo participantes' : 'Todos los inscritos'}`, 14, 35);

            // Global Stats Table
            autoTable(doc, {
                startY: 45,
                head: [['Métrica', 'Valor']],
                body: [
                    ['Promedio de Notas', `${stats.avgGrade} / ${stats.maxScore}`],
                    ['Estudiantes/Entregas Computadas', stats.total.toString()],
                    ['Efectividad Global', `${stats.effectiveness}%`]
                ],
                theme: 'striped',
                headStyles: { fillColor: [37, 99, 235] }
            });

            // Questions Table
            autoTable(doc, {
                startY: (doc as any).lastAutoTable.finalY + 15,
                head: [['#', 'Pregunta', 'Puntaje Promedio / Éxito', 'Respondido por']],
                body: questionStats.map((q: any, i: number) => {
                    let metric = "";
                    if (q.isQualitative) metric = "Cualitativa (Ver listado)";
                    else if (q.type === 'RATING') metric = `${q.avgValue} (1-5)`;
                    else metric = `${q.successRate}%`;

                    return [
                        i + 1,
                        q.prompt,
                        metric,
                        computeMode === 'PARTICIPANTS' ? q.respondedCount : `${q.respondedCount} / ${projectStudents.length}`
                    ];
                }),
                theme: 'grid',
                headStyles: { fillColor: [139, 92, 246] }
            });

            // Individual Breakdown
            autoTable(doc, {
                startY: (doc as any).lastAutoTable.finalY + 15,
                head: [['Estudiante', 'Email', 'Calificación', 'Estado']],
                body: projectStudents.map(student => {
                    const sub = submissions.find((s: any) => String(s.studentId || s.student?.id) === String(student.id));
                    return [
                        student.name || 'Sin nombre',
                        student.email || 'Sin email',
                        sub ? (sub.grade || 0).toString() : '0',
                        sub ? 'Entregado' : 'Pendiente'
                    ];
                }),
                theme: 'striped',
                headStyles: { fillColor: [16, 185, 129] }
            });

            // Qualitative Answers Section (e.g. Question 11)
            const qualQuestions = questionStats.filter((q: any) => q.isQualitative);
            if (qualQuestions.length > 0) {
                // Check if we need a new page for qualitative answers
                const finalY = (doc as any).lastAutoTable.finalY;
                if (finalY > 200) doc.addPage();

                doc.setFontSize(16);
                doc.setTextColor(79, 70, 229); // Indigo 600
                doc.text("Detalle de Respuestas Abiertas", 14, (doc as any).lastAutoTable.finalY + 15);

                let currentY = (doc as any).lastAutoTable.finalY + 25;

                qualQuestions.forEach((q: any) => {
                    const originalIndex = questions.findIndex((origQ: any) => origQ.id === q.id);

                    // Question Header
                    doc.setFontSize(12);
                    doc.setTextColor(30, 41, 59); // Slate 800
                    const questionText = doc.splitTextToSize(`Pregunta ${originalIndex + 1}: ${q.prompt}`, 180);
                    doc.text(questionText, 14, currentY);
                    currentY += (questionText.length * 6) + 4;

                    // Answers
                    doc.setFontSize(9);
                    doc.setTextColor(100);
                    q.qualitativeAnswers.forEach((ans: string) => {
                        const splitText = doc.splitTextToSize(`• "${ans}"`, 170);

                        // Page break check
                        if (currentY + (splitText.length * 5) > 280) {
                            doc.addPage();
                            currentY = 20;
                        }

                        doc.text(splitText, 20, currentY);
                        currentY += (splitText.length * 5) + 2;
                    });

                    currentY += 10;
                    // Extra page break check between questions
                    if (currentY > 270) {
                        doc.addPage();
                        currentY = 20;
                    }
                });
            }

            doc.save(`Analitica_${assignment.id}.pdf`);
        } catch (error) {
            console.error('Error generating PDF:', error);
        } finally {
            setIsExporting(false);
        }
    };

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
                        <div className="flex items-center gap-3">
                            <button
                                onClick={handleExportPDF}
                                disabled={isExporting}
                                className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-emerald-100 transition-all disabled:opacity-50"
                            >
                                {isExporting ? <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" /> : <Clock className="w-4 h-4 rotate-180" />}
                                Descargar PDF
                            </button>
                            <button
                                onClick={onClose}
                                className="p-3 hover:bg-white hover:shadow-md text-slate-400 hover:text-slate-600 rounded-2xl transition-all"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4 mt-8">
                        <div className="flex gap-4">
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

                        <div className="bg-slate-100 p-1 rounded-xl flex items-center">
                            <button
                                onClick={() => setComputeMode('PARTICIPANTS')}
                                className={cn(
                                    "px-3 py-1.5 rounded-lg text-[10px] font-black tracking-widest uppercase transition-all",
                                    computeMode === 'PARTICIPANTS' ? "bg-white text-blue-600 shadow-sm" : "text-slate-500"
                                )}
                            >
                                Solo Participantes
                            </button>
                            <button
                                onClick={() => setComputeMode('ALL')}
                                className={cn(
                                    "px-3 py-1.5 rounded-lg text-[10px] font-black tracking-widest uppercase transition-all",
                                    computeMode === 'ALL' ? "bg-white text-blue-600 shadow-sm" : "text-slate-500"
                                )}
                            >
                                Todos los Inscritos
                            </button>
                        </div>
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
                                        <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">
                                            {computeMode === 'PARTICIPANTS' ? 'Promedio Participantes' : 'Promedio Todos'}
                                        </p>
                                        <p className="text-3xl font-black text-blue-700">{stats.avgGrade} <span className="text-sm opacity-60">/ {stats.maxScore}</span></p>
                                    </div>
                                </div>
                                <div className="bg-emerald-50 p-6 rounded-[24px] border border-emerald-100 flex items-center gap-4">
                                    <div className="p-4 bg-white rounded-2xl shadow-sm text-emerald-600">
                                        <Users className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">
                                            {computeMode === 'PARTICIPANTS' ? 'Total Entregas' : 'Total Estudiantes'}
                                        </p>
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
                                            {stats.effectiveness}%
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
                                                            q.isQualitative ? "text-indigo-500" : (successRate >= 80 ? "text-emerald-500" : successRate >= 50 ? "text-blue-500" : "text-amber-500")
                                                        )}>
                                                            {q.isQualitative ? 'Abierta' : (q.type === 'RATING' ? q.avgValue : `${q.successRate}%`)}
                                                        </span>
                                                        <p className="text-[9px] text-slate-400 font-bold uppercase">
                                                            {q.isQualitative ? 'Respuestas' : (q.type === 'RATING' ? 'Promedio' : 'Éxito')}
                                                        </p>
                                                    </div>
                                                </div>

                                                {q.isQualitative ? (
                                                    <div className="mt-2 space-y-2 max-h-32 overflow-y-auto pr-2 custom-scrollbar">
                                                        {q.qualitativeAnswers.length > 0 ? (
                                                            q.qualitativeAnswers.map((ans: string, idx: number) => (
                                                                <div key={idx} className="p-2 bg-slate-50 rounded-lg border border-slate-100 text-[10px] text-slate-600 italic leading-relaxed">
                                                                    &quot;{ans}&quot;
                                                                </div>
                                                            ))
                                                        ) : (
                                                            <p className="text-[10px] text-slate-400 italic">Sin respuestas registradas.</p>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                                        <div
                                                            className={cn(
                                                                "h-full transition-all duration-1000",
                                                                successRate >= 80 ? "bg-emerald-500" : successRate >= 50 ? "bg-blue-500" : "bg-amber-500"
                                                            )}
                                                            style={{ width: `${q.successRate}%` }}
                                                        />
                                                    </div>
                                                )}
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
