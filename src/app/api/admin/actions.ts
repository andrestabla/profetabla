'use server';

import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import nodemailer from 'nodemailer';

// Middleware de seguridad interno
async function requireAdmin() {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
        throw new Error("ACCESO DENEGADO: Se requiere nivel Administrador.");
    }
    return session;
}

export async function updatePlatformConfigAction(formData: FormData) {
    try {
        const session = await requireAdmin();

        const smtpPortStr = formData.get('smtpPort') as string;
        const smtpPort = smtpPortStr ? parseInt(smtpPortStr) : 587;

        if (isNaN(smtpPort)) {
            return { success: false, message: "El puerto SMTP debe ser un número válido." };
        }

        const data = {
            geminiApiKey: formData.get('geminiApiKey') as string,
            geminiModel: formData.get('geminiModel') as string,

            openaiApiKey: formData.get('openaiApiKey') as string,
            openaiModel: formData.get('openaiModel') as string,
            aiProvider: formData.get('aiProvider') as string,

            googleClientId: formData.get('googleClientId') as string,
            googleClientSecret: formData.get('googleClientSecret') as string,

            googleDriveClientId: formData.get('googleDriveClientId') as string,
            googleDriveClientSecret: formData.get('googleDriveClientSecret') as string,
            googleDriveServiceAccountJson: formData.get('googleDriveServiceAccountJson') as string,
            googleDriveFolderId: formData.get('googleDriveFolderId') as string,

            smtpHost: formData.get('smtpHost') as string,
            smtpPort: smtpPort,
            smtpUser: formData.get('smtpUser') as string,
            smtpSenderName: formData.get('smtpSenderName') as string,
            smtpFrom: formData.get('smtpFrom') as string,

            // AI Behavior Config
            aiInstructions: formData.get('aiInstructions') as string,
            aiTone: formData.get('aiTone') as string,
            aiSearchEnabled: formData.get('aiSearchEnabled') === 'on',
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
        return { success: true, message: "Configuración guardada correctamente." };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        console.error("Update Config Error:", error);
        return { success: false, message: error.message || "Error al guardar la configuración." };
    }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function sendTestEmailAction(toEmail: string, credentials?: any) {
    try {
        await requireAdmin();

        let safeConfig;

        if (credentials) {
            safeConfig = credentials;
        } else {
            // Fetch current config to use for testing
            const config = await prisma.platformConfig.findUnique({ where: { id: 'global-config' } });
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            safeConfig = config as any;
        }

        if (!safeConfig?.smtpHost || !safeConfig?.smtpUser || !safeConfig?.smtpPassword) {
            return { success: false, message: "Configuración SMTP incompleta. Verifica Host, Usuario y Contraseña." };
        }

        const transporter = nodemailer.createTransport({
            host: safeConfig.smtpHost,
            port: safeConfig.smtpPort,
            secure: safeConfig.smtpPort === 465, // True for 465, false for 587
            auth: {
                user: safeConfig.smtpUser,
                pass: safeConfig.smtpPassword,
            },
        });

        const mailOptions = {
            from: `"${safeConfig.smtpSenderName || 'Profe Tabla'}" <${safeConfig.smtpFrom || safeConfig.smtpUser}>`,
            to: toEmail,
            subject: 'Prueba de Conexión SMTP - Profe Tabla',
            text: '¡Hola! Si has recibido este correo, la configuración SMTP es correcta.',
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
                    <h2 style="color: #4F46E5;">¡Prueba Exitosa! 🚀</h2>
                    <p>La configuración SMTP de <strong>Profe Tabla</strong> está funcionando correctamente.</p>
                    <p><strong>Detalles de conexión:</strong></p>
                    <ul>
                        <li>Host: ${safeConfig.smtpHost}</li>
                        <li>Puerto: ${safeConfig.smtpPort}</li>
                        <li>Usuario: ${safeConfig.smtpUser}</li>
                    </ul>
                    <p style="color: #6B7280; font-size: 12px; margin-top: 20px;">Este es un mensaje automático de prueba.</p>
                </div>
            `,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log("Message sent: %s", info.messageId);

        return { success: true, message: `Correo enviado exitosamente.` };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        console.error("SMTP Test Error:", error);
        return { success: false, message: `Error SMTP: ${error.message}` };
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
