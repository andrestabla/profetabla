'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { trackClientActivity } from '@/lib/client-activity';

export function ActivityTracker() {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const { status } = useSession();

    const query = searchParams?.toString() || '';

    useEffect(() => {
        if (status !== 'authenticated') return;
        if (!pathname) return;
        if (!pathname.startsWith('/dashboard')) return;

        const fullPath = query ? `${pathname}?${query}` : pathname;

        trackClientActivity(
            {
                action: 'VIEW_SECTION',
                description: `Visualizó sección ${pathname}`,
                metadata: {
                    path: pathname,
                    query: query || null,
                    fullPath,
                    area: 'dashboard',
                }
            },
            {
                debounceKey: `view:${fullPath}`,
                minIntervalMs: 45000,
                useBeacon: true
            }
        );
    }, [pathname, query, status]);

    return null;
}

