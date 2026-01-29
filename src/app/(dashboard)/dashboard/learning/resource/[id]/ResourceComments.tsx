'use client';

import { useState, useTransition, useRef } from 'react';
import { addResourceCommentAction, deleteResourceCommentAction } from '@/app/actions/resource-interactions';
import { Loader2, MessageSquare, Send, Trash2, User } from 'lucide-react';
import { useRouter } from 'next/navigation';

type Comment = {
    id: string;
    content: string;
    createdAt: string;
    author: {
        id: string;
        name: string | null;
        avatarUrl: string | null;
        role: string;
    };
};

export function ResourceComments({
    resourceId,
    initialComments,
    currentUserId
}: {
    resourceId: string;
    initialComments: Comment[];
    currentUserId: string;
}) {
    const [comments, setComments] = useState<Comment[]>(initialComments);
    const [content, setContent] = useState('');
    const [isPending, startTransition] = useTransition();
    const router = useRouter();
    const scrollRef = useRef<HTMLDivElement>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim()) return;

        const optimisticId = Math.random().toString();
        const optimisticComment: Comment = {
            id: optimisticId,
            content: content,
            createdAt: new Date().toISOString(),
            author: {
                id: currentUserId,
                name: 'Tú', // Placeholder until refresh
                avatarUrl: null,
                role: 'STUDENT' // Assumption
            }
        };

        // Optimistic update
        setComments(prev => [optimisticComment, ...prev]);
        setContent('');

        // Scroll to top
        if (scrollRef.current) scrollRef.current.scrollTop = 0;

        startTransition(async () => {
            const result = await addResourceCommentAction(resourceId, optimisticComment.content);
            if (result.success && result.data) {
                // Formatting data to match Comment type (dates are Dates in prisma result usually, but action returns serialized? I checked action, returning raw prisma object inside data)
                // Wait, my action returns prisma object which has Date.
                // The action in client component receives JSON if passed through props, but direct server action call returns whatever.
                // Next.js server actions serialize return values. So Dates become strings usually? Or preserved if simple?
                // Actually server actions serialize nicely.
                // But let's be safe.
                const newComment = {
                    ...result.data,
                    createdAt: new Date(result.data.createdAt).toISOString() // Ensure string
                } as unknown as Comment; // Force type match

                setComments(prev => [newComment, ...prev.filter(c => c.id !== optimisticId)]);
                router.refresh(); // Refresh server data
            } else {
                // Revert
                setComments(prev => prev.filter(c => c.id !== optimisticId));
                alert('Error al publicar comentario');
            }
        });
    };

    const handleDelete = async (commentId: string) => {
        setComments(prev => prev.filter(c => c.id !== commentId));
        startTransition(async () => {
            const result = await deleteResourceCommentAction(commentId);
            if (!result.success) {
                alert('No se pudo eliminar');
                router.refresh();
            }
        });
    };

    return (
        <div className="flex flex-col h-full bg-slate-50">
            {/* Input Area */}
            <div className="p-4 bg-white border-b border-slate-200 shrink-0">
                <form onSubmit={handleSubmit} className="relative">
                    <textarea
                        value={content}
                        onChange={e => setContent(e.target.value)}
                        placeholder="Escribe una pregunta o comentario..."
                        className="w-full pl-4 pr-12 py-3 rounded-xl bg-slate-50 border-0 focus:ring-2 focus:ring-blue-100 placeholder:text-slate-400 text-sm resize-none min-h-[60px]"
                        onKeyDown={e => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSubmit(e);
                            }
                        }}
                    />
                    <button
                        type="submit"
                        disabled={!content.trim() || isPending}
                        className="absolute right-2 bottom-2 p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all disabled:opacity-50 disabled:bg-slate-300"
                    >
                        {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </button>
                </form>
            </div>

            {/* List */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
                {comments.length === 0 ? (
                    <div className="text-center py-10 text-slate-400">
                        <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-20" />
                        <p className="text-sm">Sé el primero en comentar</p>
                    </div>
                ) : (
                    comments.map(comment => (
                        <div key={comment.id} className="group flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className="shrink-0">
                                {comment.author.avatarUrl ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={comment.author.avatarUrl} alt={comment.author.name || '?'} className="w-8 h-8 rounded-full bg-slate-200 object-cover" />
                                ) : (
                                    <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-400">
                                        <User className="w-4 h-4" />
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-bold text-slate-700">
                                            {comment.author.name || 'Usuario'}
                                        </span>
                                        {comment.author.role === 'TEACHER' && (
                                            <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-bold">
                                                PROFE
                                            </span>
                                        )}
                                        <span className="text-[10px] text-slate-400">
                                            {new Date(comment.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                    {(currentUserId === comment.author.id) && (
                                        <button
                                            onClick={() => handleDelete(comment.id)}
                                            className="opacity-0 group-hover:opacity-100 p-1 text-slate-300 hover:text-red-500 transition-all"
                                            title="Eliminar"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                </div>
                                <div className="text-sm text-slate-600 bg-white p-3 rounded-lg rounded-tl-none border border-slate-100 shadow-sm leading-relaxed whitespace-pre-wrap">
                                    {comment.content}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
