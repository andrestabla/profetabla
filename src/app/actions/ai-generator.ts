'use server';

import { GoogleGenerativeAI } from "@google/generative-ai";
import { prisma } from '@/lib/prisma';
import OpenAI from 'openai';

// --- Types ---
export type AIProjectStructure = {
  title: string;
  industry: string;
  description: string;
  justification: string;
  objectives: string;
  methodology: string;
  deliverables: string;
  schedule: string;
  budget: string;
  evaluation: string;
  kpis: string;
  phases: {
    title: string;
    description: string;
    priority: 'HIGH' | 'MEDIUM' | 'LOW';
  }[];
  suggestedResources: {
    title: string;
    url: string;
    type: 'ARTICLE' | 'VIDEO' | 'PDF';
  }[];
};

export type AIResponse = {
  success: boolean;
  data?: AIProjectStructure;
  error?: string;
};

// --- Helpers ---

/**
 * Builds the contextual instructions for project generation.
 * Ensures parity between providers by using the same prompt logic.
 */
function buildProjectContext(
  type: 'PROJECT' | 'CHALLENGE' | 'PROBLEM',
  options: { tone?: string; useSearch?: boolean } | undefined,
  config: any // eslint-disable-line @typescript-eslint/no-explicit-any
) {
  const systemRole = config?.aiInstructions || "Actúa como un Diseñador Instruccional Senior.";
  const selectedTone = options?.tone || config?.aiTone || 'ACADEMIC';
  const tone = selectedTone === 'CREATIVE' ? 'Creativo, Innovador, Disruptivo' :
    selectedTone === 'PROFESSIONAL' ? 'Ejecutivo, Directo, Profesional' :
      selectedTone === 'SIMPLE' ? 'Sencillo, Claro, Explicativo' :
        'Académico, Analítico, Riguroso';

  const searchEnabled = options?.useSearch !== undefined ? options.useSearch : config?.aiSearchEnabled;
  const searchPrompt = searchEnabled ? " (CONSIDERA TENDENCIAS ACTUALES Y DATOS REALES SI ES POSIBLE)" : "";

  let specificInstructions = "";
  if (type === 'CHALLENGE') {
    specificInstructions = `
        METODOLOGÍA: APRENDIZAJE BASADO EN RETOS (ABR_retos)
        DEFINICIÓN: Desafío de alcance social o comunitario que requiere una acción concreta. 
        ESTRUCTURA: description, objectives (Pregunta Desafío), methodology (5 Fases: Elección, Preguntas, Desarrollo, Comprobación, Difusión).`;
  } else if (type === 'PROBLEM') {
    specificInstructions = `
        METODOLOGÍA: APRENDIZAJE BASADO EN PROBLEMAS (ABP_problemas)
        DEFINICIÓN: Escenario complejo que requiere aplicar conocimientos. 
        ESTRUCTURA: description, objectives (Saberes vs Vacíos), methodology (5 Fases: Presentación, Análisis, Investigación, Síntesis, Reflexión).`;
  } else {
    specificInstructions = `
        METODOLOGÍA: APRENDIZAJE BASADO EN PROYECTOS (ABP_proyectos)
        DEFINICIÓN: Tema central abierto. 
        ESTRUCTURA: description, objectives (Pregunta Guía), methodology (3 Fases: Investigación, Ejecución, Presentación).`;
  }

  return { systemRole, tone, searchPrompt, specificInstructions };
}

/**
 * Generates project structure using OpenAI.
 */
async function generateWithOpenAI(
  apiKey: string,
  modelName: string,
  userIdea: string,
  type: string,
  context: ReturnType<typeof buildProjectContext>
): Promise<AIResponse> {
  const openai = new OpenAI({ apiKey });

  const prompt = `
    ${context.systemRole}
    ESTILO Y TONO: ${context.tone} ${context.searchPrompt}
    INSTRUCCIÓN CLAVE: SE EXHAUSTIVO, DETALLADO Y EXTENSO. NO DEJES CAMPOS VACÍOS.
    
    ${context.specificInstructions}

    TAREA:
    Estructura una propuesta COMPLETA y DETALLADA para un **${type}** sobre: "${userIdea}"
    
    IMPORTANTE: El idioma de respuesta debe ser EXCLUSIVAMENTE ESPAÑOL.
    
    FORMATO DE SALIDA (JSON ESTRICTO):
    Responde ÚNICAMENTE con este JSON (sin markdown).
    
    {
      "title": "Título Académico Profesional",
      "industry": "Industria / Sector Específico",
      "description": "Descripción detallada (mínimo 3 párrafos).",
      "justification": "Fundamentación pedagógica.",
      "objectives": "Objetivo General y Específicos.",
      "methodology": "Descripción metodológica.",
      "deliverables": "Productos esperados.",
      "schedule": "Cronograma estimado.",
      "budget": "Recursos y costos.",
      "evaluation": "Estrategia de evaluación.",
      "kpis": "Métricas de éxito.",
      "phases": [
        { "title": "Fase 1", "description": "...", "priority": "HIGH" }
      ],
      "suggestedResources": [
        { "title": "Recurso 1", "url": "...", "type": "ARTICLE" }
      ]
    }
  `;

  try {
    const completion = await openai.chat.completions.create({
      model: modelName,
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const resContent = completion.choices[0].message.content;
    if (!resContent) throw new Error("Empty response from OpenAI");
    return { success: true, data: JSON.parse(resContent) };
  } catch (e: unknown) {
    const error = e as Error;
    return { success: false, error: "OpenAI error: " + error.message };
  }
}

// --- Main Functions ---

export async function generateProjectStructure(
  userIdea: string,
  type: 'PROJECT' | 'CHALLENGE' | 'PROBLEM' = 'PROJECT',
  options?: { tone?: string; useSearch?: boolean }
): Promise<AIResponse> {
  const config = await prisma.platformConfig.findUnique({ where: { id: 'global-config' } });
  const safeConfig = (config || {}) as any; // eslint-disable-line @typescript-eslint/no-explicit-any
  const aiProvider = safeConfig.aiProvider || 'GEMINI';

  if (aiProvider === 'OPENAI') {
    const apiKey = config?.openaiApiKey || process.env.OPENAI_API_KEY;
    if (!apiKey) return { success: false, error: "OpenAI API Key no encontrada." };
    const context = buildProjectContext(type, options, safeConfig);
    return await generateWithOpenAI(apiKey, safeConfig.openaiModel || 'gpt-4o-mini', userIdea, type, context);
  }

  // Gemini logic
  const apiKey = config?.geminiApiKey || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) return { success: false, error: "Gemini API Key no encontrada." };

  const context = buildProjectContext(type, options, safeConfig);
  const genAI = new GoogleGenerativeAI(apiKey);

  const prompt = `
    ${context.systemRole}
    ESTILO Y TONO: ${context.tone} ${context.searchPrompt}
    ${context.specificInstructions}
    TAREA: Estructura una propuesta para un **${type}** sobre: "${userIdea}"
    FORMATO: JSON (title, industry, description, justification, objectives, methodology, deliverables, schedule, budget, evaluation, kpis, phases, suggestedResources)
  `;

  const candidateModels = [
    safeConfig.geminiModel || 'gemini-1.5-flash',
    "gemini-2.0-flash",
    "gemini-1.5-flash",
    "gemini-1.5-pro",
    "gemini-pro"
  ];

  const uniqueModels = Array.from(new Set(candidateModels));
  const errorLogs: string[] = [];

  for (const modelName of uniqueModels) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      const text = result.response.text();

      const jsonString = text.replace(/```json/g, '').replace(/```/g, '').trim();
      const firstBrace = jsonString.indexOf('{');
      const lastBrace = jsonString.lastIndexOf('}');
      if (firstBrace === -1 || lastBrace === -1) throw new Error("Format error");

      return { success: true, data: JSON.parse(jsonString.substring(firstBrace, lastBrace + 1)) };
    } catch (e: unknown) {
      const error = e as Error;
      errorLogs.push(`${modelName}: ${error.message}`);
    }
  }

  return { success: false, error: "Todos los modelos de Gemini fallaron: " + errorLogs.join(" | ") };
}

export async function extractOAMetadata(content: string): Promise<{
  title: string;
  subject: string;
  competency?: string;
  keywords: string[];
  description: string;
  utility?: string;
} | null> {
  const config = await prisma.platformConfig.findUnique({ where: { id: 'global-config' } });
  const safeConfig = (config || {}) as any; // eslint-disable-line @typescript-eslint/no-explicit-any
  const aiProvider = safeConfig.aiProvider || 'GEMINI';

  const prompt = `
    Actúa como un experto pedagogo. Tu tarea sugerir metadatos para un Objeto de Aprendizaje (OA) basándote en la información proporcionada.
    CONTENIDO: ${content.substring(0, 15000)}
    RESPONDE SIEMPRE EN ESPAÑOL EN FORMATO JSON:
    { "title": "...", "subject": "...", "competency": "...", "keywords": [], "description": "...", "utility": "..." }
  `;

  if (aiProvider === 'OPENAI') {
    const apiKey = config?.openaiApiKey || process.env.OPENAI_API_KEY;
    if (!apiKey) return null;
    try {
      const openai = new OpenAI({ apiKey });
      const completion = await openai.chat.completions.create({
        model: safeConfig.openaiModel || 'gpt-4o-mini',
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
      });
      const resContent = completion.choices[0].message.content;
      return resContent ? JSON.parse(resContent) : null;
    } catch (e) {
      console.error("OpenAI Error:", e);
      return null;
    }
  }

  // Gemini logic
  const apiKey = config?.geminiApiKey || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) return null;

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: safeConfig.geminiModel || "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const jsonString = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const firstBrace = jsonString.indexOf('{');
    const lastBrace = jsonString.lastIndexOf('}');
    if (firstBrace === -1 || lastBrace === -1) return null;
    return JSON.parse(jsonString.substring(firstBrace, lastBrace + 1));
  } catch (e) {
    console.error("Gemini Error:", e);
    return null;
  }
}
