import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';
import { prisma } from '@/lib/prisma';

export type OccupationTopRecord = {
    occupationTitle: string;
    geography: string;
    year: number;
    employmentCount: number;
};

export type OccupationUploadStats = {
    fileCount: number;
    compiledRows: number;
    distinctOccupations: number;
    forecastRowsWritten: number;
    occupationsCreated: number;
    occupationsUpdated: number;
    geographies: string[];
    years: number[];
    dataSources: string[];
    topOccupations: OccupationTopRecord[];
    usedPythonCompiler: boolean;
    compilerMessage: string;
    linkedOccupations: number;
    updatedOccupationLinks?: number;
    skippedOccupationLinks: number;
};

function buildPrompt(stats: OccupationUploadStats) {
    return `
Actúa como analista laboral para una plataforma educativa.
Analiza este lote de ocupaciones del Siglo XXI y genera una síntesis útil para decisiones académicas.

Contexto:
- Unidad de Employment_Count: miles de empleos.
- Archivos procesados: ${stats.fileCount}
- Filas compiladas: ${stats.compiledRows}
- Ocupaciones únicas: ${stats.distinctOccupations}
- Filas de proyección persistidas: ${stats.forecastRowsWritten}
- Ocupaciones creadas: ${stats.occupationsCreated}
- Ocupaciones actualizadas: ${stats.occupationsUpdated}
- Fuentes: ${stats.dataSources.join(', ') || 'N/D'}
- Geografías: ${stats.geographies.join(', ') || 'N/D'}
- Años: ${stats.years.join(', ') || 'N/D'}
- Vinculación ocupación-habilidad aplicada a: ${stats.linkedOccupations}
- Relaciones ocupación-habilidad creadas/actualizadas: ${stats.updatedOccupationLinks ?? 0}
- Ocupaciones sin vínculo por límite de lote: ${stats.skippedOccupationLinks}
- Método de compilación: ${stats.usedPythonCompiler ? 'Python/Pandas' : 'Fallback TypeScript'}
- Mensaje compilador: ${stats.compilerMessage}

Top ocupaciones por empleo (miles):
${stats.topOccupations
        .map((item, index) => `${index + 1}. ${item.occupationTitle} (${item.geography}, ${item.year}): ${item.employmentCount}`)
        .join('\n') || 'Sin datos'}

Devuelve SOLO texto en español con:
1) "Resumen ejecutivo" (máx 4 líneas)
2) "Hallazgos clave" (3 viñetas)
3) "Riesgos o calidad de datos" (2 viñetas)
4) "Recomendaciones pedagógicas" (3 viñetas)
`;
}

async function generateWithOpenAI(apiKey: string, model: string, prompt: string): Promise<string | null> {
    try {
        const openai = new OpenAI({ apiKey });
        const completion = await openai.chat.completions.create({
            model,
            messages: [
                { role: 'system', content: 'Eres un analista de datos laborales.' },
                { role: 'user', content: prompt }
            ],
            temperature: 0.4
        });
        return completion.choices[0]?.message?.content?.trim() || null;
    } catch (error) {
        console.error('[occupation-ai][openai] error:', error);
        return null;
    }
}

async function generateWithGemini(apiKey: string, model: string, prompt: string): Promise<string | null> {
    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const gemini = genAI.getGenerativeModel({ model });
        const result = await gemini.generateContent(prompt);
        return result.response.text().trim() || null;
    } catch (error) {
        console.error('[occupation-ai][gemini] error:', error);
        return null;
    }
}

export async function generateOccupationUploadAnalysis(stats: OccupationUploadStats): Promise<string | null> {
    try {
        const config = await prisma.platformConfig.findUnique({ where: { id: 'global-config' } });
        const provider = config?.aiProvider || 'GEMINI';
        const prompt = buildPrompt(stats);

        if (provider === 'OPENAI') {
            const openaiKey = config?.openaiApiKey || process.env.OPENAI_API_KEY;
            if (!openaiKey) return null;
            return await generateWithOpenAI(openaiKey, config?.openaiModel || 'gpt-4o-mini', prompt);
        }

        const geminiKey = config?.geminiApiKey || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
        if (!geminiKey) return null;
        return await generateWithGemini(geminiKey, config?.geminiModel || 'gemini-1.5-flash', prompt);
    } catch (error) {
        console.error('[occupation-ai] error:', error);
        return null;
    }
}
