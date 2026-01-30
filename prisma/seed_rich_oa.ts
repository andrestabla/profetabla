import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('Seeding Rich Learning Object...');

    // 1. Find Teacher and Project
    const teacher = await prisma.user.findFirst({ where: { role: 'TEACHER' } });
    if (!teacher) return;

    // Try to find ANY project or create a dummy one if none exists (just for safety)
    const project = await prisma.project.findFirst({ where: { teachers: { some: { id: teacher.id } } } });
    if (!project) {
        console.log('No project found to attach OA.');
        return;
    }

    // 2. Create Learning Object
    const oa = await prisma.learningObject.create({
        data: {
            title: 'Curso Crash de Next.js 14',
            subject: 'Desarrollo Web Moderno',
            competency: 'App Router & Server Actions',
            authorId: teacher.id,
            projects: {
                connect: { id: project.id }
            },
            items: {
                create: [
                    {
                        title: 'Introducción a Next.js (Video)',
                        type: 'VIDEO',
                        url: 'https://www.youtube.com/watch?v=wm5gMKuwSYk', // Vercel tutorial
                        order: 0
                    },
                    {
                        title: 'Documentación Oficial (Embed)',
                        type: 'EMBED',
                        url: 'https://nextjs.org/docs',
                        order: 1
                    },
                    {
                        title: 'Diapositivas de Arquitectura (PDF)',
                        type: 'PDF',
                        url: 'https://pdfobject.com/pdf/sample.pdf', // Sample PDF
                        order: 2
                    },
                    {
                        title: 'Repositorio de Código (Link)',
                        type: 'LINK',
                        url: 'https://github.com/vercel/next.js',
                        order: 3
                    }
                ]
            }
        }
    });

    console.log('Rich OA Created:', oa.title);
    console.log('ID:', oa.id);
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
