'use server';

import { GoogleGenerativeAI } from "@google/generative-ai";
import { prisma } from '@/lib/prisma';

// Definimos la estructura exacta que esperamos de la IA
// Definimos la estructura exacta que esperamos de la IA
export type AIProjectStructure = {
  title: string;           // Título académico sugerido
  industry: string;        // Industria inferida
  description: string;     // Descripción general del contexto
  justification: string;   // Fundamentación pedagógica
  objectives: string;      // Texto completo de objetivos (General y Específicos)
  methodology: string;     // Descripción metodológica o fases resumidas
  deliverables: string;    // Lista detallada de entregables
  schedule: string;        // Cronograma estimado (fases y tiempos)
  budget: string;          // Presupuesto y recursos estimados
  evaluation: string;      // Sistema de evaluación
  kpis: string;            // Indicadores clave de desempeño
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

export async function generateProjectStructure(
  userIdea: string,
  type: 'PROJECT' | 'CHALLENGE' | 'PROBLEM' = 'PROJECT',
  options?: { tone?: string; useSearch?: boolean }
): Promise<AIResponse> {
  // 1. Obtener la API Key desde Configuración DB o Variables de Entorno
  const config = await prisma.platformConfig.findUnique({ where: { id: 'global-config' } });

  // Prioridad: DB > Env Variable
  const apiKey = config?.geminiApiKey || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

  if (!apiKey) {
    return { success: false, error: "API Key no encontrada. Configure 'GEMINI_API_KEY' en .env o en la base de datos." };
  }

  const genAI = new GoogleGenerativeAI(apiKey);

  // 2. El Prompt de Ingeniería Pedagógica
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const safeConfig = config as any;
  const systemRole = safeConfig?.aiInstructions || "Actúa como un Diseñador Instruccional Senior.";

  // Resolve Tone: Option > Config > Default
  const selectedTone = options?.tone || safeConfig?.aiTone || 'ACADEMIC';

  const tone = selectedTone === 'CREATIVE' ? 'Creativo, Innovador, Disruptivo' :
    selectedTone === 'PROFESSIONAL' ? 'Ejecutivo, Directo, Profesional' :
      selectedTone === 'SIMPLE' ? 'Sencillo, Claro, Explicativo' :
        'Académico, Analítico, Riguroso'; // Default ACADEMIC

  // Web Search Warning (Logic only, actual grounding requires tool integration which is next step if requested)
  const searchEnabled = options?.useSearch !== undefined ? options.useSearch : safeConfig?.aiSearchEnabled;
  const searchPrompt = searchEnabled ? " (CONSIDERA TENDENCIAS ACTUALES Y DATOS REALES SI ES POSIBLE)" : "";

  let specificInstructions = "";

  if (type === 'CHALLENGE') { // ABR
    specificInstructions = `
        METODOLOGÍA: APRENDIZAJE BASADO EN RETOS (ABR)
        
        DEFINICIÓN: Desafío de alcance social o comunitario que se resuelve mediante acción concreta.
        CONTEXTO/CONEXIÓN REAL: El reto se sitúa en el contexto del entorno de aprendizaje (centro educativo, comunidad) e implica agentes externos. Busca resolver un problema auténtico.
        
        ESTRUCTURA DE RESPUESTA:
        - "description": Enfócate en el problema del entorno y el propósito social.
        - "objectives": Debe incluir la "Pregunta Desafío" (Pregunta troncal) y metas de acción concreta.
        - "methodology": Describe estas fases: 1. Elección del reto, 2. Generación de preguntas (Brainstorming), 3. Desarrollo (Investigación), 4. Comprobación en contexto, 5. Difusión.
        - "deliverables": Debe ser una solución concreta (Prototipo, campaña, acción real, video divulgativo).
        - "phases": Genera fases que coincidan EXACTAMENTE con las descritas en "methodology".
        `;
  } else if (type === 'PROBLEM') { // ABP (Problemas)
    specificInstructions = `
        METODOLOGÍA: APRENDIZAJE BASADO EN PROBLEMAS (ABP)
        
        DEFINICIÓN: Escenario o problema real complejo que requiere aplicar conocimientos previos y búsqueda independiente.
        CONTEXTO: Vinculado al campo profesional o situaciones concretas de la vida real (casos clínicos, dilemas).
        
        ESTRUCTURA DE RESPUESTA:
        - "description": Presenta el escenario o caso problemático como punto de partida.
        - "objectives": Enfócate en identificar lo conocido, lo desconocido y formular preguntas de investigación.
        - "methodology": Describe estas fases: 1. Presentación del problema, 2. Lluvia de ideas y objetivos, 3. Investigación autónoma, 4. Síntesis y solución, 5. Evaluación.
        - "deliverables": Informe escrito, presentación de solución, esquemas o modelos.
        - "phases": Genera fases que coincidan EXACTAMENTE con las descritas en "methodology".
        `;
  } else { // PROJECT (ABP - Proyectos)
    specificInstructions = `
        METODOLOGÍA: APRENDIZAJE BASADO EN PROYECTOS (ABP)
        
        DEFINICIÓN: Se formula un tema o problema central abierto que motiva la investigación. Reto estimulante conectado con el currículo.
        CONTEXTO: Situaciones de la vida real o escenarios auténticos (empresas, comunidad). Permite planear, implementar y evaluar.
        
        ESTRUCTURA DE RESPUESTA:
        - "description": Describe el proyecto y su conexión con el mundo real.
        - "objectives": Incluye la "Pregunta Guía" desafiante.
        - "methodology": Describe estas fases: 1. Investigación y planificación, 2. Implementación/Desarrollo, 3. Presentación de resultados, 4. Evaluación y reflexión.
        - "deliverables": Producto final tangible o servicio (Informe, prototipo, campaña).
        - "phases": Genera fases que coincidan EXACTAMENTE con las descritas en "methodology".
        `;
  }

  const prompt = `
    ${systemRole}
    
    ESTILO Y TONO: ${tone} ${searchPrompt}
    INSTRUCCIÓN CLAVE: SE EXHAUSTIVO, DETALLADO Y EXTENSO. NO DEJES CAMPOS VACÍOS.
    
    ${specificInstructions}

    TAREA:
    Estructura una propuesta COMPLETA y DETALLADA para un **${type}** sobre: "${userIdea}"
    
    IMPORTANTE: El idioma de respuesta debe ser EXCLUSIVAMENTE ESPAÑOL.
    
    FORMATO DE SALIDA (JSON ESTRICTO):
    Responde ÚNICAMENTE con este JSON (sin markdown). Asegúrate de que los campos de texto (description, objectives, etc.) sean STRINGS largos y detallados, no objetos ni arrays.
    
    {
      "title": "Título Académico Profesional",
      "industry": "Industria / Sector Específico",
      "description": "Descripción detallada (mínimo 3 párrafos). Usa **negritas** para conceptos clave.",
      "justification": "Fundamentación teórica. Usa referencias si es posible.",
      "objectives": "Objetivo General / Pregunta Guía: ... \\n\\nObjetivos Específicos: ...",
      "methodology": "Descripción metodológica o fases resumidas",
      "deliverables": "Lista detallada usando bullets de los productos esperados.",
      "schedule": "Usa una LISTA o TABLA Markdown con el cronograma estimado.",
      "budget": "GENERA UNA TABLA MARKDOWN con recursos y costos estimados.",
      "evaluation": "Estrategia de evaluación (criterios claros, autoevaluación, coevaluación).",
      "kpis": "Lista numerada con métricas de éxito.",
      "phases": [
        { "title": "Fase X: Nombre", "description": "Descripción extensa de actividades...", "priority": "HIGH" }
      ],
      "suggestedResources": [
        { "title": "Título del Recurso", "url": "https://...", "type": "ARTICLE" }
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
      // Google SDK call
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

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

export async function extractOAMetadata(content: string): Promise<{
  title: string;
  subject: string;
  competency?: string;
  keywords: string[];
  description: string;
} | null> {
  const config = await prisma.platformConfig.findUnique({ where: { id: 'global-config' } });
  const apiKey = config?.geminiApiKey || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

  if (!apiKey) return null;

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: config?.geminiModel || "gemini-1.5-flash" });

  const prompt = `
    Analiza el siguiente contenido extraído de un documento y genera los metadatos para un "Objeto de Aprendizaje" (OA).
    IMPORTANTE: Responde SIEMPRE EN ESPAÑOL.
    Responde ÚNICAMENTE con un JSON con esta estructura:
    {
      "title": "Título sugerido",
      "subject": "Materia o área de conocimiento",
      "competency": "Competencia que desarrolla (opcional)",
      "keywords": ["palabra1", "palabra2"],
      "description": "Descripción resumida y clara"
    }

    CONTENIDO:
    ${content.substring(0, 10000)}
    `;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const jsonString = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(jsonString);
  } catch (e) {
    console.error("Error extracting OA metadata:", e);
    return null;
  }
}
