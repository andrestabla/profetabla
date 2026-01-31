'use server';

import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

/**
 * Search for students NOT enrolled in the given project
 */
export async function searchStudentsAction(query: string, projectId: string) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || (session.user.role !== 'TEACHER' && session.user.role !== 'ADMIN')) {
        return { success: false, error: 'Unauthorized' };
    }

    if (!query || query.length < 2) return { success: true, data: [] };

    try {
        const students = await prisma.user.findMany({
            where: {
                role: 'STUDENT',
                OR: [
                    { name: { contains: query, mode: 'insensitive' } },
                    { email: { contains: query, mode: 'insensitive' } }
                ],
                // Exclude students who are ALREADY in this project
                NOT: {
                    projectsAsStudent: {
                        some: { id: projectId }
                    }
                }
            },
            select: {
                id: true,
                name: true,
                email: true,
                avatarUrl: true
            },
            take: 5
        });

        return { success: true, data: students };
    } catch (error) {
        console.error('Error searching students:', error);
        return { success: false, error: 'Failed to search students' };
    }
}

/**
 * Add a student to the project
 */
export async function addStudentToProjectAction(projectId: string, studentId: string) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || (session.user.role !== 'TEACHER' && session.user.role !== 'ADMIN')) {
        return { success: false, error: 'Unauthorized' };
    }

    try {
        await prisma.project.update({
            where: { id: projectId },
            data: {
                students: {
                    connect: { id: studentId }
                }
            }
        });

        revalidatePath(`/dashboard/professor/projects/${projectId}`);
        return { success: true };
    } catch (error) {
        console.error('Error adding student:', error);
        return { success: false, error: 'Failed to add student' };
    }
}

/**
 * Remove a student from the project
 */
export async function removeStudentFromProjectAction(projectId: string, studentId: string) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || (session.user.role !== 'TEACHER' && session.user.role !== 'ADMIN')) {
        return { success: false, error: 'Unauthorized' };
    }

    try {
        await prisma.project.update({
            where: { id: projectId },
            data: {
                students: {
                    disconnect: { id: studentId }
                }
            }
        });

        revalidatePath(`/dashboard/professor/projects/${projectId}`);
        return { success: true };
    } catch (error) {
        console.error('Error removing student:', error);
        return { success: false, error: 'Failed to remove student' };
    }
}
