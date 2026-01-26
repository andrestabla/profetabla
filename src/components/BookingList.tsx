'use client';

import { useState, useEffect } from 'react';
import { Calendar, Clock, Video, FileText, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Slot {
    id: string;
    startTime: string;
    endTime: string;
    isBooked: boolean;
    meetingUrl: string | null;
    teacher: { name: string; avatarUrl: string };
    booking?: {
        id: string;
        student: { name: string };
        note: string;
        minutes: string | null;
        agreements: string | null;
    };
}

export function BookingList() {
    const [slots, setSlots] = useState<Slot[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/mentorship/slots')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setSlots(data);
                setLoading(false);
            });
    }, []);

    const handleBook = async (slotId: string) => {
        const note = prompt("Motivo de la sesión:");
        if (!note) return;

        const res = await fetch('/api/mentorship/book', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ slotId, note })
        });

        if (res.ok) {
            alert("Reserva confirmada");
            window.location.reload();
        }
    };

    const handleUpdateMinutes = async (bookingId: string, currentMinutes: string | null) => {
        const minutes = prompt("Minuta / Acuerdos de la sesión:", currentMinutes || "");
        if (minutes === null) return;

        const res = await fetch(`/api/mentorship/bookings/${bookingId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ minutes, agreements: minutes }) // Simple duplication for MVP
        });

        if (res.ok) {
            window.location.reload();
        }
    };

    if (loading) return <div>Cargando horarios...</div>;

    const upcomingSlots = slots.filter(s => new Date(s.startTime) > new Date());
    const pastSlots = slots.filter(s => new Date(s.startTime) <= new Date());

    return (
        <div className="space-y-8">
            {/* Upcoming */}
            <div>
                <h3 className="text-lg font-bold text-slate-800 mb-4">Próximas Sesiones</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {upcomingSlots.length === 0 ? <p className="text-slate-500 text-sm">No hay horarios disponibles.</p> : null}
                    {upcomingSlots.map(slot => (
                        <div key={slot.id} className={`p-5 rounded-xl border flex flex-col justify-between ${slot.isBooked ? 'bg-green-50 border-green-200' : 'bg-white border-slate-200'
                            }`}>
                            <div>
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-2 text-slate-700 font-semibold">
                                        <Calendar className="w-4 h-4 text-blue-600" />
                                        {format(new Date(slot.startTime), "EEEE d 'de' MMMM", { locale: es })}
                                    </div>
                                    {slot.isBooked && <span className="text-xs bg-green-200 text-green-700 px-2 py-1 rounded-full font-bold">Reservado</span>}
                                </div>
                                <div className="flex items-center gap-2 text-slate-500 text-sm mb-4">
                                    <Clock className="w-4 h-4" />
                                    {format(new Date(slot.startTime), 'HH:mm')} - {format(new Date(slot.endTime), 'HH:mm')}
                                </div>

                                {slot.isBooked && slot.booking && (
                                    <div className="bg-white/60 p-3 rounded-lg text-sm mb-4">
                                        <p className="font-semibold text-slate-700">Estudiante: {slot.booking.student.name}</p>
                                        <p className="text-slate-600 italic">"{slot.booking.note}"</p>
                                    </div>
                                )}
                            </div>

                            <div className="pt-4 border-t border-slate-200/50">
                                {slot.isBooked ? (
                                    <div className="flex gap-2">
                                        {slot.meetingUrl && (
                                            <a
                                                href={slot.meetingUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium text-center hover:bg-blue-700 flex items-center justify-center gap-2"
                                            >
                                                <Video className="w-4 h-4" /> Unirse
                                            </a>
                                        )}
                                        {/* Teacher Action */}
                                        <button
                                            onClick={() => handleUpdateMinutes(slot.booking!.id, slot.booking!.minutes)}
                                            className="px-3 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300"
                                            title="Registrar Minuta"
                                        >
                                            <FileText className="w-4 h-4" />
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => handleBook(slot.id)}
                                        className="w-full bg-slate-900 text-white py-2 rounded-lg text-sm font-medium hover:bg-slate-800"
                                    >
                                        Reservar
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Past */}
            {pastSlots.length > 0 && (
                <div className="opacity-75">
                    <h3 className="text-lg font-bold text-slate-800 mb-4">Historial</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {pastSlots.map(slot => (
                            <div key={slot.id} className="p-5 rounded-xl border border-slate-200 bg-slate-50">
                                <div className="flex justify-between mb-2">
                                    <span className="font-semibold text-slate-600">{format(new Date(slot.startTime), "d MMM yyyy", { locale: es })}</span>
                                    <span className="text-xs text-slate-400">Finalizado</span>
                                </div>
                                {slot.booking ? (
                                    <>
                                        <div className="text-sm text-slate-600 mb-2">
                                            Sesión con <b>{slot.booking.student.name}</b>
                                        </div>
                                        {slot.booking.minutes ? (
                                            <div className="bg-yellow-50 p-3 rounded border border-yellow-100 text-sm text-yellow-800">
                                                <span className="font-bold block mb-1">Acuerdos:</span>
                                                {slot.booking.minutes}
                                            </div>
                                        ) : (
                                            <p className="text-xs text-slate-400 italic">Sin minuta registrada.</p>
                                        )}
                                    </>
                                ) : (
                                    <p className="text-sm text-slate-400">No reservado</p>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
