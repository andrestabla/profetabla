'use client';

import Link from 'next/link';
import { Trophy, TrendingUp } from 'lucide-react';

interface TopPerformer {
    id: string;
    name: string;
    email: string;
    completionRate: number;
    projectsEnrolled: number;
    completedAssignments: number;
    totalAssignments: number;
}

interface TopPerformersTableProps {
    performers: TopPerformer[];
}

export function TopPerformersTable({ performers }: TopPerformersTableProps) {
    return (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <div className="flex items-center gap-3 mb-6">
                <Trophy className="w-6 h-6 text-yellow-500" />
                <h3 className="text-lg font-bold text-slate-900">Top 10 Estudiantes</h3>
            </div>

            {performers.length === 0 ? (
                <p className="text-slate-500 text-center py-8">No hay datos disponibles</p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-slate-200">
                                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">#</th>
                                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Estudiante</th>
                                <th className="text-center py-3 px-4 text-sm font-semibold text-slate-700">Tasa de Completitud</th>
                                <th className="text-center py-3 px-4 text-sm font-semibold text-slate-700">Entregas</th>
                                <th className="text-center py-3 px-4 text-sm font-semibold text-slate-700">Proyectos</th>
                            </tr>
                        </thead>
                        <tbody>
                            {performers.map((performer, index) => (
                                <tr key={performer.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                                    <td className="py-3 px-4">
                                        <div className="flex items-center gap-2">
                                            {index < 3 && (
                                                <Trophy className={`w-4 h-4 ${index === 0 ? 'text-yellow-500' :
                                                        index === 1 ? 'text-slate-400' :
                                                            'text-orange-600'
                                                    }`} />
                                            )}
                                            <span className="text-sm font-medium text-slate-700">{index + 1}</span>
                                        </div>
                                    </td>
                                    <td className="py-3 px-4">
                                        <Link
                                            href={`/dashboard/admin/users/${performer.id}`}
                                            className="hover:text-blue-600 transition-colors"
                                        >
                                            <div className="font-medium text-slate-900">{performer.name}</div>
                                            <div className="text-xs text-slate-500">{performer.email}</div>
                                        </Link>
                                    </td>
                                    <td className="py-3 px-4 text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            <div className="w-24 bg-slate-200 rounded-full h-2">
                                                <div
                                                    className={`h-2 rounded-full ${performer.completionRate >= 80 ? 'bg-green-500' :
                                                            performer.completionRate >= 60 ? 'bg-yellow-500' :
                                                                'bg-red-500'
                                                        }`}
                                                    style={{ width: `${performer.completionRate}%` }}
                                                />
                                            </div>
                                            <span className="text-sm font-semibold text-slate-700">
                                                {performer.completionRate}%
                                            </span>
                                        </div>
                                    </td>
                                    <td className="py-3 px-4 text-center">
                                        <span className="text-sm text-slate-700">
                                            {performer.completedAssignments}/{performer.totalAssignments}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4 text-center">
                                        <span className="text-sm text-slate-700">{performer.projectsEnrolled}</span>
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
