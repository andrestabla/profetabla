
'use client';

// Helper to set auth intent cookie
export function setAuthIntent(intent: 'login' | 'register') {
    document.cookie = `auth_intent=${intent}; path=/; max-age=300; SameSite=Lax`;
}
