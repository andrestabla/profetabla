'use server';

export type AIGradeResponse = {
    success: boolean;
    grades?: { rubricItemId: string; score: number; feedback: string; }[];
    generalFeedback?: string;
    error?: string;
};

// Mock function for build testing
 
export async function generateGradeWithAI(submissionId: string, rubric: unknown[]): Promise<AIGradeResponse> {
    console.log("Mock AI Grading", submissionId, Array.isArray(rubric) ? rubric.length : 0);
    return { success: true, generalFeedback: "Mock Grading" };
}
