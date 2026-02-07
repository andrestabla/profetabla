
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { prisma } from '../src/lib/prisma';

async function main() {
    console.log('Testing R2 Connection...');
    const config = await prisma.platformConfig.findUnique({ where: { id: 'global-config' } });

    if (!config || !config.r2AccountId || !config.r2AccessKeyId || !config.r2SecretAccessKey || !config.r2BucketName) {
        console.error('Missing R2 Config in DB');
        return;
    }

    const r2Client = new S3Client({
        region: "auto",
        endpoint: `https://${config.r2AccountId}.r2.cloudflarestorage.com`,
        credentials: {
            accessKeyId: config.r2AccessKeyId,
            secretAccessKey: config.r2SecretAccessKey,
        },
    });

    try {
        console.log(`Attempting to upload to bucket: ${config.r2BucketName}`);
        const key = `test-upload-${Date.now()}.txt`;
        const command = new PutObjectCommand({
            Bucket: config.r2BucketName,
            Key: key,
            Body: "Hello R2 from Debug Script",
            ContentType: "text/plain",
        });

        await r2Client.send(command);
        console.log(`Successfully uploaded test file: ${key}`);
    } catch (error) {
        console.error('R2 Connect/Upload Failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
