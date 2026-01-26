import { prisma } from '@/lib/prisma';

export async function logActivity(userId: string, action: string, description: string) {
    try {
        await prisma.activityLog.create({
            data: {
                userId,
                action,
                description
            }
        });
    } catch (error) {
        console.error("Failed to log activity:", error);
        // Fail silently so we don't block the main flow
    }
}
