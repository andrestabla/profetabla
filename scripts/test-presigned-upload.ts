
import { getPresignedPutUrl } from '../src/lib/r2';
import { prisma } from '../src/lib/prisma';
import fetch from 'node-fetch'; // assuming node-fetch is available or using global fetch in newer node

async function main() {
    console.log('Testing Presigned Upload Flow...');

    try {
        // 1. Get Presigned URL
        const fileName = "test-direct-upload.txt";
        const fileType = "text/plain";
        const { url, key } = await getPresignedPutUrl(fileName, fileType, "debug-script");

        console.log('Generated Key:', key);
        console.log('Generated URL (truncated):', url.substring(0, 50) + '...');

        // 2. Upload File (Client Simulation)
        console.log('Uploading file via PUT...');
        const response = await fetch(url, {
            method: 'PUT',
            body: "Content uploaded directly via presigned URL",
            headers: { 'Content-Type': fileType }
        });

        if (response.ok) {
            console.log('Upload SUCCESS! Status:', response.status);
        } else {
            console.error('Upload FAILED! Status:', response.status, response.statusText);
            const text = await response.text();
            console.error('Response:', text);
        }

    } catch (error) {
        console.error('Flow failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
