'use server';

import { GoogleGenerativeAI } from "@google/generative-ai";
import { prisma } from '@/lib/prisma';

// Definimos la estructura exacta que esperamos de la IA
export type AIProjectStructure = {
    justification: string;
    objectives: string;
    deliverables: string;
    phases: {
        title: string;       // Será una Tarea en el Kanban
        description: string; // Descripción de la tarjeta
        priority: 'HIGH' | 'MEDIUM' | 'LOW';
    }[];
    suggestedResources: {
        title: string;
        url: string;
        type: 'ARTICLE' | 'VIDEO' | 'PDF';
    }[];
};

export async function generateProjectStructure(topic: string, industry: string) {
    // 1. Obtener la API Key desde nuestra configuración global
    const config = await prisma.platformConfig.findUnique({ where: { id: 'global-config' } });

    if (!config?.geminiApiKey) {
        throw new Error("La IA no está configurada en la plataforma. Contacte al administrador.");
    }

    const genAI = new GoogleGenerativeAI(config.geminiApiKey);
    const model = genAI.getGenerativeModel({ model: config.geminiModel || "gemini-pro" });

    // 2. El Prompt de Ingeniería Pedagógica
    const prompt = `
    Actúa como un Diseñador Instruccional experto en Aprendizaje Basado en Proyectos (ABP).
    Crea la estructura para un proyecto educativo sobre: "${topic}" enfocado en la industria: "${industry}".
    
    IMPORTANTE: Tu respuesta debe ser EXCLUSIVAMENTE un objeto JSON válido con esta estructura exacta, sin texto adicional ni markdown:
    {
      "justification": "Texto breve de por qué es relevante en la industria",
      "objectives": "Lista de competencias a desarrollar",
      "deliverables": "Lista de productos finales esperados",
      "phases": [
        { "title": "Nombre de la Tarea (Fase)", "description": "Qué debe hacer el estudiante (breve)", "priority": "HIGH/MEDIUM/LOW" }
      ],
      "suggestedResources": [
        { "title": "Nombre del recurso", "url": "url_sugerida_o_busqueda", "type": "ARTICLE/VIDEO" }
      ]
    }
    Genera al menos 5 fases (tareas) lógicas y secuenciales.
    NO incluyas \`\`\`json ni bloques de código. Devuelve SOLO el JSON raw.
  `;

    // 3. Generación y Limpieza
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Limpiamos los bloques de código markdown si la IA los incluye
    const jsonString = text.replace(/```json|```/g, '').trim();

    try {
        const projectData: AIProjectStructure = JSON.parse(jsonString);
        return projectData;
    } catch (error) {
        console.error("Error al parsear respuesta de IA:", error);
        // Fallback manual simple por si acaso falla el parseo
        throw new Error("La IA generó una estructura inválida. Intenta con un tema más específico.");
    }
}
