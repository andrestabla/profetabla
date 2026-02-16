import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getR2FileUrl } from '@/lib/r2';
import { extractTextFromPdf } from '@/lib/pdf';
import OpenAI from 'openai';
import { RubricItem } from '@/types/grading';

export const maxDuration = 60; // Allow 60 seconds

export async function GET() {
    return NextResponse.json({ message: "AI Grading API is active" });
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { submissionId, rubric } = body as { submissionId: string; rubric: RubricItem[] };

        if (!submissionId || !rubric) {
            return NextResponse.json({ success: false, error: "Missing submissionId or rubric" }, { status: 400 });
        }

        // 1. Fetch submission
        const submission = await prisma.submission.findUnique({
            where: { id: submissionId },
            include: { assignment: true }
        });

        if (!submission || !submission.fileUrl) {
            return NextResponse.json({ success: false, error: "Submission or file not found." }, { status: 404 });
        }

        // 2. Retrieve file content
        let fileBuffer: Buffer | null = null;

        if (submission.fileUrl.startsWith('/api/file')) {
            const urlObj = new URL(submission.fileUrl, 'http://localhost');
            const key = urlObj.searchParams.get('key');
            if (key) {
                const downloadUrl = await getR2FileUrl(key);
                const response = await fetch(downloadUrl);
                if (!response.ok) throw new Error("Failed to download file from storage.");
                const arrayBuffer = await response.arrayBuffer();
                fileBuffer = Buffer.from(arrayBuffer);
            }
        } else if (submission.fileType === 'URL') {
            return NextResponse.json({ success: false, error: "AI Grading for external URLs is not supported yet." }, { status: 400 });
        } else {
            const response = await fetch(submission.fileUrl);
            if (!response.ok) throw new Error(`Failed to download file: ${response.status} ${response.statusText}`);
            console.log(`[AI Grading] Downloaded file from ${submission.fileUrl}, Content-Type: ${response.headers.get('content-type')}`);
            const arrayBuffer = await response.arrayBuffer();
            fileBuffer = Buffer.from(arrayBuffer);
        }

        if (!fileBuffer || fileBuffer.length === 0) {
            return NextResponse.json({ success: false, error: "Retrieved file content is empty." }, { status: 500 });
        }
        console.log(`[AI Grading] File Buffer Size: ${fileBuffer.length} bytes`);

        // 3. Extract Text
        const textContent = await extractTextFromPdf(fileBuffer);
        const truncatedText = textContent.slice(0, 30000);

        // 4. Call OpenAI
        const openaiKey = process.env.OPENAI_API_KEY;

        if (!openaiKey) {
            return NextResponse.json({
                success: false,
                error: "Configuración de OpenAI faltante. Por favor, agregue OPENAI_API_KEY a las variables de entorno de Vercel."
            }, { status: 500 });
        }

        console.log("[AI Grading] Using OpenAI");
        const openai = new OpenAI({ apiKey: openaiKey });

        const prompt = `
        Eres un EVALUADOR ACADÉMICO DE POSTGRADO extremadamente exigente, crítico y exhaustivo. 
        Tu misión es calificar con RIGOR EXTREMO el siguiente trabajo siguiendo la rúbrica.

        TRABAJO DEL ESTUDIANTE:
        """
        ${truncatedText}
        """

        RÚBRICA DE EVALUACIÓN (JSON):
        ${JSON.stringify(rubric, null, 2)}

        REGLAS DE ORO:
        1. RIGOR INFLEXIBLE: No regales puntos. Si la calidad es media, la nota debe ser media. El 100% es solo para la excelencia absoluta.
        2. COMENTARIOS OBLIGATORIOS: Para CADA criterio de la rúbrica, escribe un análisis profundo (propiedad "feedback") de por qué tiene esa nota.
        3. FEEDBACK GENERAL: Escribe una síntesis global detallada y crítica (mínimo 3 párrafos) en la propiedad "generalFeedback".
        4. IDIOMA: Responde siempre en ESPAÑOL.
        5. FORMATO: Devuelve ÚNICAMENTE un objeto JSON con esta estructura:
           {
             "grades": [
               { "rubricItemId": "ID", "score": N, "feedback": "Análisis profundo..." }
             ],
             "generalFeedback": "Feedback global..."
           }
        `;

        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: "Eres un evaluador académico senior. Siempre respondes con JSON puro." },
                { role: "user", content: prompt }
            ],
            response_format: { type: "json_object" }
        });

        const responseContent = completion.choices[0].message.content;
        if (!responseContent) throw new Error("No response from AI.");

        const data = JSON.parse(responseContent);
        const grades = data.grades || [];
        const generalFeedback = data.generalFeedback || "";

        return NextResponse.json({
            success: true,
            grades,
            generalFeedback
        });

    } catch (error: unknown) {
        console.error("AI Grading Error:", error);
        const err = error as Error;
        return NextResponse.json({ success: false, error: err.message || "Failed to generate grades." }, { status: 500 });
    }
}
