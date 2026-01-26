import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import OAForm from '@/components/OAForm';
import { updateLearningObjectAction } from '../../actions';
import Link from 'next/link';
import { ArrowLeft, BookOpen } from 'lucide-react';

export default async function EditLearningObjectPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== 'TEACHER' && session.user.role !== 'ADMIN')) {
        redirect('/dashboard/learning');
    }

    const oa = await prisma.learningObject.findUnique({
        where: { id },
        include: { items: { orderBy: { order: 'asc' } } }
    });

    if (!oa) redirect('/dashboard/learning');
    if (session.user.role !== 'ADMIN' && oa.authorId !== session.user.id) {
        redirect('/dashboard/learning');
    }

    return (
        <div className="max-w-5xl mx-auto p-6">
            <Link href={`/dashboard/learning/object/${id}`} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 mb-6 transition-colors">
                <ArrowLeft className="w-4 h-4" /> Volver al Objeto
            </Link>

            <header className="mb-8">
                <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
                    <BookOpen className="w-8 h-8 text-blue-600" /> Editar Objeto de Aprendizaje
                </h1>
            </header>

            <OAForm initialData={oa} action={updateLearningObjectAction} />
        </div>
    );
}
