'use client';

import { BookingList } from '@/components/BookingList';
import { MentorshipQuotaIndicator } from '@/components/MentorshipQuotaIndicator';
import { AvailabilityScheduler } from '@/components/AvailabilityScheduler';
import { useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { Calendar } from 'lucide-react';

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
    const [loading, setLoading] = useState(true);

    const projectId = searchParams.get('projectId') || undefined;
    const note = searchParams.get('note') || undefined;

    // MVP: For demo purposes, we show both the Scheduler (Teacher) and Booking List (Student/Teacher)
    const isTeacher = session?.user?.role === 'TEACHER' || session?.user?.role === 'ADMIN';

    useEffect(() => {
        async function fetchQuota() {
            try {
                const res = await fetch('/api/mentorship/quota');
                if (res.ok) {
                    const data = await res.json();
                    setQuotaData(data);
                }
            } catch (error) {
                console.error('Error fetching quota:', error);
            } finally {
                setLoading(false);
            }
        }

        if (session?.user) {
            fetchQuota();
        }
    }, [session]);

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

            {/* Quota Indicator */}
            {!loading && quotaData && (
                <div className="mb-6 p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
                    <MentorshipQuotaIndicator
                        currentBookings={quotaData.currentBookings}
                        totalTasks={quotaData.totalTasks}
                        role={quotaData.role}
                    />
                    {quotaData.projectTitle && (
                        <p className="text-xs text-slate-500 mt-3 pt-3 border-t">
                            📚 Proyecto activo: <strong>{quotaData.projectTitle}</strong>
                        </p>
                    )}
                    {quotaData.message && (
                        <p className="text-xs text-amber-600 mt-2">
                            ⚠️ {quotaData.message}
                        </p>
                    )}
                </div>
            )}

            {isTeacher && (
                <div className="mb-10">
                    <AvailabilityScheduler />
                </div>
            )}

            <BookingList defaultProjectId={projectId} defaultNote={note} />
        </div>
    );
}
