import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { subWeeks, format, parseISO } from 'date-fns';
import { BookingStatus } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check if user is professor or admin
        const currentUser = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { role: true }
        });

        if (currentUser?.role !== 'TEACHER' && currentUser?.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Get filter params
        const { searchParams } = new URL(request.url);
        const projectId = searchParams.get('projectId');
        const startDateParam = searchParams.get('startDate');
        const endDateParam = searchParams.get('endDate');

        const dateFilter = (startDateParam && endDateParam) ? {
            createdAt: {
                gte: parseISO(startDateParam),
                lte: parseISO(endDateParam)
            }
        } : {};

        // 1. Get professor's projects (or all projects if Admin)
        const isAdmin = currentUser?.role === 'ADMIN';
        const projectsWhere = isAdmin && !projectId
            ? {}
            : {
                teachers: { some: { id: session.user.id } },
                ...(projectId ? { id: projectId } : {})
            };

        const projectsData = await prisma.project.findMany({
            where: projectsWhere,
            include: {
                students: {
                    select: { id: true, name: true, email: true }
                },
                teachers: {
                    select: { name: true }
                },
                tasks: {
                    select: { status: true }
                },
                assignments: {
                    where: dateFilter,
                    include: {
                        submissions: {
                            select: {
                                id: true,
                                studentId: true,
                                grade: true,
                                createdAt: true
                            }
                        }
                    }
                }
            },
            take: 20, // Limit for dashboard at-a-glance
            orderBy: { updatedAt: 'desc' }
        });

        // Format projects for ProjectRiskCard
        const projects = projectsData.map(p => {
            const totalTasks = p.tasks.length;
            const completedTasks = p.tasks.filter(t => t.status === 'DONE').length;
            const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

            let risk: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
            if (progress < 20) risk = 'HIGH';
            else if (progress < 50) risk = 'MEDIUM';

            return {
                id: p.id,
                title: p.title,
                studentName: p.students.map(s => s.name || s.email.split('@')[0]).join(', '),
                teacherName: p.teachers.map(t => t.name).filter(Boolean).join(', '),
                progress,
                risk,
                type: p.type
            };
        });

        // 2. Fetch Recent Activity
        const recentActivityLogs = await prisma.activityLog.findMany({
            where: isAdmin ? {} : {
                OR: [
                    { userId: session.user.id },
                    {
                        user: {
                            projectsAsStudent: {
                                some: { teachers: { some: { id: session.user.id } } }
                            }
                        }
                    }
                ]
            },
            include: {
                user: {
                    select: { name: true, avatarUrl: true }
                }
            },
            orderBy: { createdAt: 'desc' },
            take: 10
        });

        const recentActivity = recentActivityLogs.map(log => ({
            id: log.id,
            user: {
                name: log.user?.name || 'Sistema',
                avatarUrl: log.user?.avatarUrl
            },
            action: log.action,
            description: log.description || '',
            createdAt: log.createdAt.toISOString()
        }));

        // 3. Calculate overview stats
        const allStudents = new Set<string>();
        let totalAssignments = 0;
        let totalSubmissions = 0;
        let pendingSubmissions = 0;

        projectsData.forEach(project => {
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

        // 4. Student Progress (Reuse some logic for backward compatibility if needed)
        const studentProgressMap = new Map<string, {
            studentId: string;
            studentName: string;
            studentEmail: string;
            totalAssignments: number;
            completedAssignments: number;
        }>();

        projectsData.forEach(project => {
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

        // 5. Grade Distribution
        const allGrades = projectsData.flatMap(project =>
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

        // 6. At-Risk Students
        const atRiskStudents = studentProgress
            .filter(student => student.progress < 50)
            .map(student => ({
                id: student.studentId,
                name: student.studentName,
                email: student.studentEmail,
                progress: student.progress,
                missedDeadlines: student.totalAssignments - student.completedAssignments,
                lastActivity: 'N/A'
            }))
            .sort((a, b) => a.progress - b.progress)
            .slice(0, 10);

        // 7. Learning Resources Metrics
        const learningResourcesData = await prisma.resource.findMany({
            where: {
                projectId: projectId || { in: projectsData.map(p => p.id) },
                ...dateFilter
            },
            include: {
                _count: {
                    select: { interactions: true }
                },
                project: {
                    select: { title: true }
                }
            }
        });

        const learningResources = {
            totalResources: learningResourcesData.length,
            byProject: projectsData.map(p => ({
                projectId: p.id,
                projectName: p.title,
                resourceCount: learningResourcesData.filter(r => r.projectId === p.id).length,
                accesses: learningResourcesData.filter(r => r.projectId === p.id)
                    .reduce((sum, r) => sum + r._count.interactions, 0)
            })).sort((a, b) => b.resourceCount - a.resourceCount)
        };

        // 8. Mentorship Metrics
        const mentorshipBookings = await prisma.mentorshipBooking.findMany({
            where: {
                slot: { teacherId: session.user.id },
                ...(projectId ? { projectId } : { projectId: { in: projectsData.map(p => p.id) } }),
                ...dateFilter
            },
            include: {
                students: { select: { id: true, name: true } }
            }
        });

        const mentorship = {
            totalSessions: mentorshipBookings.length,
            completedSessions: mentorshipBookings.filter(b => b.status === BookingStatus.CONFIRMED).length,
            upcomingSessions: mentorshipBookings.filter(b => b.status === BookingStatus.PENDING).length,
            byStudent: Array.from(
                mentorshipBookings.reduce((acc, b) => {
                    b.students.forEach(s => {
                        if (!acc.has(s.id)) {
                            acc.set(s.id, { id: s.id, name: s.name, count: 0 });
                        }
                        acc.get(s.id)!.count++;
                    });
                    return acc;
                }, new Map<string, { id: string; name: string | null; count: number }>()).values()
            ).sort((a, b) => b.count - a.count).slice(0, 5)
        };

        return NextResponse.json({
            projects,
            recentActivity,
            overview: {
                totalStudents: allStudents.size,
                avgProgress,
                pendingSubmissions,
                totalAssignments
            },
            studentProgress,
            gradeDistribution,
            atRiskStudents,
            learningResources,
            mentorship
        });

    } catch (error) {
        console.error('Professor analytics error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch analytics data' },
            { status: 500 }
        );
    }
}
