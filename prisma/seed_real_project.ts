import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('Seeding Real Project...');

    // Find Teacher
    const teacher = await prisma.user.findFirst({ where: { role: 'TEACHER' } });
    if (!teacher) {
        console.log('No teacher found, skipping.');
        return;
    }

    const project = await prisma.project.create({
        data: {
            title: 'SaaS de Gestión de Inventarios con IA',
            description: 'Desarrollo de una plataforma web para que pequeñas empresas gestionen su stock, con predicción de demanda usando algoritmos simples de IA.',
            industry: 'SaaS B2B / Logística',
            justification: 'Las PYMES necesitan herramientas accesibles para optimizar sus recursos. La integración de IA para predicción es una habilidad altamente demandada en el mercado actual.',
            objectives: '1. Dominar Next.js App Router.\n2. Implementar bases de datos relacionales (PostgreSQL).\n3. Integrar APIs de Inteligencia Artificial (OpenAI).\n4. Desplegar una aplicación escalable en Vercel.',
            deliverables: '- Repositorio GitHub documentado.\n- Despliegue funcional en Vercel.\n- Video demo de 3 minutos.\n- Documentación técnica de la API.',
            status: 'OPEN',
            teachers: { connect: { id: teacher.id } }
        }
    });

    console.log('Real Project Created:', project.title);
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
