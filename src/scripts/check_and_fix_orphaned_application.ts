
import { prisma } from '@/lib/prisma';

async function main() {
    const userEmail = 'andresrico50@gmail.com';
    const projectId = '7bd228d5-dabb-4e90-9306-2e5fb258c4e1';

    console.log(`🔍 Checking orphaned application for ${userEmail} in project ${projectId}...`);

    const user = await prisma.user.findUnique({ where: { email: userEmail } });
    if (!user) {
        console.error("❌ User not found");
        return;
    }

    const application = await prisma.projectApplication.findUnique({
        where: {
            projectId_studentId: {
                projectId: projectId,
                studentId: user.id
            }
        }
    });

    if (application) {
        console.log("⚠️ Found application record:", application);

        // Check if student is actually in the project
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            include: { students: { where: { id: user.id } } }
        });

        const isEnrolled = project?.students.length ?? 0 > 0;
        console.log(`ℹ️ User is enrolled in project? ${isEnrolled}`);

        if (!isEnrolled && application.status === 'ACCEPTED') {
            console.log("🚨 DETECTED ORPHANED ACCEPTED APPLICATION. Deleting...");
            await prisma.projectApplication.delete({
                where: { id: application.id }
            });
            console.log("✅ Application deleted. Status should be reset.");
        } else {
            console.log("ℹ️ Application state seems consistent with enrollment (or not accepted).");
        }

    } else {
        console.log("✅ No application record found.");
    }
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
