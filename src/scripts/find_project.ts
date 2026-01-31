
import { prisma } from '@/lib/prisma';

async function main() {
    const titlePart = "Teléfonos Celulares";
    console.log(`🔍 Searching for project containing: "${titlePart}"...`);

    const projects = await prisma.project.findMany({
        where: { title: { contains: titlePart } }
    });

    if (projects.length === 0) {
        console.log("❌ No project found.");
        return;
    }

    const project = projects[0];
    console.log(`✅ Found Project:`);
    console.log(`- ID: ${project.id}`);
    console.log(`- Title: ${project.title}`);

    // Check applications for this project
    const email = 'digitalmaturity360@gmail.com';
    const user = await prisma.user.findUnique({ where: { email } });

    if (user) {
        const app = await prisma.projectApplication.findUnique({
            where: {
                projectId_studentId: {
                    projectId: project.id,
                    studentId: user.id
                }
            }
        });
        console.log(`\n📄 Application for ${email}:`);
        if (app) {
            console.log(`- Status: ${app.status}`);
            console.log(`- Created: ${app.createdAt.toISOString()}`);
            console.log(`- Updated: ${app.updatedAt.toISOString()}`);
        } else {
            console.log(`- None found.`);
        }
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
