export type AIGradeResponse = {
    success: boolean;
    grades?: { rubricItemId: string; score: number; feedback: string; }[];
    generalFeedback?: string;
    error?: string;
};

export type RubricItem = {
    id: string;
    criterion: string;
    maxPoints: number;
    description?: string;
    order?: number;
};
