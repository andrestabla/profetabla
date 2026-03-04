import { Prisma, PrismaClient } from '@prisma/client';
import { fetchEscoSkillsPage } from '../../src/lib/esco';

function parseArg(name: string, fallback: string): string {
    const prefix = `--${name}=`;
    const found = process.argv.find((arg) => arg.startsWith(prefix));
    return found ? found.slice(prefix.length) : fallback;
}

function normalizeTag(tag: string): string {
    return tag
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '-')
        .slice(0, 48);
}

async function main() {
    const prisma = new PrismaClient();

    try {
        const language = parseArg('lang', 'es').trim().toLowerCase();
        const maxSkills = Math.max(20, Math.min(3000, Number(parseArg('max', '300')) || 300));
        const deactivateMissing = parseArg('deactivate-missing', 'false') === 'true';

        const pageSize = Math.max(
            20,
            Math.min(100, Number(parseArg('page-size', maxSkills > 1000 ? '50' : '100')) || 100)
        );
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
            throw new Error('ESCO no devolvió habilidades para los parámetros solicitados.');
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
                { title: 'ESCO API', url: skill.sourceUrl },
                { title: 'ESCO URI', url: skill.uri },
                { title: 'ESCO API documentación', url: 'https://ec.europa.eu/esco/api/doc/esco_api_doc.html' }
            ];

            const upsert = async (name: string) => prisma.twentyFirstSkill.upsert({
                where: { sourceUri: skill.uri },
                create: {
                    name,
                    industry: 'ESCO',
                    category: 'EU Skills',
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

        console.log(JSON.stringify({
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
        }, null, 2));
    } finally {
        await prisma.$disconnect();
    }
}

main().catch((error) => {
    console.error('[sync-esco-skills] error:', error);
    process.exit(1);
});
