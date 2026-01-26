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
    const justification = formData.get('justification') as string;
    const objectives = formData.get('objectives') as string;
    const deliverables = formData.get('deliverables') as string;
    const methodology = formData.get('methodology') as string;
    const resourcesDescription = formData.get('resourcesDescription') as string;
    const schedule = formData.get('schedule') as string;
    const budget = formData.get('budget') as string;
    const evaluation = formData.get('evaluation') as string;
    const kpis = formData.get('kpis') as string;

    await prisma.project.create({
        data: {
            title,
            description,
            industry,
            justification,
            objectives,
            deliverables,
            methodology,
            resourcesDescription,
            schedule,
            budget,
            evaluation,
            kpis,
            teacherId: session.user.id,
            status: 'OPEN' // Default status
        }
    });

    revalidatePath('/dashboard/professor/projects');
    revalidatePath('/dashboard/projects/market');
    redirect('/dashboard/professor/projects');
}

export async function updateProjectAction(formData: FormData) {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== 'TEACHER' && session.user.role !== 'ADMIN')) {
        throw new Error("Unauthorized");
    }

    const id = formData.get('id') as string;
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const industry = formData.get('industry') as string;
    const justification = formData.get('justification') as string;
    const objectives = formData.get('objectives') as string;
    const deliverables = formData.get('deliverables') as string;
    const methodology = formData.get('methodology') as string;
    const resourcesDescription = formData.get('resourcesDescription') as string;
    const schedule = formData.get('schedule') as string;
    const budget = formData.get('budget') as string;
    const evaluation = formData.get('evaluation') as string;
    const kpis = formData.get('kpis') as string;

    await prisma.project.update({
        where: { id },
        data: {
            title,
            description,
            industry,
            justification,
            objectives,
            deliverables,
            methodology,
            resourcesDescription,
            schedule,
            budget,
            evaluation,
            kpis,
        }
    });

    revalidatePath(`/dashboard/professor/projects/${id}`);
    revalidatePath('/dashboard/professor/projects');
    revalidatePath('/dashboard/projects/market');
    redirect(`/dashboard/professor/projects/${id}`);
}
