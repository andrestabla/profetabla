import { prisma } from './prisma';

interface PartialConfig {
    institutionName: string;
    aiProvider: string;
    geminiApiKey?: string | null;
    openaiApiKey?: string | null;
    geminiModel?: string;
    openaiModel?: string;
    googleCalendarEnabled?: boolean;
    googleCalendarServiceAccountJson?: string;
    googleCalendarClientId?: string;
    googleCalendarClientSecret?: string;
}

export async function getSafePlatformConfig(): Promise<PartialConfig> {
    try {
        const config = await prisma.platformConfig.findUnique({
            where: { id: 'global-config' }
        });

        if (config) return config;

        // If not found, create a default one to prevent crashes
        return await prisma.platformConfig.create({
            data: {
                id: 'global-config',
                institutionName: 'Profe Tabla',
                aiProvider: 'GEMINI',
                geminiModel: 'gemini-1.5-flash', // Updated default
                openaiModel: 'gpt-4o-mini',
            }
        });
    } catch (error) {
        console.error('Error fetching platform config:', error);
        // Return a mock object if DB is totally unavailable
        return {
            institutionName: 'Profe Tabla',
            aiProvider: 'GEMINI',
            geminiApiKey: process.env.GEMINI_API_KEY,
            openaiApiKey: process.env.OPENAI_API_KEY,
        };
    }
}
