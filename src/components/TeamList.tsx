import { Mail, Users } from 'lucide-react';

interface TeamMember {
    id?: string;
    name: string | null;
    email?: string | null;
}

interface TeamListProps {
    students: TeamMember[];
    teachers: TeamMember[];
    onMessageMember?: (memberId: string) => void;
}

export function TeamList({ students, teachers, onMessageMember }: TeamListProps) {
    return (
        <div className="space-y-6">
            {/* Tutors */}
            <div>
                <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Tutores</h5>
                <div className="space-y-3">
                    {teachers.map((teacher, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold">
                                    {teacher.name ? teacher.name[0] : 'T'}
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-slate-800">{teacher.name || 'Tutor'}</p>
                                    <p className="text-xs text-slate-500">Profesor Guía</p>
                                </div>
                            </div>
                            {onMessageMember && teacher.id ? (
                                <button
                                    onClick={() => onMessageMember(teacher.id!)}
                                    className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-full transition-colors"
                                    title="Enviar mensaje en plataforma"
                                >
                                    <Mail className="w-4 h-4" />
                                </button>
                            ) : teacher.email && (
                                <a
                                    href={`mailto:${teacher.email}`}
                                    className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-full transition-colors"
                                    title="Contactar por Email"
                                >
                                    <Mail className="w-4 h-4" />
                                </a>
                            )}
                        </div>
                    ))}
                    {teachers.length === 0 && <p className="text-xs text-slate-400 italic">No hay tutores asignados.</p>}
                </div>
            </div>

            {/* Students */}
            <div>
                <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Estudiantes</h5>
                <div className="space-y-2">
                    {students.map((student, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg transition-colors group">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">
                                    {student.name ? student.name[0] : 'S'}
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-slate-700">{student.name || 'Estudiante'}</p>
                                    <p className="text-xs text-slate-400">Miembro del Equipo</p>
                                </div>
                            </div>
                            {onMessageMember && student.id && (
                                <button
                                    onClick={() => onMessageMember(student.id!)}
                                    className="p-2 text-slate-300 hover:text-blue-500 hover:bg-blue-50 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                                    title="Enviar mensaje en plataforma"
                                >
                                    <Mail className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    ))}
                    {students.length === 0 && (
                        <div className="flex items-center gap-2 text-slate-400 p-2">
                            <Users className="w-4 h-4" />
                            <p className="text-xs italic">Sin estudiantes aún.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
