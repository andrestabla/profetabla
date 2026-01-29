'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function addResourceCommentAction(resourceId: string, content: string) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return { success: false, error: 'No autorizado' };
        }

        if (!content.trim()) {
            return { success: false, error: 'El comentario no puede estar vacío' };
        }

        const comment = await prisma.comment.create({
            data: {
                content,
                resourceId,
                authorId: session.user.id,
            },
            include: {
                author: {
                    select: {
                        name: true,
                        avatarUrl: true,
                    }
                }
            }
        });

        revalidatePath(`/dashboard/learning/resource/${resourceId}`);
        return { success: true, data: comment };
    } catch (e) {
        console.error('Error adding comment:', e);
        return { success: false, error: 'Error al publicar el comentario' };
    }
}

export async function getResourceCommentsAction(resourceId: string) {
    try {
        // No strict auth needed to read? Maybe yes. Let's assume yes.
        const session = await getServerSession(authOptions);
        if (!session) return { success: false, error: 'No autorizado' };

        const comments = await prisma.comment.findMany({
            where: { resourceId },
            include: {
                author: {
                    select: {
                        name: true,
                        avatarUrl: true,
                        role: true, // Useful to highlight professor comments
                        id: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        // Serialize dates
        const safeComments = comments.map(c => ({
            ...c,
            createdAt: c.createdAt.toISOString()
        }));

        return { success: true, data: safeComments };
    } catch (e) {
        console.error('Error fetching comments:', e);
        return { success: false, error: 'Error al obtener comentarios' };
    }
}

export async function deleteResourceCommentAction(commentId: string) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) return { success: false, error: 'No autorizado' };

        const comment = await prisma.comment.findUnique({
            where: { id: commentId },
            select: { authorId: true, resourceId: true }
        });

        if (!comment) return { success: false, error: 'Comentario no encontrado' };

        // Allow deletion if author or admin/teacher
        const isAuthor = comment.authorId === session.user.id;
        const isAdminOrTeacher = ['ADMIN', 'TEACHER'].includes(session.user.role);

        if (!isAuthor && !isAdminOrTeacher) {
            return { success: false, error: 'No tienes permiso para eliminar este comentario' };
        }

        await prisma.comment.delete({ where: { id: commentId } });

        if (comment.resourceId) {
            revalidatePath(`/dashboard/learning/resource/${comment.resourceId}`);
        }

        return { success: true };
    } catch (e) {
        console.error('Error deleting comment:', e);
        return { success: false, error: 'Error al eliminar comentario' };
    }
}
