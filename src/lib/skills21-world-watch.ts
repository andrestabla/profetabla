import { prisma } from '@/lib/prisma';
import { generateAiTextWithConfiguredProvider } from '@/lib/ai-text';

const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const SIGNAL_WINDOW_DAYS = 31;
const AUTO_REFRESH_DAYS = 14;
const MAX_RAW_ITEMS = 120;
const MAX_PERSISTED_ITEMS = 28;

type SourceType = 'NOTICIA' | 'BLOG' | 'INVESTIGACION';

type FeedSource = {
    name: string;
    url: string;
    defaultType: SourceType;
    parser: 'rss' | 'atom';
};

type RawWorldItem = {
    title: string;
    url: string;
    sourceName: string;
    sourceType: SourceType;
    publishedAt: Date;
};

type AiMappedItem = {
    idx: number;
    summary: string;
    sourceType: SourceType;
    industry: string | null;
    occupationFocus: string | null;
    skillFocus: string | null;
    tags: string[];
    relevanceScore: number;
};

const FEED_SOURCES: FeedSource[] = [
    {
        name: 'Google Noticias: futuro del trabajo y ocupaciones',
        url: 'https://news.google.com/rss/search?q=future+of+work+skills+occupations+when:30d&hl=es-419&gl=CO&ceid=CO:es-419',
        defaultType: 'NOTICIA',
        parser: 'rss'
    },
    {
        name: 'Google Noticias: competencias y habilidades laborales',
        url: 'https://news.google.com/rss/search?q=competencias+laborales+habilidades+digitales+when:30d&hl=es-419&gl=CO&ceid=CO:es-419',
        defaultType: 'NOTICIA',
        parser: 'rss'
    },
    {
        name: 'Google Noticias: workforce strategy and re-skilling',
        url: 'https://news.google.com/rss/search?q=reskilling+workforce+skills+demand+when:30d&hl=en-US&gl=US&ceid=US:en',
        defaultType: 'NOTICIA',
        parser: 'rss'
    },
    {
        name: 'arXiv: future of work and skills',
        url: 'https://export.arxiv.org/api/query?search_query=all:(future+of+work+skills)&start=0&max_results=20&sortBy=submittedDate&sortOrder=descending',
        defaultType: 'INVESTIGACION',
        parser: 'atom'
    }
];

function decodeXmlEntities(value: string): string {
    return value
        .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&#x2F;/g, '/');
}

function stripHtml(value: string): string {
    return decodeXmlEntities(value)
        .replace(/<[^>]*>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function extractTag(block: string, tag: string): string {
    const match = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i'));
    if (!match) return '';
    return stripHtml(match[1] || '');
}

function extractSource(block: string): { name: string; url: string | null } {
    const match = block.match(/<source[^>]*?(?:url="([^"]+)")?[^>]*>([\s\S]*?)<\/source>/i);
    if (!match) return { name: '', url: null };
    return {
        name: stripHtml(match[2] || ''),
        url: (match[1] || '').trim() || null
    };
}

function safeDate(raw: string): Date | null {
    if (!raw) return null;
    const date = new Date(raw);
    if (Number.isNaN(date.getTime())) return null;
    return date;
}

function normalizeUrl(input: string): string {
    const value = input.trim();
    if (!value) return '';

    try {
        const parsed = new URL(value);
        parsed.hash = '';
        return parsed.toString();
    } catch {
        return '';
    }
}

function inferSourceType(url: string, fallback: SourceType): SourceType {
    const value = url.toLowerCase();
    if (value.includes('arxiv.org') || value.includes('nature.com') || value.includes('sciencedirect.com')) {
        return 'INVESTIGACION';
    }
    if (value.includes('blog') || value.includes('medium.com') || value.includes('substack.com')) {
        return 'BLOG';
    }
    return fallback;
}

function parseRss(xml: string, source: FeedSource): RawWorldItem[] {
    const items: RawWorldItem[] = [];
    const blocks = xml.match(/<item>[\s\S]*?<\/item>/gi) || [];

    for (const block of blocks) {
        const title = extractTag(block, 'title');
        const link = normalizeUrl(extractTag(block, 'link'));
        const pubDate = safeDate(extractTag(block, 'pubDate'));
        const sourceData = extractSource(block);

        if (!title || !link || !pubDate) continue;

        items.push({
            title,
            url: link,
            sourceName: sourceData.name || source.name,
            sourceType: inferSourceType(sourceData.url || link, source.defaultType),
            publishedAt: pubDate
        });
    }

    return items;
}

function parseAtom(xml: string, source: FeedSource): RawWorldItem[] {
    const entries: RawWorldItem[] = [];
    const blocks = xml.match(/<entry>[\s\S]*?<\/entry>/gi) || [];

    for (const block of blocks) {
        const title = extractTag(block, 'title');
        const published = safeDate(extractTag(block, 'published') || extractTag(block, 'updated'));
        const linkMatch = block.match(/<link[^>]*href="([^"]+)"[^>]*>/i);
        const link = normalizeUrl(linkMatch?.[1] || '');
        if (!title || !published || !link) continue;

        entries.push({
            title,
            url: link,
            sourceName: source.name,
            sourceType: source.defaultType,
            publishedAt: published
        });
    }

    return entries;
}

async function fetchFeedItems(source: FeedSource): Promise<RawWorldItem[]> {
    try {
        const response = await fetch(source.url, {
            headers: { Accept: 'application/xml,text/xml,application/rss+xml' },
            cache: 'no-store'
        });
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        const xml = await response.text();
        return source.parser === 'rss'
            ? parseRss(xml, source)
            : parseAtom(xml, source);
    } catch (error) {
        console.error(`[skills21-world-watch] No se pudo leer feed ${source.name}:`, error);
        return [];
    }
}

async function collectRawWorldItems(): Promise<RawWorldItem[]> {
    const all = (await Promise.all(FEED_SOURCES.map((source) => fetchFeedItems(source)))).flat();
    const cutoff = new Date(Date.now() - SIGNAL_WINDOW_DAYS * ONE_DAY_MS);

    const dedup = new Map<string, RawWorldItem>();
    for (const item of all) {
        if (item.publishedAt < cutoff) continue;
        const key = normalizeUrl(item.url);
        if (!key) continue;

        const existing = dedup.get(key);
        if (!existing || item.publishedAt > existing.publishedAt) {
            dedup.set(key, item);
        }
    }

    return Array.from(dedup.values())
        .sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime())
        .slice(0, MAX_RAW_ITEMS);
}

function clampScore(value: number): number {
    if (!Number.isFinite(value)) return 0.5;
    return Math.max(0, Math.min(1, value));
}

function normalizeTags(raw: unknown): string[] {
    if (!Array.isArray(raw)) return [];
    return raw
        .map((item) => String(item || '').trim().toLowerCase())
        .filter(Boolean)
        .slice(0, 10);
}

function parseJsonArray(text: string): unknown[] | null {
    const trimmed = text.trim();
    const fromCodeBlock = trimmed.match(/```json\s*([\s\S]*?)```/i)?.[1]
        || trimmed.match(/```\s*([\s\S]*?)```/i)?.[1]
        || trimmed;

    try {
        const parsed = JSON.parse(fromCodeBlock);
        return Array.isArray(parsed) ? parsed : null;
    } catch {
        return null;
    }
}

function buildFallbackMappedItems(items: RawWorldItem[]): AiMappedItem[] {
    return items.slice(0, MAX_PERSISTED_ITEMS).map((item, idx) => ({
        idx,
        summary: `Actualización reciente sobre ${item.title.toLowerCase()}.`,
        sourceType: item.sourceType,
        industry: null,
        occupationFocus: null,
        skillFocus: null,
        tags: ['tendencias-laborales'],
        relevanceScore: 0.55
    }));
}

async function mapItemsWithAi(items: RawWorldItem[]): Promise<AiMappedItem[]> {
    if (items.length === 0) return [];

    const list = items
        .map((item, idx) => {
            const date = item.publishedAt.toISOString().slice(0, 10);
            return `${idx}. [${date}] ${item.title} | ${item.sourceName} | ${item.url}`;
        })
        .join('\n');

    const systemPrompt = 'Eres analista de mercado laboral, ocupaciones y habilidades del siglo XXI.';
    const userPrompt = `
Analiza la lista y selecciona hasta ${MAX_PERSISTED_ITEMS} registros más relevantes para educación, empleabilidad y competencias.

Lista:
${list}

Devuelve SOLO JSON válido (array) con este esquema exacto por elemento:
{
  "idx": number,
  "summary": string,
  "sourceType": "NOTICIA" | "BLOG" | "INVESTIGACION",
  "industry": string | null,
  "occupationFocus": string | null,
  "skillFocus": string | null,
  "tags": string[],
  "relevanceScore": number
}

Reglas:
- Escribe todo en español.
- summary máximo 45 palabras.
- No inventes URLs ni fuentes; usa idx para referenciar solo elementos existentes.
- relevanceScore entre 0 y 1.
`;

    const response = await generateAiTextWithConfiguredProvider({
        systemPrompt,
        userPrompt,
        temperature: 0.2
    });

    if (!response) {
        return buildFallbackMappedItems(items);
    }

    const parsed = parseJsonArray(response);
    if (!parsed || parsed.length === 0) {
        return buildFallbackMappedItems(items);
    }

    const mapped: AiMappedItem[] = [];
    const usedIndexes = new Set<number>();

    for (const raw of parsed) {
        if (!raw || typeof raw !== 'object') continue;
        const record = raw as Record<string, unknown>;
        const idx = Number(record.idx);
        if (!Number.isInteger(idx) || idx < 0 || idx >= items.length) continue;
        if (usedIndexes.has(idx)) continue;

        const sourceTypeValue = String(record.sourceType || '').toUpperCase();
        const sourceType: SourceType = sourceTypeValue === 'BLOG' || sourceTypeValue === 'INVESTIGACION'
            ? sourceTypeValue
            : 'NOTICIA';

        mapped.push({
            idx,
            summary: String(record.summary || '').trim().slice(0, 420) || buildFallbackMappedItems(items.slice(idx, idx + 1))[0].summary,
            sourceType,
            industry: String(record.industry || '').trim() || null,
            occupationFocus: String(record.occupationFocus || '').trim() || null,
            skillFocus: String(record.skillFocus || '').trim() || null,
            tags: normalizeTags(record.tags),
            relevanceScore: clampScore(Number(record.relevanceScore))
        });
        usedIndexes.add(idx);

        if (mapped.length >= MAX_PERSISTED_ITEMS) break;
    }

    if (mapped.length === 0) {
        return buildFallbackMappedItems(items);
    }

    return mapped;
}

function shouldAutoRefresh(lastSyncAt: Date | null | undefined): boolean {
    if (!lastSyncAt) return true;
    return (Date.now() - lastSyncAt.getTime()) >= AUTO_REFRESH_DAYS * ONE_DAY_MS;
}

async function upsertSyncState(data: {
    status?: string;
    lastSyncAt?: Date | null;
    lastAttemptAt?: Date | null;
    nextSyncAt?: Date | null;
    lastError?: string | null;
}) {
    await prisma.skills21WorldSignalSyncState.upsert({
        where: { id: 'skills21-world-sync' },
        create: {
            id: 'skills21-world-sync',
            status: data.status || 'IDLE',
            lastSyncAt: data.lastSyncAt || null,
            lastAttemptAt: data.lastAttemptAt || null,
            nextSyncAt: data.nextSyncAt || null,
            lastError: data.lastError || null
        },
        update: {
            status: data.status,
            lastSyncAt: data.lastSyncAt,
            lastAttemptAt: data.lastAttemptAt,
            nextSyncAt: data.nextSyncAt,
            lastError: data.lastError
        }
    });
}

export async function refreshSkills21WorldSignals(params?: { force?: boolean }) {
    const force = Boolean(params?.force);
    const state = await prisma.skills21WorldSignalSyncState.findUnique({ where: { id: 'skills21-world-sync' } });

    if (!force && state?.lastSyncAt && !shouldAutoRefresh(state.lastSyncAt)) {
        return {
            refreshed: false,
            reason: 'NO_REQUIERE_ACTUALIZACION',
            synced: 0
        };
    }

    const now = new Date();
    await upsertSyncState({
        status: 'RUNNING',
        lastAttemptAt: now,
        lastError: null
    });

    try {
        const rawItems = await collectRawWorldItems();
        const mappedItems = await mapItemsWithAi(rawItems);

        let synced = 0;
        for (const mapped of mappedItems) {
            const item = rawItems[mapped.idx];
            if (!item) continue;

            await prisma.skills21WorldSignal.upsert({
                where: { sourceUrl: item.url },
                create: {
                    title: item.title,
                    summary: mapped.summary,
                    sourceName: item.sourceName,
                    sourceType: mapped.sourceType || item.sourceType,
                    sourceUrl: item.url,
                    publishedAt: item.publishedAt,
                    capturedAt: now,
                    industry: mapped.industry,
                    occupationFocus: mapped.occupationFocus,
                    skillFocus: mapped.skillFocus,
                    tags: mapped.tags,
                    relevanceScore: mapped.relevanceScore
                },
                update: {
                    title: item.title,
                    summary: mapped.summary,
                    sourceName: item.sourceName,
                    sourceType: mapped.sourceType || item.sourceType,
                    publishedAt: item.publishedAt,
                    capturedAt: now,
                    industry: mapped.industry,
                    occupationFocus: mapped.occupationFocus,
                    skillFocus: mapped.skillFocus,
                    tags: mapped.tags,
                    relevanceScore: mapped.relevanceScore
                }
            });
            synced += 1;
        }

        const retentionCutoff = new Date(Date.now() - 180 * ONE_DAY_MS);
        await prisma.skills21WorldSignal.deleteMany({
            where: {
                publishedAt: { lt: retentionCutoff }
            }
        });

        await upsertSyncState({
            status: 'IDLE',
            lastSyncAt: now,
            nextSyncAt: new Date(now.getTime() + AUTO_REFRESH_DAYS * ONE_DAY_MS),
            lastError: null
        });

        return {
            refreshed: true,
            reason: 'ACTUALIZADO',
            synced
        };
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Error desconocido';
        await upsertSyncState({
            status: 'ERROR',
            lastError: message
        });
        throw error;
    }
}

export async function getSkills21WorldSignalsForDashboard(params?: {
    limit?: number;
    autoRefreshIfStale?: boolean;
}) {
    const limit = Math.max(6, Math.min(40, params?.limit || 14));
    const autoRefreshIfStale = params?.autoRefreshIfStale !== false;

    let state = await prisma.skills21WorldSignalSyncState.findUnique({ where: { id: 'skills21-world-sync' } });
    const isStale = shouldAutoRefresh(state?.lastSyncAt);

    if (autoRefreshIfStale && isStale && state?.status !== 'RUNNING') {
        try {
            await refreshSkills21WorldSignals({ force: false });
        } catch (error) {
            console.error('[skills21-world-watch] Error en refresh automático:', error);
        }
        state = await prisma.skills21WorldSignalSyncState.findUnique({ where: { id: 'skills21-world-sync' } });
    }

    const cutoff = new Date(Date.now() - SIGNAL_WINDOW_DAYS * ONE_DAY_MS);
    let signals = await prisma.skills21WorldSignal.findMany({
        where: {
            publishedAt: {
                gte: cutoff
            }
        },
        orderBy: [
            { relevanceScore: 'desc' },
            { publishedAt: 'desc' }
        ],
        take: limit
    });

    if (signals.length === 0 && autoRefreshIfStale) {
        try {
            await refreshSkills21WorldSignals({ force: true });
            signals = await prisma.skills21WorldSignal.findMany({
                where: {
                    publishedAt: {
                        gte: cutoff
                    }
                },
                orderBy: [
                    { relevanceScore: 'desc' },
                    { publishedAt: 'desc' }
                ],
                take: limit
            });
            state = await prisma.skills21WorldSignalSyncState.findUnique({ where: { id: 'skills21-world-sync' } });
        } catch (error) {
            console.error('[skills21-world-watch] Error en carga inicial:', error);
        }
    }

    return {
        signals,
        syncState: state,
        isStale: shouldAutoRefresh(state?.lastSyncAt)
    };
}
