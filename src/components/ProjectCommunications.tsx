'use client';

import { useState, useEffect, useTransition } from 'react';
import {
    Send, User, Clock, Reply,
    Users, ChevronDown, ChevronUp,
    MessageSquare, AlertCircle
} from 'lucide-react';
import RichTextEditor from './RichTextEditor';
import {
    sendMessageAction,
    getProjectMessagesAction,
    getProjectParticipantsAction
} from '@/app/actions/communication-actions';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface Participant {
    id: string;
    name: string | null;
    email: string;
    role: string;
    avatarUrl: string | null;
}

interface Message {
    id: string;
    content: string;
    author: {
        id: string;
        name: string | null;
        avatarUrl: string | null;
        role: string;
    };
    recipients?: { id: string; name: string | null }[]; // Optional for replies
    createdAt: Date | string;
    parentId: string | null;
    replies?: Message[];
}

export default function ProjectCommunications({ projectId, currentUserId }: { projectId: string; currentUserId: string }) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [loading, setLoading] = useState(true);
    const [isPending, startTransition] = useTransition();

    // Form state
    const [content, setContent] = useState('');
    const [selectedRecipientIds, setSelectedRecipientIds] = useState<string[]>([]);
    const [replyTo, setReplyTo] = useState<Message | null>(null);

    const loadData = async () => {
        setLoading(true);
        const [msgRes, partRes] = await Promise.all([
            getProjectMessagesAction(projectId),
            getProjectParticipantsAction(projectId)
        ]);

        if (msgRes.success) setMessages(msgRes.messages || []);
        if (partRes.success) setParticipants(partRes.participants || []);
        setLoading(false);
    };

    useEffect(() => {
        loadData(); // eslint-disable-line react-hooks/set-state-in-effect
    }, [projectId]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleSend = () => {
        if (!content.trim() || selectedRecipientIds.length === 0) return;

        startTransition(async () => {
            const res = await sendMessageAction({
                projectId,
                content,
                recipientIds: selectedRecipientIds,
                parentId: replyTo?.id
            });

            if (res.success) {
                setContent('');
                setSelectedRecipientIds([]);
                setReplyTo(null);
                loadData();
            } else {
                alert(res.error || 'Error al enviar mensaje');
            }
        });
    };

    const toggleRecipient = (id: string) => {
        setSelectedRecipientIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-20">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            {/* New Message / Reply Area */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                        {replyTo ? <Reply className="w-4 h-4 text-blue-600" /> : <MessageSquare className="w-4 h-4 text-blue-600" />}
                        {replyTo ? `Respondiendo a ${replyTo.author.name}` : 'Nuevo Mensaje'}
                    </h3>
                    {replyTo && (
                        <button
                            onClick={() => { setReplyTo(null); setSelectedRecipientIds([]); }}
                            className="text-xs font-bold text-red-600 hover:underline"
                        >
                            Cancelar Respuesta
                        </button>
                    )}
                </div>

                <div className="p-6 space-y-4">
                    {/* Recipient Selector */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <Users className="w-3.5 h-3.5" /> Enviar a:
                        </label>
                        <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-1">
                            {participants.filter(p => p.id !== currentUserId).map(p => (
                                <button
                                    key={p.id}
                                    onClick={() => toggleRecipient(p.id)}
                                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-2 border
                                        ${selectedRecipientIds.includes(p.id)
                                            ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                                            : 'bg-white border-slate-200 text-slate-600 hover:border-blue-300'
                                        }
                                    `}
                                >
                                    <div className="w-4 h-4 rounded-full bg-slate-200 overflow-hidden flex-shrink-0">
                                        {p.avatarUrl ? <img src={p.avatarUrl} alt="" className="w-full h-full object-cover" /> : <User className="w-3 h-3 m-0.5 text-slate-400" />}
                                    </div>
                                    {p.name || p.email}
                                    <span className="opacity-50 text-[10px]">({p.role})</span>
                                </button>
                            ))}
                        </div>
                        {selectedRecipientIds.length === 0 && (
                            <p className="text-[10px] text-orange-600 font-medium flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" /> Selecciona al menos un destinatario
                            </p>
                        )}
                    </div>

                    <RichTextEditor
                        content={content}
                        onChange={setContent}
                        placeholder="Escribe tu mensaje... Los destinatarios recibirán una notificación por correo."
                    />

                    <div className="flex justify-end">
                        <button
                            onClick={handleSend}
                            disabled={isPending || !content.trim() || selectedRecipientIds.length === 0}
                            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2 shadow-lg shadow-blue-200"
                        >
                            {isPending ? 'Enviando...' : <><Send className="w-4 h-4" /> Enviar mensaje</>}
                        </button>
                    </div>
                </div>
            </div>

            {/* Message List */}
            <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-500 flex items-center gap-2 px-2">
                    <Clock className="w-4 h-4" /> Historial de Comunicaciones
                </h3>

                {messages.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-12 text-center text-slate-400">
                        <MessageSquare className="w-8 h-8 mx-auto mb-3 opacity-20" />
                        <p className="italic">No hay mensajes en este proyecto todavía.</p>
                    </div>
                ) : (
                    messages.filter(m => !m.parentId).map(message => (
                        <div key={message.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden group">
                            <div className="p-5 flex gap-4">
                                <div className="w-10 h-10 rounded-full bg-slate-100 flex-shrink-0 flex items-center justify-center border border-slate-200 overflow-hidden">
                                    {message.author.avatarUrl ? (
                                        <img src={message.author.avatarUrl} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <User className="w-5 h-5 text-slate-400" />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start mb-1">
                                        <div>
                                            <span className="font-bold text-slate-900 mr-2">{message.author.name}</span>
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${message.author.role === 'TEACHER' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-600'}`}>
                                                {message.author.role}
                                            </span>
                                        </div>
                                        <span className="text-[10px] text-slate-400 font-medium">
                                            {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true, locale: es })}
                                        </span>
                                    </div>
                                    <div className="text-[11px] text-slate-400 mb-3 flex items-center gap-1">
                                        <Send className="w-3 h-3" /> Para: {message.recipients?.map(r => r.name).join(', ')}
                                    </div>
                                    <div
                                        className="prose prose-sm prose-slate max-w-none text-slate-700 line-clamp-4 group-hover:line-clamp-none transition-all"
                                        dangerouslySetInnerHTML={{ __html: message.content }}
                                    />

                                    <div className="mt-4 flex items-center gap-4">
                                        <button
                                            onClick={() => {
                                                setReplyTo(message);
                                                setSelectedRecipientIds([message.author.id]);
                                                window.scrollTo({ top: 0, behavior: 'smooth' });
                                            }}
                                            className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1.5"
                                        >
                                            <Reply className="w-3.5 h-3.5" /> Responder
                                        </button>

                                        {message.replies && message.replies.length > 0 && (
                                            <span className="text-[11px] font-bold text-slate-400">
                                                {message.replies.length} {message.replies.length === 1 ? 'respuesta' : 'respuestas'}
                                            </span>
                                        )}
                                    </div>

                                    {/* Nested Replies */}
                                    {message.replies && message.replies.length > 0 && (
                                        <div className="mt-4 pl-4 border-l-2 border-slate-100 space-y-4">
                                            {message.replies.map(reply => (
                                                <div key={reply.id} className="pt-2">
                                                    <div className="flex gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-slate-50 flex-shrink-0 flex items-center justify-center border border-slate-100 overflow-hidden">
                                                            {reply.author.avatarUrl ? (
                                                                <img src={reply.author.avatarUrl} alt="" className="w-full h-full object-cover" />
                                                            ) : (
                                                                <User className="w-4 h-4 text-slate-400" />
                                                            )}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex justify-between items-center mb-1">
                                                                <span className="text-xs font-bold text-slate-800">{reply.author.name}</span>
                                                                <span className="text-[10px] text-slate-400">
                                                                    {formatDistanceToNow(new Date(reply.createdAt), { addSuffix: true, locale: es })}
                                                                </span>
                                                            </div>
                                                            <div
                                                                className="text-sm text-slate-600"
                                                                dangerouslySetInnerHTML={{ __html: reply.content }}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
