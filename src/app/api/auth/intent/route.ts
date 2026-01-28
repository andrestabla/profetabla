import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const { intent } = await request.json();
        const cookieStore = await cookies();

        cookieStore.set('auth_intent', intent, {
            path: '/',
            maxAge: 300, // 5 minutes
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax'
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to set intent' }, { status: 500 });
    }
}
