import { prisma } from '../src/lib/prisma';

async function main() {
    console.log('🔍 Starting Reproduction of Quiz Update Issue...');

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
                title: 'Reproduction Quiz Task',
                type: 'QUIZ',
                projectId: project.id,
                quizData: { questions: [] }, // Empty initially
                status: 'TODO'
            }
        });
        console.log(`✅ Created initial task: ${task.id}`);

        // 2. Simulate PATCH request logic (What the API does)
        const updatePayload = {
            id: task.id,
            quizData: {
                questions: [
                    { id: 'q1', type: 'TEXT', prompt: 'Is this saved?' }
                ]
            }
        };

        // Mimic the API route logic EXACTLY as it is now
        // Reading the file logic previously viewed:
        // const { title, ..., quizData } = body;
        // prisma.task.update({ data: { ... } }) -> quizData was MISSING in the code view!

        console.log('Attempting update with new questions...');

        const updatedTask = await prisma.task.update({
            where: { id: task.id },
            data: {
                // Simulating the BUG: quizData is destructured but NOT PASSED to update
                // ...(quizData && { quizData }), <--- This is what should be there
                // But based on my file read, it was missing. 
                // So I will just print what the DB has after a theoretical "update" that misses it.
            }
        });

        // Wait, to reproduce it "black box" style I should call the API? 
        // I can't easily call the Next.js API from a script without running the server.
        // Instead, I will use this script to fix the data MANUALLY to verify the database accepts it,
        // then I'll fix the code. 

        // Actually, let's just use this script to PROVE the database schema accepts updates.
        // The bug is definitely in the code.

        console.log('Verifying DB Schema accepts update...');
        const fixedTask = await prisma.task.update({
            where: { id: task.id },
            data: {
                quizData: updatePayload.quizData
            }
        });

        if (fixedTask.quizData && (fixedTask.quizData as any).questions.length > 0) {
            console.log('✅ DB Schema works. The bug is definitely in route.ts missing the field.');
        } else {
            console.error('❌ DB Update Failed even with correct code?');
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
