'use server';

import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import bcrypt from 'bcryptjs';

// --- AUTH HELPER ---
async function requireAdmin() {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
        throw new Error('Unauthorized');
    }
    return session;
}

// --- CREATE USER ---
export async function createUserAction(formData: FormData) {
    await requireAdmin();

    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const role = formData.get('role') as 'STUDENT' | 'TEACHER' | 'ADMIN';

    if (!email || !password || !name) throw new Error('Missing fields');

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.create({
        data: {
            name,
            email,
            password: hashedPassword,
            role,
            isActive: true
        }
    });

    // Log action
    await prisma.activityLog.create({
        data: {
            action: 'CREATE_USER',
            description: `Created user ${email} with role ${role}`,
            level: 'INFO'
        }
    });

    revalidatePath('/dashboard/admin/users');
    redirect('/dashboard/admin/users');
}

// --- TOGGLE STATUS (SUSPEND/ACTIVATE) ---
export async function toggleUserStatusAction(userId: string, isActive: boolean) {
    const session = await requireAdmin();
    // Prevent self-suspension
    if (userId === session.user.id) throw new Error("Cannot suspend yourself");

    await prisma.user.update({
        where: { id: userId },
        data: { isActive }
    });

    await prisma.activityLog.create({
        data: {
            action: 'UPDATE_USER_STATUS',
            description: `Changed status of ${userId} to ${isActive ? 'Active' : 'Suspended'}`,
            level: 'WARNING'
        }
    });

    revalidatePath(`/dashboard/admin/users/${userId}`);
    revalidatePath('/dashboard/admin/users');
}

// --- UPDATE ROLE ---
export async function updateUserRoleAction(userId: string, newRole: 'STUDENT' | 'TEACHER' | 'ADMIN') {
    const session = await requireAdmin();
    if (userId === session.user.id) throw new Error("Cannot change your own role");

    await prisma.user.update({
        where: { id: userId },
        data: { role: newRole }
    });

    await prisma.activityLog.create({
        data: {
            action: 'UPDATE_USER_ROLE',
            description: `Changed role of ${userId} to ${newRole}`,
            level: 'WARNING'
        }
    });

    revalidatePath(`/dashboard/admin/users/${userId}`);
}

// --- DELETE USER ---
export async function deleteUserAction(userId: string) {
    const session = await requireAdmin();
    if (userId === session.user.id) throw new Error("Cannot delete yourself");

    await prisma.user.delete({
        where: { id: userId }
    });

    await prisma.activityLog.create({
        data: {
            action: 'DELETE_USER',
            description: `Deleted user ${userId}`,
            level: 'CRITICAL'
        }
    });

    revalidatePath('/dashboard/admin/users');
    redirect('/dashboard/admin/users');
}

// --- MOCK SEND MESSAGE ---
export async function sendMessageAction(userId: string, message: string) {
    await requireAdmin();

    // In a real app, this would send an email or push notification
    console.log(`Sending message to ${userId}: ${message}`);

    await prisma.activityLog.create({
        data: {
            action: 'SEND_MESSAGE',
            description: `Sent message to ${userId}`,
            metadata: message,
            level: 'INFO'
        }
    });

    // No redirect needed, maybe just a toast on client
}

// --- MOCK RESET PASSWORD ---
export async function resetPasswordAction(userId: string) {
    await requireAdmin();

    // Mock reset logic
    const tempPassword = Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    await prisma.user.update({
        where: { id: userId },
        data: { password: hashedPassword }
    });

    await prisma.activityLog.create({
        data: {
            action: 'RESET_PASSWORD',
            description: `Reset password for ${userId}`,
            level: 'WARNING'
        }
    });

    return { tempPassword }; // Return to client to show to admin
}

// --- UPDATE SYSTEM CONFIG ---
// --- UPDATE SYSTEM CONFIG ---
export async function updateSystemConfigAction(formData: FormData) {
    await requireAdmin();

    // 1. Fetch existing config to merge
    const existing = await prisma.platformConfig.findUnique({ where: { id: 'global-config' } });

    // Helper: Priority -> Form Value > Existing Value > Default
    const getVal = (key: string, defaultVal: any = null) => {
        if (formData.has(key)) {
            const val = formData.get(key);
            if (val === '' && defaultVal === null) return null; // Handle clearing optional strings
            return val as string;
        }
        if (existing && (existing as any)[key] !== undefined && (existing as any)[key] !== null) {
            return (existing as any)[key];
        }
        return defaultVal;
    };

    const getInt = (key: string, defaultVal: number) => {
        if (formData.has(key)) {
            const val = formData.get(key);
            return val ? parseInt(val as string) : defaultVal;
        }
        if (existing && (existing as any)[key]) return (existing as any)[key];
        return defaultVal;
    };

    // Construct Data Object with Defaults for Required Fields
    const data = {
        institutionName: getVal('institutionName', 'Profe Tabla'),

        // Design
        primaryColor: getVal('primaryColor', '#2563EB'),
        secondaryColor: getVal('secondaryColor', '#475569'),
        accentColor: getVal('accentColor', '#F59E0B'),
        fontFamily: getVal('fontFamily', 'Inter'),
        borderRadius: getVal('borderRadius', '0.5rem'),

        // Login
        loginLayout: getVal('loginLayout', 'SPLIT'),
        loginMessage: getVal('loginMessage', null),
        loginBgUrl: getVal('loginBgUrl', null), // Ensure this field exists in schema/form
        customCss: getVal('customCss', null),

        // Integrations
        githubToken: getVal('githubToken', null),
        geminiApiKey: getVal('geminiApiKey', null),
        geminiModel: getVal('geminiModel', 'gemini-pro'),

        // SMTP
        smtpHost: getVal('smtpHost', null),
        smtpPort: getInt('smtpPort', 587),
        smtpUser: getVal('smtpUser', null),
        smtpPassword: getVal('smtpPassword', null),
        smtpFrom: getVal('smtpFrom', 'noreply@profetabla.com'),
    };

    // Upsert works because we now guarantee required fields have defaults
    await prisma.platformConfig.upsert({
        where: { id: 'global-config' },
        create: data,
        update: data
    });

    await prisma.activityLog.create({
        data: {
            action: 'UPDATE_CONFIG',
            description: 'Updated system configuration',
            level: 'INFO',
            metadata: `Updated fields: ${Array.from(formData.keys()).join(', ')}`
        }
    });

    revalidatePath('/dashboard/admin/integrations');
    revalidatePath('/dashboard/admin/design');
    revalidatePath('/', 'layout');
}
