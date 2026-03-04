'use server';

import { getServerSession } from 'next-auth';
import { revalidatePath } from 'next/cache';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logActivity } from '@/lib/activity';
import { Prisma } from '@prisma/client';
import { buildOccupationCanonicalKey, compileOccupationRowsFromFiles, type CompiledOccupationRow } from '@/lib/occupation-csv';
import { generateOccupationUploadAnalysis } from '@/lib/occupation-ai';
import { fetchEscoSkillsPage } from '@/lib/esco';
import { suggestSkillIdsForOccupation } from '@/lib/occupation-skill-matching';
import { fetchMindOntologySkills } from '@/lib/mind-ontology';
import {
    extractSocCodeFromBlsOeSeriesId,
    fetchBlsOeEmploymentSeriesBySocCodes,
    fetchBlsPopularOeSeriesIds,
    formatSocCode
} from '@/lib/bls';

type CreateSkillPayload = {
    name: string;
    industry: string;
    category?: string;
    description: string;
    trendSummary?: string;
    examplesText?: string;
    sourcesText?: string;
    tagsText?: string;
};

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

function parseList(text?: string) {
    return (text || '')
        .split('\n')
        .map((item) => item.trim())
        .filter(Boolean);
}

function parseSocCodesFromText(text?: string): string[] {
    return (text || '')
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => line.replace(/\s+/g, ''))
        .map((line) => line.replace(/[^\d-]/g, ''))
        .map((line) => line.replace(/\D/g, ''))
        .filter((digits) => digits.length === 6);
}

function parseSources(text?: string) {
    const lines = parseList(text);
    const sources: Array<{ title: string; url: string }> = [];

    for (const line of lines) {
        const [left, right] = line.includes('|')
            ? line.split('|', 2)
            : [line, line];

        const title = left.trim();
        const url = right.trim();

        try {
            const parsed = new URL(url);
            sources.push({
                title: title || parsed.hostname,
                url: parsed.toString(),
            });
        } catch {
            // Ignore invalid lines instead of breaking skill creation.
        }
    }

    return sources;
}

function normalizeTag(tag: string): string {
    return tag
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '-')
        .slice(0, 48);
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

function areSameSet(a: string[], b: string[]): boolean {
    if (a.length !== b.length) return false;
    const setA = new Set(a);
    for (const item of b) {
        if (!setA.has(item)) return false;
    }
    return true;
}

async function linkOccupationsWithSkills(occupationIds: string[]) {
    const MAX_OCCUPATIONS_TO_LINK = 600;
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

    if (activeSkills.length === 0) {
        return {
            linkedCount: 0,
            skippedCount: Math.max(occupationIds.length - MAX_OCCUPATIONS_TO_LINK, 0)
        };
    }

    const targetIds = occupationIds.slice(0, MAX_OCCUPATIONS_TO_LINK);
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
    let occupationsWithSuggestedSkills = 0;
    for (const occupation of occupations) {
        const suggested = suggestSkillIdsForOccupation(occupation, activeSkills, {
            minScore: 3,
            maxResults: 5
        });
        if (suggested.length > 0) {
            occupationsWithSuggestedSkills += 1;
        }
        const existing = occupation.skills.map((skill) => skill.id);
        if (!areSameSet(existing, suggested)) {
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

    return {
        linkedCount: occupationsWithSuggestedSkills,
        updatedCount: updates.length,
        skippedCount: Math.max(occupationIds.length - MAX_OCCUPATIONS_TO_LINK, 0)
    };
}

async function readCsvUploadsFromFormData(formData: FormData) {
    const entries = formData.getAll('occupationFiles');
    const files: File[] = entries.filter((entry): entry is File => {
        return typeof File !== 'undefined' && entry instanceof File && entry.size > 0;
    });

    if (files.length === 0) {
        return { files: [], error: 'Debes seleccionar al menos un archivo CSV.' };
    }

    const invalid = files.filter((file) => !file.name.toLowerCase().endsWith('.csv'));
    if (invalid.length > 0) {
        return { files: [], error: `Formato inválido: ${invalid.map((file) => file.name).join(', ')}.` };
    }

    const totalBytes = files.reduce((acc, file) => acc + file.size, 0);
    const maxBytes = 40 * 1024 * 1024;
    if (totalBytes > maxBytes) {
        return { files: [], error: 'La carga excede 40MB. Divide el lote en archivos más pequeños.' };
    }

    const inMemory = await Promise.all(
        files.map(async (file) => ({
            name: file.name,
            content: await file.text()
        }))
    );

    return { files: inMemory, error: null };
}

export async function ingestOccupationsCsvAction(formData: FormData) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== 'ADMIN') {
            return { success: false, error: 'Solo el rol ADMIN puede cargar ocupaciones.' };
        }

        const uploaded = await readCsvUploadsFromFormData(formData);
        if (uploaded.error) {
            return { success: false, error: uploaded.error };
        }

        const compileResult = await compileOccupationRowsFromFiles(uploaded.files);
        if (compileResult.rows.length === 0) {
            return {
                success: false,
                error: 'No se encontraron registros válidos en los CSV suministrados.'
            };
        }

        const grouped = groupCompiledOccupations(compileResult.rows);
        if (grouped.size === 0) {
            return { success: false, error: 'No se pudo estructurar la información de ocupaciones.' };
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
            await prisma.occupation.createMany({
                data: toCreate,
                skipDuplicates: true
            });
        }

        const touchedOccupations = await prisma.occupation.findMany({
            where: { canonicalKey: { in: canonicalKeys } },
            select: { id: true, canonicalKey: true }
        });

        if (touchedOccupations.length === 0) {
            return { success: false, error: 'No fue posible persistir ocupaciones en la base de datos.' };
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

        const linking = await linkOccupationsWithSkills(occupationIds);

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
            .slice(0, 5);

        const stats = {
            fileCount: uploaded.files.length,
            compiledRows: compileResult.rows.length,
            distinctOccupations: grouped.size,
            forecastRowsWritten: forecastRows.length,
            occupationsCreated: toCreate.length,
            occupationsUpdated: grouped.size - toCreate.length,
            geographies: Array.from(new Set(compileResult.rows.map((row) => row.geography))).sort(),
            years: Array.from(new Set(compileResult.rows.map((row) => row.year))).sort((a, b) => a - b),
            dataSources: Array.from(new Set(compileResult.rows.map((row) => row.dataSource))).sort(),
            topOccupations: topOccupations as Array<{
                occupationTitle: string;
                geography: string;
                year: number;
                employmentCount: number;
            }>,
            usedPythonCompiler: compileResult.usedPythonCompiler,
            compilerMessage: compileResult.compilerMessage,
            linkedOccupations: linking.linkedCount,
            updatedOccupationLinks: linking.updatedCount,
            skippedOccupationLinks: linking.skippedCount
        };

        const aiAnalysis = await generateOccupationUploadAnalysis(stats);

        await logActivity(
            session.user.id,
            'INGEST_21C_OCCUPATIONS',
            `Cargó ${stats.distinctOccupations} ocupaciones y ${stats.forecastRowsWritten} proyecciones desde ${stats.fileCount} archivo(s).`,
            'INFO',
            {
                ...stats,
                aiAnalysis: aiAnalysis || null
            }
        );

        revalidatePath('/dashboard/skills21');
        revalidatePath('/dashboard/professor/projects/new');
        revalidatePath('/dashboard/professor/challenges/new');
        revalidatePath('/dashboard/professor/problems/new');

        return {
            success: true,
            stats,
            analysis: aiAnalysis
        };
    } catch (error) {
        console.error('[ingestOccupationsCsvAction] error:', error);
        return { success: false, error: 'No se pudo procesar la carga de ocupaciones.' };
    }
}

export async function syncOccupationsFromBlsAction(payload?: {
    incremental?: boolean;
    startYear?: number;
    endYear?: number;
    maxCodes?: number;
    includePopular?: boolean;
    codesText?: string;
    deactivateMissing?: boolean;
}) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== 'ADMIN') {
            return { success: false, error: 'Solo el rol ADMIN puede sincronizar ocupaciones desde BLS.' };
        }

        const currentYear = new Date().getFullYear();
        const incremental = payload?.incremental !== false;
        const requestedStartYear = Math.max(1999, Math.min(currentYear, payload?.startYear || currentYear - 5));
        const requestedEndYear = Math.max(requestedStartYear, Math.min(currentYear, payload?.endYear || currentYear));
        let startYear = requestedStartYear;
        let endYear = requestedEndYear;
        const maxCodes = Math.max(20, Math.min(1200, payload?.maxCodes || 120));
        const includePopular = payload?.includePopular !== false;
        const deactivateMissing = Boolean(payload?.deactivateMissing);
        const manualSocCodes = parseSocCodesFromText(payload?.codesText);

        let lastSyncedYear: number | null = null;
        if (incremental) {
            const latestForecast = await prisma.occupationForecast.findFirst({
                where: {
                    occupation: {
                        dataSource: 'US_BLS_API_OE',
                        geography: 'USA'
                    }
                },
                orderBy: {
                    year: 'desc'
                },
                select: {
                    year: true
                }
            });

            lastSyncedYear = latestForecast?.year ?? null;
            if (lastSyncedYear !== null) {
                startYear = Math.max(1999, Math.min(currentYear, lastSyncedYear - 1));
            }
            endYear = currentYear;
        }

        const existingRows = await prisma.occupation.findMany({
            where: {
                occupationCode: { not: null },
                geography: 'USA'
            },
            select: {
                occupationCode: true,
                occupationTitle: true,
                occupationType: true
            },
            orderBy: [
                { updatedAt: 'desc' }
            ],
            take: 4000
        });

        const titleBySocCode = new Map<string, string>();
        const existingSocCodes: string[] = [];
        for (const row of existingRows) {
            const digits = (row.occupationCode || '').replace(/\D/g, '');
            if (digits.length !== 6) continue;

            if (!titleBySocCode.has(digits)) {
                titleBySocCode.set(digits, row.occupationTitle);
            } else if (row.occupationType.toLowerCase().includes('line item')) {
                // Prioriza títulos más específicos cuando existan.
                titleBySocCode.set(digits, row.occupationTitle);
            }

            existingSocCodes.push(digits);
        }

        const popularSocCodes: string[] = [];
        if (includePopular) {
            try {
                const popularSeries = await fetchBlsPopularOeSeriesIds();
                for (const seriesId of popularSeries) {
                    const socCode = extractSocCodeFromBlsOeSeriesId(seriesId);
                    if (socCode) {
                        popularSocCodes.push(socCode);
                    }
                }
            } catch (error) {
                console.warn('[syncOccupationsFromBlsAction] No se pudieron leer series populares de BLS:', error);
            }
        }

        const requestedSocCodes: string[] = [];
        const seenSocCodes = new Set<string>();
        const pushSocCode = (socCode: string) => {
            if (seenSocCodes.has(socCode)) return;
            seenSocCodes.add(socCode);
            requestedSocCodes.push(socCode);
        };

        manualSocCodes.forEach(pushSocCode);
        existingSocCodes.forEach(pushSocCode);
        popularSocCodes.forEach(pushSocCode);

        const targetSocCodes = requestedSocCodes.slice(0, maxCodes);
        if (targetSocCodes.length === 0) {
            return {
                success: false,
                error: 'No hay códigos SOC para sincronizar. Agrega códigos manuales o carga ocupaciones base.'
            };
        }

        const blsApiKey = (process.env.BLS_API_KEY || '').trim();
        const bls = await fetchBlsOeEmploymentSeriesBySocCodes({
            socCodes: targetSocCodes,
            startYear,
            endYear,
            registrationKey: blsApiKey || undefined
        });

        if (bls.records.length === 0) {
            return {
                success: false,
                error: 'BLS no devolvió series con datos para los códigos solicitados.'
            };
        }

        const blsRows: CompiledOccupationRow[] = [];
        for (const record of bls.records) {
            const occupationCode = formatSocCode(record.socCode);
            const occupationTitle = titleBySocCode.get(record.socCode) || `Ocupación SOC ${occupationCode}`;

            for (const point of record.points) {
                blsRows.push({
                    dataSource: 'US_BLS_API_OE',
                    geography: 'USA',
                    industryCode: null,
                    occupationCode,
                    occupationTitle,
                    occupationType: 'Serie BLS',
                    qualificationLevel: 'Total',
                    year: point.year,
                    employmentCount: point.employmentCount,
                    percentOfIndustry: null,
                    percentOfOccupation: null
                });
            }
        }

        const grouped = groupCompiledOccupations(blsRows);
        if (grouped.size === 0) {
            return { success: false, error: 'No se pudieron consolidar ocupaciones válidas desde BLS.' };
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
            await prisma.occupation.createMany({
                data: toCreate,
                skipDuplicates: true
            });
        }

        const touchedOccupations = await prisma.occupation.findMany({
            where: { canonicalKey: { in: canonicalKeys } },
            select: { id: true, canonicalKey: true }
        });

        if (touchedOccupations.length === 0) {
            return { success: false, error: 'No fue posible persistir ocupaciones sincronizadas de BLS.' };
        }

        const occupationIdByKey = new Map(touchedOccupations.map((item) => [item.canonicalKey, item.id]));
        const occupationIds = touchedOccupations.map((item) => item.id);

        await prisma.occupation.updateMany({
            where: { id: { in: occupationIds } },
            data: { isActive: true }
        });

        if (deactivateMissing) {
            await prisma.occupation.updateMany({
                where: {
                    dataSource: 'US_BLS_API_OE',
                    canonicalKey: { notIn: canonicalKeys }
                },
                data: {
                    isActive: false
                }
            });
        }

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

        const linking = await linkOccupationsWithSkills(occupationIds);
        const topOccupations = Array.from(grouped.values())
            .map((item) => {
                const latestForecast = Array.from(item.forecasts.values()).sort((a, b) => b.year - a.year)[0];
                if (!latestForecast) return null;
                return {
                    occupationTitle: item.occupationTitle,
                    occupationCode: item.occupationCode,
                    year: latestForecast.year,
                    employmentCount: latestForecast.employmentCount
                };
            })
            .filter(Boolean)
            .sort((a, b) => (b?.employmentCount || 0) - (a?.employmentCount || 0))
            .slice(0, 5);

        const stats = {
            mode: incremental ? 'incremental' : 'full',
            requestedStartYear,
            requestedEndYear,
            startYear,
            endYear,
            lastSyncedYear,
            requestedSocCodes: targetSocCodes.length,
            seriesRequested: bls.requestedSeries,
            seriesWithData: bls.successfulSeries,
            seriesWithoutData: bls.emptySeries,
            occupationsSynced: grouped.size,
            occupationsCreated: toCreate.length,
            occupationsUpdated: grouped.size - toCreate.length,
            forecastRowsWritten: forecastRows.length,
            linkedOccupations: linking.linkedCount,
            updatedOccupationLinks: linking.updatedCount,
            skippedOccupationLinks: linking.skippedCount,
            topOccupations: topOccupations as Array<{
                occupationTitle: string;
                occupationCode: string | null;
                year: number;
                employmentCount: number;
            }>,
            warnings: bls.messages.slice(0, 12)
        };

        await logActivity(
            session.user.id,
            'SYNC_21C_OCCUPATIONS_BLS',
            `Sincronizó ${stats.occupationsSynced} ocupaciones desde BLS API (${stats.startYear}-${stats.endYear}).`,
            'INFO',
            stats
        );

        revalidatePath('/dashboard/skills21');
        revalidatePath('/dashboard/professor/projects/new');
        revalidatePath('/dashboard/professor/challenges/new');
        revalidatePath('/dashboard/professor/problems/new');

        return {
            success: true,
            stats
        };
    } catch (error) {
        console.error('[syncOccupationsFromBlsAction] error:', error);
        const message = error instanceof Error ? error.message : '';
        if (message.toLowerCase().includes('daily threshold')) {
            return {
                success: false,
                error: 'BLS API alcanzó el límite diario de solicitudes. Configura `BLS_API_KEY` o reduce el número de códigos SOC.'
            };
        }
        if (message) {
            return { success: false, error: `No se pudo sincronizar ocupaciones desde BLS API: ${message}` };
        }
        return { success: false, error: 'No se pudo sincronizar ocupaciones desde BLS API.' };
    }
}

export async function syncSkillsFromEscoAction(payload?: {
    language?: string;
    maxSkills?: number;
    deactivateMissing?: boolean;
}) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== 'ADMIN') {
            return { success: false, error: 'Solo el rol ADMIN puede sincronizar habilidades desde ESCO.' };
        }

        const language = (payload?.language || 'es').trim().toLowerCase();
        const maxSkills = Math.max(20, Math.min(3000, payload?.maxSkills || 300));
        const deactivateMissing = Boolean(payload?.deactivateMissing);

        const pageSize = maxSkills > 1000 ? 50 : 100;
        let page = 0;
        let total = 0;
        let failedPages = 0;
        const fetched: Array<{
            uri: string;
            title: string;
            description: string;
            tags: string[];
            language: string;
            sourceUrl: string;
        }> = [];

        while (fetched.length < maxSkills && page < 500) {
            let response;
            try {
                response = await fetchEscoSkillsPage({
                    language,
                    limit: pageSize,
                    page
                });
                failedPages = 0;
            } catch (error) {
                failedPages += 1;
                if (failedPages <= 8) {
                    page += 1;
                    continue;
                }
                throw error;
            }

            total = response.total;
            if (response.skills.length === 0) break;

            for (const skill of response.skills) {
                fetched.push(skill);
                if (fetched.length >= maxSkills) break;
            }

            page += 1;
            if (response.skills.length < pageSize) break;
        }

        const uniqueByUri = new Map(fetched.map((skill) => [skill.uri, skill]));
        const skills = Array.from(uniqueByUri.values());
        if (skills.length === 0) {
            return {
                success: false,
                error: 'ESCO no devolvió habilidades para los parámetros solicitados.'
            };
        }

        const uris = skills.map((skill) => skill.uri);
        const existing = await prisma.twentyFirstSkill.findMany({
            where: {
                sourceUri: { in: uris }
            },
            select: {
                sourceUri: true
            }
        });
        const existingUris = new Set(existing.map((row) => row.sourceUri).filter(Boolean) as string[]);

        let created = 0;
        let updated = 0;
        let renamedForUniqueness = 0;

        for (const skill of skills) {
            const baseName = skill.title.trim().slice(0, 180);
            const shortId = skill.uri.split('/').pop()?.slice(0, 8) || 'esco';
            const fallbackName = `${baseName} [${shortId}]`.slice(0, 190);

            const description = skill.description?.trim()
                || `Habilidad importada desde ESCO (${skill.language.toUpperCase()}).`;
            const tags = Array.from(
                new Set([
                    ...skill.tags.map(normalizeTag).filter(Boolean),
                    'esco'
                ])
            ).slice(0, 16);

            const sources = [
                { title: 'API de ESCO', url: skill.sourceUrl },
                { title: 'URI de ESCO', url: skill.uri },
                { title: 'Documentación de la API de ESCO', url: 'https://ec.europa.eu/esco/api/doc/esco_api_doc.html' }
            ];

            const upsert = async (name: string) => prisma.twentyFirstSkill.upsert({
                where: { sourceUri: skill.uri },
                create: {
                    name,
                    industry: 'ESCO',
                    category: 'Habilidades UE',
                    description,
                    trendSummary: 'Sincronizada desde ESCO API',
                    tags,
                    sources,
                    isActive: true,
                    sourceProvider: 'ESCO',
                    sourceUri: skill.uri,
                    sourceLanguage: skill.language,
                    sourceLastSyncedAt: new Date()
                },
                update: {
                    name,
                    description,
                    trendSummary: 'Sincronizada desde ESCO API',
                    tags,
                    sources,
                    isActive: true,
                    sourceProvider: 'ESCO',
                    sourceLanguage: skill.language,
                    sourceLastSyncedAt: new Date()
                }
            });

            try {
                await upsert(baseName);
            } catch (error) {
                if (
                    error instanceof Prisma.PrismaClientKnownRequestError
                    && error.code === 'P2002'
                ) {
                    await upsert(fallbackName);
                    renamedForUniqueness += 1;
                } else {
                    throw error;
                }
            }

            if (existingUris.has(skill.uri)) {
                updated += 1;
            } else {
                created += 1;
            }
        }

        let deactivated = 0;
        if (deactivateMissing) {
            const result = await prisma.twentyFirstSkill.updateMany({
                where: {
                    sourceProvider: 'ESCO',
                    sourceUri: {
                        notIn: uris
                    }
                },
                data: {
                    isActive: false
                }
            });
            deactivated = result.count;
        }

        await logActivity(
            session.user.id,
            'SYNC_21C_SKILLS_ESCO',
            `Sincronizó ${skills.length} habilidades desde ESCO (${language}). Creadas: ${created}, actualizadas: ${updated}.`,
            'INFO',
            {
                language,
                maxSkills,
                totalAvailable: total,
                fetched: fetched.length,
                synced: skills.length,
                created,
                updated,
                renamedForUniqueness,
                deactivated
            }
        );

        revalidatePath('/dashboard/skills21');
        revalidatePath('/dashboard/professor/projects/new');
        revalidatePath('/dashboard/professor/challenges/new');
        revalidatePath('/dashboard/professor/problems/new');

        return {
            success: true,
            stats: {
                language,
                totalAvailable: total,
                fetched: fetched.length,
                synced: skills.length,
                created,
                updated,
                renamedForUniqueness,
                deactivated
            }
        };
    } catch (error) {
        console.error('[syncSkillsFromEscoAction] error:', error);
        return { success: false, error: 'No se pudo sincronizar habilidades desde ESCO.' };
    }
}

export async function syncSkillsFromMindOntologyAction(payload?: {
    maxSkills?: number;
    deactivateMissing?: boolean;
    sourceUrl?: string;
}) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== 'ADMIN') {
            return { success: false, error: 'Solo el rol ADMIN puede sincronizar habilidades desde MIND Tech Ontology.' };
        }

        const maxSkills = Math.max(50, Math.min(6000, payload?.maxSkills || 1200));
        const deactivateMissing = Boolean(payload?.deactivateMissing);
        const sourceUrl = (payload?.sourceUrl || '').trim() || undefined;

        const fetched = await fetchMindOntologySkills({
            maxSkills,
            url: sourceUrl
        });

        if (fetched.skills.length === 0) {
            return {
                success: false,
                error: 'MIND Tech Ontology no devolvió habilidades para los parámetros solicitados.'
            };
        }

        const uris = fetched.skills.map((skill) => skill.sourceUri);
        const existing = await prisma.twentyFirstSkill.findMany({
            where: {
                sourceUri: { in: uris }
            },
            select: {
                sourceUri: true
            }
        });
        const existingUris = new Set(existing.map((row) => row.sourceUri).filter(Boolean) as string[]);

        let created = 0;
        let updated = 0;
        let renamedForUniqueness = 0;

        for (const skill of fetched.skills) {
            const baseName = skill.name.trim().slice(0, 180);
            const shortId = skill.sourceUri.split('/').pop()?.slice(0, 10) || 'mind';
            const fallbackName = `${baseName} [${shortId}]`.slice(0, 190);

            const tags = Array.from(
                new Set([
                    ...skill.type.map(normalizeTag),
                    ...skill.technicalDomains.map(normalizeTag),
                    ...skill.conceptualAspects.map(normalizeTag),
                    'mind-tech-ontology'
                ])
            ).filter(Boolean).slice(0, 24);

            const examples = skill.synonyms.slice(0, 8);
            const category = skill.type[0] || 'Habilidad MIND';
            const industry = skill.technicalDomains[0] || 'MIND Tech Ontology';

            const sources = [
                { title: 'MIND Tech Ontology (GitHub)', url: 'https://github.com/MIND-TechAI/MIND-tech-ontology' },
                { title: 'Habilidades agregadas de MIND', url: fetched.sourceUrl },
                { title: 'Referencia MIND de la habilidad', url: `https://github.com/MIND-TechAI/MIND-tech-ontology#${encodeURIComponent(skill.name)}` }
            ];

            const upsert = async (name: string) => prisma.twentyFirstSkill.upsert({
                where: { sourceUri: skill.sourceUri },
                create: {
                    name,
                    industry,
                    category,
                    description: skill.description,
                    trendSummary: 'Sincronizada desde MIND Tech Ontology',
                    examples,
                    tags,
                    sources,
                    isActive: true,
                    sourceProvider: 'MIND_ONTOLOGY',
                    sourceUri: skill.sourceUri,
                    sourceLanguage: 'en',
                    sourceLastSyncedAt: new Date()
                },
                update: {
                    name,
                    industry,
                    category,
                    description: skill.description,
                    trendSummary: 'Sincronizada desde MIND Tech Ontology',
                    examples,
                    tags,
                    sources,
                    isActive: true,
                    sourceProvider: 'MIND_ONTOLOGY',
                    sourceLanguage: 'en',
                    sourceLastSyncedAt: new Date()
                }
            });

            try {
                await upsert(baseName);
            } catch (error) {
                if (
                    error instanceof Prisma.PrismaClientKnownRequestError
                    && error.code === 'P2002'
                ) {
                    await upsert(fallbackName);
                    renamedForUniqueness += 1;
                } else {
                    throw error;
                }
            }

            if (existingUris.has(skill.sourceUri)) {
                updated += 1;
            } else {
                created += 1;
            }
        }

        let deactivated = 0;
        if (deactivateMissing) {
            const result = await prisma.twentyFirstSkill.updateMany({
                where: {
                    sourceProvider: 'MIND_ONTOLOGY',
                    sourceUri: {
                        notIn: uris
                    }
                },
                data: {
                    isActive: false
                }
            });
            deactivated = result.count;
        }

        await logActivity(
            session.user.id,
            'SYNC_21C_SKILLS_MIND',
            `Sincronizó ${fetched.skills.length} habilidades desde MIND Tech Ontology. Creadas: ${created}, actualizadas: ${updated}.`,
            'INFO',
            {
                maxSkills,
                sourceUrl: fetched.sourceUrl,
                totalAvailable: fetched.totalAvailable,
                synced: fetched.skills.length,
                created,
                updated,
                renamedForUniqueness,
                deactivated
            }
        );

        revalidatePath('/dashboard/skills21');
        revalidatePath('/dashboard/professor/projects/new');
        revalidatePath('/dashboard/professor/challenges/new');
        revalidatePath('/dashboard/professor/problems/new');

        return {
            success: true,
            stats: {
                maxSkills,
                sourceUrl: fetched.sourceUrl,
                totalAvailable: fetched.totalAvailable,
                synced: fetched.skills.length,
                created,
                updated,
                renamedForUniqueness,
                deactivated
            }
        };
    } catch (error) {
        console.error('[syncSkillsFromMindOntologyAction] error:', error);
        return { success: false, error: 'No se pudo sincronizar habilidades desde MIND Tech Ontology.' };
    }
}

export async function createTwentyFirstSkillAction(payload: CreateSkillPayload) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !['TEACHER', 'ADMIN'].includes(session.user.role)) {
            return { success: false, error: 'No autorizado' };
        }

        const name = payload.name?.trim();
        const industry = payload.industry?.trim();
        const description = payload.description?.trim();

        if (!name || !industry || !description) {
            return { success: false, error: 'Nombre, industria y descripción son obligatorios.' };
        }

        const category = payload.category?.trim() || null;
        const trendSummary = payload.trendSummary?.trim() || null;
        const examples = parseList(payload.examplesText);
        const tags = parseList(payload.tagsText).map((tag) => tag.toLowerCase());
        const sources = parseSources(payload.sourcesText);

        const created = await prisma.twentyFirstSkill.create({
            data: {
                name,
                industry,
                category,
                description,
                trendSummary,
                examples,
                tags,
                sources: sources.length > 0 ? sources : undefined,
                sourceProvider: 'MANUAL',
            },
        });

        await logActivity(
            session.user.id,
            'CREATE_21C_SKILL',
            `Creó la habilidad "${created.name}" para industria "${created.industry}"`,
            'INFO',
            {
                skillId: created.id,
                industry: created.industry,
                category: created.category,
            }
        );

        revalidatePath('/dashboard/skills21');
        revalidatePath('/dashboard/professor/projects/new');
        revalidatePath('/dashboard/professor/challenges/new');
        revalidatePath('/dashboard/professor/problems/new');
        return { success: true, skillId: created.id };
    } catch (error) {
        console.error('[createTwentyFirstSkillAction] error:', error);
        return { success: false, error: 'No se pudo crear la habilidad.' };
    }
}

export async function toggleTwentyFirstSkillStatusAction(skillId: string, nextState: boolean) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !['TEACHER', 'ADMIN'].includes(session.user.role)) {
            return { success: false, error: 'No autorizado' };
        }

        const updated = await prisma.twentyFirstSkill.update({
            where: { id: skillId },
            data: { isActive: nextState },
            select: { id: true, name: true, isActive: true }
        });

        await logActivity(
            session.user.id,
            'UPDATE_21C_SKILL_STATUS',
            `${updated.isActive ? 'Activó' : 'Desactivó'} la habilidad "${updated.name}"`,
            'INFO',
            { skillId: updated.id, isActive: updated.isActive }
        );

        revalidatePath('/dashboard/skills21');
        revalidatePath('/dashboard/professor/projects/new');
        revalidatePath('/dashboard/professor/challenges/new');
        revalidatePath('/dashboard/professor/problems/new');
        return { success: true };
    } catch (error) {
        console.error('[toggleTwentyFirstSkillStatusAction] error:', error);
        return { success: false, error: 'No se pudo actualizar el estado.' };
    }
}
