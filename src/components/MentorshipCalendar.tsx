'use client';

import { useState } from 'react';
import {
    format,
    addMonths,
    subMonths,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    isSameMonth,
    isSameDay,
    addDays,
    isToday,
    parseISO
} from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Clock, Video, User, BookOpen, Calendar } from 'lucide-react';

interface Slot {
    id: string;
    startTime: string;
    endTime: string;
    isBooked: boolean;
    meetingUrl: string | null;
    teacher: { name: string; avatarUrl: string };
    booking?: {
        id: string;
        students: { name: string }[];
        project?: { title: string };
        note: string;
    };
}

interface MentorshipCalendarProps {
    slots: Slot[];
    onBook: (slotId: string) => void;
}

export function MentorshipCalendar({ slots, onBook }: MentorshipCalendarProps) {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());

    const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
    const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

    const renderHeader = () => {
        return (
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-xl font-bold text-slate-800 capitalize">
                        {format(currentMonth, 'MMMM yyyy', { locale: es })}
                    </h2>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={prevMonth}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
                    >
                        <ChevronLeft className="w-5 h-5 text-slate-600" />
                    </button>
                    <button
                        onClick={nextMonth}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
                    >
                        <ChevronRight className="w-5 h-5 text-slate-600" />
                    </button>
                </div>
            </div>
        );
    };

    const renderDays = () => {
        const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
        return (
            <div className="grid grid-cols-7 mb-2">
                {days.map((day, idx) => (
                    <div key={idx} className="text-center text-xs font-bold text-slate-400 uppercase tracking-wider">
                        {day}
                    </div>
                ))}
            </div>
        );
    };

    const renderCells = () => {
        const monthStart = startOfMonth(currentMonth);
        const monthEnd = endOfMonth(monthStart);
        const startDate = startOfWeek(monthStart);
        const endDate = endOfWeek(monthEnd);

        const rows = [];
        let days = [];
        let day = startDate;
        let formattedDate = "";

        while (day <= endDate) {
            for (let i = 0; i < 7; i++) {
                formattedDate = format(day, "d");
                const cloneDay = day;
                const dailySlots = slots.filter(s => isSameDay(parseISO(s.startTime), cloneDay));
                const hasAvailability = dailySlots.some(s => !s.isBooked);
                const hasBooked = dailySlots.some(s => s.isBooked);

                days.push(
                    <div
                        key={day.toString()}
                        className={`relative h-24 border border-slate-100 p-2 cursor-pointer transition-all hover:bg-slate-50 ${!isSameMonth(day, monthStart) ? "bg-slate-50/50 text-slate-300 pointer-events-none" : "text-slate-700"
                            } ${isSameDay(day, selectedDate) ? "bg-blue-50/50 ring-1 ring-blue-200 rounded-sm z-10" : ""} ${isToday(day) ? "font-black" : ""
                            }`}
                        onClick={() => setSelectedDate(cloneDay)}
                    >
                        <span className={`text-sm ${isToday(day) ? "bg-blue-600 text-white w-6 h-6 flex items-center justify-center rounded-full" : ""}`}>
                            {formattedDate}
                        </span>

                        <div className="mt-2 flex flex-wrap gap-1">
                            {hasAvailability && (
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500" title="Disponible"></div>
                            )}
                            {hasBooked && (
                                <div className="w-1.5 h-1.5 rounded-full bg-green-500" title="Reservado"></div>
                            )}
                        </div>

                        {dailySlots.length > 0 && isSameMonth(day, monthStart) && (
                            <div className="absolute bottom-1 right-1">
                                <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-1 rounded">
                                    {dailySlots.length}
                                </span>
                            </div>
                        )}
                    </div>
                );
                day = addDays(day, 1);
            }
            rows.push(
                <div className="grid grid-cols-7" key={day.toString()}>
                    {days}
                </div>
            );
            days = [];
        }
        return <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">{rows}</div>;
    };

    const selectedDaySlots = slots.filter(s => isSameDay(parseISO(s.startTime), selectedDate));

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
                {renderHeader()}
                {renderDays()}
                {renderCells()}
            </div>

            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 h-fit sticky top-6">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-blue-600" />
                    Horarios para el {format(selectedDate, "d 'de' MMMM", { locale: es })}
                </h3>

                {selectedDaySlots.length === 0 ? (
                    <div className="text-center py-12 px-4 bg-white rounded-xl border border-dashed border-slate-300">
                        <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-500 text-sm">No hay mentorías programadas para este día.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {selectedDaySlots.map(slot => (
                            <div
                                key={slot.id}
                                className={`p-4 rounded-xl border transition-all ${slot.isBooked
                                    ? "bg-green-50 border-green-200"
                                    : "bg-white border-slate-200 shadow-sm hover:border-blue-300"
                                    }`}
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <div className="text-sm font-bold text-slate-700">
                                        {format(parseISO(slot.startTime), 'HH:mm')} - {format(parseISO(slot.endTime), 'HH:mm')}
                                    </div>
                                    {slot.isBooked && (
                                        <span className="text-[10px] bg-green-200 text-green-800 px-2 py-0.5 rounded-full font-bold uppercase">
                                            Reservado
                                        </span>
                                    )}
                                </div>

                                <div className="flex items-center gap-2 mb-4">
                                    <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden">
                                        {slot.teacher.avatarUrl ? (
                                            <img src={slot.teacher.avatarUrl} alt={slot.teacher.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <User className="w-3 h-3 text-slate-500" />
                                        )}
                                    </div>
                                    <span className="text-xs text-slate-600 font-medium">{slot.teacher.name}</span>
                                </div>

                                {slot.isBooked && slot.booking && (
                                    <div className="mb-4 text-[11px] bg-white/50 p-2 rounded border border-green-100">
                                        <div className="flex items-center gap-1 text-slate-500 mb-1">
                                            <BookOpen className="w-3 h-3" />
                                            <span>{slot.booking.students.map(s => s.name).join(', ')}</span>
                                        </div>
                                        <p className="text-slate-700 italic">&ldquo;{slot.booking.note}&rdquo;</p>
                                    </div>
                                )}

                                {slot.isBooked ? (
                                    slot.meetingUrl && (
                                        <a
                                            href={slot.meetingUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center justify-center gap-2 w-full bg-blue-600 text-white py-2 rounded-lg text-xs font-bold hover:bg-blue-700 transition-colors"
                                        >
                                            <Video className="w-4 h-4" /> Unirse a Meet
                                        </a>
                                    )
                                ) : (
                                    <button
                                        onClick={() => onBook(slot.id)}
                                        className="w-full bg-slate-900 text-white py-2 rounded-lg text-xs font-bold hover:bg-slate-800 transition-colors"
                                    >
                                        Reservar ahora
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
