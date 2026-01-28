import { PrismaClient } from '@prisma/client';
import { createProjectFolder } from '../src/lib/google-drive';

const prisma = new PrismaClient();

const projectIds = [
    '4371c357-14de-48d9-bc84-f6000d340be8',
    'dbeed912-4c4f-4280-bc8c-66a7ff4b4321'
];

async function main() {
    console.log('--- Iniciando creación de carpetas de Drive para proyectos existentes ---');

    for (const id of projectIds) {
        const project = await prisma.project.findUnique({
            where: { id }
        });

        if (!project) {
            console.error(`Proyecto no encontrado: ${id}`);
            continue;
        }

        if (project.googleDriveFolderId) {
            console.log(`El proyecto "${project.title}" ya tiene una carpeta vinculada: ${project.googleDriveFolderId}`);
            continue;
        }

        console.log(`Creando carpeta para: "${project.title}"...`);
        const folderId = await createProjectFolder(project.title);

        if (folderId) {
            await prisma.project.update({
                where: { id },
                data: { googleDriveFolderId: folderId }
            });
            console.log(`✅ Carpeta creada y vinculada con éxito: ${folderId}`);
        } else {
            console.error(`❌ Falló la creación de la carpeta para: "${project.title}"`);
        }
    }

    console.log('--- Proceso finalizado ---');
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
