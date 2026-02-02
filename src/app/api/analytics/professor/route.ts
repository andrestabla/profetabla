import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { startOfWeek, subWeeks, format } from 'date-fns';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check if user is professor or admin
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { role: true }
        });

        if (user?.role !== 'TEACHER' && user?.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Get optional projectId filter from query params
        const { searchParams } = new URL(request.url);
        const projectId = searchParams.get('projectId');

        // 1. Get professor's projects
        const projectsWhere = {
            teachers: { some: { id: session.user.id } },
            ...(projectId ? { id: projectId } : {})
        };

        const projects = await prisma.project.findMany({
            where: projectsWhere,
            include: {
                students: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                },
                teams: {
                    include: {
                        members: {
                            select: {
                                id: true,
                                name: true
                            }
                        }
                    }
                },
                assignments: {
                    include: {
                        submissions: {
                            select: {
                                id: true,
                                studentId: true,
                                teamId: true,
                                grade: true,
                                createdAt: true
                            }
                        }
                    }
                }
            }
        });

        // 2. Calculate overview stats
        const allStudents = new Set<string>();
        let totalAssignments = 0;
        let totalSubmissions = 0;
        let pendingSubmissions = 0;
        const upcomingDeadlines: Date[] = [];

        projects.forEach(project => {
            project.students.forEach(student => allStudents.add(student.id));

            project.assignments.forEach(assignment => {
                totalAssignments++;
                const hasSubmissions = assignment.submissions.length > 0;
                if (hasSubmissions) {
                    totalSubmissions++;
                } else {
                    pendingSubmissions++;
                }
            });
        });

        const avgProgress = totalAssignments > 0
            ? Math.round((totalSubmissions / totalAssignments) * 100)
            : 0;

        // 3. Student Progress (per student across all projects)
        const studentProgressMap = new Map<string, {
            studentId: string;
            studentName: string;
            studentEmail: string;
            totalAssignments: number;
            completedAssignments: number;
        }>();

        projects.forEach(project => {
            project.students.forEach(student => {
                if (!studentProgressMap.has(student.id)) {
                    studentProgressMap.set(student.id, {
                        studentId: student.id,
                        studentName: student.name || 'Unknown',
                        studentEmail: student.email,
                        totalAssignments: 0,
                        completedAssignments: 0
                    });
                }

                const studentData = studentProgressMap.get(student.id)!;

                project.assignments.forEach(assignment => {
                    studentData.totalAssignments++;
                    const hasSubmission = assignment.submissions.some(
                        sub => sub.studentId === student.id
                    );
                    if (hasSubmission) {
                        studentData.completedAssignments++;
                    }
                });
            });
        });

        const studentProgress = Array.from(studentProgressMap.values()).map(student => ({
            ...student,
            progress: student.totalAssignments > 0
                ? Math.round((student.completedAssignments / student.totalAssignments) * 100)
                : 0
        })).sort((a, b) => b.progress - a.progress);

        // 4. Submission Rates (last 8 weeks)
        const eightWeeksAgo = subWeeks(new Date(), 8);
        const submissionRatesData = await prisma.$queryRaw<Array<{
            week: Date;
            count: bigint;
        }>>`
            SELECT 
                DATE_TRUNC('week', s."createdAt") as week,
                COUNT(*)::bigint as count
            FROM "Submission" s
            INNER JOIN "Assignment" a ON s."assignmentId" = a.id
            INNER JOIN "Project" p ON a."projectId" = p.id
            INNER JOIN "_ProjectToUser" pu ON p.id = pu."A"
            WHERE pu."B" = ${session.user.id}
                AND s."createdAt" >= ${eightWeeksAgo}
            GROUP BY week
            ORDER BY week ASC
        `;

        const submissionRates = submissionRatesData.map(row => ({
            date: format(new Date(row.week), 'MMM dd'),
            submitted: Number(row.count),
            total: totalAssignments // Simplified - could calculate per week
        }));

        // 5. Grade Distribution
        const allGrades = projects.flatMap(project =>
            project.assignments.flatMap(assignment =>
                assignment.submissions
                    .filter(sub => sub.grade !== null)
                    .map(sub => sub.grade!)
            )
        );

        const gradeRanges = [
            { range: '0-59', min: 0, max: 59, count: 0 },
            { range: '60-69', min: 60, max: 69, count: 0 },
            { range: '70-79', min: 70, max: 79, count: 0 },
            { range: '80-89', min: 80, max: 89, count: 0 },
            { range: '90-100', min: 90, max: 100, count: 0 }
        ];

        allGrades.forEach(grade => {
            const range = gradeRanges.find(r => grade >= r.min && grade <= r.max);
            if (range) range.count++;
        });

        const gradeDistribution = gradeRanges.map(({ range, count }) => ({
            range,
            count
        }));

        // 6. At-Risk Students (low progress or missing deadlines)
        const atRiskStudents = studentProgress
            .filter(student => student.progress < 50 || student.completedAssignments === 0)
            .map(student => {
                const missedDeadlines = student.totalAssignments - student.completedAssignments;

                return {
                    id: student.studentId,
                    name: student.studentName,
                    email: student.studentEmail,
                    progress: student.progress,
                    missedDeadlines,
                    lastActivity: 'N/A' // Could fetch from submissions
                };
            })
            .sort((a, b) => a.progress - b.progress)
            .slice(0, 10); // Top 10 at-risk

        return NextResponse.json({
            overview: {
                totalStudents: allStudents.size,
                avgProgress,
                pendingSubmissions,
                upcomingDeadlines: upcomingDeadlines.length
            },
            studentProgress,
            submissionRates,
            gradeDistribution,
            atRiskStudents
        });

    } catch (error) {
        console.error('Professor analytics error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch analytics data' },
            { status: 500 }
        );
    }
}
