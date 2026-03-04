import { Loader2 } from 'lucide-react';

export default function Skills21Loading() {
    return (
        <div className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white px-5 py-6">
                <div className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-700">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Cargando módulo Ocupaciones y habilidades del Siglo XXI...
                </div>
                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="h-20 rounded-xl bg-slate-100 animate-pulse" />
                    <div className="h-20 rounded-xl bg-slate-100 animate-pulse" />
                    <div className="h-20 rounded-xl bg-slate-100 animate-pulse" />
                </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="h-6 w-56 rounded bg-slate-100 animate-pulse" />
                <div className="mt-4 grid grid-cols-1 xl:grid-cols-2 gap-4">
                    <div className="h-64 rounded-xl bg-slate-100 animate-pulse" />
                    <div className="h-64 rounded-xl bg-slate-100 animate-pulse" />
                </div>
            </div>
        </div>
    );
}
