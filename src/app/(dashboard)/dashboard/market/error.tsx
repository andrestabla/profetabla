'use client';

import { useEffect } from 'react';
import { AlertCircle, RefreshCcw, Home } from 'lucide-react';
import Link from 'next/link';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error('Marketplace Error:', error);
    }, [error]);

    return (
        <div className="min-h-[60vh] flex items-center justify-center p-6">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-200 p-8 text-center animate-in fade-in zoom-in duration-300">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <AlertCircle className="w-10 h-10 text-red-600" />
                </div>

                <h2 className="text-2xl font-bold text-slate-800 mb-2">¡Algo salió mal!</h2>
                <p className="text-slate-500 mb-8">
                    {error.message || 'Hubo un error al procesar tu solicitud. Por favor, intenta de nuevo.'}
                </p>

                <div className="flex flex-col gap-3">
                    <button
                        onClick={() => reset()}
                        className="flex items-center justify-center gap-2 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg"
                    >
                        <RefreshCcw className="w-5 h-5" /> Reintentar
                    </button>

                    <Link
                        href="/dashboard"
                        className="flex items-center justify-center gap-2 w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-3 rounded-xl transition-all"
                    >
                        <Home className="w-5 h-5" /> Regresar al Dashboard
                    </Link>
                </div>

                {error.digest && (
                    <p className="mt-6 text-[10px] text-slate-400 font-mono">
                        Error Digest: {error.digest}
                    </p>
                )}
            </div>
        </div>
    );
}
