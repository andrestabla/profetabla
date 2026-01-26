import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== 'TEACHER') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const applications = await prisma.projectApplication.findMany({
            where: {
                project: { teacherId: session.user.id },
                status: 'PENDING'
            },
            include: {
                project: true,
                student: true
            }
        });

        return NextResponse.json(applications);
    } catch (error) {
        return NextResponse.json({ error: 'Error fetching applications' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== 'TEACHER') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { applicationId, action } = await request.json(); // action: 'ACCEPT' | 'REJECT'

        const app = await prisma.projectApplication.findUnique({ where: { id: applicationId }, include: { project: true } });
        if (!app) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        // Update Application Status
        const status = action === 'ACCEPT' ? 'ACCEPTED' : 'REJECTED';
        await prisma.projectApplication.update({
            where: { id: applicationId },
            data: { status }
        });

        if (action === 'ACCEPT') {
            // Assign student to project and set to IN_PROGRESS
            await prisma.project.update({
                where: { id: app.projectId },
                data: {
                    studentId: app.studentId,
                    status: 'IN_PROGRESS'
                }
            });

            // Generate Project Workspace (Initial Tasks, Resources clone if needed)
            // For MVP, just assigning is enough to activate the workspace view for student.
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Error processing application' }, { status: 500 });
    }
}
