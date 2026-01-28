'use server';

import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { sendEmail } from '@/lib/email';

export async function createProjectAction(formData: FormData) {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== 'TEACHER' && session.user.role !== 'ADMIN')) {
        throw new Error("Unauthorized");
    }

    const title = formData.get('title') as string;
    const type = (formData.get('type') as 'PROJECT' | 'CHALLENGE' | 'PROBLEM') || 'PROJECT';
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

    // Get selected OAs
    const selectedOAs = formData.getAll('selectedOAs') as string[];

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
            status: 'OPEN',
            learningObjects: {
                connect: selectedOAs.map(id => ({ id }))
            }
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

export async function applyToProjectAction(projectId: string) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        throw new Error("Debes iniciar sesión para postularte");
    }

    // Check if already applied
    const existing = await prisma.projectApplication.findUnique({
        where: {
            projectId_studentId: {
                projectId,
                studentId: session.user.id
            }
        }
    });

    if (existing) {
        throw new Error("Ya te has postulado a este proyecto");
    }

    await prisma.projectApplication.create({
        data: {
            projectId,
            studentId: session.user.id,
            status: 'PENDING'
        }
    });

    // Notify Teacher
    try {
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            include: { teacher: true }
        });

        if (project && project.teacher.email) {
            await sendEmail({
                to: project.teacher.email,
                subject: `Nueva Postulación: ${project.title}`,
                html: `
                    <div style="font-family: sans-serif;">
                        <h2>¡Un estudiante se ha postulado!</h2>
                        <p><strong>${session.user.name}</strong> quiere unirse a tu proyecto/reto:</p>
                        <h3 style="color: #2563EB;">${project.title}</h3>
                        <p>Visita tu Panel de Profesor para revisar y aceptar la solicitud.</p>
                        <br/>
                        <a href="${process.env.NEXTAUTH_URL}/dashboard/professor/projects/${projectId}" style="background-color: #000; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 8px;">Ir al Proyecto</a>
                    </div>
                `
            });
        }
    } catch (emailError) {
        console.error("Error sending notification email:", emailError);
        // Don't fail the action if email fails
    }

    revalidatePath(`/dashboard/projects/market/${projectId}`);
}
