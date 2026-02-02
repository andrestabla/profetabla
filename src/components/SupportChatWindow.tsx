'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, X, Bot, User, Loader2, Sparkles, MessageSquare } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { getSupportResponse } from '@/app/actions/support-ai';
import { cn } from '@/lib/utils';

interface Message {
    role: 'user' | 'model';
    parts: string;
}

interface SupportChatWindowProps {
    onClose: () => void;
}

export function SupportChatWindow({ onClose }: SupportChatWindowProps) {
    const [messages, setMessages] = useState<Message[]>([
        { role: 'model', parts: '¡Hola! Soy tu asistente de Profe Tabla. ¿En qué puedo ayudarte hoy?' }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isLoading]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage: Message = { role: 'user', parts: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const history = messages.map(m => ({
                role: m.role,
                parts: m.parts
            }));

            const result = await getSupportResponse(input, history);

            if (result.success && result.response) {
                setMessages(prev => [...prev, { role: 'model', parts: result.response! }]);
            } else {
                setMessages(prev => [...prev, { role: 'model', parts: `Error: ${result.error || 'No se pudo obtener respuesta.'}` }]);
            }
        } catch (error) {
            console.error("Chat error:", error);
            setMessages(prev => [...prev, { role: 'model', parts: 'Lo siento, hubo un problema técnico. Inténtalo de nuevo.' }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed bottom-24 right-6 w-[400px] h-[600px] bg-white rounded-[2.5rem] shadow-2xl border border-slate-200 flex flex-col overflow-hidden z-[100] animate-in slide-in-from-bottom-5 duration-300">
            {/* Header */}
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                        <Bot className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="font-black text-sm tracking-tight">Soporte IA</h3>
                        <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">En línea</span>
                        </div>
                    </div>
                </div>
                <button
                    onClick={onClose}
                    className="p-2 hover:bg-white/10 rounded-xl transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* Messages */}
            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50"
            >
                {messages.map((msg, i) => (
                    <div
                        key={i}
                        className={cn(
                            "flex items-start gap-3",
                            msg.role === 'user' ? "flex-row-reverse" : ""
                        )}
                    >
                        <div className={cn(
                            "w-8 h-8 rounded-xl flex items-center justify-center shrink-0",
                            msg.role === 'user' ? "bg-slate-200 text-slate-600" : "bg-blue-100 text-blue-600"
                        )}>
                            {msg.role === 'user' ? <User className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                        </div>
                        <div className={cn(
                            "max-w-[80%] p-4 rounded-3xl text-sm leading-relaxed",
                            msg.role === 'user'
                                ? "bg-slate-900 text-white rounded-tr-none"
                                : "bg-white border border-slate-200 text-slate-700 shadow-sm rounded-tl-none"
                        )}>
                            <div className="prose prose-sm prose-slate max-w-none dark:prose-invert">
                                <ReactMarkdown>
                                    {msg.parts}
                                </ReactMarkdown>
                            </div>
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
                            <Sparkles className="w-4 h-4" />
                        </div>
                        <div className="bg-white border border-slate-200 p-4 rounded-3xl rounded-tl-none shadow-sm">
                            <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                        </div>
                    </div>
                )}
            </div>

            {/* Input */}
            <div className="p-4 bg-white border-t border-slate-100">
                <div className="relative">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Escribe tu duda aquí..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-3xl py-4 pl-6 pr-14 text-sm font-medium focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                    />
                    <button
                        onClick={handleSend}
                        disabled={!input.trim() || isLoading}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-3 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 transition-all shadow-lg shadow-blue-500/20"
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </div>
                <div className="mt-3 flex items-center justify-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                    <MessageSquare className="w-3 h-3" />
                    Soporte oficial de Profe Tabla
                </div>
            </div>
        </div>
    );
}
