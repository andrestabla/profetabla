'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    ArrowUpRight,
    BarChart3,
    BookOpen,
    Briefcase,
    Lightbulb,
    Loader2,
    Sparkles,
    TrendingUp
} from 'lucide-react';
import { createTwentyFirstSkillAction, toggleTwentyFirstSkillStatusAction } from './actions';
import { useModals } from '@/components/ModalProvider';

type SkillSource = {
    title: string;
    url: string;
};

type Skill = {
    id: string;
    name: string;
    industry: string;
    category: string | null;
    description: string;
    trendSummary: string | null;
    examples: string[];
    tags: string[];
    isActive: boolean;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    sources: any;
    createdAt: string;
    updatedAt: string;
    projectCount: number;
};

function normalizeSources(raw: unknown): SkillSource[] {
    if (!Array.isArray(raw)) return [];

    return raw
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((item: any) => {
            if (!item || typeof item !== 'object') return null;
            const title = String(item.title || '').trim();
            const url = String(item.url || '').trim();
            if (!url) return null;
            try {
                const parsed = new URL(url);
                return {
                    title: title || parsed.hostname,
                    url: parsed.toString()
                };
            } catch {
                return null;
            }
        })
        .filter(Boolean) as SkillSource[];
}

function trendBadge(projectCount: number) {
    if (projectCount >= 5) return { label: 'Alta Tendencia', styles: 'bg-emerald-100 text-emerald-700 border-emerald-200' };
    if (projectCount >= 2) return { label: 'En crecimiento', styles: 'bg-amber-100 text-amber-700 border-amber-200' };
    return { label: 'Emergente', styles: 'bg-blue-100 text-blue-700 border-blue-200' };
}

export default function Skills21Client({
    skills,
    canManage,
    currentRole
}: {
    skills: Skill[];
    canManage: boolean;
    currentRole: string;
}) {
    const router = useRouter();
    const { showAlert } = useModals();
    const [isPending, startTransition] = useTransition();
    const [expandedId, setExpandedId] = useState<string | null>(skills[0]?.id || null);

    const [search, setSearch] = useState('');
    const [industryFilter, setIndustryFilter] = useState('ALL');
    const [categoryFilter, setCategoryFilter] = useState('ALL');
    const [showInactive, setShowInactive] = useState(false);

    const [formOpen, setFormOpen] = useState(false);
    const [newSkill, setNewSkill] = useState({
        name: '',
        industry: '',
        category: '',
        description: '',
        trendSummary: '',
        examplesText: '',
        sourcesText: '',
        tagsText: ''
    });

    const industries = useMemo(() => {
        const set = new Set(skills.map((skill) => skill.industry).filter(Boolean));
        return Array.from(set).sort((a, b) => a.localeCompare(b));
    }, [skills]);

    const categories = useMemo(() => {
        const set = new Set(
            skills
                .map((skill) => skill.category)
                .filter((category): category is string => Boolean(category))
        );
        return Array.from(set).sort((a, b) => a.localeCompare(b));
    }, [skills]);

    const filteredSkills = useMemo(() => {
        const term = search.trim().toLowerCase();
        return skills.filter((skill) => {
            if (!showInactive && !skill.isActive) return false;
            if (industryFilter !== 'ALL' && skill.industry !== industryFilter) return false;
            if (categoryFilter !== 'ALL' && skill.category !== categoryFilter) return false;

            if (!term) return true;

            const haystack = [
                skill.name,
                skill.industry,
                skill.category || '',
                skill.description,
                skill.trendSummary || '',
                ...(skill.tags || [])
            ].join(' ').toLowerCase();

            return haystack.includes(term);
        });
    }, [skills, showInactive, industryFilter, categoryFilter, search]);

    const activeCount = skills.filter((skill) => skill.isActive).length;
    const totalAssociations = skills.reduce((acc, skill) => acc + skill.projectCount, 0);

    const handleCreate = () => {
        startTransition(async () => {
            const result = await createTwentyFirstSkillAction(newSkill);
            if (!result.success) {
                await showAlert('Error', result.error || 'No se pudo crear la habilidad.', 'error');
                return;
            }

            await showAlert('Habilidad creada', 'La habilidad se guardó en el repositorio.', 'success');
            setNewSkill({
                name: '',
                industry: '',
                category: '',
                description: '',
                trendSummary: '',
                examplesText: '',
                sourcesText: '',
                tagsText: ''
            });
            setFormOpen(false);
            router.refresh();
        });
    };

    const handleToggleStatus = (skill: Skill) => {
        startTransition(async () => {
            const result = await toggleTwentyFirstSkillStatusAction(skill.id, !skill.isActive);
            if (!result.success) {
                await showAlert('Error', result.error || 'No se pudo actualizar el estado.', 'error');
                return;
            }

            router.refresh();
        });
    };

    return (
        <div className="space-y-8">
            <header className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
                        <Sparkles className="w-8 h-8 text-indigo-600" />
                        Habilidades del Siglo XXI
                    </h1>
                    <p className="text-slate-500 mt-2 max-w-3xl">
                        Repositorio dinámico por industria con competencias en tendencia, ejemplos aplicados y fuentes externas.
                    </p>
                </div>

                <div className="grid grid-cols-3 gap-2 w-full lg:w-auto">
                    <div className="bg-white border border-slate-200 rounded-xl px-4 py-3 text-center">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Habilidades</p>
                        <p className="text-lg font-black text-slate-900">{skills.length}</p>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-xl px-4 py-3 text-center">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Activas</p>
                        <p className="text-lg font-black text-emerald-700">{activeCount}</p>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-xl px-4 py-3 text-center">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Asociaciones</p>
                        <p className="text-lg font-black text-indigo-700">{totalAssociations}</p>
                    </div>
                </div>
            </header>

            <section className="bg-white border border-slate-200 rounded-2xl p-4 md:p-6 shadow-sm space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <input
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Buscar habilidad o palabra clave..."
                        className="md:col-span-2 w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm outline-none focus:ring-2 focus:ring-indigo-100"
                    />

                    <select
                        value={industryFilter}
                        onChange={(event) => setIndustryFilter(event.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm outline-none focus:ring-2 focus:ring-indigo-100"
                    >
                        <option value="ALL">Todas las industrias</option>
                        {industries.map((industry) => (
                            <option key={industry} value={industry}>{industry}</option>
                        ))}
                    </select>

                    <select
                        value={categoryFilter}
                        onChange={(event) => setCategoryFilter(event.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm outline-none focus:ring-2 focus:ring-indigo-100"
                    >
                        <option value="ALL">Todas las categorías</option>
                        {categories.map((category) => (
                            <option key={category} value={category || ''}>{category}</option>
                        ))}
                    </select>
                </div>

                {canManage && (
                    <div className="flex items-center justify-between flex-wrap gap-2 pt-2">
                        <label className="inline-flex items-center gap-2 text-sm text-slate-600">
                            <input
                                type="checkbox"
                                checked={showInactive}
                                onChange={(event) => setShowInactive(event.target.checked)}
                                className="w-4 h-4 rounded"
                            />
                            Mostrar habilidades inactivas
                        </label>

                        <button
                            onClick={() => setFormOpen((prev) => !prev)}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 transition-colors"
                        >
                            <Lightbulb className="w-4 h-4" />
                            {formOpen ? 'Cerrar carga' : 'Cargar nueva habilidad'}
                        </button>
                    </div>
                )}

                {canManage && formOpen && (
                    <div className="mt-2 border border-slate-200 rounded-2xl p-4 bg-slate-50 grid grid-cols-1 md:grid-cols-2 gap-3">
                        <input
                            value={newSkill.name}
                            onChange={(event) => setNewSkill((prev) => ({ ...prev, name: event.target.value }))}
                            placeholder="Nombre de la habilidad"
                            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:ring-2 focus:ring-indigo-100"
                        />
                        <input
                            value={newSkill.industry}
                            onChange={(event) => setNewSkill((prev) => ({ ...prev, industry: event.target.value }))}
                            placeholder="Industria (ej: Fintech, Salud)"
                            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:ring-2 focus:ring-indigo-100"
                        />
                        <input
                            value={newSkill.category}
                            onChange={(event) => setNewSkill((prev) => ({ ...prev, category: event.target.value }))}
                            placeholder="Categoría (ej: IA, Datos, Liderazgo)"
                            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:ring-2 focus:ring-indigo-100"
                        />
                        <input
                            value={newSkill.tagsText}
                            onChange={(event) => setNewSkill((prev) => ({ ...prev, tagsText: event.target.value }))}
                            placeholder="Tags (una por línea)"
                            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:ring-2 focus:ring-indigo-100"
                        />
                        <textarea
                            value={newSkill.description}
                            onChange={(event) => setNewSkill((prev) => ({ ...prev, description: event.target.value }))}
                            placeholder="Descripción y por qué es relevante"
                            rows={3}
                            className="md:col-span-2 w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:ring-2 focus:ring-indigo-100 resize-none"
                        />
                        <textarea
                            value={newSkill.trendSummary}
                            onChange={(event) => setNewSkill((prev) => ({ ...prev, trendSummary: event.target.value }))}
                            placeholder="Resumen de tendencia (qué está pasando en la industria)"
                            rows={3}
                            className="md:col-span-2 w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:ring-2 focus:ring-indigo-100 resize-none"
                        />
                        <textarea
                            value={newSkill.examplesText}
                            onChange={(event) => setNewSkill((prev) => ({ ...prev, examplesText: event.target.value }))}
                            placeholder="Ejemplos (uno por línea)"
                            rows={4}
                            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:ring-2 focus:ring-indigo-100 resize-none"
                        />
                        <textarea
                            value={newSkill.sourcesText}
                            onChange={(event) => setNewSkill((prev) => ({ ...prev, sourcesText: event.target.value }))}
                            placeholder="Fuentes externas: Título|https://url (una por línea)"
                            rows={4}
                            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:ring-2 focus:ring-indigo-100 resize-none"
                        />
                        <div className="md:col-span-2 flex justify-end">
                            <button
                                onClick={handleCreate}
                                disabled={isPending}
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-sm hover:bg-black transition-colors disabled:opacity-70"
                            >
                                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                                Guardar habilidad
                            </button>
                        </div>
                    </div>
                )}
            </section>

            {filteredSkills.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center">
                    <p className="text-slate-500">No hay habilidades para los filtros seleccionados.</p>
                </div>
            ) : (
                <section className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                    {filteredSkills.map((skill) => {
                        const badge = trendBadge(skill.projectCount);
                        const sources = normalizeSources(skill.sources);
                        const expanded = expandedId === skill.id;

                        return (
                            <article key={skill.id} className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                                <div className="p-5">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <div className="flex flex-wrap items-center gap-2 mb-2">
                                                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full bg-slate-100 text-slate-600">
                                                    {skill.industry}
                                                </span>
                                                {skill.category && (
                                                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full bg-indigo-100 text-indigo-700">
                                                        {skill.category}
                                                    </span>
                                                )}
                                                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full border ${badge.styles}`}>
                                                    {badge.label}
                                                </span>
                                                {!skill.isActive && (
                                                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full bg-rose-100 text-rose-700 border border-rose-200">
                                                        Inactiva
                                                    </span>
                                                )}
                                            </div>
                                            <h2 className="text-lg font-black text-slate-900 line-clamp-2">{skill.name}</h2>
                                        </div>

                                        {canManage && (
                                            <button
                                                onClick={() => handleToggleStatus(skill)}
                                                disabled={isPending}
                                                className="text-xs font-bold px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600"
                                            >
                                                {skill.isActive ? 'Desactivar' : 'Activar'}
                                            </button>
                                        )}
                                    </div>

                                    <p className="text-sm text-slate-600 mt-3 line-clamp-3">{skill.description}</p>

                                    <div className="mt-4 flex items-center gap-4 text-xs text-slate-500">
                                        <span className="inline-flex items-center gap-1">
                                            <Briefcase className="w-3.5 h-3.5" /> {skill.projectCount} proyecto(s) asociados
                                        </span>
                                        <span className="inline-flex items-center gap-1">
                                            <TrendingUp className="w-3.5 h-3.5" /> Actualizado {new Date(skill.updatedAt).toLocaleDateString('es-ES')}
                                        </span>
                                    </div>

                                    <button
                                        onClick={() => setExpandedId(expanded ? null : skill.id)}
                                        className="mt-4 text-sm font-bold text-indigo-600 hover:underline"
                                    >
                                        {expanded ? 'Ocultar detalles' : 'Ver detalles, ejemplos y fuentes'}
                                    </button>
                                </div>

                                {expanded && (
                                    <div className="border-t border-slate-200 bg-slate-50 p-5 space-y-4">
                                        {skill.trendSummary && (
                                            <div>
                                                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                                    <BarChart3 className="w-4 h-4 text-indigo-600" /> Tendencia
                                                </h3>
                                                <p className="text-sm text-slate-600 mt-1">{skill.trendSummary}</p>
                                            </div>
                                        )}

                                        {skill.examples.length > 0 && (
                                            <div>
                                                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                                    <BookOpen className="w-4 h-4 text-emerald-600" /> Ejemplos de aplicación
                                                </h3>
                                                <ul className="mt-2 space-y-1">
                                                    {skill.examples.map((example, index) => (
                                                        <li key={`${skill.id}-example-${index}`} className="text-sm text-slate-600">
                                                            - {example}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}

                                        {sources.length > 0 && (
                                            <div>
                                                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                                    <ArrowUpRight className="w-4 h-4 text-blue-600" /> Fuentes externas
                                                </h3>
                                                <ul className="mt-2 space-y-1.5">
                                                    {sources.map((source, index) => (
                                                        <li key={`${skill.id}-source-${index}`}>
                                                            <Link
                                                                href={source.url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-sm text-blue-600 hover:text-blue-700 hover:underline inline-flex items-center gap-1"
                                                            >
                                                                {source.title}
                                                                <ArrowUpRight className="w-3.5 h-3.5" />
                                                            </Link>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}

                                        {skill.tags.length > 0 && (
                                            <div className="flex flex-wrap gap-1.5 pt-1">
                                                {skill.tags.map((tag) => (
                                                    <span key={`${skill.id}-tag-${tag}`} className="text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded-full bg-slate-200 text-slate-700">
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </article>
                        );
                    })}
                </section>
            )}

            {currentRole === 'STUDENT' && (
                <p className="text-xs text-slate-400">
                    Estas habilidades se conectan automáticamente con nuevos proyectos, retos y problemas definidos por tus profesores.
                </p>
            )}
        </div>
    );
}
