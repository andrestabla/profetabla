'use server';

import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { sendEmail } from '@/lib/email';
import { createProjectFolder, deleteFolder } from '@/lib/google-drive';

export async function createProjectAction(formData: FormData) {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== 'TEACHER' && session.user.role !== 'ADMIN')) {
        throw new Error("Unauthorized");
    }

    const title = formData.get('title') as string;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
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

    // OPTIONAL: Create Google Drive Folder if configured
    let driveFolderId = null;
    try {
        driveFolderId = await createProjectFolder(title);
    } catch (e) {
        console.error("Failed to create Drive folder:", e);
    }

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
            googleDriveFolderId: driveFolderId,
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
    console.log(`📡 [Server] applyToProjectAction called for project: ${projectId}`);

    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        console.error("❌ [Server] No session or user found");
        throw new Error("Debes iniciar sesión para postularte");
    }
    console.log(`👤 [Server] User: ${session.user.id} (${session.user.email})`);

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
        console.warn("⚠️ [Server] Application already exists");
        throw new Error("Ya te has postulado a este proyecto");
    }

    await prisma.projectApplication.create({
        data: {
            projectId,
            studentId: session.user.id,
            status: 'PENDING'
        }
    });
    console.log("✅ [Server] ProjectApplication record created");

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

export async function deleteProjectAction(projectId: string) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || (session.user.role !== 'TEACHER' && session.user.role !== 'ADMIN')) {
            return { success: false, error: "No autorizado" };
        }

        // 1. Get Project to find Drive Folder ID and author
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            select: { id: true, googleDriveFolderId: true, teacherId: true }
        });

        if (!project) {
            return { success: false, error: "Proyecto no encontrado" };
        }

        // Verify ownership (if not admin)
        if (session.user.role !== 'ADMIN' && project.teacherId !== session.user.id) {
            return { success: false, error: "No tienes permiso para eliminar este proyecto" };
        }

        // 2. Delete from Google Drive (if linked)
        if (project.googleDriveFolderId) {
            console.log(`🗑️ [Delete Project] Deleting Drive Folder: ${project.googleDriveFolderId}`);
            await deleteFolder(project.googleDriveFolderId);
        }

        // 3. Delete from Database (Cascade will handle relations)
        await prisma.project.delete({
            where: { id: projectId }
        });

        console.log(`✅ [Delete Project] Deleted project ${projectId}`);

        revalidatePath('/dashboard/professor/projects');
        revalidatePath('/dashboard/projects/market');
        return { success: true };
    } catch (e: unknown) {
        const error = e as Error;
        console.error("❌ [Delete Project] Error:", error);
        return { success: false, error: "Error al eliminar el proyecto" };
    }
}
