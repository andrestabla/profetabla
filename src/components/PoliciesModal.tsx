'use client';

import { useState } from 'react';
import { ShieldCheck, GraduationCap, Lock, CheckCircle2, AlertTriangle } from 'lucide-react';
import { acceptPoliciesAction } from '@/app/actions/user-actions';

export default function PoliciesModal() {
    const [isAccepting, setIsAccepting] = useState(false);

    const handleAccept = async () => {
        setIsAccepting(true);
        try {
            await acceptPoliciesAction();
            // La recarga del layout ocultará el modal
        } catch (error) {
            console.error("Error al aceptar políticas:", error);
            setIsAccepting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-4 animate-in fade-in duration-500">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-500">
                {/* Header */}
                <div className="bg-slate-900 p-8 text-white relative">
                    <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg rotate-3">
                        <ShieldCheck className="w-10 h-10" />
                    </div>
                    <h2 className="text-3xl font-bold mb-2">Políticas de Uso Pedagógico</h2>
                    <p className="text-slate-400 text-lg">Tu privacidad y el uso ético de los datos son nuestra prioridad.</p>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8 space-y-6">
                    <section className="flex gap-4">
                        <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
                            <GraduationCap className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-800 text-lg">Finalidad Educativa</h3>
                            <p className="text-slate-600 leading-relaxed">
                                Esta plataforma ha sido diseñada exclusivamente para el apoyo pedagógico y la gestión de proyectos de aprendizaje. Los datos recopilados tienen como único fin facilitar la interacción docente-estudiante y mejorar los resultados académicos.
                            </p>
                        </div>
                    </section>

                    <section className="flex gap-4">
                        <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shrink-0">
                            <Lock className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-800 text-lg">Uso No Comercial</h3>
                            <p className="text-slate-600 leading-relaxed text-sm">
                                <strong className="text-slate-900">Profe Tabla</strong> se compromete a no comercializar, vender ni compartir tus datos personales con terceros para fines publicitarios o de marketing. La información pertenece a la comunidad educativa.
                            </p>
                        </div>
                    </section>

                    <section className="flex gap-4">
                        <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center shrink-0">
                            <AlertTriangle className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-800 text-lg">Protección de Datos</h3>
                            <p className="text-slate-600 leading-relaxed text-sm italic">
                                El tratamiento de la información se realiza conforme a las leyes vigentes de protección de datos personales, garantizando el derecho a la intimidad y la seguridad de la información institucional.
                            </p>
                        </div>
                    </section>

                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 mt-4">
                        <p className="text-slate-500 text-sm italic">
                            Al hacer clic en el botón de abajo, confirmas que has leído y aceptas los términos de uso y la política de privacidad pedagógica de la plataforma.
                        </p>
                    </div>
                </div>

                {/* Actions */}
                <div className="p-8 bg-slate-50 border-t border-slate-100">
                    <button
                        onClick={handleAccept}
                        disabled={isAccepting}
                        className="w-full py-4 bg-slate-900 hover:bg-black text-white font-bold rounded-2xl shadow-xl transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3 text-lg"
                    >
                        {isAccepting ? (
                            <span className="w-6 h-6 border-4 border-white/20 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>
                                <CheckCircle2 className="w-6 h-6" />
                                Aceptar y Continuar
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
