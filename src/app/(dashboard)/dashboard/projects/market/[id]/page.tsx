import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { notFound, redirect } from 'next/navigation';
import {
    Calendar, DollarSign, BarChart, ClipboardCheck,
    BookOpen, User, Briefcase, Clock, ChevronLeft, CheckSquare, Layers, Search
} from 'lucide-react';
import Link from 'next/link';
import ProjectDetailClient from './ProjectDetailClient';

type Props = {
    params: Promise<{ id: string }>;
};

export default async function ProjectDetailPage(props: Props) {
    const params = await props.params;
    const session = await getServerSession(authOptions);
    if (!session) redirect('/auth/login');

    const project = await prisma.project.findUnique({
        where: { id: params.id },
        include: {
            teacher: {
                select: {
                    name: true,
                    avatarUrl: true,
                    email: true
                }
            },
            learningObjects: true
        }
    });

});

if (!project) notFound();

// Check if current user has already applied
const existingApplication = await prisma.projectApplication.findUnique({
    where: {
        projectId_studentId: {
            projectId: project.id,
            studentId: session.user.id
        }
    }
});

// Determine current status: 'NONE' | 'PENDING' | 'ACCEPTED' | 'REJECTED'
const applicationStatus = existingApplication ? existingApplication.status : 'NONE';

// Mapping icons/colors based on type
const typeConfig = {
    PROJECT: { label: "Proyecto", icon: Layers, color: "text-blue-600", bg: "bg-blue-50" },
    CHALLENGE: { label: "Reto", icon: CheckSquare, color: "text-orange-600", bg: "bg-orange-50" },
    PROBLEM: { label: "Problema", icon: Search, color: "text-red-600", bg: "bg-red-50" }
};

const config = typeConfig[project.type as keyof typeof typeConfig] || typeConfig.PROJECT;

return <ProjectDetailClient project={project} />;
}
