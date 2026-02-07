
import { prisma } from '../src/lib/prisma';

async function main() {
    try {
        const config = await prisma.platformConfig.findUnique({ where: { id: 'global-config' } });
        if (!config) {
            console.log('Global Config NOT FOUND');
        } else {
            console.log('Global Config Found');
            console.log('R2 Bucket:', config.r2BucketName ? 'Set' : 'MISSING');
            console.log('R2 Account ID:', config.r2AccountId ? 'Set' : 'MISSING');
            console.log('R2 Access Key:', config.r2AccessKeyId ? 'Set' : 'MISSING');
            console.log('R2 Secret Key:', config.r2SecretAccessKey ? 'Set' : 'MISSING');
        }
    } catch (e) {
        console.error('Error checking config:', e);
    } finally {
        await prisma.$disconnect();
    }
}
main();
