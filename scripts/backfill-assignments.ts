
import { prisma } from '../src/lib/prisma';

async function backfillAssignments() {
    console.log('Starting assignment backfill...');

    // Find all mandatory tasks that do NOT have an assignment
    const tasksWithoutAssignment = await prisma.task.findMany({
        where: {
            isMandatory: true,
            assignment: { is: null }
        },
        include: { project: true }
    });

    console.log(`Found ${tasksWithoutAssignment.length} mandatory tasks without assignment.`);

    let count = 0;
    for (const task of tasksWithoutAssignment) {
        try {
            await prisma.assignment.create({
                data: {
                    title: `Entrega: ${task.title}`,
                    projectId: task.projectId,
                    taskId: task.id,
                    dueDate: task.dueDate,
                    evaluationCriteria: task.evaluationCriteria || "Criterio General",
                    description: `Entrega asociada a la tarea: ${task.title}. ${task.description || ''}`,
                }
            });
            count++;
            console.log(`Created assignment for task: ${task.title}`);
        } catch (error) {
            console.error(`Failed to create assignment for task ${task.id}:`, error);
        }
    }

    console.log(`\nBackfill migration completed. Created ${count} assignments.`);
}

backfillAssignments()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
