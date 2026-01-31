
import { prisma } from '@/lib/prisma';

async function main() {
    console.log("🔍 Verifying DB Connection & Logging...");

    const testId = `TEST-${Date.now()}`;

    // 1. Create Log
    await prisma.activityLog.create({
        data: {
            action: 'DEBUG_TEST',
            description: `Verification script test run`,
            metadata: { testId }
        }
    });
    console.log(`✅ Created test log with ID: ${testId}`);

    // 2. Read Log
    const logs = await prisma.activityLog.findMany({
        where: {
            metadata: {
                path: ['testId'],
                equals: testId
            }
        }
    });

    if (logs.length > 0) {
        console.log("✅ Verified: Log was readable.");
    } else {
        console.error("❌ Failed: Could not read back the log.");
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
