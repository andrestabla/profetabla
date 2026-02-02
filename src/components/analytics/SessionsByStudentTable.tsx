'use client';

import { Users } from 'lucide-react';

interface StudentMentorship {
    id: string;
    name: string;
    count: number;
}

interface SessionsByStudentTableProps {
    data: StudentMentorship[];
}

export function SessionsByStudentTable({ data }: SessionsByStudentTableProps) {
    return (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <div className="flex items-center gap-3 mb-6">
                <Users className="w-6 h-6 text-purple-600" />
                <h3 className="text-lg font-bold text-slate-900">Mentorías por Estudiante</h3>
            </div>

            {data.length === 0 ? (
                <p className="text-slate-500 text-center py-8">No hay datos disponibles</p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-slate-200">
                                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Estudiante</th>
                                <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">Sesiones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((item) => (
                                <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                                    <td className="py-3 px-4">
                                        <div className="font-medium text-slate-900">{item.name}</div>
                                    </td>
                                    <td className="py-3 px-4 text-right">
                                        <span className="text-lg font-bold text-slate-900">{item.count}</span>
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
