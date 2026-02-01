'use client';

import { useState } from 'react';
import { X, MessageSquare, HelpCircle, Package, ClipboardCheck, Send, User } from 'lucide-react';
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
    isMandatory: boolean;
    maxDate: string | null;
    allowedFileTypes: string[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rubric: any;
    assignment?: { id: string } | null;
    comments: Comment[];
    tags: { id: string; name: string; color: string }[];
}

interface TaskModalProps {
    task: Task;
    projectId?: string;
    userRole: string;
    isOpen: boolean;
    onClose: () => void;
    /* eslint-disable @typescript-eslint/no-explicit-any */
    onUpdate: (updatedTask: any) => void;
}

export function TaskModal({ task, projectId, userRole, isOpen, onClose, onUpdate }: TaskModalProps) {
    const [title, setTitle] = useState(task.title);
    const [description, setDescription] = useState(task.description || '');
    const [priority, setPriority] = useState(task.priority);
    const [dueDate, setDueDate] = useState(task.dueDate ? task.dueDate.split('T')[0] : '');
    const [maxDate, setMaxDate] = useState(task.maxDate ? task.maxDate.split('T')[0] : '');

    const [deliverable, setDeliverable] = useState(task.deliverable || '');
    const [allowedFileTypes, setAllowedFileTypes] = useState<string[]>(task.allowedFileTypes || []);

    // Evaluation Criteria (Rubric)
    const [rubric, setRubric] = useState<{ criterion: string; maxPoints: number }[]>(Array.isArray(task.rubric) ? task.rubric : []);

    const [newComment, setNewComment] = useState('');
    const [comments, setComments] = useState<Comment[]>(task.comments || []);

    const isStudent = userRole === 'STUDENT';
    const isMandatory = task.isMandatory;
    const canEditStructural = !isStudent || !isMandatory;

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
                maxDate: maxDate || null,
                deliverable,
                allowedFileTypes,
                rubric,
                // Legacy field for backward compatibility, mapped from rubric
                evaluationCriteria: rubric.map(r => `- ${r.criterion} (${r.maxPoints} pts)`).join('\n')
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

    const toggleFileType = (type: string) => {
        if (allowedFileTypes.includes(type)) {
            setAllowedFileTypes(allowedFileTypes.filter(t => t !== type));
        } else {
            setAllowedFileTypes([...allowedFileTypes, type]);
        }
    };

    const addRubricItem = () => {
        setRubric([...rubric, { criterion: '', maxPoints: 10 }]);
    };

    const updateRubricItem = (index: number, field: 'criterion' | 'maxPoints', value: string | number) => {
        const newRubric = [...rubric];
        newRubric[index] = { ...newRubric[index], [field]: value };
        setRubric(newRubric);
    };

    const removeRubricItem = (index: number) => {
        setRubric(rubric.filter((_, i) => i !== index));
    };

    return (
        <div
            onClick={onClose}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 transition-all duration-300 font-[Inter]"
        >
            <div
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[95vh] overflow-hidden flex flex-col"
            >

                {/* Header */}
                <div className="flex justify-between items-center px-8 py-5 border-b border-gray-100 bg-white sticky top-0 z-10">
                    <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide 
                            ${priority === 'HIGH' ? 'bg-red-100 text-red-700' :
                                priority === 'MEDIUM' ? 'bg-amber-100 text-amber-700' :
                                    'bg-green-100 text-green-700'}`}>
                            {priority === 'HIGH' ? 'Alta Prioridad' : priority === 'MEDIUM' ? 'Media Prioridad' : 'Baja Prioridad'}
                        </span>
                        <span className="text-slate-400 text-sm font-medium">ID: {task.id.slice(0, 8)}</span>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-full transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 bg-slate-50/50">

                    {/* Main Content (Left, 8 cols) */}
                    <div className="lg:col-span-8 space-y-8">

                        {/* Title */}
                        <div>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                disabled={!canEditStructural}
                                className="text-3xl font-bold text-slate-800 bg-transparent border-none focus:ring-0 p-0 w-full placeholder:text-slate-300 leading-tight disabled:opacity-100"
                                placeholder="Título de la Tarea"
                            />
                        </div>

                        {/* Description */}
                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                            <label className="text-xs font-bold text-slate-400 uppercase mb-4 flex items-center gap-2">
                                <span className="p-1 bg-blue-100 text-blue-600 rounded">
                                    <MessageSquare className="w-3" size={14} />
                                </span>
                                Descripción
                            </label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                disabled={!canEditStructural}
                                className="w-full text-slate-600 text-base bg-transparent border-none focus:ring-0 outline-none resize-none min-h-[120px] disabled:opacity-100"
                                placeholder="Describe el objetivo y contexto de la tarea..."
                            />
                        </div>

                        {/* Rubric / Criteria */}
                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <label className="text-xs font-bold text-slate-400 uppercase flex items-center gap-2">
                                    <span className="p-1 bg-teal-100 text-teal-600 rounded">
                                        <ClipboardCheck className="w-3" size={14} />
                                    </span>
                                    Criterios de Éxito & Rúbrica
                                </label>
                                {canEditStructural && (
                                    <button
                                        onClick={addRubricItem}
                                        className="text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors"
                                    >
                                        + Agregar Criterio
                                    </button>
                                )}
                            </div>

                            <div className="space-y-3">
                                {rubric.length === 0 && (
                                    <div className="text-sm text-slate-400 italic text-center py-4 border border-dashed border-slate-200 rounded-lg">
                                        No hay criterios definidos. Agrega uno para establecer cómo se evaluará esta tarea.
                                    </div>
                                )}
                                {rubric.map((item, index) => (
                                    <div key={index} className="flex gap-3 items-start group">
                                        <div className="flex-1">
                                            <input
                                                type="text"
                                                value={item.criterion}
                                                onChange={(e) => updateRubricItem(index, 'criterion', e.target.value)}
                                                disabled={!canEditStructural}
                                                placeholder="Descripción del criterio (ej: Claridad en la redacción)"
                                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none disabled:opacity-80"
                                            />
                                        </div>
                                        <div className="w-20">
                                            <input
                                                type="number"
                                                value={item.maxPoints}
                                                onChange={(e) => updateRubricItem(index, 'maxPoints', parseInt(e.target.value) || 0)}
                                                disabled={!canEditStructural}
                                                placeholder="Pts"
                                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-center disabled:opacity-80"
                                            />
                                        </div>
                                        {canEditStructural && (
                                            <button
                                                onClick={() => removeRubricItem(index)}
                                                className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                                            >
                                                <X size={16} />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Comments */}
                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                            <label className="text-xs font-bold text-slate-400 uppercase mb-4 flex items-center gap-2">
                                <span className="p-1 bg-indigo-100 text-indigo-600 rounded">
                                    <User className="w-3" size={14} />
                                </span>
                                Comentarios ({comments.length})
                            </label>

                            <div className="flex gap-3 mb-6">
                                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                                    <User size={16} />
                                </div>
                                <div className="flex-1 relative">
                                    <input
                                        type="text"
                                        value={newComment}
                                        onChange={(e) => setNewComment(e.target.value)}
                                        placeholder="Escribe un comentario..."
                                        className="w-full bg-white border border-slate-200 rounded-lg pl-4 pr-12 py-2 text-sm focus:outline-none focus:border-indigo-500 transition-all shadow-sm"
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

                            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                                {comments.length === 0 && (
                                    <div className="text-center py-4 text-slate-400 text-sm italic">
                                        No hay comentarios aún.
                                    </div>
                                )}
                                {comments.map((comment: Comment) => (
                                    <div key={comment.id} className="flex gap-4">
                                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200">
                                            <span className="text-xs font-bold text-slate-500">
                                                {comment.user?.name ? comment.user.name[0] : 'U'}
                                            </span>
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-baseline gap-2 mb-1">
                                                <span className="text-sm font-bold text-slate-700">{comment.user?.name || 'Usuario'}</span>
                                                <span className="text-xs text-slate-400">{new Date(comment.createdAt).toLocaleDateString()}</span>
                                            </div>
                                            <div className="bg-slate-50 p-3 rounded-tr-xl rounded-br-xl rounded-bl-xl text-sm text-slate-600 border border-slate-100">
                                                {comment.content}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                    </div>

                    {/* Sidebar (Right, 4 cols) */}
                    <div className="lg:col-span-4 space-y-6">

                        {/* Status Card */}
                        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Configuración</h3>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs text-slate-500 mb-1.5 block font-medium">Prioridad</label>
                                    <select
                                        value={priority}
                                        onChange={(e) => setPriority(e.target.value as 'LOW' | 'MEDIUM' | 'HIGH')}
                                        disabled={!canEditStructural}
                                        className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                                    >
                                        <option value="LOW">Baja</option>
                                        <option value="MEDIUM">Media</option>
                                        <option value="HIGH">Alta</option>
                                    </select>
                                </div>

                                <div className="grid grid-cols-1 gap-3">
                                    <div>
                                        <label className="text-xs text-slate-500 mb-1.5 block font-medium">Fecha de Entrega</label>
                                        <input
                                            type="date"
                                            value={dueDate}
                                            onChange={(e) => setDueDate(e.target.value)}
                                            disabled={!canEditStructural}
                                            className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-slate-500 mb-1.5 block font-medium">Fecha Máxima</label>
                                        <input
                                            type="date"
                                            value={maxDate}
                                            onChange={(e) => setMaxDate(e.target.value)}
                                            disabled={!canEditStructural}
                                            className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Deliverables Card */}
                        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                            <div className="flex items-center gap-2 mb-3 text-indigo-600">
                                <Package size={16} />
                                <h3 className="text-sm font-bold">Entregable</h3>
                            </div>

                            <div className="space-y-3">
                                <input
                                    type="text"
                                    value={deliverable}
                                    onChange={(e) => setDeliverable(e.target.value)}
                                    disabled={!canEditStructural}
                                    placeholder="Nombre del entregable..."
                                    className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                                />

                                <div>
                                    <label className="text-xs text-slate-500 mb-2 block font-medium">Formatos permitidos:</label>
                                    <div className="flex flex-wrap gap-2">
                                        {['URL', 'PDF', 'PPTX', 'XLS', 'DOC'].map((type) => (
                                            <button
                                                key={type}
                                                onClick={() => canEditStructural && toggleFileType(type)}
                                                disabled={!canEditStructural}
                                                className={`px-2.5 py-1 text-xs font-bold rounded-md border transition-all ${allowedFileTypes.includes(type)
                                                    ? 'bg-indigo-100 text-indigo-700 border-indigo-200'
                                                    : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300'
                                                    }`}
                                            >
                                                {type}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="space-y-3 pt-2">
                            <Link
                                href={`/dashboard/mentorship?projectId=${projectId}&note=Ayuda en tarea: ${encodeURIComponent(task.title)}`}
                                className="w-full flex items-center justify-center gap-2 py-3 border-2 border-amber-100 text-amber-700 rounded-xl text-sm font-bold hover:bg-amber-50 hover:border-amber-300 transition-all text-center no-underline"
                            >
                                <HelpCircle size={16} />
                                Solicitar Mentoría
                            </Link>
                        </div>

                        {isStudent && task.assignment?.id && (
                            <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                                <p className="text-xs text-indigo-600 mb-3 font-medium">Esta tarea requiere una entrega formal.</p>
                                <Link
                                    href={`/dashboard/assignments?selectedId=${task.assignment.id}`}
                                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition-all text-sm shadow-md shadow-indigo-200"
                                >
                                    <Send className="w-4 h-4" /> Realizar Entrega
                                </Link>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-100 bg-white flex items-center justify-end gap-3 rounded-b-2xl sticky bottom-0 z-10">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 rounded-lg text-slate-500 font-medium hover:bg-slate-50 transition-colors border-none bg-transparent"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={!canEditStructural}
                        className="px-8 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-bold shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 hover:-translate-y-0.5 transition-all border-none disabled:opacity-40"
                    >
                        Guardar Cambios
                    </button>
                </div>

            </div>
        </div>
    );
}
