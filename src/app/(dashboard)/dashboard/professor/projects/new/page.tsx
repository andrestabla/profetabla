
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

    // Adapt to component interface
    const formattedOAs = oas.map(oa => ({
        id: oa.id,
        title: oa.title,
        category: { name: oa.subject, color: 'bg-slate-100' }
    }));

    // Extract type from params (safe cast)
    const params = await searchParams;
    const rawType = params?.type;
    const typeStr = Array.isArray(rawType) ? rawType[0] : rawType;
    const defaultType = (typeStr === 'CHALLENGE' || typeStr === 'PROBLEM') ? typeStr : 'PROJECT';

    return <CreateProjectForm availableOAs={formattedOAs} defaultType={defaultType} />;
}
