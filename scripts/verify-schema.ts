
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Checking Prisma Client...');

    // Check if we can select 'isGroup' and 'students'
    try {
        // Create a dummy project to test schema (rollback later or use transaction)
        // Actually just checking types by running a query is enough
        const projects = await prisma.project.findMany({
            take: 1,
            select: {
                id: true,
                isGroup: true,
                students: { select: { id: true } } // This tests the 'students' relation
            }
        });
        console.log('Query successful:', projects);
        console.log('Schema is valid!');
    } catch (e) {
        console.error('Schema validation failed:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
