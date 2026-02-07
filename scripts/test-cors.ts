
import { getPresignedPutUrl } from '../src/lib/r2';
import { prisma } from '../src/lib/prisma';
import fetch from 'node-fetch';

async function main() {
    console.log('Verifying CORS Policy via OPTIONS request...');

    try {
        // 1. Get Presigned URL
        const fileName = "cors-test.txt";
        const fileType = "text/plain";
        const { url } = await getPresignedPutUrl(fileName, fileType, "debug-script");

        console.log('Testing URL:', url);

        // 2. Simulate Preflight OPTIONS request
        // This simulates what the browser does before the PUT
        const response = await fetch(url, {
            method: 'OPTIONS',
            headers: {
                'Origin': 'http://localhost:3000', // Simulate local dev environment
                'Access-Control-Request-Method': 'PUT',
                'Access-Control-Request-Headers': 'content-type'
            }
        });

        console.log('Response Status:', response.status);
        console.log('Access-Control-Allow-Origin:', response.headers.get('access-control-allow-origin'));
        console.log('Access-Control-Allow-Methods:', response.headers.get('access-control-allow-methods'));

        if (response.headers.get('access-control-allow-origin') === '*' || response.headers.get('access-control-allow-origin') === 'http://localhost:3000') {
            console.log('✅ CORS Valid: Origin allowed');
        } else {
            console.error('❌ CORS Invalid: Origin NOT allowed');
        }

    } catch (error) {
        console.error('CORS Check failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
