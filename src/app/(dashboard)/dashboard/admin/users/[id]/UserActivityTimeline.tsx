'use client';

import { useCallback, useEffect, useState } from 'react';
import { Activity, Clock } from 'lucide-react';

type ActivityLogItem = {
    id: string;
    action: string;
    description: string | null;
    level: string;
    createdAt: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    metadata?: any;
};

function levelBadge(level: string) {
    const normalized = (level || '').toUpperCase();
    if (normalized === 'CRITICAL') return 'bg-red-500 text-white';
    if (normalized === 'ERROR') return 'bg-rose-500 text-white';
    if (normalized === 'WARN' || normalized === 'WARNING') return 'bg-amber-500 text-white';
    return 'bg-blue-500 text-white';
}

export default function UserActivityTimeline({
    userId,
    initialLogs
}: {
    userId: string;
    initialLogs: ActivityLogItem[];
}) {
    const [logs, setLogs] = useState<ActivityLogItem[]>(initialLogs || []);
    const [isPolling, setIsPolling] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<string>(new Date().toISOString());

    const fetchLogs = useCallback(async () => {
        try {
            setIsRefreshing(true);
            const res = await fetch(`/api/activity/user/${userId}?take=300`, { cache: 'no-store' });
            if (!res.ok) return;

            const data = await res.json();
            const nextLogs = (data.logs || []).map((log: ActivityLogItem) => ({
                ...log,
                createdAt: typeof log.createdAt === 'string' ? log.createdAt : new Date(log.createdAt).toISOString()
            }));

            setLogs((prev) => {
                const prevTop = prev[0];
                const nextTop = nextLogs[0];
                const sameHead = prevTop?.id === nextTop?.id && prevTop?.createdAt === nextTop?.createdAt;
                const sameLength = prev.length === nextLogs.length;
                return sameHead && sameLength ? prev : nextLogs;
            });
            setLastUpdated(new Date().toISOString());
        } catch (error) {
            console.error('[UserActivityTimeline] poll error:', error);
        } finally {
            setIsRefreshing(false);
        }
    }, [userId]);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    useEffect(() => {
        if (!isPolling) return;
        const timer = window.setInterval(fetchLogs, 5000);
        return () => window.clearInterval(timer);
    }, [fetchLogs, isPolling]);

    return (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-indigo-600" /> Historial de Actividad
                </h3>

                <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-full ${isPolling ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                        <Activity className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-pulse' : ''}`} />
                        {isPolling ? 'En vivo' : 'Pausado'}
                    </span>
                    <button
                        onClick={() => setIsPolling((prev) => !prev)}
                        className="text-xs font-bold text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg px-2.5 py-1.5"
                    >
                        {isPolling ? 'Pausar' : 'Reanudar'}
                    </button>
                </div>
            </div>

            <p className="text-[11px] text-slate-400 mb-4">
                Última actualización: {new Date(lastUpdated).toLocaleTimeString('es-ES')}
            </p>

            <div className="space-y-8 relative before:absolute before:left-3.5 before:top-2 before:bottom-0 before:w-0.5 before:bg-slate-100">
                {logs.length === 0 ? (
                    <p className="text-center text-slate-400 py-4">Sin actividad registrada.</p>
                ) : (
                    logs.map((log) => (
                        <div key={log.id} className="relative pl-10">
                            <div className={`absolute left-0 top-0 w-7 h-7 rounded-full border-2 border-white shadow-sm flex items-center justify-center text-[10px] font-bold z-10 ${levelBadge(log.level)}`}>
                                {(log.level || 'I')[0]}
                            </div>
                            <div>
                                <p className="text-sm font-bold text-slate-700">{log.action}</p>
                                <p className="text-xs text-slate-500 mb-1">{log.description || 'Sin descripción'}</p>
                                <p className="text-[10px] text-slate-400 font-mono">
                                    {new Date(log.createdAt).toLocaleString('es-ES')}
                                </p>
                                {log.metadata && (
                                    <div className="mt-2 p-2 bg-slate-50 rounded text-xs text-slate-600 font-mono break-all">
                                        {typeof log.metadata === 'string' ? log.metadata : JSON.stringify(log.metadata)}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

