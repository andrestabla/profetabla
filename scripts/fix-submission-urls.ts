
import { prisma } from '../src/lib/prisma';

async function main() {
    console.log('Fixing broken submission URLs...');

    // Find submissions with raw keys (starting with 'submissions/')
    // and NOT already starting with '/api/file'
    const submissions = await prisma.submission.findMany({
        where: {
            fileUrl: {
                startsWith: 'submissions/'
            }
        }
    });

    console.log(`Found ${submissions.length} submissions to fix.`);

    for (const sub of submissions) {
        if (!sub.fileUrl.startsWith('/api/file')) {
            const newUrl = `/api/file?key=${encodeURIComponent(sub.fileUrl)}`;
            try {
                await prisma.submission.update({
                    where: { id: sub.id },
                    data: { fileUrl: newUrl }
                });
                console.log(`Fixed ${sub.id}: ${sub.fileName} -> ${newUrl}`);
            } catch (error) {
                console.error(`Failed to fix ${sub.id}:`, error);
            }
        }
    }

    await prisma.$disconnect();
}

main();
