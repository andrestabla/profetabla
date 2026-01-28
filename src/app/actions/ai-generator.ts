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
  const systemRole = config?.aiInstructions || "Actúa como un Diseñador Instruccional Senior.";
  const tone = config?.aiTone === 'CREATIVE' ? 'Creativo, Innovador, Disruptivo' :
    config?.aiTone === 'PROFESSIONAL' ? 'Ejecutivo, Directo, Profesional' :
      config?.aiTone === 'SIMPLE' ? 'Sencillo, Claro, Explicativo' :
        'Académico, Analítico, Riguroso'; // Default ACADEMIC

  const prompt = `
    ${systemRole}
    
    ESTILO Y TONO: ${tone}
    
    TAREA:
    Estructura una propuesta para un **${type}** sobre: "${userIdea}"
    
    FORMATO DE SALIDA (JSON ESTRICTO):
    Responde ÚNICAMENTE con este JSON (sin markdown):
    {
      "title": "Título",
      "industry": "Industria",
      "description": "Resumen",
      "justification": "Fundamentación",
      "objectives": "Objetivos (Taxonomía de Bloom)",
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
  // Mapeamos gemini-pro a flash si viene en config, ya que pro está deprecado en v1beta en ciertos contextos
  const configModel = config?.geminiModel === 'gemini-pro' ? 'gemini-1.5-flash' : (config?.geminiModel || 'gemini-1.5-flash');

  const candidateModels = [
    configModel,
    // Modelos detectados en cuenta avanzada (Prioridad Alta)
    "gemini-2.0-flash",
    "gemini-2.5-flash",
    "gemini-2.5-pro",
    // Modelos estándar (Fallback para cuentas normales)
    "gemini-1.5-flash",
    "gemini-1.5-flash-001",
    "gemini-1.5-flash-002",
    "gemini-1.5-flash-8b",
    "gemini-1.5-pro",
    "gemini-1.5-pro-001",
    "gemini-1.0-pro",
    "gemini-pro"
  ];

  // Eliminar duplicados manteniendo el orden de prioridad
  const uniqueModels = Array.from(new Set(candidateModels));

  const errorLogs: string[] = [];

  // 3. Intento de Generación con Fallback
  for (const modelName of uniqueModels) {
    if (!modelName) continue;
    console.log(`Intentando generar con modelo: ${modelName}`);

    try {
      // @ts-expect-error - Ignore TS check for specific SDK version features
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
        const err = `Invalid JSON from ${modelName}`;
        console.error(err, text);
        errorLogs.push(`${modelName}: Bad Format`);
        throw new Error("Formato JSON inválido");
      }

      const cleanJson = jsonString.substring(firstBrace, lastBrace + 1);
      const projectData: AIProjectStructure = JSON.parse(cleanJson);

      return { success: true, data: projectData };

    } catch (error: any) {
      const errMsg = error.message || "Unknown error";
      console.warn(`Fallo con modelo ${modelName}:`, errMsg);

      // Simplificar el error para el log
      let shortMsg = "Error";
      if (errMsg.includes("404")) shortMsg = "404 Not Found";
      else if (errMsg.includes("403")) shortMsg = "403 Forbidden";
      else if (errMsg.includes("503")) shortMsg = "503 Overloaded";
      else if (errMsg.includes("API key")) shortMsg = "Bad Key";
      else shortMsg = errMsg.substring(0, 20) + "...";

      errorLogs.push(`${modelName}: ${shortMsg}`);
    }
  }

  // Si salimos del loop, todos fallaron
  console.error("Todos los modelos fallaron. Logs:", errorLogs);

  // DIAGNÓSTICO FINAL: Listar modelos disponibles para esta Key
  let availableModelsMsg = "";
  try {
    const listResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    if (listResponse.ok) {
      const data = await listResponse.json();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const names = (data.models || []).map((m: any) => m.name.replace('models/', ''));
      availableModelsMsg = ` | Modelos Disponibles en tu cuenta: [${names.join(', ')}]`;
    } else {
      availableModelsMsg = " | No se pudo obtener la lista de modelos (Error de conexión o permisos).";
    }
  } catch (e) {
    console.error("Error diagnosticando modelos:", e);
  }

  // Construir mensaje detallado para el usuario
  const fullLog = errorLogs.join(" | ");

  if (fullLog.includes("Bad Key") || fullLog.includes("API key")) {
    return { success: false, error: "Error: API Key inválida o sin permisos." };
  }

  return { success: false, error: `Error: Todos los modelos fallaron.${availableModelsMsg} Detalles técnicos: [${fullLog}]` };
}
