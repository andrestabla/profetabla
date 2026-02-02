'use client';

import { useState, useEffect } from 'react';
import { Plus, Loader2, Calendar, Video, Clock, Users } from 'lucide-react';
import { format, addMinutes, isBefore, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { MentorshipActionModal, MentorshipActionType } from './MentorshipActionModal';

interface Project {
    id: string;
    title: string;
    students: { id: string; name: string }[];
}

export function AvailabilityScheduler() {
    const [loading, setLoading] = useState(false);
    const [mode, setMode] = useState<'OPEN' | 'DIRECT'>('OPEN');
    const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [startTime, setStartTime] = useState('09:00');
    const [endTime, setEndTime] = useState('12:00');
    const [autoMeet, setAutoMeet] = useState(true);
    const [meetingUrl, setMeetingUrl] = useState('');
    const [note, setNote] = useState('');

    // Direct Booking State
    const [projects, setProjects] = useState<Project[]>([]);
    const [selectedProjectId, setSelectedProjectId] = useState('');
    const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
    const [serviceAccountEmail, setServiceAccountEmail] = useState('');

    // Modal State
    const [modal, setModal] = useState<{
        isOpen: boolean;
        type: MentorshipActionType;
        title: string;
        message?: string;
    }>({
        isOpen: false,
        type: 'SUCCESS',
        title: ''
    });

    useEffect(() => {
        // Fetch projects for teacher
        fetch('/api/analytics/professor')
            .then(res => res.json())
            .then(data => {
                if (data && data.projects) {
                    setProjects(data.projects);
                }
            });

        // Fetch platform config to get service account email
        fetch('/api/mentorship/quota') // This endpoint might have it or I'll add it
            .then(res => res.json())
            .then(data => {
                // I'll update the quota API to return this
                if (data.serviceAccountEmail) setServiceAccountEmail(data.serviceAccountEmail);
            });
    }, []);

    // Fetch full project details when one is selected
    useEffect(() => {
        if (selectedProjectId) {
            // In a real app, fetch /api/projects/[id]
            // For now, let's assume the teacher dashboard analytics has enough info or mock it.
        }
    }, [selectedProjectId]);

    const calculateSlots = () => {
        if (!date || !startTime || !endTime) return [];
        const slots = [];
        let current = new Date(`${date}T${startTime}`);
        const end = new Date(`${date}T${endTime}`);
        const DURATION = 45;

        while (isBefore(current, end)) {
            const slotEnd = addMinutes(current, DURATION);
            if (isBefore(end, slotEnd) && slots.length > 0) break; // Don't overflow unless it's the first slot
            slots.push({
                start: format(current, 'HH:mm'),
                end: format(slotEnd, 'HH:mm'),
                isoStart: current.toISOString(),
                isoEnd: slotEnd.toISOString()
            });
            current = slotEnd;
        }
        return slots;
    };

    const slotsPreview = calculateSlots();

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (slotsPreview.length === 0) {
            setModal({
                isOpen: true,
                type: 'ERROR',
                title: 'Horario inválido',
                message: 'No hay franjas horarias válidas en este rango.'
            });
            return;
        }

        if (mode === 'DIRECT' && (!selectedProjectId || selectedStudentIds.length === 0)) {
            setModal({
                isOpen: true,
                type: 'ERROR',
                title: 'Datos incompletos',
                message: 'Selecciona un proyecto y al menos un estudiante para la sesión directa.'
            });
            return;
        }

        setLoading(true);

        try {
            const startISO = new Date(`${date}T${startTime}`).toISOString();
            const endISO = new Date(`${date}T${endTime}`).toISOString();

            const res = await fetch('/api/mentorship/slots', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    startTime: startISO,
                    endTime: endISO,
                    meetingUrl: autoMeet ? null : meetingUrl,
                    studentIds: mode === 'DIRECT' ? selectedStudentIds : undefined,
                    projectId: mode === 'DIRECT' ? selectedProjectId : undefined,
                    note: mode === 'DIRECT' ? note : undefined
                })
            });

            if (res.ok) {
                setModal({
                    isOpen: true,
                    type: 'SUCCESS',
                    title: mode === 'OPEN' ? 'Disponibilidad creada' : 'Sesión agendada',
                    message: mode === 'OPEN'
                        ? `Se han habilitado ${slotsPreview.length} franjas de 45 min.`
                        : 'Tu sesión directa ha sido agendada exitosamente.'
                });
            } else {
                const err = await res.json();
                setModal({
                    isOpen: true,
                    type: 'ERROR',
                    title: 'Error',
                    message: err.error || "Error al procesar la solicitud"
                });
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const selectedProject = projects.find(p => p.id === selectedProjectId);

    return (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden mb-12">
            <div className="bg-slate-900 p-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-600 rounded-xl">
                        <Calendar className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h3 className="text-white font-bold">Gestión de Disponibilidad</h3>
                        <p className="text-slate-400 text-xs">Define tus horarios o agenda sesiones puntuales.</p>
                    </div>
                </div>

                <div className="flex p-1 bg-slate-800 rounded-xl">
                    <button
                        onClick={() => setMode('OPEN')}
                        className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${mode === 'OPEN' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'
                            }`}
                    >
                        Office Hours
                    </button>
                    <button
                        onClick={() => setMode('DIRECT')}
                        className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${mode === 'DIRECT' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'
                            }`}
                    >
                        Sesión Directa
                    </button>
                </div>
            </div>

            <form onSubmit={handleCreate} className="p-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Left Side: Parameters */}
                    <div className="lg:col-span-8 space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Fecha</label>
                                <input
                                    required
                                    type="date"
                                    value={date}
                                    min={format(new Date(), 'yyyy-MM-dd')}
                                    onChange={(e) => setDate(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-bold focus:ring-4 focus:ring-blue-500/10 outline-none"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Hora Inicio</label>
                                <div className="relative">
                                    <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input
                                        required
                                        type="time"
                                        value={startTime}
                                        onChange={(e) => setStartTime(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 pl-12 text-sm font-bold focus:ring-4 focus:ring-blue-500/10 outline-none"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Hora Fin</label>
                                <div className="relative">
                                    <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input
                                        required
                                        type="time"
                                        value={endTime}
                                        onChange={(e) => setEndTime(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 pl-12 text-sm font-bold focus:ring-4 focus:ring-blue-500/10 outline-none"
                                    />
                                </div>
                            </div>
                        </div>

                        {mode === 'DIRECT' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-blue-50/50 rounded-3xl border border-blue-100">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest block">Proyecto</label>
                                    <select
                                        value={selectedProjectId}
                                        onChange={(e) => {
                                            setSelectedProjectId(e.target.value);
                                            setSelectedStudentIds([]);
                                        }}
                                        className="w-full bg-white border border-blue-200 rounded-xl p-3 text-sm font-bold outline-none"
                                    >
                                        <option value="">Seleccionar Proyecto...</option>
                                        {projects.map(p => (
                                            <option key={p.id} value={p.id}>{p.title}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest block">Estudiantes ({selectedStudentIds.length})</label>
                                    {!selectedProjectId ? (
                                        <div className="text-xs text-slate-400 italic py-3">Selecciona un proyecto primero...</div>
                                    ) : (
                                        <div className="max-h-32 overflow-y-auto bg-white border border-blue-100 rounded-xl p-3 space-y-1">
                                            <p className="text-[10px] text-slate-400 mb-2">Selecciona participantes:</p>
                                            <div className="flex flex-wrap gap-2">
                                                {selectedProject?.students.map(s => (
                                                    <button
                                                        key={s.id}
                                                        type="button"
                                                        onClick={() => {
                                                            setSelectedStudentIds(prev =>
                                                                prev.includes(s.id) ? prev.filter(id => id !== s.id) : [...prev, s.id]
                                                            );
                                                        }}
                                                        className={`text-[10px] font-bold px-3 py-1.5 rounded-full border transition-all ${selectedStudentIds.includes(s.id)
                                                            ? 'bg-blue-600 border-blue-600 text-white'
                                                            : 'bg-white border-blue-200 text-blue-600 hover:bg-blue-50'
                                                            }`}
                                                    >
                                                        {s.name}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className="md:col-span-2 space-y-2">
                                    <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest block">Motivo / Notas</label>
                                    <textarea
                                        value={note}
                                        onChange={(e) => setNote(e.target.value)}
                                        placeholder="Ej: Revisión de avance sprint 2..."
                                        className="w-full bg-white border border-blue-200 rounded-xl p-3 text-sm outline-none h-20 resize-none"
                                    />
                                </div>
                            </div>
                        )}

                        <div className="p-6 bg-slate-50 rounded-3xl border border-slate-200">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <Video className="w-5 h-5 text-blue-600" />
                                    <span className="text-sm font-bold text-slate-700">Integración de Google Meet</span>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={autoMeet}
                                        onChange={(e) => setAutoMeet(e.target.checked)}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                </label>
                            </div>

                            {autoMeet ? (
                                <div className="text-[11px] text-blue-600 font-medium">
                                    Enlace dinámico generado por la API de Google Cloud para cada sesión.
                                </div>
                            ) : (
                                <input
                                    type="text"
                                    placeholder="https://meet.google.com/..."
                                    value={meetingUrl}
                                    onChange={(e) => setMeetingUrl(e.target.value)}
                                    className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm outline-none"
                                />
                            )}
                        </div>
                    </div>

                    {/* Right Side: Preview */}
                    <div className="lg:col-span-4 bg-slate-50/50 rounded-3xl border border-slate-200 p-6 flex flex-col">
                        <div className="flex items-center gap-2 mb-6">
                            <Users className="w-5 h-5 text-slate-400" />
                            <h4 className="font-bold text-slate-800 text-sm italic">Vista previa de franjas</h4>
                        </div>

                        <div className="flex-1 space-y-3 overflow-y-auto max-h-[300px] pr-2 scrollbar-thin scrollbar-thumb-slate-200">
                            {slotsPreview.length === 0 ? (
                                <div className="text-center py-12 text-slate-400 italic text-xs">
                                    Define un horario válido...
                                </div>
                            ) : (
                                slotsPreview.map((s, i) => (
                                    <div key={i} className="bg-white border border-slate-200 p-3 rounded-2xl flex items-center justify-between shadow-sm">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center text-[10px] font-black">
                                                {i + 1}
                                            </div>
                                            <div className="text-xs font-bold text-slate-700">
                                                {s.start} - {s.end}
                                            </div>
                                        </div>
                                        <span className="text-[10px] font-bold text-slate-400">45m</span>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="mt-8">
                            <button
                                type="submit"
                                disabled={loading || slotsPreview.length === 0}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-2xl shadow-xl shadow-blue-600/20 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-30 disabled:grayscale"
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                                {mode === 'OPEN' ? 'Publicar Disponibilidad' : 'Agendar Sesión'}
                            </button>
                        </div>
                    </div>
                </div>
            </form>

            <MentorshipActionModal
                isOpen={modal.isOpen}
                onClose={() => {
                    setModal({ ...modal, isOpen: false });
                    if (modal.type === 'SUCCESS') window.location.reload();
                }}
                type={modal.type}
                title={modal.title}
                message={modal.message}
                slotInfo={mode === 'DIRECT' ? {
                    time: `${startTime} - ${endTime}`,
                    teacherName: 'Tú',
                    date: format(parseISO(`${date}T${startTime}`), "d 'de' MMMM", { locale: es })
                } : undefined}
            />

            {/* Calendar Support Helper */}
            {mode === 'DIRECT' && autoMeet && (
                <div className="mx-8 mb-8 p-4 bg-amber-50 rounded-2xl border border-amber-100">
                    <div className="flex gap-3">
                        <Calendar className="w-5 h-5 text-amber-500 shrink-0" />
                        <div>
                            <p className="text-xs font-bold text-amber-800 mb-1">¿No ves las reuniones en tu calendario?</p>
                            <p className="text-[10px] text-amber-700 leading-relaxed">
                                Para que las mentorías aparezcan en tu aplicación de Google Calendar, debes <strong>Compartir</strong> tu calendario personal con el siguiente correo (permiso: Realizar cambios):
                                <br />
                                <code className="bg-white/50 px-2 py-0.5 rounded border border-amber-200 mt-1 inline-block text-black select-all">
                                    {serviceAccountEmail || 'drive-profe-tabla@profe-tabla.iam.gserviceaccount.com'}
                                </code>
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
