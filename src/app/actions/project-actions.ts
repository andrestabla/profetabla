'use server';

import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

export async function createProjectAction(formData: FormData) {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== 'TEACHER' && session.user.role !== 'ADMIN')) {
        throw new Error("Unauthorized");
    }

    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const industry = formData.get('industry') as string;
    const objectives = formData.get('objectives') as string;
    const deliverables = formData.get('deliverables') as string;

    await prisma.project.create({
        data: {
            title,
            description,
            industry,
            objectives,
            deliverables,
            teacherId: session.user.id,
            status: 'OPEN' // Default status
        }
    });

    revalidatePath('/dashboard/professor/projects');
    revalidatePath('/dashboard/projects/market');
    redirect('/dashboard/professor/projects');
}
