'use client';

import { useState } from 'react';
import { Plus, Loader2, Calendar, Video, Info } from 'lucide-react';

export function AvailabilityScheduler() {
    const [loading, setLoading] = useState(false);
    const [date, setDate] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [meetingUrl, setMeetingUrl] = useState('');
    const [autoMeet, setAutoMeet] = useState(true);

    const handleCreateSlot = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        // Combine date and time
        const start = new Date(`${date}T${startTime}`);
        const end = new Date(`${date}T${endTime}`);

        try {
            const res = await fetch('/api/mentorship/slots', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    startTime: start.toISOString(),
                    endTime: end.toISOString(),
                    meetingUrl: autoMeet ? null : meetingUrl // If auto, we leave it null to be generated at booking
                })
            });

            if (res.ok) {
                alert('Franja horaria creada exitosamente');
                window.location.reload();
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm mb-10 overflow-hidden relative">
            <div className="absolute top-0 left-0 w-2 h-full bg-blue-600"></div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h3 className="font-bold text-xl text-slate-800 flex items-center gap-2">
                        <Calendar className="w-6 h-6 text-blue-600" />
                        Configurar Disponibilidad (Office Hours)
                    </h3>
                    <p className="text-slate-500 text-sm mt-1">Crea bloques de tiempo para que tus alumnos agenden mentorías.</p>
                </div>
            </div>

            <form onSubmit={handleCreateSlot} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 block">Fecha sesión</label>
                        <input
                            required
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 block">Hora inicio</label>
                        <input
                            required
                            type="time"
                            value={startTime}
                            onChange={(e) => setStartTime(e.target.value)}
                            className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 block">Hora fin</label>
                        <input
                            required
                            type="time"
                            value={endTime}
                            onChange={(e) => setEndTime(e.target.value)}
                            className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                        />
                    </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Video className="w-5 h-5 text-blue-600" />
                            <span className="text-sm font-semibold text-slate-700">Integración de Google Meet</span>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={autoMeet}
                                onChange={(e) => setAutoMeet(e.target.checked)}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                    </div>

                    {autoMeet ? (
                        <div className="flex items-start gap-2 text-[11px] text-blue-700 bg-blue-50/50 p-3 rounded-lg border border-blue-100">
                            <Info className="w-4 h-4 mt-0.5 shrink-0" />
                            <p>
                                El enlace de <strong>Google Meet</strong> se generará automáticamente a través de la API de Google Cloud cuando un alumno agende este espacio.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Link de Sesión Manual</label>
                            <input
                                type="text"
                                placeholder="https://meet.google.com/..."
                                value={meetingUrl}
                                onChange={(e) => setMeetingUrl(e.target.value)}
                                className="w-full border border-slate-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500/20 transition-all"
                            />
                        </div>
                    )}
                </div>

                <div className="flex justify-end">
                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50 shadow-lg shadow-blue-500/20"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                        Habilitar este horario
                    </button>
                </div>
            </form>
        </div>
    );
}
