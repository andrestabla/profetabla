'use client';

import { useState } from 'react';
import { Mail, Key, Trash2, Ban, CheckCircle, Shield, Award } from 'lucide-react';
import { useModals } from '@/components/ModalProvider';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function UserActionsClient({ user, toggleAction, deleteAction, roleAction, msgAction, resetAction }: any) {
    const { showAlert, showConfirm } = useModals();
    const [isProcessing, setIsProcessing] = useState(false);

    // Message State
    const [msgOpen, setMsgOpen] = useState(false);
    const [message, setMessage] = useState('');

    const handleAction = async (fn: () => Promise<void>) => {
        setIsProcessing(true);
        try {
            await fn();
        } catch (e) {
            await showAlert("Error", "Error al ejecutar acción", "error");
        }
        setIsProcessing(false);
    };

    const handleResetPassword = async () => {
        const confirmReset = await showConfirm(
            "¿Resetear contraseña?",
            "El usuario perderá acceso hasta recibir la nueva clave.",
            "warning"
        );
        if (!confirmReset) return;
        setIsProcessing(true);
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const res = await resetAction(user.id) as any;
            if (res?.tempPassword) {
                await showAlert(
                    "Contraseña Reseteada",
                    `Contraseña temporal generada: ${res.tempPassword}\n\nCópiala y envíala al usuario.`,
                    "success"
                );
            }
        } catch (e) {
            await showAlert("Error", "Error al resetear contraseña", "error");
        }
        setIsProcessing(false);
    };

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="font-bold text-slate-800 mb-4 text-sm uppercase tracking-wider">Gestión de Cuenta</h3>
                <div className="space-y-3">
                    <button
                        onClick={() => handleAction(() => toggleAction(user.id, !user.isActive))}
                        disabled={isProcessing}
                        className={`w-full flex items-center justify-between p-3 rounded-lg border text-sm font-bold transition-all
                            ${user.isActive
                                ? 'border-red-200 bg-red-50 text-red-700 hover:bg-red-100'
                                : 'border-green-200 bg-green-50 text-green-700 hover:bg-green-100'
                            }`}
                    >
                        <span className="flex items-center gap-2">
                            {user.isActive ? <Ban className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                            {user.isActive ? 'Suspender Usuario' : 'Reactivar Usuario'}
                        </span>
                    </button>

                    <button
                        onClick={handleResetPassword}
                        disabled={isProcessing}
                        className="w-full flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-bold transition-all"
                    >
                        <span className="flex items-center gap-2">
                            <Key className="w-4 h-4" /> Resetear Contraseña
                        </span>
                    </button>

                    <button
                        onClick={() => setMsgOpen(!msgOpen)}
                        className="w-full flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-bold transition-all"
                    >
                        <span className="flex items-center gap-2">
                            <Mail className="w-4 h-4" /> Enviar Mensaje
                        </span>
                    </button>

                    {msgOpen && (
                        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 animate-in slide-in-from-top-2">
                            <textarea
                                value={message}
                                onChange={e => setMessage(e.target.value)}
                                className="w-full p-2 border rounded mb-2 text-sm"
                                placeholder="Escribe tu mensaje..."
                                rows={3}
                            />
                            <button
                                onClick={() => { handleAction(() => msgAction(user.id, message)); setMessage(''); setMsgOpen(false); }}
                                className="w-full bg-blue-600 text-white text-xs font-bold py-2 rounded"
                            >
                                Enviar
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="font-bold text-slate-800 mb-4 text-sm uppercase tracking-wider">Roles y Permisos</h3>
                <div className="grid grid-cols-2 gap-2">
                    {['STUDENT', 'TEACHER', 'ADMIN'].map((role) => (
                        <button
                            key={role}
                            onClick={() => handleAction(() => roleAction(user.id, role))}
                            disabled={user.role === role || isProcessing}
                            className={`p-2 rounded-lg text-xs font-bold border transition-all ${user.role === role
                                ? 'bg-slate-900 text-white border-slate-900'
                                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
                                }`}
                        >
                            {role}
                        </button>
                    ))}
                </div>
            </div>

            <div className="p-4 border border-red-200 bg-red-50 rounded-xl">
                <h4 className="text-red-800 font-bold text-sm mb-2 flex items-center gap-2">
                    <Trash2 className="w-4 h-4" /> Zona de Peligro
                </h4>
                <p className="text-red-600 text-xs mb-3">
                    Eliminar al usuario borrará permanentemente todos sus datos.
                </p>
                <button
                    onClick={async () => {
                        const confirmDelete = await showConfirm(
                            "¿Eliminar usuario?",
                            "¿Eliminar permanentemente? Esta acción borrará todos sus datos y no se puede deshacer.",
                            "danger"
                        );
                        if (confirmDelete) handleAction(() => deleteAction(user.id));
                    }}
                    disabled={isProcessing}
                    className="w-full bg-white border border-red-300 text-red-600 hover:bg-red-600 hover:text-white font-bold py-2 px-4 rounded-lg text-sm transition-all"
                >
                    Eliminar Usuario
                </button>
            </div>
        </div>
    );
}
