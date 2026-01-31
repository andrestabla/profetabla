import nodemailer from 'nodemailer';
import { prisma } from '@/lib/prisma';

interface EmailOptions {
    to: string;
    subject: string;
    html: string;
}

const getTransporter = async () => {
    // 1. Fetch SMTP config from DB
    const config = await prisma.platformConfig.findUnique({
        where: { id: 'global-config' }
    });

    // 2. Fallback or Error if no config
    if (!config?.smtpHost || !config?.smtpUser || !config?.smtpPassword) {
        throw new Error('SMTP Configuration missing in PlatformConfig');
    }

    // 3. Create Transporter
    return nodemailer.createTransport({
        host: config.smtpHost,
        port: config.smtpPort,
        secure: config.smtpPort === 465, // true for 465, false for other ports
        auth: {
            user: config.smtpUser,
            pass: config.smtpPassword,
        },
    });
};

export const sendEmail = async ({ to, subject, html }: EmailOptions) => {
    try {
        const transporter = await getTransporter();
        const config = await prisma.platformConfig.findUnique({ where: { id: 'global-config' } });
        const fromName = config?.smtpSenderName || config?.institutionName || 'Profe Tabla';
        // Fallback to smtpUser if smtpFrom is not set, to avoid "owned by" mismatches
        const fromEmail = config?.smtpFrom || config?.smtpUser || 'notifications@profetabla.com';

        console.log(`[Email] Preparing to send to ${to} from ${fromEmail}`);

        const info = await transporter.sendMail({
            from: `"${fromName}" <${fromEmail}>`,
            to,
            subject,
            html,
        });

        console.log(`[Email] Sent to ${to}. MessageId: ${info.messageId}`);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('[Email] Failed to send email:', error);
        return { success: false, error };
    }
};

export const sendVerificationEmail = async (email: string, token: string) => {
    // Assuming configured NEXTAUTH_URL or we default to origin
    const baseUrl = process.env.NEXTAUTH_URL || 'https://profetabla.com';
    const link = `${baseUrl}/verify-email?token=${token}`;

    const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Confirma tu correo electrónico</h2>
      <p>Gracias por registrarte en Profe Tabla. Para activar tu cuenta, por favor confirma tu email haciendo clic en el siguiente enlace:</p>
      <p style="text-align: center; margin: 30px 0;">
        <a href="${link}" style="background-color: #2563EB; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Confirmar Email</a>
      </p>
      <p>O copia y pega este enlace en tu navegador:</p>
      <p><a href="${link}">${link}</a></p>
      <p>Este enlace expirará en 24 horas.</p>
    </div>
  `;

    return sendEmail({
        to: email,
        subject: 'Confirma tu cuenta en Profe Tabla',
        html
    });
};

export const sendPasswordResetEmail = async (email: string, token: string) => {
    const baseUrl = process.env.NEXTAUTH_URL || 'https://profetabla.com';
    const link = `${baseUrl}/reset-password?token=${token}`;

    const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Recuperación de Contraseña</h2>
      <p>Has solicitado restablecer tu contraseña. Haz clic en el enlace de abajo para crear una nueva contraseña:</p>
      <p style="text-align: center; margin: 30px 0;">
        <a href="${link}" style="background-color: #F59E0B; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Restablecer Contraseña</a>
      </p>
      <p>Si no solicitaste esto, puedes ignorar este correo.</p>
      <p>Este enlace expirará en 1 hora.</p>
    </div>
  `;

    return sendEmail({
        to: email,
        subject: 'Restablecer contraseña - Profe Tabla',
        html
    });
};
