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
        METODOLOGÍA: APRENDIZAJE BASADO EN RETOS (ABR_retos)
        
        DEFINICIÓN: Desafío de alcance social o comunitario que requiere una acción concreta. Tema amplio, realista y motivador.
        CONTEXTO/CONEXIÓN REAL: Contexto auténtico que involucra comunidad, sector productivo o instituciones externas, con propósito social claro.
        
        ESTRUCTURA DE RESPUESTA REQUERIDA:
        - "description": Describe el desafío social o comunitario y su conexión con el entorno.
        - "objectives": Incluye la "Pregunta Desafío" como eje central.
        - "methodology": Describe estas 5 FASES OBLIGATORIAS:
             1. Elección del reto (Definición del tema general)
             2. Generación de preguntas (Lluvia de ideas y formulación de preguntas)
             3. Desarrollo del reto (Investigación y diseño de soluciones)
             4. Comprobación en contexto (Implementación o simulación)
             5. Difusión de resultados (Comunicación pública)
        - "deliverables": Solución concreta (Ejemplos: Prototipo funcional, Propuesta de cambio, Campaña, Video).
        - "evaluation": Formativa y colaborativa. Centrada en proceso e impacto.
        `;
  } else if (type === 'PROBLEM') { // ABP (Problemas)
    specificInstructions = `
        METODOLOGÍA: APRENDIZAJE BASADO EN PROBLEMAS (ABP_problemas)
        
        DEFINICIÓN: Escenario o problema real, complejo y relevante que requiere aplicar conocimientos previos y desarrollar nuevos aprendizajes.
        CONTEXTO: Vinculado al campo profesional o a situaciones reales de la vida (casos clínicos, dilemas).
        
        ESTRUCTURA DE RESPUESTA REQUERIDA:
        - "description": Presenta el escenario o problema complejo.
        - "objectives": Identificación de conocimientos previos y vacíos de información (Lo que se sabe vs lo que se ignora).
        - "methodology": Describe estas 5 FASES OBLIGATORIAS:
             1. Presentación del problema (Exposición del caso)
             2. Análisis y objetivos de aprendizaje (Identificación de necesidades)
             3. Investigación autónoma (Búsqueda de información)
             4. Síntesis y solución (Integración de información)
             5. Evaluación y reflexión (Retroalimentación)
        - "deliverables": Producto de comprensión (Ejemplos: Informe analítico, Presentación argumentada, Modelo).
        - "evaluation": Continua e integral. Evalúa análisis y calidad de la solución.
        `;
  } else { // PROJECT (ABP - Proyectos)
    specificInstructions = `
        METODOLOGÍA: APRENDIZAJE BASADO EN PROYECTOS (ABP_proyectos)
        
        DEFINICIÓN: Se formula un tema o problema central abierto que motiva la investigación. Conectado con el currículo.
        CONTEXTO: Contexto real y significativo (empresas, comunidad) que conecta contenidos con práctica.
        
        ESTRUCTURA DE RESPUESTA REQUERIDA:
        - "description": Situación real y significativa que justifica el proyecto.
        - "objectives": Debe centrarse en una "Pregunta Guía" (¿Cómo mejorar...?) estimulante.
        - "methodology": Describe estas 3 FASES OBLIGATORIAS (pueden subdividirse):
             1. Investigación y planificación (Presentación de pregunta guía, objetivos, recursos)
             2. Ejecución del proyecto (Desarrollo de soluciones, prototipos, investigación)
             3. Presentación y evaluación (Socialización de resultados, reflexión)
        - "deliverables": Producto final tangible (Ejemplos: Informe escrito, Presentación multimedia, Prototipo, Campaña).
        - "evaluation": Continua y formativa. Valorando producto y competencias.
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
    Actúa como un experto pedagogo. Tu tarea suferir metadatos para un Objeto de Aprendizaje (OA) basándote en la información proporcionada.
    
    INFORMACIÓN DE ENTRADA (Puede ser contenido de un documento o metadatos básicos como URL/Título):
    ${content.substring(0, 15000)}

    INSTRUCCIONES:
    1. Si es un texto extenso, analízalo.
    2. Si es una URL (ej. YouTube) o título, INFIERE el contenido basándote en el título y la estructura del enlace. NO digas "no puedo ver el video", simplemente sugiere lo mejor posible basado en el título.
    3. Responde SIEMPRE EN ESPAÑOL.

    FORMATO DE RESPUESTA (JSON PURO):
    {
      "title": "Título mejorado y atractivo",
      "subject": "Materia o área de conocimiento",
      "competency": "Competencia sugerida que desarrolla",
      "keywords": ["palabra1", "palabra2", "palabra3", "palabra4"],
      "description": "Descripción pedagógica clara y motivadora (2-3 frases)"
    }
    `;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    // Robust cleanup similar to generateProjectStructure
    const jsonString = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const firstBrace = jsonString.indexOf('{');
    const lastBrace = jsonString.lastIndexOf('}');

    if (firstBrace === -1 || lastBrace === -1) {
      throw new Error("No valid JSON found in response");
    }

    const cleanJson = jsonString.substring(firstBrace, lastBrace + 1);
    return JSON.parse(cleanJson);
  } catch (e) {
    console.error("Error extracting OA metadata:", e);
    return null;
  }
}
