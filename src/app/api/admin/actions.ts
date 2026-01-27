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
        geminiApiKey: formData.get('geminiApiKey') as string,
        geminiModel: formData.get('geminiModel') as string,

        googleClientId: formData.get('googleClientId') as string,
        googleClientSecret: formData.get('googleClientSecret') as string,

        googleDriveClientId: formData.get('googleDriveClientId') as string,
        googleDriveClientSecret: formData.get('googleDriveClientSecret') as string,
        googleDriveFolderId: formData.get('googleDriveFolderId') as string,

        smtpHost: formData.get('smtpHost') as string,
        smtpPort: parseInt(formData.get('smtpPort') as string || '587'),
        smtpUser: formData.get('smtpUser') as string,
        smtpSenderName: formData.get('smtpSenderName') as string,
        smtpFrom: formData.get('smtpFrom') as string,
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function sendTestEmailAction(toEmail: string, credentials?: any) {
    try {
        await requireAdmin();

        let safeConfig;

        if (credentials) {
            safeConfig = credentials;
            console.log("[MOCK SMTP] Using provided credentials for testing.");
        } else {
            // Fetch current config to use for testing
            const config = await prisma.platformConfig.findUnique({ where: { id: 'global-config' } });
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            safeConfig = config as any;
        }

        if (!safeConfig?.smtpHost || !safeConfig?.smtpUser || !safeConfig?.smtpPassword) {
            return { success: false, message: "Configuración SMTP incompleta/Falla verificación. Guarda la configuración o asegúrate de llenar los campos." };
        }

        console.log(`[MOCK SMTP] Sending test email to ${toEmail}`);
        console.log(`[MOCK SMTP] Host: ${safeConfig.smtpHost}:${safeConfig.smtpPort}`);
        console.log(`[MOCK SMTP] User: ${safeConfig.smtpUser}`);
        console.log(`[MOCK SMTP] From: "${safeConfig.smtpSenderName || safeConfig.institutionName}" <${safeConfig.smtpFrom}>`);

        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay

        return { success: true, message: "Correo de prueba enviado (Simulado en logs). NO olvides guardar la configuración." };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        console.error("SMTP Test Error:", error);
        return { success: false, message: error.message || "Error desconocido." };
    }
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
