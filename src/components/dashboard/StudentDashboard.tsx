'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { ProgressBar } from '@/components/ProgressBar';
import { UrgentCitationCard } from '@/components/UrgentCitationCard';
import {
    Award,
    BookOpen,
    Briefcase,
    CalendarClock,
    CheckCircle2,
    Clock3,
    Download,
    FileText,
    Megaphone,
    Search,
    ShieldCheck,
    Target
} from 'lucide-react';

/* eslint-disable @typescript-eslint/no-explicit-any */
interface StudentDashboardProps {
    user: any;
    projects: any[];
    citation: any;
    nextMentorship: any;
    recognitionAwards: any[];
    upcomingTasks: any[];
    calendarEvents: any[];
    latestCommunications: any[];
    suggestedLearningResources: any[];
}

const PROJECT_TYPE_LABEL: Record<string, string> = {
    PROJECT: 'Proyecto',
    PROBLEM: 'Problema',
    CHALLENGE: 'Reto'
};

function formatDateTime(input: string | Date) {
    const date = new Date(input);
    return {
        day: date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }),
        full: date.toLocaleString('es-ES', {
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        })
    };
}

function formatDateOnly(input: string | Date) {
    return new Date(input).toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
}

function toDayKey(input: string | Date) {
    const date = new Date(input);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function stripHtml(content: string) {
    return content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

export function StudentDashboard({
    user,
    projects,
    citation,
    nextMentorship,
    recognitionAwards,
    upcomingTasks,
    calendarEvents,
    latestCommunications,
    suggestedLearningResources
}: StudentDashboardProps) {
    const today = useMemo(() => new Date(), []);
    const nowMs = today.getTime();
    const activeRecognitionAwards = (recognitionAwards || []).filter((award: any) => !award.isRevoked);
    const revokedRecognitionAwards = (recognitionAwards || []).filter((award: any) => award.isRevoked);
    const upcomingCalendarEvents = (calendarEvents || []).slice(0, 6);

    const projectsWithProgress = useMemo(() => (
        (projects || []).map((project: any) => {
            const totalAssignments = project.assignments?.length || 0;
            const completedAssignments = project.assignments?.filter((assignment: any) =>
                assignment.submissions && assignment.submissions.length > 0
            ).length || 0;
            const pendingAssignments = Math.max(totalAssignments - completedAssignments, 0);
            const progressPercent = totalAssignments > 0
                ? Math.round((completedAssignments / totalAssignments) * 100)
                : 0;

            return {
                ...project,
                totalAssignments,
                completedAssignments,
                pendingAssignments,
                progressPercent
            };
        })
    ), [projects]);

    const monthName = today.toLocaleDateString('es-ES', {
        month: 'long',
        year: 'numeric'
    });

    const calendarDays = useMemo(() => {
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        const monthStartWeekday = (monthStart.getDay() + 6) % 7; // Monday as first day
        const gridStart = new Date(monthStart);
        gridStart.setDate(monthStart.getDate() - monthStartWeekday);

        return Array.from({ length: 42 }, (_, index) => {
            const day = new Date(gridStart);
            day.setDate(gridStart.getDate() + index);
            return day;
        });
    }, [today]);

    const eventsByDay = useMemo(() => {
        const map = new Map<string, any[]>();
        (calendarEvents || []).forEach((event: any) => {
            const key = toDayKey(event.startsAt);
            const existing = map.get(key) || [];
            existing.push(event);
            map.set(key, existing);
        });
        return map;
    }, [calendarEvents]);

    // Handle no projects case
    if (!projects || projects.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-[80vh] text-center p-6">
                {citation && <div className="w-full max-w-2xl mb-8"><UrgentCitationCard citation={citation} /></div>}
                {activeRecognitionAwards.length > 0 && (
                    <div className="w-full max-w-2xl mb-8 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm text-left">
                        <h3 className="font-black text-slate-900 flex items-center gap-2">
                            <Award className="w-5 h-5 text-amber-500" /> Reconocimientos obtenidos
                        </h3>
                        <p className="text-sm text-slate-500 mt-1 mb-4">Aunque no tengas proyecto activo, tus insignias y certificados siguen disponibles.</p>
                        <div className="space-y-3">
                            {recognitionAwards.slice(0, 4).map((award: any) => (
                                <div key={award.id} className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
                                    <div>
                                        <p className="font-bold text-slate-800 text-sm">{award.recognitionConfig.name}</p>
                                        <p className="text-xs text-slate-500">{award.project.title}</p>
                                        {award.isRevoked && <p className="text-[11px] text-red-600 font-semibold mt-1">Revocado</p>}
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Link href={`/verify/recognition/${award.verificationCode}`} target="_blank" className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1">
                                            <ShieldCheck className="w-3.5 h-3.5" /> Verificar
                                        </Link>
                                        {!award.isRevoked && (
                                            <a href={`/api/recognitions/${award.id}/certificate`} className="text-xs font-bold text-slate-700 hover:underline flex items-center gap-1">
                                                <Download className="w-3.5 h-3.5" /> PDF
                                            </a>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                <div className="bg-slate-100 p-6 rounded-full mb-6">
                    <Briefcase className="w-12 h-12 text-slate-400" />
                </div>
                <h1 className="text-3xl font-bold text-slate-800 mb-2">No tienes un proyecto activo</h1>
                <p className="text-slate-500 max-w-md mb-8">Para comenzar tu aprendizaje, debes postularte a un proyecto disponible en el mercado.</p>
                <Link
                    href="/dashboard/market"
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-xl shadow-lg shadow-blue-500/20 transition-all hover:scale-105"
                >
                    <Search className="w-5 h-5" />
                    Explorar Proyectos
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800">Hola, {user.name?.split(' ')[0]}</h1>
                    <p className="text-slate-500">Tu panel prioriza avance, agenda y recursos para continuar.</p>
                </div>
                <Link href="/dashboard/assignments" className="inline-flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-xl font-bold hover:bg-slate-50 transition-colors">
                    <Target className="w-4 h-4 text-blue-600" /> Ver todas las entregas
                </Link>
            </header>

            {citation && <UrgentCitationCard citation={citation} />}

            <section className="space-y-4">
                <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-blue-600" /> Proyectos activos y avance
                </h2>
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                    {projectsWithProgress.map((project: any) => (
                        <article key={project.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                            <div className="flex flex-wrap items-center gap-2 mb-4">
                                <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full uppercase tracking-wider">
                                    {project.industry || 'General'}
                                </span>
                                <span className="text-[11px] font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full uppercase tracking-wider">
                                    {PROJECT_TYPE_LABEL[project.type] || 'Proyecto'}
                                </span>
                                <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${project.status === 'IN_PROGRESS' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                                    {project.status === 'IN_PROGRESS' ? 'En curso' : 'Abierto'}
                                </span>
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 line-clamp-1">{project.title}</h3>
                            <p className="text-sm text-slate-500 mt-1 mb-4 line-clamp-2">
                                {project.description || 'Sin descripción adicional.'}
                            </p>
                            <ProgressBar total={project.totalAssignments} completed={project.completedAssignments} />
                            <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
                                <span>Completadas: <strong className="text-slate-800">{project.completedAssignments}</strong></span>
                                <span>Pendientes: <strong className="text-slate-800">{project.pendingAssignments}</strong></span>
                                <span>Avance: <strong className="text-slate-800">{project.progressPercent}%</strong></span>
                            </div>
                            <div className="mt-5 flex flex-wrap gap-2">
                                <Link href={`/dashboard/student/projects/${project.id}/kanban`} className="inline-flex items-center gap-2 bg-slate-900 text-white px-3 py-2 rounded-lg text-xs font-bold hover:bg-black transition-colors">
                                    <Target className="w-3.5 h-3.5" /> Kanban
                                </Link>
                                <Link href={`/dashboard/student/projects/${project.id}`} className="inline-flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-3 py-2 rounded-lg text-xs font-bold hover:bg-slate-50 transition-colors">
                                    <Briefcase className="w-3.5 h-3.5" /> Detalle
                                </Link>
                            </div>
                        </article>
                    ))}
                </div>
            </section>

            <section className="grid grid-cols-1 xl:grid-cols-5 gap-6">
                <article className="xl:col-span-3 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <header className="flex items-center justify-between gap-4 mb-4">
                        <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                            <FileText className="w-5 h-5 text-orange-500" /> Próximas tareas
                        </h2>
                        <Link href="/dashboard/assignments" className="text-xs font-bold text-blue-600 hover:underline">
                            Ver todo
                        </Link>
                    </header>
                    {(upcomingTasks || []).length > 0 ? (
                        <div className="space-y-3">
                            {(upcomingTasks || []).slice(0, 8).map((task: any) => {
                                const dueDate = task.dueDate ? new Date(task.dueDate) : null;
                                const diffDays = dueDate
                                    ? Math.ceil((dueDate.getTime() - nowMs) / (1000 * 60 * 60 * 24))
                                    : null;
                                const taskHref = task.assignment?.id
                                    ? `/dashboard/student/assignments/${task.assignment.id}`
                                    : `/dashboard/student/projects/${task.projectId}/kanban`;

                                return (
                                    <Link key={task.id} href={taskHref} className="block p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <p className="font-bold text-slate-800 text-sm line-clamp-1">{task.title}</p>
                                                <p className="text-xs text-slate-500 mt-1 line-clamp-1">{task.project?.title}</p>
                                            </div>
                                            <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase ${task.priority === 'HIGH' ? 'bg-red-100 text-red-700' : task.priority === 'MEDIUM' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                                {task.priority === 'HIGH' ? 'Alta' : task.priority === 'MEDIUM' ? 'Media' : 'Baja'}
                                            </span>
                                        </div>
                                        <div className="mt-2 flex items-center gap-2 text-xs text-slate-600">
                                            <Clock3 className="w-3.5 h-3.5" />
                                            {dueDate ? `Entrega: ${formatDateOnly(dueDate)}` : 'Sin fecha límite'}
                                            {diffDays !== null && diffDays >= 0 && (
                                                <span className="text-slate-400">· {diffDays === 0 ? 'vence hoy' : `${diffDays} día(s)`}</span>
                                            )}
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    ) : (
                        <p className="text-sm text-slate-500 py-6">No tienes tareas próximas con fecha de entrega.</p>
                    )}
                </article>

                <article className="xl:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <header className="flex items-center justify-between gap-4 mb-4">
                        <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                            <CalendarClock className="w-5 h-5 text-indigo-600" /> Calendario
                        </h2>
                        <Link href="/dashboard/mentorship" className="text-xs font-bold text-blue-600 hover:underline">
                            Mentorías
                        </Link>
                    </header>
                    <p className="text-xs text-slate-500 capitalize mb-3">{monthName}</p>
                    <div className="grid grid-cols-7 gap-1 text-[10px] font-bold text-slate-400 uppercase mb-1">
                        <span className="text-center py-1">L</span>
                        <span className="text-center py-1">M</span>
                        <span className="text-center py-1">X</span>
                        <span className="text-center py-1">J</span>
                        <span className="text-center py-1">V</span>
                        <span className="text-center py-1">S</span>
                        <span className="text-center py-1">D</span>
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                        {calendarDays.map((day, index) => {
                            const dayKey = toDayKey(day);
                            const events = eventsByDay.get(dayKey) || [];
                            const sameMonth = day.getMonth() === today.getMonth();
                            const isToday = dayKey === toDayKey(today);
                            const hasMentorship = events.some((event: any) => event.type === 'MENTORSHIP');
                            const hasTask = events.some((event: any) => event.type === 'TASK');

                            return (
                                <div
                                    key={`${dayKey}-${index}`}
                                    className={`min-h-11 rounded-md border px-1 py-1 ${sameMonth ? 'bg-white border-slate-200' : 'bg-slate-50 border-slate-100'}`}
                                >
                                    <div className={`text-[10px] text-center font-bold ${isToday ? 'text-blue-700' : sameMonth ? 'text-slate-700' : 'text-slate-400'}`}>
                                        {day.getDate()}
                                    </div>
                                    <div className="mt-1 flex items-center justify-center gap-1">
                                        {hasTask && <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />}
                                        {hasMentorship && <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />}
                                    </div>
                                    {events.length > 0 && (
                                        <p className="text-[9px] text-center text-slate-500 mt-0.5">{events.length}</p>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
                        {upcomingCalendarEvents.length > 0 ? (
                            upcomingCalendarEvents.map((event: any) => {
                                const dateInfo = formatDateTime(event.startsAt);
                                return (
                                    <Link key={event.id} href={event.href} className="flex items-start gap-2 p-2 rounded-lg hover:bg-slate-50 transition-colors">
                                        <span className={`mt-1 w-2 h-2 rounded-full ${event.type === 'MENTORSHIP' ? 'bg-indigo-500' : 'bg-orange-500'}`} />
                                        <div className="min-w-0">
                                            <p className="text-xs font-bold text-slate-800 line-clamp-1">{event.title}</p>
                                            <p className="text-[11px] text-slate-500 line-clamp-1">{dateInfo.full}{event.projectTitle ? ` · ${event.projectTitle}` : ''}</p>
                                        </div>
                                    </Link>
                                );
                            })
                        ) : (
                            <p className="text-xs text-slate-500">Sin eventos próximos en agenda.</p>
                        )}
                    </div>
                </article>
            </section>

            <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <article className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <h2 className="text-lg font-extrabold text-slate-900 mb-4 flex items-center gap-2">
                        <Award className="w-5 h-5 text-amber-500" /> Reconocimientos
                    </h2>
                    {recognitionAwards?.length > 0 ? (
                        <div className="space-y-3">
                            {recognitionAwards.slice(0, 8).map((award: any) => (
                                <div key={award.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                                    <p className="font-bold text-slate-800 text-sm line-clamp-1">{award.recognitionConfig.name}</p>
                                    <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{award.project.title}</p>
                                    <p className="text-[10px] text-slate-400 mt-1">{new Date(award.awardedAt).toLocaleDateString()}</p>
                                    <div className="mt-2 flex items-center gap-3">
                                        <Link href={`/verify/recognition/${award.verificationCode}`} target="_blank" className="text-[11px] font-bold text-blue-600 hover:underline flex items-center gap-1">
                                            <ShieldCheck className="w-3.5 h-3.5" /> Verificar
                                        </Link>
                                        {!award.isRevoked && (
                                            <a href={`/api/recognitions/${award.id}/certificate`} className="text-[11px] font-bold text-slate-700 hover:underline flex items-center gap-1">
                                                <Download className="w-3.5 h-3.5" /> PDF
                                            </a>
                                        )}
                                    </div>
                                    {award.isRevoked && <p className="text-[11px] text-red-600 font-semibold mt-1">Revocado</p>}
                                </div>
                            ))}
                            {revokedRecognitionAwards.length > 0 && (
                                <p className="text-[11px] text-slate-500">
                                    Activos: {activeRecognitionAwards.length} · Revocados: {revokedRecognitionAwards.length}
                                </p>
                            )}
                        </div>
                    ) : (
                        <p className="text-sm text-slate-500">Aún no tienes insignias o certificados otorgados.</p>
                    )}
                </article>

                <article className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <h2 className="text-lg font-extrabold text-slate-900 mb-4 flex items-center gap-2">
                        <Megaphone className="w-5 h-5 text-sky-600" /> Últimas comunicaciones
                    </h2>
                    {latestCommunications.length > 0 ? (
                        <div className="space-y-3">
                            {latestCommunications.map((message: any) => (
                                <Link
                                    key={message.id}
                                    href={`/dashboard/student/projects/${message.project.id}`}
                                    className="block p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors"
                                >
                                    <div className="flex items-center justify-between gap-2">
                                        <p className="text-xs font-bold text-slate-700 line-clamp-1">{message.project.title}</p>
                                        <span className="text-[10px] text-slate-400">{formatDateOnly(message.createdAt)}</span>
                                    </div>
                                    <p className="text-xs text-slate-500 mt-1 line-clamp-1">
                                        {message.author?.name || 'Usuario'}
                                    </p>
                                    <p className="text-sm text-slate-700 mt-1 line-clamp-2">
                                        {stripHtml(message.content || '') || 'Mensaje sin contenido'}
                                    </p>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-slate-500">No hay comunicaciones recientes.</p>
                    )}
                </article>
            </section>

            <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <header className="flex items-center justify-between gap-4 mb-4">
                    <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                        <BookOpen className="w-5 h-5 text-emerald-600" /> Recursos de aprendizaje sugeridos
                    </h2>
                    <Link href="/dashboard/learning" className="text-xs font-bold text-blue-600 hover:underline">
                        Ir a biblioteca
                    </Link>
                </header>
                {suggestedLearningResources.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
                        {suggestedLearningResources.map((resource: any) => (
                            <Link key={`${resource.kind}-${resource.id}`} href={resource.href} className="block rounded-xl border border-slate-200 p-4 bg-slate-50 hover:bg-slate-100 transition-colors">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-[10px] font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full uppercase tracking-wider">
                                        {resource.kind === 'LEARNING_OBJECT' ? 'OA' : 'Recurso'}
                                    </span>
                                    <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full uppercase tracking-wider">
                                        {resource.tag || 'Aprendizaje'}
                                    </span>
                                </div>
                                <p className="text-sm font-bold text-slate-800 line-clamp-2">{resource.title}</p>
                                <p className="text-xs text-slate-500 mt-1 line-clamp-2">{resource.description || 'Sin descripción adicional.'}</p>
                                <div className="mt-3 text-[11px] text-slate-500">
                                    {resource.projectTitle ? <p className="line-clamp-1">{resource.projectTitle}</p> : <p>Biblioteca global</p>}
                                    {typeof resource.progress === 'number' ? (
                                        <p className="mt-1 text-slate-400">Progreso: {Math.round(resource.progress * 100)}%</p>
                                    ) : (
                                        <p className="mt-1 text-slate-400">{resource.isCompleted ? 'Completado' : 'Pendiente por revisar'}</p>
                                    )}
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-slate-500">Aún no hay recursos sugeridos para tus proyectos activos.</p>
                )}
            </section>

            <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <article className="bg-gradient-to-br from-indigo-600 to-blue-700 p-6 rounded-2xl shadow-lg text-white">
                    <h3 className="font-bold mb-3 flex items-center gap-2 text-indigo-100">
                        <CalendarClock className="w-5 h-5" /> Próxima mentoría
                    </h3>
                    {nextMentorship ? (
                        <div>
                            <p className="text-3xl font-bold">{new Date(nextMentorship.slot.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                            <p className="text-indigo-200 text-sm mt-1">{formatDateOnly(nextMentorship.slot.startTime)}</p>
                            <p className="text-indigo-100 text-sm mt-3">
                                Tutor: <strong>{nextMentorship.slot.teacher?.name || 'Tutor'}</strong>
                            </p>
                            <Link href="/dashboard/mentorship" className="inline-flex mt-4 bg-white text-indigo-700 font-bold px-4 py-2 rounded-lg text-sm hover:bg-indigo-50 transition-colors">
                                Ver mentorías
                            </Link>
                        </div>
                    ) : (
                        <p className="text-indigo-100 text-sm">No tienes mentorías programadas.</p>
                    )}
                </article>

                <article className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" /> Estado general
                    </h3>
                    <div className="space-y-2 text-sm text-slate-600">
                        <p>Proyectos activos: <strong className="text-slate-900">{projectsWithProgress.length}</strong></p>
                        <p>Tareas próximas: <strong className="text-slate-900">{upcomingTasks.length}</strong></p>
                        <p>Reconocimientos activos: <strong className="text-slate-900">{activeRecognitionAwards.length}</strong></p>
                        <p>Mensajes recientes: <strong className="text-slate-900">{latestCommunications.length}</strong></p>
                    </div>
                </article>
            </section>
        </div >
    );
}
