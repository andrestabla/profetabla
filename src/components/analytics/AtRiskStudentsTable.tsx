'use client';

import Link from 'next/link';
import { AlertTriangle, Mail } from 'lucide-react';

interface AtRiskStudent {
    id: string;
    name: string;
    email: string;
    progress: number;
    missedDeadlines: number;
    lastActivity: string;
}

interface AtRiskStudentsTableProps {
    students: AtRiskStudent[];
}

export function AtRiskStudentsTable({ students }: AtRiskStudentsTableProps) {
    return (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <div className="flex items-center gap-3 mb-6">
                <AlertTriangle className="w-6 h-6 text-red-500" />
                <h3 className="text-lg font-bold text-slate-900">Estudiantes en Riesgo</h3>
            </div>

            {students.length === 0 ? (
                <div className="text-center py-8">
                    <p className="text-green-600 font-medium">¡Excelente! No hay estudiantes en riesgo</p>
                    <p className="text-slate-500 text-sm mt-2">Todos los estudiantes están al día con sus entregas</p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-slate-200">
                                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Estudiante</th>
                                <th className="text-center py-3 px-4 text-sm font-semibold text-slate-700">Progreso</th>
                                <th className="text-center py-3 px-4 text-sm font-semibold text-slate-700">Entregas Pendientes</th>
                                <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {students.map((student) => (
                                <tr key={student.id} className="border-b border-slate-100 hover:bg-red-50 transition-colors">
                                    <td className="py-3 px-4">
                                        <Link
                                            href={`/dashboard/admin/users/${student.id}`}
                                            className="hover:text-blue-600 transition-colors"
                                        >
                                            <div className="font-medium text-slate-900">{student.name}</div>
                                            <div className="text-xs text-slate-500">{student.email}</div>
                                        </Link>
                                    </td>
                                    <td className="py-3 px-4 text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            <div className="w-24 bg-slate-200 rounded-full h-2">
                                                <div
                                                    className="bg-red-500 h-2 rounded-full"
                                                    style={{ width: `${student.progress}%` }}
                                                />
                                            </div>
                                            <span className="text-sm font-semibold text-red-600">
                                                {student.progress}%
                                            </span>
                                        </div>
                                    </td>
                                    <td className="py-3 px-4 text-center">
                                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                                            {student.missedDeadlines} pendientes
                                        </span>
                                    </td>
                                    <td className="py-3 px-4 text-right">
                                        <a
                                            href={`mailto:${student.email}`}
                                            className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                                        >
                                            <Mail className="w-4 h-4" />
                                            Contactar
                                        </a>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
