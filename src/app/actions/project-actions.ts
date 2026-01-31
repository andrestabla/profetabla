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

    const maxStudents = formData.get('maxStudents') ? parseInt(formData.get('maxStudents') as string) : null;
    const startDate = formData.get('startDate') ? new Date(formData.get('startDate') as string) : null;
    const endDate = formData.get('endDate') ? new Date(formData.get('endDate') as string) : null;
    const action = formData.get('action') as string;
    const status = action === 'draft' ? 'DRAFT' : 'OPEN';

    // OPTIONAL: Create Google Drive Folder if configured
    let driveFolderId = null;
    try {
        if (status === 'OPEN') { // Only create drive folder if opening? Or always? Maybe always for consistency.
            driveFolderId = await createProjectFolder(title);
        }
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
            type, // Add the type field to the Prisma create call
            maxStudents,
            startDate,
            endDate,
            teachers: {
                connect: { id: session.user.id }
            },
            status,
            googleDriveFolderId: driveFolderId,
            learningObjects: {
                connect: selectedOAs.map(id => ({ id }))
            }
        }
    });

    revalidatePath('/dashboard/professor/projects');
    revalidatePath('/dashboard/market'); // Update revalidate path
    redirect('/dashboard/market'); // Update redirect to market
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

    const maxStudents = formData.get('maxStudents') ? parseInt(formData.get('maxStudents') as string) : null;
    const startDate = formData.get('startDate') ? new Date(formData.get('startDate') as string) : null;
    const endDate = formData.get('endDate') ? new Date(formData.get('endDate') as string) : null;

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
            maxStudents,
            startDate,
            endDate,
            status: formData.get('status') as 'DRAFT' | 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | undefined,
        }
    });

    // We need the project type to redirect correctly.
    // Since we didn't update the type, we should fetch it or pass it?
    // It's better to fetch it to be safe, or just redirect to 'projects' and let a middleware handle it?
    // But we implemented rewrites, not redirects. So we must redirect to the correct URL.
    const project = await prisma.project.findUnique({ where: { id }, select: { type: true } });

    // Import dynamically to avoid circular deps if any (though usually fine in actions)
    const { getProjectRoute } = await import('@/lib/routes');

    revalidatePath(`/dashboard/professor/projects/${id}`);
    revalidatePath('/dashboard/professor/projects');
    revalidatePath('/dashboard/market');

    // Also revalidate the specific path if possible?
    if (project) {
        const route = getProjectRoute(id, project.type);
        redirect(route);
    } else {
        redirect(`/dashboard/professor/projects/${id}`);
    }
}

export async function applyToProjectAction(projectId: string) {
    console.log(`📡[Server] applyToProjectAction called for project: ${projectId} `);

    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        console.error("❌ [Server] No session or user found");
        throw new Error("Debes iniciar sesión para postularte");
    }

    // LOG START
    await prisma.activityLog.create({
        data: {
            action: 'APPLY_PROJECT_START',
            description: `User ${session.user.email} applying to ${projectId}`,
            metadata: { projectId, userId: session.user.id }
        }
    });

    console.log(`👤[Server] User: ${session.user.id} (${session.user.email})`);

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
            include: { teachers: true }
        });

        const mainTeacher = project?.teachers[0];

        // 1. Send Email to Teacher
        if (mainTeacher && mainTeacher.email) {
            await sendEmail({
                to: mainTeacher.email,
                subject: `Nueva Postulación: ${project.title}`,
                html: `
        <div style="font-family: sans-serif;">
            <h2>¡Un estudiante se ha postulado!</h2>
            <p><strong>${session.user.name}</strong> quiere unirse a tu proyecto/reto:</p>
            <h3 style="color: #2563EB;">${project.title}</h3>
            <p>Visita tu Panel de Profesor para revisar y aceptar la solicitud.</p>
            <br />
            <a href="${process.env.NEXTAUTH_URL}/dashboard/professor/projects/${projectId}" style="background-color: #000; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 8px;">Ir al Proyecto</a>
        </div>
                `
            });
        }

        // 2. Send Confirmation Email to Student (NEW)
        if (session.user.email && project) {
            await sendEmail({
                to: session.user.email,
                subject: `Solicitud Recibida - ${project.title}`,
                html: `
        <div style="font-family: sans-serif; color: #333;">
            <h2>¡Solicitud Enviada!</h2>
            <p>Hola <strong>${session.user.name}</strong>,</p>
            <p>Hemos recibido tu solicitud para unirte al proyecto:</p>
            <h3 style="color: #2563EB;">${project.title}</h3>
            <p>El profesor líder revisará tu perfil y recibirás una notificación cuando tu solicitud sea procesada.</p>
            <p>Puedes ver el estado de tus solicitudes en tu Dashboard.</p>
            <br />
            <a href="${process.env.NEXTAUTH_URL}/dashboard" style="background-color: #64748B; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 8px;">Ir a mi Dashboard</a>
        </div>
                `
            });
            console.log(`✉️ [Server] Confirmation email sent to student: ${session.user.email}`);

            await prisma.activityLog.create({
                data: {
                    action: 'APPLY_PROJECT_EMAIL_SENT',
                    description: `Confirmation email sent to ${session.user.email}`,
                    metadata: { projectId, email: session.user.email }
                }
            });
        }

    } catch (emailError) {
        console.error("Error sending notification email:", emailError);
        const errMsg = emailError instanceof Error ? emailError.message : String(emailError);
        await prisma.activityLog.create({
            data: {
                action: 'APPLY_PROJECT_EMAIL_ERROR',
                description: `Failed to send email: ${errMsg}`,
                metadata: { error: errMsg }
            }
        });
        // Don't fail the action if email fails
    }

    revalidatePath(`/dashboard/market/${projectId}`);
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
            select: { id: true, googleDriveFolderId: true, teachers: { select: { id: true } } }
        });

        if (!project) {
            return { success: false, error: "Proyecto no encontrado" };
        }

        const isMember = project.teachers.some(t => t.id === session.user.id);

        // Verify ownership (if not admin)
        if (session.user.role !== 'ADMIN' && !isMember) {
            return { success: false, error: "No tienes permiso para eliminar este proyecto" };
        }

        // 2. Delete from Google Drive (if linked)
        if (project.googleDriveFolderId) {
            console.log(`🗑️[Delete Project] Deleting Drive Folder: ${project.googleDriveFolderId} `);
            await deleteFolder(project.googleDriveFolderId);
        }

        // 3. Delete from Database (Cascade will handle relations)
        await prisma.project.delete({
            where: { id: projectId }
        });

        console.log(`✅[Delete Project] Deleted project ${projectId} `);

        revalidatePath('/dashboard/professor/projects');
        revalidatePath('/dashboard/market');
        return { success: true };
    } catch (e: unknown) {
        const error = e as Error;
        console.error("❌ [Delete Project] Error:", error);
        return { success: false, error: "Error al eliminar el proyecto" };
    }
}

export async function generateAccessCodeAction(projectId: string) {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== 'TEACHER' && session.user.role !== 'ADMIN')) {
        throw new Error("Unauthorized");
    }

    const code = Math.random().toString(36).substring(2, 8).toUpperCase();

    await prisma.project.update({
        where: { id: projectId },
        data: { accessCode: code }
    });

    revalidatePath(`/dashboard/professor/projects/${projectId}`);
    return code;
}

export async function regenerateAccessCodeAction(projectId: string) {
    return generateAccessCodeAction(projectId);
}

export async function joinByCodeAction(code: string) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        throw new Error("Debes iniciar sesión");
    }

    const project = await prisma.project.findUnique({
        where: { accessCode: code }
    });

    if (!project) {
        throw new Error("Código inválido");
    }

    // Check if already in the project (as student in relation)
    const existingStudent = await prisma.project.findFirst({
        where: {
            id: project.id,
            students: { some: { id: session.user.id } }
        }
    });

    if (existingStudent) {
        throw new Error("Ya eres parte de este proyecto");
    }

    // Add student to project directly
    await prisma.project.update({
        where: { id: project.id },
        data: {
            students: {
                connect: { id: session.user.id }
            }
        }
    });

    return { projectId: project.id };
}

export async function addStudentByEmailAction(projectId: string, email: string) {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== 'TEACHER' && session.user.role !== 'ADMIN')) {
        throw new Error("Unauthorized");
    }

    const user = await prisma.user.findUnique({
        where: { email }
    });

    if (!user) {
        throw new Error("Usuario no encontrado");
    }

    await prisma.project.update({
        where: { id: projectId },
        data: {
            students: {
                connect: { id: user.id }
            }
        }
    });

    revalidatePath(`/dashboard/professor/projects/${projectId}`);
}

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
        // A. Actualizar la postulación seleccionada a ACCEPTED
        await tx.projectApplication.update({
            where: { id: applicationId },
            data: { status: 'ACCEPTED' },
        });

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
