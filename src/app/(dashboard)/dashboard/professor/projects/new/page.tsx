
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import CreateProjectForm from "./CreateProjectForm";

type Props = {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function NewProjectPage({ searchParams }: Props) {
    const session = await getServerSession(authOptions);

    if (!session || (session.user.role !== 'TEACHER' && session.user.role !== 'ADMIN')) {
        redirect('/dashboard/professor/projects'); // O a login
    }

    const oas = await prisma.learningObject.findMany({
        select: { id: true, title: true, subject: true }
    });

    const skills21 = await prisma.twentyFirstSkill.findMany({
        where: { isActive: true },
        select: {
            id: true,
            name: true,
            industry: true,
            category: true,
            trendSummary: true
        },
        orderBy: [{ industry: 'asc' }, { name: 'asc' }]
    });

    // Adapt to component interface
    const formattedOAs = oas.map(oa => ({
        id: oa.id,
        title: oa.title,
        category: { name: oa.subject, color: 'bg-slate-100' }
    }));

    const formattedSkills = skills21.map((skill) => ({
        id: skill.id,
        name: skill.name,
        industry: skill.industry,
        category: skill.category,
        trendSummary: skill.trendSummary
    }));

    // Extract type from params (safe cast) or default to PROJECT
    const params = await searchParams;
    const rawType = params?.type;
    const typeStr = Array.isArray(rawType) ? rawType[0] : rawType;
    // Allow override via query param if needed, but default strictly to PROJECT if typical flow
    const defaultType = (typeStr === 'CHALLENGE' || typeStr === 'PROBLEM') ? typeStr : 'PROJECT';
    // If accessed via /projects/new, we assume Project, but if ?type is present we might want to respect it OR create redirects.
    // Given the user request "Solo debe existir la opción para crear el tipo correspondiente", let's enforce based on URL context.
    // But since this is the "Projects" root, let's default to PROJECT.

    return <CreateProjectForm availableOAs={formattedOAs} availableSkills={formattedSkills} defaultType={defaultType} enforceType={true} />;
}
