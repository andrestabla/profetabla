'use client';

import { useState } from 'react';
import { X, MessageSquare, CheckCircle, HelpCircle, Package, ClipboardCheck, Calendar, Flag, Send, User } from 'lucide-react';
import Link from 'next/link';

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
    deliverable: string | null;
    evaluationCriteria: string | null;
    isApproved: boolean;
    approvalNotes: string | null;
    comments: Comment[];
    tags: { id: string; name: string; color: string }[];
}

interface TaskModalProps {
    task: Task;
    projectId?: string;
    isOpen: boolean;
    onClose: () => void;
    /* eslint-disable @typescript-eslint/no-explicit-any */
    onUpdate: (updatedTask: any) => void;
}

export function TaskModal({ task, projectId, isOpen, onClose, onUpdate }: TaskModalProps) {
    const [title, setTitle] = useState(task.title);
    const [description, setDescription] = useState(task.description || '');
    const [priority, setPriority] = useState(task.priority);
    const [dueDate, setDueDate] = useState(task.dueDate ? task.dueDate.split('T')[0] : '');
    const [deliverable, setDeliverable] = useState(task.deliverable || '');
    const [evaluationCriteria, setEvaluationCriteria] = useState(task.evaluationCriteria || '');

    const [newComment, setNewComment] = useState('');
    const [comments, setComments] = useState<Comment[]>(task.comments || []);
    const [isApproved, setIsApproved] = useState(task.isApproved);

    if (!isOpen) return null;

    const handleSave = async () => {
        const res = await fetch(`/api/tasks/${task.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title,
                description,
                priority,
                dueDate: dueDate || null,
                deliverable,
                evaluationCriteria
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
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 transition-all duration-300">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                
                {/* Header (Minimal) */}
                <div className="flex justify-between items-center px-8 py-5 border-b border-gray-100 bg-white sticky top-0 z-10">
                    <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide 
                            ${priority === 'HIGH' ? 'bg-red-100 text-red-700' : 
                              priority === 'MEDIUM' ? 'bg-amber-100 text-amber-700' : 
                              'bg-green-100 text-green-700'}`}>
                            {priority === 'HIGH' ? 'Alta Prioridad' : priority === 'MEDIUM' ? 'Media Prioridad' : 'Baja Prioridad'}
                        </span>
                        <span className="text-slate-400 text-sm font-medium">#{task.id.slice(0, 8)}</span>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-full transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Body (Scrollable) */}
                <div className="flex-1 overflow-y-auto p-8 grid grid-cols-1 lg:grid-cols-3 gap-10 bg-slate-50/30">
                    
                    {/* Main Column (Left) */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Title Input */}
                        <div>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="text-3xl font-bold text-slate-800 bg-transparent border-none focus:ring-0 p-0 w-full placeholder:text-slate-300 leading-tight"
                                placeholder="Título de la Tarea"
                            />
                        </div>

                        {/* Description */}
                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                            <label className="text-xs font-bold text-slate-400 uppercase mb-4 block flex items-center gap-2">
                                <span className="p-1 bg-blue-100 text-blue-600 rounded">
                                    <MessageSquare className="w-3" size={14} />
                                </span>
                                Descripción
                            </label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full text-slate-600 text-base bg-transparent border-none focus:ring-0 outline-none resize-none min-h-[120px]"
                                placeholder="Añade una descripción detallada..."
                            />
                        </div>

                        {/* Comments Section */}
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <label className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase">
                                    <MessageSquare size={16} /> Comentarios ({comments.length})
                                </label>
                            </div>

                            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                                <div className="p-4 bg-slate-50 flex gap-3 border-b border-slate-100">
                                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                                        <User size={16} />
                                    </div>
                                    <div className="flex-1 relative">
                                        <input
                                            type="text"
                                            value={newComment}
                                            onChange={(e) => setNewComment(e.target.value)}
                                            placeholder="Escribe un comentario..."
                                            className="w-full bg-white border border-slate-200 rounded-lg pl-4 pr-12 py-2 text-sm focus:outline-none focus:border-indigo-500 transition-all border-solid"
                                            onKeyDown={(e) => e.key === 'Enter' && handleComment()}
                                        />
                                        <button 
                                            onClick={handleComment}
                                            className="absolute right-2 top-1.5 p-1 text-slate-400 hover:text-indigo-600 transition-colors"
                                        >
                                            <Send size={16} />
                                        </button>
                                    </div>
                                </div>
                                <div className="p-4 space-y-4 max-h-[300px] overflow-y-auto">
                                    {comments.length === 0 && (
                                        <div className="text-center py-6 text-slate-400 text-sm italic">
                                            No hay comentarios aún.
                                        </div>
                                    )}
                                    {comments.map((comment: Comment) => (
                                        <div key={comment.id} className="flex gap-4 group">
                                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0 mt-1 border border-slate-200 border-solid">
                                                <span className="text-xs font-bold text-slate-500">
                                                    {comment.user?.name ? comment.user.name[0] : 'U'}
                                                </span>
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-baseline gap-2 mb-1">
                                                    <span className="text-sm font-bold text-slate-700">{comment.user?.name || 'Usuario'}</span>
                                                    <span className="text-xs text-slate-400">{new Date(comment.createdAt).toLocaleDateString()}</span>
                                                </div>
                                                <div className="bg-slate-50 p-3 rounded-tr-xl rounded-br-xl rounded-bl-xl text-sm text-slate-600 border border-slate-100 border-solid">
                                                    {comment.content}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar (Right) */}
                    <div className="space-y-6">
                        {/* Status Card */}
                        <div className="bg-white p-5 rounded-xl border border-slate-200 border-solid shadow-sm space-y-4">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Estado & Fecha</h3>
                            
                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs text-slate-500 mb-1.5 block flex items-center gap-1 font-medium">
                                        <Flag size={12} /> Prioridad
                                    </label>
                                    <select
                                        value={priority}
                                        onChange={(e) => setPriority(e.target.value as 'LOW' | 'MEDIUM' | 'HIGH')}
                                        className="w-full bg-slate-50 border border-slate-200 border-solid text-slate-700 text-sm rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all appearance-none"
                                    >
                                        <option value="LOW">Baja</option>
                                        <option value="MEDIUM">Media</option>
                                        <option value="HIGH">Alta</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="text-xs text-slate-500 mb-1.5 block flex items-center gap-1 font-medium">
                                        <Calendar size={12} /> Fecha Límite
                                    </label>
                                    <input
                                        type="date"
                                        value={dueDate}
                                        onChange={(e) => setDueDate(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 border-solid text-slate-700 text-sm rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Deliverables Card */}
                        <div className="bg-white p-5 rounded-xl border border-slate-200 border-solid shadow-sm transition-shadow hover:shadow-md">
                            <div className="flex items-center gap-2 mb-3 text-indigo-600">
                                <Package size={16} />
                                <h3 className="text-sm font-bold">Entregable</h3>
                            </div>
                            <input
                                type="text"
                                value={deliverable}
                                onChange={(e) => setDeliverable(e.target.value)}
                                placeholder="¿Qué se debe entregar?"
                                className="w-full bg-slate-50 border border-slate-200 border-solid text-slate-700 text-sm rounded-lg px-3 py-2 mb-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                            <p className="text-[10px] text-slate-400 italic">Define el producto tangible de esta tarea.</p>
                        </div>

                        {/* Criteria Card */}
                        <div className="bg-white p-5 rounded-xl border border-slate-200 border-solid shadow-sm transition-shadow hover:shadow-md">
                            <div className="flex items-center gap-2 mb-3 text-teal-600">
                                <ClipboardCheck size={16} />
                                <h3 className="text-sm font-bold">Criterios de Éxito</h3>
                            </div>
                            <textarea
                                value={evaluationCriteria}
                                onChange={(e) => setEvaluationCriteria(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 border-solid text-slate-600 text-sm rounded-lg p-3 focus:ring-2 focus:ring-teal-500 outline-none resize-none h-24"
                                placeholder="- Debe cumplir..."
                            />
                        </div>

                        {/* Teacher Actions */}
                        <div className="space-y-3 pt-2">
                             <button
                                onClick={handleApprove}
                                className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all transform active:scale-95 border-solid ${isApproved
                                    ? 'bg-green-100 text-green-700 border border-green-200'
                                    : 'bg-white border-2 border-green-100 text-slate-600 hover:border-green-500 hover:text-green-600'
                                    }`}
                            >
                                <CheckCircle size={16} />
                                {isApproved ? 'Tarea Aprobada' : 'Aprobar Tarea'}
                            </button>

                            {!isApproved && (
                                <Link
                                    href={`/dashboard/mentorship?projectId=${projectId}&note=Ayuda en tarea: ${encodeURIComponent(task.title)}`}
                                    className="w-full flex items-center justify-center gap-2 py-3 border-2 border-amber-100 border-solid text-amber-700 rounded-xl text-sm font-bold hover:bg-amber-50 hover:border-amber-300 transition-all text-center no-underline"
                                >
                                    <HelpCircle size={16} />
                                    Solicitar Mentoría
                                </Link>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer (Sticky Bottom) */}
                <div className="p-6 border-t border-slate-100 border-solid bg-white flex justify-end gap-3 rounded-b-2xl sticky bottom-0 z-10">
                    <button 
                        onClick={onClose}
                        className="px-6 py-2.5 rounded-lg text-slate-500 font-medium hover:bg-slate-50 transition-colors border-none bg-transparent"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-8 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-bold shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 hover:-translate-y-0.5 transition-all border-none"
                    >
                        Guardar Cambios
                    </button>
                </div>

            </div>
        </div>
    );
}
