'use server';

import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function getSystemLogs({
    page = 1,
    limit = 50,
    userId,
    level
}: {
    page?: number;
    limit?: number;
    userId?: string;
    level?: string;
}) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
        throw new Error('Unauthorized');
    }

    const where = {
        ...(userId && { userId }),
        ...(level && { level })
    };

    const [logs, total] = await Promise.all([
        prisma.activityLog.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            skip: (page - 1) * limit,
            take: limit,
            include: { user: { select: { email: true, name: true, role: true } } }
        }),
        prisma.activityLog.count({ where })
    ]);

    return {
        logs,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
        }
    };
}

export async function getUserActivityLogs(userId: string) {
    const session = await getServerSession(authOptions);
    // User can see their own logs, Admin can see anyone's
    if (!session || (session.user.id !== userId && session.user.role !== 'ADMIN')) {
        throw new Error('Unauthorized');
    }

    const logs = await prisma.activityLog.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 50, // Limit history for profile
    });

    return logs;
}

export async function getLogUsers() {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
        throw new Error('Unauthorized');
    }

    // Get users who actually have logs
    const usersWithLogs = await prisma.user.findMany({
        where: {
            activityLogs: {
                some: {}
            }
        },
        select: {
            id: true,
            email: true,
            name: true,
            role: true
        },
        orderBy: { email: 'asc' }
    });

    return usersWithLogs;
}
