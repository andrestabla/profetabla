import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { prisma } from "./prisma";

// Config cache to avoid DB hits on every call
let r2Client: S3Client | null = null;

async function getR2Client() {
    if (r2Client) return r2Client;

    const config = await prisma.platformConfig.findUnique({ where: { id: 'global-config' } });

    if (!config?.r2AccountId || !config?.r2AccessKeyId || !config?.r2SecretAccessKey) {
        throw new Error("R2 Credentials missing in Platform Configuration");
    }

    r2Client = new S3Client({
        region: "auto",
        endpoint: `https://${config.r2AccountId}.r2.cloudflarestorage.com`,
        credentials: {
            accessKeyId: config.r2AccessKeyId,
            secretAccessKey: config.r2SecretAccessKey,
        },
    });

    return r2Client;
}

export async function uploadFileToR2(
    fileBuffer: Buffer,
    fileName: string,
    mimeType: string,
    projectName?: string
): Promise<{ url: string; key: string }> {
    try {
        const client = await getR2Client();
        const config = await prisma.platformConfig.findUnique({ where: { id: 'global-config' } });

        if (!config?.r2BucketName) throw new Error("R2 Bucket Name missing");

        // Sanitize file name
        const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
        const projectPrefix = projectName ? `${projectName.replace(/[^a-zA-Z0-9._-]/g, '_')}/` : 'uploads/';
        const key = `${projectPrefix}${Date.now()}_${sanitizedFileName}`;

        const command = new PutObjectCommand({
            Bucket: config.r2BucketName,
            Key: key,
            Body: fileBuffer,
            ContentType: mimeType,
        });

        await client.send(command);

        // We return the Key so we can store it. 
        // We can generate a presigned URL for the 'url' field for immediate use, 
        // but typically we should generate it on demand. 

        return {
            url: key, // Storing key as the url identifier effectively
            key: key
        };

    } catch (error) {
        console.error("R2 Upload Error:", error);
        throw error;
    }
}

export async function getR2FileUrl(key: string): Promise<string> {
    try {
        const client = await getR2Client();
        const config = await prisma.platformConfig.findUnique({ where: { id: 'global-config' } });

        if (!config?.r2BucketName) throw new Error("Bucket missing");

        const command = new GetObjectCommand({
            Bucket: config.r2BucketName,
            Key: key,
        });

        // 1 hour expiry for viewing
        const url = await getSignedUrl(client, command, { expiresIn: 3600 });
        return url;
    } catch (error) {
        console.error("Error getting signed URL:", error);
        return "#";
    }
}
