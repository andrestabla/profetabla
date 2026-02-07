
import { uploadFileToR2 } from '../src/lib/r2';
import { prisma } from '../src/lib/prisma';

async function main() {
    console.log('Testing src/lib/r2 uploadFileToR2...');

    try {
        const buffer = Buffer.from("Test file content via lib/r2");
        const result = await uploadFileToR2(buffer, "test-lib-upload.txt", "text/plain", "debug-script");
        console.log('Upload SUCCESS:', result);
    } catch (error) {
        console.error('Upload FAILED:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
