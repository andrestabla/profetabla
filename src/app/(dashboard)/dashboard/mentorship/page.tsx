import { AvailabilityScheduler } from '@/components/AvailabilityScheduler';
import { BookingList } from '@/components/BookingList';
import { Calendar } from 'lucide-react';

export default function MentorshipPage() {
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
            </div>

            {isTeacher && (
                <div className="mb-10">
                    <AvailabilityScheduler />
                </div>
            )}

            <BookingList />
        </div>
    );
}
