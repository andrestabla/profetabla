import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const tags = await prisma.tag.findMany();
        return NextResponse.json(tags);
    } catch (error) {
        return NextResponse.json(
            { error: 'Error fetching tags' },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, color } = body;

        const tag = await prisma.tag.create({
            data: { name, color }
        });
        return NextResponse.json(tag);
    } catch (error) {
        return NextResponse.json({ error: 'Error creating tag' }, { status: 500 });
    }
}
