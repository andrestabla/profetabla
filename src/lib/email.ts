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

interface MentorshipNotificationOptions {
    studentName: string;
    studentEmail: string;
    teacherName: string;
    projectTitle: string;
    startTime: Date;
    endTime: Date;
    meetLink: string;
    note?: string;
}

export const sendMentorshipNotification = async ({
    studentName,
    studentEmail,
    teacherName,
    projectTitle,
    startTime,
    endTime,
    meetLink,
    note
}: MentorshipNotificationOptions) => {
    // Format date and time in Spanish (Colombia timezone)
    const formattedDate = new Intl.DateTimeFormat('es-CO', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: 'America/Bogota'
    }).format(startTime);

    const formattedTime = `${new Intl.DateTimeFormat('es-CO', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'America/Bogota'
    }).format(startTime)} - ${new Intl.DateTimeFormat('es-CO', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'America/Bogota'
    }).format(endTime)}`;

    const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #2563EB;">🎓 Nueva Sesión de Mentoría Programada</h2>
        
        <p>Hola <strong>${studentName}</strong>,</p>
        
        <p>Se te ha programado una sesión de mentoría con los siguientes detalles:</p>
        
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 8px 0;"><strong>📚 Proyecto:</strong> ${projectTitle}</p>
            <p style="margin: 8px 0;"><strong>👨‍🏫 Profesor:</strong> ${teacherName}</p>
            <p style="margin: 8px 0;"><strong>📅 Fecha:</strong> ${formattedDate}</p>
            <p style="margin: 8px 0;"><strong>⏰ Hora:</strong> ${formattedTime}</p>
            ${note ? `<p style="margin: 8px 0;"><strong>📝 Notas:</strong> ${note}</p>` : ''}
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="${meetLink}" 
               style="background: #4285f4; color: white; padding: 14px 28px; 
                      text-decoration: none; border-radius: 6px; display: inline-block;
                      font-weight: bold;">
                📹 Unirse a Google Meet
            </a>
        </div>
        
        <p style="color: #666; font-size: 14px; line-height: 1.6;">
            También puedes acceder a esta sesión desde tu panel de mentoría en la plataforma.
            <br><br>
            <strong>Recuerda:</strong> Llega puntual y prepara tus preguntas con anticipación.
        </p>
        
        <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 30px 0;">
        
        <p style="color: #999; font-size: 12px; text-align: center;">
            Este es un correo automático. Por favor no respondas a este mensaje.
        </p>
    </div>
    `;

    return sendEmail({
        to: studentEmail,
        subject: `Nueva sesión de mentoría - ${projectTitle}`,
        html
    });
};

interface MessageNotificationOptions {
    recipientEmail: string;
    senderName: string;
    projectTitle: string;
    messageContent: string;
    projectUrl: string;
}

export const sendNewMessageNotification = async ({
    recipientEmail,
    senderName,
    projectTitle,
    messageContent,
    projectUrl
}: MessageNotificationOptions) => {
    const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px;">
        <h2 style="color: #2563EB; font-size: 20px;">✉️ Nuevo mensaje en ${projectTitle}</h2>
        
        <p>Hola,</p>
        
        <p><strong>${senderName}</strong> ha enviado un nuevo mensaje en el proyecto <strong>${projectTitle}</strong>:</p>
        
        <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #f3f4f6;">
            <div style="color: #374151; font-size: 15px; line-height: 1.6;">
                ${messageContent}
            </div>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="${projectUrl}" 
               style="background: #2563EB; color: white; padding: 12px 24px; 
                      text-decoration: none; border-radius: 6px; display: inline-block;
                      font-weight: bold; font-size: 14px;">
                Responder en la plataforma
            </a>
        </div>
        
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
        
        <p style="color: #6b7280; font-size: 12px; text-align: center;">
            Este es un correo automático de Profe Tabla. Por favor no respondas directamente a este mensaje.
        </p>
    </div>
    `;

    return sendEmail({
        to: recipientEmail,
        subject: `Nuevo mensaje de ${senderName} - ${projectTitle}`,
        html
    });
};
