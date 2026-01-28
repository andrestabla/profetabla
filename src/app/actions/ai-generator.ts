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
  // 1. Obtener la API Key desde nuestra configuración global
  const config = await prisma.platformConfig.findUnique({ where: { id: 'global-config' } });

  if (!config?.geminiApiKey) {
    throw new Error("La IA no está configurada en la plataforma. Contacte al administrador.");
  }

  const genAI = new GoogleGenerativeAI(config.geminiApiKey);

  // Configurar herramientas (Tools) para acceso a web si es posible
  // Nota: googleSearchRetrieval requiere un modelo compatible (ej. gemini-1.5-pro-002) y configuración en Google Cloud.
  // Intentaremos usar el modelo configurado o fallback a uno capaz.
  const modelName = config.geminiModel || "gemini-1.5-flash"; // Flash suele ser rápido y capaz.

  // Tools definition (Experimental / Version dependent)
  // Para simplificar y asegurar compatibilidad, usaremos el prompt para pedir "Investigación" simulada si no hay tools configuradas,
  // pero si la versión de SDK lo permite, pasamos tools.
  // @ts-ignore - Ignore TS check for specific SDK version features if types aren't fully updated
  const model = genAI.getGenerativeModel({
    model: modelName,
    // tools: [{ googleSearch: {} }] // Descomentar si la API Key tiene permisos de Search Grounding
  });

  // 2. El Prompt de Ingeniería Pedagógica
  const prompt = `
    Actúa como un Diseñador Instruccional Senior y Experto Académico.
    Tu tarea es estructurar una propuesta pedagógica de alto nivel para un **${type}** basado en la siguiente idea del usuario:
    
    "${userIdea}"
    
    **Requisitos de Estilo:**
    - Tono: Académico, Analítico, Profesional.
    - Enfoque: Aprendizaje Basado en Retos/Proyectos.
    - Usa la Taxonomía de Bloom para los objetivos.
    - Enriquece la propuesta con datos reales o contexto de industria si es relevante.

    **Salida Esperada (JSON ÚNICAMENTE):**
    Devuelve un objeto JSON válido con esta estructura exacta:
    {
      "title": "Título sugerido (atractivo y académico)",
      "industry": "Sector o Industria inferida",
      "description": "Resumen ejecutivo del contexto y la situación (aprox 2-3 oraciones)",
      "justification": "Fundamentación: ¿Por qué es relevante este problema/reto? Mencion datos o tendencias.",
      "objectives": "Objetivo General y 3 Específicos (redactados formalmente)",
      "deliverables": "Lista de productos tangibles que el estudiante entregará (separados por guiones)",
      "phases": [
        { "title": "Nombre de la Fase", "description": "Actividad clave", "priority": "HIGH/MEDIUM/LOW" }
      ],
      "suggestedResources": [
        { "title": "Nombre del recurso (Real o sugerido)", "url": "URL (si la conoces) o vacío", "type": "ARTICLE/VIDEO" }
      ]
    }
    
    Genera entre 4 y 6 fases lógicas.
    NO uses bloques de código markdown (\`\`\`json). Devuelve SOLO el texto JSON raw.
  `;

  // 3. Generación y Limpieza
  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Limpieza robusta de JSON
    const jsonString = text.replace(/```json|```/g, '').trim();

    // Encontrar el primer '{' y el último '}'
    const firstBrace = jsonString.indexOf('{');
    const lastBrace = jsonString.lastIndexOf('}');

    if (firstBrace === -1 || lastBrace === -1) {
      throw new Error("Respuesta de IA no válida (no JSON)");
    }

    const cleanJson = jsonString.substring(firstBrace, lastBrace + 1);

    const projectData: AIProjectStructure = JSON.parse(cleanJson);
    return projectData;

  } catch (error) {
    console.error("Error AI Generator:", error);
    throw new Error("No se pudo generar la estructura. Intenta ser más específico con tu idea.");
  }
}
