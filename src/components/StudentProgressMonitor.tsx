import { CheckCircle2, Clock, AlertCircle } from 'lucide-react';

export function StudentProgressMonitor({ studentName, totalItems, completedItems, totalTime }: { studentName: string, totalItems: number, completedItems: number, totalTime: number }) {
    // Cálculo del porcentaje de finalización del OA
    const progressPercentage = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

    return (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Progreso de {studentName}</h3>

            {/* Barra de Progreso Global */}
            <div className="w-full bg-slate-100 rounded-full h-3 mb-2">
                <div
                    className="bg-emerald-500 h-3 rounded-full transition-all duration-1000"
                    style={{ width: `${progressPercentage}%` }}
                />
            </div>

            <div className="flex justify-between items-center text-sm font-medium mb-6">
                <span className="text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> {progressPercentage}% Completado
                </span>
                <span className="text-slate-500 flex items-center gap-1">
                    <Clock className="w-4 h-4" /> Tiempo total: {Math.round(totalTime / 60)} minutos
                </span>
            </div>

            {/* Alerta de Retraso Inteligente */}
            {progressPercentage < 50 && (
                <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg flex items-start gap-2 text-sm text-amber-800">
                    <AlertCircle className="w-5 h-5 mt-0.5" />
                    <p>El estudiante está atrasado en el consumo de contenidos. Se sugiere programar una <strong>Mentoría</strong> para revisar el avance.</p>
                </div>
            )}
        </div>
    );
}
