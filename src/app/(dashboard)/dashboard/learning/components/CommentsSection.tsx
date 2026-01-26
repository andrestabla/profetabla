'use client';

import { useState } from 'react';
import { addCommentToOAAction } from '../actions';
import { MessageSquare, Send, User } from 'lucide-react';
import { useRouter } from 'next/navigation';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function CommentsSection({ learningObjectId, comments, currentUserId }: { learningObjectId: string, comments: any[], currentUserId?: string }) {
    const [content, setContent] = useState('');
    const [isSending, setIsSending] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [optimisticComments, setOptimisticComments] = useState<any[]>(comments);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim()) return;

        setIsSending(true);
        const tempId = Math.random().toString();
        const newComment = {
            id: tempId,
            content,
            createdAt: new Date(),
            author: { name: 'Yo', avatarUrl: null, id: currentUserId }, // Optimistic
            authorId: currentUserId
        };

        setOptimisticComments([newComment, ...optimisticComments]);
        setContent('');

        await addCommentToOAAction(learningObjectId, content);
        setIsSending(false);
        router.refresh();
    };

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 max-h-[600px] flex flex-col">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-indigo-600" /> Comentarios ({optimisticComments.length})
            </h3>

            <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2">
                {optimisticComments.length === 0 ? (
                    <p className="text-center text-slate-400 py-4 text-sm">Sé el primero en comentar.</p>
                ) : (
                    optimisticComments.map((comment) => (
                        <div key={comment.id} className="flex gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0 text-slate-500">
                                {comment.author?.avatarUrl ? (
                                    <img src={comment.author.avatarUrl} alt="" className="w-full h-full rounded-full" />
                                ) : (
                                    <User className="w-4 h-4" />
                                )}
                            </div>
                            <div className="bg-slate-50 p-3 rounded-r-xl rounded-bl-xl text-sm flex-1">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="font-bold text-slate-700 text-xs">{comment.author?.name || 'Usuario'}</span>
                                    <span className="text-[10px] text-slate-400">
                                        {new Date(comment.createdAt).toLocaleDateString()}
                                    </span>
                                </div>
                                <p className="text-slate-600">{comment.content}</p>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <form onSubmit={handleSubmit} className="flex gap-2">
                <input
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Escribe un comentario..."
                    className="flex-1 px-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
                <button
                    type="submit"
                    disabled={isSending || !content.trim()}
                    className="bg-indigo-600 text-white p-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                >
                    <Send className="w-4 h-4" />
                </button>
            </form>
        </div>
    );
}
