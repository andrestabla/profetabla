import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import CreateProjectForm from '../../projects/new/CreateProjectForm';

export default async function NewChallengePage() {
    const session = await getServerSession(authOptions);

    if (!session || (session.user.role !== 'TEACHER' && session.user.role !== 'ADMIN')) {
        redirect('/dashboard/professor/challenges');
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

    return <CreateProjectForm availableOAs={formattedOAs} availableSkills={formattedSkills} defaultType="CHALLENGE" enforceType={true} />;
}
