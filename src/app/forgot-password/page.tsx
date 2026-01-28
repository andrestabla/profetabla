
'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState<'IDLE' | 'LOADING' | 'SUCCESS' | 'ERROR'>('IDLE');
    const [message, setMessage] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('LOADING');
        setMessage('');

        try {
            const res = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });

            const data = await res.json();

            if (res.ok) {
                setStatus('SUCCESS');
                setMessage('Si el correo existe, recibirás instrucciones para restablecer tu contraseña.');
            } else {
                setStatus('ERROR');
                setMessage(data.error || 'Ocurrió un error.');
            }
        } catch {
            setStatus('ERROR');
            setMessage('Error de conexión.');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
            <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold text-slate-800">Recuperar Contraseña</h1>
                    <p className="text-slate-500 text-sm">Ingresa tu correo para recibir un enlace de recuperación.</p>
                </div>

                {status === 'SUCCESS' ? (
                    <div className="text-center">
                        <div className="bg-green-100 text-green-700 p-4 rounded-xl mb-6">
                            {message}
                        </div>
                        <Link href="/login" className="text-blue-600 font-bold hover:underline">
                            Volver al Login
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
                            <label className="block text-sm font-bold text-slate-700 mb-1">Correo Electrónico</label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                                placeholder="tu@email.com"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={status === 'LOADING'}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {status === 'LOADING' ? 'Enviando...' : 'Enviar Enlace'}
                        </button>

                        <div className="text-center mt-6">
                            <Link href="/login" className="text-slate-500 hover:text-slate-800 text-sm font-bold transition">
                                &larr; Volver al inicio de sesión
                            </Link>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
