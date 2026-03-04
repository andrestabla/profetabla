import { Prisma, PrismaClient } from '@prisma/client';
import { fetchMindOntologySkills } from '../../src/lib/mind-ontology';

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
        const maxSkills = Math.max(50, Math.min(6000, Number(parseArg('max', '1200')) || 1200));
        const deactivateMissing = parseArg('deactivate-missing', 'false') === 'true';
        const sourceUrlArg = parseArg('source-url', '').trim();
        const sourceUrl = sourceUrlArg || undefined;

        const fetched = await fetchMindOntologySkills({
            maxSkills,
            url: sourceUrl
        });

        if (fetched.skills.length === 0) {
            throw new Error('MIND Tech Ontology no devolvió habilidades para los parámetros solicitados.');
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

        console.log(JSON.stringify({
            success: true,
            stats: {
                sourceUrl: fetched.sourceUrl,
                totalAvailable: fetched.totalAvailable,
                synced: fetched.skills.length,
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
    console.error('[sync-mind-skills] error:', error);
    process.exit(1);
});
