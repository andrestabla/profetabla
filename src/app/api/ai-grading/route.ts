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

        // 4. Call AI (OpenAI or Gemini)
        const openaiKey = process.env.OPENAI_API_KEY;
        const geminiKey = process.env.GEMINI_API_KEY;

        let responseContent = "";

        if (openaiKey) {
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
            2. COMENTARIOS OBLIGATORIOS: Para CADA criterio de la rúbrica, escribe un análisis profundo (propiedad "comment" o "feedback") de por qué tiene esa nota.
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
            responseContent = completion.choices[0].message.content || "";
        } else if (geminiKey) {
            console.log("[AI Grading] Using Google Gemini");
            const { GoogleGenerativeAI } = await import('@google/generative-ai');
            const genAI = new GoogleGenerativeAI(geminiKey);
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

            const prompt = `
            Eres un EVALUADOR ACADÉMICO DE POSTGRADO extremadamente exigente, crítico y exhaustivo. 
            Califica este trabajo con RIGOR EXTREMO.
    
            TRABAJO: ${truncatedText}
    
            RÚBRICA: ${JSON.stringify(rubric)}
    
            INSTRUCCIONES:
            - Sé muy crítico.
            - Feedback detallado por CADA ítem.
            - Feedback general profundo (3 párrafos).
            - Responde en ESPAÑOL.
            - Devuelve SOLO un JSON con: { "grades": [{ "rubricItemId": "ID", "score": number, "feedback": "texto" }], "generalFeedback": "texto" }
            `;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            responseContent = response.text();

            // Clean markdown if Gemini adds it
            if (responseContent.includes('```json')) {
                responseContent = responseContent.split('```json')[1].split('```')[0].trim();
            } else if (responseContent.includes('```')) {
                responseContent = responseContent.split('```')[1].split('```')[0].trim();
            }
        } else {
            return NextResponse.json({ success: false, error: "AI Configuration missing (Add OPENAI_API_KEY or GEMINI_API_KEY to environment)." }, { status: 500 });
        }

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
