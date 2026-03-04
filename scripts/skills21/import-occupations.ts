import { readdir, readFile } from 'fs/promises';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import {
    buildOccupationCanonicalKey,
    compileOccupationRowsFromFiles,
    type CompiledOccupationRow
} from '../../src/lib/occupation-csv';
import { suggestSkillIdsForOccupation } from '../../src/lib/occupation-skill-matching';

type GroupedOccupation = {
    canonicalKey: string;
    dataSource: string;
    geography: string;
    industryCode: string | null;
    occupationCode: string | null;
    occupationTitle: string;
    occupationType: string;
    qualificationLevel: string;
    forecasts: Map<number, {
        year: number;
        employmentCount: number;
        percentOfIndustry: number | null;
        percentOfOccupation: number | null;
    }>;
};

type OccupationUploadStats = {
    fileCount: number;
    compiledRows: number;
    distinctOccupations: number;
    forecastRowsWritten: number;
    occupationsCreated: number;
    occupationsUpdated: number;
    geographies: string[];
    years: number[];
    dataSources: string[];
    topOccupations: Array<{
        occupationTitle: string;
        geography: string;
        year: number;
        employmentCount: number;
    }>;
    usedPythonCompiler: boolean;
    compilerMessage: string;
    linkedOccupations: number;
    updatedOccupationLinks: number;
    skippedOccupationLinks: number;
};

function areSameSet(a: string[], b: string[]): boolean {
    if (a.length !== b.length) return false;
    const setA = new Set(a);
    for (const item of b) {
        if (!setA.has(item)) return false;
    }
    return true;
}

function groupCompiledOccupations(rows: CompiledOccupationRow[]): Map<string, GroupedOccupation> {
    const grouped = new Map<string, GroupedOccupation>();

    for (const row of rows) {
        if (!row.occupationTitle || !row.geography || !Number.isFinite(row.year) || !Number.isFinite(row.employmentCount)) {
            continue;
        }

        const canonicalKey = buildOccupationCanonicalKey({
            dataSource: row.dataSource,
            geography: row.geography,
            industryCode: row.industryCode,
            occupationCode: row.occupationCode,
            occupationTitle: row.occupationTitle,
            occupationType: row.occupationType,
            qualificationLevel: row.qualificationLevel
        });

        let current = grouped.get(canonicalKey);
        if (!current) {
            current = {
                canonicalKey,
                dataSource: row.dataSource,
                geography: row.geography,
                industryCode: row.industryCode,
                occupationCode: row.occupationCode,
                occupationTitle: row.occupationTitle,
                occupationType: row.occupationType,
                qualificationLevel: row.qualificationLevel,
                forecasts: new Map()
            };
            grouped.set(canonicalKey, current);
        }

        current.forecasts.set(row.year, {
            year: row.year,
            employmentCount: row.employmentCount,
            percentOfIndustry: row.percentOfIndustry,
            percentOfOccupation: row.percentOfOccupation
        });
    }

    return grouped;
}

async function generateAnalysisIfAvailable(stats: OccupationUploadStats): Promise<string | null> {
    try {
        const aiModule = await import('../../src/lib/occupation-ai');
        return await aiModule.generateOccupationUploadAnalysis(stats);
    } catch (error) {
        console.warn('[import-occupations] No se pudo ejecutar análisis IA:', error);
        return null;
    }
}

async function main() {
    const inputDir = process.argv[2] || path.join(process.cwd(), 'habilidades SXXI', 'ocupaciones-input');
    const prisma = new PrismaClient();

    try {
        const dirEntries = await readdir(inputDir, { withFileTypes: true });
        const csvFiles = dirEntries.filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith('.csv'));

        if (csvFiles.length === 0) {
            throw new Error(`No se encontraron CSV en ${inputDir}`);
        }

        const uploadedFiles = await Promise.all(
            csvFiles.map(async (entry) => ({
                name: entry.name,
                content: await readFile(path.join(inputDir, entry.name), 'utf8')
            }))
        );

        const compileResult = await compileOccupationRowsFromFiles(uploadedFiles);
        if (compileResult.rows.length === 0) {
            throw new Error('No se encontraron filas válidas al compilar los CSV.');
        }

        const grouped = groupCompiledOccupations(compileResult.rows);
        if (grouped.size === 0) {
            throw new Error('No se pudo agrupar ocupaciones compiladas.');
        }

        const canonicalKeys = Array.from(grouped.keys());
        const existing = await prisma.occupation.findMany({
            where: { canonicalKey: { in: canonicalKeys } },
            select: { id: true, canonicalKey: true }
        });
        const existingByKey = new Map(existing.map((item) => [item.canonicalKey, item.id]));

        const toCreate = canonicalKeys
            .filter((key) => !existingByKey.has(key))
            .map((key) => {
                const item = grouped.get(key)!;
                return {
                    canonicalKey: item.canonicalKey,
                    dataSource: item.dataSource,
                    geography: item.geography,
                    industryCode: item.industryCode,
                    occupationCode: item.occupationCode,
                    occupationTitle: item.occupationTitle,
                    occupationType: item.occupationType,
                    qualificationLevel: item.qualificationLevel
                };
            });

        if (toCreate.length > 0) {
            await prisma.occupation.createMany({ data: toCreate, skipDuplicates: true });
        }

        const touchedOccupations = await prisma.occupation.findMany({
            where: { canonicalKey: { in: canonicalKeys } },
            select: { id: true, canonicalKey: true }
        });

        if (touchedOccupations.length === 0) {
            throw new Error('No fue posible persistir ocupaciones en la base de datos.');
        }

        const occupationIdByKey = new Map(touchedOccupations.map((item) => [item.canonicalKey, item.id]));
        const occupationIds = touchedOccupations.map((item) => item.id);

        await prisma.occupation.updateMany({
            where: { id: { in: occupationIds } },
            data: { isActive: true }
        });

        await prisma.occupationForecast.deleteMany({
            where: { occupationId: { in: occupationIds } }
        });

        const forecastRows: Array<{
            occupationId: string;
            year: number;
            employmentCount: number;
            percentOfIndustry: number | null;
            percentOfOccupation: number | null;
        }> = [];

        for (const [key, occupation] of grouped.entries()) {
            const occupationId = occupationIdByKey.get(key);
            if (!occupationId) continue;

            for (const forecast of occupation.forecasts.values()) {
                forecastRows.push({
                    occupationId,
                    year: forecast.year,
                    employmentCount: forecast.employmentCount,
                    percentOfIndustry: forecast.percentOfIndustry,
                    percentOfOccupation: forecast.percentOfOccupation
                });
            }
        }

        const chunkSize = 1000;
        for (let i = 0; i < forecastRows.length; i += chunkSize) {
            await prisma.occupationForecast.createMany({
                data: forecastRows.slice(i, i + chunkSize)
            });
        }

        const activeSkills = await prisma.twentyFirstSkill.findMany({
            where: { isActive: true },
            select: {
                id: true,
                name: true,
                industry: true,
                category: true,
                tags: true
            }
        });

        const maxOccupationsToLink = 600;
        const targetIds = occupationIds.slice(0, maxOccupationsToLink);
        let linkedCount = 0;
        let updatedLinkCount = 0;
        const skippedCount = Math.max(occupationIds.length - maxOccupationsToLink, 0);

        if (activeSkills.length > 0 && targetIds.length > 0) {
            const occupations = await prisma.occupation.findMany({
                where: { id: { in: targetIds } },
                select: {
                    id: true,
                    occupationTitle: true,
                    occupationType: true,
                    geography: true,
                    qualificationLevel: true,
                    skills: {
                        select: {
                            id: true
                        }
                    }
                }
            });

            const updates: Array<{ occupationId: string; skillIds: string[] }> = [];
            for (const occupation of occupations) {
                const suggested = suggestSkillIdsForOccupation(occupation, activeSkills, {
                    minScore: 3,
                    maxResults: 5
                });
                if (suggested.length > 0) {
                    linkedCount += 1;
                }
                const existingSkillIds = occupation.skills.map((skill) => skill.id);
                if (!areSameSet(existingSkillIds, suggested)) {
                    updates.push({ occupationId: occupation.id, skillIds: suggested });
                }
            }

            const batchSize = 50;
            for (let i = 0; i < updates.length; i += batchSize) {
                const batch = updates.slice(i, i + batchSize);
                await prisma.$transaction(
                    batch.map((item) =>
                        prisma.occupation.update({
                            where: { id: item.occupationId },
                            data: {
                                skills: {
                                    set: item.skillIds.map((id) => ({ id }))
                                }
                            }
                        })
                    )
                );
            }
            updatedLinkCount = updates.length;
        }

        const topOccupations = Array.from(grouped.values())
            .map((item) => {
                const latestForecast = Array.from(item.forecasts.values()).sort((a, b) => b.year - a.year)[0];
                if (!latestForecast) return null;
                return {
                    occupationTitle: item.occupationTitle,
                    geography: item.geography,
                    year: latestForecast.year,
                    employmentCount: latestForecast.employmentCount
                };
            })
            .filter(Boolean)
            .sort((a, b) => (b?.employmentCount || 0) - (a?.employmentCount || 0))
            .slice(0, 5) as Array<{
            occupationTitle: string;
            geography: string;
            year: number;
            employmentCount: number;
        }>;

        const stats: OccupationUploadStats = {
            fileCount: uploadedFiles.length,
            compiledRows: compileResult.rows.length,
            distinctOccupations: grouped.size,
            forecastRowsWritten: forecastRows.length,
            occupationsCreated: toCreate.length,
            occupationsUpdated: grouped.size - toCreate.length,
            geographies: Array.from(new Set(compileResult.rows.map((row) => row.geography))).sort(),
            years: Array.from(new Set(compileResult.rows.map((row) => row.year))).sort((a, b) => a - b),
            dataSources: Array.from(new Set(compileResult.rows.map((row) => row.dataSource))).sort(),
            topOccupations,
            usedPythonCompiler: compileResult.usedPythonCompiler,
            compilerMessage: compileResult.compilerMessage,
            linkedOccupations: linkedCount,
            updatedOccupationLinks: updatedLinkCount,
            skippedOccupationLinks: skippedCount
        };

        const analysis = await generateAnalysisIfAvailable(stats);

        await prisma.activityLog.create({
            data: {
                action: 'INGEST_21C_OCCUPATIONS_CLI',
                level: 'INFO',
                description: `Importación CLI: ${stats.distinctOccupations} ocupaciones y ${stats.forecastRowsWritten} proyecciones.`,
                metadata: {
                    inputDir,
                    ...stats,
                    analysis: analysis || null
                }
            }
        });

        console.log(JSON.stringify({ success: true, inputDir, stats, analysis }, null, 2));
    } finally {
        await prisma.$disconnect();
    }
}

main().catch((error) => {
    console.error('[import-occupations] error:', error);
    process.exit(1);
});
