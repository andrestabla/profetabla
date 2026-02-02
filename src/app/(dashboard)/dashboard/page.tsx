import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { StudentDashboard } from '@/components/dashboard/StudentDashboard';
import { TeacherDashboard } from '@/components/dashboard/TeacherDashboard';
import { AdminDashboard } from '@/components/dashboard/AdminDashboard';
import { startOfDay } from 'date-fns';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return <div className="p-6">Inicia sesión para ver tu dashboard.</div>;

    const user = await prisma.user.findUnique({
        where: { id: session.user.id }
    });

    if (!user) return null;

    // 1. STUDENT DASHBOARD
    if (user.role === 'STUDENT') {
        // First, fetch projects with teams
        const projects = await prisma.project.findMany({
            where: {
                students: { some: { id: user.id } },
                status: { in: ['IN_PROGRESS', 'OPEN'] }
            },
            include: {
                teachers: true,
                students: true,
                teams: {
                    where: { members: { some: { id: user.id } } },
                    select: { id: true }
                }
            },
        });

        // Then, fetch assignments with submissions for each project
        const projectsWithAssignments = await Promise.all(
            projects.map(async (project) => {
                const studentTeam = project.teams[0];

                // Fetch assignments for this project
                const assignments = await prisma.assignment.findMany({
                    where: { projectId: project.id },
                    include: {
                        submissions: {
                            where: studentTeam
                                ? { teamId: studentTeam.id }
                                : { studentId: user.id }
                        }
                    }
                });

                return { ...project, assignments };
            })
        );

        /* eslint-disable @typescript-eslint/no-explicit-any */
        const citations = await (prisma.mentorshipBooking as any).findMany({
            where: {
                students: { some: { id: user.id } },
                initiatedBy: 'TEACHER', // Priority notice
                status: 'CONFIRMED',
                slot: { startTime: { gte: new Date() } }
            },
            include: { slot: { include: { teacher: true } } },
            orderBy: { slot: { startTime: 'asc' } },
            take: 1
        });

        const nextMentorship = await (prisma.mentorshipBooking as any).findFirst({
            where: {
                students: { some: { id: user.id } },
                status: 'CONFIRMED',
                slot: { startTime: { gte: new Date() } }
            },
            include: { slot: { include: { teacher: true } } },
            orderBy: { slot: { startTime: 'asc' } }
        });

        let citation = null;
        if (citations.length > 0) {
            const cit = citations[0] as any;
            citation = {
                teacherName: cit.slot.teacher.name || 'Tutor',
                date: cit.slot.startTime.toLocaleDateString(),
                time: cit.slot.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                meetingUrl: cit.slot.meetingUrl || '#'
            };
        }
        /* eslint-enable @typescript-eslint/no-explicit-any */

        return (
            <StudentDashboard
                user={user}
                projects={projectsWithAssignments}
                citation={citation}
                nextMentorship={nextMentorship}
            />
        );
    }

    // 2. TEACHER DASHBOARD
    if (user.role === 'TEACHER') {
        const today = startOfDay(new Date());

        // KPIs
        const blockedTasks = await prisma.task.count({
            where: {
                project: { teachers: { some: { id: user.id } } },
                priority: 'HIGH',
                status: { not: 'DONE' }
            }
        });
        const pendingApplications = await prisma.projectApplication.count({
            where: {
                project: { teachers: { some: { id: user.id } } },
                status: 'PENDING'
            }
        });
        const pendingSubmissions = await prisma.submission.count({
            where: {
                assignment: { project: { teachers: { some: { id: user.id } } } },
                grade: null
            }
        });
        const mentorshipsTodayCount = await prisma.mentorshipBooking.count({
            // Mentorship slots ARE owned by single teacher, so this is fine.
            where: { slot: { teacherId: user.id, startTime: { gte: today } }, status: 'CONFIRMED' }
        });

        // Detail Actions
        const applications = await prisma.projectApplication.findMany({
            where: {
                project: { teachers: { some: { id: user.id } } },
                status: 'PENDING'
            },
            include: { student: true, project: true },
            take: 3
        });
        const submissions = await prisma.submission.findMany({
            where: {
                assignment: { project: { teachers: { some: { id: user.id } } } },
                grade: null
            },
            include: { student: true, assignment: true },
            take: 3
        });
        const tasksToApprove = await prisma.task.findMany({
            where: {
                project: { teachers: { some: { id: user.id } } },
                status: 'DONE',
                isApproved: false
            },
            take: 3
        });

        const todaySlots = await prisma.mentorshipSlot.findMany({
            where: { teacherId: user.id, startTime: { gte: today } },
            orderBy: { startTime: 'asc' },
            take: 4
        });

        return (
            <TeacherDashboard
                user={user}
                stats={{
                    blockedTasks,
                    pendingReviews: pendingApplications + pendingSubmissions,
                    mentorshipsToday: mentorshipsTodayCount
                }}
                pendingActions={{ applications, submissions, tasksToApprove }}
                todaySlots={todaySlots}
            />
        );
    }

    // 3. ADMIN DASHBOARD
    if (user.role === 'ADMIN') {
        const activeUsers = await prisma.user.count({ where: { isActive: true } });
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        const newProjectsThisWeek = await prisma.project.count({ where: { createdAt: { gte: weekAgo } } });

        const recentLogs = await prisma.activityLog.findMany({
            orderBy: { createdAt: 'desc' },
            take: 5
        });

        const recentUsers = await prisma.user.findMany({
            orderBy: { createdAt: 'desc' },
            take: 5
        });

        return (
            <AdminDashboard
                stats={{
                    activeUsers,
                    newProjectsThisWeek,
                    systemHealth: 'HEALTHY'
                }}
                recentLogs={recentLogs}
                recentUsers={recentUsers}
            />
        );
    }

    return null;
}

