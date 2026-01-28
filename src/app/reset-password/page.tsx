
'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';

export default function ResetPasswordPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get('token');

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [status, setStatus] = useState<'IDLE' | 'LOADING' | 'SUCCESS' | 'ERROR'>('IDLE');
    const [message, setMessage] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            setStatus('ERROR');
            setMessage('Las contraseñas no coinciden.');
            return;
        }

        if (!token) {
            setStatus('ERROR');
            setMessage('Token inválido.');
            return;
        }

        setStatus('LOADING');
        setMessage('');

        try {
            const res = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, password })
            });

            const data = await res.json();

            if (res.ok) {
                setStatus('SUCCESS');
            } else {
                setStatus('ERROR');
                setMessage(data.error || 'Error al restablecer la contraseña.');
            }
        } catch {
            setStatus('ERROR');
            setMessage('Error de conexión.');
        }
    };

    if (!token) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
                <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl text-center">
                    <h1 className="text-xl font-bold text-red-600 mb-2">Token Faltante</h1>
                    <p className="text-slate-500 mb-6">El enlace de recuperación no es válido.</p>
                    <Link href="/forgot-password" className="text-blue-600 font-bold hover:underline">Solicitar nuevo enlace</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
            <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold text-slate-800">Nueva Contraseña</h1>
                    <p className="text-slate-500 text-sm">Ingresa tu nueva contraseña para acceder.</p>
                </div>

                {status === 'SUCCESS' ? (
                    <div className="text-center">
                        <div className="bg-green-100 text-green-700 p-4 rounded-xl mb-6">
                            ¡Contraseña actualizada correctamente!
                        </div>
                        <Link href="/login" className="block w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition">
                            Iniciar Sesión
                        </Link>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {status === 'ERROR' && (
                            <div className="bg-red-100 text-red-700 p-3 rounded-lg text-sm text-center">
                                {message}
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Nueva Contraseña</label>
                            <input
                                type="password"
                                required
                                minLength={6}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 border-transparent outline-none transition"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Confirmar Contraseña</label>
                            <input
                                type="password"
                                required
                                minLength={6}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 border-transparent outline-none transition"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={status === 'LOADING'}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-blue-500/30 disabled:opacity-50"
                        >
                            {status === 'LOADING' ? 'Actualizando...' : 'Cambiar Contraseña'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
