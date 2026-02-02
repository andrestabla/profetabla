'use client';

import { MentorshipCalendar } from '@/components/MentorshipCalendar';
import { MentorshipQuotaIndicator } from '@/components/MentorshipQuotaIndicator';
import { AvailabilityScheduler } from '@/components/AvailabilityScheduler';
import { useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { Calendar as CalendarIcon, Loader2, History } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Slot {
    id: string;
    startTime: string;
    endTime: string;
    isBooked: boolean;
    meetingUrl: string | null;
    teacher: { id: string; name: string; avatarUrl: string };
    booking?: {
        id: string;
        students: { name: string }[];
        project?: { title: string };
        note: string;
    };
}

interface QuotaData {
    role: 'STUDENT' | 'TEACHER' | 'ADMIN';
    unlimited: boolean;
    currentBookings: number;
    totalTasks: number;
    availableSlots: number;
    projectId?: string;
    projectTitle?: string;
    message?: string;
}

export default function MentorshipPage() {
    const searchParams = useSearchParams();
    const { data: session } = useSession();
    const [quotaData, setQuotaData] = useState<QuotaData | null>(null);
    const [slots, setSlots] = useState<Slot[]>([]);
    const [loading, setLoading] = useState(true);
    const [isBooking, setIsBooking] = useState(false);

    const projectIdFromUrl = searchParams.get('projectId') || undefined;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const noteFromUrl = searchParams.get('note') || undefined;

    const isTeacher = session?.user?.role === 'TEACHER' || session?.user?.role === 'ADMIN';

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch Quota
            const quotaRes = await fetch('/api/mentorship/quota');
            if (quotaRes.ok) {
                const data = await quotaRes.json();
                setQuotaData(data);
            }

            // Fetch Slots
            const slotsRes = await fetch('/api/mentorship/slots');
            if (slotsRes.ok) {
                const data = await slotsRes.json();
                setSlots(data);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (session?.user) {
            fetchData();
        }
    }, [session]);

    const handleBook = async (slotId: string) => {
        const note = prompt("Motivo de la sesión o temas a tratar:");
        if (!note) return;

        setIsBooking(true);
        try {
            const res = await fetch('/api/mentorship/book', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    slotId,
                    note,
                    projectId: projectIdFromUrl || quotaData?.projectId
                })
            });

            if (res.ok) {
                alert("¡Mentoría reservada exitosamente!");
                fetchData(); // Refresh data
            } else {
                const error = await res.json();
                alert(error.error || "Error al reservar la mentoría");
            }
        } catch (error) {
            console.error(error);
            alert("Error de conexión al reservar");
        } finally {
            setIsBooking(false);
        }
    };

    const handleDelete = async (slotId: string) => {
        try {
            const res = await fetch(`/api/mentorship/slots?id=${slotId}`, {
                method: 'DELETE'
            });

            if (res.ok) {
                fetchData(); // Refresh list
            } else {
                const error = await res.json();
                alert(error.error || "Error al eliminar el horario");
            }
        } catch (error) {
            console.error(error);
            alert("Error de conexión al eliminar");
        }
    };

    if (loading && slots.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
                <p className="text-slate-500 font-medium">Cargando experiencia de mentorías...</p>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            <header className="mb-10">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-3 bg-blue-600 rounded-2xl shadow-lg shadow-blue-500/20">
                        <CalendarIcon className="w-8 h-8 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-slate-800 tracking-tight">
                            Mentorías y Asesorías
                        </h1>
                        <p className="text-slate-500 font-medium">
                            Agenda sesiones personalizadas con tus tutores.
                        </p>
                    </div>
                </div>
            </header>

            {/* Quota Indicator */}
            {!loading && quotaData && (
                <div className="mb-8">
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                        <MentorshipQuotaIndicator
                            currentBookings={quotaData.currentBookings}
                            totalTasks={quotaData.totalTasks}
                            role={quotaData.role}
                        />
                        {quotaData.projectTitle && (
                            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                                <span className="text-xs text-slate-400 font-bold uppercase tracking-widest">Proyecto Activo</span>
                                <span className="text-sm font-bold text-blue-700 bg-blue-50 px-3 py-1 rounded-full">
                                    {quotaData.projectTitle}
                                </span>
                            </div>
                        )}
                        {quotaData.message && !quotaData.projectId && (
                            <p className="text-xs text-amber-600 mt-2 font-medium bg-amber-50 p-2 rounded-lg border border-amber-100">
                                ⚠️ {quotaData.message}
                            </p>
                        )}
                    </div>
                </div>
            )}

            {isTeacher && (
                <section className="mb-12">
                    <AvailabilityScheduler />
                </section>
            )}

            <section className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 p-6 md:p-8 relative">
                <div className="flex items-center justify-between mb-8">
                    <h3 className="text-xl font-bold text-slate-800">Calendario de Disponibilidad</h3>
                    <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-tighter">
                        <div className="flex items-center gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div>
                            <span className="text-slate-500">Disponible</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
                            <span className="text-slate-500">Reservado</span>
                        </div>
                    </div>
                </div>

                <MentorshipCalendar
                    slots={slots}
                    onBook={handleBook}
                    onDelete={handleDelete}
                    currentUserId={session?.user?.id}
                    userRole={session?.user?.role}
                />

                {isBooking && (
                    <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center z-50 rounded-3xl">
                        <div className="bg-slate-900 text-white px-6 py-4 rounded-2xl flex items-center gap-3 shadow-2xl">
                            <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
                            <span className="font-bold">Procesando tu reserva...</span>
                        </div>
                    </div>
                )}
            </section>

            {/* History Section for Teachers */}
            {isTeacher && (
                <section className="mt-16 opacity-80 hover:opacity-100 transition-opacity">
                    <div className="flex items-center gap-2 mb-6 text-slate-400">
                        <History className="w-5 h-5" />
                        <h3 className="font-black uppercase tracking-widest text-sm">Historial de Sesiones</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {slots.filter(s => new Date(s.startTime) < new Date() && s.isBooked).slice(0, 3).map(slot => (
                            <div key={slot.id} className="bg-slate-50 border border-slate-200 p-4 rounded-2xl grayscale hover:grayscale-0 transition-all">
                                <p className="text-[10px] font-black text-slate-400 mb-2">{format(new Date(slot.startTime), 'PPP', { locale: es })}</p>
                                <p className="text-sm font-bold text-slate-700 truncate">{slot.booking?.students.map(s => s.name).join(', ')}</p>
                                <p className="text-xs text-slate-500 italic mt-1">&ldquo;{slot.booking?.note}&rdquo;</p>
                            </div>
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
}
