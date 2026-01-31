
'use client';

import { useState } from 'react';
import { joinByCodeAction } from '@/app/actions/project-actions';
import { useRouter } from 'next/navigation';
import { Hash, ArrowRight, Loader2, AlertTriangle, CheckCircle } from 'lucide-react';

export default function JoinProjectPage() {
    const router = useRouter();
    const [code, setCode] = useState('');
    const [isJoining, setIsJoining] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleJoin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!code.trim() || code.length < 5) return;

        setIsJoining(true);
        setError('');

        try {
            await joinByCodeAction(code.toUpperCase());
            setSuccess(true);
            setTimeout(() => {
                router.push('/dashboard');
            }, 1000);
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Código inválido o error al unirse.';
            setError(errorMessage);
            setIsJoining(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-slate-100">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-600">
                        <Hash className="w-8 h-8" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900">Unirse a un Proyecto</h1>
                    <p className="text-slate-500 mt-2">Ingresa el código de acceso proporcionado por tu docente.</p>
                </div>

                <form onSubmit={handleJoin} className="space-y-6">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Código de Acceso</label>
                        <input
                            type="text"
                            value={code}
                            onChange={(e) => setCode(e.target.value.toUpperCase())}
                            placeholder="Ej: X7K9P2"
                            className="w-full text-center text-3xl font-mono tracking-widest px-4 py-4 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all uppercase placeholder:text-slate-300"
                            maxLength={8}
                        />
                    </div>

                    {error && (
                        <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4" />
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="p-3 bg-green-50 text-green-600 text-sm rounded-lg flex items-center gap-2">
                            <CheckCircle className="w-4 h-4" />
                            ¡Te has unido correctamente! Redirigiendo...
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isJoining || success || code.length < 3}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isJoining ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Unirme al Proyecto <ArrowRight className="w-5 h-5" /></>}
                    </button>

                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="w-full text-slate-500 font-bold hover:text-slate-800 text-sm"
                    >
                        Cancelar y Volver
                    </button>
                </form>
            </div>
        </div>
    );
}
