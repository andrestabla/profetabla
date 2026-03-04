const MIND_ONTOLOGY_DEFAULT_URL = 'https://raw.githubusercontent.com/MIND-TechAI/MIND-tech-ontology/main/__aggregated_skills.json';

export type MindOntologySkill = {
    name: string;
    sourceUri: string;
    sourceUrl: string;
    type: string[];
    technicalDomains: string[];
    synonyms: string[];
    impliesKnowingSkills: string[];
    impliesKnowingConcepts: string[];
    conceptualAspects: string[];
    solvesApplicationTasks: string[];
    description: string;
};

function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeText(value: string | null | undefined): string {
    return (value || '')
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .toLowerCase()
        .trim();
}

function sanitizeStringList(raw: unknown): string[] {
    if (!Array.isArray(raw)) return [];
    return raw
        .map((item) => (typeof item === 'string' ? item.trim() : ''))
        .filter(Boolean);
}

function buildMindSkillUri(name: string): string {
    return `mind-tech-ontology://skill/${encodeURIComponent(normalizeText(name))}`;
}

function composeDescription(input: {
    type: string[];
    technicalDomains: string[];
    solvesApplicationTasks: string[];
    impliesKnowingSkills: string[];
}): string {
    const parts = ['Habilidad técnica importada desde MIND Tech Ontology.'];

    if (input.type.length > 0) {
        parts.push(`Tipo: ${input.type.slice(0, 3).join(', ')}.`);
    }
    if (input.technicalDomains.length > 0) {
        parts.push(`Dominios: ${input.technicalDomains.slice(0, 5).join(', ')}.`);
    }
    if (input.solvesApplicationTasks.length > 0) {
        parts.push(`Tareas: ${input.solvesApplicationTasks.slice(0, 4).join(', ')}.`);
    }
    if (input.impliesKnowingSkills.length > 0) {
        parts.push(`Relacionada con: ${input.impliesKnowingSkills.slice(0, 4).join(', ')}.`);
    }

    return parts.join(' ').trim();
}

async function fetchWithRetry(url: string, retries = 2): Promise<Response> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= retries; attempt += 1) {
        try {
            const response = await fetch(url, {
                headers: { Accept: 'application/json' },
                cache: 'no-store'
            });

            if (response.ok) return response;

            const canRetry = (response.status === 429 || response.status >= 500) && attempt < retries;
            if (!canRetry) {
                throw new Error(`MIND Ontology fetch error (${response.status}).`);
            }

            await sleep(400 * (attempt + 1));
        } catch (error) {
            lastError = error instanceof Error ? error : new Error('Error desconocido consultando MIND Ontology.');
            if (attempt < retries) {
                await sleep(400 * (attempt + 1));
                continue;
            }
        }
    }

    throw lastError || new Error('No se pudo consultar MIND Ontology.');
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toMindSkill(raw: any): MindOntologySkill | null {
    const name = String(raw?.name || '').trim();
    if (!name) return null;

    const sourceUri = buildMindSkillUri(name);
    const sourceUrl = 'https://github.com/MIND-TechAI/MIND-tech-ontology/blob/main/__aggregated_skills.json';
    const type = sanitizeStringList(raw?.type);
    const technicalDomains = sanitizeStringList(raw?.technicalDomains);
    const synonyms = sanitizeStringList(raw?.synonyms)
        .filter((item) => normalizeText(item) !== normalizeText(name))
        .slice(0, 12);
    const impliesKnowingSkills = sanitizeStringList(raw?.impliesKnowingSkills);
    const impliesKnowingConcepts = sanitizeStringList(raw?.impliesKnowingConcepts);
    const conceptualAspects = sanitizeStringList(raw?.conceptualAspects);
    const solvesApplicationTasks = sanitizeStringList(raw?.solvesApplicationTasks);

    return {
        name,
        sourceUri,
        sourceUrl,
        type,
        technicalDomains,
        synonyms,
        impliesKnowingSkills,
        impliesKnowingConcepts,
        conceptualAspects,
        solvesApplicationTasks,
        description: composeDescription({
            type,
            technicalDomains,
            solvesApplicationTasks,
            impliesKnowingSkills
        })
    };
}

export async function fetchMindOntologySkills(params?: {
    url?: string;
    maxSkills?: number;
}): Promise<{
    sourceUrl: string;
    totalAvailable: number;
    skills: MindOntologySkill[];
}> {
    const sourceUrl = (params?.url || MIND_ONTOLOGY_DEFAULT_URL).trim() || MIND_ONTOLOGY_DEFAULT_URL;
    const maxSkills = Math.max(50, Math.min(6000, params?.maxSkills || 1200));

    const response = await fetchWithRetry(sourceUrl);
    const payload = await response.json() as unknown;

    if (!Array.isArray(payload)) {
        throw new Error('La ontología MIND no devolvió un arreglo JSON válido.');
    }

    const dedup = new Map<string, MindOntologySkill>();
    for (const item of payload) {
        const skill = toMindSkill(item);
        if (!skill) continue;
        const key = normalizeText(skill.name);
        if (!key || dedup.has(key)) continue;
        dedup.set(key, skill);
    }

    const all = Array.from(dedup.values());
    return {
        sourceUrl,
        totalAvailable: all.length,
        skills: all.slice(0, maxSkills)
    };
}
