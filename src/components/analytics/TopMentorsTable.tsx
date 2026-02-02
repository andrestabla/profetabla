'use client';

import { Calendar, User } from 'lucide-react';

interface Mentor {
    id: string;
    name: string;
    sessionCount: number;
}

interface TopMentorsTableProps {
    mentors: Mentor[];
}

export function TopMentorsTable({ mentors }: TopMentorsTableProps) {
    return (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <div className="flex items-center gap-3 mb-6">
                <Calendar className="w-6 h-6 text-purple-600" />
                <h3 className="text-lg font-bold text-slate-900">Mentores más Activos</h3>
            </div>

            {mentors.length === 0 ? (
                <p className="text-slate-500 text-center py-8">No hay datos disponibles</p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-slate-200">
                                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Mentor</th>
                                <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">Sesiones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {mentors.map((mentor) => (
                                <tr key={mentor.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                                    <td className="py-3 px-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                                                <User className="w-4 h-4" />
                                            </div>
                                            <div className="font-medium text-slate-900">{mentor.name}</div>
                                        </div>
                                    </td>
                                    <td className="py-3 px-4 text-right">
                                        <span className="text-lg font-bold text-slate-900">
                                            {mentor.sessionCount}
                                        </span>
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
