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
                    const existingUser = await prisma.user.findUnique({
                        where: { email: user.email }
                    });

                    // 1. If user exists, update profile and allow login
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

                    // 2. If user DOES NOT exist, AUTO-REGISTER (Reverted to original behavior)
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
