'use client';

interface ProgressBarProps {
    total: number;
    completed: number;
}

export function ProgressBar({ total, completed }: ProgressBarProps) {
    const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);

    return (
        <div className="w-full">
            <div className="flex justify-between mb-1">
                <span className="text-sm font-medium text-blue-700 dark:text-white">Avance del Proyecto</span>
                <span className="text-sm font-medium text-blue-700 dark:text-white">{percentage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                <div
                    className="bg-blue-600 h-2.5 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${percentage}%` }}
                ></div>
            </div>
            <p className="text-xs text-slate-400 mt-2 text-right">{completed}/{total} Tareas completadas</p>
        </div>
    );
}
