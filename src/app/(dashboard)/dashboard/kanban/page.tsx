import { KanbanBoard } from '@/components/KanbanBoard';

export default function KanbanPage() {
    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800">Tablero Kanban</h1>
                    <p className="text-slate-500">Gestiona las tareas de tu proyecto</p>
                </div>
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition-colors">
                    + Nueva Tarea
                </button>
            </div>

            <KanbanBoard />
        </div>
    );
}
