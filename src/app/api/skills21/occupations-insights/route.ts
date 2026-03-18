import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getSkills21OccupationsInsights } from '@/lib/skills21-occupations-insights';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const insights = await getSkills21OccupationsInsights({
            search: searchParams.get('search'),
            source: searchParams.get('source'),
            geography: searchParams.get('geography'),
            year: searchParams.get('year')
        });

        return NextResponse.json(insights);
    } catch (error) {
        console.error('[skills21/occupations-insights] error:', error);
        return NextResponse.json(
            { error: 'No se pudo calcular la analítica de Ocupaciones.' },
            { status: 500 }
        );
    }
}
