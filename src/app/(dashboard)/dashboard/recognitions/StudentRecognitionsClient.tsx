'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Award, Download, ShieldCheck, Ban, IdCard, CalendarClock } from 'lucide-react';

type RecognitionType = 'BADGE' | 'CERTIFICATE';

type RecognitionAward = {
    id: string;
    verificationCode: string;
    isRevoked: boolean;
    revokedReason: string | null;
    awardedAt: string;
    recognitionConfig: {
        id: string;
        name: string;
        description: string | null;
        type: RecognitionType;
    };
    project: {
        id: string;
        title: string;
        type: string;
    };
};

function typeLabel(type: RecognitionType | 'ALL') {
    if (type === 'CERTIFICATE') return 'Certificado';
    if (type === 'BADGE') return 'Insignia';
    return 'Todos';
}

export function StudentRecognitionsClient({ recognitionAwards }: { recognitionAwards: RecognitionAward[] }) {
    const [selectedProjectId, setSelectedProjectId] = useState<string>('ALL');
    const [selectedType, setSelectedType] = useState<'ALL' | RecognitionType>('ALL');

    const activeAwards = recognitionAwards.filter((award) => !award.isRevoked);
    const revokedAwards = recognitionAwards.filter((award) => award.isRevoked);

    const projects = useMemo(() => {
        const map = new Map<string, { id: string; title: string }>();
        recognitionAwards.forEach((award) => {
            if (!map.has(award.project.id)) {
                map.set(award.project.id, { id: award.project.id, title: award.project.title });
            }
        });
        return Array.from(map.values()).sort((a, b) => a.title.localeCompare(b.title));
    }, [recognitionAwards]);

    const filteredAwards = useMemo(() => {
        return recognitionAwards.filter((award) => {
            const matchesProject = selectedProjectId === 'ALL' || award.project.id === selectedProjectId;
            const matchesType = selectedType === 'ALL' || award.recognitionConfig.type === selectedType;
            return matchesProject && matchesType;
        });
    }, [recognitionAwards, selectedProjectId, selectedType]);

    return (
        <div className="space-y-8">
            <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-3">
                        <Award className="w-8 h-8 text-amber-500" />
                        Mis reconocimientos
                    </h1>
                    <p className="text-slate-500 mt-2">
                        Filtra tus reconocimientos por proyecto o por tipo.
                    </p>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-600 shadow-sm">
                    <p>Total: <strong className="text-slate-900">{recognitionAwards.length}</strong></p>
                    <p>Activos: <strong className="text-emerald-700">{activeAwards.length}</strong></p>
                    <p>Revocados: <strong className="text-red-700">{revokedAwards.length}</strong></p>
                </div>
            </header>

            {recognitionAwards.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center">
                    <Award className="w-12 h-12 mx-auto text-slate-300" />
                    <h2 className="text-lg font-bold text-slate-800 mt-4">Aún no tienes reconocimientos</h2>
                    <p className="text-slate-500 mt-2">
                        Completa entregas y objetivos del proyecto para desbloquear insignias y certificados.
                    </p>
                    <Link
                        href="/dashboard"
                        className="inline-flex mt-5 bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2.5 rounded-lg transition-colors"
                    >
                        Volver al dashboard
                    </Link>
                </div>
            ) : (
                <>
                    <section className="bg-white border border-slate-200 rounded-2xl p-4 md:p-5 shadow-sm">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
                            <label className="text-sm text-slate-600">
                                <span className="block mb-1.5 font-bold text-slate-700">Proyecto</span>
                                <select
                                    value={selectedProjectId}
                                    onChange={(event) => setSelectedProjectId(event.target.value)}
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-100"
                                >
                                    <option value="ALL">Todos los proyectos</option>
                                    {projects.map((project) => (
                                        <option key={project.id} value={project.id}>
                                            {project.title}
                                        </option>
                                    ))}
                                </select>
                            </label>

                            <label className="text-sm text-slate-600">
                                <span className="block mb-1.5 font-bold text-slate-700">Tipo</span>
                                <select
                                    value={selectedType}
                                    onChange={(event) => setSelectedType(event.target.value as 'ALL' | RecognitionType)}
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-100"
                                >
                                    <option value="ALL">Todos</option>
                                    <option value="BADGE">Insignia</option>
                                    <option value="CERTIFICATE">Certificado</option>
                                </select>
                            </label>

                            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-600 flex items-center">
                                Mostrando <strong className="text-slate-900 ml-1">{filteredAwards.length}</strong>
                                <span className="ml-1">de {recognitionAwards.length}</span>
                            </div>
                        </div>
                    </section>

                    {filteredAwards.length === 0 ? (
                        <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center text-slate-500">
                            No hay reconocimientos para el filtro seleccionado.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {filteredAwards.map((award) => (
                                <article key={award.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                                {typeLabel(award.recognitionConfig.type)}
                                            </p>
                                            <h2 className="text-lg font-bold text-slate-900 line-clamp-1">{award.recognitionConfig.name}</h2>
                                            <p className="text-sm text-slate-500 line-clamp-1">{award.project.title}</p>
                                        </div>
                                        {award.isRevoked ? (
                                            <span className="inline-flex items-center gap-1 bg-red-50 text-red-700 border border-red-200 px-2 py-1 rounded-full text-[11px] font-bold">
                                                <Ban className="w-3.5 h-3.5" /> Revocado
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-1 rounded-full text-[11px] font-bold">
                                                <ShieldCheck className="w-3.5 h-3.5" /> Válido
                                            </span>
                                        )}
                                    </div>

                                    {award.recognitionConfig.description && (
                                        <p className="text-sm text-slate-600 mt-3 line-clamp-2">{award.recognitionConfig.description}</p>
                                    )}

                                    <div className="mt-4 space-y-1 text-xs text-slate-500">
                                        <p className="flex items-center gap-1.5">
                                            <IdCard className="w-3.5 h-3.5" />
                                            ID Reconocimiento: <span className="font-mono text-slate-700">{award.id}</span>
                                        </p>
                                        <p className="flex items-center gap-1.5">
                                            <IdCard className="w-3.5 h-3.5" />
                                            ID Configuración: <span className="font-mono text-slate-700">{award.recognitionConfig.id}</span>
                                        </p>
                                        <p className="flex items-center gap-1.5">
                                            <CalendarClock className="w-3.5 h-3.5" />
                                            Otorgado: <span className="text-slate-700">{new Date(award.awardedAt).toLocaleString('es-ES')}</span>
                                        </p>
                                        {award.isRevoked && award.revokedReason && (
                                            <p className="text-red-700">Motivo de revocación: {award.revokedReason}</p>
                                        )}
                                    </div>

                                    <div className="mt-4 flex items-center gap-3">
                                        <Link
                                            href={`/verify/recognition/${award.verificationCode}`}
                                            target="_blank"
                                            className="inline-flex items-center gap-1 text-sm font-bold text-blue-600 hover:underline"
                                        >
                                            <ShieldCheck className="w-4 h-4" /> Verificar
                                        </Link>
                                        {!award.isRevoked && (
                                            <a
                                                href={`/api/recognitions/${award.id}/certificate`}
                                                className="inline-flex items-center gap-1 text-sm font-bold text-slate-700 hover:underline"
                                            >
                                                <Download className="w-4 h-4" /> Descargar PDF
                                            </a>
                                        )}
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
