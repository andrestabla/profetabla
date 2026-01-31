
import { prisma } from '@/lib/prisma';

async function main() {
    console.log("🔍 DIAGNOSTIC: Full Scan");

    // 1. Check Application Status
    const email = 'digitalmaturity360@gmail.com';
    const user = await prisma.user.findUnique({ where: { email } });
    if (user) {
        const app = await prisma.projectApplication.findFirst({
            where: { studentId: user.id },
            orderBy: { updatedAt: 'desc' },
            include: { project: true }
        });
        if (app) {
            console.log(`\n📄 Latest Application:`);
            console.log(`- Status: ${app.status}`);
            console.log(`- Project: ${app.project.title}`);
            console.log(`- Updated (UTC): ${app.updatedAt.toISOString()}`);
            console.log(`- Created (UTC): ${app.createdAt.toISOString()}`);
        } else {
            console.log("\n📄 No Application found for user.");
        }
    } else {
        console.log("\n❌ User not found.");
    }

    // 2. Check Recent Logs (All actions)
    const logs = await prisma.activityLog.findMany({
        where: {
            createdAt: {
                gt: new Date(Date.now() - 1000 * 60 * 60) // Last hour
            }
        },
        orderBy: { createdAt: 'desc' },
        take: 10
    });

    console.log(`\n📋 Recent Logs (${logs.length}):`);
    logs.forEach(l => console.log(`[${l.createdAt.toISOString()}] ${l.action}`));
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
