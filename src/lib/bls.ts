const BLS_API_BASE = 'https://api.bls.gov/publicAPI/v2';
const BLS_OE_NATIONAL_PREFIX = 'OEUN0000000000000';
const BLS_OE_EMPLOYMENT_SUFFIX = '01';

export type BlsOeSeriesPoint = {
    year: number;
    employmentCount: number;
};

export type BlsOeSeriesRecord = {
    seriesId: string;
    socCode: string;
    points: BlsOeSeriesPoint[];
};

type BlsTimeseriesResponse = {
    status?: string;
    message?: string[];
    Results?: {
        series?: Array<{
            seriesID?: string;
            data?: Array<{
                year?: string;
                period?: string;
                value?: string;
            }>;
        }>;
    };
};

function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function toSocCodeDigits(raw: string): string | null {
    const digits = raw.replace(/\D/g, '');
    return digits.length === 6 ? digits : null;
}

export function formatSocCode(raw: string): string {
    const digits = raw.replace(/\D/g, '');
    if (digits.length !== 6) return raw;
    return `${digits.slice(0, 2)}-${digits.slice(2)}`;
}

export function buildBlsOeNationalEmploymentSeriesId(socCode: string): string | null {
    const socDigits = toSocCodeDigits(socCode);
    if (!socDigits) return null;
    return `${BLS_OE_NATIONAL_PREFIX}${socDigits}${BLS_OE_EMPLOYMENT_SUFFIX}`;
}

export function extractSocCodeFromBlsOeSeriesId(seriesId: string): string | null {
    const match = seriesId.match(/^OE[A-Z]{2}[A-Z0-9]{13}(\d{6})01$/);
    if (!match) return null;
    return match[1];
}

async function fetchJsonWithRetry(url: string, init?: RequestInit, retries = 2): Promise<Response> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= retries; attempt += 1) {
        try {
            const response = await fetch(url, init);
            if (response.ok) return response;

            if ((response.status === 429 || response.status >= 500) && attempt < retries) {
                await sleep(600 * (attempt + 1));
                continue;
            }

            return response;
        } catch (error) {
            lastError = error instanceof Error ? error : new Error('Error desconocido al consultar BLS API.');
            if (attempt < retries) {
                await sleep(600 * (attempt + 1));
                continue;
            }
        }
    }

    throw lastError || new Error('No se pudo consultar BLS API.');
}

export async function fetchBlsPopularOeSeriesIds(): Promise<string[]> {
    const url = `${BLS_API_BASE}/timeseries/popular?survey=OE`;
    const response = await fetchJsonWithRetry(url, {
        headers: { Accept: 'application/json' },
        cache: 'no-store'
    });

    if (!response.ok) {
        throw new Error(`BLS API (popular OE) devolvió ${response.status}.`);
    }

    const payload = await response.json() as {
        status?: string;
        message?: string[];
        Results?: {
            series?: Array<{ seriesID?: string | null } | null>;
        };
    };

    if (payload.status !== 'REQUEST_SUCCEEDED') {
        throw new Error(payload.message?.join(' ') || 'BLS API (popular OE) no respondió correctamente.');
    }

    return (payload.Results?.series || [])
        .map((item) => (item?.seriesID || '').trim())
        .filter(Boolean);
}

export async function fetchBlsOeEmploymentSeriesBySocCodes(params: {
    socCodes: string[];
    startYear: number;
    endYear: number;
    registrationKey?: string;
}): Promise<{
    records: BlsOeSeriesRecord[];
    requestedSeries: number;
    successfulSeries: number;
    emptySeries: number;
    messages: string[];
}> {
    const seriesIds = Array.from(
        new Set(
            params.socCodes
                .map((code) => buildBlsOeNationalEmploymentSeriesId(code))
                .filter((id): id is string => Boolean(id))
        )
    );

    if (seriesIds.length === 0) {
        return {
            records: [],
            requestedSeries: 0,
            successfulSeries: 0,
            emptySeries: 0,
            messages: ['No se recibieron códigos SOC válidos para consultar BLS.']
        };
    }

    const allRecords: BlsOeSeriesRecord[] = [];
    const messages: string[] = [];
    let emptySeries = 0;
    const registrationKey = (params.registrationKey || '').trim();

    const chunkSize = 50;
    for (let i = 0; i < seriesIds.length; i += chunkSize) {
        const chunk = seriesIds.slice(i, i + chunkSize);
        const body: Record<string, unknown> = {
            seriesid: chunk,
            startyear: String(params.startYear),
            endyear: String(params.endYear),
            annualaverage: true
        };
        if (registrationKey) {
            body.registrationkey = registrationKey;
        }

        const response = await fetchJsonWithRetry(
            `${BLS_API_BASE}/timeseries/data/`,
            {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body),
                cache: 'no-store'
            }
        );

        if (!response.ok) {
            throw new Error(`BLS API (timeseries/data) devolvió ${response.status}.`);
        }

        const payload = await response.json() as BlsTimeseriesResponse;
        if (payload.status !== 'REQUEST_SUCCEEDED') {
            throw new Error(payload.message?.join(' ') || 'BLS API (timeseries/data) no respondió correctamente.');
        }

        if (payload.message && payload.message.length > 0) {
            messages.push(...payload.message);
        }

        const seriesList = payload.Results?.series || [];
        for (const series of seriesList) {
            const seriesId = (series.seriesID || '').trim();
            const socCode = extractSocCodeFromBlsOeSeriesId(seriesId);
            if (!seriesId || !socCode) continue;

            const points: BlsOeSeriesPoint[] = (series.data || [])
                .filter((row) => row.period === 'A01')
                .map((row) => {
                    const year = Number(row.year);
                    const value = Number((row.value || '').replace(/,/g, ''));
                    if (!Number.isFinite(year) || !Number.isFinite(value)) {
                        return null;
                    }

                    // OE entrega empleo absoluto; se normaliza a miles para mantener consistencia.
                    return {
                        year,
                        employmentCount: value / 1000
                    };
                })
                .filter((row): row is BlsOeSeriesPoint => Boolean(row))
                .sort((a, b) => a.year - b.year);

            if (points.length === 0) {
                emptySeries += 1;
                continue;
            }

            allRecords.push({
                seriesId,
                socCode,
                points
            });
        }
    }

    return {
        records: allRecords,
        requestedSeries: seriesIds.length,
        successfulSeries: allRecords.length,
        emptySeries,
        messages
    };
}
