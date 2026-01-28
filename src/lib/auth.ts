import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from '@/lib/prisma';
import GoogleProvider from 'next-auth/providers/google';
import bcrypt from 'bcryptjs';

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: 'Credentials',
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    throw new Error('Please enter an email and password');
                }

                const user = await prisma.user.findUnique({
                    where: {
                        email: credentials.email
                    }
                });

                if (!user || !user.password) {
                    throw new Error('No user found');
                }

                // For Seeded Users (which are plain text 'admin', 'profe', 'estudiante')
                // We will try plain text compare first for demo, then fallback to bcrypt if fails
                let isValid = false;

                if (user.password === credentials.password) {
                    isValid = true; // Demo plain text match
                } else {
                    // Try bcrypt (for future real users)
                    try {
                        isValid = await bcrypt.compare(credentials.password, user.password);
                    } catch {
                        isValid = false;
                    }
                }

                if (!isValid) {
                    throw new Error('Incorrect password');
                }

                return {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    image: user.avatarUrl,
                    role: user.role
                };
            }
        }),
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID || '',
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
            allowDangerousEmailAccountLinking: true
        })
    ],
    callbacks: {
        async signIn({ user, account, profile }) {
            if (account?.provider === 'google') {
                if (!user.email) return false;

                try {
                    // Check logic based on cookie intent? 
                    // Note: 'cookies' is only available in server components or via next/headers in App Router, 
                    // but in NextAuth callbacks we don't have direct access to request headers easily in all versions.
                    // However, NextAuth 4+ allows reading headers if we export a function or rely on the context.
                    // Actually, getting cookies inside the signIn callback is tricky without proper request access.
                    // A cleaner way for the DB logic:

                    const existingUser = await prisma.user.findUnique({
                        where: { email: user.email }
                    });

                    // 1. If user exists, we ALWAYS allow login (and update profile)
                    // It doesn't matter if they clicked 'Login' or 'Register', they exist.
                    if (existingUser) {
                        await prisma.user.update({
                            where: { id: existingUser.id },
                            data: {
                                name: user.name || existingUser.name,
                                avatarUrl: user.image || existingUser.avatarUrl,
                            }
                        });
                        return true;
                    }

                    // 2. If user DOES NOT exist, we need to check if they are allowed to register.
                    // We can attempt to parse the cookie from the request if possible, 
                    // OR we can make a stricter assumption:
                    // Since we can't easily read client cookies here without a custom wrapper, we rely on a workaround.
                    // BUT for this specific requirement "If user doesn't have account, CANNOT login with Google", 
                    // we can block creation unless we are explicitly in "Register" mode.

                    // Since we can't read the cookie easily here in standard config, 
                    // we will modify the Auth Options to be a function if needed OR use `req` if available.
                    // NextAuth v4 exposes `req` in the callback if defined as `async signIn({ user, account, profile, email, credentials }, { query, account, profile, email, ...? No })` 
                    // Actually usually it's `signIn({ user, account, profile, email, credentials })`.

                    // Workaround: We can't implement the cookie check strictly inside this `signIn` without access to headers.
                    // However, we can use the `email` field to maybe pass a signal? No.

                    // We will assume that if we are here, we verify if we can get headers.
                    // `next-auth/next` handler passes `req`.
                    // But `authOptions` is static object here.

                    // IMPORTANT: We need to convert `authOptions` to be used in a route handler that has access to headers, 
                    // or use `getServerSession` logic? No, this is the callback.

                    // Let's rely on the user existing.
                    // If user does not exist, we throw AccessDenied unless we find a way to permit it.
                    // Since we implemented the cookies in frontend, let's try to access them via `next/headers`.
                    // This is Next.js 13+ App Router. We CAN access cookies() here!

                    const { cookies } = await import('next/headers');
                    const cookieStore = await cookies();
                    const intent = cookieStore.get('auth_intent')?.value;

                    console.log(`[GoogleAuth] Email: ${user.email}, Intent Cookie: ${intent}`);

                    if (intent === 'login') {
                        // User is trying to login, but doesn't exist. Block.
                        console.warn(`[Auth] Blocked Google registration for ${user.email} (Intent: login)`);
                        return false;
                        // Or better: return '/register?error=AccountNotFound' (NextAuth allows string redirect)
                    }

                    // If intent is 'register' (or missing/undefined which implies maybe standard flow? No, let's be strict), 
                    // we allow creation.
                    if (intent === 'register') {
                        const randomPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
                        const hashedPassword = await bcrypt.hash(randomPassword, 10);

                        await prisma.user.create({
                            data: {
                                email: user.email,
                                name: user.name || 'Usuario Google',
                                avatarUrl: user.image,
                                password: hashedPassword,
                                role: 'STUDENT',
                                isActive: true
                            }
                        });
                        return true;
                    }

                    console.warn(`[Auth] Blocked Google auto-registration (No intent cookie found)`);
                    return false;

                } catch (error) {
                    console.error("Error creating google user:", error);
                    return false;
                }
            }
            return true;
        },
        async session({ session, token }) {
            if (session?.user) {
                session.user.id = token.id as string;
                session.user.role = token.role as string;
            }
            return session;
        },
        async jwt({ token, user, trigger, session }) {
            // Force fetch user from DB to ensure we have the correct ID and Role (especially for new Google users)
            // 'user' param is present only on initial sign in
            const email = token.email || user?.email;

            if (email) {
                const dbUser = await prisma.user.findUnique({
                    where: { email: email }
                });

                if (dbUser) {
                    token.id = dbUser.id;
                    token.role = dbUser.role;
                }
            }
            return token;
        }
    },
    pages: {
        signIn: '/login',
    },
    session: {
        strategy: 'jwt',
        maxAge: 3600, // 1 hour of inactivity timeout
    },
    secret: process.env.NEXTAUTH_SECRET || 'super-secret-secret'
};
