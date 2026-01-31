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
                <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                    <p className="text-slate-600 leading-relaxed text-sm">
                        Profe Tabla es una plataforma educativa diseñada bajo principios de ética digital, protección de datos personales y responsabilidad pedagógica, orientada a fortalecer los procesos de enseñanza y aprendizaje en entornos presenciales, virtuales e híbridos.
                    </p>

                    <section className="space-y-4">
                        <div className="flex gap-4 items-center">
                            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
                                <GraduationCap className="w-6 h-6" />
                            </div>
                            <h3 className="font-bold text-slate-800 text-lg">1. Finalidad Educativa</h3>
                        </div>
                        <div className="pl-14 space-y-3">
                            <p className="text-slate-600 text-sm leading-relaxed">
                                La plataforma Profe Tabla tiene como finalidad exclusiva el apoyo a procesos pedagógicos, académicos y formativos, incluyendo:
                            </p>
                            <ul className="list-disc list-inside text-slate-600 text-sm space-y-1 pl-2">
                                <li>La gestión de proyectos de aprendizaje.</li>
                                <li>La interacción docente–estudiante.</li>
                                <li>El acompañamiento, seguimiento y evaluación de procesos educativos.</li>
                                <li>La mejora continua de los resultados académicos y formativos.</li>
                            </ul>
                            <p className="text-slate-600 text-sm leading-relaxed">
                                Los datos personales y académicos recolectados se utilizan únicamente con fines educativos, en coherencia con el principio de finalidad establecido en la normativa de protección de datos personales.
                            </p>
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">📚 Marco normativo de referencia:</p>
                                <ul className="text-xs text-slate-500 space-y-1 italic">
                                    <li>• Ley 1581 de 2012 (Colombia) – Principio de finalidad y necesidad.</li>
                                    <li>• Decreto 1377 de 2013 (Colombia).</li>
                                    <li>• Recomendaciones de la UNESCO sobre ética de la IA y protección de datos en educación (2021–2024).</li>
                                    <li>• Reglamento General de Protección de Datos (RGPD – UE), como estándar internacional de buenas prácticas.</li>
                                </ul>
                            </div>
                        </div>
                    </section>

                    <section className="space-y-4">
                        <div className="flex gap-4 items-center">
                            <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shrink-0">
                                <Lock className="w-6 h-6" />
                            </div>
                            <h3 className="font-bold text-slate-800 text-lg">2. Uso No Comercial de la Información</h3>
                        </div>
                        <div className="pl-14 space-y-3">
                            <p className="text-slate-600 text-sm leading-relaxed">
                                Profe Tabla no comercializa, vende, cede ni comparte datos personales, académicos o institucionales con terceros para publicidad, marketing, perfilamiento comercial o fines distintos a los estrictamente pedagógicos.
                            </p>
                            <p className="text-slate-600 text-sm leading-relaxed">
                                La información gestionada dentro de la plataforma es considerada propiedad de la comunidad educativa (instituciones, docentes y estudiantes), y su uso se limita al cumplimiento de los objetivos formativos declarados.
                            </p>
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">📚 Marco normativo de referencia:</p>
                                <ul className="text-xs text-slate-500 space-y-1 italic">
                                    <li>• Ley 1581 de 2012 (Colombia).</li>
                                    <li>• Convención sobre los Derechos del Niño (ONU), en lo relativo a la protección de datos de menores.</li>
                                    <li>• Principios de privacidad por diseño y por defecto (Privacy by Design).</li>
                                </ul>
                            </div>
                        </div>
                    </section>

                    <section className="space-y-4">
                        <div className="flex gap-4 items-center">
                            <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center shrink-0">
                                <AlertTriangle className="w-6 h-6" />
                            </div>
                            <h3 className="font-bold text-slate-800 text-lg">3. Protección de Datos Personales</h3>
                        </div>
                        <div className="pl-14 space-y-3">
                            <p className="text-slate-600 text-sm leading-relaxed">
                                El tratamiento de la información se realiza conforme a las leyes vigentes, garantizando el derecho a la intimidad, confidencialidad, seguridad técnica de los datos y el derecho a conocer, actualizar y rectificar la información.
                            </p>
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">📚 Marco normativo de referencia:</p>
                                <ul className="text-xs text-slate-500 space-y-1 italic">
                                    <li>• Ley 1581 de 2012 y Decreto 1074 de 2015 (Colombia).</li>
                                    <li>• RGPD (UE) – Principios de seguridad y minimización de datos.</li>
                                    <li>• Lineamientos de protección de datos en plataformas educativas (UNESCO, OCDE).</li>
                                </ul>
                            </div>
                        </div>
                    </section>

                    <section className="space-y-4">
                        <div className="flex gap-4 items-center">
                            <div className="w-10 h-10 bg-slate-100 text-slate-600 rounded-xl flex items-center justify-center shrink-0">
                                <ShieldCheck className="w-6 h-6" />
                            </div>
                            <h3 className="font-bold text-slate-800 text-lg">4. Enfoque Ético</h3>
                        </div>
                        <div className="pl-14">
                            <p className="text-slate-600 text-sm leading-relaxed italic">
                                Profe Tabla adopta un enfoque ético asegurando que la tecnología sirva al aprendizaje, respete la dignidad y autonomía de los usuarios, y potencie el rol pedagógico del docente.
                            </p>
                        </div>
                    </section>

                    <div className="bg-blue-600/5 p-6 rounded-2xl border border-blue-600/10 mt-4 text-center">
                        <p className="text-blue-700 text-sm font-medium">
                            Al hacer clic abajo, confirmas que has leído y aceptas los términos de uso y la política de privacidad pedagógica de Profe Tabla.
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
