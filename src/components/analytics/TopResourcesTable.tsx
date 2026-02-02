'use client';

import { FileText, Eye } from 'lucide-react';

interface TopResource {
    id: string;
    title: string;
    type: string;
    accessCount: number;
    projectName: string;
}

interface TopResourcesTableProps {
    resources: TopResource[];
}

export function TopResourcesTable({ resources }: TopResourcesTableProps) {
    return (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <div className="flex items-center gap-3 mb-6">
                <FileText className="w-6 h-6 text-blue-600" />
                <h3 className="text-lg font-bold text-slate-900">Recursos más Interactuados</h3>
            </div>

            {resources.length === 0 ? (
                <p className="text-slate-500 text-center py-8">No hay datos disponibles</p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-slate-200">
                                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Recurso</th>
                                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Tipo</th>
                                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Proyecto</th>
                                <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">Accesos</th>
                            </tr>
                        </thead>
                        <tbody>
                            {resources.map((resource) => (
                                <tr key={resource.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                                    <td className="py-3 px-4">
                                        <div className="font-medium text-slate-900">{resource.title}</div>
                                    </td>
                                    <td className="py-3 px-4">
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-800">
                                            {resource.type}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4 text-sm text-slate-600">
                                        {resource.projectName}
                                    </td>
                                    <td className="py-3 px-4 text-right">
                                        <div className="flex items-center justify-end gap-1.5 text-blue-600 font-semibold">
                                            <Eye className="w-4 h-4" />
                                            {resource.accessCount}
                                        </div>
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
