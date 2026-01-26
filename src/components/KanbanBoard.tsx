'use client';

import { useState, useEffect } from 'react';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, KeyboardSensor, PointerSensor, useSensor, useSensors, closestCorners } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { format } from 'date-fns';
import { clsx } from 'clsx';
import { MoreVertical, Plus } from 'lucide-react';

type Task = {
    id: string;
    title: string;
    status: 'TODO' | 'IN_PROGRESS' | 'DONE';
};

const COLUMNS = [
    { id: 'TODO', title: 'Por Hacer', color: 'bg-slate-100 border-slate-200' },
    { id: 'IN_PROGRESS', title: 'En Progreso', color: 'bg-blue-50 border-blue-100' },
    { id: 'DONE', title: 'Terminado', color: 'bg-green-50 border-green-100' },
];

export function KanbanBoard() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [activeId, setActiveId] = useState<string | null>(null);

    useEffect(() => {
        fetch('/api/tasks')
            .then((res) => res.json())
            .then((data) => {
                if (Array.isArray(data)) setTasks(data);
            });
    }, []);

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

        // Determine new status
        // If dropped over a container (column)
        let newStatus = activeTask.status;
        if (COLUMNS.some(c => c.id === over.id)) {
            newStatus = over.id as Task['status'];
        } else {
            // Dropped over another item
            const overTask = tasks.find(t => t.id === over.id);
            if (overTask) {
                newStatus = overTask.status;
            }
        }

        if (activeTask.status !== newStatus) {
            // Optimistic update
            const updatedTasks = tasks.map(t =>
                t.id === activeTask.id ? { ...t, status: newStatus } : t
            );
            setTasks(updatedTasks);

            // API update
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

        // Optimistic add (with temp ID)
        const tempId = Math.random().toString();
        const newTask = { id: tempId, title, status } as Task;
        setTasks([...tasks, newTask]);

        const res = await fetch('/api/tasks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title }) // Assumes default project
        });
        const savedTask = await res.json();

        // Replace temp task
        setTasks(prev => prev.map(t => t.id === tempId ? savedTask : t));
    };


    return (
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
                                    <SortableTask key={task.id} task={task} />
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
    );
}

function SortableTask({ task }: { task: Task }) {
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
            className={clsx(
                "bg-white p-4 rounded-lg shadow-sm border border-slate-100 cursor-grab hover:shadow-md transition-shadow group relative",
                isDragging && "opacity-50"
            )}
        >
            <h4 className="font-medium text-slate-800">{task.title}</h4>
            <div className="flex justify-between items-center mt-3">
                <div className="text-xs text-slate-400 bg-slate-50 px-2 py-1 rounded">Dev</div>
                <button className="text-slate-300 hover:text-slate-500">
                    <MoreVertical className="w-4 h-4" />
                </button>
            </div>
        </div>
    )
}
