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
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) return NextResponse.json({ success: false, error: "AI Configuration missing (OPENAI_API_KEY)." }, { status: 500 });

        const openai = new OpenAI({ apiKey });

        const prompt = `
        Eres un evaluador académico de postgrado extremadamente exigente, crítico y exhaustivo. 
        Tu tarea es calificar el siguiente trabajo de un estudiante siguiendo ESTRICTAMENTE la rúbrica proporcionada.

        CONTEXTO DEL TRABAJO:
        """
        ${truncatedText}
        """

        RÚBRICA DE EVALUACIÓN (JSON):
        ${JSON.stringify(rubric, null, 2)}

        INSTRUCCIONES CRÍTICAS:
        1. RIGOR EXTREMO: No regales puntos. Sé crítico. Si algo no está excepcional, no debe tener el puntaje máximo.
        2. ANÁLISIS PROFUNDO: Evalúa no solo la presencia de elementos, sino la calidad, coherencia, profundidad y viabilidad de la propuesta.
        3. FEEDBACK POR CRITERIO: Para CADA ítem de la rúbrica, debes proporcionar un comentario detallado (propiedad "comment") justificando el puntaje basado en evidencias del texto o ausencias notables. El feedback debe ser constructivo pero directo sobre las fallas.
        4. FEEDBACK GENERAL: Proporciona una síntesis global detallada y profunda (mínimo 3 párrafos) que resuma fortalezas, debilidades críticas y áreas de mejora estratégica.
        5. IDIOMA: Todo el feedback (específico y general) debe ser en ESPAÑOL.
        6. FORMATO DE SALIDA: Devuelve ÚNICAMENTE un objeto JSON con la siguiente estructura:
           {
             "grades": [
               { "id": "ID_DEL_ITEM", "score": N, "comment": "Feedback detallado..." }
             ],
             "generalFeedback": "Feedback global profundo..."
           }
        `;

        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content: "Eres un evaluador académico senior de alto nivel. Evalúas trabajos con rigor científico y profesional. Siempre respondes en formato JSON."
                },
                { role: "user", content: prompt }
            ],
            response_format: { type: "json_object" }
        });

        const responseContent = completion.choices[0].message.content;
        if (!responseContent) throw new Error("No response from AI.");

        const data = JSON.parse(responseContent);

        // Ensure the structure matches what the frontend expects
        // OpenAI might return { grades: ... } directly if prompted well, but let's be safe
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
