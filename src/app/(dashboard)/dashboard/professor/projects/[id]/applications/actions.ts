'use server';

import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';

import { sendEmail } from '@/lib/email';

export async function acceptStudentAction(formData: FormData) {
    const applicationId = formData.get('applicationId') as string;
    const projectId = formData.get('projectId') as string;
    const studentId = formData.get('studentId') as string;

    console.log(`🚀 [Action] Accepting Student: App=${applicationId}, Project=${projectId}, Student=${studentId}`);

    // Fetch necessary data for email
    const [student, project] = await Promise.all([
        prisma.user.findUnique({ where: { id: studentId }, select: { email: true, name: true } }),
        prisma.project.findUnique({ where: { id: projectId }, select: { title: true } })
    ]);

    if (!student || !project) {
        console.error("❌ [Action] Student or Project not found for email");
    }

    // 1. Iniciar una transacción de Prisma (para asegurar que todos los cambios ocurran a la vez)
    await prisma.$transaction(async (tx) => {
        // A. Actualizar la postulación seleccionada a ACCEPTED
        await tx.projectApplication.update({
            where: { id: applicationId },
            data: { status: 'ACCEPTED' },
        });

        // B. (REMOVED) Previously we rejected all other applications. 
        // With M-N support, we allow multiple students to be accepted. 
        // The professor can manually reject others if needed.

        // C. El cambio principal: Asignar el estudiante al Proyecto y cambiar estado a IN_PROGRESS
        const projectData = await tx.project.findUnique({ where: { id: projectId }, include: { students: true } });

        await tx.project.update({
            where: { id: projectId },
            data: {
                students: {
                    connect: { id: studentId }
                },
                status: 'IN_PROGRESS' // Keep this for now as it was there
            },
        });


        // D. (Opcional) Crear la primera tarea automática en el Kanban del proyecto
        const existingTasks = await tx.task.count({ where: { projectId } });
        if (existingTasks === 0) {
            await tx.task.create({
                data: {
                    title: "Reunión Inicial: Revisión de Objetivos con el Tutor",
                    projectId: projectId,
                    priority: "HIGH",
                    status: "TODO"
                }
            });
        }
    });

    console.log("✅ [Action] DB Update success. Sending email...");

    // Send Email Notification
    if (student?.email && project?.title) {
        try {
            await sendEmail({
                to: student.email,
                subject: `¡Has sido aceptado! - ${project.title}`,
                html: `
                    <div style="font-family: sans-serif; color: #333;">
                        <h2>¡Felicidades, ${student.name || 'Estudiante'}!</h2>
                        <p>Tu solicitud para unirte al proyecto <strong>${project.title}</strong> ha sido aceptada.</p>
                        <p>Ahora tienes acceso al Tablero Kanban y a los recursos del proyecto.</p>
                        <br/>
                        <br/>
                        <br/>
                        <br/>
                        <a href="${process.env.NEXTAUTH_URL || 'https://profetabla.com'}/dashboard" 
                           style="background-color: #2563EB; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 8px;">
                           Ir al Dashboard
                        </a>
                    </div>
                `
            });
            console.log(`✅ [Email Sent] To: ${student.email}`);
        } catch (error) {
            console.error("❌ [Email Error] Failed to send acceptance email:", error);
        }
    }

    // 2. Redirigir al profesor al Tablero Kanban de este proyecto, que ya está activo
    redirect(`/dashboard/professor/projects/${projectId}/kanban`);
}

export async function rejectStudentAction(formData: FormData) {
    const applicationId = formData.get('applicationId') as string;

    // We need to fetch details before updating/redirecting to send email
    const application = await prisma.projectApplication.findUnique({
        where: { id: applicationId },
        include: {
            student: { select: { email: true, name: true } },
            project: { select: { title: true, id: true } }
        }
    });

    if (!application) {
        redirect(`/dashboard/professor/projects`);
    }

    await prisma.projectApplication.update({
        where: { id: applicationId },
        data: { status: 'REJECTED' },
    });

    // Send Rejection Email
    if (application.student?.email && application.project?.title) {
        try {
            await sendEmail({
                to: application.student.email,
                subject: `Actualización de tu postulación - ${application.project.title}`,
                html: `
                    <div style="font-family: sans-serif; color: #333;">
                        <h2>Hola, ${application.student.name || 'Estudiante'}</h2>
                        <p>Gracias por tu interés en el proyecto <strong>${application.project.title}</strong>.</p>
                        <p>En esta ocasión, el profesor ha decidido no avanzar con tu solicitud.</p>
                        <p>Te animamos a explorar otros proyectos disponibles en la plataforma.</p>
                        <br/>
                        <a href="${process.env.NEXTAUTH_URL}/dashboard/student/projects" 
                           style="background-color: #64748B; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 8px;">
                           Ver otros Proyectos
                        </a>
                    </div>
                `
            });
            console.log(`✅ [Email Sent] Rejection to: ${application.student.email}`);
        } catch (error) {
            console.error("❌ [Email Error] Failed to send rejection email:", error);
        }
    }

    // Recarga la página actual para mostrar el siguiente candidato
    redirect(`/dashboard/professor/projects/${application.project.id}/applications`);
}
