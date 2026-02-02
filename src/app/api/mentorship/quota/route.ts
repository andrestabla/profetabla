import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * GET /api/mentorship/quota
 * Returns the user's mentorship quota information
 */
export async function GET() {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = session.user.id;
        const role = session.user.role;

        // Teachers and admins have unlimited bookings
        if (role === 'TEACHER' || role === 'ADMIN') {
            return NextResponse.json({
                role,
                unlimited: true,
                currentBookings: 0,
                totalTasks: 0,
                availableSlots: Infinity
            });
        }

        // For students, calculate quota based on tasks
        // Find the student's active project
        const activeProject = await prisma.project.findFirst({
            where: {
                students: { some: { id: userId } },
                status: 'IN_PROGRESS'
            }
        });

        if (!activeProject) {
            return NextResponse.json({
                role,
                unlimited: false,
                currentBookings: 0,
                totalTasks: 0,
                availableSlots: 0,
                message: 'No tienes un proyecto activo'
            });
        }

        // Count tasks assigned to this student
        const totalTasks = await prisma.task.count({
            where: {
                projectId: activeProject.id,
                assignees: { some: { id: userId } }
            }
        });

        // Count existing bookings for this student in this project
        const currentBookings = await prisma.mentorshipBooking.count({
            where: {
                projectId: activeProject.id,
                students: { some: { id: userId } }
            }
        });

        const availableSlots = Math.max(0, totalTasks - currentBookings);

        return NextResponse.json({
            role,
            unlimited: false,
            currentBookings,
            totalTasks,
            availableSlots,
            projectId: activeProject.id,
            projectTitle: activeProject.title
        });
    } catch (error) {
        console.error('Error fetching mentorship quota:', error);
        return NextResponse.json(
            { error: 'Error al obtener información de cuota' },
            { status: 500 }
        );
    }
}
