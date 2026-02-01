'use client';

import { CheckCircle2, AlertCircle } from 'lucide-react';

interface MentorshipQuotaIndicatorProps {
    currentBookings: number;
    totalTasks: number;
    role: 'STUDENT' | 'TEACHER' | 'ADMIN';
}

export function MentorshipQuotaIndicator({ currentBookings, totalTasks, role }: MentorshipQuotaIndicatorProps) {
    // Teachers and admins have unlimited bookings
    if (role === 'TEACHER' || role === 'ADMIN') {
        return (
            <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-700">
                    Mentorías ilimitadas
                </span>
            </div>
        );
    }

    // Students have quota based on tasks
    const availableSlots = totalTasks - currentBookings;
    const percentage = totalTasks > 0 ? (currentBookings / totalTasks) * 100 : 0;
    const isAtLimit = availableSlots <= 0;
    const isNearLimit = availableSlots > 0 && availableSlots <= 2;

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-700">
                    Mentorías disponibles
                </span>
                <span className={`text-sm font-bold ${isAtLimit ? 'text-red-600' :
                        isNearLimit ? 'text-amber-600' :
                            'text-green-600'
                    }`}>
                    {availableSlots} / {totalTasks}
                </span>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                <div
                    className={`h-full transition-all duration-300 ${isAtLimit ? 'bg-red-500' :
                            isNearLimit ? 'bg-amber-500' :
                                'bg-green-500'
                        }`}
                    style={{ width: `${percentage}%` }}
                />
            </div>

            {/* Status message */}
            {isAtLimit ? (
                <div className="flex items-start gap-2 p-2 bg-red-50 border border-red-200 rounded">
                    <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-red-700">
                        Has alcanzado el límite. <strong>Crea más tareas en tu Kanban</strong> para solicitar más mentorías.
                    </p>
                </div>
            ) : isNearLimit ? (
                <div className="flex items-start gap-2 p-2 bg-amber-50 border border-amber-200 rounded">
                    <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-700">
                        Te quedan pocas mentorías disponibles. Considera crear más tareas.
                    </p>
                </div>
            ) : (
                <p className="text-xs text-slate-500">
                    Tienes <strong>{availableSlots} mentoría{availableSlots !== 1 ? 's' : ''}</strong> disponible{availableSlots !== 1 ? 's' : ''} (1 por cada tarea creada)
                </p>
            )}
        </div>
    );
}
