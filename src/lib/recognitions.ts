import 'server-only';

import { Prisma, RecognitionConfig } from '@prisma/client';
import { prisma } from '@/lib/prisma';

type DbClient = typeof prisma | Prisma.TransactionClient;

export type RecognitionMetrics = {
    totalAssignments: number;
    submittedAssignments: number;
    gradedAssignments: number;
    averageGrade: number | null;
};

function hasAnyCondition(config: RecognitionConfig): boolean {
    return Boolean(
        config.requireAllAssignments ||
        config.requireAllGradedAssignments ||
        config.minCompletedAssignments !== null ||
        config.minGradedAssignments !== null ||
        config.minAverageGrade !== null
    );
}

function isRecognitionEarned(config: RecognitionConfig, metrics: RecognitionMetrics): boolean {
    if (!config.isActive || !hasAnyCondition(config)) return false;
    if (metrics.totalAssignments === 0) return false;

    if (config.requireAllAssignments && metrics.totalAssignments > 0 && metrics.submittedAssignments < metrics.totalAssignments) {
        return false;
    }

    if (config.requireAllGradedAssignments && metrics.totalAssignments > 0 && metrics.gradedAssignments < metrics.totalAssignments) {
        return false;
    }

    if (config.minCompletedAssignments !== null && metrics.submittedAssignments < config.minCompletedAssignments) {
        return false;
    }

    if (config.minGradedAssignments !== null && metrics.gradedAssignments < config.minGradedAssignments) {
        return false;
    }

    if (config.minAverageGrade !== null) {
        if (metrics.averageGrade === null || metrics.averageGrade < config.minAverageGrade) {
            return false;
        }
    }

    return true;
}

export async function getRecognitionMetricsForStudent(projectId: string, studentId: string, db: DbClient = prisma): Promise<RecognitionMetrics> {
    const [totalAssignments, submissions] = await Promise.all([
        db.assignment.count({ where: { projectId } }),
        db.submission.findMany({
            where: {
                studentId,
                assignment: {
                    projectId
                }
            },
            select: {
                id: true,
                assignmentId: true,
                grade: true,
                updatedAt: true
            },
            orderBy: [
                { assignmentId: 'asc' },
                { updatedAt: 'desc' }
            ]
        })
    ]);

    const latestByAssignment = new Map<string, { id: string; grade: number | null }>();
    for (const submission of submissions) {
        if (!latestByAssignment.has(submission.assignmentId)) {
            latestByAssignment.set(submission.assignmentId, {
                id: submission.id,
                grade: submission.grade
            });
        }
    }

    const latestSubmissions = Array.from(latestByAssignment.values());
    const gradedSubmissions = latestSubmissions.filter((s) => typeof s.grade === 'number');
    const averageGrade = gradedSubmissions.length > 0
        ? gradedSubmissions.reduce((acc, current) => acc + (current.grade ?? 0), 0) / gradedSubmissions.length
        : null;

    return {
        totalAssignments,
        submittedAssignments: latestSubmissions.length,
        gradedAssignments: gradedSubmissions.length,
        averageGrade
    };
}

export async function evaluateAndGrantRecognitionsForStudent(
    projectId: string,
    studentId: string,
    opts?: { triggerSubmissionId?: string | null; db?: DbClient }
) {
    const db = opts?.db ?? prisma;

    const [metrics, configs] = await Promise.all([
        getRecognitionMetricsForStudent(projectId, studentId, db),
        db.recognitionConfig.findMany({
            where: {
                projectId,
                isActive: true,
                autoAward: true
            },
            include: {
                awards: {
                    where: { studentId },
                    select: { id: true }
                }
            },
            orderBy: { createdAt: 'asc' }
        })
    ]);

    const awardedConfigIds: string[] = [];

    for (const config of configs) {
        if (config.awards.length > 0) continue;
        if (!isRecognitionEarned(config, metrics)) continue;

        const award = await db.recognitionAward.upsert({
            where: {
                recognitionConfigId_studentId: {
                    recognitionConfigId: config.id,
                    studentId
                }
            },
            create: {
                recognitionConfigId: config.id,
                projectId,
                studentId,
                triggerSubmissionId: opts?.triggerSubmissionId || null,
                snapshot: {
                    metrics,
                    recognizedAt: new Date().toISOString(),
                    conditions: {
                        requireAllAssignments: config.requireAllAssignments,
                        requireAllGradedAssignments: config.requireAllGradedAssignments,
                        minCompletedAssignments: config.minCompletedAssignments,
                        minGradedAssignments: config.minGradedAssignments,
                        minAverageGrade: config.minAverageGrade
                    }
                }
            },
            update: {}
        });

        awardedConfigIds.push(award.recognitionConfigId);
    }

    return {
        metrics,
        awardedConfigIds
    };
}

export async function recomputeRecognitionsForProject(projectId: string, db: DbClient = prisma) {
    const project = await db.project.findUnique({
        where: { id: projectId },
        select: {
            id: true,
            students: {
                select: { id: true }
            }
        }
    });

    if (!project) {
        throw new Error('Proyecto no encontrado');
    }

    let createdAwards = 0;

    for (const student of project.students) {
        const result = await evaluateAndGrantRecognitionsForStudent(projectId, student.id, { db });
        createdAwards += result.awardedConfigIds.length;
    }

    return {
        studentCount: project.students.length,
        createdAwards
    };
}
