import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { startOfMonth, subMonths, format } from 'date-fns';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check if user is admin
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { role: true }
        });

        if (user?.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // 1. Overview Stats
        const [totalUsers, totalStudents, totalProfessors, activeProjects, thisMonthStart] = await Promise.all([
            prisma.user.count(),
            prisma.user.count({ where: { role: 'STUDENT' } }),
            prisma.user.count({ where: { role: 'TEACHER' } }),
            prisma.project.count({ where: { status: { in: ['OPEN', 'IN_PROGRESS'] } } }),
            Promise.resolve(startOfMonth(new Date()))
        ]);

        const submissionsThisMonth = await prisma.submission.count({
            where: {
                createdAt: { gte: thisMonthStart }
            }
        });

        // Calculate average completion rate
        const allProjects = await prisma.project.findMany({
            select: {
                id: true,
                assignments: {
                    select: {
                        id: true,
                        submissions: {
                            select: { id: true }
                        }
                    }
                }
            }
        });

        let totalAssignments = 0;
        let totalSubmissions = 0;
        allProjects.forEach(project => {
            project.assignments.forEach(assignment => {
                totalAssignments++;
                if (assignment.submissions.length > 0) {
                    totalSubmissions++;
                }
            });
        });

        const avgCompletionRate = totalAssignments > 0
            ? Math.round((totalSubmissions / totalAssignments) * 100)
            : 0;

        // 2. User Growth (last 6 months)
        const sixMonthsAgo = subMonths(new Date(), 6);
        const userGrowthData = await prisma.$queryRaw<Array<{
            month: Date;
            role: string;
            count: bigint;
        }>>`
            SELECT 
                DATE_TRUNC('month', "createdAt") as month,
                role,
                COUNT(*)::bigint as count
            FROM "User"
            WHERE "createdAt" >= ${sixMonthsAgo}
            GROUP BY month, role
            ORDER BY month ASC
        `;

        // Transform user growth data
        const monthlyData: Record<string, { students: number; professors: number }> = {};
        userGrowthData.forEach(row => {
            const monthKey = format(new Date(row.month), 'MMM yyyy');
            if (!monthlyData[monthKey]) {
                monthlyData[monthKey] = { students: 0, professors: 0 };
            }
            if (row.role === 'STUDENT') {
                monthlyData[monthKey].students = Number(row.count);
            } else if (row.role === 'TEACHER') {
                monthlyData[monthKey].professors = Number(row.count);
            }
        });

        const userGrowth = Object.entries(monthlyData).map(([month, data]) => ({
            month,
            ...data
        }));

        // 3. Project Status Distribution
        const projectStatusData = await prisma.project.groupBy({
            by: ['status'],
            _count: true
        });

        const projectStatus = projectStatusData.map(item => ({
            status: item.status,
            count: item._count
        }));

        // 4. Submission Timeline (last 8 weeks)
        const eightWeeksAgo = subMonths(new Date(), 2);
        const submissionTimelineData = await prisma.$queryRaw<Array<{
            week: Date;
            count: bigint;
        }>>`
            SELECT 
                DATE_TRUNC('week', "createdAt") as week,
                COUNT(*)::bigint as count
            FROM "Submission"
            WHERE "createdAt" >= ${eightWeeksAgo}
            GROUP BY week
            ORDER BY week ASC
        `;

        const submissionTimeline = submissionTimelineData.map(row => ({
            week: format(new Date(row.week), 'MMM dd'),
            count: Number(row.count)
        }));

        // 5. Top Performers (students with highest completion rates)
        const students = await prisma.user.findMany({
            where: { role: 'STUDENT' },
            select: {
                id: true,
                name: true,
                email: true,
                projectsAsStudent: {
                    select: {
                        id: true,
                        assignments: {
                            select: {
                                id: true,
                                submissions: {
                                    select: {
                                        id: true,
                                        studentId: true
                                    }
                                }
                            }
                        }
                    }
                }
            },
            take: 100 // Limit for performance
        });

        const topPerformers = students.map(student => {
            let totalAssignments = 0;
            let completedAssignments = 0;

            student.projectsAsStudent.forEach(project => {
                project.assignments.forEach(assignment => {
                    totalAssignments++;
                    // Check if THIS student has submitted this assignment
                    const hasSubmission = assignment.submissions.some(
                        sub => sub.studentId === student.id
                    );
                    if (hasSubmission) {
                        completedAssignments++;
                    }
                });
            });

            const completionRate = totalAssignments > 0
                ? Math.round((completedAssignments / totalAssignments) * 100)
                : 0;

            return {
                id: student.id,
                name: student.name || 'Unknown',
                email: student.email,
                completionRate,
                projectsEnrolled: student.projectsAsStudent.length,
                totalAssignments,
                completedAssignments
            };
        })
            .filter(s => s.totalAssignments > 0) // Only students with assignments
            .sort((a, b) => b.completionRate - a.completionRate)
            .slice(0, 10); // Top 10

        return NextResponse.json({
            overview: {
                totalUsers,
                totalStudents,
                totalProfessors,
                activeProjects,
                submissionsThisMonth,
                avgCompletionRate
            },
            userGrowth,
            projectStatus,
            submissionTimeline,
            topPerformers
        });

    } catch (error) {
        console.error('Admin analytics error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch analytics data' },
            { status: 500 }
        );
    }
}
