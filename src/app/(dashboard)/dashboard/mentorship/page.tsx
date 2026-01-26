import { AvailabilityScheduler } from '@/components/AvailabilityScheduler';
import { BookingList } from '@/components/BookingList';
import { Calendar } from 'lucide-react';

export default async function MentorshipPage({ searchParams }: { searchParams: Promise<{ projectId?: string, note?: string }> }) {
    const { projectId, note } = await searchParams;

    // MVP: For demo purposes, we show both the Scheduler (Teacher) and Booking List (Student/Teacher)
    // Ideally this is protected by role.
    const isTeacher = true; // Use this to toggle UI for demo

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
                    <Calendar className="w-8 h-8 text-blue-600" />
                    Mentorías y Asesorías
                </h1>
                <p className="text-slate-500 mt-2">
                    Reserva espacios con tu tutor para revisar avances y resolver dudas.
                </p>
                {note && (
                    <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-sm flex items-center gap-2">
                        <span className="font-bold">Solicitando por:</span> {note}
                    </div>
                )}
            </div>

            {isTeacher && (
                <div className="mb-10">
                    <AvailabilityScheduler />
                </div>
            )}

            <BookingList defaultProjectId={projectId} defaultNote={note} />
        </div>
    );
}
