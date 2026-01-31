'use client';

import { useState, useEffect } from 'react';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, KeyboardSensor, PointerSensor, useSensor, useSensors, closestCorners } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { clsx } from 'clsx';
import { MoreVertical, Plus, Calendar, Flag, CheckCircle, Sparkles, Loader2, Save, X, Trash2, Edit2 } from 'lucide-react';
import { TaskModal } from './TaskModal';
import { generateTasksFromProject } from '@/app/actions/kanban-actions';

type Task = {
    id: string;
    title: string;
    description: string | null;
    status: 'TODO' | 'IN_PROGRESS' | 'DONE';
    priority: 'LOW' | 'MEDIUM' | 'HIGH';
    dueDate: string | null;
    deliverable: string | null;
    evaluationCriteria: string | null;
    isApproved: boolean;
    approvalNotes: string | null;
    isMandatory: boolean;
    assignment?: { id: string } | null;
    /* eslint-disable @typescript-eslint/no-explicit-any */
    comments: any[];
    tags: any[];
    /* eslint-enable @typescript-eslint/no-explicit-any */
};

const COLUMNS = [
    { id: 'TODO', title: 'Por Hacer', color: 'bg-slate-100 border-slate-200' },
    { id: 'IN_PROGRESS', title: 'En Progreso', color: 'bg-blue-50 border-blue-100' },
    { id: 'DONE', title: 'Terminado', color: 'bg-green-50 border-green-100' },
];

export function KanbanBoard({ projectId, userRole }: { projectId: string; userRole: string }) {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [originalTasks, setOriginalTasks] = useState<Task[]>([]);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (!projectId) return;
        fetch(`/api/tasks?projectId=${projectId}`)
            .then((res) => res.json())
            .then((data) => {
                if (Array.isArray(data)) {
                    setTasks(data);
                    setOriginalTasks(data); // Sync original state
                }
            });
    }, [projectId]);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5, // Prevent accidental drags when clicking
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    function handleDragStart(event: DragStartEvent) {
        if (!isEditMode) return;
        setActiveId(event.active.id as string);
    }

    function handleDragEnd(event: DragEndEvent) {
        if (!isEditMode) return;
        const { active, over } = event;
        const activeTask = tasks.find(t => t.id === active.id);

        if (!activeTask || !over) return;

        let newStatus = activeTask.status;
        if (COLUMNS.some(c => c.id === over.id)) {
            newStatus = over.id as Task['status'];
        } else {
            const overTask = tasks.find(t => t.id === over.id);
            if (overTask) {
                newStatus = overTask.status;
            }
        }

        if (activeTask.status !== newStatus) {
            const updatedTasks = tasks.map(t =>
                t.id === activeTask.id ? { ...t, status: newStatus } : t
            );
            setTasks(updatedTasks);
            // In Edit Mode, we DO NOT auto-save. Changes are buffered.
        }
        setActiveId(null);
    }

    const handleSaveBatch = async () => {
        setIsSaving(true);
        try {
            // Find modified tasks
            const modifiedTasks = tasks.filter(t => {
                const original = originalTasks.find(ot => ot.id === t.id);
                return !original || original.status !== t.status; // Or other fields if we supported dnd reorder
            });

            // Update modified tasks
            await Promise.all(modifiedTasks.map(t =>
                fetch(`/api/tasks/${t.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: t.status })
                })
            ));

            // Reload to ensure sync
            setOriginalTasks(tasks);
            setIsEditMode(false);
            alert("Cambios guardados correctamente");
        } catch (error) {
            console.error("Error saving batch:", error);
            alert("Error al guardar cambios");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDiscard = () => {
        if (confirm("¿Descartar cambios no guardados?")) {
            setTasks(originalTasks);
            setIsEditMode(false);
        }
    };

    const handleDeleteTask = async (taskId: string) => {
        if (!confirm("¿Estás seguro de eliminar esta tarea?")) return;

        // Optimistic update
        setTasks(prev => prev.filter(t => t.id !== taskId));

        try {
            await fetch(`/api/tasks/${taskId}`, { method: 'DELETE' });
            // Update original state to prevent "discard" from bringing it back if mixed with other edits
            setOriginalTasks(prev => prev.filter(t => t.id !== taskId));
        } catch (error) {
            console.error(error);
            alert("Error al eliminar la tarea");
            // Revert? Complex without reload. Simpler to just reload or accept the risk for now.
        }
    };

    const addTask = async (status: Task['status']) => {
        const title = prompt("Título de la tarea:");
        if (!title) return;

        const tempId = crypto.randomUUID();
        const newTask = {
            id: tempId,
            title,
            description: null,
            status,
            priority: 'MEDIUM',
            dueDate: null,
            deliverable: null,
            evaluationCriteria: null,
            isApproved: false,
            approvalNotes: null,
            isMandatory: false,
            comments: [],
            tags: []
        } as Task;
        setTasks([...tasks, newTask]);

        try {
            // Create immediately (safe default behavior)
            const res = await fetch('/api/tasks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, status, projectId, priority: 'MEDIUM' })
            });
            const savedTask = await res.json();
            // Update ID from server
            // Append to tasks AND originalTasks (since it's saved)
            // But wait, if we are in EditMode, adding a task might be confusing if we don't save it
            // Let's assume adding tasks works regardless of edit mode and persists immediately.
            setTasks(prev => [...prev.filter(t => t.id !== tempId), savedTask]);
            setOriginalTasks(prev => [...prev, savedTask]);
        } catch (e) {
            console.error(e);
            alert("Error al crear tarea");
            setTasks(prev => prev.filter(t => t.id !== tempId));
        }
    };

    const handleTaskClick = (task: Task) => {
        // Always open modal unless dragging (handled by sensors)
        // If in Edit Mode, user might want to drag, but clicking connects to modal.
        // DnD library handles distinction.
        setSelectedTask(task);
        setIsModalOpen(true);
    };

    const handleTaskUpdate = (updatedTask: Task) => {
        const newTasks = tasks.map(t => t.id === updatedTask.id ? updatedTask : t);
        setTasks(newTasks);
        setOriginalTasks(newTasks); // Saved in Modal implies persistent save
    };


    return (
        <>
            {/* Header Actions */}
            <div className="flex justify-end mb-6 gap-3">
                {isEditMode ? (
                    <>
                        <button
                            onClick={handleDiscard}
                            className="bg-red-50 text-red-600 hover:bg-red-100 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
                            disabled={isSaving}
                        >
                            <X className="w-4 h-4" /> Descartar
                        </button>
                        <button
                            onClick={handleSaveBatch}
                            className="bg-green-600 text-white hover:bg-green-700 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 shadow-sm transition-colors"
                            disabled={isSaving}
                        >
                            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            Guardar Cambios
                        </button>
                    </>
                ) : (
                    <button
                        onClick={() => setIsEditMode(true)}
                        className="bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-blue-600 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 shadow-sm transition-colors"
                    >
                        <Edit2 className="w-4 h-4" /> Habilitar Edición
                    </button>
                )}
            </div>

            <DndContext
                sensors={sensors}
                collisionDetection={closestCorners}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
            >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full items-start">
                    {COLUMNS.map((col) => (
                        <div key={col.id} className={`p-4 rounded-xl border ${col.color} min-h-[500px]`}>
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <h3 className="font-semibold text-slate-700">{col.title}</h3>
                                    <span className="bg-white/50 text-slate-500 text-xs px-2 py-1 rounded-full font-medium">
                                        {tasks.filter(t => t.status === col.id).length}
                                    </span>
                                </div>
                                {col.id === 'TODO' && (userRole === 'TEACHER' || userRole === 'ADMIN') && (
                                    <button
                                        onClick={async () => {
                                            if (!confirm("¿Generar tareas automáticas basadas en el proyecto via IA?")) return;
                                            setIsGenerating(true);
                                            try {
                                                const res = await generateTasksFromProject(projectId);
                                                if (res.success) {
                                                    // Reload tasks
                                                    fetch(`/api/tasks?projectId=${projectId}`)
                                                        .then((res) => res.json())
                                                        .then((data) => {
                                                            if (Array.isArray(data)) {
                                                                setTasks(data);
                                                                setOriginalTasks(data);
                                                            }
                                                            setIsGenerating(false);
                                                        });
                                                } else {
                                                    alert(res.error || "Error al generar tareas");
                                                    setIsGenerating(false);
                                                }
                                            } catch (error) {
                                                console.error(error);
                                                alert("Error de conexión");
                                                setIsGenerating(false);
                                            }
                                        }}
                                        disabled={isGenerating || isEditMode}
                                        className="text-xs bg-purple-100 hover:bg-purple-200 text-purple-700 px-2 py-1 rounded-md flex items-center gap-1 transition-colors disabled:opacity-50"
                                        title="Generar tareas con IA"
                                    >
                                        {isGenerating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                                        IA
                                    </button>
                                )}
                            </div>

                            <SortableContext
                                items={tasks.filter(t => t.status === col.id).map(t => t.id)}
                                strategy={verticalListSortingStrategy}
                                disabled={!isEditMode} // Disable sorting/dragging if not in Edit Mode
                            >
                                <div className="space-y-3">
                                    {tasks.filter(t => t.status === col.id).map((task) => (
                                        <SortableTask
                                            key={task.id}
                                            task={task}
                                            isEditMode={isEditMode}
                                            onClick={() => handleTaskClick(task)}
                                            onDelete={() => handleDeleteTask(task.id)}
                                        />
                                    ))}
                                </div>
                            </SortableContext>

                            {isEditMode && (
                                <button
                                    onClick={() => addTask(col.id as Task['status'])}
                                    className="w-full mt-4 py-2 border-2 border-dashed border-slate-300 rounded-lg text-slate-400 hover:border-blue-400 hover:text-blue-500 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                                >
                                    <Plus className="w-4 h-4" /> Añadir Tarea
                                </button>
                            )}
                        </div>
                    ))}
                </div>
                <DragOverlay>
                    {activeId ? (
                        <div className="bg-white p-4 rounded-lg shadow-xl border border-blue-200 opacity-90 rotate-3 cursor-grabbing">
                            <h4 className="font-medium text-slate-800">{tasks.find(t => t.id === activeId)?.title}</h4>
                        </div>
                    ) : null}
                </DragOverlay>
            </DndContext >

            {selectedTask && (
                <TaskModal
                    key={selectedTask.id}
                    task={selectedTask}
                    projectId={projectId}
                    userRole={userRole}
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onUpdate={handleTaskUpdate}
                />
            )}
        </>
    );
}

function SortableTask({ task, isEditMode, onClick, onDelete }: { task: Task; isEditMode: boolean; onClick: () => void; onDelete: () => void }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({
        id: task.id,
        disabled: !isEditMode
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            onClick={onClick}
            className={clsx(
                "bg-white p-4 rounded-lg shadow-sm border border-slate-100 cursor-pointer hover:shadow-md transition-shadow group relative select-none",
                isDragging && "opacity-50",
                task.isApproved && "border-l-4 border-l-green-500",
                task.isMandatory && !task.isApproved && "border-l-4 border-l-blue-500",
                isEditMode && "cursor-grab"
            )}
        >
            {task.isMandatory && (
                <div className="absolute -top-2 left-2 bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                    OBLIGATORIA
                </div>
            )}
            {!task.isMandatory && (
                <div className="absolute -top-2 left-2 bg-slate-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                    AUTOGESTIÓN
                </div>
            )}
            <div className="flex justify-between items-start">
                <h4 className="font-medium text-slate-800 text-sm line-clamp-2">{task.title}</h4>
                {task.priority === 'HIGH' && <Flag className="w-3 h-3 text-red-500 fill-red-500 flex-shrink-0" />}
            </div>

            <div className="flex justify-between items-center mt-3">
                <div className="flex gap-2 text-xs">
                    {task.dueDate && (
                        <span className="flex items-center gap-1 text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded">
                            <Calendar className="w-3 h-3" />
                            {new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </span>
                    )}
                    {task.isApproved && (
                        <span className="flex items-center gap-1 text-green-600 bg-green-50 px-1.5 py-0.5 rounded font-medium">
                            <CheckCircle className="w-3 h-3" /> Aprobado
                        </span>
                    )}
                </div>

                {isEditMode ? (
                    <button
                        onClick={(e) => {
                            e.stopPropagation(); // Prevent modal open
                            onDelete();
                        }}
                        className="text-red-300 hover:text-red-500 p-1 rounded-md hover:bg-red-50 transition-colors"
                        title="Eliminar Tarea"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                ) : (
                    <div className="text-slate-300">
                        {/* Status indicator or read-only icon if needed */}
                        <MoreVertical className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                )}
            </div>
        </div>
    )
}
