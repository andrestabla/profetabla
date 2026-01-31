import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search') || '';
        const projectId = searchParams.get('projectId'); // Can be 'GLOBAL' to filter unassigned
        const topic = searchParams.get('topic');

        const userRole = session.user.role;
        const userId = session.user.id;
        const isAdminOrTeacher = userRole === 'ADMIN' || userRole === 'TEACHER';

        // --- 1. Determine Scope ---
        // Students are restricted to their linked projects + global resources.
        // Admins/Teachers see EVERYTHING by default, unless filtered.

        let studentProjectIds: string[] = [];

        if (userRole === 'STUDENT') {
            const studentProjects = await prisma.project.findMany({
                where: { students: { some: { id: userId } } },
                select: { id: true }
            });
            studentProjectIds = studentProjects.map(p => p.id);
        }

        // --- 2. Build Query Filters for Resources ---
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const resourceWhere: any = {};

        // A. Project Scope
        if (!isAdminOrTeacher) {
            // Student: Active Projects OR Global (projectId is null)
            resourceWhere.OR = [
                { projectId: { in: studentProjectIds } },
                { projectId: null }
            ];
        } else {
            // Admin/Teacher: Apply filter if present
            if (projectId) {
                if (projectId === 'GLOBAL') {
                    resourceWhere.projectId = null;
                } else {
                    resourceWhere.projectId = projectId;
                }
            }
        }

        // B. Search (Title or Description)
        if (search) {
            resourceWhere.AND = [
                {
                    OR: [
                        { title: { contains: search, mode: 'insensitive' } },
                        { description: { contains: search, mode: 'insensitive' } }
                    ]
                }
            ];
        }

        // C. Topic (Category)
        if (topic) {
            resourceWhere.category = { name: topic };
        }

        // --- 3. Build Query Filters for Learning Objects (OAs) ---
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const oaWhere: any = {};

        // A. Project Scope (OAs are many-to-many)
        if (!isAdminOrTeacher) {
            // Student: Must be linked to ANY of their projects
            if (studentProjectIds.length > 0) {
                oaWhere.projects = { some: { id: { in: studentProjectIds } } };
            } else {
                // No projects -> No OAs (unless we decide global OAs exist and handled differently, but currently via relation)
                oaWhere.projects = { some: { id: 'non-existent' } };
            }
        } else {
            // Admin/Teacher
            if (projectId) {
                if (projectId === 'GLOBAL') {
                    oaWhere.projects = { none: {} }; // Approximation for "Global" (no projects)
                } else {
                    oaWhere.projects = { some: { id: projectId } };
                }
            }
        }

        // B. Search (Title, Description, Keywords)
        if (search) {
            oaWhere.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
                // Check Keywords array? Prisma array filter:
                { keywords: { hasSome: [search] } }
            ];
        }

        // C. Topic (Subject)
        if (topic) {
            oaWhere.subject = topic;
        }

        // --- 4. Execute Queries ---
        const [resources, learningObjects] = await Promise.all([
            prisma.resource.findMany({
                where: resourceWhere,
                include: {
                    category: true,
                    project: { select: { id: true, title: true } }, // Include project info
                    interactions: { where: { userId: userId } }
                },
                orderBy: { createdAt: 'desc' }
            }),
            prisma.learningObject.findMany({
                where: oaWhere,
                include: {
                    author: true,
                    projects: { select: { id: true, title: true } }, // Include projects info
                    items: { take: 1 }
                },
                orderBy: { createdAt: 'desc' }
            })
        ]);

        // --- 5. Format Response ---
        const formattedResources = [
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ...resources.map((r: any) => ({
                id: r.id,
                title: r.title,
                description: r.description,
                url: r.url,
                type: r.type,
                isViewed: r.interactions[0]?.isCompleted || false,
                isFavorite: r.interactions[0]?.isFavorite || false,
                category: { name: r.category.name, color: r.category.color },
                project: r.project, // { id, title } or null
                isOA: false
            })),
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ...learningObjects.map((oa: any) => ({
                id: oa.id,
                title: oa.title,
                description: oa.description,
                url: `/dashboard/learning/object/${oa.id}`,
                type: 'COURSE',
                isViewed: false,
                isFavorite: false,
                category: { name: oa.subject, color: 'purple' },
                projects: oa.projects, // Array of { id, title }
                isOA: true
            }))
        ];

        return NextResponse.json(formattedResources);
    } catch (error) {
        console.error("Error fetching resources:", error);
        return NextResponse.json({ error: 'Error fetching resources' }, { status: 500 });
    }
}
