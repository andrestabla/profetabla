'use server';

import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';

import { sendEmail } from '@/lib/email';

export async function acceptStudentAction(formData: FormData) {
    const applicationId = formData.get('applicationId') as string;
    const projectId = formData.get('projectId') as string;
    const studentId = formData.get('studentId') as string;

    // LOG START
    await prisma.activityLog.create({
        data: {
            action: 'ACCEPT_STUDENT_START',
            description: `Starting acceptance for student ${studentId} in project ${projectId}`,
            metadata: { applicationId, projectId, studentId }
        }
    });

    console.log(`🚀 [Action] Accepting Student: App=${applicationId}, Project=${projectId}, Student=${studentId}`);

    // Fetch necessary data for email
    const [student, project] = await Promise.all([
        prisma.user.findUnique({ where: { id: studentId }, select: { email: true, name: true } }),
        prisma.project.findUnique({ where: { id: projectId }, select: { title: true } })
    ]);

    if (!student || !project) {
        await prisma.activityLog.create({
            data: {
                action: 'ACCEPT_STUDENT_ERROR',
                description: 'Student or Project not found',
                metadata: { studentId, projectId, foundStudent: !!student, foundProject: !!project }
            }
        });
        console.error("❌ [Action] Student or Project not found for email");
    }

    // 1. Iniciar una transacción de Prisma
    await prisma.$transaction(async (tx) => {
        // ... transaction code ...
        // A. Actualizar la postulación seleccionada a ACCEPTED
        await tx.projectApplication.update({
            where: { id: applicationId },
            data: { status: 'ACCEPTED' },
        });

        // const projectData = await tx.project.findUnique({ where: { id: projectId }, include: { students: true } }); // Unused

        await tx.project.update({
            where: { id: projectId },
            data: {
                students: {
                    connect: { id: studentId }
                },
                status: 'IN_PROGRESS'
            },
        });

        // D. Create Task
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

    const session = await import('@/lib/auth').then(m => import('next-auth').then(na => na.getServerSession(m.authOptions)));

    // Send Email Notification
    if (student?.email && project?.title) {
        try {
            await prisma.activityLog.create({
                data: {
                    action: 'ACCEPT_STUDENT_EMAIL_ATTEMPT',
                    description: `Sending email to ${student.email}`,
                    metadata: { studentEmail: student.email }
                }
            });

            // 1. Email to Student
            const emailResult = await sendEmail({
                to: student.email,
                subject: `¡Has sido aceptado! - ${project.title}`,
                html: `
                    <div style="font-family: sans-serif; color: #333;">
                        <h2>¡Felicidades, ${student.name || 'Estudiante'}!</h2>
                        <p>Tu solicitud para unirte al proyecto <strong>${project.title}</strong> ha sido aceptada.</p>
                        <p>Ahora tienes acceso al Tablero Kanban y a los recursos del proyecto.</p>
                        <br/>
                        <a href="${process.env.NEXTAUTH_URL || 'https://profetabla.com'}/dashboard" 
                           style="background-color: #2563EB; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 8px;">
                           Ir al Dashboard
                        </a>
                    </div>
                `
            });

            await prisma.activityLog.create({
                data: {
                    action: 'ACCEPT_STUDENT_EMAIL_RESULT',
                    description: emailResult.success ? 'Success' : 'Failed',
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    metadata: emailResult as any
                }
            });

            // 2. Email Copy to Professor
            if (session?.user?.email) {
                await sendEmail({
                    to: session.user.email,
                    subject: `[Copia] Aceptaste a ${student.name} en ${project.title}`,
                    html: `
                        <div style="font-family: sans-serif; color: #555;">
                            <p>Has aceptado exitosamente a <strong>${student.name}</strong> (${student.email}) en el proyecto.</p>
                        </div>
                    `
                });
            }

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            await prisma.activityLog.create({
                data: {
                    action: 'ACCEPT_STUDENT_EMAIL_EXCEPTION',
                    description: errorMessage,
                    metadata: { error: errorMessage }
                }
            });
            console.error("❌ [Email Error] Failed to send acceptance email:", error);
        }
    } else {
        await prisma.activityLog.create({
            data: {
                action: 'ACCEPT_STUDENT_EMAIL_SKIPPED',
                description: 'Missing email or title',
                metadata: { studentEmail: student?.email, projectTitle: project?.title }
            }
        });
    }

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
