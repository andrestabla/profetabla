'use client';

import { MentorshipCalendar } from '@/components/MentorshipCalendar';
import { MentorshipQuotaIndicator } from '@/components/MentorshipQuotaIndicator';
import { AvailabilityScheduler } from '@/components/AvailabilityScheduler';
import { useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { Calendar as CalendarIcon, Loader2, History } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { MentorshipActionModal, MentorshipActionType } from '@/components/MentorshipActionModal';

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

    const isTeacher = session?.user?.role === 'TEACHER' || session?.user?.role === 'ADMIN';

    const projectIdFromUrl = searchParams.get('projectId') || undefined;

    // Modal State
    const [modal, setModal] = useState<{
        isOpen: boolean;
        type: MentorshipActionType;
        slotId: string | null;
        title: string;
        message?: string;
    }>({
        isOpen: false,
        type: 'BOOK',
        slotId: null,
        title: ''
    });

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

    const handleBook = (slotId: string) => {
        setModal({
            isOpen: true,
            type: 'BOOK',
            slotId,
            title: 'Reservar Mentoría',
            message: 'Registra el tema que deseas tratar en esta sesión.'
        });
    };

    const handleDelete = (slotId: string) => {
        setModal({
            isOpen: true,
            type: 'DELETE',
            slotId,
            title: '¿Eliminar horario?',
            message: 'Esta acción no se puede deshacer.'
        });
    };

    const handleEdit = (slotId: string) => {
        setModal({
            isOpen: true,
            type: 'EDIT',
            slotId,
            title: 'Editar Notas de Sesión',
            message: 'Actualiza los temas o el motivo de esta mentoría.'
        });
        // We'll pass the currentNote via a ref or state if needed, but for now 
        // MentorshipActionModal takes initialNote. I should handle it.
    };

    const handleConfirmAction = async (note?: string) => {
        const slotId = modal.slotId;
        if (!slotId) return;

        if (modal.type === 'BOOK') {
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
                    setModal({
                        isOpen: true,
                        type: 'SUCCESS',
                        slotId: null,
                        title: '¡Reservada!',
                        message: 'Tu sesión ha sido agendada y el enlace de Meet se ha generado.'
                    });
                    fetchData();
                } else {
                    const error = await res.json();
                    setModal({
                        isOpen: true,
                        type: 'ERROR',
                        slotId: null,
                        title: 'Error al reservar',
                        message: error.details || error.error || 'No se pudo completar la reserva.'
                    });
                }
            } catch (error) {
                console.error(error);
                setModal({
                    isOpen: true,
                    type: 'ERROR',
                    slotId: null,
                    title: 'Error de conexión',
                    message: 'Hubo un fallo al contactar con el servidor.'
                });
            } finally {
                setIsBooking(false);
            }
        } else if (modal.type === 'DELETE') {
            try {
                const res = await fetch(`/api/mentorship/slots?id=${slotId}`, {
                    method: 'DELETE'
                });

                if (res.ok) {
                    setModal({
                        isOpen: true,
                        type: 'SUCCESS',
                        slotId: null,
                        title: 'Horario eliminado',
                        message: 'El horario y el evento de calendario han sido borrados.'
                    });
                    fetchData();
                } else {
                    const error = await res.json();
                    setModal({
                        isOpen: true,
                        type: 'ERROR',
                        slotId: null,
                        title: 'Error al eliminar',
                        message: error.details || error.error || 'No se pudo borrar el horario.'
                    });
                }
            } catch (error) {
                console.error(error);
                setModal({
                    isOpen: true,
                    type: 'ERROR',
                    slotId: null,
                    title: 'Error de conexión',
                    message: 'Hubo un fallo al contactar con el servidor.'
                });
            }
        } else if (modal.type === 'EDIT') {
            try {
                const res = await fetch('/api/mentorship/book', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        slotId,
                        note
                    })
                });

                if (res.ok) {
                    setModal({
                        isOpen: true,
                        type: 'SUCCESS',
                        slotId: null,
                        title: 'Cambios guardados',
                        message: 'La nota de la mentoría ha sido actualizada.'
                    });
                    fetchData();
                } else {
                    const error = await res.json();
                    setModal({
                        isOpen: true,
                        type: 'ERROR',
                        slotId: null,
                        title: 'Error al actualizar',
                        message: error.error || 'No se pudo guardar la nota.'
                    });
                }
            } catch (error) {
                console.error(error);
                setModal({
                    isOpen: true,
                    type: 'ERROR',
                    slotId: null,
                    title: 'Error de conexión',
                    message: 'Hubo un fallo al contactar con el servidor.'
                });
            }
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
                    onEdit={handleEdit}
                    currentUserId={session?.user?.id}
                    userRole={session?.user?.role}
                />

                <MentorshipActionModal
                    isOpen={modal.isOpen}
                    onClose={() => setModal({ ...modal, isOpen: false })}
                    type={modal.type}
                    title={modal.title}
                    message={modal.message}
                    initialNote={slots.find(s => s.id === modal.slotId)?.booking?.note}
                    onConfirm={modal.type === 'SUCCESS' || modal.type === 'ERROR' ? undefined : handleConfirmAction}
                    slotInfo={(() => {
                        const s = slots.find(slot => slot.id === modal.slotId);
                        if (!s) return undefined;
                        return {
                            time: `${format(parseISO(s.startTime), 'HH:mm')} - ${format(parseISO(s.endTime), 'HH:mm')}`,
                            teacherName: s.teacher.name,
                            date: format(parseISO(s.startTime), "d 'de' MMMM", { locale: es })
                        };
                    })()}
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
