/**
 * Utility functions for quiz scoring and management.
 */

export interface QuizQuestion {
    id: string;
    type: 'MULTIPLE_CHOICE' | 'TEXT' | 'RATING';
    prompt: string;
    options?: string[];
    correctAnswer?: string;
    points?: number;
    maxRating?: number;
    ratingType?: 'NUMERIC' | 'SATISFACTION' | 'AGREEMENT' | 'PERFORMANCE' | 'FREQUENCY' | 'INTENSITY';
}

export const RATING_TYPES_CONFIG = {
    NUMERIC: { label: 'Numérico', minLabel: 'Bajo', maxLabel: 'Alto' },
    SATISFACTION: { label: 'Satisfacción', minLabel: 'Muy insatisfecho', maxLabel: 'Muy satisfecho' },
    AGREEMENT: { label: 'Acuerdo', minLabel: 'Totalmente en desacuerdo', maxLabel: 'Totalmente de acuerdo' },
    PERFORMANCE: { label: 'Desempeño', minLabel: 'Muy bajo', maxLabel: 'Muy alto' },
    FREQUENCY: { label: 'Frecuencia', minLabel: 'Nunca', maxLabel: 'Siempre' },
    INTENSITY: { label: 'Intensidad', minLabel: 'Nula', maxLabel: 'Muy alta' }
};

export interface QuizData {
    questions: QuizQuestion[];
    gradingMethod?: 'AUTO' | 'MANUAL';
}

/**
 * Calculates the score for a single question based on the student's answer.
 */
export function calculateQuestionScore(question: QuizQuestion, answer: string | undefined): number {
    if (!answer) return 0;
    const points = question.points || 1;

    if (question.type === 'RATING') {
        const val = parseInt(answer);
        if (!isNaN(val)) {
            const maxRating = question.maxRating || 5;
            return (val / maxRating) * points;
        }
    } else if (question.type === 'MULTIPLE_CHOICE') {
        if (question.correctAnswer && answer === question.correctAnswer) {
            return points;
        }
    }

    // TEXT questions or incorrect MC questions return 0
    return 0;
}

/**
 * Calculates the total score for a quiz based on all questions and answers.
 */
export function calculateTotalQuizScore(questions: QuizQuestion[], answers: Record<string, string>): number {
    if (!questions) return 0;

    let total = 0;
    questions.forEach((q) => {
        total += calculateQuestionScore(q, answers[q.id]);
    });

    // Round to 1 decimal place
    return Math.round(total * 10) / 10;
}

/**
 * Calculates the maximum possible score for a quiz.
 */
export function calculateMaxQuizScore(questions: QuizQuestion[]): number {
    if (!questions) return 0;
    return questions.reduce((acc, q) => acc + (q.points || 1), 0);
}
