
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const config = await prisma.platformConfig.findUnique({
        where: { id: 'global-config' },
    });
    console.log('--- Platform Config ---');
    console.log(JSON.stringify(config, null, 2));
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
