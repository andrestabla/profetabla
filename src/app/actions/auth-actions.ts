'use server';

import { cookies } from 'next/headers';

export async function setAuthIntentAction(intent: 'login' | 'register') {
    const cookieStore = await cookies();
    cookieStore.set('auth_intent', intent, {
        path: '/',
        maxAge: 300, // 5 minutes
        httpOnly: true, // Secure, not accessible by JS (good practice)
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
    });
}
