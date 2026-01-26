import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { notFound } from 'next/navigation';
import { BookOpen, CheckCircle2, Circle } from 'lucide-react';
import { linkOAToProjectAction } from './actions';
import Link from 'next/link';

export default async function ProjectLearningPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== 'TEACHER' && session.user.role !== 'ADMIN')) {
        return <div className="p-6">No tienes permisos para ver esta página.</div>;
    }

    const project = await prisma.project.findUnique({
        where: { id },
        include: {
            learningObjects: {
                select: { id: true }
            }
        }
    });

    if (!project) return notFound();

    const allOAs = await prisma.learningObject.findMany({
        orderBy: { title: 'asc' }
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const linkedOAIds = new Set(project.learningObjects.map((oa: any) => oa.id));

    return (
        <div className="max-w-4xl mx-auto p-6">
            <header className="mb-8">
                <nav className="text-sm text-slate-400 mb-2">
                    <Link href={`/dashboard/professor/projects/${id}`} className="hover:underline">Proyecto</Link> / Curaduría de OAs
                </nav>
                <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
                    <BookOpen className="w-8 h-8 text-indigo-600" /> Curaduría de Aprendizaje
                </h1>
                <p className="text-slate-500 mt-2">
                    Selecciona los Objetos de Aprendizaje que el estudiante verá sugeridos para <strong>{project.title}</strong>.
                </p>
            </header>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="grid grid-cols-1 divide-y divide-slate-100">
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    {allOAs.map((oa: any) => {
                        const isLinked = linkedOAIds.has(oa.id);
                        return (
                            <div key={oa.id} className="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors group">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded uppercase">
                                            {oa.subject}
                                        </span>
                                        <h3 className="font-bold text-slate-800">{oa.title}</h3>
                                    </div>
                                    <p className="text-sm text-slate-500 line-clamp-1">{oa.description}</p>
                                </div>
                                <form action={async () => {
                                    'use server';
                                    await linkOAToProjectAction(id, oa.id, !isLinked);
                                }}>
                                    <button
                                        type="submit"
                                        className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all ${isLinked
                                            ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                                            : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                            }`}
                                    >
                                        {isLinked ? (
                                            <>
                                                <CheckCircle2 className="w-5 h-5" /> Vinculado
                                            </>
                                        ) : (
                                            <>
                                                <Circle className="w-5 h-5" /> No Vinculado
                                            </>
                                        )}
                                    </button>
                                </form>
                            </div>
                        );
                    })}
                    {allOAs.length === 0 && (
                        <div className="p-12 text-center text-slate-400 italic">
                            No hay Objetos de Aprendizaje en la biblioteca global.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
