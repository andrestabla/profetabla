
import { PutBucketCorsCommand } from "@aws-sdk/client-s3";
import { S3Client } from "@aws-sdk/client-s3";
import { prisma } from '../src/lib/prisma';

async function main() {
    console.log('Configuring R2 CORS Policy...');

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
        const command = new PutBucketCorsCommand({
            Bucket: config.r2BucketName,
            CORSConfiguration: {
                CORSRules: [
                    {
                        AllowedHeaders: ["*"],
                        AllowedMethods: ["PUT", "POST", "GET", "HEAD"], // Essential for Direct Upload
                        AllowedOrigins: ["*"], // Allow from any domain (localhost, vercel, etc.)
                        ExposeHeaders: ["ETag"],
                        MaxAgeSeconds: 3600
                    }
                ]
            }
        });

        await r2Client.send(command);
        console.log(`Successfully applied CORS policy to bucket: ${config.r2BucketName}`);
    } catch (error) {
        console.error('Failed to configure CORS:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
