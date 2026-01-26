import { AlertTriangle, Calendar, Clock } from 'lucide-react';

export function UrgentCitationCard({ citation }: { citation: { teacherName: string, date: string, time: string, meetingUrl: string } }) {
    if (!citation) return null;

    return (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg shadow-sm mb-6 flex items-start gap-4 animate-in slide-in-from-top duration-500">
            <div className="p-2 bg-white rounded-full shadow-sm text-red-500">
                <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="flex-1">
                <h3 className="font-bold text-red-800 text-lg">⚠️ Citación de Seguimiento Requerida</h3>
                <p className="text-red-700 text-sm mt-1">
                    Tu tutor <strong>{citation.teacherName}</strong> ha agendado una sesión obligatoria para revisar el avance de tu proyecto.
                </p>
                <div className="mt-3 flex gap-4 text-sm font-medium text-red-800 bg-red-100/50 p-3 rounded-lg w-fit">
                    <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {citation.date}</span>
                    <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {citation.time}</span>
                </div>
                <div className="mt-3">
                    <a href={citation.meetingUrl} className="text-sm font-bold text-red-600 underline hover:text-red-800">
                        Enlace a la videollamada →
                    </a>
                </div>
            </div>
        </div>
    );
}
