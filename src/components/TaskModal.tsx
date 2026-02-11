'use client';

import { useState } from 'react';
import {
    X, CheckCircle2, FileText, Clock,
    AlertCircle, ExternalLink, Send, MessageSquare,
    ChevronRight, BookOpen, Trash2, Edit3, Save, HelpCircle, Package, ClipboardCheck, User, List, Plus, Trash, CheckSquare, AlignLeft, Play, Check
} from 'lucide-react';
import { useModals } from './ModalProvider';
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
    type?: 'TASK' | 'QUIZ';
    quizData?: {
        questions: Question[];
        gradingMethod?: 'AUTO' | 'MANUAL';
        autoPoints?: boolean;
    };
}

type QuestionType = 'MULTIPLE_CHOICE' | 'TEXT' | 'RATING';

interface Question {
    id: string;
    type: QuestionType;
    prompt: string;
    options?: string[];
    correctAnswer?: string;
    points?: number;
}

interface TaskModalProps {
    task: Task;
    projectId?: string;
    userRole: string;
    isOpen: boolean;
    onClose: () => void;
    /* eslint-disable @typescript-eslint/no-explicit-any */
    onUpdate: (updatedTask?: any) => void;
    currentUserId?: string;
    sessionRole?: string;
}

export function TaskModal({ task, isOpen, onClose, onUpdate, currentUserId, projectId, sessionRole, userRole }: TaskModalProps) {
    const { showAlert, showConfirm } = useModals();
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

    // Quiz State
    const [questions, setQuestions] = useState<Question[]>(task.quizData?.questions || []);
    const [gradingMethod, setGradingMethod] = useState<'AUTO' | 'MANUAL'>(task.quizData?.gradingMethod || 'AUTO');
    const [autoPoints, setAutoPoints] = useState<boolean>(task.quizData?.autoPoints || false); // Default to manual point entry for flexibility

    const [isTakingQuiz, setIsTakingQuiz] = useState(false);
    const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({});
    const [quizSubmitted, setQuizSubmitted] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false); // Added for submission state

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
                evaluationCriteria: rubric.map(r => `- ${r.criterion} (${r.maxPoints} pts)`).join('\n'),
                quizData: {
                    questions,
                    gradingMethod,
                    autoPoints
                }
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

    // Quiz Handlers
    const distributePoints = (currentQuestions: Question[]) => {
        if (currentQuestions.length === 0) return currentQuestions;
        const totalPoints = 100;
        const pointsPerQuestion = Math.floor(totalPoints / currentQuestions.length);
        const remainder = totalPoints % currentQuestions.length;

        return currentQuestions.map((q, i) => ({
            ...q,
            points: pointsPerQuestion + (i < remainder ? 1 : 0) // Distribute remainder to first few questions
        }));
    };

    const handleAutoPointsToggle = (enabled: boolean) => {
        setAutoPoints(enabled);
        if (enabled) {
            setQuestions(distributePoints(questions));
        }
    };

    const addQuestion = (type: QuestionType) => {
        const newQ: Question = {
            id: crypto.randomUUID(),
            type,
            prompt: '',
            options: type === 'MULTIPLE_CHOICE' ? ['Opción 1', 'Opción 2'] : undefined,
            points: 1,
            correctAnswer: ''
        };
        setQuestions([...questions, newQ]);
    };

    const updateQuestion = (id: string, field: keyof Question, value: any) => {
        setQuestions(questions.map(q => q.id === id ? { ...q, [field]: value } : q));
    };

    const updateOption = (qId: string, optIndex: number, value: string) => {
        setQuestions(questions.map(q => {
            if (q.id !== qId) return q;
            const newOpts = [...(q.options || [])];
            newOpts[optIndex] = value;
            return { ...q, options: newOpts };
        }));
    };

    const addOption = (qId: string) => {
        setQuestions(questions.map(q => {
            if (q.id !== qId) return q;
            return { ...q, options: [...(q.options || []), `Opción ${(q.options?.length || 0) + 1}`] };
        }));
    };

    const removeOption = (qId: string, optIndex: number) => {
        setQuestions(questions.map(q => {
            if (q.id !== qId) return q;
            const newOpts = [...(q.options || [])];
            newOpts.splice(optIndex, 1);
            return { ...q, options: newOpts };
        }));
    };

    const removeQuestion = (id: string) => {
        setQuestions(questions.filter(q => q.id !== id));
    };

    const submitQuiz = async () => {
        const confirm = await showConfirm(
            "¿Enviar respuestas?",
            "No podrás modificarlas una vez enviadas.",
            "warning"
        );
        if (!confirm) return;
        setIsSubmitting(true);
        try {
            // Should create submission
            const res = await fetch('/api/submissions', { // NOTE: Need to ensure this endpoint handles JSON answers
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    assignmentId: task.assignment?.id, // Assuming assignment exists
                    answers: quizAnswers,
                    type: 'QUIZ'
                })
            });
            const result = await res.json(); // Assuming the response has a success property
            if (result.success) {
                await showAlert("Éxito", "Evaluación enviada correctamente", "success");
                onUpdate();
                onClose();
            } else {
                await showAlert("Error", "Error al enviar evaluación", "error");
            }
        } catch (e) {
            console.error(e);
            await showAlert("Error", "Error de conexión", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isTakingQuiz) {
        return (
            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-white p-4 font-[Inter]">
                <div className="w-full max-w-2xl h-full max-h-[90vh] flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-slate-800">{task.title}</h2>
                        <button onClick={() => setIsTakingQuiz(false)} className="text-slate-400 hover:text-slate-600">
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-8 pr-2">
                        {questions.map((q, i) => (
                            <div key={q.id} className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                                <h3 className="font-bold text-slate-700 mb-4 flex gap-2">
                                    <span className="bg-blue-100 text-blue-700 px-2 rounded-md text-sm flex items-center justify-center h-6 w-6">{i + 1}</span>
                                    {q.prompt}
                                </h3>

                                {q.type === 'TEXT' && (
                                    <textarea
                                        className="w-full border border-slate-300 rounded-lg p-3 h-32 focus:ring-2 focus:ring-blue-500 outline-none"
                                        placeholder="Escribe tu respuesta aquí..."
                                        value={quizAnswers[q.id] || ''}
                                        onChange={(e) => setQuizAnswers({ ...quizAnswers, [q.id]: e.target.value })}
                                    />
                                )}

                                {q.type === 'MULTIPLE_CHOICE' && (
                                    <div className="space-y-2">
                                        {q.options?.map((opt, idx) => (
                                            <label key={idx} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${quizAnswers[q.id] === opt ? 'bg-blue-50 border-blue-500 shadow-sm' : 'bg-white border-slate-200 hover:border-blue-300'}`}>
                                                <input
                                                    type="radio"
                                                    name={`q-${q.id}`}
                                                    value={opt}
                                                    checked={quizAnswers[q.id] === opt}
                                                    onChange={() => setQuizAnswers({ ...quizAnswers, [q.id]: opt })}
                                                    className="w-4 h-4 text-blue-600"
                                                />
                                                <span className="text-slate-700">{opt}</span>
                                            </label>
                                        ))}
                                    </div>
                                )}

                                {q.type === 'RATING' && (
                                    <div className="flex justify-between px-4">
                                        {[1, 2, 3, 4, 5].map((val) => (
                                            <button
                                                key={val}
                                                onClick={() => setQuizAnswers({ ...quizAnswers, [q.id]: val.toString() })}
                                                className={`w-12 h-12 rounded-full font-bold text-lg transition-all ${quizAnswers[q.id] === val.toString() ? 'bg-blue-600 text-white shadow-lg scale-110' : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                                            >
                                                {val}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="mt-6 pt-6 border-t border-slate-100">
                        <button
                            onClick={submitQuiz}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
                        >
                            <Send className="w-5 h-5" /> Enviar Respuestas
                        </button>
                    </div>
                </div>
            </div>
        );
    }

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
                        {/* Rubric / Criteria OR Quiz Builder */}
                        {task.type === 'QUIZ' ? (
                            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                                <div className="flex items-center justify-between mb-6">
                                    <label className="text-xs font-bold text-slate-400 uppercase flex items-center gap-2">
                                        <span className="p-1 bg-purple-100 text-purple-600 rounded">
                                            <List className="w-3" size={14} />
                                        </span>
                                        Preguntas del Cuestionario
                                    </label>

                                    {canEditStructural && (
                                        <div className="flex gap-2">
                                            <button onClick={() => addQuestion('MULTIPLE_CHOICE')} className="text-xs font-bold px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1">+ Opción Múltiple</button>
                                            <button onClick={() => addQuestion('TEXT')} className="text-xs font-bold px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1">+ Texto</button>
                                            <button onClick={() => addQuestion('RATING')} className="text-xs font-bold px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1">+ Calificación</button>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-6">
                                    {/* Grading Configuration Panel */}
                                    {canEditStructural && (
                                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                                            <div className="flex flex-col sm:flex-row gap-6 justify-between items-start sm:items-center">
                                                <div>
                                                    <label className="text-xs font-bold text-slate-500 uppercase block mb-2">Método de Calificación</label>
                                                    <div className="flex bg-white rounded-lg p-1 border border-slate-200 shadow-sm inline-flex">
                                                        <button
                                                            onClick={() => setGradingMethod('AUTO')}
                                                            className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${gradingMethod === 'AUTO' ? 'bg-blue-50 text-blue-600 shadow-sm ring-1 ring-blue-100' : 'text-slate-400 hover:text-slate-600'}`}
                                                        >
                                                            Automático
                                                        </button>
                                                        <button
                                                            onClick={() => setGradingMethod('MANUAL')}
                                                            className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${gradingMethod === 'MANUAL' ? 'bg-blue-50 text-blue-600 shadow-sm ring-1 ring-blue-100' : 'text-slate-400 hover:text-slate-600'}`}
                                                        >
                                                            Manual
                                                        </button>
                                                    </div>
                                                </div>

                                                {gradingMethod === 'AUTO' && (
                                                    <div className="flex items-center gap-3 bg-white px-3 py-2 rounded-lg border border-slate-200 shadow-sm">
                                                        <div className="flex items-center gap-2">
                                                            <input
                                                                type="checkbox"
                                                                id="autoPoints"
                                                                checked={autoPoints}
                                                                onChange={(e) => handleAutoPointsToggle(e.target.checked)}
                                                                className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                                                            />
                                                            <label htmlFor="autoPoints" className="text-sm text-slate-700 font-medium cursor-pointer select-none">
                                                                Ponderar automáticamente
                                                            </label>
                                                        </div>
                                                        <div className="h-6 w-px bg-slate-200 mx-1"></div>
                                                        <div className="text-sm font-bold text-slate-600">
                                                            Total: <span className={`${questions.reduce((sum, q) => sum + (q.points || 0), 0) === 100 ? 'text-green-600' : 'text-amber-500'}`}>
                                                                {questions.reduce((sum, q) => sum + (q.points || 0), 0)} pts
                                                            </span>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {gradingMethod === 'MANUAL' && (
                                                <p className="text-xs text-slate-400 mt-2 italic">
                                                    En el modo manual, el profesor asignará una calificación global (0-100) después de revisar las respuestas.
                                                </p>
                                            )}
                                        </div>
                                    )}

                                    {questions.length === 0 && (
                                        <div className="text-center py-8 border-2 border-dashed border-slate-100 rounded-xl">
                                            <p className="text-slate-400 font-medium">No hay preguntas agregadas.</p>
                                        </div>
                                    )}

                                    {questions.map((q, i) => (
                                        <div key={q.id} className="relative group bg-slate-50/50 p-4 rounded-xl border border-slate-200 hover:border-purple-200 transition-colors">
                                            <div className="flex gap-3 mb-3 items-start">
                                                <span className="font-mono text-slate-400 font-bold mt-2">Q{i + 1}</span>
                                                <div className="flex-1 space-y-2">
                                                    <input
                                                        type="text"
                                                        value={q.prompt}
                                                        onChange={(e) => updateQuestion(q.id, 'prompt', e.target.value)}
                                                        className="w-full bg-transparent font-bold text-slate-700 placeholder:text-slate-400 outline-none border-b border-transparent hover:border-slate-300 focus:border-purple-500 transition-colors"
                                                        placeholder="Escribe la pregunta..."
                                                        disabled={!canEditStructural}
                                                    />

                                                    {canEditStructural && (
                                                        <div className="flex gap-4 items-center">
                                                            {gradingMethod === 'AUTO' && (
                                                                <div className={`flex items-center gap-2 px-2 py-1 rounded-lg ${autoPoints ? 'bg-slate-50 opacity-70' : 'bg-slate-100'}`}>
                                                                    <span className="text-xs font-bold text-slate-500">Puntos:</span>
                                                                    <input
                                                                        type="number"
                                                                        min="0"
                                                                        className="w-12 bg-transparent text-sm font-bold text-slate-700 outline-none text-center disabled:cursor-not-allowed"
                                                                        value={q.points || 0}
                                                                        onChange={(e) => updateQuestion(q.id, 'points', parseInt(e.target.value) || 0)}
                                                                        disabled={autoPoints}
                                                                        title={autoPoints ? "Ponderación automática activada" : "Asignar puntos manualmente"}
                                                                    />
                                                                </div>
                                                            )}
                                                            {q.type === 'TEXT' && (
                                                                <input
                                                                    type="text"
                                                                    className="flex-1 bg-slate-100 text-xs px-2 py-1 rounded-lg outline-none placeholder:text-slate-400 border border-transparent focus:border-purple-300"
                                                                    placeholder="Respuesta correcta (opcional)"
                                                                    value={q.correctAnswer || ''}
                                                                    onChange={(e) => updateQuestion(q.id, 'correctAnswer', e.target.value)}
                                                                />
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                                {canEditStructural && (
                                                    <button onClick={() => removeQuestion(q.id)} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                                                        <Trash className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>

                                            {/* Question Body */}
                                            <div className="pl-8">
                                                {q.type === 'TEXT' && (
                                                    <div className="h-12 bg-white border border-slate-200 rounded-lg w-full flex items-center px-3 text-slate-400 text-sm italic">
                                                        [Campo de texto libre para el estudiante]
                                                    </div>
                                                )}
                                                {q.type === 'RATING' && (
                                                    <div className="flex gap-2">
                                                        {[1, 2, 3, 4, 5].map(v => <div key={v} className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-400">{v}</div>)}
                                                    </div>
                                                )}
                                                {q.type === 'MULTIPLE_CHOICE' && (
                                                    <div className="space-y-2">
                                                        {q.options?.map((opt, idx) => (
                                                            <div key={idx} className={`flex items-center gap-2 p-1 rounded-lg ${q.correctAnswer === opt ? 'bg-green-50 border border-green-200' : ''}`}>
                                                                {canEditStructural && (
                                                                    <div
                                                                        onClick={() => updateQuestion(q.id, 'correctAnswer', opt)}
                                                                        className={`w-4 h-4 rounded-full border cursor-pointer flex items-center justify-center ${q.correctAnswer === opt ? 'border-green-500 bg-green-500' : 'border-slate-300 bg-white hover:border-green-400'}`}
                                                                        title="Marcar como respuesta correcta"
                                                                    >
                                                                        {q.correctAnswer === opt && <Check size={10} className="text-white" />}
                                                                    </div>
                                                                )}
                                                                <input
                                                                    type="text"
                                                                    value={opt}
                                                                    onChange={(e) => {
                                                                        updateOption(q.id, idx, e.target.value);
                                                                        // If this was the correct answer, update it too
                                                                        if (q.correctAnswer === opt) {
                                                                            updateQuestion(q.id, 'correctAnswer', e.target.value);
                                                                        }
                                                                    }}
                                                                    className="flex-1 bg-transparent text-sm text-slate-600 outline-none border-b border-transparent hover:border-slate-300 focus:border-blue-400"
                                                                    disabled={!canEditStructural}
                                                                />
                                                                {canEditStructural && (
                                                                    <button onClick={() => removeOption(q.id, idx)} className="text-slate-300 hover:text-red-400"><X className="w-3 h-3" /></button>
                                                                )}
                                                            </div>
                                                        ))}
                                                        {canEditStructural && (
                                                            <button onClick={() => addOption(q.id)} className="text-xs text-blue-600 hover:underline pl-6">+ Agregar Opción</button>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
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
                        )}

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

                        {/* Deliverables Card (Hide for Quizzes) */}
                        {task.type !== 'QUIZ' && (
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
                        )}

                        {/* Actions (Hide Mentorship for Quizzes) */}
                        {task.type !== 'QUIZ' && (
                            <div className="space-y-3 pt-2">
                                <Link
                                    href={`/dashboard/mentorship?projectId=${projectId}&note=Ayuda en tarea: ${encodeURIComponent(task.title)}`}
                                    className="w-full flex items-center justify-center gap-2 py-3 border-2 border-amber-100 text-amber-700 rounded-xl text-sm font-bold hover:bg-amber-50 hover:border-amber-300 transition-all text-center no-underline"
                                >
                                    <HelpCircle size={16} />
                                    Solicitar Mentoría
                                </Link>
                            </div>
                        )}

                        {isStudent && task.assignment?.id && (
                            task.type === 'QUIZ' ? (
                                <div className="p-4 bg-purple-50 rounded-xl border border-purple-100">
                                    <p className="text-xs text-purple-600 mb-3 font-medium">Esta tarea es un cuestionario activo.</p>
                                    <button
                                        onClick={() => setIsTakingQuiz(true)}
                                        className="w-full flex items-center justify-center gap-2 py-2.5 bg-purple-600 text-white rounded-lg font-bold hover:bg-purple-700 transition-all text-sm shadow-md shadow-purple-200"
                                    >
                                        <Play className="w-4 h-4" /> {task.status === 'TODO' ? 'Iniciar Cuestionario' : 'Continuar Cuestionario'}
                                    </button>
                                </div>
                            ) : (
                                <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                                    <p className="text-xs text-indigo-600 mb-3 font-medium">Esta tarea requiere una entrega formal.</p>
                                    <Link
                                        href={`/dashboard/assignments?selectedId=${task.assignment.id}`}
                                        className="w-full flex items-center justify-center gap-2 py-2.5 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition-all text-sm shadow-md shadow-indigo-200"
                                    >
                                        <Send className="w-4 h-4" /> Realizar Entrega
                                    </Link>
                                </div>
                            )
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
