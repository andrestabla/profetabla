
import { prisma } from '@/lib/prisma';

async function main() {
    const email = 'digitalmaturity360@gmail.com';
    const projectId = '7bd228d5-dabb-4e90-9306-2e5fb258c4e1';

    console.log(`🧹 Cleaning up state for ${email}...`);

    const user = await prisma.user.findUnique({
        where: { email }
    });

    if (!user) {
        console.log("❌ User not found");
        return;
    }

    // 1. Delete Application
    const deleteApp = await prisma.projectApplication.deleteMany({
        where: {
            projectId,
            studentId: user.id
        }
    });
    console.log(`- Deleted ${deleteApp.count} application(s).`);

    // 2. Disconnect from Project
    const disconnect = await prisma.project.update({
        where: { id: projectId },
        data: {
            students: {
                disconnect: { id: user.id }
            }
        }
    });
    console.log(`- Disconnected from project.`);

    console.log("✅ State Cleaned. User can now re-apply.");
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
