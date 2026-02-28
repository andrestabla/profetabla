import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { logActivity } from '@/lib/activity';

export const dynamic = 'force-dynamic';

type Body = {
    action?: string;
    description?: string;
    level?: 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    metadata?: Record<string, any>;
};

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = (await request.json()) as Body;
        const action = (body.action || '').trim().toUpperCase().slice(0, 80);
        const description = (body.description || '').trim().slice(0, 500);
        const level = body.level || 'INFO';

        if (!action || !description) {
            return NextResponse.json({ error: 'Missing action/description' }, { status: 400 });
        }

        const safeMetadata = body.metadata && typeof body.metadata === 'object'
            ? body.metadata
            : undefined;

        await logActivity(session.user.id, action, description, level, safeMetadata);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[activity/track] error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

