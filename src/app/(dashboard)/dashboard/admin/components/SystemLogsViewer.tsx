'use client';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Activity } from 'lucide-react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function SystemLogsViewer({ logs }: { logs: any[] }) {
    if (!logs || logs.length === 0) {
        return <div className="p-8 text-center text-slate-500">No hay logs registrados.</div>
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-500">
                <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                    <tr>
                        <th className="px-6 py-3">Nivel</th>
                        <th className="px-6 py-3">Acción</th>
                        <th className="px-6 py-3">Descripción</th>
                        <th className="px-6 py-3">Usuario</th>
                        <th className="px-6 py-3">Detalles</th>
                        <th className="px-6 py-3">Fecha</th>
                    </tr>
                </thead>
                <tbody>
                    {logs.map((log) => (
                        <tr key={log.id} className="bg-white border-b hover:bg-slate-50">
                            <td className="px-6 py-4">
                                <span className={`px-2 py-1 rounded text-xs font-bold ${log.level === 'ERROR' || log.level === 'CRITICAL' ? 'bg-red-100 text-red-800' :
                                    log.level === 'WARN' || log.level === 'WARNING' ? 'bg-amber-100 text-amber-800' :
                                        'bg-blue-100 text-blue-800'
                                    }`}>
                                    {log.level}
                                </span>
                            </td>
                            <td className="px-6 py-4 font-medium text-slate-900">{log.action}</td>
                            <td className="px-6 py-4">{log.description}</td>
                            <td className="px-6 py-4 text-xs">{log.user?.email || 'SYSTEM'}</td>
                            <td className="px-6 py-4">
                                {log.metadata ? (
                                    <div className="text-[10px] font-mono bg-slate-100 p-1 rounded max-w-[200px] overflow-hidden truncate" title={JSON.stringify(log.metadata, null, 2)}>
                                        {JSON.stringify(log.metadata)}
                                    </div>
                                ) : '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">{new Date(log.createdAt).toLocaleString()}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
