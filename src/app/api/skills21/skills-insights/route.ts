import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getSkills21SkillsInsights } from '@/lib/skills21-skills-insights';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const insights = await getSkills21SkillsInsights({
            search: searchParams.get('search'),
            industry: searchParams.get('industry'),
            category: searchParams.get('category'),
            showInactive: searchParams.get('showInactive') === 'true'
        });

        return NextResponse.json(insights);
    } catch (error) {
        console.error('[skills21/skills-insights] error:', error);
        return NextResponse.json(
            { error: 'No se pudo calcular la analítica de Habilidades.' },
            { status: 500 }
        );
    }
}
