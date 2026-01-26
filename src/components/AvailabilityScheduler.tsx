'use client';

import { useState } from 'react';
import { Plus, Loader2, Calendar } from 'lucide-react';

export function AvailabilityScheduler() {
    const [loading, setLoading] = useState(false);
    const [date, setDate] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [meetingUrl, setMeetingUrl] = useState('https://meet.google.com/abc-defg-hij');

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
                    meetingUrl
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
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm mb-6">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                Configurar Disponibilidad (Office Hours)
            </h3>
            <form onSubmit={handleCreateSlot} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Fecha</label>
                    <input
                        required
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full border border-slate-300 rounded-lg p-2 text-sm"
                    />
                </div>
                <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Inicio</label>
                    <input
                        required
                        type="time"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        className="w-full border border-slate-300 rounded-lg p-2 text-sm"
                    />
                </div>
                <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Fin</label>
                    <input
                        required
                        type="time"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        className="w-full border border-slate-300 rounded-lg p-2 text-sm"
                    />
                </div>
                <button
                    type="submit"
                    disabled={loading}
                    className="bg-blue-600 text-white p-2 rounded-lg font-medium hover:bg-blue-700 flex items-center justify-center gap-2 h-[38px]"
                >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    Crear Slot
                </button>
            </form>
            <div className="mt-4">
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Link de Reunión (Fijo)</label>
                <input
                    type="text"
                    value={meetingUrl}
                    onChange={(e) => setMeetingUrl(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2 text-sm bg-slate-50 text-slate-600"
                />
            </div>
        </div>
    );
}
