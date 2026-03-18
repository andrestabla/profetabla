import 'server-only';

import { spawn } from 'child_process';
import { mkdtemp, readFile, rm, writeFile } from 'fs/promises';
import { LRUCache } from 'lru-cache';
import os from 'os';
import path from 'path';
import { prisma } from '@/lib/prisma';
import type {
    Skills21HomeDemandRow,
    Skills21HomeInsightsFilters,
    Skills21HomeInsightsResult
} from '@/lib/skills21-home-insights-types';

type SnapshotOccupation = {
    id: string;
    occupationTitle: string;
    occupationCode: string | null;
    geography: string;
    industry: string;
    forecasts: Array<{
        year: number;
        employmentCount: number;
    }>;
    skills: Array<{
        id: string;
        name: string;
        industry: string;
        category: string | null;
    }>;
};

type SnapshotDemandRow = Skills21HomeDemandRow & {
    year: number;
};

type SnapshotSkillRow = {
    occupationId: string;
    occupationTitle: string;
    geography: string;
    industry: string;
    year: number;
    employmentCount: number;
    skillId: string;
    skillName: string;
    skillIndustry: string;
    skillCategory: string | null;
};

type HomeSnapshot = {
    latestOccupationYear: number | null;
    occupationYears: number[];
    occupationIndustries: string[];
    occupationGeographies: string[];
    demandRows: SnapshotDemandRow[];
    skillRows: SnapshotSkillRow[];
    usedPythonSnapshot: boolean;
    compilerMessage: string;
    generatedAt: string;
};

const SNAPSHOT_CACHE_KEY = 'skills21-home-snapshot:v1';
const snapshotCache = new LRUCache<string, Promise<HomeSnapshot>>({
    max: 1,
    ttl: 15 * 60 * 1000
});

function truncateLabel(value: string, size = 44) {
    return value.length > size ? `${value.slice(0, size)}…` : value;
}

function normalizeYearFilter(value?: string | null) {
    if (!value) return 'AUTO';
    const trimmed = value.trim();
    if (!trimmed || trimmed.toUpperCase() === 'AUTO') return 'AUTO';
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? String(Math.trunc(parsed)) : 'AUTO';
}

function normalizeDimensionFilter(value?: string | null) {
    if (!value) return 'ALL';
    const trimmed = value.trim();
    return trimmed ? trimmed : 'ALL';
}

function resolveSelectedYear(value: string, latestOccupationYear: number | null) {
    if (value === 'AUTO') return latestOccupationYear;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : latestOccupationYear;
}

function stripDemandRow(row: SnapshotDemandRow): Skills21HomeDemandRow {
    return {
        id: row.id,
        occupationTitle: row.occupationTitle,
        occupationCode: row.occupationCode,
        geography: row.geography,
        industry: row.industry,
        employmentCount: Number(row.employmentCount.toFixed(2)),
        skillCount: row.skillCount
    };
}

async function loadSnapshotOccupations(): Promise<SnapshotOccupation[]> {
    const occupations = await prisma.occupation.findMany({
        orderBy: [
            { updatedAt: 'desc' },
            { occupationTitle: 'asc' }
        ],
        take: 1000,
        select: {
            id: true,
            occupationTitle: true,
            occupationCode: true,
            geography: true,
            industryCode: true,
            forecasts: {
                orderBy: { year: 'asc' },
                select: {
                    year: true,
                    employmentCount: true
                }
            },
            skills: {
                select: {
                    id: true,
                    name: true,
                    industry: true,
                    category: true
                },
                orderBy: [
                    { industry: 'asc' },
                    { name: 'asc' }
                ]
            }
        }
    });

    return occupations.map((occupation) => ({
        id: occupation.id,
        occupationTitle: occupation.occupationTitle,
        occupationCode: occupation.occupationCode,
        geography: occupation.geography,
        industry: occupation.industryCode?.trim() || 'Sin industria',
        forecasts: occupation.forecasts
            .filter((forecast) => Number.isFinite(forecast.employmentCount))
            .map((forecast) => ({
                year: forecast.year,
                employmentCount: forecast.employmentCount
            })),
        skills: occupation.skills.map((skill) => ({
            id: skill.id,
            name: skill.name,
            industry: skill.industry,
            category: skill.category
        }))
    }));
}

function compileSnapshotFallback(occupations: SnapshotOccupation[]): HomeSnapshot {
    const demandRows: SnapshotDemandRow[] = [];
    const skillRows: SnapshotSkillRow[] = [];
    const years = new Set<number>();
    const industries = new Set<string>();
    const geographies = new Set<string>();

    for (const occupation of occupations) {
        if (!occupation.id || !occupation.occupationTitle || !occupation.geography) continue;
        industries.add(occupation.industry);
        geographies.add(occupation.geography);

        for (const forecast of occupation.forecasts) {
            if (!Number.isFinite(forecast.year) || !Number.isFinite(forecast.employmentCount)) continue;

            years.add(forecast.year);
            demandRows.push({
                id: occupation.id,
                occupationTitle: occupation.occupationTitle,
                occupationCode: occupation.occupationCode,
                geography: occupation.geography,
                industry: occupation.industry,
                year: forecast.year,
                employmentCount: forecast.employmentCount,
                skillCount: occupation.skills.length
            });

            for (const skill of occupation.skills) {
                if (!skill.id || !skill.name) continue;
                skillRows.push({
                    occupationId: occupation.id,
                    occupationTitle: occupation.occupationTitle,
                    geography: occupation.geography,
                    industry: occupation.industry,
                    year: forecast.year,
                    employmentCount: forecast.employmentCount,
                    skillId: skill.id,
                    skillName: skill.name,
                    skillIndustry: skill.industry,
                    skillCategory: skill.category
                });
            }
        }
    }

    const occupationYears = Array.from(years).sort((a, b) => a - b);

    return {
        latestOccupationYear: occupationYears[occupationYears.length - 1] || null,
        occupationYears,
        occupationIndustries: Array.from(industries).sort((a, b) => a.localeCompare(b)),
        occupationGeographies: Array.from(geographies).sort((a, b) => a.localeCompare(b)),
        demandRows,
        skillRows,
        usedPythonSnapshot: false,
        compilerMessage: 'Fallback TypeScript aplicado.',
        generatedAt: new Date().toISOString()
    };
}

async function runPythonSnapshotCompiler(occupations: SnapshotOccupation[]): Promise<{ ok: boolean; snapshot?: HomeSnapshot; error?: string; output: string }> {
    const tempDir = await mkdtemp(path.join(os.tmpdir(), 'skills21-home-'));
    const inputFilePath = path.join(tempDir, 'home-input.json');
    const outputFilePath = path.join(tempDir, 'home-output.json');
    const scriptPath = path.join(process.cwd(), 'scripts', 'skills21', 'build_home_insights.py');
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

                child.stdout.on('data', (chunk) => {
                    stdout += chunk.toString();
                });
                child.stderr.on('data', (chunk) => {
                    stderr += chunk.toString();
                });
                child.on('close', (code) => resolve({ code, stdout, stderr }));
                child.on('error', (error) => {
                    resolve({
                        code: 1,
                        stdout,
                        stderr: `${stderr}\n${String(error)}`
                    });
                });
            });

            if (result.code === 0) {
                const compiledContent = await readFile(outputFilePath, 'utf8');
                const parsed = JSON.parse(compiledContent) as Omit<HomeSnapshot, 'usedPythonSnapshot' | 'compilerMessage' | 'generatedAt'>;
                return {
                    ok: true,
                    output: result.stdout.trim() || 'Snapshot Home generado con Python.',
                    snapshot: {
                        latestOccupationYear: parsed.latestOccupationYear ?? null,
                        occupationYears: Array.isArray(parsed.occupationYears) ? parsed.occupationYears : [],
                        occupationIndustries: Array.isArray(parsed.occupationIndustries) ? parsed.occupationIndustries : [],
                        occupationGeographies: Array.isArray(parsed.occupationGeographies) ? parsed.occupationGeographies : [],
                        demandRows: Array.isArray(parsed.demandRows) ? parsed.demandRows : [],
                        skillRows: Array.isArray(parsed.skillRows) ? parsed.skillRows : [],
                        usedPythonSnapshot: true,
                        compilerMessage: result.stdout.trim() || 'Snapshot Home generado con Python.',
                        generatedAt: new Date().toISOString()
                    }
                };
            }

            errors.push(`bin=${bin} stderr=${result.stderr.trim()}`.trim());
        }

        return {
            ok: false,
            output: '',
            error: errors.length > 0
                ? errors.join(' | ')
                : 'No se pudo ejecutar compilador Python de Home.'
        };
    } finally {
        await rm(tempDir, { recursive: true, force: true });
    }
}

async function buildHomeSnapshot(): Promise<HomeSnapshot> {
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

async function getHomeSnapshot(): Promise<HomeSnapshot> {
    const cached = snapshotCache.get(SNAPSHOT_CACHE_KEY);
    if (cached) {
        return cached;
    }

    const snapshotPromise = buildHomeSnapshot().catch((error) => {
        snapshotCache.delete(SNAPSHOT_CACHE_KEY);
        throw error;
    });
    snapshotCache.set(SNAPSHOT_CACHE_KEY, snapshotPromise);
    return snapshotPromise;
}

export function resetSkills21HomeInsightsCache() {
    snapshotCache.clear();
}

export async function getSkills21HomeInsights(filters: Skills21HomeInsightsFilters = {}): Promise<Skills21HomeInsightsResult> {
    const snapshot = await getHomeSnapshot();
    const demandYear = normalizeYearFilter(filters.demandYear);
    const demandIndustry = normalizeDimensionFilter(filters.demandIndustry);
    const demandGeography = normalizeDimensionFilter(filters.demandGeography);
    const skillsYear = normalizeYearFilter(filters.skillsYear);
    const skillsIndustry = normalizeDimensionFilter(filters.skillsIndustry);
    const skillsGeography = normalizeDimensionFilter(filters.skillsGeography);
    const skillsOccupationId = normalizeDimensionFilter(filters.skillsOccupationId);

    const selectedDemandYear = resolveSelectedYear(demandYear, snapshot.latestOccupationYear);
    const demandRows = selectedDemandYear === null
        ? []
        : snapshot.demandRows.filter((row) => {
            if (row.year !== selectedDemandYear) return false;
            if (demandIndustry !== 'ALL' && row.industry !== demandIndustry) return false;
            if (demandGeography !== 'ALL' && row.geography !== demandGeography) return false;
            return true;
        });

    const topOccupations = [...demandRows]
        .sort((a, b) => b.employmentCount - a.employmentCount)
        .slice(0, 15)
        .map(stripDemandRow);

    const lowestSupply = [...demandRows]
        .filter((row) => row.employmentCount > 0)
        .sort((a, b) => a.employmentCount - b.employmentCount)
        .slice(0, 15)
        .map(stripDemandRow);

    const selectedSkillsYear = resolveSelectedYear(skillsYear, snapshot.latestOccupationYear);
    const scopedDemandRows = selectedSkillsYear === null
        ? []
        : snapshot.demandRows.filter((row) => {
            if (row.year !== selectedSkillsYear) return false;
            if (skillsIndustry !== 'ALL' && row.industry !== skillsIndustry) return false;
            if (skillsGeography !== 'ALL' && row.geography !== skillsGeography) return false;
            return true;
        });

    const scopedSkillRows = selectedSkillsYear === null
        ? []
        : snapshot.skillRows.filter((row) => {
            if (row.year !== selectedSkillsYear) return false;
            if (skillsIndustry !== 'ALL' && row.industry !== skillsIndustry) return false;
            if (skillsGeography !== 'ALL' && row.geography !== skillsGeography) return false;
            return true;
        });

    const occupationOptionsMap = new Map<string, { id: string; label: string }>();
    for (const row of scopedSkillRows) {
        if (occupationOptionsMap.has(row.occupationId)) continue;
        occupationOptionsMap.set(row.occupationId, {
            id: row.occupationId,
            label: `${row.occupationTitle} (${row.geography})`
        });
    }

    const occupationOptions = Array.from(occupationOptionsMap.values())
        .sort((a, b) => a.label.localeCompare(b.label))
        .slice(0, 300);

    const topSkillsMap = new Map<string, {
        id: string;
        name: string;
        industry: string;
        category: string | null;
        demand: number;
        occupationIds: Set<string>;
    }>();

    for (const row of scopedSkillRows) {
        if (skillsOccupationId !== 'ALL' && row.occupationId !== skillsOccupationId) continue;

        const current = topSkillsMap.get(row.skillId);
        if (!current) {
            topSkillsMap.set(row.skillId, {
                id: row.skillId,
                name: row.skillName,
                industry: row.skillIndustry,
                category: row.skillCategory,
                demand: row.employmentCount,
                occupationIds: new Set([row.occupationId])
            });
            continue;
        }

        current.demand += row.employmentCount;
        current.occupationIds.add(row.occupationId);
    }

    const topSkills = Array.from(topSkillsMap.values())
        .map((row) => ({
            id: row.id,
            name: row.name,
            industry: row.industry,
            category: row.category,
            demand: Number(row.demand.toFixed(2)),
            occupationCount: row.occupationIds.size
        }))
        .sort((a, b) => b.demand - a.demand)
        .slice(0, 50);

    return {
        meta: {
            latestOccupationYear: snapshot.latestOccupationYear,
            occupationYears: snapshot.occupationYears,
            occupationIndustries: snapshot.occupationIndustries,
            occupationGeographies: snapshot.occupationGeographies,
            usedPythonSnapshot: snapshot.usedPythonSnapshot,
            compilerMessage: snapshot.compilerMessage,
            generatedAt: snapshot.generatedAt
        },
        demand: {
            selectedYear: selectedDemandYear,
            rowCount: demandRows.length,
            topOccupations,
            lowestSupply,
            chartData: topOccupations
                .slice(0, 10)
                .map((row) => ({
                    occupationShort: truncateLabel(row.occupationTitle, 34),
                    employmentCount: row.employmentCount
                }))
                .reverse()
        },
        skills: {
            selectedYear: selectedSkillsYear,
            scopeOccupationCount: new Set(scopedDemandRows.map((row) => row.id)).size,
            occupationOptions,
            topSkills,
            chartData: topSkills
                .slice(0, 12)
                .map((row) => ({
                    skillShort: truncateLabel(row.name, 32),
                    demand: row.demand
                }))
                .reverse()
        }
    };
}
