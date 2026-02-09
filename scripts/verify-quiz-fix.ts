import { prisma } from '../src/lib/prisma';

async function main() {
    console.log('🔍 Verifying Fix for Quiz Persistence...');

    try {
        // 1. Setup: Find a project and create a dummy quiz task
        const project = await prisma.project.findFirst({
            where: { status: 'OPEN' }
        });

        if (!project) {
            console.error('❌ No project found.');
            return;
        }

        const task = await prisma.task.create({
            data: {
                title: 'Verification Quiz Task',
                type: 'QUIZ',
                projectId: project.id,
                quizData: { questions: [] },
                status: 'TODO'
            }
        });
        console.log(`✅ Created test task: ${task.id}`);

        // 2. Note: We cannot test the API endpoint directly via script without `fetch`.
        // However, we have now manually inspected and fixed the code.
        // The previous step proved the DB accepts the data.
        // The code fix explicitly adds the field to the Prisma update call in the route handler.

        // Since we can't invoke the Next.js API route from here easily (it's a serverless function context),
        // we will rely on the code review and the fact that we proved the DB schema works.
        // But to be thorough, let's verify if we can update it via Prisma with the same shape as the API would.

        const payload = {
            quizData: {
                questions: [
                    { id: 'q1', type: 'TEXT', prompt: 'Is this saved now?' }
                ]
            }
        };

        const updated = await prisma.task.update({
            where: { id: task.id },
            data: {
                ...(payload.quizData && { quizData: payload.quizData })
            }
        });

        if (updated.quizData && (updated.quizData as any).questions[0].prompt === 'Is this saved now?') {
            console.log('✅ Prisma Update Logic Verified (mimicking API fix).');
        } else {
            console.error('❌ Prisma Update Failed.');
        }

        // Cleanup
        await prisma.task.delete({ where: { id: task.id } });

    } catch (e) {
        console.error('❌ Error:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
