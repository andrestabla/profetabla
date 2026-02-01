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
    GraduationCap
} from 'lucide-react';
import { cn } from '@/lib/utils';

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
};

type Assignment = {
    id: string;
    title: string;
    submissions: Submission[];
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

export default function ProfessorGradesClient({ projects }: { projects: Project[] }) {
    const [selectedProjectId, setSelectedProjectId] = useState<string>(projects[0]?.id || '');
    const [searchQuery, setSearchQuery] = useState('');

    const project = useMemo(() => projects.find(p => p.id === selectedProjectId), [projects, selectedProjectId]);

    const filteredStudents = useMemo(() => {
        if (!project) return [];
        return project.students.filter(s =>
            s.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.email?.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [project, searchQuery]);

    const handleExportCSV = () => {
        if (!project) return;

        // Header: Estudiante, Email, Assignment 1, Assignment 2, ..., Promedio
        const headers = ['Estudiante', 'Email', ...project.assignments.map(a => a.title), 'Promedio'];

        const rows = project.students.map(student => {
            const studentGrades = project.assignments.map(a => {
                const sub = a.submissions.find(s => s.studentId === student.id);
                return sub?.grade ?? '--';
            });

            const numericGrades = studentGrades.filter(g => typeof g === 'number') as number[];
            const average = numericGrades.length > 0
                ? (numericGrades.reduce((a, b) => a + b, 0) / numericGrades.length).toFixed(1)
                : '0.0';

            return [
                student.name || 'Sin nombre',
                student.email || 'Sin email',
                ...studentGrades,
                average
            ];
        });

        const csvContent = [
            headers.join(','),
            ...rows.map(r => r.join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `Calificaciones_${project.title.replace(/\s+/g, '_')}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
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

    return (
        <div className="max-w-[1400px] mx-auto p-4 md:p-8 space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Sábana de Calificaciones</h1>
                    <p className="text-slate-500 mt-2 font-medium">Gestión centralizada de notas por proyecto y estudiante.</p>
                </div>

                <button
                    onClick={handleExportCSV}
                    disabled={!project}
                    className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl shadow-lg shadow-emerald-100 transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:transform-none"
                >
                    <Download className="w-5 h-5" />
                    Exportar a CSV
                </button>
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
                                        const studentGrades = project.assignments.map(a => {
                                            const sub = a.submissions.find(s => s.studentId === student.id);
                                            return sub?.grade;
                                        });

                                        const numericGrades = studentGrades.filter(g => typeof g === 'number') as number[];
                                        const average = numericGrades.length > 0
                                            ? (numericGrades.reduce((a, b) => a + b, 0) / numericGrades.length).toFixed(1)
                                            : '0.0';

                                        return (
                                            <tr key={student.id} className="hover:bg-slate-50 transition-colors group">
                                                <td className="px-6 py-4 sticky left-0 bg-white group-hover:bg-slate-50 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold overflow-hidden border border-slate-200">
                                                            {student.avatarUrl ? <img src={student.avatarUrl} alt={student.name || "Avatar"} className="w-full h-full object-cover" /> : student.name?.[0]}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="font-bold text-slate-800 text-sm truncate">{student.name}</p>
                                                            <p className="text-[10px] text-slate-400 flex items-center gap-1">
                                                                <Mail className="w-3 h-3" /> {student.email}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>
                                                {studentGrades.map((grade, idx) => (
                                                    <td key={idx} className="px-6 py-4 text-center">
                                                        {grade !== undefined && grade !== null ? (
                                                            <span className="inline-block min-w-[40px] px-2 py-1 bg-blue-50 text-blue-700 text-sm font-black rounded-lg">
                                                                {grade}
                                                            </span>
                                                        ) : (
                                                            <span className="text-slate-300 font-bold">--</span>
                                                        )}
                                                    </td>
                                                ))}
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
        </div>
    );
}
