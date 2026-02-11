import { PrismaClient } from '@prisma/client';
import { calculateTotalQuizScore } from '../src/lib/quiz-utils';

const prisma = new PrismaClient();

async function main() {
    console.log('--- Iniciando sincronización de notas de cuestionarios ---');

    // Buscamos todas las entregas que no tienen nota y pertenecen a actividades tipo QUIZ con modo AUTO
    const submissions = await prisma.submission.findMany({
        where: {
            grade: null,
            assignment: {
                task: {
                    type: 'QUIZ'
                }
            }
        },
        include: {
            assignment: {
                include: {
                    task: true
                }
            }
        }
    });

    // Filtramos manualmente por gradingMethod === 'AUTO' ya que quizData es un JSON
    const autoGradedSubmissions = submissions.filter(sub => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const quizData = sub.assignment.task?.quizData as any;
        return quizData?.gradingMethod === 'AUTO';
    });

    console.log(`Se encontraron ${autoGradedSubmissions.length} entregas sin nota de cuestionarios AUTO.`);

    for (const sub of autoGradedSubmissions) {
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const quizData = sub.assignment.task?.quizData as any;
            if (!quizData || !quizData.questions) {
                console.warn(`Entrega ${sub.id} no tiene datos de preguntas válidos.`);
                continue;
            }

            const answers = (sub.answers as Record<string, string>) || {};
            const grade = calculateTotalQuizScore(quizData.questions, answers);

            await prisma.submission.update({
                where: { id: sub.id },
                data: { grade }
            });

            console.log(`✅ Actualizada entrega ${sub.id} (Estudiante: ${sub.studentId}): Nota ${grade}`);
        } catch (error) {
            console.error(`❌ Error actualizando entrega ${sub.id}:`, error);
        }
    }

    console.log('--- Sincronización completada ---');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
