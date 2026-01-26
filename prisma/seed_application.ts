import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('Seeding Application...');

    // 1. Find the Open Project (Real Project)
    const project = await prisma.project.findFirst({
        where: { title: 'SaaS de Gestión de Inventarios con IA', status: 'OPEN' }
    });

    if (!project) {
        console.log('Project not found. Run seed_real_project.ts first.');
        return;
    }

    // 2. Find Student to apply
    const student = await prisma.user.findFirst({ where: { role: 'STUDENT' } });
    if (!student) return;

    // 3. Create Application
    await prisma.projectApplication.upsert({
        where: {
            projectId_studentId: {
                projectId: project.id,
                studentId: student.id
            }
        },
        update: {},
        create: {
            projectId: project.id,
            studentId: student.id,
            motivation: 'Hola profe, me interesa mucho este proyecto porque vengo estudiando Next.js y quiero aprender a integrar IA. Tengo experiencia básica con React y SQL. ¡Prometo trabajar duro!',
            status: 'PENDING'
        }
    });

    console.log('Solicitud creada para:', project.title);
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
