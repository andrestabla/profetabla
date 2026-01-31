import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function auditTraceability() {
    console.log('--- Auditoría de Trazabilidad Kanban -> Entregas ---');

    // 1. Verificar tareas obligatorias con entregable que DEBEN tener entrega
    const tasksWithDeliverable = await prisma.task.findMany({
        where: {
            isMandatory: true,
            NOT: {
                deliverable: null,
                OR: [{ deliverable: '' }]
            }
        },
        include: { assignment: true }
    });

    let missingAssignments = 0;
    tasksWithDeliverable.forEach(task => {
        if (!task.assignment) {
            console.warn(`[ERROR] Tarea "${task.title}" (ID: ${task.id}) no tiene entrega asociada.`);
            missingAssignments++;
        }
    });

    console.log(`- Tareas obligatorias analizadas: ${tasksWithDeliverable.length}`);
    console.log(`- Entregas faltantes detectadas: ${missingAssignments}`);

    // 2. Verificar que no haya entregas duplicadas para una misma tarea (ya garantizado por @unique, pero auditamos)
    const assignments = await prisma.assignment.findMany({
        where: { taskId: { not: null } },
        select: { taskId: true }
    });

    const taskIdCounts = assignments.reduce((acc, curr) => {
        const id = curr.taskId!;
        acc[id] = (acc[id] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const duplicates = Object.values(taskIdCounts).filter(count => count > 1).length;
    console.log(`- Entregas duplicadas por tarea: ${duplicates}`);

    // 3. Verificar que todas las entregas apunten al mismo proyecto que su tarea
    const mismatchedProjects = await prisma.assignment.findMany({
        where: { task: { isNot: null } },
        include: { task: true }
    });

    let projectMismatches = 0;
    mismatchedProjects.forEach(a => {
        if (a.projectId !== a.task?.projectId) {
            console.warn(`[ERROR] Entrega "${a.title}" apunta a proyecto diferente que su tarea.`);
            projectMismatches++;
        }
    });
    console.log(`- Desajustes de Proyecto detectados: ${projectMismatches}`);

    console.log('--- Auditoría finalizada ---');
}

auditTraceability()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
