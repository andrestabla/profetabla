'use server';

import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

// Middleware de seguridad interno
async function requireAdmin() {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
        throw new Error("ACCESO DENEGADO: Se requiere nivel Administrador.");
    }
    return session;
}

export async function updatePlatformConfigAction(formData: FormData) {
    const session = await requireAdmin();

    const data = {
        institutionName: formData.get('institutionName') as string,
        primaryColor: formData.get('primaryColor') as string,
        geminiApiKey: formData.get('geminiApiKey') as string,
        geminiModel: formData.get('geminiModel') as string,
        githubToken: formData.get('githubToken') as string,
        smtpHost: formData.get('smtpHost') as string,
        smtpPort: parseInt(formData.get('smtpPort') as string || '587'),
        smtpUser: formData.get('smtpUser') as string,
        // Note: In a real app we would handle password encryption differently
        // smtpPassword: formData.get('smtpPassword') as string,
    };

    // Only update password if provided
    const smtpPassword = formData.get('smtpPassword') as string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = { ...data };
    if (smtpPassword) {
        updateData.smtpPassword = smtpPassword;
    }

    await prisma.platformConfig.upsert({
        where: { id: 'global-config' },
        update: updateData,
        create: { id: 'global-config', ...updateData }
    });

    // Log the action
    await prisma.activityLog.create({
        data: {
            userId: session.user.id,
            level: 'INFO',
            action: 'UPDATE_CONFIG',
            description: 'Platform configuration updated'
        }
    });

    revalidatePath('/dashboard/admin');
}

export async function getSystemLogs(filterLevel?: string) {
    await requireAdmin();

    return await prisma.activityLog.findMany({
        where: filterLevel ? { level: filterLevel } : {},
        orderBy: { createdAt: 'desc' },
        take: 100,
        include: { user: true }
    });
}

export async function getUsersAction(role?: string) {
    await requireAdmin();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};
    if (role && role !== 'ALL') where.role = role;

    return await prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: 50
    });
}
