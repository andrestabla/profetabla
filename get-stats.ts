
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const userCount = await prisma.user.count();
    const projectCount = await prisma.project.count();
    const submissionCount = await prisma.submission.count();

    console.log(JSON.stringify({
        users: userCount,
        projects: projectCount,
        submissions: submissionCount
    }, null, 2));
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
