'use client';

import { useState, useEffect } from 'react';
import { X, Calendar, Flag, MessageSquare, CheckCircle, User as UserIcon } from 'lucide-react';
import { format } from 'date-fns';
import { prisma } from '@/lib/prisma'; // Note: Client component shouldn't import prisma directly, but we are using API. OK.

interface Comment {
    id: string;
    content: string;
    createdAt: string;
    user: { name: string | null; avatarUrl: string | null };
}

interface Task {
    id: string;
    title: string;
    description: string | null;
    status: string;
    priority: 'LOW' | 'MEDIUM' | 'HIGH';
    dueDate: string | null;
    isApproved: boolean;
    approvalNotes: string | null;
    comments: Comment[];
    tags: { id: string; name: string; color: string }[];
}

interface TaskModalProps {
    task: Task;
    isOpen: boolean;
    onClose: () => void;
    onUpdate: (updatedTask: any) => void;
}

export function TaskModal({ task, isOpen, onClose, onUpdate }: TaskModalProps) {
    const [title, setTitle] = useState(task.title);
    const [description, setDescription] = useState(task.description || '');
    const [priority, setPriority] = useState(task.priority);
    const [dueDate, setDueDate] = useState(task.dueDate ? task.dueDate.split('T')[0] : '');
    const [newComment, setNewComment] = useState('');
    const [comments, setComments] = useState<Comment[]>(task.comments || []);
    const [isApproved, setIsApproved] = useState(task.isApproved);

    // Sync state when task changes
    useEffect(() => {
        setTitle(task.title);
        setDescription(task.description || '');
        setPriority(task.priority);
        setDueDate(task.dueDate ? task.dueDate.split('T')[0] : '');
        setComments(task.comments || []);
        setIsApproved(task.isApproved);
        setNewComment('');
    }, [task]);

    if (!isOpen) return null;

    const handleSave = async () => {
        const res = await fetch(`/api/tasks/${task.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title,
                description,
                priority,
                dueDate: dueDate || null
            })
        });
        const updated = await res.json();
        onUpdate(updated);
        onClose();
    };

    const handleComment = async () => {
        if (!newComment.trim()) return;

        const res = await fetch('/api/comments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                taskId: task.id,
                content: newComment
            })
        });
        const savedComment = await res.json();
        setComments([savedComment, ...comments]); // Prepend
        setNewComment('');

        // Notify parent to refresh data if needed, or just keep local state
        // onUpdate({ ...task, comments: [savedComment, ...comments] });
    };

    const handleApprove = async () => {
        const res = await fetch(`/api/tasks/${task.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isApproved: !isApproved })
        });
        const updated = await res.json();
        setIsApproved(updated.isApproved);
        onUpdate(updated);
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-gray-100">
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="text-xl font-bold text-slate-800 bg-transparent border-none focus:ring-0 w-full"
                    />
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Main Content */}
                    <div className="md:col-span-2 space-y-6">
                        {/* Description */}
                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Descripción</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full text-slate-600 text-sm bg-slate-50 border border-slate-200 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none resize-none h-32"
                                placeholder="Añade una descripción detallada..."
                            />
                        </div>

                        {/* Comments */}
                        <div>
                            <label className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase mb-4">
                                <MessageSquare className="w-4 h-4" /> Comentarios
                            </label>

                            <div className="flex gap-2 mb-4">
                                <input
                                    type="text"
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    placeholder="Escribe un comentario..."
                                    className="flex-1 bg-white border border-slate-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
                                    onKeyDown={(e) => e.key === 'Enter' && handleComment()}
                                />
                                <button
                                    onClick={handleComment}
                                    className="bg-slate-100 text-slate-600 px-4 py-2 rounded-md text-sm font-medium hover:bg-slate-200"
                                >
                                    Enviar
                                </button>
                            </div>

                            <div className="space-y-4">
                                {comments.map((comment) => (
                                    <div key={comment.id} className="flex gap-3">
                                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                                            <span className="text-xs font-bold text-blue-600">
                                                {comment.user?.name ? comment.user.name[0] : 'U'}
                                            </span>
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-bold text-slate-700">{comment.user?.name || 'Usuario'}</span>
                                                <span className="text-xs text-slate-400">{new Date(comment.createdAt).toLocaleDateString()}</span>
                                            </div>
                                            <p className="text-sm text-slate-600 mt-1">{comment.content}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Actions */}
                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Detalles</label>

                            <div className="space-y-3">
                                {/* Priority */}
                                <div>
                                    <span className="text-xs text-slate-500 block mb-1">Prioridad</span>
                                    <select
                                        value={priority}
                                        onChange={(e) => setPriority(e.target.value as any)}
                                        className="w-full bg-white border border-slate-200 text-slate-700 text-sm rounded-md px-2 py-1.5 focus:outline-none"
                                    >
                                        <option value="LOW">Baja</option>
                                        <option value="MEDIUM">Media</option>
                                        <option value="HIGH">Alta</option>
                                    </select>
                                </div>

                                {/* Due Date */}
                                <div>
                                    <span className="text-xs text-slate-500 block mb-1">Fecha Límite</span>
                                    <input
                                        type="date"
                                        value={dueDate}
                                        onChange={(e) => setDueDate(e.target.value)}
                                        className="w-full bg-white border border-slate-200 text-slate-700 text-sm rounded-md px-2 py-1.5"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Approval (Teacher Feature) */}
                        <div className="pt-4 border-t border-slate-100">
                            <button
                                onClick={handleApprove}
                                className={`w-full flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-colors ${isApproved
                                        ? 'bg-green-100 text-green-700'
                                        : 'bg-slate-100 text-slate-600 hover:bg-green-50 hover:text-green-600'
                                    }`}
                            >
                                <CheckCircle className="w-4 h-4" />
                                {isApproved ? 'Aprobada' : 'Aprobar Tarea'}
                            </button>
                            {isApproved && <p className="text-xs text-green-600 text-center mt-2">Esta tarea ha sido validada.</p>}
                        </div>

                        <div className="pt-20">
                            <button
                                onClick={handleSave}
                                className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-semibold hover:bg-blue-700 shadow-lg shadow-blue-500/20"
                            >
                                Guardar Cambios
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
