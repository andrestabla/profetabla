import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { startOfMonth, subMonths, format, parseISO } from 'date-fns';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check if user is admin
        const currentUser = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { role: true }
        });

        if (currentUser?.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Get filter params
        const { searchParams } = new URL(request.url);
        const startDateParam = searchParams.get('startDate');
        const endDateParam = searchParams.get('endDate');

        const dateFilter = (startDateParam && endDateParam) ? {
            createdAt: {
                gte: parseISO(startDateParam),
                lte: parseISO(endDateParam)
            }
        } : {};

        // 1. Overview Stats (some stats are lifetime, others filtered)
        const [totalUsers, totalStudents, totalTeachers, activeProjects, filteredSubmissions, thisMonthStart] = await Promise.all([
            prisma.user.count(),
            prisma.user.count({ where: { role: 'STUDENT' } }),
            prisma.user.count({ where: { role: 'TEACHER' } }),
            prisma.project.count({ where: { status: { in: ['OPEN', 'IN_PROGRESS'] } } }),
            prisma.submission.count({ where: dateFilter }),
            Promise.resolve(startOfMonth(new Date()))
        ]);

        const submissionsThisMonth = await prisma.submission.count({
            where: {
                createdAt: { gte: thisMonthStart }
            }
        });

        // Calculate average completion rate (lifetime)
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
        let totalSubmissionsCount = 0;
        allProjects.forEach(project => {
            project.assignments.forEach(assignment => {
                totalAssignments++;
                if (assignment.submissions.length > 0) {
                    totalSubmissionsCount++;
                }
            });
        });

        const avgCompletionRate = totalAssignments > 0
            ? Math.round((totalSubmissionsCount / totalAssignments) * 100)
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

        // 4. Submission Timeline (filtered or last 8 weeks)
        let submissionTimeline;
        if (startDateParam && endDateParam) {
            const timelineData = await prisma.$queryRaw<Array<{
                day: Date;
                count: bigint;
            }>>`
                SELECT 
                    DATE_TRUNC('day', "createdAt") as day,
                    COUNT(*)::bigint as count
                FROM "Submission"
                WHERE "createdAt" >= ${parseISO(startDateParam)} AND "createdAt" <= ${parseISO(endDateParam)}
                GROUP BY day
                ORDER BY day ASC
            `;
            submissionTimeline = timelineData.map(row => ({
                week: format(new Date(row.day), 'MMM dd'),
                count: Number(row.count)
            }));
        } else {
            const eightWeeksAgo = subMonths(new Date(), 2);
            const timelineData = await prisma.$queryRaw<Array<{
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
            submissionTimeline = timelineData.map(row => ({
                week: format(new Date(row.week), 'MMM dd'),
                count: Number(row.count)
            }));
        }

        // 5. Top Performers
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
            take: 50
        });

        const topPerformers = students.map(student => {
            let totalAsgInput = 0;
            let completedAsgInput = 0;

            student.projectsAsStudent.forEach(project => {
                project.assignments.forEach(assignment => {
                    totalAsgInput++;
                    if (assignment.submissions.some(sub => sub.studentId === student.id)) {
                        completedAsgInput++;
                    }
                });
            });

            const completionRate = totalAsgInput > 0
                ? Math.round((completedAsgInput / totalAsgInput) * 100)
                : 0;

            return {
                id: student.id,
                name: student.name || 'Unknown',
                email: student.email,
                completionRate,
                projectsEnrolled: student.projectsAsStudent.length,
                totalAssignments: totalAsgInput,
                completedAssignments: completedAsgInput
            };
        })
            .filter(s => s.totalAssignments > 0)
            .sort((a, b) => b.completionRate - a.completionRate)
            .slice(0, 10);

        // 6. Learning Resources Analytics
        const [totalResources, resourcesByType, topAccessedResources] = await Promise.all([
            prisma.resource.count({ where: dateFilter }),
            prisma.resource.groupBy({
                by: ['type'],
                where: dateFilter,
                _count: true
            }),
            prisma.resource.findMany({
                where: dateFilter,
                include: {
                    _count: {
                        select: { interactions: true }
                    },
                    project: {
                        select: { title: true }
                    }
                },
                take: 5
            })
        ]);

        const learningResources = {
            totalResources,
            byType: resourcesByType.map(item => ({
                type: item.type,
                count: item._count
            })),
            topAccessed: topAccessedResources.map(r => ({
                id: r.id,
                title: r.title,
                type: r.type,
                accessCount: r._count.interactions,
                projectName: r.project?.title || 'General'
            })).sort((a, b) => b.accessCount - a.accessCount)
        };

        // 7. Mentorship Analytics
        const [totalMentorships, mentorshipsByStatus, topMentors] = await Promise.all([
            prisma.mentorshipBooking.count({ where: dateFilter }),
            prisma.mentorshipBooking.groupBy({
                by: ['status'],
                where: dateFilter,
                _count: true
            }),
            prisma.user.findMany({
                where: { role: { in: ['TEACHER', 'ADMIN'] } },
                select: {
                    id: true,
                    name: true,
                    mentorshipSlots: {
                        where: {
                            booking: {
                                is: {
                                    ...(startDateParam && endDateParam ? {
                                        createdAt: {
                                            gte: parseISO(startDateParam),
                                            lte: parseISO(endDateParam)
                                        }
                                    } : {})
                                }
                            }
                        },
                        select: { id: true }
                    }
                },
                take: 10
            })
        ]);

        const mentorship = {
            totalSessions: totalMentorships,
            byStatus: mentorshipsByStatus.map(item => ({
                status: item.status,
                count: item._count
            })),
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            topMentors: (topMentors as any[]).map(m => ({
                id: m.id,
                name: m.name || 'Unknown',
                sessionCount: m.mentorshipSlots.length
            })).sort((a, b) => b.sessionCount - a.sessionCount).slice(0, 5)
        };

        return NextResponse.json({
            overview: {
                totalUsers,
                totalStudents,
                totalTeachers,
                activeProjects,
                submissionsThisPeriod: filteredSubmissions,
                submissionsThisMonth,
                avgCompletionRate
            },
            userGrowth,
            projectStatus,
            submissionTimeline,
            topPerformers,
            learningResources,
            mentorship
        });

    } catch (error) {
        console.error('Admin analytics error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch analytics data' },
            { status: 500 }
        );
    }
}
