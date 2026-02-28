import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { ShieldCheck, ShieldX, Award, BadgeCheck } from 'lucide-react';

export const dynamic = 'force-dynamic';

function formatAwardDate(date: Date): string {
    return new Intl.DateTimeFormat('es-ES', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
    }).format(date);
}

export default async function RecognitionVerificationPage({
    params
}: {
    params: Promise<{ verificationCode: string }>;
}) {
    const { verificationCode } = await params;

    const award = await prisma.recognitionAward.findUnique({
        where: { verificationCode },
        include: {
            student: {
                select: {
                    name: true,
                    email: true
                }
            },
            project: {
                select: {
                    title: true,
                    type: true
                }
            },
            recognitionConfig: {
                select: {
                    id: true,
                    name: true,
                    description: true,
                    type: true
                }
            }
        }
    });

    if (!award) {
        return (
            <main className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
                <section className="max-w-xl w-full bg-white border border-red-200 rounded-2xl p-8 shadow-sm text-center">
                    <div className="w-14 h-14 rounded-full bg-red-100 text-red-700 mx-auto flex items-center justify-center mb-5">
                        <ShieldX className="w-7 h-7" />
                    </div>
                    <h1 className="text-2xl font-black text-slate-900">Código no válido</h1>
                    <p className="mt-3 text-slate-600">
                        Este reconocimiento no existe o fue revocado.
                    </p>
                    <p className="mt-2 text-xs text-slate-400 break-all">{verificationCode}</p>
                </section>
            </main>
        );
    }

    const isRevoked = award.isRevoked;

    return (
        <main className="min-h-screen bg-slate-50 p-6 md:p-10">
            <section className="max-w-3xl mx-auto bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
                <div className={`${isRevoked ? 'bg-red-600' : 'bg-blue-600'} text-white p-6 md:p-8`}>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                            {isRevoked ? <ShieldX className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
                        </div>
                        <div>
                            <p className="text-xs uppercase tracking-wider font-bold text-white/80">Verificación Oficial</p>
                            <h1 className="text-2xl md:text-3xl font-black">
                                {isRevoked ? 'Reconocimiento revocado' : 'Reconocimiento auténtico'}
                            </h1>
                        </div>
                    </div>
                </div>

                <div className="p-6 md:p-8 space-y-6">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className={`text-[10px] uppercase tracking-wider font-black px-2 py-1 rounded-lg ${award.recognitionConfig.type === 'CERTIFICATE' ? 'bg-indigo-100 text-indigo-700' : 'bg-amber-100 text-amber-700'}`}>
                            {award.recognitionConfig.type === 'CERTIFICATE' ? 'Certificado' : 'Insignia'}
                        </span>
                        <span className={`text-[10px] uppercase tracking-wider font-black px-2 py-1 rounded-lg flex items-center gap-1 ${isRevoked ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                            {isRevoked ? <ShieldX className="w-3 h-3" /> : <BadgeCheck className="w-3 h-3" />}
                            {isRevoked ? 'Revocado' : 'Válido'}
                        </span>
                    </div>

                    <div>
                        <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                            <Award className="w-6 h-6 text-blue-600" />
                            {award.recognitionConfig.name}
                        </h2>
                        {award.recognitionConfig.description && (
                            <p className="mt-2 text-slate-600">{award.recognitionConfig.description}</p>
                        )}
                    </div>

                    {isRevoked && (
                        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm">
                            <p className="font-bold text-red-800">Este reconocimiento fue invalidado por la institución.</p>
                            {award.revokedAt && (
                                <p className="text-red-700 mt-1">
                                    Fecha de revocación: {formatAwardDate(award.revokedAt)}
                                </p>
                            )}
                            {award.revokedReason && (
                                <p className="text-red-700 mt-1">Motivo: {award.revokedReason}</p>
                            )}
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                            <p className="text-xs uppercase tracking-wider text-slate-500 font-bold">Estudiante</p>
                            <p className="mt-1 font-bold text-slate-900">{award.student.name || 'Sin nombre'}</p>
                            <p className="text-slate-600">{award.student.email}</p>
                        </div>
                        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                            <p className="text-xs uppercase tracking-wider text-slate-500 font-bold">Proyecto</p>
                            <p className="mt-1 font-bold text-slate-900">{award.project.title}</p>
                            <p className="text-slate-600">
                                {award.project.type === 'CHALLENGE'
                                    ? 'Reto'
                                    : award.project.type === 'PROBLEM'
                                        ? 'Problema'
                                        : 'Proyecto'}
                            </p>
                        </div>
                        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                            <p className="text-xs uppercase tracking-wider text-slate-500 font-bold">Fecha de otorgamiento</p>
                            <p className="mt-1 font-bold text-slate-900">{formatAwardDate(award.awardedAt)}</p>
                        </div>
                        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                            <p className="text-xs uppercase tracking-wider text-slate-500 font-bold">Código de verificación</p>
                            <p className="mt-1 font-mono text-xs text-slate-900 break-all">{award.verificationCode}</p>
                        </div>
                        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                            <p className="text-xs uppercase tracking-wider text-slate-500 font-bold">ID del reconocimiento</p>
                            <p className="mt-1 font-mono text-xs text-slate-900 break-all">{award.recognitionConfig.id}</p>
                        </div>
                        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                            <p className="text-xs uppercase tracking-wider text-slate-500 font-bold">ID del otorgamiento</p>
                            <p className="mt-1 font-mono text-xs text-slate-900 break-all">{award.id}</p>
                        </div>
                    </div>

                    <div className="pt-2">
                        <Link
                            href="/"
                            className="inline-flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-700"
                        >
                            Volver al inicio
                        </Link>
                    </div>
                </div>
            </section>
        </main>
    );
}
