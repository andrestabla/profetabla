'use client';

import { BookOpen } from 'lucide-react';

interface ProjectResource {
    projectId: string;
    projectName: string;
    resourceCount: number;
    accesses: number;
}

interface ResourcesByProjectTableProps {
    data: ProjectResource[];
}

export function ResourcesByProjectTable({ data }: ResourcesByProjectTableProps) {
    return (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <div className="flex items-center gap-3 mb-6">
                <BookOpen className="w-6 h-6 text-green-600" />
                <h3 className="text-lg font-bold text-slate-900">Recursos por Proyecto</h3>
            </div>

            {data.length === 0 ? (
                <p className="text-slate-500 text-center py-8">No hay datos disponibles</p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-slate-200">
                                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Proyecto</th>
                                <th className="text-center py-3 px-4 text-sm font-semibold text-slate-700">Cant. Recursos</th>
                                <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">Total Accesos</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((item) => (
                                <tr key={item.projectId} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                                    <td className="py-3 px-4">
                                        <div className="font-medium text-slate-900">{item.projectName}</div>
                                    </td>
                                    <td className="py-3 px-4 text-center">
                                        <span className="text-sm font-medium text-slate-700">{item.resourceCount}</span>
                                    </td>
                                    <td className="py-3 px-4 text-right">
                                        <span className="text-sm font-bold text-blue-600">{item.accesses}</span>
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
