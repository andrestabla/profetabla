export type EscoSkill = {
    uri: string;
    title: string;
    description: string;
    tags: string[];
    language: string;
    sourceUrl: string;
};

type EscoSearchResponse = {
    total: number;
    limit: number;
    offset: number;
    language: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    _embedded?: { results?: any[] };
};

function localizedString(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    value: any,
    language: string,
    fallbackLanguages: string[] = []
): string {
    if (!value) return '';

    if (typeof value === 'string') return value.trim();

    const candidates = [language, ...fallbackLanguages, 'en', 'en-us', 'es'];
    for (const key of candidates) {
        const selected = value[key];
        if (typeof selected === 'string' && selected.trim()) return selected.trim();
        if (selected && typeof selected.literal === 'string' && selected.literal.trim()) {
            return selected.literal.trim();
        }
    }

    const first = Object.values(value).find((item) => {
        if (typeof item === 'string') return item.trim().length > 0;
        return item && typeof item === 'object' && typeof (item as { literal?: string }).literal === 'string'
            && ((item as { literal: string }).literal || '').trim().length > 0;
    });

    if (typeof first === 'string') return first.trim();
    if (first && typeof first === 'object' && typeof (first as { literal?: string }).literal === 'string') {
        return ((first as { literal: string }).literal || '').trim();
    }

    return '';
}

function toEscoSkill(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    raw: any,
    language: string
): EscoSkill | null {
    const uri = String(raw?.uri || '').trim();
    if (!uri) return null;

    const title = localizedString(raw?.preferredLabel, language, [language.toLowerCase(), language.toUpperCase()])
        || String(raw?.title || '').trim();
    if (!title) return null;

    const description = localizedString(raw?.description, language, [language.toLowerCase(), language.toUpperCase()]);

    // Use alternative labels as tags, capped for storage efficiency.
    const rawAlternatives = raw?.alternativeLabel || {};
    const alt = localizedString(rawAlternatives, language, ['en', 'es']);
    const tags = alt
        ? alt.split(/\s*;\s*|\s*,\s*/g).map((token: string) => token.trim()).filter(Boolean).slice(0, 8)
        : [];

    const sourceUrl = String(raw?._links?.self?.href || '').trim()
        || `https://ec.europa.eu/esco/api/resource/skill?uri=${encodeURIComponent(uri)}&language=${encodeURIComponent(language)}`;

    return {
        uri,
        title,
        description,
        tags,
        language,
        sourceUrl
    };
}

export async function fetchEscoSkillsPage(params: {
    language?: string;
    limit?: number;
    page?: number;
}): Promise<{
    total: number;
    page: number;
    limit: number;
    language: string;
    skills: EscoSkill[];
}> {
    const language = (params.language || 'es').trim() || 'es';
    const limit = Math.max(1, Math.min(250, params.limit || 100));
    const page = Math.max(0, params.page || 0);

    const url = new URL('https://ec.europa.eu/esco/api/search');
    url.searchParams.set('text', '');
    url.searchParams.set('type', 'skill');
    url.searchParams.set('language', language);
    url.searchParams.set('limit', String(limit));
    // ESCO uses `offset` as page index for this endpoint.
    url.searchParams.set('offset', String(page));
    url.searchParams.set('full', 'true');
    url.searchParams.set('viewObsolete', 'false');

    const maxAttempts = 4;
    let payload: EscoSearchResponse | null = null;
    let lastError: string | null = null;

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
        const response = await fetch(url.toString(), {
            headers: {
                Accept: 'application/json'
            },
            cache: 'no-store'
        });

        if (response.ok) {
            payload = await response.json() as EscoSearchResponse;
            break;
        }

        lastError = `ESCO API error (${response.status}): ${response.statusText}`;
        const canRetry = response.status >= 500 && response.status < 600 && attempt < maxAttempts;
        if (!canRetry) {
            throw new Error(lastError);
        }

        const backoffMs = 500 * attempt;
        await new Promise((resolve) => setTimeout(resolve, backoffMs));
    }

    if (!payload) {
        throw new Error(lastError || 'ESCO API error: respuesta vacía');
    }

    const rawResults = payload._embedded?.results || [];
    const skills = rawResults
        .map((item) => toEscoSkill(item, language))
        .filter((item): item is EscoSkill => Boolean(item));

    return {
        total: payload.total || 0,
        page,
        limit,
        language,
        skills
    };
}
