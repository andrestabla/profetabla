import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getSkills21HomeInsights } from '@/lib/skills21-home-insights';
import type { Skills21HomeInsightsResult } from '@/lib/skills21-home-insights-types';
import { getSkills21OccupationsInsights } from '@/lib/skills21-occupations-insights';
import type { Skills21OccupationsInsightsResult } from '@/lib/skills21-occupations-insights-types';
import { getSkills21SkillsInsights } from '@/lib/skills21-skills-insights';
import type { Skills21SkillsInsightsResult } from '@/lib/skills21-skills-insights-types';
import { getSkills21WorldSignalsForDashboard } from '@/lib/skills21-world-watch';
import Skills21Client from './Skills21Client';

export const dynamic = 'force-dynamic';

function buildEmptyHomeInsightsResult(): Skills21HomeInsightsResult {
    return {
        meta: {
            latestOccupationYear: null,
            occupationYears: [],
            occupationIndustries: [],
            occupationGeographies: [],
            usedPythonSnapshot: false,
            compilerMessage: 'Carga inicial diferida.',
            generatedAt: ''
        },
        demand: {
            selectedYear: null,
            rowCount: 0,
            topOccupations: [],
            lowestSupply: [],
            chartData: []
        },
        skills: {
            selectedYear: null,
            scopeOccupationCount: 0,
            occupationOptions: [],
            topSkills: [],
            chartData: []
        }
    };
}

function buildEmptyOccupationsInsightsResult(): Skills21OccupationsInsightsResult {
    return {
        meta: {
            availableYears: [],
            availableGeographies: [],
            availableSources: [],
            usedPythonSnapshot: false,
            compilerMessage: 'Carga inicial diferida.',
            generatedAt: ''
        },
        data: {
            filteredCount: 0,
            yearlyTrendData: [],
            topOccupationsChartData: [],
            sourceDistributionData: [],
            geographyDistributionData: [],
            latestTableItems: [],
            geoIndustryMap: {
                geographies: [],
                industries: [],
                rows: [],
                maxValue: 0
            },
            quadrantItems: []
        }
    };
}

function buildEmptySkillsInsightsResult(): Skills21SkillsInsightsResult {
    return {
        meta: {
            availableIndustries: [],
            availableCategories: [],
            usedPythonSnapshot: false,
            compilerMessage: 'Carga inicial diferida.',
            generatedAt: ''
        },
        data: {
            filteredCount: 0,
            skillsList: [],
            industryDistribution: [],
            sourceDistribution: [],
            treemapData: []
        }
    };
}

export default async function Skills21Page() {
    const session = await getServerSession(authOptions);
    if (!session) redirect('/login');

    const canManageSkills = session.user.role === 'TEACHER' || session.user.role === 'ADMIN';
    const canUploadOccupations = session.user.role === 'ADMIN';

    const skillsPromise = prisma.twentyFirstSkill.findMany({
        orderBy: [
            { industry: 'asc' },
            { name: 'asc' }
        ],
        include: {
            _count: { select: { projects: true } }
        }
    });

    const occupationsPromise = prisma.occupation.findMany({
        orderBy: [
            { updatedAt: 'desc' },
            { occupationTitle: 'asc' }
        ],
        take: 1000,
        include: {
            forecasts: { orderBy: { year: 'asc' } },
            skills: {
                select: { id: true, name: true, industry: true, category: true },
                orderBy: [{ industry: 'asc' }, { name: 'asc' }]
            }
        }
    });

    const occupationTotalPromise = prisma.occupation.count();
    
    const homeInsightsPromise = getSkills21HomeInsights().catch((error) => {
        console.error('[Skills21Page] No se pudo precargar Inicio:', error);
        return buildEmptyHomeInsightsResult();
    });
    const occupationsInsightsPromise = getSkills21OccupationsInsights().catch((error) => {
        console.error('[Skills21Page] No se pudo precargar Ocupaciones:', error);
        return buildEmptyOccupationsInsightsResult();
    });
    const skillsInsightsPromise = getSkills21SkillsInsights().catch((error) => {
        console.error('[Skills21Page] No se pudo precargar Habilidades:', error);
        return buildEmptySkillsInsightsResult();
    });
    
    const worldWatchPromise = getSkills21WorldSignalsForDashboard({
        limit: 16,
        autoRefreshIfStale: false
    });

    const [
        skills, 
        occupations, 
        occupationTotal, 
        homeInsights, 
        occupationsInsights,
        skillsInsights,
        worldWatch
    ] = await Promise.all([
        skillsPromise,
        occupationsPromise,
        occupationTotalPromise,
        homeInsightsPromise,
        occupationsInsightsPromise,
        skillsInsightsPromise,
        worldWatchPromise
    ]);

    const safeSkills = skills.map((skill) => ({
        id: skill.id,
        name: skill.name,
        industry: skill.industry,
        category: skill.category,
        description: skill.description,
        trendSummary: skill.trendSummary,
        examples: skill.examples || [],
        tags: skill.tags || [],
        isActive: skill.isActive,
        sources: skill.sources ?? [],
        sourceProvider: skill.sourceProvider,
        sourceUri: skill.sourceUri,
        sourceLanguage: skill.sourceLanguage,
        sourceLastSyncedAt: skill.sourceLastSyncedAt ? skill.sourceLastSyncedAt.toISOString() : null,
        createdAt: skill.createdAt.toISOString(),
        updatedAt: skill.updatedAt.toISOString(),
        projectCount: skill._count.projects
    }));

    const safeOccupations = occupations.map((occupation) => ({
        id: occupation.id,
        dataSource: occupation.dataSource,
        geography: occupation.geography,
        industryCode: occupation.industryCode,
        occupationCode: occupation.occupationCode,
        occupationTitle: occupation.occupationTitle,
        occupationType: occupation.occupationType,
        qualificationLevel: occupation.qualificationLevel,
        isActive: occupation.isActive,
        createdAt: occupation.createdAt.toISOString(),
        updatedAt: occupation.updatedAt.toISOString(),
        forecasts: occupation.forecasts.map((forecast) => ({
            year: forecast.year,
            employmentCount: forecast.employmentCount,
            percentOfIndustry: forecast.percentOfIndustry,
            percentOfOccupation: forecast.percentOfOccupation
        })),
        skills: occupation.skills
    }));

    const safeWorldSignals = worldWatch.signals.map((signal) => ({
        id: signal.id,
        title: signal.title,
        summary: signal.summary,
        sourceName: signal.sourceName,
        sourceType: signal.sourceType,
        sourceUrl: signal.sourceUrl,
        publishedAt: signal.publishedAt.toISOString(),
        capturedAt: signal.capturedAt.toISOString(),
        industry: signal.industry,
        occupationFocus: signal.occupationFocus,
        skillFocus: signal.skillFocus,
        tags: signal.tags || [],
        relevanceScore: signal.relevanceScore
    }));

    const safeWorldSyncState = worldWatch.syncState
        ? {
            status: worldWatch.syncState.status,
            lastSyncAt: worldWatch.syncState.lastSyncAt ? worldWatch.syncState.lastSyncAt.toISOString() : null,
            nextSyncAt: worldWatch.syncState.nextSyncAt ? worldWatch.syncState.nextSyncAt.toISOString() : null,
            lastError: worldWatch.syncState.lastError
        }
        : null;

    return (
        <Skills21Client
            skills={safeSkills}
            occupations={safeOccupations}
            occupationTotal={occupationTotal}
            initialHomeInsights={homeInsights}
            initialOccupationsInsights={occupationsInsights}
            initialSkillsInsights={skillsInsights}
            worldSignals={safeWorldSignals}
            worldSyncState={safeWorldSyncState}
            worldIsStale={worldWatch.isStale}
            canManageSkills={canManageSkills}
            canUploadOccupations={canUploadOccupations}
            currentRole={session.user.role}
        />
    );
}
