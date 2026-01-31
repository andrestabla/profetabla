'use server';

import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

export async function createProjectAction(formData: FormData) {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'TEACHER') {
        throw new Error('Unauthorized');
    }

    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const industry = formData.get('industry') as string;
    const justification = formData.get('justification') as string;
    const objectives = formData.get('objectives') as string;
    const deliverables = formData.get('deliverables') as string;

    // 1. Extraer los datos JSON generados por la IA (si existen)
    const aiTasksJson = formData.get('aiTasks') as string;
    const aiResourcesJson = formData.get('aiResources') as string;


    const initialTasks = aiTasksJson ? JSON.parse(aiTasksJson) : [];

    const initialResources = aiResourcesJson ? JSON.parse(aiResourcesJson) : [];

    // 2. Transacción Atómica: Crea Proyecto + Tareas + Recursos
    const newProject = await prisma.$transaction(async (tx) => {
        // A. Crear Proyecto
        const project = await tx.project.create({
            data: {
                title,
                description,
                industry,
                justification,
                objectives,
                deliverables,
                status: 'OPEN',
                teachers: { connect: { id: session.user.id } },
                isGroup: formData.get('isGroup') === 'on'
            }
        });

        // B. Crear Tareas del Kanban (Mapeo directo desde la IA)
        if (initialTasks.length > 0) {
            await tx.task.createMany({
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                data: initialTasks.map((task: any) => ({
                    title: task.title,
                    description: task.description,
                    priority: task.priority || 'MEDIUM',
                    status: 'TODO',
                    projectId: project.id
                }))
            });
        }

        // C. Crear Recursos sugeridos
        if (initialResources.length > 0) {
            // Necesitamos asegurarnos de tener una categoría por defecto
            let category = await tx.resourceCategory.findFirst({ where: { name: 'Recursos IA' } });
            if (!category) {
                category = await tx.resourceCategory.create({
                    data: { name: 'Recursos IA', color: 'indigo' }
                });
            }

            await tx.resource.createMany({
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                data: initialResources.map((res: any) => ({
                    title: res.title,
                    url: res.url.startsWith('http') ? res.url : `https://google.com/search?q=${encodeURIComponent(res.url)}`, // Fallback si la IA devuelve algo genérico
                    type: res.type || 'ARTICLE',
                    projectId: project.id,
                    categoryId: category!.id
                }))
            });
        }

        return project;
    });

    revalidatePath('/dashboard/professor/projects');
    redirect(`/dashboard/professor/projects/${newProject.id}/kanban`);
}
