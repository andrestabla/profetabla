
import { prisma } from '@/lib/prisma';

async function main() {
    const email = 'digitalmaturity360@gmail.com';
    const projectId = '7bd228d5-dabb-4e90-9306-2e5fb258c4e1'; // From screenshot URL/context

    console.log(`🔍 Checking status for ${email} in project ${projectId}...`);

    const user = await prisma.user.findUnique({
        where: { email },
        include: {
            projectsAsStudent: {
                where: { id: projectId }
            },
            projectApplications: {
                where: { projectId: projectId }
            }
        }
    });

    if (!user) {
        console.log("❌ User not found");
        return;
    }

    const isEnrolled = user.projectsAsStudent.length > 0;
    const application = user.projectApplications[0];

    console.log(`- Enrolled in Project: ${isEnrolled}`);
    if (application) {
        console.log(`- Application Status: ${application.status}`);
        console.log(`- Application UpdatedAt: ${application.updatedAt.toISOString()}`);
    } else {
        console.log(`- No Application found.`);
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
