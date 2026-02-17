'use client';

import { useState, useMemo } from 'react';
import {
    Download,
    Search,
    Filter,
    Users,
    FileSpreadsheet,
    Mail,
    ChevronDown,
    GraduationCap,
    Settings2,
    Save,
    X,
    Loader2,
    Percent
} from 'lucide-react';
import NextImage from 'next/image';
import { cn } from '@/lib/utils';
import { updateAssignmentWeightsAction } from './actions';
import StatusModal from '@/components/StatusModal';
import { calculateTotalQuizScore, QuizData } from '@/lib/quiz-utils';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Document, Packer, Paragraph, Table, TableRow, TableCell, WidthType, AlignmentType, HeadingLevel, ImageRun, IImageOptions } from 'docx';
import { saveAs } from 'file-saver';

type Submission = {
    id: string;
    grade: number | null;
    studentId: string;
    student: {
        id: string;
        name: string | null;
        email: string | null;
        avatarUrl: string | null;
    };
    answers?: Record<string, unknown>;
};

type Assignment = {
    id: string;
    title: string;
    weight: number;
    submissions: Submission[];
    task?: {
        type: string;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        quizData: any;
    };
};

type Student = {
    id: string;
    name: string | null;
    email: string | null;
    avatarUrl: string | null;
};

type Project = {
    id: string;
    title: string;
    students: Student[];
    assignments: Assignment[];
};

export default function ProfessorGradesClient({ projects, config }: { projects: Project[], config?: { institutionName?: string, logoUrl?: string | null } | null }) {
    const [isExporting, setIsExporting] = useState(false);
    const [showExportMenu, setShowExportMenu] = useState(false);
    const [selectedProjectId, setSelectedProjectId] = useState<string>(projects[0]?.id || '');
    const [searchQuery, setSearchQuery] = useState('');
    const [showWeightModal, setShowWeightModal] = useState(false);
    const [isSavingWeights, setIsSavingWeights] = useState(false);
    const [statusModal, setStatusModal] = useState<{ type: 'success' | 'error', title: string, message: string } | null>(null);

    const project = useMemo(() => projects.find(p => p.id === selectedProjectId), [projects, selectedProjectId]);

    // Local state for weights during editing
    const [localWeights, setLocalWeights] = useState<Record<string, number>>({});

    // Initialize local weights when modal opens
    const handleOpenWeightModal = () => {
        if (!project) return;
        const weights: Record<string, number> = {};
        project.assignments.forEach(a => {
            weights[a.id] = a.weight || 1;
        });
        setLocalWeights(weights);
        setShowWeightModal(true);
    };

    const handleSaveWeights = async () => {
        setIsSavingWeights(true);
        const weightArray = Object.entries(localWeights).map(([id, weight]) => ({ id, weight }));
        const res = await updateAssignmentWeightsAction(weightArray);
        setIsSavingWeights(false);

        if (res.success) {
            setShowWeightModal(false);
            setStatusModal({
                type: 'success',
                title: 'Pesos Actualizados',
                message: 'Los porcentajes de las actividades han sido guardados correctamente.'
            });
            // Note: revalidatePath in action will refresh data
        } else {
            setStatusModal({
                type: 'error',
                title: 'Error',
                message: res.error || 'No se pudieron actualizar los pesos.'
            });
        }
    };

    const filteredStudents = useMemo(() => {
        if (!project) return [];
        return project.students.filter(s =>
            s.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.email?.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [project, searchQuery]);

    const calculateWeightedAverage = (studentId: string) => {
        if (!project) return '0.0';

        let totalWeightedScore = 0;
        let totalWeights = 0;
        let hasGrades = false;

        project.assignments.forEach(a => {
            const sub = a.submissions.find(s => s.studentId === studentId);
            let grade = sub?.grade;

            // Fallback for auto-graded quizzes
            if (grade === null && a.task?.type === 'QUIZ' && (a.task?.quizData as QuizData)?.gradingMethod === 'AUTO' && sub) {
                grade = calculateTotalQuizScore((a.task.quizData as QuizData).questions || [], (sub.answers as Record<string, string>) || {});
            }

            if (grade !== null && grade !== undefined) {
                totalWeightedScore += grade * (a.weight || 1);
                totalWeights += (a.weight || 1);
                hasGrades = true;
            }
        });

        if (!hasGrades) return '0.0';
        if (totalWeights === 0) return '0.0';

        return (totalWeightedScore / totalWeights).toFixed(1);
    };

    const getLogoData = async (url: string): Promise<{ base64: string, uint8: Uint8Array } | null> => {
        return new Promise((resolve) => {
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    resolve(null);
                    return;
                }
                ctx.drawImage(img, 0, 0);
                const base64 = canvas.toDataURL('image/png');

                const binStr = atob(base64.split(',')[1]);
                const len = binStr.length;
                const uint8 = new Uint8Array(len);
                for (let i = 0; i < len; i++) {
                    uint8[i] = binStr.charCodeAt(i);
                }

                resolve({ base64, uint8 });
            };
            img.onerror = () => {
                console.error("Error loading image via HTMLImageElement");
                resolve(null);
            };
            img.src = url;
        });
    };

    const handleExportCSV = () => {
        if (!project) return;
        setIsExporting(true);
        const totalW = project.assignments.reduce((sum, ass) => sum + (ass.weight || 1), 0) || 1;
        const csvHeaders = ['Estudiante', 'Email', ...project.assignments.map(a => `${a.title} (${(((a.weight || 1) / totalW) * 100).toFixed(0)}%)`), 'Promedio Ponderado'];
        const rows = project.students.map(student => {
            const studentGrades = project.assignments.map(a => {
                const sub = a.submissions.find(s => s.studentId === student.id);
                let grade = sub?.grade;
                if (grade === null && a.task?.type === 'QUIZ' && (a.task?.quizData as QuizData)?.gradingMethod === 'AUTO' && sub) {
                    grade = calculateTotalQuizScore((a.task.quizData as QuizData).questions, (sub.answers as Record<string, string>) || {});
                }
                return grade ?? '--';
            });
            return [student.name || 'Sin nombre', student.email || 'Sin email', ...studentGrades, calculateWeightedAverage(student.id)];
        });
        const csvContent = [csvHeaders.join(','), ...rows.map(r => r.join(','))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        saveAs(blob, `Calificaciones_${project.title.replace(/\s+/g, '_')}.csv`);
        setIsExporting(false);
    };

    const handleExportExcel = () => {
        if (!project) return;
        setIsExporting(true);
        const totalW = project.assignments.reduce((sum, ass) => sum + (ass.weight || 1), 0) || 1;
        const data = project.students.map(student => {
            const row: Record<string, string | number> = { 'Estudiante': student.name || 'Sin nombre', 'Email': student.email || 'Sin email' };
            project.assignments.forEach(a => {
                const sub = a.submissions.find(s => s.studentId === student.id);
                let grade = sub?.grade;
                if (grade === null && a.task?.type === 'QUIZ' && (a.task?.quizData as QuizData)?.gradingMethod === 'AUTO' && sub) {
                    grade = calculateTotalQuizScore((a.task.quizData as QuizData).questions, (sub.answers as Record<string, string>) || {});
                }
                row[`${a.title} (${(((a.weight || 1) / totalW) * 100).toFixed(0)}%)`] = grade ?? '--';
            });
            row['Promedio Ponderado'] = calculateWeightedAverage(student.id);
            return row;
        });

        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Calificaciones');
        XLSX.writeFile(workbook, `Calificaciones_${project.title.replace(/\s+/g, '_')}.xlsx`);
        setIsExporting(false);
    };

    const handleExportPDF = async () => {
        if (!project) return;
        setIsExporting(true);
        const doc = new jsPDF();
        const institutionName = config?.institutionName || 'Profe Tabla';
        const logoUrl = config?.logoUrl;

        // Header
        if (logoUrl) {
            try {
                const logoData = await getLogoData(logoUrl);
                if (logoData) {
                    doc.addImage(logoData.base64, 'PNG', 15, 10, 20, 20);
                }
            } catch (e) { console.error("Error loading logo for PDF", e); }
        }
        doc.setFontSize(20);
        doc.setTextColor(37, 99, 235); // Blue
        doc.text(institutionName, 40, 20);
        doc.setFontSize(12);
        doc.setTextColor(100);
        doc.text(`Proyecto: ${project.title}`, 40, 28);
        doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 150, 20);

        doc.setLineWidth(0.5);
        doc.line(15, 35, 195, 35);

        const pdfHeaders = [['Estudiante', 'Promedio', ...project.assignments.map(a => `${a.title.slice(0, 15)}...`)]];
        const body = project.students.map(student => {
            const grades = project.assignments.map(a => {
                const sub = a.submissions.find(s => s.studentId === student.id);
                let grade = sub?.grade;
                if (grade === null && a.task?.type === 'QUIZ' && (a.task?.quizData as QuizData)?.gradingMethod === 'AUTO' && sub) {
                    grade = calculateTotalQuizScore((a.task.quizData as QuizData).questions, (sub.answers as Record<string, string>) || {});
                }
                return grade ?? '--';
            });
            return [student.name || 'Sin nombre', calculateWeightedAverage(student.id), ...grades];
        });

        autoTable(doc, {
            head: pdfHeaders,
            body: body,
            startY: 45,
            theme: 'striped',
            headStyles: { fillColor: [37, 99, 235], textColor: 255, fontSize: 8 },
            bodyStyles: { fontSize: 8 },
            alternateRowStyles: { fillColor: [248, 250, 252] }
        });

        doc.save(`Calificaciones_${project.title.replace(/\s+/g, '_')}.pdf`);
        setIsExporting(false);
    };

    const handleExportDocx = async () => {
        if (!project) return;
        setIsExporting(true);
        const totalW = project.assignments.reduce((sum, ass) => sum + (ass.weight || 1), 0) || 1;
        const docxHeaders = ['Estudiante', 'Email', ...project.assignments.map(a => `${a.title} (${(((a.weight || 1) / totalW) * 100).toFixed(0)}%)`), 'Promedio'];

        const rows = project.students.map(student => {
            const studentGrades = project.assignments.map(a => {
                const sub = a.submissions.find(s => s.studentId === student.id);
                let grade = sub?.grade;
                if (grade === null && a.task?.type === 'QUIZ' && (a.task?.quizData as QuizData)?.gradingMethod === 'AUTO' && sub) {
                    grade = calculateTotalQuizScore((a.task.quizData as QuizData).questions, (sub.answers as Record<string, string>) || {});
                }
                return grade?.toString() || '--';
            });
            return [student.name || 'Sin nombre', student.email || 'Sin email', ...studentGrades, calculateWeightedAverage(student.id).toString()];
        });

        const logoUrl = config?.logoUrl;
        let logoImage: ImageRun | null = null;

        if (logoUrl) {
            try {
                const logoData = await getLogoData(logoUrl);
                if (logoData) {
                    logoImage = new ImageRun({
                        data: logoData.uint8,
                        transformation: { width: 80, height: 40 },
                    } as IImageOptions);
                }
            } catch (e) {
                console.error("Error loading logo for DOCX", e);
            }
        }

        const doc = new Document({
            sections: [{
                properties: {},
                children: [
                    ...(logoImage ? [new Paragraph({ children: [logoImage], alignment: AlignmentType.CENTER })] : []),
                    new Paragraph({
                        text: config?.institutionName || "Profe Tabla",
                        heading: HeadingLevel.HEADING_1,
                        alignment: AlignmentType.CENTER,
                    }),
                    new Paragraph({
                        text: `Reporte de Calificaciones: ${project.title}`,
                        heading: HeadingLevel.HEADING_2,
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 400 }
                    }),
                    new Table({
                        width: { size: 100, type: WidthType.PERCENTAGE },
                        rows: [
                            new TableRow({
                                children: docxHeaders.map(h => new TableCell({
                                    children: [new Paragraph({ text: h })],
                                    shading: { fill: "F1F5F9" }
                                }))
                            }),
                            ...rows.map(row => new TableRow({
                                children: row.map(cell => new TableCell({
                                    children: [new Paragraph(cell)]
                                }))
                            }))
                        ]
                    })
                ]
            }]
        });

        const blob = await Packer.toBlob(doc);
        saveAs(blob, `Calificaciones_${project.title.replace(/\s+/g, '_')}.docx`);
        setIsExporting(false);
    };

    if (projects.length === 0) {
        return (
            <div className="max-w-6xl mx-auto p-8 text-center bg-white rounded-3xl border border-dotted border-slate-300">
                <GraduationCap className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                <h2 className="text-xl font-bold text-slate-800">No hay proyectos asignados</h2>
                <p className="text-slate-500 mt-2">Crea o vincula proyectos para empezar a calificar.</p>
            </div>
        );
    }

    const totalProjectWeights = project?.assignments.reduce((sum, a) => sum + (a.weight || 1), 0) || 1;

    return (
        <div className="max-w-[1400px] mx-auto p-4 md:p-8 space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Sábana de Calificaciones</h1>
                    <p className="text-slate-500 mt-2 font-medium">Gestión centralizada de notas por proyecto y estudiante.</p>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={handleOpenWeightModal}
                        disabled={!project || project.assignments.length === 0}
                        className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-700 font-bold rounded-2xl shadow-sm hover:bg-slate-50 transition-all hover:-translate-y-0.5 disabled:opacity-50"
                    >
                        <Settings2 className="w-5 h-5 text-blue-500" />
                        Configurar Pesos
                    </button>
                    <div className="relative">
                        <button
                            onClick={() => setShowExportMenu(!showExportMenu)}
                            disabled={!project || isExporting}
                            className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl shadow-lg shadow-emerald-100 transition-all hover:-translate-y-0.5 disabled:opacity-50"
                        >
                            {isExporting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                            Exportar Notas
                            <ChevronDown className={cn("w-4 h-4 transition-transform", showExportMenu && "rotate-180")} />
                        </button>

                        {showExportMenu && (
                            <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in zoom-in-95 duration-200">
                                <button
                                    onClick={() => { handleExportExcel(); setShowExportMenu(false); }}
                                    className="w-full px-4 py-2.5 text-left text-sm font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-3 transition-colors"
                                >
                                    <FileSpreadsheet className="w-5 h-5 text-emerald-500" />
                                    Excel (.xlsx)
                                </button>
                                <button
                                    onClick={() => { handleExportPDF(); setShowExportMenu(false); }}
                                    className="w-full px-4 py-2.5 text-left text-sm font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-3 transition-colors"
                                >
                                    <FileSpreadsheet className="w-5 h-5 text-rose-500" />
                                    PDF (.pdf)
                                </button>
                                <button
                                    onClick={() => { handleExportDocx(); setShowExportMenu(false); }}
                                    className="w-full px-4 py-2.5 text-left text-sm font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-3 transition-colors"
                                >
                                    <FileSpreadsheet className="w-5 h-5 text-blue-500" />
                                    Word (.docx)
                                </button>
                                <div className="my-1 border-t border-slate-50" />
                                <button
                                    onClick={() => { handleExportCSV(); setShowExportMenu(false); }}
                                    className="w-full px-4 py-2.5 text-left text-sm font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-3 transition-colors"
                                >
                                    <Download className="w-5 h-5 text-slate-400" />
                                    CSV (.csv)
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {/* Controls */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white p-4 rounded-3xl border border-slate-200 shadow-sm">
                <div className="md:col-span-1 relative group">
                    <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                    <select
                        value={selectedProjectId}
                        onChange={(e) => setSelectedProjectId(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all appearance-none cursor-pointer"
                    >
                        {projects.map(p => (
                            <option key={p.id} value={p.id}>{p.title}</option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>

                <div className="md:col-span-3 relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                    <input
                        type="text"
                        placeholder="Buscar estudiante por nombre o correo..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all"
                    />
                </div>
            </div>

            {/* Gradebook Table */}
            {project && (
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-100">
                                    <th className="px-6 py-5 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest sticky left-0 bg-slate-50 z-10 w-[300px]">
                                        Estudiante
                                    </th>
                                    {project.assignments.map(a => (
                                        <th key={a.id} className="px-6 py-5 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest min-w-[150px]">
                                            <div className="flex flex-col items-center gap-1">
                                                <FileSpreadsheet className="w-4 h-4 text-blue-500 mb-1" />
                                                <span className="line-clamp-1" title={a.title}>{a.title}</span>
                                                <span className="text-[9px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded">
                                                    {(((a.weight || 1) / totalProjectWeights) * 100).toFixed(0)}%
                                                </span>
                                            </div>
                                        </th>
                                    ))}
                                    <th className="px-6 py-5 text-right text-[10px] font-bold text-slate-600 uppercase tracking-widest bg-blue-50/50 sticky right-0 z-10">
                                        Promedio
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filteredStudents.length === 0 ? (
                                    <tr>
                                        <td colSpan={project.assignments.length + 2} className="px-6 py-20 text-center">
                                            <div className="flex flex-col items-center gap-3">
                                                <Users className="w-10 h-10 text-slate-200" />
                                                <p className="text-slate-500 font-medium">No se encontraron estudiantes en este proyecto.</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredStudents.map((student) => {
                                        const average = calculateWeightedAverage(student.id);

                                        return (
                                            <tr key={student.id} className="hover:bg-slate-50 transition-colors group">
                                                <td className="px-6 py-4 sticky left-0 bg-white group-hover:bg-slate-50 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold overflow-hidden border border-slate-200 relative">
                                                            {student.avatarUrl ? (
                                                                <NextImage
                                                                    src={student.avatarUrl}
                                                                    alt={student.name || "Avatar"}
                                                                    fill
                                                                    className="object-cover"
                                                                />
                                                            ) : (
                                                                student.name?.[0]
                                                            )}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="font-bold text-slate-800 text-sm truncate">{student.name}</p>
                                                            <p className="text-[10px] text-slate-400 flex items-center gap-1">
                                                                <Mail className="w-3 h-3" /> {student.email}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>
                                                {project.assignments.map((a) => {
                                                    const sub = a.submissions.find(s => s.studentId === student.id);
                                                    let grade = sub?.grade;

                                                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                                    if (grade === null && a.task?.type === 'QUIZ' && (a.task?.quizData as any)?.gradingMethod === 'AUTO' && sub) {
                                                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                                        grade = calculateTotalQuizScore((a.task.quizData as any).questions || [], (sub.answers as Record<string, string>) || {});
                                                    }

                                                    return (
                                                        <td key={a.id} className="px-6 py-4 text-center">
                                                            {grade !== undefined && grade !== null ? (
                                                                <span className="inline-block min-w-[40px] px-2 py-1 bg-blue-50 text-blue-700 text-sm font-black rounded-lg">
                                                                    {grade}
                                                                </span>
                                                            ) : (
                                                                <span className="text-slate-300 font-bold">--</span>
                                                            )}
                                                        </td>
                                                    );
                                                })}
                                                <td className="px-6 py-4 text-right sticky right-0 bg-white group-hover:bg-slate-50 z-10 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                                                    <span className={cn(
                                                        "text-lg font-black",
                                                        parseFloat(average) >= 3 ? "text-blue-600" : "text-amber-500"
                                                    )}>
                                                        {average}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* WEIGHT CONFIGURATION MODAL */}
            {showWeightModal && project && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
                        <header className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-100 text-blue-600 rounded-xl">
                                    <Percent className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-slate-800">Configurar Pesos</h3>
                                    <p className="text-xs text-slate-500">Define el valor porcentual de cada actividad.</p>
                                </div>
                            </div>
                            <button onClick={() => setShowWeightModal(false)} className="text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-100 transition-all">
                                <X className="w-5 h-5" />
                            </button>
                        </header>

                        <div className="p-6 max-h-[60vh] overflow-y-auto space-y-4">
                            {project.assignments.map(a => (
                                <div key={a.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-blue-200 transition-all">
                                    <div className="flex-1 min-w-0 pr-4">
                                        <p className="font-bold text-slate-700 text-sm truncate">{a.title}</p>
                                        <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mt-1">Actividad</p>
                                    </div>
                                    <div className="flex items-center gap-3 w-32">
                                        <div className="relative flex-1">
                                            <input
                                                type="number"
                                                min="1"
                                                max="100"
                                                value={localWeights[a.id]}
                                                onChange={(e) => setLocalWeights({ ...localWeights, [a.id]: parseInt(e.target.value) || 0 })}
                                                className="w-full pl-3 pr-8 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:ring-4 focus:ring-blue-50 focus:border-blue-300 outline-none transition-all text-center"
                                            />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">%</span>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            <div className="mt-6 p-4 bg-blue-50 rounded-2xl border border-blue-100 flex items-center justify-between">
                                <span className="text-sm font-bold text-blue-700">Suma Total:</span>
                                <span className={cn(
                                    "text-lg font-black",
                                    Object.values(localWeights).reduce((a, b) => a + b, 0) === 100 ? "text-emerald-600" : "text-amber-600"
                                )}>
                                    {Object.values(localWeights).reduce((a, b) => a + b, 0)}%
                                </span>
                            </div>
                            {Object.values(localWeights).reduce((a, b) => a + b, 0) !== 100 && (
                                <p className="text-[10px] text-amber-500 font-bold text-center">Nota: Los pesos no suman 100%, el sistema los normalizará proporcionalmente.</p>
                            )}
                        </div>

                        <footer className="p-6 border-t border-slate-100 flex gap-3">
                            <button
                                onClick={() => setShowWeightModal(false)}
                                className="flex-1 py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-2xl transition-all"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSaveWeights}
                                disabled={isSavingWeights}
                                className="flex-[2] py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-lg shadow-blue-100 flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5 disabled:opacity-50"
                            >
                                {isSavingWeights ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                Guardar Configuración
                            </button>
                        </footer>
                    </div>
                </div>
            )}

            <StatusModal
                isOpen={!!statusModal}
                onClose={() => setStatusModal(null)}
                type={statusModal?.type || 'success'}
                title={statusModal?.title || ''}
                message={statusModal?.message || ''}
            />
        </div>
    );
}
