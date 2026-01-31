'use client';

import { useState } from 'react';
import { generateAccessCodeAction, addStudentByEmailAction, regenerateAccessCodeAction } from '@/app/actions/project-actions';
import { RefreshCw, Copy, Check, UserPlus, Mail, AlertCircle, Loader2 } from 'lucide-react';

interface EnrollmentControlsProps {
    projectId: string;
    initialAccessCode: string | null;
}

export function EnrollmentControls({ projectId, initialAccessCode }: EnrollmentControlsProps) {
    const [accessCode, setAccessCode] = useState(initialAccessCode);
    const [isRegenerating, setIsRegenerating] = useState(false);
    const [email, setEmail] = useState('');
    const [isInviting, setIsInviting] = useState(false);
    const [inviteStatus, setInviteStatus] = useState<'IDLE' | 'SUCCESS' | 'ERROR'>('IDLE');
    const [copied, setCopied] = useState(false);

    const handleCopyCode = () => {
        if (accessCode) {
            navigator.clipboard.writeText(accessCode);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleGenerateCode = async () => {
        setIsRegenerating(true);
        try {
            const newCode = await (accessCode
                ? regenerateAccessCodeAction(projectId)
                : generateAccessCodeAction(projectId));
            setAccessCode(newCode);
        } catch (error) {
            console.error('Failed to generate code:', error);
        } finally {
            setIsRegenerating(false);
        }
    };

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;

        setIsInviting(true);
        setInviteStatus('IDLE');
        try {
            await addStudentByEmailAction(projectId, email);
            setInviteStatus('SUCCESS');
            setEmail('');
            setTimeout(() => setInviteStatus('IDLE'), 3000);
        } catch (error) {
            console.error(error);
            setInviteStatus('ERROR');
        } finally {
            setIsInviting(false);
        }
    };

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-8">
            <div>
                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <UserPlus className="w-5 h-5 text-blue-600" />
                    Vinculación de Estudiantes
                </h3>

                {/* Method 1: Access Code */}
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mb-6">
                    <div className="flex justify-between items-center mb-2">
                        <label className="text-xs font-bold text-slate-500 uppercase">Código de Acceso</label>
                        <button
                            onClick={handleGenerateCode}
                            disabled={isRegenerating}
                            className="text-xs text-blue-600 font-bold hover:underline flex items-center gap-1 disabled:opacity-50"
                        >
                            <RefreshCw className={`w-3 h-3 ${isRegenerating ? 'animate-spin' : ''}`} />
                            {accessCode ? 'Regenerar' : 'Generar Código'}
                        </button>
                    </div>

                    {accessCode ? (
                        <div className="flex items-center gap-2">
                            <code className="flex-1 bg-white border border-slate-300 rounded px-3 py-2 text-xl font-mono text-center font-bold tracking-widest text-slate-800">
                                {accessCode}
                            </code>
                            <button
                                onClick={handleCopyCode}
                                className="p-2.5 bg-white border border-slate-300 rounded hover:bg-slate-100 text-slate-600 transition-colors"
                                title="Copiar código"
                            >
                                {copied ? <Check className="w-5 h-5 text-green-600" /> : <Copy className="w-5 h-5" />}
                            </button>
                        </div>
                    ) : (
                        <div className="text-center py-3 text-slate-400 text-sm italic">
                            No hay código activo. Genera uno para permitir el acceso rápido.
                        </div>
                    )}
                    <p className="text-xs text-slate-500 mt-2">
                        Los estudiantes pueden ingresar este código en <b>/dashboard/join</b> para unirse automáticamente.
                    </p>
                </div>

                {/* Method 2: Direct Invite */}
                <div>
                    <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Invitar por Correo</label>
                    <form onSubmit={handleInvite} className="flex gap-2">
                        <div className="relative flex-1">
                            <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="estudiante@ejemplo.com"
                                className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={isInviting}
                            className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-slate-800 disabled:opacity-70 flex items-center gap-2"
                        >
                            {isInviting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Invitar'}
                        </button>
                    </form>

                    {inviteStatus === 'SUCCESS' && (
                        <p className="text-xs text-green-600 font-bold mt-2 flex items-center gap-1">
                            <Check className="w-3 h-3" /> Estudiante agregado correctamente.
                        </p>
                    )}

                    {inviteStatus === 'ERROR' && (
                        <p className="text-xs text-red-600 font-bold mt-2 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" /> Error al agregar. Verifica el correo.
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
