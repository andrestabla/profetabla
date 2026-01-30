'use client';

import React from 'react';
import Image from 'next/image';
import { Loader2 } from 'lucide-react';

interface LoadingProps {
    message?: string;
    size?: number;
    className?: string;
    variant?: 'fullscreen' | 'inline' | 'button';
}

export default function Loading({
    message = "Cargando...",
    size = 40,
    className = "",
    variant = "inline"
}: LoadingProps) {
    // We use a CSS variable defined in layout.tsx to ensure it picks up the DB config
    // without needing async data fetching in loading.tsx (which must be sync)

    if (variant === 'button') {
        return (
            <div className={`flex items-center gap-2 ${className}`}>
                <div
                    className="relative bg-contain bg-center bg-no-repeat"
                    style={{
                        width: 16,
                        height: 16,
                        backgroundImage: 'var(--loading-url)'
                    }}
                />
                <span>{message}</span>
            </div>
        );
    }

    if (variant === 'fullscreen') {
        return (
            <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center">
                <div
                    className="relative bg-contain bg-center bg-no-repeat animate-pulse"
                    style={{
                        width: size * 2.5,
                        height: size * 2.5,
                        backgroundImage: 'var(--loading-url)'
                    }}
                />
                {message && <p className="mt-4 text-slate-500 font-medium animate-pulse">{message}</p>}
            </div>
        );
    }

    return (
        <div className={`flex flex-col items-center justify-center p-4 ${className}`}>
            <div
                className="relative bg-contain bg-center bg-no-repeat"
                style={{
                    width: size,
                    height: size,
                    backgroundImage: 'var(--loading-url)'
                }}
            />
            {message && <p className="mt-2 text-sm text-slate-400 font-medium">{message}</p>}
        </div>
    );
}
