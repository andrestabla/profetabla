import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        // MVP: Fetch for first teacher found
        const teacher = await prisma.user.findFirst({ where: { role: 'TEACHER' } });
        // Real app: const session = await getServerSession(); const teacherId = session.user.id;

        if (!teacher) {
            return NextResponse.json({ projects: [], recentActivity: [] });
        }

        // 1. Get Projects assigned to this teacher (via student relation? Schema doesn't have direct teacher-project relation yet besides mentorship)
        // Wait, Schema: Project -> student -> User. Mentor logic is via MentorshipSlot.
        // For MVP, enable the teacher to see ALL projects or just projects of students they have mentorships with?
        // Let's assume Teacher sees ALL projects for now to be simple.

        const projects = await prisma.project.findMany({
            include: {
                student: true,
                tasks: true
            }
        });

        // 2. Calculate Risk
        const projectsWithRisk = projects.map(p => {
            const totalTasks = p.tasks.length;
            const completedTasks = p.tasks.filter(t => t.status === 'DONE').length;
            const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

            // Risk Logic: If progress < 40% and created > 2 days ago (arbitrary demo logic)
            // Or just random risk for demo if new.
            // Let's use: Risk if progress < 30%
            let risk = 'LOW';
            if (progress < 30) risk = 'HIGH';
            else if (progress < 70) risk = 'MEDIUM';

            return {
                id: p.id,
                title: p.title,
                studentName: p.student.name,
                progress,
                risk
            };
        });

        // 3. Recent Activity (Global for now)
        const activity = await prisma.activityLog.findMany({
            take: 10,
            orderBy: { createdAt: 'desc' },
            include: { user: true }
        });

        return NextResponse.json({
            projects: projectsWithRisk,
            recentActivity: activity
        });
    } catch (error) {
        return NextResponse.json({ error: 'Error fetching analytics' }, { status: 500 });
    }
}
