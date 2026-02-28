type ActivityLevel = 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL';

export type ClientActivityPayload = {
    action: string;
    description: string;
    level?: ActivityLevel;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    metadata?: Record<string, any>;
};

type TrackOptions = {
    debounceKey?: string;
    minIntervalMs?: number;
    useBeacon?: boolean;
};

export async function trackClientActivity(
    payload: ClientActivityPayload,
    options: TrackOptions = {}
) {
    if (typeof window === 'undefined') return;

    const {
        debounceKey,
        minIntervalMs = 30000,
        useBeacon = true
    } = options;

    if (debounceKey) {
        const lastTs = Number(window.sessionStorage.getItem(`activity:${debounceKey}`) || '0');
        const now = Date.now();
        if (now - lastTs < minIntervalMs) return;
        window.sessionStorage.setItem(`activity:${debounceKey}`, String(now));
    }

    const body = JSON.stringify(payload);

    try {
        if (useBeacon && navigator.sendBeacon) {
            const blob = new Blob([body], { type: 'application/json' });
            navigator.sendBeacon('/api/activity/track', blob);
            return;
        }

        await fetch('/api/activity/track', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body,
            keepalive: true,
            cache: 'no-store',
        });
    } catch {
        // Silent fail: telemetry must not break UX.
    }
}

