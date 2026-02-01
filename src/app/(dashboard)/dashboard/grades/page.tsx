import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import StudentGradesClient from './StudentGradesClient';
import ProfessorGradesClient from './ProfessorGradesClient';

export const dynamic = 'force-dynamic';

export default async function GradesPage() {
    const session = await getServerSession(authOptions);
    if (!session?.user) return notFound();

    const role = session.user.role;
    const userId = session.user.id;

    if (role === 'STUDENT') {
        const projects = await prisma.project.findMany({
            where: {
                students: { some: { id: userId } }
            },
            include: {
                assignments: {
                    include: {
                        submissions: {
                            where: { studentId: userId },
                            orderBy: { createdAt: 'desc' }
                        }
                    }
                }
            }
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return <StudentGradesClient projects={projects as any[]} />;
    }

    if (role === 'TEACHER' || role === 'ADMIN') {
        const projects = await prisma.project.findMany({
            where: role === 'ADMIN' ? {} : {
                teachers: { some: { id: userId } }
            },
            include: {
                students: {
                    select: { id: true, name: true, email: true, avatarUrl: true }
                },
                assignments: {
                    include: {
                        submissions: {
                            include: {
                                student: {
                                    select: { id: true, name: true, email: true, avatarUrl: true }
                                }
                            }
                        }
                    }
                }
            }
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return <ProfessorGradesClient projects={projects as any[]} />;
    }

    return notFound();
}
