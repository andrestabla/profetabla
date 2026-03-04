import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { prisma } from '@/lib/prisma';

type GenerateAiTextParams = {
    systemPrompt: string;
    userPrompt: string;
    temperature?: number;
};

export async function generateAiTextWithConfiguredProvider({
    systemPrompt,
    userPrompt,
    temperature = 0.35
}: GenerateAiTextParams): Promise<string | null> {
    const config = await prisma.platformConfig.findUnique({ where: { id: 'global-config' } });
    const provider = config?.aiProvider || 'GEMINI';

    if (provider === 'OPENAI') {
        const openaiKey = (config?.openaiApiKey || process.env.OPENAI_API_KEY || '').trim();
        if (!openaiKey) return null;

        try {
            const openai = new OpenAI({ apiKey: openaiKey });
            const completion = await openai.chat.completions.create({
                model: config?.openaiModel || 'gpt-4o-mini',
                temperature,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ]
            });
            return completion.choices[0]?.message?.content?.trim() || null;
        } catch (error) {
            console.error('[ai-text][openai] error:', error);
            return null;
        }
    }

    const geminiKey = (config?.geminiApiKey || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '').trim();
    if (!geminiKey) return null;

    try {
        const genAI = new GoogleGenerativeAI(geminiKey);
        const gemini = genAI.getGenerativeModel({ model: config?.geminiModel || 'gemini-1.5-flash' });
        const prompt = `${systemPrompt}\n\n${userPrompt}`;
        const result = await gemini.generateContent(prompt);
        return result.response.text().trim() || null;
    } catch (error) {
        console.error('[ai-text][gemini] error:', error);
        return null;
    }
}
