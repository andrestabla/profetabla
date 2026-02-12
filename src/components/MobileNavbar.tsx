'use client';

import { Menu, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Sidebar } from './Sidebar';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function MobileNavbar({ config }: { config?: any }) {
    const [isOpen, setIsOpen] = useState(false);

    const logo = config?.logoUrl;
    const title = config?.institutionName || 'Profe Tabla';

    // Close sidebar when clicking outside or navigating
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
    }, [isOpen]);

    return (
        <div className="lg:hidden">
            {/* Top Bar */}
            <div className="bg-[#0F172A] text-white p-4 flex items-center justify-between border-b border-slate-800 sticky top-0 z-40">
                <div className="flex items-center gap-3">
                    {logo ? (
                        <img src={logo} alt={title} className="h-8 w-auto object-contain" />
                    ) : (
                        <span className="font-bold text-lg text-primary">{title}</span>
                    )}
                </div>
                <button
                    onClick={() => setIsOpen(true)}
                    className="p-2 text-slate-400 hover:text-white transition-colors"
                >
                    <Menu className="w-6 h-6" />
                </button>
            </div>

            {/* Sidebar Overlay */}
            <div
                className={cn(
                    "fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 transition-opacity duration-300",
                    isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
                )}
                onClick={() => setIsOpen(false)}
            >
                {/* Sidebar Container */}
                <div
                    className={cn(
                        "fixed top-0 left-0 bottom-0 w-[280px] bg-[#0F172A] shadow-2xl transition-transform duration-300 ease-in-out z-50 overflow-y-auto",
                        isOpen ? "translate-x-0" : "-translate-x-full"
                    )}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="flex flex-col h-full">
                        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                            <span className="font-bold text-white">Menú</span>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-2 text-slate-400 hover:text-white"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto">
                            <Sidebar config={config} isMobile onClose={() => setIsOpen(false)} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
