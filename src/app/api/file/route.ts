
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getR2FileUrl } from '@/lib/r2';

export async function GET(request: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const key = searchParams.get('key');

    if (!key) {
        return NextResponse.json({ error: 'Key is required' }, { status: 400 });
    }

    try {
        const signedUrl = await getR2FileUrl(key);
        if (!signedUrl || signedUrl === '#') {
            return NextResponse.json({ error: 'File not found or config error' }, { status: 404 });
        }

        return NextResponse.redirect(signedUrl);
    } catch (error) {
        console.error('Error in file proxy:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
