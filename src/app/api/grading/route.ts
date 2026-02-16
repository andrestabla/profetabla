import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getR2FileUrl } from '@/lib/r2';
import { extractTextFromPdf } from '@/lib/pdf';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { RubricItem } from '@/types/grading';

export const maxDuration = 60; // Allow 60 seconds

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { submissionId, rubric } = body as { submissionId: string; rubric: RubricItem[] };

        if (!submissionId || !rubric) {
            return NextResponse.json({ success: false, error: "Missing submissionId or rubric" }, { status: 400 });
        }

        // 1. Fetch the submission to get the file URL/Key
        const submission = await prisma.submission.findUnique({
            where: { id: submissionId },
            include: { assignment: true }
        });

        if (!submission || !submission.fileUrl) {
            return NextResponse.json({ success: false, error: "Submission or file not found." }, { status: 404 });
        }

        // 2. Retrieve the file content
        let fileBuffer: Buffer | null = null;

        if (submission.fileUrl.startsWith('/api/file')) {
            // It's an internal proxy URL, extract key
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
            // Try to fetch assuming it's a public URL or valid URL
            const response = await fetch(submission.fileUrl);
            if (!response.ok) throw new Error("Failed to download file.");
            const arrayBuffer = await response.arrayBuffer();
            fileBuffer = Buffer.from(arrayBuffer);
        }

        if (!fileBuffer) {
            return NextResponse.json({ success: false, error: "Could not retrieve file content." }, { status: 500 });
        }

        // 3. Extract Text (assuming PDF for now)
        const textContent = await extractTextFromPdf(fileBuffer);

        // Truncate if too long
        const truncatedText = textContent.slice(0, 30000);

        // 4. Call Gemini
        const apiKey = process.env.GOOGLE_API_KEY;
        if (!apiKey) return NextResponse.json({ success: false, error: "AI Configuration missing (API Key)." }, { status: 500 });

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `
        You are an expert academic grader. Grade the following student submission based on the provided rubric.
        
        SUBMISSION CONTENT:
        """
        ${truncatedText}
        """

        RUBRIC:
        ${JSON.stringify(rubric, null, 2)}

        INSTRUCTIONS:
        1. Evaluate the submission against each rubric item.
        2. Assign a score (integer) between 0 and maxPoints for each item.
        3. Provide specific, constructive feedback (in Spanish) for each item, justifying the score.
        4. Provide a general feedback summary (in Spanish) for the entire work.
        5. Return ONLY a valid JSON object with the following structure:
        {
            "grades": [
                { "rubricItemId": "id_from_rubric", "score": number, "feedback": "string" }
            ],
            "generalFeedback": "string"
        }
        `;

        const result = await model.generateContent({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: "application/json" }
        });

        const responseText = result.response.text();
        const data = JSON.parse(responseText);

        return NextResponse.json({
            success: true,
            grades: data.grades,
            generalFeedback: data.generalFeedback
        });

    } catch (error: unknown) {
        console.error("AI Grading Error:", error);
        const err = error as Error;
        return NextResponse.json({ success: false, error: err.message || "Failed to generate grades." }, { status: 500 });
    }
}
