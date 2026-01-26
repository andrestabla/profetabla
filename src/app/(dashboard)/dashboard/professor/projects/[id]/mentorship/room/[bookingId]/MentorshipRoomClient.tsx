'use client';

import { useState } from 'react';
import { Video, Mic, FileText, CheckSquare, Save, Clock, ExternalLink } from 'lucide-react';
import { closeSessionAction } from './actions';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function MentorshipRoomClient({ booking, student, project }: { booking: any, student: any, project: any }) {
    const [isSaving, setIsSaving] = useState(false);

    return (
        <div className="h-[calc(100vh-80px)] flex gap-6 p-6 bg-slate-100">

            {/* COLUMNA IZQUIERDA: Contexto y Videollamada */}
            <div className="w-1/3 flex flex-col gap-6">

                {/* Tarjeta del Estudiante */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-xl">
                            {student.name ? student.name.charAt(0) : 'E'}
                        </div>
                        <div>
                            <h2 className="font-bold text-slate-800">{student.name}</h2>
                            <p className="text-sm text-slate-500">{project.title}</p>
                        </div>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg text-sm text-slate-600 border border-slate-100">
                        <strong>Objetivo de hoy:</strong> {booking.note || "Revisión general de avance"}
                    </div>
                </div>

                {/* INTEGRACIÓN DE VIDEOLLAMADA */}
                <div className="flex-1 bg-slate-900 rounded-2xl flex flex-col items-center justify-center text-white p-8 relative overflow-hidden">
                    {/* Fondo decorativo */}
                    <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('/pattern.svg')]"></div>

                    <div className="z-10 text-center">
                        <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-blue-500/50 animate-pulse">
                            <Video className="w-8 h-8 text-white" />
                        </div>
                        <h3 className="text-xl font-bold mb-2">Sala de Conferencia</h3>
                        <p className="text-slate-400 mb-8 max-w-xs mx-auto">
                            La sesión se realiza a través de su proveedor configurado.
                        </p>

                        <a
                            href={booking.slot?.meetingUrl || '#'}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 bg-white text-slate-900 font-bold py-3 px-8 rounded-full hover:bg-blue-50 transition-all transform hover:scale-105"
                        >
                            <ExternalLink className="w-5 h-5" /> Unirse a la Reunión
                        </a>
                    </div>

                    <div className="mt-12 flex gap-4 text-slate-500 text-sm">
                        <span className="flex items-center gap-1"><Mic className="w-4 h-4" /> Audio Externo</span>
                        <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> 45:00 min</span>
                    </div>
                </div>
            </div>

            {/* COLUMNA DERECHA: Libro de Actas (Live Minutes) */}
            <div className="w-2/3 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                    <h2 className="font-bold text-slate-800 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-blue-600" /> Bitácora de Sesión
                    </h2>
                    <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded border border-amber-100">
                        ⚫ Grabando Acta
                    </span>
                </div>

                <form action={async (fd) => { setIsSaving(true); await closeSessionAction(fd); }} className="flex-1 flex flex-col p-6 overflow-y-auto">
                    <input type="hidden" name="bookingId" value={booking.id} />
                    <input type="hidden" name="projectId" value={project.id} />

                    {/* 1. Minutas de la Reunión */}
                    <div className="mb-6 flex-1">
                        <label className="block text-sm font-bold text-slate-700 mb-2">Discusión y Puntos Tratados</label>
                        <textarea
                            name="minutes"
                            required
                            className="w-full h-full min-h-[200px] p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none font-medium text-slate-700 leading-relaxed"
                            placeholder="Escribe aquí el resumen de lo conversado durante la sesión..."
                        ></textarea>
                    </div>

                    {/* 2. Acuerdos y Compromisos */}
                    <div className="mb-8">
                        <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                            <CheckSquare className="w-4 h-4 text-emerald-600" /> Acuerdos (Action Items)
                        </label>
                        <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl">
                            <textarea
                                name="agreements"
                                className="w-full h-24 bg-transparent outline-none text-emerald-900 placeholder:text-emerald-700/50"
                                placeholder="- Estudiante subirá el diagrama corregido mañana.&#10;- Profesor revisará el código del módulo de pagos."
                            ></textarea>
                        </div>
                    </div>

                    {/* Botón de Cierre */}
                    <div className="pt-4 border-t border-slate-100 flex justify-end">
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 px-6 rounded-xl shadow-lg flex items-center gap-2 transition-all disabled:opacity-50"
                        >
                            {isSaving ? 'Guardando y Cerrando...' : <><Save className="w-5 h-5" /> Guardar Acta y Finalizar Sesión</>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
