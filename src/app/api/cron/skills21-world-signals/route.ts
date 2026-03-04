import { NextRequest, NextResponse } from 'next/server';
import { refreshSkills21WorldSignals } from '@/lib/skills21-world-watch';

function isAuthorized(request: NextRequest): boolean {
    const secret = (process.env.CRON_SECRET || '').trim();
    if (!secret) return true;

    const authHeader = request.headers.get('authorization') || '';
    const token = authHeader.startsWith('Bearer ')
        ? authHeader.slice('Bearer '.length)
        : request.nextUrl.searchParams.get('token') || '';

    return token === secret;
}

async function handleCron(request: NextRequest) {
    if (!isAuthorized(request)) {
        return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
    }

    try {
        const result = await refreshSkills21WorldSignals({ force: false });
        return NextResponse.json({ success: true, result });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Error desconocido';
        return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
}

export async function GET(request: NextRequest) {
    return handleCron(request);
}

export async function POST(request: NextRequest) {
    return handleCron(request);
}
