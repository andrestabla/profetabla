'use client';

import { useState, useEffect } from 'react';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, KeyboardSensor, PointerSensor, useSensor, useSensors, closestCorners } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { clsx } from 'clsx';
import { MoreVertical, Plus, Calendar, Flag, CheckCircle } from 'lucide-react';
import { TaskModal } from './TaskModal';

type Task = {
    id: string;
    title: string;
    description: string | null;
    status: 'TODO' | 'IN_PROGRESS' | 'DONE';
    priority: 'LOW' | 'MEDIUM' | 'HIGH';
    dueDate: string | null;
    isApproved: boolean;
    approvalNotes: string | null;
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

export function KanbanBoard({ projectId }: { projectId: string }) {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        if (!projectId) return;
        fetch(`/api/tasks?projectId=${projectId}`)
            .then((res) => res.json())
            .then((data) => {
                if (Array.isArray(data)) setTasks(data);
            });
    }, [projectId]);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    function handleDragStart(event: DragStartEvent) {
        setActiveId(event.active.id as string);
    }

    function handleDragEnd(event: DragEndEvent) {
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

            fetch(`/api/tasks/${activeTask.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });
        }
        setActiveId(null);
    }

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
            isApproved: false,
            approvalNotes: null,
            comments: [],
            tags: []
        } as Task;
        setTasks([...tasks, newTask]);

        const res = await fetch('/api/tasks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, status, projectId, priority: 'MEDIUM' })
        });
        const savedTask = await res.json();
        setTasks(prev => prev.map(t => t.id === tempId ? savedTask : t));
    };

    const handleTaskClick = (task: Task) => {
        setSelectedTask(task);
        setIsModalOpen(true);
    };

    const handleTaskUpdate = (updatedTask: Task) => {
        setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
    };


    return (
        <>
            <DndContext
                sensors={sensors}
                collisionDetection={closestCorners}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
            >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full items-start">
                    {COLUMNS.map((col) => (
                        <div key={col.id} className={`p-4 rounded-xl border ${col.color} min-h-[500px]`}>
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-semibold text-slate-700">{col.title}</h3>
                                <span className="bg-white/50 text-slate-500 text-xs px-2 py-1 rounded-full font-medium">
                                    {tasks.filter(t => t.status === col.id).length}
                                </span>
                            </div>

                            <SortableContext
                                items={tasks.filter(t => t.status === col.id).map(t => t.id)}
                                strategy={verticalListSortingStrategy}
                            >
                                <div className="space-y-3">
                                    {tasks.filter(t => t.status === col.id).map((task) => (
                                        <SortableTask
                                            key={task.id}
                                            task={task}
                                            onClick={() => handleTaskClick(task)}
                                        />
                                    ))}
                                </div>
                            </SortableContext>

                            <button
                                onClick={() => addTask(col.id as Task['status'])}
                                className="w-full mt-4 py-2 border-2 border-dashed border-slate-300 rounded-lg text-slate-400 hover:border-blue-400 hover:text-blue-500 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                            >
                                <Plus className="w-4 h-4" /> Añadir Tarea
                            </button>
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
            </DndContext>

            {selectedTask && (
                <TaskModal
                    key={selectedTask.id}
                    task={selectedTask}
                    projectId={projectId}
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onUpdate={handleTaskUpdate}
                />
            )}
        </>
    );
}

function SortableTask({ task, onClick }: { task: Task; onClick?: () => void }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: task.id });

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
                "bg-white p-4 rounded-lg shadow-sm border border-slate-100 cursor-grab hover:shadow-md transition-shadow group relative",
                isDragging && "opacity-50",
                task.isApproved && "border-l-4 border-l-green-500"
            )}
        >
            <div className="flex justify-between items-start">
                <h4 className="font-medium text-slate-800 text-sm">{task.title}</h4>
                {task.priority === 'HIGH' && <Flag className="w-3 h-3 text-red-500 fill-red-500" />}
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
                <button className="text-slate-300 hover:text-slate-500">
                    <MoreVertical className="w-4 h-4" />
                </button>
            </div>
        </div>
    )
}
