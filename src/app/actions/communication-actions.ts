'use server';

import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { sendNewMessageNotification } from '@/lib/email';
import { revalidatePath } from 'next/cache';
import { Role } from '@prisma/client';

export async function sendMessageAction(formData: {
    projectId: string;
    content: string;
    recipientIds: string[]; // User IDs
    parentId?: string;
}) {
    const session = await getServerSession();
    if (!session?.user?.email) {
        return { success: false, error: 'No autorizado' };
    }

    const author = await prisma.user.findUnique({
        where: { email: session.user.email }
    });

    if (!author) return { success: false, error: 'Usuario no encontrado' };

    // Verify user participation in the project
    const project = await prisma.project.findFirst({
        where: {
            id: formData.projectId,
            OR: [
                { teachers: { some: { id: author.id } } },
                { students: { some: { id: author.id } } }
            ]
        }
    });

    if (!project) return { success: false, error: 'No tienes permiso para enviar mensajes en este proyecto' };

    try {
        const message = await prisma.message.create({
            data: {
                content: formData.content,
                projectId: formData.projectId,
                authorId: author.id,
                parentId: formData.parentId || null,
                recipients: {
                    connect: formData.recipientIds.map(id => ({ id }))
                }
            },
            include: {
                project: true,
                recipients: true,
                author: true
            }
        });

        // Send Email Notifications
        const projectUrl = `${process.env.NEXTAUTH_URL || 'https://profetabla.com'}/dashboard/projects/${formData.projectId}`;

        const notificationPromises = message.recipients.map(recipient =>
            sendNewMessageNotification({
                recipientEmail: recipient.email,
                senderName: author.name || author.email,
                projectTitle: message.project.title,
                messageContent: message.content,
                projectUrl
            })
        );

        await Promise.all(notificationPromises);

        revalidatePath(`/dashboard/projects/${formData.projectId}`);
        revalidatePath(`/dashboard/student/projects/${formData.projectId}`);
        revalidatePath('/dashboard'); // Main dashboard has comms now
        return { success: true, messageId: message.id };
    } catch (error) {
        console.error('[sendMessageAction] Error:', error);
        return { success: false, error: 'Error al enviar el mensaje' };
    }
}

export async function getProjectMessagesAction(projectId: string) {
    const session = await getServerSession();
    if (!session?.user?.email) {
        return { success: false, error: 'No autorizado' };
    }

    const user = await prisma.user.findUnique({
        where: { email: session.user.email }
    });

    if (!user) return { success: false, error: 'Usuario no encontrado' };

    try {
        // Fetch messages where user is author OR recipient
        // Grouped by project
        const messages = await prisma.message.findMany({
            where: {
                projectId,
                OR: [
                    { authorId: user.id },
                    { recipients: { some: { id: user.id } } }
                ]
            },
            include: {
                author: {
                    select: { id: true, name: true, avatarUrl: true, role: true }
                },
                recipients: {
                    select: { id: true, name: true, avatarUrl: true }
                },
                replies: {
                    include: {
                        author: {
                            select: { id: true, name: true, avatarUrl: true, role: true }
                        }
                    },
                    orderBy: { createdAt: 'asc' }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        return { success: true, messages };
    } catch (error) {
        console.error('[getProjectMessagesAction] Error:', error);
        return { success: false, error: 'Error al obtener mensajes' };
    }
}

export async function getProjectParticipantsAction(projectId: string) {
    const session = await getServerSession();
    if (!session?.user?.email) {
        return { success: false, error: 'No autorizado' };
    }

    try {
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            include: {
                teachers: {
                    select: { id: true, name: true, email: true, role: true, avatarUrl: true }
                },
                students: {
                    select: { id: true, name: true, email: true, role: true, avatarUrl: true }
                }
            }
        });

        if (!project) return { success: false, error: 'Proyecto no encontrado' };

        return {
            success: true,
            participants: [...project.teachers, ...project.students]
        };
    } catch (error) {
        console.error('[getProjectParticipantsAction] Error:', error);
        return { success: false, error: 'Error al obtener participantes' };
    }
}
