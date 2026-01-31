'use server';

import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function acceptPoliciesAction() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        throw new Error("No estás autenticado");
    }

    await prisma.user.update({
        where: { id: session.user.id },
        data: {
            policiesAccepted: true,
            policiesAcceptedAt: new Date(),
        }
    });

    revalidatePath('/', 'layout');
    return { success: true };
}

export async function deleteAccountAction() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        throw new Error("No estás autenticado");
    }

    await prisma.user.delete({
        where: { id: session.user.id }
    });

    revalidatePath('/', 'layout');
    return { success: true };
}
