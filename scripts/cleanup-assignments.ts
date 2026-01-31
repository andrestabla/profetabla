import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- Iniciando limpieza de Entregas (Assignments) ---');

    // 1. Eliminar entregas que NO tienen una tarea asociada (huérfanas totales)
    const orphans = await prisma.assignment.deleteMany({
        where: {
            taskId: { not: null },
            task: null
        }
    });
    console.log(`- Entregas huérfanas borradas: ${orphans.count}`);

    // 2. Eliminar entregas donde la tarea asociada NO tiene un 'deliverable' definido
    // Primero buscamos los IDs de las tareas que NO tienen deliverable pero sí tienen una entrega asociada
    const tasksWithAssignmentsNoDeliverable = await prisma.task.findMany({
        where: {
            assignment: { isNot: null },
            OR: [
                { deliverable: null },
                { deliverable: '' }
            ]
        },
        select: { id: true }
    });

    const taskIdsToCleanup = tasksWithAssignmentsNoDeliverable.map(t => t.id);

    const cleanedUp = await prisma.assignment.deleteMany({
        where: {
            taskId: { in: taskIdsToCleanup }
        }
    });

    console.log(`- Entregas sin "entregable" borradas: ${cleanedUp.count}`);
    console.log('--- Limpieza completada con éxito ---');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
