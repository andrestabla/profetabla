import { Mail } from 'lucide-react';

interface TeamListProps {
    studentName: string | null;
    teacherName: string | null;
    teacherEmail: string;
}

export function TeamList({ studentName, teacherName, teacherEmail }: TeamListProps) {
    return (
        <div className="space-y-4">
            {/* Tutor */}
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold">
                        {teacherName ? teacherName[0] : 'T'}
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-800">{teacherName || 'Tutor Asignado'}</p>
                        <p className="text-xs text-slate-500">Profesor Guía</p>
                    </div>
                </div>
                <a
                    href={`mailto:${teacherEmail}`}
                    className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-full transition-colors"
                    title="Contactar"
                >
                    <Mail className="w-4 h-4" />
                </a>
            </div>

            {/* Student (Self) */}
            <div className="flex items-center gap-3 p-2">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">
                    {studentName ? studentName[0] : 'Y'}
                </div>
                <div>
                    <p className="text-sm font-medium text-slate-700">{studentName || 'Tú'}</p>
                    <p className="text-xs text-slate-400">Estudiante</p>
                </div>
            </div>
        </div>
    );
}
