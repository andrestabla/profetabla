'use server';

import { prisma } from '@/lib/prisma';
import { getR2FileUrl } from '@/lib/r2';
import { extractTextFromPdf } from '@/lib/pdf'; // This must be a server-only utility
import { GoogleGenerativeAI } from '@google/generative-ai';
import { type AIGradeResponse, type RubricItem } from '@/types/grading';

export async function generateGradeWithAI(submissionId: string, rubric: RubricItem[]): Promise<AIGradeResponse> {
    try {
        // 1. Fetch the submission to get the file URL/Key
        const submission = await prisma.submission.findUnique({
            where: { id: submissionId },
            include: { assignment: true }
        });

        if (!submission || !submission.fileUrl) {
            return { success: false, error: "Submission or file not found." };
        }

        // 2. Retrieve the file content
        let fileBuffer: Buffer | null = null;

        if (submission.fileUrl.startsWith('/api/file')) {
            // It's an internal proxy URL, extract key
            const urlObj = new URL(submission.fileUrl, 'http://localhost'); // Dummy base for parsing
            const key = urlObj.searchParams.get('key');
            if (key) {
                // Fetch from R2 using the key
                // We need to fetch the actual file content, not just a signed URL.
                // So implementing a direct download helper here or using fetch on the signed URL.
                const downloadUrl = await getR2FileUrl(key);
                const response = await fetch(downloadUrl);
                if (!response.ok) throw new Error("Failed to download file from storage.");
                const arrayBuffer = await response.arrayBuffer();
                fileBuffer = Buffer.from(arrayBuffer);
            }
        } else if (submission.fileType === 'URL') {
            return { success: false, error: "AI Grading for external URLs is not supported yet." };
        } else {
            // Try to fetch assuming it's a public URL or valid URL
            const response = await fetch(submission.fileUrl);
            if (!response.ok) throw new Error("Failed to download file.");
            const arrayBuffer = await response.arrayBuffer();
            fileBuffer = Buffer.from(arrayBuffer);
        }

        if (!fileBuffer) {
            return { success: false, error: "Could not retrieve file content." };
        }

        // 3. Extract Text (assuming PDF for now)
        // TODO: Handle other file types or pass image to Gemini Vision if applicable
        const textContent = await extractTextFromPdf(fileBuffer);

        // Truncate if too long (Gemini has large context but good to be safe/optimal)
        const truncatedText = textContent.slice(0, 30000);

        // 4. Call Gemini
        const apiKey = process.env.GOOGLE_API_KEY;
        if (!apiKey) return { success: false, error: "AI Configuration missing (API Key)." };

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

        return {
            success: true,
            grades: data.grades,
            generalFeedback: data.generalFeedback
        };

    } catch (error: unknown) {
        console.error("AI Grading Error:", error);
        const err = error as Error;
        return { success: false, error: err.message || "Failed to generate grades." };
    }
}
