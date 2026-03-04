'use client';

import React, { useState } from 'react';
import { MessageCircle, X, Sparkles } from 'lucide-react';
import { SupportChatWindow } from './SupportChatWindow';
import { cn } from '@/lib/utils';

export function SupportBubble() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[100] flex flex-col items-end gap-3 sm:gap-4">
            {/* Tooltip hint */}
            {!isOpen && (
                <div className="hidden sm:block bg-slate-900 text-white px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest animate-in fade-in slide-in-from-right-5 duration-500 shadow-xl border border-white/10">
                    <div className="flex items-center gap-2">
                        <Sparkles className="w-3 h-3 text-blue-400" />
                        ¿Necesitas ayuda?
                    </div>
                </div>
            )}

            {/* Chat Window */}
            {isOpen && <SupportChatWindow onClose={() => setIsOpen(false)} />}

            {/* Bubble Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "w-14 h-14 sm:w-16 sm:h-16 rounded-[1.4rem] sm:rounded-[2rem] flex items-center justify-center transition-all duration-500 shadow-2xl relative group overflow-hidden",
                    isOpen
                        ? "bg-slate-900 text-white rotate-90 scale-90"
                        : "bg-blue-600 text-white hover:bg-blue-700 hover:scale-110 active:scale-95 shadow-blue-500/30"
                )}
            >
                {/* Background effect */}
                {!isOpen && (
                    <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-50 transition-opacity group-hover:opacity-100" />
                )}

                {isOpen ? (
                    <X className="w-7 h-7 sm:w-8 sm:h-8" />
                ) : (
                    <MessageCircle className="w-7 h-7 sm:w-8 sm:h-8 group-hover:rotate-12 transition-transform duration-300" />
                )}

                {/* Notification pulse (only when closed) */}
                {!isOpen && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-4 border-slate-50 animate-pulse" />
                )}
            </button>
        </div>
    );
}
