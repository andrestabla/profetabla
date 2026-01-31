
import { prisma } from '@/lib/prisma';

async function main() {
    const userName = 'Algoritmo T';
    const projectId = '7bd228d5-dabb-4e90-9306-2e5fb258c4e1';

    console.log(`🔍 Diagnosing user "${userName}"...`);

    const users = await prisma.user.findMany({
        where: { name: { contains: userName, mode: 'insensitive' } }
    });

    if (users.length === 0) {
        console.error("❌ User not found");
        return;
    }

    for (const user of users) {
        console.log(`\nChecking user: ${user.name} (${user.email})`);

        const application = await prisma.projectApplication.findUnique({
            where: {
                projectId_studentId: {
                    projectId: projectId,
                    studentId: user.id
                }
            }
        });

        const project = await prisma.project.findUnique({
            where: { id: projectId },
            include: { students: { where: { id: user.id } } }
        });

        const isEnrolled = project?.students.length ?? 0 > 0;
        console.log(`- Project Enrollment: ${isEnrolled}`);
        console.log(`- Application Status: ${application?.status ?? 'None'}`);

        if (!isEnrolled && application?.status === 'ACCEPTED') {
            console.log("🚨 ORPHAN DETECTED. Cleaning up...");
            await prisma.projectApplication.delete({ where: { id: application.id } });
            console.log("✅ Fixed.");
        } else {
            console.log("✅ State is consistent (or not accepted).");
        }
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
