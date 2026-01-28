
'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function VerifyEmailPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get('token');

    const [status, setStatus] = useState<'LOADING' | 'SUCCESS' | 'ERROR'>('LOADING');
    const [message, setMessage] = useState('');

    useEffect(() => {
        if (!token) {
            setStatus('ERROR');
            setMessage('Token no válido o faltante.');
            return;
        }

        const verify = async () => {
            try {
                const res = await fetch('/api/auth/verify-email', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ token })
                });

                const data = await res.json();

                if (res.ok) {
                    setStatus('SUCCESS');
                } else {
                    setStatus('ERROR');
                    setMessage(data.error || 'Error al verificar el correo.');
                }
            } catch (error) {
                setStatus('ERROR');
                setMessage('Error de conexión.');
            }
        };

        verify();
    }, [token]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
            <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl text-center">
                {status === 'LOADING' && (
                    <>
                        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
                        <h1 className="text-2xl font-bold text-slate-800 mb-2">Verificando...</h1>
                        <p className="text-slate-500">Estamos validando tu correo electrónico.</p>
                    </>
                )}

                {status === 'SUCCESS' && (
                    <>
                        <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                        </div>
                        <h1 className="text-2xl font-bold text-slate-800 mb-2">¡Correo Verificado!</h1>
                        <p className="text-slate-500 mb-8">Tu cuenta ha sido activada correctamente.</p>
                        <Link href="/login" className="block w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition">
                            Iniciar Sesión
                        </Link>
                    </>
                )}

                {status === 'ERROR' && (
                    <>
                        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                        </div>
                        <h1 className="text-2xl font-bold text-slate-800 mb-2">Error de Verificación</h1>
                        <p className="text-slate-500 mb-8">{message}</p>
                        <Link href="/login" className="text-blue-600 font-bold hover:underline">
                            Volver al Inicio
                        </Link>
                    </>
                )}
            </div>
        </div>
    );
}
