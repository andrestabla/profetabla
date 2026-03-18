import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getSkills21HomeInsights } from '@/lib/skills21-home-insights';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const insights = await getSkills21HomeInsights({
            demandYear: searchParams.get('demandYear'),
            demandIndustry: searchParams.get('demandIndustry'),
            demandGeography: searchParams.get('demandGeography'),
            skillsYear: searchParams.get('skillsYear'),
            skillsIndustry: searchParams.get('skillsIndustry'),
            skillsGeography: searchParams.get('skillsGeography'),
            skillsOccupationId: searchParams.get('skillsOccupationId')
        });

        return NextResponse.json(insights);
    } catch (error) {
        console.error('[skills21/home-insights] error:', error);
        return NextResponse.json(
            { error: 'No se pudo calcular la analítica de Inicio.' },
            { status: 500 }
        );
    }
}
