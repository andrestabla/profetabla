
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const config = await prisma.platformConfig.findUnique({
        where: { id: 'global-config' }
    });
    console.log('--- Platform Config ---');
    console.log(JSON.stringify(config, null, 2));

    if (config?.googleCalendarServiceAccountJson) {
        try {
            const creds = JSON.parse(config.googleCalendarServiceAccountJson);
            console.log('\n--- Service Account Email ---');
            console.log(creds.client_email);
        } catch (e) {
            console.log('\n--- Service Account JSON is INVALID ---');
        }
    } else {
        console.log('\n--- Service Account JSON is MISSING ---');
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
