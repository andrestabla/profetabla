import { generateAiTextWithConfiguredProvider } from '@/lib/ai-text';

export const SKILLS21_CANONICAL_INDUSTRIES = [
    'Tecnología',
    'Salud',
    'Educación',
    'Servicios',
    'Finanzas',
    'Manufactura',
    'Comercio',
    'Logística y Transporte',
    'Energía y Medio Ambiente',
    'Agroindustria',
    'Construcción',
    'Sector Público',
    'Turismo y Hospitalidad',
    'Cultura y Medios'
] as const;

export type Skills21Industry = (typeof SKILLS21_CANONICAL_INDUSTRIES)[number];

const DEFAULT_INDUSTRY: Skills21Industry = 'Servicios';
const AI_BATCH_SIZE = 36;

type SkillIndustryInput = {
    id: string;
    name: string;
    description?: string | null;
    tags?: string[];
    industryHint?: string | null;
    categoryHint?: string | null;
    provider?: string | null;
    language?: string | null;
};

type HeuristicIndustryResult = {
    industry: Skills21Industry;
    needsAi: boolean;
    topScore: number;
};

type ClassificationResult = {
    industriesById: Map<string, Skills21Industry>;
    usedAi: number;
    usedHeuristic: number;
    unresolved: number;
    industryBreakdown: Record<string, number>;
};

const INDUSTRY_KEYWORDS: Record<Skills21Industry, string[]> = {
    'Tecnología': [
        'software', 'programming', 'programacion', 'developer', 'desarrollador', 'cloud', 'nube', 'devops',
        'cyber', 'ciber', 'it', 'informatic', 'digital', 'data', 'datos', 'machine learning', 'ai', 'ia',
        'robotic', 'automatizacion', 'automation', 'comput', 'backend', 'frontend'
    ],
    'Salud': [
        'health', 'salud', 'clinical', 'clinica', 'patient', 'paciente', 'medical', 'medic', 'hospital',
        'nursing', 'enfermeria', 'farmac', 'biomed', 'epidemi', 'diagnostic', 'terapia', 'therapy'
    ],
    'Educación': [
        'education', 'educacion', 'teaching', 'docencia', 'aprendizaje', 'learning', 'curriculum', 'pedagog',
        'school', 'escuela', 'universidad', 'didactic', 'instrucc'
    ],
    'Servicios': [
        'service', 'servicio', 'support', 'soporte', 'customer', 'cliente', 'operations', 'operacion',
        'administrative', 'administrativo', 'consult', 'asesoria', 'hr', 'human resources', 'talent',
        'legal', 'juridic', 'compliance'
    ],
    'Finanzas': [
        'finance', 'finanzas', 'bank', 'banca', 'accounting', 'contab', 'audit', 'treasury', 'tesoreria',
        'investment', 'inversion', 'insurance', 'seguro', 'risk', 'riesgo'
    ],
    'Manufactura': [
        'manufactur', 'production', 'produccion', 'plant', 'factory', 'fabrica', 'industrial', 'quality control',
        'calidad', 'mechanic', 'mecanic', 'process engineering', 'lean'
    ],
    'Comercio': [
        'retail', 'sales', 'ventas', 'commercial', 'comercial', 'marketing', 'ecommerce', 'e-commerce',
        'merchandis', 'pricing', 'negociacion', 'negotiation'
    ],
    'Logística y Transporte': [
        'logistic', 'supply chain', 'cadena de suministro', 'transport', 'freight', 'warehouse',
        'inventor', 'shipping', 'distribution', 'almacen', 'port', 'fleet'
    ],
    'Energía y Medio Ambiente': [
        'energy', 'energia', 'renewable', 'renovable', 'environment', 'ambient', 'sustainab', 'emissions',
        'climate', 'electrical grid', 'solar', 'wind', 'decarbon'
    ],
    'Agroindustria': [
        'agri', 'agro', 'farming', 'cultivo', 'ganader', 'food production', 'alimentos', 'agronom',
        'harvest', 'riego'
    ],
    'Construcción': [
        'construction', 'construccion', 'civil', 'architecture', 'arquitect', 'infrastructure', 'obra',
        'building', 'bim', 'site management'
    ],
    'Sector Público': [
        'public policy', 'politica publica', 'government', 'gobierno', 'public administration',
        'administracion publica', 'regulator', 'regulacion', 'municipal', 'state'
    ],
    'Turismo y Hospitalidad': [
        'tourism', 'turismo', 'hospitality', 'hotel', 'travel', 'viaje', 'restaur', 'guest', 'aeroline',
        'event management', 'eventos'
    ],
    'Cultura y Medios': [
        'media', 'contenido', 'content', 'design', 'diseno', 'creative', 'creativ', 'audiovisual', 'journal',
        'editorial', 'branding', 'storytelling'
    ]
};

const INDUSTRY_ALIASES: Array<{ industry: Skills21Industry; aliases: string[] }> = [
    { industry: 'Tecnología', aliases: ['tecnologia', 'technology', 'tech', 'it', 'digital', 'datos e ia', 'data and ai'] },
    { industry: 'Salud', aliases: ['salud', 'health', 'healthcare', 'medical', 'medicina'] },
    { industry: 'Educación', aliases: ['educacion', 'education', 'educational'] },
    { industry: 'Servicios', aliases: ['servicios', 'services', 'service', 'general', 'multisectorial'] },
    { industry: 'Finanzas', aliases: ['finanzas', 'finance', 'financial services', 'banking', 'banca'] },
    { industry: 'Manufactura', aliases: ['manufactura', 'manufacturing', 'industrial manufacturing'] },
    { industry: 'Comercio', aliases: ['comercio', 'trade', 'retail', 'sales', 'marketing'] },
    { industry: 'Logística y Transporte', aliases: ['logistica', 'logistics', 'transport', 'transportation', 'supply chain'] },
    { industry: 'Energía y Medio Ambiente', aliases: ['energia', 'energy', 'environment', 'sustainability', 'medio ambiente'] },
    { industry: 'Agroindustria', aliases: ['agroindustria', 'agriculture', 'agri', 'food and agriculture'] },
    { industry: 'Construcción', aliases: ['construccion', 'construction', 'infrastructure', 'civil engineering'] },
    { industry: 'Sector Público', aliases: ['sector publico', 'public sector', 'government', 'gobierno'] },
    { industry: 'Turismo y Hospitalidad', aliases: ['turismo', 'hospitalidad', 'hospitality', 'travel', 'tourism'] },
    { industry: 'Cultura y Medios', aliases: ['cultura', 'medios', 'media', 'creative', 'communications'] }
];

function normalizeText(value: string): string {
    return value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim();
}

function normalizeIndustryLabel(raw: string): Skills21Industry | null {
    const normalized = normalizeText(raw);
    if (!normalized) return null;

    for (const item of INDUSTRY_ALIASES) {
        if (item.aliases.some((alias) => normalized === alias || normalized.includes(alias))) {
            return item.industry;
        }
    }

    return null;
}

function scoreIndustryByKeywords(normalizedText: string): Map<Skills21Industry, number> {
    const scores = new Map<Skills21Industry, number>();
    for (const industry of SKILLS21_CANONICAL_INDUSTRIES) {
        let score = 0;
        for (const keyword of INDUSTRY_KEYWORDS[industry]) {
            if (normalizedText.includes(keyword)) {
                score += keyword.length >= 8 ? 2 : 1;
            }
        }
        scores.set(industry, score);
    }
    return scores;
}

function classifyByHeuristic(input: SkillIndustryInput): HeuristicIndustryResult {
    const compactText = normalizeText([
        input.name,
        input.description || '',
        input.industryHint || '',
        input.categoryHint || '',
        ...(input.tags || [])
    ].join(' | '));

    const fromHint = normalizeIndustryLabel(input.industryHint || '') || normalizeIndustryLabel(input.categoryHint || '');
    if (fromHint) {
        return {
            industry: fromHint,
            needsAi: false,
            topScore: 4
        };
    }

    const scores = scoreIndustryByKeywords(compactText);
    const sorted = Array.from(scores.entries()).sort((a, b) => b[1] - a[1]);
    const top = sorted[0] || [DEFAULT_INDUSTRY, 0];
    const second = sorted[1] || [DEFAULT_INDUSTRY, 0];
    const topIndustry = top[0];
    const topScore = top[1];
    const secondScore = second[1];

    if (topScore <= 0) {
        return { industry: DEFAULT_INDUSTRY, needsAi: true, topScore: 0 };
    }

    const isAmbiguous = topScore <= 1 || (topScore - secondScore <= 1);
    return {
        industry: topIndustry,
        needsAi: isAmbiguous,
        topScore
    };
}

function extractLikelyJson(text: string): string | null {
    const trimmed = text.trim();
    if (!trimmed) return null;

    if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
        return trimmed;
    }

    const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fencedMatch?.[1]) {
        return fencedMatch[1].trim();
    }

    const arrayStart = trimmed.indexOf('[');
    const arrayEnd = trimmed.lastIndexOf(']');
    if (arrayStart >= 0 && arrayEnd > arrayStart) {
        return trimmed.slice(arrayStart, arrayEnd + 1);
    }

    const objectStart = trimmed.indexOf('{');
    const objectEnd = trimmed.lastIndexOf('}');
    if (objectStart >= 0 && objectEnd > objectStart) {
        return trimmed.slice(objectStart, objectEnd + 1);
    }

    return null;
}

function parseAiClassificationResponse(raw: string): Map<string, Skills21Industry> {
    const result = new Map<string, Skills21Industry>();
    const json = extractLikelyJson(raw);
    if (!json) return result;

    try {
        const payload = JSON.parse(json) as unknown;
        const rows = Array.isArray(payload)
            ? payload
            : Array.isArray((payload as { results?: unknown[] })?.results)
                ? (payload as { results: unknown[] }).results
                : [];

        for (const row of rows) {
            if (!row || typeof row !== 'object') continue;
            const item = row as { id?: unknown; industry?: unknown };
            const id = String(item.id || '').trim();
            const industryRaw = String(item.industry || '').trim();
            if (!id || !industryRaw) continue;
            const industry = normalizeIndustryLabel(industryRaw);
            if (!industry) continue;
            result.set(id, industry);
        }
    } catch {
        return result;
    }

    return result;
}

async function classifyChunkWithAi(chunk: SkillIndustryInput[]): Promise<Map<string, Skills21Industry>> {
    const compact = chunk.map((item) => ({
        id: item.id,
        name: item.name.slice(0, 120),
        description: (item.description || '').slice(0, 220),
        tags: (item.tags || []).slice(0, 6),
        hint: (item.industryHint || item.categoryHint || '').slice(0, 80),
        provider: item.provider || '',
        language: item.language || ''
    }));

    const systemPrompt = `
Eres analista de mercado laboral y taxonomias de competencias.
Clasificas habilidades en una sola industria canonical, con criterio pragmático.
Debes responder SOLO JSON valido, sin comentarios.
`;

    const userPrompt = `
Clasifica cada habilidad en EXACTAMENTE una industria de esta lista:
${SKILLS21_CANONICAL_INDUSTRIES.join(', ')}.

Si una habilidad es transversal y no encaja claramente, usa "Servicios".

Devuelve SOLO un JSON array con objetos:
[
  { "id": "string", "industry": "una industria de la lista" }
]

Registros:
${JSON.stringify(compact)}
`;

    const raw = await generateAiTextWithConfiguredProvider({
        systemPrompt,
        userPrompt,
        temperature: 0.1
    });

    if (!raw) return new Map();
    return parseAiClassificationResponse(raw);
}

function buildIndustryBreakdown(values: Iterable<Skills21Industry>): Record<string, number> {
    const breakdown = new Map<string, number>();
    for (const value of values) {
        breakdown.set(value, (breakdown.get(value) || 0) + 1);
    }
    return Object.fromEntries(
        Array.from(breakdown.entries()).sort((a, b) => b[1] - a[1])
    );
}

export async function classifySkillIndustries(input: SkillIndustryInput[], allowAi = true): Promise<ClassificationResult> {
    const industriesById = new Map<string, Skills21Industry>();
    const fallbackById = new Map<string, Skills21Industry>();
    const aiCandidates: SkillIndustryInput[] = [];
    let usedHeuristic = 0;
    let usedAi = 0;

    for (const item of input) {
        const id = item.id.trim();
        if (!id || industriesById.has(id)) continue;

        const heuristic = classifyByHeuristic(item);
        fallbackById.set(id, heuristic.industry);

        if (allowAi && heuristic.needsAi) {
            aiCandidates.push(item);
        } else {
            industriesById.set(id, heuristic.industry);
            usedHeuristic += 1;
        }
    }

    if (allowAi && aiCandidates.length > 0) {
        for (let i = 0; i < aiCandidates.length; i += AI_BATCH_SIZE) {
            const chunk = aiCandidates.slice(i, i + AI_BATCH_SIZE);
            const aiMap = await classifyChunkWithAi(chunk);

            for (const item of chunk) {
                const predicted = aiMap.get(item.id);
                if (predicted) {
                    industriesById.set(item.id, predicted);
                    usedAi += 1;
                    continue;
                }

                industriesById.set(item.id, fallbackById.get(item.id) || DEFAULT_INDUSTRY);
                usedHeuristic += 1;
            }
        }
    }

    for (const [id, fallback] of fallbackById.entries()) {
        if (!industriesById.has(id)) {
            industriesById.set(id, fallback);
            usedHeuristic += 1;
        }
    }

    return {
        industriesById,
        usedAi,
        usedHeuristic,
        unresolved: Math.max(0, input.length - industriesById.size),
        industryBreakdown: buildIndustryBreakdown(industriesById.values())
    };
}

export function isPlaceholderIndustry(value: string | null | undefined): boolean {
    const normalized = normalizeText(value || '');
    if (!normalized) return true;

    const placeholders = new Set([
        'esco',
        'mind tech ontology',
        'mind-tech-ontology',
        'habilidades ue',
        'habilidad mind',
        'unknown',
        'n/a'
    ]);

    return placeholders.has(normalized);
}
