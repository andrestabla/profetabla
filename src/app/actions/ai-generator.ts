'use server';

import { GoogleGenerativeAI } from "@google/generative-ai";
import { prisma } from '@/lib/prisma';

// Definimos la estructura exacta que esperamos de la IA
// Definimos la estructura exacta que esperamos de la IA
export type AIProjectStructure = {
  title: string;           // Título académico sugerido
  industry: string;        // Industria inferida
  description: string;     // Descripción general del contexto
  justification: string;   // Fundamentación pedagógica / Planteamiento del problema
  objectives: string;      // Objetivos (Taxonomía de Bloom)
  deliverables: string;    // Entregables esperados
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

export async function generateProjectStructure(userIdea: string, type: 'PROJECT' | 'CHALLENGE' | 'PROBLEM' = 'PROJECT'): Promise<AIResponse> {
  // 1. Obtener la API Key desde Configuración DB o Variables de Entorno
  const config = await prisma.platformConfig.findUnique({ where: { id: 'global-config' } });

  // Prioridad: DB > Env Variable
  const apiKey = config?.geminiApiKey || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

  if (!apiKey) {
    return { success: false, error: "API Key no encontrada. Configure 'GEMINI_API_KEY' en .env o en la base de datos." };
  }

  const genAI = new GoogleGenerativeAI(apiKey);

  // 2. El Prompt de Ingeniería Pedagógica
  const prompt = `
    Actúa como un Diseñador Instruccional Senior.
    Estructura una propuesta para un **${type}** sobre: "${userIdea}"
    
    Requisitos: Tono académico, analítico. Objetivos Bloom.
    
    Responde ÚNICAMENTE con este JSON (sin markdown):
    {
      "title": "Título",
      "industry": "Industria",
      "description": "Resumen",
      "justification": "Fundamentación",
      "objectives": "Objetivos",
      "deliverables": "Entregables",
      "phases": [
        { "title": "Fase 1", "description": "Actividad", "priority": "HIGH" }
      ],
      "suggestedResources": [
        { "title": "Recurso", "url": "", "type": "ARTICLE" }
      ]
    }
  `;

  // LISTA DE MODELOS CANDIDATOS (Estrategia de Fallback)
  // Mapeamos gemini-pro a flash si viene en config, ya que pro está deprecado en v1beta
  const configModel = config?.geminiModel === 'gemini-pro' ? 'gemini-1.5-flash' : (config?.geminiModel || 'gemini-1.5-flash');

  const candidateModels = [
    configModel,
    "gemini-1.5-flash",
    "gemini-1.5-flash-001",
    "gemini-1.5-flash-002",
    "gemini-1.5-pro",
    "gemini-1.5-pro-001",
    "gemini-2.0-flash-exp"
  ];

  // Eliminar duplicados manteniendo el orden de prioridad
  const uniqueModels = Array.from(new Set(candidateModels));

  let lastError = null;

  // 3. Intento de Generación con Fallback
  for (const modelName of uniqueModels) {
    console.log(`Intentando generar con modelo: ${modelName}`);

    try {
      // @ts-ignore
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      console.log(`Éxito con ${modelName}`);

      // Limpieza robusta
      const jsonString = text.replace(/```json/g, '').replace(/```/g, '').trim();
      const firstBrace = jsonString.indexOf('{');
      const lastBrace = jsonString.lastIndexOf('}');

      if (firstBrace === -1 || lastBrace === -1) {
        console.error(`Invalid JSON from ${modelName}:`, text);
        throw new Error("Formato JSON inválido");
      }

      const cleanJson = jsonString.substring(firstBrace, lastBrace + 1);
      const projectData: AIProjectStructure = JSON.parse(cleanJson);

      return { success: true, data: projectData };

    } catch (error: any) {
      console.warn(`Fallo con modelo ${modelName}:`, error.message);
      lastError = error;
      // Continuar al siguiente modelo
    }
  }

  // Si salimos del loop, todos fallaron
  const msg = lastError?.message || "Error desconocido";
  console.error("Todos los modelos fallaron. Último error:", msg);

  if (msg.includes("API key")) return { success: false, error: "Error de Configuración: API Key inválida." };

  return { success: false, error: `Error generando (Todos los modelos fallaron). Último: ${msg}` };
}
