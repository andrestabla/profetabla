import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from '@/lib/prisma';
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
        })
    ],
    callbacks: {
        async session({ session, token }) {
            if (session?.user) {
                session.user.id = token.id as string;
                session.user.role = token.role as string;
            }
            return session;
        },
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                // @ts-expect-error - Custom role in user
                token.role = user.role;
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
