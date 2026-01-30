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
    // Default GIF provided by the user
    const loaderUrl = "https://profetabla.s3.us-east-1.amazonaws.com/coaching.gif";

    if (variant === 'button') {
        return (
            <div className={`flex items-center gap-2 ${className}`}>
                <div className="relative" style={{ width: 16, height: 16 }}>
                    <Image
                        src={loaderUrl}
                        alt="Loading"
                        fill
                        className="object-contain"
                        unoptimized
                    />
                </div>
                <span>{message}</span>
            </div>
        );
    }

    if (variant === 'fullscreen') {
        return (
            <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center">
                <div className="relative" style={{ width: size * 2.5, height: size * 2.5 }}>
                    <Image
                        src={loaderUrl}
                        alt="Loading"
                        fill
                        className="object-contain"
                        unoptimized
                    />
                </div>
                {message && <p className="mt-4 text-slate-500 font-medium animate-pulse">{message}</p>}
            </div>
        );
    }

    return (
        <div className={`flex flex-col items-center justify-center p-4 ${className}`}>
            <div className="relative" style={{ width: size, height: size }}>
                <Image
                    src={loaderUrl}
                    alt="Loading"
                    fill
                    className="object-contain"
                    unoptimized
                />
            </div>
            {message && <p className="mt-2 text-sm text-slate-400 font-medium">{message}</p>}
        </div>
    );
}
