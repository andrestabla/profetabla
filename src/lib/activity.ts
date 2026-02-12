import { prisma } from '@/lib/prisma';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function logActivity(userId: string | undefined, action: string, description: string, level: 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL' = 'INFO', metadata?: any) {
    try {
        await prisma.activityLog.create({
            data: {
                userId,
                action,
                description,
                level,
                metadata: metadata ? metadata : undefined
            }
        });
    } catch (error) {
        console.error("Failed to log activity:", error);
        // Fail silently so we don't block the main flow
    }
}
