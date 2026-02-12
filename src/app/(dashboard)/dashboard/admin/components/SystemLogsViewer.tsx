'use client';

import { useState, useEffect, useCallback } from 'react';
import { getSystemLogs, getLogUsers } from '@/app/actions/log-actions';
import { Loader2, RefreshCw, Filter } from 'lucide-react';



// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function SystemLogsViewer({ initialLogs }: { initialLogs?: any[] }) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [logs, setLogs] = useState<any[]>(initialLogs || []);

    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [filters, setFilters] = useState({
        userId: '',
        level: ''
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [users, setUsers] = useState<any[]>([]);


    // Fetch available users for filter
    useEffect(() => {
        getLogUsers().then(setUsers).catch(console.error);
    }, []);

    const fetchLogs = useCallback(async (resetPage = false) => {
        setLoading(true);
        try {
            const currentPage = resetPage ? 1 : page;
            const res = await getSystemLogs({
                page: currentPage,
                limit: 50,
                userId: filters.userId || undefined,
                level: filters.level || undefined
            });
            setLogs(res.logs);
            setTotalPages(res.pagination.totalPages);
            if (resetPage) setPage(1);
        } catch (error) {
            console.error("Error fetching logs:", error);
        } finally {
            setLoading(false);
        }
    }, [filters, page]);

    // Initial load if no initialLogs (or just reliance on useEffect for client-side filtering)
    // We want to refetch when filters change
    useEffect(() => {
        fetchLogs(true);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filters]);

    // Handle page change
    useEffect(() => {
        if (page > 1) fetchLogs(false);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page]);


    return (
        <div className="space-y-4">
            {/* Filters Header */}
            <div className="flex flex-col md:flex-row gap-4 items-end md:items-center justify-between bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="flex flex-wrap gap-3 items-center w-full md:w-auto">
                    <div className="flex items-center gap-2 text-slate-600 font-medium">
                        <Filter className="w-4 h-4" /> Filtros:
                    </div>

                    <select
                        value={filters.userId}
                        onChange={(e) => setFilters(prev => ({ ...prev, userId: e.target.value }))}
                        className="text-sm border-slate-200 rounded-lg focus:ring-primary focus:border-primary"
                    >
                        <option value="">Todos los Usuarios</option>
                        {users.map(u => (
                            <option key={u.id} value={u.id}>{u.name || u.email} ({u.role})</option>
                        ))}
                    </select>

                    <select
                        value={filters.level}
                        onChange={(e) => setFilters(prev => ({ ...prev, level: e.target.value }))}
                        className="text-sm border-slate-200 rounded-lg focus:ring-primary focus:border-primary"
                    >
                        <option value="">Todos los Niveles</option>
                        <option value="INFO">INFO</option>
                        <option value="WARN">WARN</option>
                        <option value="ERROR">ERROR</option>
                        <option value="CRITICAL">CRITICAL</option>
                    </select>

                    {(filters.userId || filters.level) && (
                        <button
                            onClick={() => setFilters({ userId: '', level: '' })}
                            className="text-xs text-red-500 hover:text-red-700 underline"
                        >
                            Limpiar
                        </button>
                    )}
                </div>

                <button
                    onClick={() => fetchLogs(false)}
                    className="p-2 text-slate-400 hover:text-primary transition-colors"
                    title="Recargar"
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            {/* Logs Table */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-slate-500">
                        <thead className="text-xs text-slate-700 uppercase bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-3">Nivel</th>
                                <th className="px-6 py-3">Acción</th>
                                <th className="px-6 py-3">Descripción</th>
                                <th className="px-6 py-3">Usuario</th>
                                <th className="px-6 py-3">Fecha</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {logs.length > 0 ? (
                                logs.map((log) => (
                                    <tr key={log.id} className="bg-white hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-md text-[10px] font-bold border ${log.level === 'ERROR' || log.level === 'CRITICAL'
                                                ? 'bg-red-50 text-red-700 border-red-100'
                                                : log.level === 'WARN' || log.level === 'WARNING'
                                                    ? 'bg-amber-50 text-amber-700 border-amber-100'
                                                    : 'bg-blue-50 text-blue-700 border-blue-100'
                                                }`}>
                                                {log.level}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 font-semibold text-slate-700">{log.action}</td>
                                        <td className="px-6 py-4">
                                            <div className="max-w-md truncate" title={log.description}>
                                                {log.description}
                                            </div>
                                            {log.metadata && (
                                                <div className="mt-1 text-[10px] font-mono text-slate-400 max-w-xs truncate">
                                                    {JSON.stringify(log.metadata)}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-medium text-slate-900">{log.user?.email || 'Sistema'}</span>
                                                <span className="text-[10px] text-slate-400">{log.user?.role}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-xs">
                                            {new Date(log.createdAt).toLocaleString()}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                                        {loading ? (
                                            <div className="flex justify-center items-center gap-2">
                                                <Loader2 className="w-4 h-4 animate-spin" /> Cargando logs...
                                            </div>
                                        ) : (
                                            "No se encontraron registros con los filtros actuales."
                                        )}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Footer */}
                <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex items-center justify-between">
                    <span className="text-xs text-slate-500">
                        Página {page} de {totalPages}
                    </span>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1 || loading}
                            className="px-3 py-1 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50"
                        >
                            Anterior
                        </button>
                        <button
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages || loading}
                            className="px-3 py-1 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50"
                        >
                            Siguiente
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
