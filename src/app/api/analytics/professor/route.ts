import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Ensure user is teacher (or admin)
        if (session.user.role !== 'TEACHER' && session.user.role !== 'ADMIN') {
            // Return empty or error. For MVP demo, lets allow access or return empty.
            // return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Fetch projects. In real app, filter by teacher assignments.
        const projects = await prisma.project.findMany({
            include: {
                student: true,
                tasks: true
            }
        });

        // Calculate Risk
        const projectsWithRisk = projects.map(p => {
            const totalTasks = p.tasks.length;
            const completedTasks = p.tasks.filter(t => t.status === 'DONE').length;
            const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

            let risk = 'LOW';
            if (progress < 30) risk = 'HIGH';
            else if (progress < 70) risk = 'MEDIUM';

            return {
                id: p.id,
                title: p.title,
                studentName: p.student?.name || 'Sin Asignar',
                progress,
                risk
            };
        });

        // Recent Activity
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
