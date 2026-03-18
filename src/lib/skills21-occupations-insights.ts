import 'server-only';

import { spawn } from 'child_process';
import { mkdtemp, readFile, rm, writeFile } from 'fs/promises';
import { LRUCache } from 'lru-cache';
import os from 'os';
import path from 'path';
import { prisma } from '@/lib/prisma';
import type {
    Skills21OccupationRow,
    Skills21OccupationsFilters,
    Skills21OccupationsInsightsResult
} from './skills21-occupations-insights-types';

type SnapshotOccupation = {
    id: string;
    occupationTitle: string;
    occupationCode: string | null;
    geography: string;
    industryCode: string | null;
    dataSource: string;
    occupationType: string;
    qualificationLevel: string;
    forecasts: Array<{
        year: number;
        employmentCount: number;
    }>;
    skills: Array<{
        name: string;
    }>;
};

type OccupationsSnapshot = {
    availableYears: number[];
    availableGeographies: string[];
    availableSources: string[];
    occupations: Skills21OccupationRow[];
    forecasts: Array<{
        occupationId: string;
        year: number;
        employmentCount: number;
    }>;
    usedPythonSnapshot: boolean;
    compilerMessage: string;
    generatedAt: string;
};

const SNAPSHOT_CACHE_KEY = 'skills21-occupations-snapshot:v1';
const snapshotCache = new LRUCache<string, Promise<OccupationsSnapshot>>({
    max: 1,
    ttl: 15 * 60 * 1000
});

async function loadSnapshotOccupations(): Promise<SnapshotOccupation[]> {
    const occupations = await prisma.occupation.findMany({
        where: { isActive: true },
        select: {
            id: true,
            occupationTitle: true,
            occupationCode: true,
            geography: true,
            industryCode: true,
            dataSource: true,
            occupationType: true,
            qualificationLevel: true,
            forecasts: {
                orderBy: { year: 'asc' },
                select: {
                    year: true,
                    employmentCount: true
                }
            },
            skills: {
                where: { isActive: true },
                select: { name: true }
            }
        }
    });

    return occupations.map((o) => ({
        id: o.id,
        occupationTitle: o.occupationTitle,
        occupationCode: o.occupationCode,
        geography: o.geography,
        industryCode: o.industryCode,
        dataSource: o.dataSource,
        occupationType: o.occupationType,
        qualificationLevel: o.qualificationLevel,
        forecasts: o.forecasts.filter((f) => Number.isFinite(f.employmentCount)),
        skills: o.skills
    }));
}

function compileSnapshotFallback(occupations: SnapshotOccupation[]): OccupationsSnapshot {
    const baseRows: Skills21OccupationRow[] = [];
    const forecastRows: OccupationsSnapshot['forecasts'] = [];
    const years = new Set<number>();
    const geographies = new Set<string>();
    const sources = new Set<string>();

    for (const occ of occupations) {
        if (!occ.id || !occ.occupationTitle) continue;
        
        geographies.add(occ.geography);
        sources.add(occ.dataSource);
        
        const validForecasts = [...occ.forecasts].sort((a, b) => a.year - b.year);
        for (const f of validForecasts) {
            years.add(f.year);
            forecastRows.push({
                occupationId: occ.id,
                year: f.year,
                employmentCount: f.employmentCount
            });
        }

        const latest = validForecasts.length > 0 ? validForecasts[validForecasts.length - 1] : null;
        const previous = validForecasts.length > 1 ? validForecasts[0] : null;

        const skillNames = occ.skills.map(s => s.name).join(' ');
        const searchTokens = `${occ.occupationTitle} ${occ.occupationType} ${occ.occupationCode || ''} ${occ.industryCode || 'Sin industria'} ${occ.qualificationLevel} ${occ.geography} ${skillNames}`.toLowerCase();

        baseRows.push({
            id: occ.id,
            occupationTitle: occ.occupationTitle,
            occupationCode: occ.occupationCode,
            geography: occ.geography,
            industryCode: occ.industryCode?.trim() || 'Sin industria',
            dataSource: occ.dataSource,
            occupationType: occ.occupationType,
            qualificationLevel: occ.qualificationLevel,
            skillCount: occ.skills.length,
            searchTokens,
            latestEmployment: latest ? latest.employmentCount : 0,
            latestYear: latest ? latest.year : null,
            previousEmployment: previous ? previous.employmentCount : null
        });
    }

    return {
        availableYears: Array.from(years).sort((a, b) => a - b),
        availableGeographies: Array.from(geographies).sort((a, b) => a.localeCompare(b)),
        availableSources: Array.from(sources).sort((a, b) => a.localeCompare(b)),
        occupations: baseRows,
        forecasts: forecastRows,
        usedPythonSnapshot: false,
        compilerMessage: 'Fallback TypeScript aplicado.',
        generatedAt: new Date().toISOString()
    };
}

async function runPythonSnapshotCompiler(occupations: SnapshotOccupation[]): Promise<{ ok: boolean; snapshot?: OccupationsSnapshot; error?: string; output: string }> {
    const tempDir = await mkdtemp(path.join(os.tmpdir(), 'skills21-occ-'));
    const inputFilePath = path.join(tempDir, 'occ-input.json');
    const outputFilePath = path.join(tempDir, 'occ-output.json');
    const scriptPath = path.join(process.cwd(), 'scripts', 'skills21', 'build_occupations_insights.py');
    const pythonBins = [process.env.PYTHON_BIN, 'python3', 'python'].filter(Boolean) as string[];
    const errors: string[] = [];

    try {
        await writeFile(inputFilePath, JSON.stringify({ occupations }), 'utf8');

        for (const bin of pythonBins) {
            const result = await new Promise<{ code: number | null; stdout: string; stderr: string }>((resolve) => {
                const child = spawn(
                    bin,
                    [scriptPath, '--input-file', inputFilePath, '--output-file', outputFilePath],
                    { stdio: ['ignore', 'pipe', 'pipe'] }
                );

                let stdout = '';
                let stderr = '';

                child.stdout.on('data', (chunk) => { stdout += chunk.toString(); });
                child.stderr.on('data', (chunk) => { stderr += chunk.toString(); });
                child.on('close', (code) => resolve({ code, stdout, stderr }));
                child.on('error', (error) => { resolve({ code: 1, stdout, stderr: `${stderr}\n${String(error)}` }); });
            });

            if (result.code === 0) {
                const compiledContent = await readFile(outputFilePath, 'utf8');
                const parsed = JSON.parse(compiledContent) as Omit<OccupationsSnapshot, 'usedPythonSnapshot' | 'compilerMessage' | 'generatedAt'>;
                return {
                    ok: true,
                    output: result.stdout.trim(),
                    snapshot: {
                        availableYears: Array.isArray(parsed.availableYears) ? parsed.availableYears : [],
                        availableGeographies: Array.isArray(parsed.availableGeographies) ? parsed.availableGeographies : [],
                        availableSources: Array.isArray(parsed.availableSources) ? parsed.availableSources : [],
                        occupations: Array.isArray(parsed.occupations) ? parsed.occupations : [],
                        forecasts: Array.isArray(parsed.forecasts) ? parsed.forecasts : [],
                        usedPythonSnapshot: true,
                        compilerMessage: result.stdout.trim(),
                        generatedAt: new Date().toISOString()
                    }
                };
            }
            errors.push(`bin=${bin} stderr=${result.stderr.trim()}`.trim());
        }

        return {
            ok: false,
            output: '',
            error: errors.length > 0 ? errors.join(' | ') : 'No se pudo ejecutar compilador Python de Ocupaciones.'
        };
    } finally {
        await rm(tempDir, { recursive: true, force: true });
    }
}

async function buildOccupationsSnapshot(): Promise<OccupationsSnapshot> {
    const occupations = await loadSnapshotOccupations();
    const pythonResult = await runPythonSnapshotCompiler(occupations);

    if (pythonResult.ok && pythonResult.snapshot) {
        return pythonResult.snapshot;
    }

    const fallback = compileSnapshotFallback(occupations);
    return {
        ...fallback,
        compilerMessage: `Fallback TypeScript aplicado. Motivo: ${pythonResult.error || 'desconocido'}`
    };
}

async function getOccupationsSnapshot(): Promise<OccupationsSnapshot> {
    const cached = snapshotCache.get(SNAPSHOT_CACHE_KEY);
    if (cached) return cached;

    const snapshotPromise = buildOccupationsSnapshot().catch((error) => {
        snapshotCache.delete(SNAPSHOT_CACHE_KEY);
        throw error;
    });
    snapshotCache.set(SNAPSHOT_CACHE_KEY, snapshotPromise);
    return snapshotPromise;
}

export function resetSkills21OccupationsInsightsCache() {
    snapshotCache.clear();
}

export async function getSkills21OccupationsInsights(filters: Skills21OccupationsFilters = {}): Promise<Skills21OccupationsInsightsResult> {
    const snapshot = await getOccupationsSnapshot();
    const term = (filters.search || '').trim().toLowerCase();
    const source = filters.source === 'ALL' || !filters.source ? null : filters.source;
    const geography = filters.geography === 'ALL' || !filters.geography ? null : filters.geography;
    const year = filters.year === 'ALL' || !filters.year ? null : Number(filters.year);

    // Filter base rows
    let filteredOccupations = snapshot.occupations;
    
    // If year is specified, we must verify the occupation has a forecast for that year
    let validIdsByYear: Set<string> | null = null;
    if (year) {
        validIdsByYear = new Set(
            snapshot.forecasts.filter((f) => f.year === year).map((f) => f.occupationId)
        );
    }

    if (term || source || geography || validIdsByYear) {
        filteredOccupations = snapshot.occupations.filter((row) => {
            if (source && row.dataSource !== source) return false;
            if (geography && row.geography !== geography) return false;
            if (validIdsByYear && !validIdsByYear.has(row.id)) return false;
            if (term && !row.searchTokens.includes(term)) return false;
            return true;
        });
    }

    const filteredIds = new Set(filteredOccupations.map((r) => r.id));

    // Distribution Data
    const bySource = new Map<string, number>();
    const byGeo = new Map<string, number>();
    for (const row of filteredOccupations) {
        // Formatter label translation
        const s = row.dataSource === 'US_BLS_Matrix' ? 'BLS Matriz (CSV)' :
                  row.dataSource === 'US_BLS_API_OE' ? 'BLS API (OE)' :
                  row.dataSource === 'EU_Forecast' ? 'Proyección UE' : row.dataSource;
        bySource.set(s, (bySource.get(s) || 0) + 1);
        byGeo.set(row.geography, (byGeo.get(row.geography) || 0) + 1);
    }

    // Yearly trend data
    const byYear = new Map<number, number>();
    for (const f of snapshot.forecasts) {
        if (filteredIds.has(f.occupationId)) {
            byYear.set(f.year, (byYear.get(f.year) || 0) + f.employmentCount);
        }
    }

    const occupationLatestTable = [...filteredOccupations]
        .filter((row) => row.latestYear !== null)
        .sort((a, b) => b.latestEmployment - a.latestEmployment)
        .map((row) => {
            const { searchTokens, ...occupation } = row;
            const variationAbsolute = row.previousEmployment !== null ? row.latestEmployment - row.previousEmployment : null;
            const variationPercent = variationAbsolute !== null && row.previousEmployment && row.previousEmployment > 0 
                ? (variationAbsolute / row.previousEmployment) * 100 : null;

            return {
                occupation,
                latest: row.latestYear ? { year: row.latestYear, employmentCount: row.latestEmployment } : null,
                previous: row.previousEmployment !== null ? { year: (row.latestYear ?? 0) - 1, employmentCount: row.previousEmployment } : null,
                variationAbsolute,
                variationPercent
            };
        });

    const geoIndustryBucket = new Map<string, number>();
    const geoTotals = new Map<string, number>();
    const indTotals = new Map<string, number>();

    for (const row of filteredOccupations) {
        if (!row.latestEmployment) continue;
        const key = `${row.geography}|||${row.industryCode || row.dataSource}`;
        const prev = geoIndustryBucket.get(key) || 0;
        geoIndustryBucket.set(key, prev + row.latestEmployment);
    }

    for (const [key, val] of geoIndustryBucket.entries()) {
        const [geo, ind] = key.split('|||');
        geoTotals.set(geo, (geoTotals.get(geo) || 0) + val);
        indTotals.set(ind, (indTotals.get(ind) || 0) + val);
    }

    const geographiesLimit = Array.from(geoTotals.entries()).sort((a, b) => b[1] - a[1]).slice(0, 12).map(x => x[0]);
    const industriesLimit = Array.from(indTotals.entries()).sort((a, b) => b[1] - a[1]).slice(0, 8).map(x => x[0]);

    const geoIndustryRows = geographiesLimit.map((geo) => {
        const values = industriesLimit.map((ind) => {
            return { industry: ind, value: geoIndustryBucket.get(`${geo}|||${ind}`) || 0 };
        });
        return { geography: geo, values, total: values.reduce((acc, item) => acc + item.value, 0) };
    });
    const geoIndustryMaxValue = Math.max(0, ...geoIndustryRows.flatMap(r => r.values.map(v => v.value)));

    return {
        meta: {
            availableYears: snapshot.availableYears,
            availableGeographies: snapshot.availableGeographies,
            availableSources: snapshot.availableSources,
            usedPythonSnapshot: snapshot.usedPythonSnapshot,
            compilerMessage: snapshot.compilerMessage,
            generatedAt: snapshot.generatedAt
        },
        data: {
            filteredCount: filteredOccupations.length,
            yearlyTrendData: Array.from(byYear.entries())
                .sort((a, b) => a[0] - b[0])
                .map(([y, emp]) => ({ year: y, employmentCount: emp })),
            topOccupationsChartData: occupationLatestTable
                .slice(0, 12)
                .map((item) => ({
                    occupationShort: item.occupation.occupationTitle.length > 38 
                        ? `${item.occupation.occupationTitle.slice(0, 38)}…` 
                        : item.occupation.occupationTitle,
                    employmentCount: item.latest?.employmentCount || 0
                }))
                .reverse(),
            sourceDistributionData: Array.from(bySource.entries())
                .map(([label, total]) => ({ label, total }))
                .sort((a, b) => b.total - a.total),
            geographyDistributionData: Array.from(byGeo.entries())
                .map(([label, total]) => ({ label, total }))
                .sort((a, b) => b.total - a.total),
            latestTableItems: occupationLatestTable,
            geoIndustryMap: {
                geographies: geographiesLimit,
                industries: industriesLimit,
                rows: geoIndustryRows,
                maxValue: geoIndustryMaxValue
            }
        }
    };
}
