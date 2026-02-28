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
        // First, fetch projects with teams (Direct Relation covers both Code-Joiners and Accepted Applicants)
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

        const projectIds = projects.map(project => project.id);
        const studentTeamIds = projects
            .map(project => project.teams[0]?.id)
            .filter((teamId): teamId is string => !!teamId);

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

        const upcomingMentorships = await (prisma.mentorshipBooking as any).findMany({
            where: {
                students: { some: { id: user.id } },
                status: 'CONFIRMED',
                slot: { startTime: { gte: new Date() } }
            },
            include: {
                slot: { include: { teacher: true } },
                project: {
                    select: {
                        id: true,
                        title: true,
                        type: true
                    }
                }
            },
            orderBy: { slot: { startTime: 'asc' } },
            take: 16
        });

        const nextMentorship = upcomingMentorships[0] || null;

        const upcomingTasks = projectIds.length > 0
            ? await prisma.task.findMany({
                where: {
                    projectId: { in: projectIds },
                    dueDate: { not: null, gte: new Date() },
                    status: { not: 'DONE' },
                    OR: [
                        { isMandatory: true },
                        { assignees: { some: { id: user.id } } },
                        ...(studentTeamIds.length > 0 ? [{ teamId: { in: studentTeamIds } }] : [])
                    ]
                },
                include: {
                    project: {
                        select: {
                            id: true,
                            title: true,
                            type: true
                        }
                    },
                    assignment: {
                        select: {
                            id: true
                        }
                    }
                },
                orderBy: { dueDate: 'asc' },
                take: 24
            })
            : [];

        const latestCommunications = projectIds.length > 0
            ? await prisma.message.findMany({
                where: {
                    projectId: { in: projectIds },
                    OR: [
                        { authorId: user.id },
                        { recipients: { some: { id: user.id } } }
                    ]
                },
                include: {
                    author: {
                        select: {
                            id: true,
                            name: true,
                            avatarUrl: true,
                            role: true
                        }
                    },
                    project: {
                        select: {
                            id: true,
                            title: true,
                            type: true
                        }
                    }
                },
                orderBy: { createdAt: 'desc' },
                take: 8
            })
            : [];

        const [resourceSuggestions, learningObjectSuggestions] = await Promise.all([
            prisma.resource.findMany({
                where: {
                    OR: [
                        ...(projectIds.length > 0 ? [{ projectId: { in: projectIds } }] : []),
                        { projectId: null }
                    ]
                },
                include: {
                    category: { select: { name: true } },
                    project: { select: { id: true, title: true } },
                    interactions: {
                        where: { userId: user.id },
                        select: {
                            isCompleted: true,
                            isFavorite: true,
                            updatedAt: true
                        }
                    }
                },
                orderBy: { createdAt: 'desc' },
                take: 20
            }),
            projectIds.length > 0
                ? prisma.learningObject.findMany({
                    where: {
                        projects: { some: { id: { in: projectIds } } }
                    },
                    include: {
                        projects: { select: { id: true, title: true } },
                        items: {
                            select: {
                                id: true,
                                interactions: {
                                    where: { userId: user.id },
                                    select: { isCompleted: true }
                                }
                            }
                        }
                    },
                    orderBy: { updatedAt: 'desc' },
                    take: 12
                })
                : []
        ]);

        const suggestedLearningResources = [
            ...resourceSuggestions.map(resource => {
                const interaction = resource.interactions[0];
                const isProjectScoped = Boolean(resource.projectId);
                let score = 0;
                if (isProjectScoped) score += 30;
                if (!interaction?.isCompleted) score += 20;
                if (interaction?.isFavorite) score += 6;

                return {
                    id: resource.id,
                    kind: 'RESOURCE',
                    title: resource.title,
                    description: resource.description,
                    href: `/dashboard/learning/resource/${resource.id}`,
                    projectTitle: resource.project?.title || null,
                    tag: resource.category.name,
                    isCompleted: interaction?.isCompleted || false,
                    progress: null,
                    score
                };
            }),
            ...learningObjectSuggestions.map(learningObject => {
                const totalItems = learningObject.items.length;
                const completedItems = learningObject.items.filter(item => item.interactions.some(interaction => interaction.isCompleted)).length;
                const progress = totalItems > 0 ? completedItems / totalItems : 0;
                let score = 34;
                if (progress < 1) score += 18;
                if (progress === 0) score += 6;

                return {
                    id: learningObject.id,
                    kind: 'LEARNING_OBJECT',
                    title: learningObject.title,
                    description: learningObject.description,
                    href: `/dashboard/learning/object/${learningObject.id}`,
                    projectTitle: learningObject.projects[0]?.title || null,
                    tag: 'Objeto de aprendizaje',
                    isCompleted: progress >= 1,
                    progress,
                    score
                };
            })
        ]
            .sort((a, b) => b.score - a.score)
            .slice(0, 8);

        const recognitionAwards = await prisma.recognitionAward.findMany({
            where: {
                studentId: user.id
            },
            include: {
                recognitionConfig: {
                    select: {
                        id: true,
                        name: true,
                        description: true,
                        type: true
                    }
                },
                project: {
                    select: {
                        id: true,
                        title: true,
                        type: true
                    }
                }
            },
            orderBy: { awardedAt: 'desc' },
            take: 24
        });

        const calendarEvents = [
            ...upcomingTasks
                .filter(task => task.dueDate)
                .map(task => ({
                    id: `task-${task.id}`,
                    type: 'TASK',
                    title: task.title,
                    startsAt: (task.dueDate as Date).toISOString(),
                    projectTitle: task.project.title,
                    href: task.assignment
                        ? `/dashboard/student/assignments/${task.assignment.id}`
                        : `/dashboard/student/projects/${task.projectId}/kanban`,
                    priority: task.priority
                })),
            ...upcomingMentorships.map((booking: any) => ({
                id: `mentorship-${booking.id}`,
                type: 'MENTORSHIP',
                title: `Mentoría con ${booking.slot.teacher?.name || 'Tutor'}`,
                startsAt: booking.slot.startTime.toISOString(),
                projectTitle: booking.project?.title || null,
                href: '/dashboard/mentorship',
                priority: 'MEDIUM'
            }))
        ]
            .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime())
            .slice(0, 40);

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
                recognitionAwards={recognitionAwards}
                upcomingTasks={upcomingTasks}
                calendarEvents={calendarEvents}
                latestCommunications={latestCommunications}
                suggestedLearningResources={suggestedLearningResources}
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
