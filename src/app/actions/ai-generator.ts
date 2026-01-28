'use server';

import { GoogleGenerativeAI } from "@google/generative-ai";
import { prisma } from '@/lib/prisma';

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

export async function generateProjectStructure(userIdea: string, type: 'PROJECT' | 'CHALLENGE' | 'PROBLEM' = 'PROJECT') {
  // 1. Obtener la API Key desde Configuración DB o Variables de Entorno
  const config = await prisma.platformConfig.findUnique({ where: { id: 'global-config' } });

  // Prioridad: DB > Env Variable
  const apiKey = config?.geminiApiKey || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

  if (!apiKey) {
    throw new Error("API Key no encontrada. Configure 'GEMINI_API_KEY' en .env o en la base de datos.");
  }

  const genAI = new GoogleGenerativeAI(apiKey);

  // Usar Flash por defecto por velocidad (evitar timeouts en Vercel)
  const modelName = config?.geminiModel || "gemini-1.5-flash";

  // @ts-ignore - Ignore TS check for specific SDK version features
  const model = genAI.getGenerativeModel({ model: modelName });

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

  // 3. Generación y Limpieza
  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    console.log("AI Raw Response:", text.substring(0, 100) + "..."); // Debug log

    // Limpieza robusta
    const jsonString = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const firstBrace = jsonString.indexOf('{');
    const lastBrace = jsonString.lastIndexOf('}');

    if (firstBrace === -1 || lastBrace === -1) {
      console.error("Invalid JSON response:", text);
      throw new Error("La IA no devolvió un formato válido.");
    }

    const cleanJson = jsonString.substring(firstBrace, lastBrace + 1);
    const projectData: AIProjectStructure = JSON.parse(cleanJson);
    return projectData;

  } catch (error: any) {
    console.error("Error AI Generator:", error);
    // Retornar mensaje descriptivo
    const msg = error.message || "Error desconocido";
    if (msg.includes("API key")) throw new Error("Error de Configuración: API Key inválida.");
    if (msg.includes("fetch failed")) throw new Error("Error de Conexión con Google AI.");
    throw new Error(`Error generando: ${msg}`);
  }
}
