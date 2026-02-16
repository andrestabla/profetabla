'use server';

import { prisma } from '@/lib/prisma';
import OpenAI from 'openai';
import { PDFParse } from 'pdf-parse';

// Define the shape of the AI response
export type AIGradeResponse = {
    success: boolean;
    grades?: {
        rubricItemId: string;
        score: number;
        feedback: string;
    }[];
    generalFeedback?: string;
    error?: string;
};

type RubricItem = {
    id: string;
    criterion: string;
    maxPoints: number;
    order: number;
};

// Helper to download file from URL
async function downloadFile(url: string): Promise<Buffer> {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to download file: ${response.statusText}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
}

// Helper to extract text from file
async function extractText(buffer: Buffer, fileType: string): Promise<string> {
    // Basic support for PDF
    if (fileType.toLowerCase().includes('pdf') || fileType.toLowerCase() === 'application/pdf') {
        try {
            const parser = new PDFParse({ data: buffer });
            const data = await parser.getText();
            await parser.destroy();
            return data.text;
        } catch (error) {
            console.error("Error parsing PDF:", error);
            throw new Error("No se pudo leer el contenido del PDF.");
        }
    }

    // For now, only PDF text extraction is implemented for grading
    throw new Error("Formato de archivo no soportado para auto-evaluación (solo PDF).");
}

export async function generateGradeWithAI(submissionId: string, rubric: RubricItem[]): Promise<AIGradeResponse> {
    try {
        // 1. Get Submission and File URL
        const submission = await prisma.submission.findUnique({
            where: { id: submissionId },
            include: { assignment: true }
        });

        if (!submission || !submission.fileUrl) {
            return { success: false, error: "No se encontró el archivo de la entrega." };
        }

        // 2. Download and Extract Text
        console.log(`Downloading file for submission ${submissionId}...`);
        const fileBuffer = await downloadFile(submission.fileUrl);

        console.log(`Extracting text...`);
        const textContent = await extractText(fileBuffer, submission.fileType || 'application/pdf');

        if (!textContent || textContent.trim().length === 0) {
            return { success: false, error: "El archivo parece estar vacío o no contiene texto legible." };
        }

        // 3. Configure AI
        const config = await prisma.platformConfig.findUnique({ where: { id: 'global-config' } });
        const apiKey = config?.openaiApiKey || process.env.OPENAI_API_KEY;

        if (!apiKey) {
            return { success: false, error: "API Key de OpenAI no configurada." };
        }

        const openai = new OpenAI({ apiKey });
        const modelName = config?.openaiModel || 'gpt-4o-mini';

        // 4. Construct Prompt
        const rubricText = rubric.map(r =>
            `- ID: ${r.id}\n  CRITERIO: ${r.criterion}\n  PUNTOS MÁXIMOS: ${r.maxPoints}`
        ).join('\n');

        const prompt = `
            Actúa como un profesor experto y justo. Tu tarea es evaluar la entrega de un estudiante basándote ESTRICTAMENTE en la siguiente rúbrica.

            RÚBRICA DE EVALUACIÓN:
            ${rubricText}

            CONTENIDO DE LA ENTREGA DEL ESTUDIANTE:
            """
            ${textContent.substring(0, 20000)} 
            """
            (El contenido puede estar truncado si es muy extenso. Evalúa con base en lo disponible).

            INSTRUCCIONES:
            1. Analiza el contenido del estudiante frente a cada criterio de la rúbrica.
            2. Asigna un puntaje (score) JUSTIFICADO para cada criterio. El puntaje debe ser un número entero entre 0 y el PUNTOS MÁXIMOS del criterio.
            3. Proporciona un feedback constructivo y específico para cada criterio (explica por qué obtuvo ese puntaje).
            4. Proporciona un feedback general breve para el estudiante.
            
            FORMATO DE SALIDA (JSON ESTRICTO):
            Responde ÚNICAMENTE con este JSON válido (sin bloques de código markdown):
            {
                "grades": [
                    { "rubricItemId": "ID_DEL_CRITERIO", "score": N, "feedback": "Texto del feedback..." }
                ],
                "generalFeedback": "Texto del feedback general..."
            }
        `;

        // 5. Call OpenAI
        console.log("Calling OpenAI for grading...");
        const completion = await openai.chat.completions.create({
            model: modelName,
            messages: [{ role: "user", content: prompt }],
            response_format: { type: "json_object" },
            temperature: 0.3, // Lower temperature for more consistent/objective grading
        });

        const resContent = completion.choices[0].message.content;
        if (!resContent) throw new Error("Respuesta vacía de OpenAI");

        const aiData = JSON.parse(resContent);

        return {
            success: true,
            grades: aiData.grades,
            generalFeedback: aiData.generalFeedback
        };

    } catch (error: unknown) {
        console.error("Error in generateGradeWithAI:", error);
        const errorMessage = error instanceof Error ? error.message : "Error interno al evaluar con IA.";
        return { success: false, error: errorMessage };
    }
}
