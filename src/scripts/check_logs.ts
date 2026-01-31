
import { prisma } from '@/lib/prisma';

async function main() {
    console.log("🔍 Fetching recent Activity Logs...");

    const logs = await prisma.activityLog.findMany({
        where: {
            action: {
                startsWith: 'ACCEPT_STUDENT'
            }
        },
        orderBy: {
            createdAt: 'desc'
        },
        take: 10
    });

    if (logs.length === 0) {
        console.log("❌ No logs found for ACCEPT_STUDENT actions.");
    } else {
        console.log(`✅ Found ${logs.length} logs:`);
        logs.forEach(log => {
            console.log(`\n[${log.createdAt.toISOString()}] ${log.action}`);
            console.log(`Description: ${log.description}`);
            console.log(`Metadata:`, JSON.stringify(log.metadata, null, 2));
        });
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
