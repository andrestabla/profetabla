
import { prisma } from '../src/lib/prisma';

async function main() {
    console.log('Inspecting latest submissions...');

    const submissions = await prisma.submission.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
            id: true,
            fileName: true,
            fileUrl: true,
            createdAt: true,
            fileType: true
        }
    });

    console.log(JSON.stringify(submissions, null, 2));
    await prisma.$disconnect();
}

main();
