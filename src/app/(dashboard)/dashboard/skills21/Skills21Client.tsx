'use client';

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
    ArrowUpRight,
    BarChart3,
    BookOpen,
    Briefcase,
    CalendarClock,
    Database,
    Globe2,
    GraduationCap,
    Lightbulb,
    Loader2,
    Newspaper,
    PieChart,
    Search,
    Sparkles,
    TrendingUp,
    Wand2
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Legend,
    Line,
    LineChart,
    Pie,
    PieChart as RechartsPieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis
} from 'recharts';
import {
    createTwentyFirstSkillAction,
    generateSkills21TrainingPlanAction,
    reclassifySkills21IndustriesAction,
    refreshSkills21WorldSignalsAction,
    syncSkillsFromMindOntologyAction,
    syncOccupationsFromBlsAction,
    syncSkillsFromEscoAction,
    toggleTwentyFirstSkillStatusAction
} from './actions';
import { useModals } from '@/components/ModalProvider';
import type { Skills21HomeInsightsResult } from '@/lib/skills21-home-insights-types';
import type { Skills21OccupationsInsightsResult } from '@/lib/skills21-occupations-insights-types';
import type { Skills21SkillsInsightsResult } from '@/lib/skills21-skills-insights-types';
import styles from './skills21.module.css';

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
    sourceProvider: string;
    sourceUri: string | null;
    sourceLanguage: string | null;
    sourceLastSyncedAt: string | null;
    createdAt: string;
    updatedAt: string;
    projectCount: number;
};

type OccupationForecast = {
    year: number;
    employmentCount: number;
    percentOfIndustry: number | null;
    percentOfOccupation: number | null;
};

type Occupation = {
    id: string;
    dataSource: string;
    geography: string;
    industryCode: string | null;
    occupationCode: string | null;
    occupationTitle: string;
    occupationType: string;
    qualificationLevel: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    forecasts: OccupationForecast[];
    skills: Array<{
        id: string;
        name: string;
        industry: string;
        category: string | null;
    }>;
};

type WorldSignal = {
    id: string;
    title: string;
    summary: string;
    sourceName: string;
    sourceType: string;
    sourceUrl: string;
    publishedAt: string;
    capturedAt: string;
    industry: string | null;
    occupationFocus: string | null;
    skillFocus: string | null;
    tags: string[];
    relevanceScore: number;
};

type WorldSyncState = {
    status: string;
    lastSyncAt: string | null;
    nextSyncAt: string | null;
    lastError: string | null;
} | null;

type TabKey = 'home' | 'skills' | 'occupations' | 'workspace';

const TAB_KEYS: TabKey[] = ['home', 'occupations', 'skills', 'workspace'];

function parseTabKey(value: string | null): TabKey | null {
    if (!value) return null;
    return TAB_KEYS.includes(value as TabKey) ? (value as TabKey) : null;
}

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

const CHART_PALETTE = ['#006D77', '#2A9D8F', '#8AB17D', '#E9C46A', '#F4A261', '#E76F51', '#264653', '#B56576'];

function formatOccupationSourceLabel(source: string) {
    if (source === 'US_BLS_Matrix') return 'BLS Matriz (CSV)';
    if (source === 'US_BLS_API_OE') return 'BLS API (OE)';
    if (source === 'EU_Forecast') return 'Proyección UE';
    return source;
}

function formatOccupationTypeLabel(type: string) {
    const normalized = type.trim().toLowerCase();
    if (normalized === 'summary') return 'Resumen';
    if (normalized === 'line item') return 'Detalle';
    if (normalized === 'serie bls') return 'Serie BLS';
    return type;
}

function formatSkillSourceProvider(provider: string) {
    if (provider === 'ESCO') return 'ESCO';
    if (provider === 'MIND_ONTOLOGY') return 'MIND';
    if (provider === 'MANUAL') return 'MANUAL';
    return provider;
}

function formatWorldSourceType(sourceType: string) {
    const normalized = sourceType.trim().toUpperCase();
    if (normalized === 'INVESTIGACION') return 'Investigación';
    if (normalized === 'BLOG') return 'Blog';
    return 'Noticia';
}

function formatIsoDateToSpanish(value: string | null) {
    if (!value) return 'N/D';
    return new Date(value).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function formatEmploymentThousands(value: number) {
    return `${new Intl.NumberFormat('es-CO', { maximumFractionDigits: 1 }).format(value)} mil`;
}

function formatCompactThousands(value: number) {
    return new Intl.NumberFormat('es-CO', {
        notation: 'compact',
        compactDisplay: 'short',
        maximumFractionDigits: 1
    }).format(value);
}

function toNumeric(value: unknown): number {
    if (Array.isArray(value) && value.length > 0) {
        return toNumeric(value[0]);
    }
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string') {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : 0;
    }
    return 0;
}

function formatOptionalPercent(value: number | null) {
    if (value === null || Number.isNaN(value)) return 'N/D';
    return `${new Intl.NumberFormat('es-CO', { maximumFractionDigits: 2 }).format(value)}%`;
}

function truncateLabel(value: string, size = 44) {
    return value.length > size ? `${value.slice(0, size)}…` : value;
}

function buildHomeInsightsQueryString(input: {
    demandYear: string;
    demandIndustry: string;
    demandGeography: string;
    skillsYear: string;
    skillsIndustry: string;
    skillsGeography: string;
    skillsOccupationId: string;
}) {
    const params = new URLSearchParams();
    params.set('demandYear', input.demandYear);
    params.set('demandIndustry', input.demandIndustry);
    params.set('demandGeography', input.demandGeography);
    params.set('skillsYear', input.skillsYear);
    params.set('skillsIndustry', input.skillsIndustry);
    params.set('skillsGeography', input.skillsGeography);
    params.set('skillsOccupationId', input.skillsOccupationId);
    return params.toString();
}

function formatIndustryBreakdownText(breakdown: unknown) {
    if (!breakdown || typeof breakdown !== 'object') return 'N/D';
    const entries = Object.entries(breakdown as Record<string, number>)
        .filter((entry) => typeof entry[0] === 'string' && typeof entry[1] === 'number')
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);
    if (entries.length === 0) return 'N/D';
    return entries.map(([industry, total]) => `${industry}: ${total}`).join(', ');
}

export default function Skills21Client({
    skills,
    occupations,
    occupationTotal,
    initialHomeInsights,
    initialOccupationsInsights,
    initialSkillsInsights,
    worldSignals,
    worldSyncState,
    worldIsStale,
    canManageSkills,
    canUploadOccupations,
    currentRole
}: {
    skills: Skill[];
    occupations: Occupation[];
    occupationTotal: number;
    initialHomeInsights: Skills21HomeInsightsResult;
    initialOccupationsInsights: Skills21OccupationsInsightsResult;
    initialSkillsInsights: Skills21SkillsInsightsResult;
    worldSignals: WorldSignal[];
    worldSyncState: WorldSyncState;
    worldIsStale: boolean;
    canManageSkills: boolean;
    canUploadOccupations: boolean;
    currentRole: string;
}) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const { showAlert } = useModals();
    const [isSkillPending, startSkillTransition] = useTransition();
    const [isBlsSyncPending, startBlsSyncTransition] = useTransition();
    const [isEscoSyncPending, startEscoSyncTransition] = useTransition();
    const [isMindSyncPending, startMindSyncTransition] = useTransition();
    const [isIndustrySegmentationPending, startIndustrySegmentationTransition] = useTransition();
    const [isWorldRefreshPending, startWorldRefreshTransition] = useTransition();
    const [isWorkspacePending, startWorkspaceTransition] = useTransition();
    const [isTabPending, startTabTransition] = useTransition();
    const [isHomeInsightsPending, startHomeInsightsTransition] = useTransition();
    const [isOccupationsInsightsPending, startOccupationsInsightsTransition] = useTransition();
    const [isSkillsInsightsPending, startSkillsInsightsTransition] = useTransition();
    const activeTab = parseTabKey(searchParams.get('tab')) || 'home';
    const blsSocCodesRef = useRef<HTMLTextAreaElement | null>(null);

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

    const [occupationSearch, setOccupationSearch] = useState('');
    const [occupationSourceFilter, setOccupationSourceFilter] = useState('ALL');
    const [occupationGeographyFilter, setOccupationGeographyFilter] = useState('ALL');
    const [occupationYearFilter, setOccupationYearFilter] = useState('ALL');
    const [blsIncremental, setBlsIncremental] = useState(true);
    const [blsStartYear, setBlsStartYear] = useState(new Date().getFullYear() - 5);
    const [blsEndYear, setBlsEndYear] = useState(new Date().getFullYear());
    const [blsMaxCodes, setBlsMaxCodes] = useState(120);
    const [blsIncludePopular, setBlsIncludePopular] = useState(true);
    const [blsDeactivateMissing, setBlsDeactivateMissing] = useState(false);
    const [blsCodesText, setBlsCodesText] = useState('');
    const [escoLanguage, setEscoLanguage] = useState('es');
    const [escoMaxSkills, setEscoMaxSkills] = useState(300);
    const [escoDeactivateMissing, setEscoDeactivateMissing] = useState(false);
    const [mindMaxSkills, setMindMaxSkills] = useState(1200);
    const [mindDeactivateMissing, setMindDeactivateMissing] = useState(false);

    const [homeDemandYearFilter, setHomeDemandYearFilter] = useState('AUTO');
    const [homeDemandIndustryFilter, setHomeDemandIndustryFilter] = useState('ALL');
    const [homeDemandGeographyFilter, setHomeDemandGeographyFilter] = useState('ALL');
    const [homeSkillsYearFilter, setHomeSkillsYearFilter] = useState('AUTO');
    const [homeSkillsIndustryFilter, setHomeSkillsIndustryFilter] = useState('ALL');
    const [homeSkillsGeographyFilter, setHomeSkillsGeographyFilter] = useState('ALL');
    const [homeSkillsOccupationFilter, setHomeSkillsOccupationFilter] = useState('ALL');
    const [homeInsights, setHomeInsights] = useState<Skills21HomeInsightsResult>(initialHomeInsights);
    const [isHomeInsightsLoading, setIsHomeInsightsLoading] = useState(false);

    const [occupationsInsights, setOccupationsInsights] = useState<Skills21OccupationsInsightsResult>(initialOccupationsInsights);
    const [isOccupationsInsightsLoading, setIsOccupationsInsightsLoading] = useState(false);

    const [skillsInsights, setSkillsInsights] = useState<Skills21SkillsInsightsResult>(initialSkillsInsights);
    const [isSkillsInsightsLoading, setIsSkillsInsightsLoading] = useState(false);

    const initialHomeInsightsRef = useRef(initialHomeInsights);
    const initialHomeInsightsQueryRef = useRef(buildHomeInsightsQueryString({
        demandYear: 'AUTO',
        demandIndustry: 'ALL',
        demandGeography: 'ALL',
        skillsYear: 'AUTO',
        skillsIndustry: 'ALL',
        skillsGeography: 'ALL',
        skillsOccupationId: 'ALL'
    }));

    const initialOccupationsInsightsRef = useRef(initialOccupationsInsights);
    const buildOccupationsInsightsQueryString = useCallback((input: { search: string; source: string; geo: string; year: string }) => {
        const p = new URLSearchParams();
        if (input.search) p.set('search', input.search.trim());
        p.set('source', input.source);
        p.set('geography', input.geo);
        p.set('year', input.year);
        return p.toString();
    }, []);
    const initialOccupationsInsightsQueryRef = useRef(buildOccupationsInsightsQueryString({
        search: '', source: 'ALL', geo: 'ALL', year: 'ALL'
    }));

    const initialSkillsInsightsRef = useRef(initialSkillsInsights);
    const buildSkillsInsightsQueryString = useCallback((input: { search: string; industry: string; category: string; showInactive: boolean }) => {
        const p = new URLSearchParams();
        if (input.search) p.set('search', input.search.trim());
        p.set('industry', input.industry);
        p.set('category', input.category);
        if (input.showInactive) p.set('showInactive', 'true');
        return p.toString();
    }, []);
    const initialSkillsInsightsQueryRef = useRef(buildSkillsInsightsQueryString({
        search: '', industry: 'ALL', category: 'ALL', showInactive: false
    }));

    const [workspaceOccupationId, setWorkspaceOccupationId] = useState('');
    const [workspaceSkillIds, setWorkspaceSkillIds] = useState<string[]>([]);
    const [workspaceAudience, setWorkspaceAudience] = useState('Estudiantes de educación media y superior');
    const [workspaceDurationWeeks, setWorkspaceDurationWeeks] = useState(8);
    const [workspaceObjective, setWorkspaceObjective] = useState('Desarrollar competencias aplicadas para empleabilidad del siglo XXI');
    const [workspaceContextNotes, setWorkspaceContextNotes] = useState('');
    const [workspacePlanMarkdown, setWorkspacePlanMarkdown] = useState('');

    const handleTabChange = useCallback((tab: TabKey) => {
        if (tab === activeTab) return;
        const params = new URLSearchParams(searchParams.toString());
        params.set('tab', tab);
        const query = params.toString();
        startTabTransition(() => {
            router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
        });
    }, [activeTab, pathname, router, searchParams, startTabTransition]);

    const homeInsightsQuery = useMemo(() => buildHomeInsightsQueryString({
        demandYear: homeDemandYearFilter,
        demandIndustry: homeDemandIndustryFilter,
        demandGeography: homeDemandGeographyFilter,
        skillsYear: homeSkillsYearFilter,
        skillsIndustry: homeSkillsIndustryFilter,
        skillsGeography: homeSkillsGeographyFilter,
        skillsOccupationId: homeSkillsOccupationFilter
    }), [
        homeDemandGeographyFilter,
        homeDemandIndustryFilter,
        homeDemandYearFilter,
        homeSkillsGeographyFilter,
        homeSkillsIndustryFilter,
        homeSkillsOccupationFilter,
        homeSkillsYearFilter
    ]);
    const hasInitialHomeInsights = Boolean(initialHomeInsights.meta.generatedAt);

    useEffect(() => {
        initialHomeInsightsRef.current = initialHomeInsights;
        if (homeInsightsQuery === initialHomeInsightsQueryRef.current && hasInitialHomeInsights) {
            setHomeInsights(initialHomeInsights);
        }
    }, [hasInitialHomeInsights, homeInsightsQuery, initialHomeInsights]);

    useEffect(() => {
        if (homeInsightsQuery === initialHomeInsightsQueryRef.current && hasInitialHomeInsights) {
            setHomeInsights(initialHomeInsightsRef.current);
            setIsHomeInsightsLoading(false);
            return;
        }

        const controller = new AbortController();
        setIsHomeInsightsLoading(true);

        const load = async () => {
            try {
                const response = await fetch(`/api/skills21/home-insights?${homeInsightsQuery}`, {
                    method: 'GET',
                    cache: 'no-store',
                    signal: controller.signal
                });
                if (!response.ok) {
                    throw new Error(`status=${response.status}`);
                }

                const data = await response.json() as Skills21HomeInsightsResult;
                if (controller.signal.aborted) return;
                setHomeInsights(data);
            } catch (error) {
                if (controller.signal.aborted) return;
                console.error('[Skills21Client] No se pudo actualizar Inicio:', error);
                void showAlert(
                    'Analítica no disponible',
                    'No se pudo actualizar la analítica de Inicio. Conservamos los datos más recientes cargados.',
                    'warning'
                );
            } finally {
                if (!controller.signal.aborted) {
                    setIsHomeInsightsLoading(false);
                }
            }
        };

        void load();

        return () => {
            controller.abort();
        };
    }, [hasInitialHomeInsights, homeInsightsQuery, showAlert]);

    const occupationsInsightsQuery = useMemo(() => buildOccupationsInsightsQueryString({
        search: occupationSearch,
        source: occupationSourceFilter,
        geo: occupationGeographyFilter,
        year: occupationYearFilter
    }), [buildOccupationsInsightsQueryString, occupationGeographyFilter, occupationSearch, occupationSourceFilter, occupationYearFilter]);
    const hasInitialOccupationsInsights = Boolean(initialOccupationsInsights.meta.generatedAt);

    useEffect(() => {
        initialOccupationsInsightsRef.current = initialOccupationsInsights;
        if (occupationsInsightsQuery === initialOccupationsInsightsQueryRef.current && hasInitialOccupationsInsights) {
            setOccupationsInsights(initialOccupationsInsights);
        }
    }, [hasInitialOccupationsInsights, occupationsInsightsQuery, initialOccupationsInsights]);

    useEffect(() => {
        if (occupationsInsightsQuery === initialOccupationsInsightsQueryRef.current && hasInitialOccupationsInsights) {
            setOccupationsInsights(initialOccupationsInsightsRef.current);
            setIsOccupationsInsightsLoading(false);
            return;
        }

        const controller = new AbortController();
        setIsOccupationsInsightsLoading(true);

        const load = async () => {
            try {
                const response = await fetch(`/api/skills21/occupations-insights?${occupationsInsightsQuery}`, {
                    method: 'GET',
                    cache: 'no-store',
                    signal: controller.signal
                });
                if (!response.ok) throw new Error(`status=${response.status}`);

                const data = await response.json() as Skills21OccupationsInsightsResult;
                if (controller.signal.aborted) return;
                setOccupationsInsights(data);
            } catch (error) {
                if (controller.signal.aborted) return;
                console.error('[Skills21Client] No se pudo actualizar Ocupaciones:', error);
            } finally {
                if (!controller.signal.aborted) setIsOccupationsInsightsLoading(false);
            }
        };

        void load();
        return () => { controller.abort(); };
    }, [hasInitialOccupationsInsights, occupationsInsightsQuery]);

    const skillsInsightsQuery = useMemo(() => buildSkillsInsightsQueryString({
        search,
        industry: industryFilter,
        category: categoryFilter,
        showInactive
    }), [buildSkillsInsightsQueryString, categoryFilter, industryFilter, search, showInactive]);
    const hasInitialSkillsInsights = Boolean(initialSkillsInsights.meta.generatedAt);

    useEffect(() => {
        initialSkillsInsightsRef.current = initialSkillsInsights;
        if (skillsInsightsQuery === initialSkillsInsightsQueryRef.current && hasInitialSkillsInsights) {
            setSkillsInsights(initialSkillsInsights);
        }
    }, [hasInitialSkillsInsights, skillsInsightsQuery, initialSkillsInsights]);

    useEffect(() => {
        if (skillsInsightsQuery === initialSkillsInsightsQueryRef.current && hasInitialSkillsInsights) {
            setSkillsInsights(initialSkillsInsightsRef.current);
            setIsSkillsInsightsLoading(false);
            return;
        }

        const controller = new AbortController();
        setIsSkillsInsightsLoading(true);

        const load = async () => {
            try {
                const response = await fetch(`/api/skills21/skills-insights?${skillsInsightsQuery}`, {
                    method: 'GET',
                    cache: 'no-store',
                    signal: controller.signal
                });
                if (!response.ok) throw new Error(`status=${response.status}`);

                const data = await response.json() as Skills21SkillsInsightsResult;
                if (controller.signal.aborted) return;
                setSkillsInsights(data);
            } catch (error) {
                if (controller.signal.aborted) return;
                console.error('[Skills21Client] No se pudo actualizar Habilidades:', error);
            } finally {
                if (!controller.signal.aborted) setIsSkillsInsightsLoading(false);
            }
        };

        void load();
        return () => { controller.abort(); };
    }, [hasInitialSkillsInsights, skillsInsightsQuery]);

    const industries = skillsInsights.meta.availableIndustries;
    const categories = skillsInsights.meta.availableCategories;

    const filteredSkills = useMemo(() => {
        const byId = new Map(skills.map(s => [s.id, s]));
        return skillsInsights.data.skillsList
            .map(s => byId.get(s.id))
            .filter((s): s is NonNullable<typeof s> => Boolean(s));
    }, [skills, skillsInsights.data.skillsList]);

    const filteredOccupations = useMemo(() => {
        const byId = new Map(occupations.map(o => [o.id, o]));
        return occupationsInsights.data.latestTableItems
            .map(item => byId.get(item.occupation.id))
            .filter((o): o is NonNullable<typeof o> => Boolean(o));
    }, [occupations, occupationsInsights.data.latestTableItems]);

    const occupationSources = occupationsInsights.meta.availableSources;
    const occupationGeographies = occupationsInsights.meta.availableGeographies;
    const occupationYears = occupationsInsights.meta.availableYears;

    const occupationLatestTable = useMemo(() => {
        const byId = new Map(occupations.map(o => [o.id, o]));
        return occupationsInsights.data.latestTableItems
            .map(item => {
                const fullOcc = byId.get(item.occupation.id);
                if (!fullOcc) return null;
                return {
                    ...item,
                    occupation: fullOcc
                };
            })
            .filter((item): item is NonNullable<typeof item> => Boolean(item));
    }, [occupations, occupationsInsights.data.latestTableItems]);

    const yearlyTrendData = occupationsInsights.data.yearlyTrendData;
    const topOccupationsChartData = occupationsInsights.data.topOccupationsChartData;
    const sourceDistributionData = occupationsInsights.data.sourceDistributionData.map(d => ({ source: d.label, total: d.total }));
    const geographyDistributionData = occupationsInsights.data.geographyDistributionData.map(d => ({ geography: d.label, total: d.total }));
    const occupationGeoIndustryMap = occupationsInsights.data.geoIndustryMap;

    const skillsByIndustryData = skillsInsights.data.industryDistribution.map(d => ({ industry: d.label, total: d.total }));
    const skillsBySourceData = skillsInsights.data.sourceDistribution.map(d => ({ source: d.label, total: d.total }));

    const homeSelectedDemandYear = homeInsights.demand.selectedYear;
    const homeDemandRowCount = homeInsights.demand.rowCount;
    const homeTopDemandedOccupations = homeInsights.demand.topOccupations;
    const homeLowestSupplyOccupations = homeInsights.demand.lowestSupply;
    const homeDemandChartData = homeInsights.demand.chartData;
    const homeSkillScopeOccupationCount = homeInsights.skills.scopeOccupationCount;
    const homeSkillsOccupationOptions = homeInsights.skills.occupationOptions;
    const homeTopSkillsDemand = homeInsights.skills.topSkills;
    const homeTopSkillsChartData = homeInsights.skills.chartData;

    const worldSourceTypeData = useMemo(() => {
        const byType = new Map<string, number>();
        for (const item of worldSignals) {
            const key = formatWorldSourceType(item.sourceType);
            byType.set(key, (byType.get(key) || 0) + 1);
        }
        return Array.from(byType.entries())
            .map(([sourceType, total]) => ({ sourceType, total }))
            .sort((a, b) => b.total - a.total);
    }, [worldSignals]);

    const topWorldTagsData = useMemo(() => {
        const byTag = new Map<string, number>();
        for (const signal of worldSignals) {
            for (const tag of signal.tags || []) {
                const normalized = tag.trim().toLowerCase();
                if (!normalized) continue;
                byTag.set(normalized, (byTag.get(normalized) || 0) + 1);
            }
        }
        return Array.from(byTag.entries())
            .map(([tag, total]) => ({ tag, total }))
            .sort((a, b) => b.total - a.total)
            .slice(0, 10);
    }, [worldSignals]);

    const workspaceOccupationOptions = useMemo(() => {
        return filteredOccupations
            .slice(0, 180)
            .map((occupation) => ({
                id: occupation.id,
                label: `${occupation.occupationTitle} (${occupation.geography})`,
                occupation
            }));
    }, [filteredOccupations]);

    const workspaceSelectedOccupation = useMemo(
        () => workspaceOccupationOptions.find((option) => option.id === workspaceOccupationId)?.occupation || null,
        [workspaceOccupationOptions, workspaceOccupationId]
    );

    const workspaceCandidateSkills = useMemo(() => {
        const byId = new Map(skills.map((skill) => [skill.id, skill]));
        const candidates: Skill[] = [];
        const seen = new Set<string>();

        if (workspaceSelectedOccupation) {
            for (const linked of workspaceSelectedOccupation.skills) {
                const found = byId.get(linked.id);
                if (found && !seen.has(found.id) && found.isActive) {
                    candidates.push(found);
                    seen.add(found.id);
                }
            }
        }

        const topByTrend = [...skills]
            .filter((skill) => skill.isActive)
            .sort((a, b) => b.projectCount - a.projectCount)
            .slice(0, 24);
        for (const skill of topByTrend) {
            if (seen.has(skill.id)) continue;
            candidates.push(skill);
            seen.add(skill.id);
            if (candidates.length >= 28) break;
        }

        return candidates;
    }, [skills, workspaceSelectedOccupation]);

    const workspaceTopTrendSkillIds = useMemo(() => {
        return [...skills]
            .filter((skill) => skill.isActive)
            .sort((a, b) => b.projectCount - a.projectCount)
            .slice(0, 12)
            .map((skill) => skill.id);
    }, [skills]);

    const activeCount = skills.filter((skill) => skill.isActive).length;
    const totalAssociations = skills.reduce((acc, skill) => acc + skill.projectCount, 0);
    const totalForecasts = occupations.reduce((acc, occupation) => acc + occupation.forecasts.length, 0);
    const linkedOccupations = occupations.filter((occupation) => occupation.skills.length > 0).length;

    const handleCreate = () => {
        startSkillTransition(async () => {
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
        startSkillTransition(async () => {
            const result = await toggleTwentyFirstSkillStatusAction(skill.id, !skill.isActive);
            if (!result.success) {
                await showAlert('Error', result.error || 'No se pudo actualizar el estado.', 'error');
                return;
            }

            router.refresh();
        });
    };

    const handleSyncEsco = () => {
        startEscoSyncTransition(async () => {
            const result = await syncSkillsFromEscoAction({
                language: escoLanguage,
                maxSkills: escoMaxSkills,
                deactivateMissing: escoDeactivateMissing
            });

            if (!result.success) {
                await showAlert('Error de sincronización', result.error || 'No se pudo sincronizar ESCO.', 'error');
                return;
            }

            const stats = result.stats;
            if (!stats) {
                await showAlert('Sincronización incompleta', 'La respuesta no incluyó estadísticas.', 'warning');
                return;
            }

            await showAlert(
                'Sincronización ESCO completada',
                [
                    `Idioma: ${stats.language}`,
                    `Disponibles en ESCO: ${stats.totalAvailable}`,
                    `Leídas: ${stats.fetched}`,
                    `Sincronizadas: ${stats.synced}`,
                    `Creadas: ${stats.created}`,
                    `Actualizadas: ${stats.updated}`,
                    `Renombradas por unicidad: ${stats.renamedForUniqueness}`,
                    `Desactivadas: ${stats.deactivated}`,
                    `Clasificadas con IA: ${stats.industryClassifiedWithAi ?? 0}`,
                    `Clasificadas por heurística: ${stats.industryClassifiedWithHeuristic ?? 0}`,
                    `Industrias detectadas: ${formatIndustryBreakdownText(stats.industryBreakdown)}`
                ].join('\n'),
                'success'
            );

            router.refresh();
        });
    };

    const handleSyncMind = () => {
        startMindSyncTransition(async () => {
            const result = await syncSkillsFromMindOntologyAction({
                maxSkills: mindMaxSkills,
                deactivateMissing: mindDeactivateMissing
            });

            if (!result.success) {
                await showAlert('Error de sincronización', result.error || 'No se pudo sincronizar MIND Tech Ontology.', 'error');
                return;
            }

            const stats = result.stats;
            if (!stats) {
                await showAlert('Sincronización incompleta', 'La respuesta no incluyó estadísticas.', 'warning');
                return;
            }

            await showAlert(
                'Sincronización MIND completada',
                [
                    `Fuente: ${stats.sourceUrl}`,
                    `Disponibles en ontología: ${stats.totalAvailable}`,
                    `Sincronizadas: ${stats.synced}`,
                    `Creadas: ${stats.created}`,
                    `Actualizadas: ${stats.updated}`,
                    `Renombradas por unicidad: ${stats.renamedForUniqueness}`,
                    `Desactivadas: ${stats.deactivated}`,
                    `Clasificadas con IA: ${stats.industryClassifiedWithAi ?? 0}`,
                    `Clasificadas por heurística: ${stats.industryClassifiedWithHeuristic ?? 0}`,
                    `Industrias detectadas: ${formatIndustryBreakdownText(stats.industryBreakdown)}`
                ].join('\n'),
                'success'
            );

            router.refresh();
        });
    };

    const handleReclassifyIndustries = () => {
        startIndustrySegmentationTransition(async () => {
            const result = await reclassifySkills21IndustriesAction({
                maxSkills: 2400,
                onlyPlaceholders: false,
                includeInactive: true,
                providers: ['ESCO', 'MIND_ONTOLOGY', 'MANUAL']
            });

            if (!result.success) {
                await showAlert('Error de segmentación', result.error || 'No se pudo reclasificar industrias con IA.', 'error');
                return;
            }

            const stats = result.stats;
            if (!stats) {
                await showAlert('Segmentación incompleta', 'La respuesta no incluyó estadísticas.', 'warning');
                return;
            }

            const topIndustries = Object.entries(stats.industryBreakdown || {})
                .slice(0, 6)
                .map(([industry, total]) => `${industry}: ${total}`)
                .join('\n');

            await showAlert(
                'Segmentación por industria completada',
                [
                    `Habilidades analizadas: ${stats.targeted}`,
                    `Actualizadas: ${stats.updated}`,
                    `Sin cambios: ${stats.unchanged}`,
                    `Clasificadas con IA: ${stats.industryClassifiedWithAi}`,
                    `Clasificadas por heurística: ${stats.industryClassifiedWithHeuristic}`,
                    topIndustries ? `Distribución principal:\n${topIndustries}` : 'Distribución principal: N/D'
                ].join('\n'),
                'success'
            );

            router.refresh();
        });
    };

    const handleSyncBlsOccupations = () => {
        startBlsSyncTransition(async () => {
            const result = await syncOccupationsFromBlsAction({
                incremental: blsIncremental,
                startYear: blsStartYear,
                endYear: blsEndYear,
                maxCodes: blsMaxCodes,
                includePopular: blsIncludePopular,
                codesText: blsCodesText,
                deactivateMissing: blsDeactivateMissing
            });

            if (!result.success) {
                await showAlert('Error de sincronización', result.error || 'No se pudo sincronizar ocupaciones desde BLS.', 'error');
                return;
            }

            if (!result.stats) {
                await showAlert('Sincronización incompleta', 'La respuesta no incluyó estadísticas.', 'warning');
                return;
            }

            const stats = result.stats;
            await showAlert(
                'Sincronización BLS completada',
                [
                    `Modo: ${stats.mode === 'incremental' ? 'Incremental' : 'Completo'}`,
                    `Rango anual aplicado: ${stats.startYear}-${stats.endYear}`,
                    `SOC solicitados: ${stats.requestedSocCodes}`,
                    `Series consultadas: ${stats.seriesRequested}`,
                    `Series con datos: ${stats.seriesWithData}`,
                    `Series sin datos: ${stats.seriesWithoutData}`,
                    `Ocupaciones sincronizadas: ${stats.occupationsSynced}`,
                    `Ocupaciones creadas: ${stats.occupationsCreated}`,
                    `Ocupaciones actualizadas: ${stats.occupationsUpdated}`,
                    `Proyecciones escritas: ${stats.forecastRowsWritten}`,
                    `Vínculos ocupación-habilidad: ${stats.linkedOccupations}`,
                    `Relaciones creadas/actualizadas: ${stats.updatedOccupationLinks ?? 0}`
                ].join('\n'),
                'success'
            );

            router.refresh();
        });
    };

    const handleRefreshWorldSignals = () => {
        startWorldRefreshTransition(async () => {
            const result = await refreshSkills21WorldSignalsAction({ force: true });
            if (!result.success) {
                await showAlert('Error de actualización', result.error || 'No se pudo actualizar la sección Esto está pasando en el mundo.', 'error');
                return;
            }

            await showAlert(
                'Novedades actualizadas',
                [
                    `Refresco ejecutado: ${result.stats?.refreshed ? 'Sí' : 'No'}`,
                    `Señales sincronizadas: ${result.stats?.synced ?? 0}`,
                    `Señales visibles: ${result.stats?.visibleSignals ?? 0}`,
                    `Última sincronización: ${result.stats?.lastSyncAt ? formatIsoDateToSpanish(result.stats.lastSyncAt) : 'N/D'}`,
                    `Próxima actualización automática: ${result.stats?.nextSyncAt ? formatIsoDateToSpanish(result.stats.nextSyncAt) : 'N/D'}`
                ].join('\n'),
                'success'
            );

            router.refresh();
        });
    };

    const handleToggleWorkspaceSkill = (skillId: string) => {
        setWorkspaceSkillIds((prev) => {
            if (prev.includes(skillId)) return prev.filter((id) => id !== skillId);
            if (prev.length >= 12) return prev;
            return [...prev, skillId];
        });
    };

    const handleSuggestSkillsByOccupation = () => {
        if (!workspaceSelectedOccupation) {
            void showAlert('Selecciona ocupación', 'Elige una ocupación para sugerir habilidades relacionadas.', 'warning');
            return;
        }

        const suggestedIds: string[] = [];
        for (const linked of workspaceSelectedOccupation.skills) {
            if (!workspaceCandidateSkills.some((candidate) => candidate.id === linked.id)) continue;
            if (suggestedIds.includes(linked.id)) continue;
            suggestedIds.push(linked.id);
            if (suggestedIds.length >= 12) break;
        }

        if (suggestedIds.length < 12) {
            for (const candidate of workspaceCandidateSkills) {
                if (suggestedIds.includes(candidate.id)) continue;
                suggestedIds.push(candidate.id);
                if (suggestedIds.length >= 12) break;
            }
        }

        setWorkspaceSkillIds(suggestedIds);
    };

    const handleSelectTopTrendSkills = () => {
        setWorkspaceSkillIds(workspaceTopTrendSkillIds);
    };

    const handleClearWorkspaceSelection = () => {
        setWorkspaceSkillIds([]);
    };

    const handleGenerateWorkspacePlan = () => {
        startWorkspaceTransition(async () => {
            const result = await generateSkills21TrainingPlanAction({
                occupationId: workspaceOccupationId || undefined,
                skillIds: workspaceSkillIds,
                audience: workspaceAudience,
                durationWeeks: workspaceDurationWeeks,
                objective: workspaceObjective,
                contextNotes: workspaceContextNotes
            });

            if (!result.success || !result.planMarkdown) {
                await showAlert('Error en generación', result.error || 'No se pudo construir el plan con IA.', 'error');
                return;
            }

            setWorkspacePlanMarkdown(result.planMarkdown);
            await showAlert(
                'Plan generado',
                `Se generó el plan con ${result.meta?.usedSkills || workspaceSkillIds.length} habilidad(es).`,
                'success'
            );
        });
    };

    const handleResetSkillFilters = () => {
        setSearch('');
        setIndustryFilter('ALL');
        setCategoryFilter('ALL');
        setShowInactive(false);
    };

    const handleResetHomeDemandFilters = () => {
        startHomeInsightsTransition(() => {
            setHomeDemandYearFilter('AUTO');
            setHomeDemandIndustryFilter('ALL');
            setHomeDemandGeographyFilter('ALL');
        });
    };

    const handleResetHomeSkillsFilters = () => {
        startHomeInsightsTransition(() => {
            setHomeSkillsYearFilter('AUTO');
            setHomeSkillsIndustryFilter('ALL');
            setHomeSkillsGeographyFilter('ALL');
            setHomeSkillsOccupationFilter('ALL');
        });
    };

    const handleResetOccupationFilters = () => {
        setOccupationSearch('');
        setOccupationSourceFilter('ALL');
        setOccupationGeographyFilter('ALL');
        setOccupationYearFilter('ALL');
    };

    const handleCopyWorkspacePlan = async () => {
        if (!workspacePlanMarkdown.trim()) {
            await showAlert('Sin contenido', 'Primero genera un plan para poder copiarlo.', 'warning');
            return;
        }
        if (typeof navigator === 'undefined' || !navigator.clipboard) {
            await showAlert('Copia no disponible', 'El navegador no permite acceso al portapapeles en este contexto.', 'warning');
            return;
        }

        try {
            await navigator.clipboard.writeText(workspacePlanMarkdown);
            await showAlert('Plan copiado', 'El plan fue copiado al portapapeles.', 'success');
        } catch {
            await showAlert('No se pudo copiar', 'Ocurrió un error al copiar el plan.', 'error');
        }
    };

    const handleDownloadWorkspacePlan = () => {
        if (!workspacePlanMarkdown.trim()) {
            void showAlert('Sin contenido', 'Primero genera un plan para descargarlo.', 'warning');
            return;
        }

        const occupationLabel = workspaceSelectedOccupation?.occupationTitle || 'formacion';
        const normalized = occupationLabel
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '')
            .slice(0, 40);
        const fileName = `plan-${normalized || 'formacion'}-sxxi.md`;

        const blob = new Blob([workspacePlanMarkdown], { type: 'text/markdown;charset=utf-8' });
        const downloadUrl = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = downloadUrl;
        anchor.download = fileName;
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
        URL.revokeObjectURL(downloadUrl);
    };

    return (
        <div className={`space-y-8 ${styles.canvas}`}>
            <header className={`flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 ${styles.heroHeader}`}>
                <div>
                    <h1 className={`text-3xl font-black text-slate-900 flex items-center gap-3 ${styles.heroTitle}`}>
                        <Sparkles className="w-8 h-8 text-indigo-600" />
                        Ocupaciones y habilidades del Siglo XXI
                    </h1>
                    <p className={`text-slate-500 mt-2 max-w-3xl ${styles.heroSubtitle}`}>
                        Repositorio integrado de ocupaciones proyectadas y habilidades en tendencia, conectado para diseño de proyectos, retos y problemas.
                    </p>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 w-full lg:w-auto">
                    <div className={`bg-white border border-slate-200 rounded-xl px-4 py-3 text-center ${styles.statCard}`}>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Habilidades</p>
                        <p className="text-lg font-black text-slate-900">{skills.length}</p>
                    </div>
                    <div className={`bg-white border border-slate-200 rounded-xl px-4 py-3 text-center ${styles.statCard}`}>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Ocupaciones</p>
                        <p className="text-lg font-black text-slate-900">{occupationTotal}</p>
                    </div>
                    <div className={`bg-white border border-slate-200 rounded-xl px-4 py-3 text-center ${styles.statCard}`}>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Vinculadas</p>
                        <p className="text-lg font-black text-emerald-700">{linkedOccupations}</p>
                    </div>
                    <div className={`bg-white border border-slate-200 rounded-xl px-4 py-3 text-center ${styles.statCard}`}>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Proyecciones</p>
                        <p className="text-lg font-black text-indigo-700">{totalForecasts}</p>
                    </div>
                </div>
            </header>

            <section className={`bg-white border border-slate-200 rounded-2xl p-2 ${styles.tabDock}`}>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                    <button
                        onClick={() => handleTabChange('home')}
                        className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-colors ${styles.tabButton} ${activeTab === 'home'
                            ? styles.tabButtonActive
                            : styles.tabButtonIdle
                            }`}
                    >
                        Inicio
                    </button>
                    <button
                        onClick={() => handleTabChange('occupations')}
                        className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-colors ${styles.tabButton} ${activeTab === 'occupations'
                            ? styles.tabButtonActive
                            : styles.tabButtonIdle
                            }`}
                    >
                        Ocupaciones
                    </button>
                    <button
                        onClick={() => handleTabChange('skills')}
                        className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-colors ${styles.tabButton} ${activeTab === 'skills'
                            ? styles.tabButtonActive
                            : styles.tabButtonIdle
                            }`}
                    >
                        Habilidades
                    </button>
                    <button
                        onClick={() => handleTabChange('workspace')}
                        className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-colors ${styles.tabButton} ${activeTab === 'workspace'
                            ? styles.tabButtonActive
                            : styles.tabButtonIdle
                            }`}
                    >
                        Área de trabajo
                    </button>
                </div>
            </section>

            {isTabPending && (
                <div className="bg-indigo-50 border border-indigo-200 rounded-xl px-3 py-2 text-xs text-indigo-700 font-semibold inline-flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Cargando sección...
                </div>
            )}

            {activeTab === 'home' && (
                <div className="space-y-5">
                    {(isHomeInsightsPending || isHomeInsightsLoading) && (
                        <div className="bg-sky-50 border border-sky-200 rounded-xl px-3 py-2 text-xs text-sky-700 font-semibold inline-flex items-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Actualizando analítica de Inicio...
                        </div>
                    )}

                    <section className="bg-white border border-slate-200 rounded-2xl p-4 md:p-5 space-y-4">
                        <div className="flex items-center justify-between gap-3 flex-wrap">
                            <div>
                                <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                                    <Briefcase className="w-4 h-4 text-indigo-600" />
                                    Ocupaciones más demandadas y menor oferta
                                </h2>
                                <p className="text-xs text-slate-500 mt-1">
                                    Consulta por año, industria y región con base en la proyección de empleo.
                                </p>
                            </div>
                            <button
                                onClick={handleResetHomeDemandFilters}
                                className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors"
                            >
                                Limpiar filtros
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <select
                                value={homeDemandYearFilter}
                                onChange={(event) => startHomeInsightsTransition(() => setHomeDemandYearFilter(event.target.value))}
                                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm outline-none focus:ring-2 focus:ring-indigo-100"
                            >
                                <option value="AUTO">Año más reciente ({homeInsights.meta.latestOccupationYear || 'N/D'})</option>
                                {homeInsights.meta.occupationYears.map((year) => (
                                    <option key={`home-demand-year-${year}`} value={String(year)}>{year}</option>
                                ))}
                            </select>

                            <select
                                value={homeDemandIndustryFilter}
                                onChange={(event) => startHomeInsightsTransition(() => setHomeDemandIndustryFilter(event.target.value))}
                                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm outline-none focus:ring-2 focus:ring-indigo-100"
                            >
                                <option value="ALL">Todas las industrias</option>
                                {homeInsights.meta.occupationIndustries.map((industry) => (
                                    <option key={`home-demand-industry-${industry}`} value={industry}>{industry}</option>
                                ))}
                            </select>

                            <select
                                value={homeDemandGeographyFilter}
                                onChange={(event) => startHomeInsightsTransition(() => setHomeDemandGeographyFilter(event.target.value))}
                                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm outline-none focus:ring-2 focus:ring-indigo-100"
                            >
                                <option value="ALL">Todas las regiones</option>
                                {homeInsights.meta.occupationGeographies.map((geography) => (
                                    <option key={`home-demand-geo-${geography}`} value={geography}>{geography}</option>
                                ))}
                            </select>
                        </div>

                        <div className="text-xs text-slate-500">
                            Registros analizados: {homeDemandRowCount} · Año activo: {homeSelectedDemandYear || 'N/D'}
                        </div>

                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                            <article className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-4">
                                <h3 className="text-sm font-black text-emerald-800 mb-3">Top ocupaciones más demandadas</h3>
                                {homeTopDemandedOccupations.length === 0 ? (
                                    <p className="text-sm text-slate-500">No hay datos con los filtros actuales.</p>
                                ) : (
                                    <div className="space-y-2">
                                        <div className="h-52">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={homeDemandChartData}>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="#D1FAE5" />
                                                    <XAxis dataKey="occupationShort" tick={{ fill: '#065F46', fontSize: 10 }} />
                                                    <YAxis tick={{ fill: '#065F46', fontSize: 11 }} tickFormatter={formatCompactThousands} />
                                                    <Tooltip formatter={(value) => [formatEmploymentThousands(toNumeric(value)), 'Demanda']} />
                                                    <Bar dataKey="employmentCount" fill="#10B981" radius={[6, 6, 0, 0]} />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-xs">
                                                <thead className="text-emerald-800">
                                                    <tr>
                                                        <th className="text-left py-1.5">Ocupación</th>
                                                        <th className="text-right py-1.5">Demanda</th>
                                                        <th className="text-left py-1.5">Región</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {homeTopDemandedOccupations.slice(0, 8).map((row) => (
                                                        <tr key={`home-demand-top-${row.id}`} className="border-t border-emerald-100">
                                                            <td className="py-1.5 text-slate-800">
                                                                {truncateLabel(row.occupationTitle, 56)}
                                                            </td>
                                                            <td className="py-1.5 text-right font-semibold text-slate-900">
                                                                {formatEmploymentThousands(row.employmentCount)}
                                                            </td>
                                                            <td className="py-1.5 text-slate-600">{row.geography}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                            </article>

                            <article className="rounded-2xl border border-amber-200 bg-amber-50/40 p-4">
                                <h3 className="text-sm font-black text-amber-800 mb-3">Ocupaciones con menor oferta</h3>
                                {homeLowestSupplyOccupations.length === 0 ? (
                                    <p className="text-sm text-slate-500">No hay datos con los filtros actuales.</p>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-xs">
                                            <thead className="text-amber-800">
                                                <tr>
                                                    <th className="text-left py-1.5">Ocupación</th>
                                                    <th className="text-right py-1.5">Oferta</th>
                                                    <th className="text-left py-1.5">Industria</th>
                                                    <th className="text-left py-1.5">Región</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {homeLowestSupplyOccupations.map((row) => (
                                                    <tr key={`home-demand-low-${row.id}`} className="border-t border-amber-100">
                                                        <td className="py-1.5 text-slate-800">{truncateLabel(row.occupationTitle, 54)}</td>
                                                        <td className="py-1.5 text-right font-semibold text-slate-900">{formatEmploymentThousands(row.employmentCount)}</td>
                                                        <td className="py-1.5 text-slate-600">{row.industry}</td>
                                                        <td className="py-1.5 text-slate-600">{row.geography}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </article>
                        </div>
                    </section>

                    <section className="bg-white border border-slate-200 rounded-2xl p-4 md:p-5 space-y-4">
                        <div className="flex items-center justify-between gap-3 flex-wrap">
                            <div>
                                <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                                    <BarChart3 className="w-4 h-4 text-indigo-600" />
                                    Top 50 habilidades más demandadas
                                </h2>
                                <p className="text-xs text-slate-500 mt-1">
                                    Filtro por industria, ocupación y región para priorizar competencias con mayor peso de empleo.
                                </p>
                            </div>
                            <button
                                onClick={handleResetHomeSkillsFilters}
                                className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors"
                            >
                                Limpiar filtros
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                            <select
                                value={homeSkillsYearFilter}
                                onChange={(event) => startHomeInsightsTransition(() => setHomeSkillsYearFilter(event.target.value))}
                                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm outline-none focus:ring-2 focus:ring-indigo-100"
                            >
                                <option value="AUTO">Año más reciente ({homeInsights.meta.latestOccupationYear || 'N/D'})</option>
                                {homeInsights.meta.occupationYears.map((year) => (
                                    <option key={`home-skills-year-${year}`} value={String(year)}>{year}</option>
                                ))}
                            </select>

                            <select
                                value={homeSkillsIndustryFilter}
                                onChange={(event) => startHomeInsightsTransition(() => {
                                    setHomeSkillsIndustryFilter(event.target.value);
                                    setHomeSkillsOccupationFilter('ALL');
                                })}
                                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm outline-none focus:ring-2 focus:ring-indigo-100"
                            >
                                <option value="ALL">Todas las industrias</option>
                                {homeInsights.meta.occupationIndustries.map((industry) => (
                                    <option key={`home-skills-industry-${industry}`} value={industry}>{industry}</option>
                                ))}
                            </select>

                            <select
                                value={homeSkillsGeographyFilter}
                                onChange={(event) => startHomeInsightsTransition(() => {
                                    setHomeSkillsGeographyFilter(event.target.value);
                                    setHomeSkillsOccupationFilter('ALL');
                                })}
                                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm outline-none focus:ring-2 focus:ring-indigo-100"
                            >
                                <option value="ALL">Todas las regiones</option>
                                {homeInsights.meta.occupationGeographies.map((geography) => (
                                    <option key={`home-skills-geo-${geography}`} value={geography}>{geography}</option>
                                ))}
                            </select>

                            <select
                                value={homeSkillsOccupationFilter}
                                onChange={(event) => startHomeInsightsTransition(() => setHomeSkillsOccupationFilter(event.target.value))}
                                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm outline-none focus:ring-2 focus:ring-indigo-100"
                            >
                                <option value="ALL">Todas las ocupaciones</option>
                                {homeSkillsOccupationOptions.map((option) => (
                                    <option key={`home-skills-occ-${option.id}`} value={option.id}>{option.label}</option>
                                ))}
                            </select>
                        </div>

                        <div className="text-xs text-slate-500">
                            Ocupaciones en alcance: {homeSkillScopeOccupationCount} · Habilidades listadas: {homeTopSkillsDemand.length}
                        </div>

                        {homeTopSkillsDemand.length === 0 ? (
                            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-500">
                                No hay habilidades demandadas para los filtros seleccionados.
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <div className="h-72">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={homeTopSkillsChartData}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                                            <XAxis dataKey="skillShort" tick={{ fill: '#64748B', fontSize: 11 }} />
                                            <YAxis tick={{ fill: '#64748B', fontSize: 11 }} tickFormatter={formatCompactThousands} />
                                            <Tooltip formatter={(value) => [formatEmploymentThousands(toNumeric(value)), 'Demanda agregada']} />
                                            <Bar dataKey="demand" fill="#0EA5E9" radius={[6, 6, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                                    <table className="w-full text-xs min-w-[760px]">
                                        <thead className="bg-slate-50 text-slate-600">
                                            <tr>
                                                <th className="text-left px-3 py-2.5 font-bold">#</th>
                                                <th className="text-left px-3 py-2.5 font-bold">Habilidad</th>
                                                <th className="text-left px-3 py-2.5 font-bold">Industria habilidad</th>
                                                <th className="text-right px-3 py-2.5 font-bold">Demanda agregada</th>
                                                <th className="text-right px-3 py-2.5 font-bold">Ocupaciones</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {homeTopSkillsDemand.map((row, index) => (
                                                <tr key={`home-top-skill-${row.id}`} className="border-t border-slate-100">
                                                    <td className="px-3 py-2.5 text-slate-500">{index + 1}</td>
                                                    <td className="px-3 py-2.5 font-semibold text-slate-900">{row.name}</td>
                                                    <td className="px-3 py-2.5 text-slate-600">{row.industry}</td>
                                                    <td className="px-3 py-2.5 text-right font-semibold text-slate-900">{formatEmploymentThousands(row.demand)}</td>
                                                    <td className="px-3 py-2.5 text-right text-slate-600">{row.occupationCount}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </section>

                    <section className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <button
                            onClick={() => handleTabChange('occupations')}
                            className="text-left rounded-2xl border border-slate-200 bg-white px-4 py-4 hover:border-indigo-300 hover:bg-indigo-50 transition-colors"
                        >
                            <p className="text-[10px] font-black uppercase tracking-wider text-indigo-600">Análisis</p>
                            <h3 className="mt-1 text-sm font-black text-slate-900 flex items-center gap-2">
                                <Briefcase className="w-4 h-4 text-indigo-600" />
                                Ir a Ocupaciones
                            </h3>
                            <p className="mt-2 text-xs text-slate-600">Explora mapa geográfico-industrial, proyecciones y fichas técnicas.</p>
                        </button>
                        <button
                            onClick={() => handleTabChange('skills')}
                            className="text-left rounded-2xl border border-slate-200 bg-white px-4 py-4 hover:border-cyan-300 hover:bg-cyan-50 transition-colors"
                        >
                            <p className="text-[10px] font-black uppercase tracking-wider text-cyan-600">Competencias</p>
                            <h3 className="mt-1 text-sm font-black text-slate-900 flex items-center gap-2">
                                <BookOpen className="w-4 h-4 text-cyan-600" />
                                Ir a Habilidades
                            </h3>
                            <p className="mt-2 text-xs text-slate-600">Filtra por industria u ocupación y revisa tablas con fuentes.</p>
                        </button>
                        <button
                            onClick={() => handleTabChange('workspace')}
                            className="text-left rounded-2xl border border-slate-200 bg-white px-4 py-4 hover:border-emerald-300 hover:bg-emerald-50 transition-colors"
                        >
                            <p className="text-[10px] font-black uppercase tracking-wider text-emerald-700">Planeación IA</p>
                            <h3 className="mt-1 text-sm font-black text-slate-900 flex items-center gap-2">
                                <GraduationCap className="w-4 h-4 text-emerald-700" />
                                Ir al Área de trabajo
                            </h3>
                            <p className="mt-2 text-xs text-slate-600">Crea y exporta planes formativos con apoyo de IA.</p>
                        </button>
                    </section>

                    <section className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                        <article className="xl:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
                            <div className="flex items-start justify-between gap-3 flex-wrap">
                                <div>
                                    <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                                        <Newspaper className="w-4 h-4 text-indigo-600" />
                                        Esto está pasando en el mundo
                                    </h2>
                                    <p className="text-xs text-slate-500 mt-1">
                                        Señales de tendencias (último mes) sobre ocupaciones, competencias y habilidades con fuentes referenciadas.
                                    </p>
                                    <p className="text-xs text-slate-500 mt-1">
                                        Última actualización: {formatIsoDateToSpanish(worldSyncState?.lastSyncAt || null)} ·
                                        Próxima automática: {formatIsoDateToSpanish(worldSyncState?.nextSyncAt || null)}
                                    </p>
                                </div>

                                {canUploadOccupations && (
                                    <button
                                        onClick={handleRefreshWorldSignals}
                                        disabled={isWorldRefreshPending}
                                        className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition-colors disabled:opacity-60"
                                    >
                                        {isWorldRefreshPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe2 className="w-4 h-4" />}
                                        Actualizar ahora
                                    </button>
                                )}
                            </div>

                            {worldSyncState?.lastError && (
                                <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                                    Último error de sincronización: {worldSyncState.lastError}
                                </div>
                            )}

                            {worldIsStale && (
                                <div className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-xs text-sky-800">
                                    La sección está marcada para actualización automática quincenal.
                                </div>
                            )}

                            {worldSignals.length === 0 ? (
                                <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-500">
                                    No hay señales recientes disponibles todavía.
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {worldSignals.slice(0, 10).map((signal) => (
                                        <article key={signal.id} className="rounded-xl border border-slate-200 bg-white p-4">
                                            <div className="flex flex-wrap items-center gap-2 mb-2">
                                                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full bg-slate-100 text-slate-700">
                                                    {formatWorldSourceType(signal.sourceType)}
                                                </span>
                                                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full bg-indigo-100 text-indigo-700">
                                                    {signal.sourceName}
                                                </span>
                                                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full bg-emerald-100 text-emerald-700">
                                                    {new Date(signal.publishedAt).toLocaleDateString('es-ES')}
                                                </span>
                                            </div>
                                            <h3 className="font-bold text-slate-900">
                                                <Link href={signal.sourceUrl} target="_blank" rel="noopener noreferrer" className="hover:underline inline-flex items-center gap-1">
                                                    {signal.title}
                                                    <ArrowUpRight className="w-3.5 h-3.5 text-slate-500" />
                                                </Link>
                                            </h3>
                                            <p className="text-sm text-slate-600 mt-2">{signal.summary}</p>
                                            {(signal.industry || signal.occupationFocus || signal.skillFocus) && (
                                                <p className="text-xs text-slate-500 mt-2">
                                                    {signal.industry ? `Industria: ${signal.industry}` : ''}
                                                    {signal.occupationFocus ? ` · Ocupación: ${signal.occupationFocus}` : ''}
                                                    {signal.skillFocus ? ` · Habilidad: ${signal.skillFocus}` : ''}
                                                </p>
                                            )}
                                        </article>
                                    ))}
                                </div>
                            )}
                        </article>

                        <article className="bg-white border border-slate-200 rounded-2xl p-5">
                            <h2 className="text-base font-black text-slate-900 flex items-center gap-2 mb-3">
                                <PieChart className="w-4 h-4 text-indigo-600" />
                                Señales por tipo
                            </h2>
                            <div className="h-56">
                                <ResponsiveContainer width="100%" height="100%">
                                    <RechartsPieChart>
                                        <Pie data={worldSourceTypeData} dataKey="total" nameKey="sourceType" innerRadius={48} outerRadius={82}>
                                            {worldSourceTypeData.map((entry, index) => (
                                                <Cell key={entry.sourceType} fill={CHART_PALETTE[index % CHART_PALETTE.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(value) => [toNumeric(value), 'Señales']} />
                                        <Legend />
                                    </RechartsPieChart>
                                </ResponsiveContainer>
                            </div>

                            <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 mt-4 mb-2">Etiquetas destacadas</h3>
                            <div className="flex flex-wrap gap-1.5">
                                {topWorldTagsData.length > 0 ? topWorldTagsData.map((item) => (
                                    <span key={item.tag} className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full bg-slate-200 text-slate-700">
                                        {item.tag} ({item.total})
                                    </span>
                                )) : (
                                    <span className="text-xs text-slate-400">Sin etiquetas recientes.</span>
                                )}
                            </div>
                        </article>
                    </section>
                </div>
            )}

            {activeTab === 'workspace' && (
                <div className="space-y-5">
                    <section className="bg-white border border-slate-200 rounded-2xl p-5 md:p-6 space-y-4">
                        <div>
                            <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                                <GraduationCap className="w-5 h-5 text-indigo-600" />
                                Área de trabajo pedagógica asistida por IA
                            </h2>
                            <p className="text-sm text-slate-500 mt-1">
                                Construye planes de formación y estrategias pedagógicas seleccionando ocupaciones y habilidades del repositorio.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <select
                                value={workspaceOccupationId}
                                onChange={(event) => setWorkspaceOccupationId(event.target.value)}
                                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:ring-2 focus:ring-indigo-100"
                            >
                                <option value="">Ocupación transversal (sin seleccionar)</option>
                                {workspaceOccupationOptions.map((option) => (
                                    <option key={option.id} value={option.id}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>

                            <input
                                value={workspaceAudience}
                                onChange={(event) => setWorkspaceAudience(event.target.value)}
                                placeholder="Audiencia objetivo"
                                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:ring-2 focus:ring-indigo-100"
                            />
                            <input
                                type="number"
                                min={2}
                                max={32}
                                value={workspaceDurationWeeks}
                                onChange={(event) => setWorkspaceDurationWeeks(Number(event.target.value || 8))}
                                placeholder="Duración en semanas"
                                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:ring-2 focus:ring-indigo-100"
                            />
                            <input
                                value={workspaceObjective}
                                onChange={(event) => setWorkspaceObjective(event.target.value)}
                                placeholder="Objetivo general"
                                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:ring-2 focus:ring-indigo-100"
                            />
                        </div>

                        <textarea
                            value={workspaceContextNotes}
                            onChange={(event) => setWorkspaceContextNotes(event.target.value)}
                            placeholder="Contexto adicional (recursos disponibles, restricciones, perfil del grupo, etc.)"
                            rows={3}
                            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:ring-2 focus:ring-indigo-100 resize-none"
                        />

                        <div className="flex flex-wrap items-center gap-2">
                            <button
                                onClick={handleSuggestSkillsByOccupation}
                                className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-indigo-200 bg-indigo-50 text-indigo-700 text-xs font-bold hover:bg-indigo-100 transition-colors"
                            >
                                Sugerir por ocupación
                            </button>
                            <button
                                onClick={handleSelectTopTrendSkills}
                                className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 text-xs font-bold hover:bg-emerald-100 transition-colors"
                            >
                                Seleccionar top tendencia
                            </button>
                            <button
                                onClick={handleClearWorkspaceSelection}
                                className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors"
                            >
                                Limpiar selección
                            </button>
                        </div>

                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                                Habilidades para el plan (máximo 12)
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
                                {workspaceCandidateSkills.map((skill) => {
                                    const selected = workspaceSkillIds.includes(skill.id);
                                    return (
                                        <label key={skill.id} className={`rounded-lg border px-3 py-2 text-sm cursor-pointer ${selected ? 'border-indigo-400 bg-indigo-50' : 'border-slate-200 bg-white'}`}>
                                            <input
                                                type="checkbox"
                                                className="mr-2"
                                                checked={selected}
                                                onChange={() => handleToggleWorkspaceSkill(skill.id)}
                                            />
                                            {skill.name}
                                        </label>
                                    );
                                })}
                            </div>
                            <p className="text-xs text-slate-500 mt-2">
                                Seleccionadas: {workspaceSkillIds.length}/12
                            </p>
                        </div>

                        <div className="flex justify-end">
                            <button
                                onClick={handleGenerateWorkspacePlan}
                                disabled={isWorkspacePending || workspaceSkillIds.length === 0}
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 transition-colors disabled:opacity-60"
                            >
                                {isWorkspacePending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                                Generar plan con IA
                            </button>
                        </div>
                    </section>

                    {workspacePlanMarkdown ? (
                        <section className="bg-white border border-slate-200 rounded-2xl p-5 md:p-6">
                            <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
                                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                                    <CalendarClock className="w-4 h-4 text-indigo-600" />
                                    Plan de formación y estrategia pedagógica
                                </h3>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => { void handleCopyWorkspacePlan(); }}
                                        className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors"
                                    >
                                        Copiar plan
                                    </button>
                                    <button
                                        onClick={handleDownloadWorkspacePlan}
                                        className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-indigo-200 bg-indigo-50 text-indigo-700 text-xs font-bold hover:bg-indigo-100 transition-colors"
                                    >
                                        Descargar .md
                                    </button>
                                </div>
                            </div>
                            <article className="prose prose-slate max-w-none prose-headings:font-black prose-headings:text-slate-900 prose-p:text-slate-700 prose-li:text-slate-700">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                    {workspacePlanMarkdown}
                                </ReactMarkdown>
                            </article>
                        </section>
                    ) : (
                        <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center">
                            <p className="text-slate-500">
                                Selecciona habilidades y genera tu plan. La IA estructurará ruta formativa, estrategias y evaluación.
                            </p>
                        </div>
                    )}
                </div>
            )}

            {(activeTab === 'skills' || activeTab === 'occupations') && (activeTab === 'skills' ? (
                <>
                    <section className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                        <article className="xl:col-span-2 bg-white border border-slate-200 rounded-2xl p-4 md:p-5">
                            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2 mb-3">
                                <BarChart3 className="w-4 h-4 text-indigo-600" />
                                Distribución de habilidades por industria
                            </h3>
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={skillsByIndustryData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                                        <XAxis dataKey="industry" tick={{ fill: '#64748B', fontSize: 11 }} />
                                        <YAxis tick={{ fill: '#64748B', fontSize: 11 }} />
                                        <Tooltip formatter={(value) => [toNumeric(value), 'Habilidades']} />
                                        <Bar dataKey="total" fill="#4F46E5" radius={[6, 6, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </article>

                        <article className="bg-white border border-slate-200 rounded-2xl p-4 md:p-5">
                            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2 mb-3">
                                <PieChart className="w-4 h-4 text-indigo-600" />
                                Habilidades por fuente
                            </h3>
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <RechartsPieChart>
                                        <Pie
                                            data={skillsBySourceData}
                                            dataKey="total"
                                            nameKey="source"
                                            innerRadius={54}
                                            outerRadius={88}
                                            paddingAngle={2}
                                        >
                                            {skillsBySourceData.map((entry, index) => (
                                                <Cell key={entry.source} fill={CHART_PALETTE[index % CHART_PALETTE.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(value) => [toNumeric(value), 'Habilidades']} />
                                        <Legend />
                                    </RechartsPieChart>
                                </ResponsiveContainer>
                            </div>
                        </article>
                    </section>

                    <section className="bg-white border border-slate-200 rounded-2xl p-4 md:p-6 shadow-sm space-y-4">
                        {canUploadOccupations && (
                            <div className="space-y-3">
                                <div className="border border-indigo-200 rounded-2xl p-4 bg-indigo-50/60 space-y-3">
                                    <div className="flex items-start justify-between gap-3 flex-wrap">
                                        <div>
                                            <p className="text-xs font-black uppercase tracking-wider text-indigo-700">Fuente principal</p>
                                            <h3 className="text-base font-black text-slate-900">ESCO API (Comisión Europea)</h3>
                                            <p className="text-xs text-slate-600 mt-1">
                                                Documentación oficial: https://ec.europa.eu/esco/api/doc/esco_api_doc.html
                                            </p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                                        <select
                                            value={escoLanguage}
                                            onChange={(event) => setEscoLanguage(event.target.value)}
                                            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:ring-2 focus:ring-indigo-100"
                                        >
                                            <option value="es">Español (es)</option>
                                            <option value="en">Inglés (en)</option>
                                        </select>

                                        <input
                                            type="number"
                                            min={20}
                                            max={3000}
                                            value={escoMaxSkills}
                                            onChange={(event) => setEscoMaxSkills(Number(event.target.value || 300))}
                                            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:ring-2 focus:ring-indigo-100"
                                            placeholder="Máximo de habilidades"
                                        />

                                        <label className="md:col-span-2 inline-flex items-center gap-2 text-sm text-slate-700">
                                            <input
                                                type="checkbox"
                                                checked={escoDeactivateMissing}
                                                onChange={(event) => setEscoDeactivateMissing(event.target.checked)}
                                                className="w-4 h-4 rounded"
                                            />
                                            Desactivar habilidades ESCO no incluidas en esta sincronización
                                        </label>
                                    </div>

                                    <div className="flex justify-end">
                                        <button
                                            onClick={handleSyncEsco}
                                            disabled={isEscoSyncPending}
                                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 transition-colors disabled:opacity-60"
                                        >
                                            {isEscoSyncPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
                                            Sincronizar habilidades desde ESCO
                                        </button>
                                    </div>
                                </div>

                                <div className="border border-cyan-200 rounded-2xl p-4 bg-cyan-50/60 space-y-3">
                                    <div className="flex items-start justify-between gap-3 flex-wrap">
                                        <div>
                                            <p className="text-xs font-black uppercase tracking-wider text-cyan-700">Fuente adicional</p>
                                            <h3 className="text-base font-black text-slate-900">MIND Tech Ontology (GitHub)</h3>
                                            <p className="text-xs text-slate-600 mt-1">
                                                Repositorio: https://github.com/MIND-TechAI/MIND-tech-ontology
                                            </p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                        <input
                                            type="number"
                                            min={50}
                                            max={6000}
                                            value={mindMaxSkills}
                                            onChange={(event) => setMindMaxSkills(Number(event.target.value || 1200))}
                                            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:ring-2 focus:ring-cyan-100"
                                            placeholder="Máximo de habilidades"
                                        />

                                        <label className="md:col-span-2 inline-flex items-center gap-2 text-sm text-slate-700">
                                            <input
                                                type="checkbox"
                                                checked={mindDeactivateMissing}
                                                onChange={(event) => setMindDeactivateMissing(event.target.checked)}
                                                className="w-4 h-4 rounded"
                                            />
                                            Desactivar habilidades MIND no incluidas en esta sincronización
                                        </label>
                                    </div>

                                    <div className="flex justify-end">
                                        <button
                                            onClick={handleSyncMind}
                                            disabled={isMindSyncPending}
                                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-600 text-white font-bold text-sm hover:bg-cyan-700 transition-colors disabled:opacity-60"
                                        >
                                            {isMindSyncPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
                                            Sincronizar habilidades desde MIND
                                        </button>
                                    </div>
                                </div>

                                <div className="border border-emerald-200 rounded-2xl p-4 bg-emerald-50/60 space-y-3">
                                    <div className="flex items-start justify-between gap-3 flex-wrap">
                                        <div>
                                            <p className="text-xs font-black uppercase tracking-wider text-emerald-700">Segmentación IA</p>
                                            <h3 className="text-base font-black text-slate-900">Reclasificar industrias de habilidades</h3>
                                            <p className="text-xs text-slate-600 mt-1">
                                                Normaliza industrias a categorías como Tecnología, Salud, Educación y Servicios.
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex justify-end">
                                        <button
                                            onClick={handleReclassifyIndustries}
                                            disabled={isIndustrySegmentationPending}
                                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700 transition-colors disabled:opacity-60"
                                        >
                                            {isIndustrySegmentationPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                                            Analizar y reclasificar con IA
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="flex items-center justify-between gap-2 flex-wrap">
                            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Filtros de habilidades</p>
                            <button
                                onClick={handleResetSkillFilters}
                                className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors"
                            >
                                Limpiar filtros
                            </button>
                        </div>

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

                        {canManageSkills && (
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

                        {canManageSkills && formOpen && (
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
                                        disabled={isSkillPending}
                                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-sm hover:bg-black transition-colors disabled:opacity-70"
                                    >
                                        {isSkillPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
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
                                                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full bg-indigo-600 text-white">
                                                            {formatSkillSourceProvider(skill.sourceProvider)}
                                                        </span>
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

                                                {canManageSkills && (
                                                    <button
                                                        onClick={() => handleToggleStatus(skill)}
                                                        disabled={isSkillPending}
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
                                                    <TrendingUp className="w-3.5 h-3.5" /> Activas: {activeCount} de {skills.length}
                                                </span>
                                                {skill.sourceLastSyncedAt && (
                                                    <span className="inline-flex items-center gap-1">
                                                        Sincronizado {formatSkillSourceProvider(skill.sourceProvider)}: {new Date(skill.sourceLastSyncedAt).toLocaleDateString('es-ES')}
                                                    </span>
                                                )}
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
                </>
            ) : (
                <div className="space-y-5">
                    <section className="bg-white border border-slate-200 rounded-2xl p-5 md:p-6">
                        <div className="flex items-start justify-between gap-3 flex-wrap">
                            <div>
                                <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                                    <Database className="w-5 h-5 text-indigo-600" />
                                    Sincronización de ocupaciones (BLS API)
                                </h2>
                                <p className="text-sm text-slate-500 mt-1">
                                    Fuente oficial: API pública de Bureau of Labor Statistics (v2), serie OE nacional. Employment_Count se guarda en miles de empleos.
                                </p>
                                <p className="text-xs text-slate-500 mt-1">
                                    Documentación: https://www.bls.gov/developers/api_signature_v2.htm
                                </p>
                            </div>
                        </div>

                        {canUploadOccupations ? (
                            <div className="mt-4 border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-4">
                                <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                                    <input
                                        type="checkbox"
                                        checked={blsIncremental}
                                        onChange={(event) => setBlsIncremental(event.target.checked)}
                                        className="w-4 h-4 rounded"
                                    />
                                    Sincronización incremental (recomendada)
                                </label>

                                {blsIncremental && (
                                    <p className="text-xs text-slate-500">
                                        Usa automáticamente el último año sincronizado en BLS API - 1 como inicio para traer solo novedades y revisiones recientes.
                                    </p>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                                    <input
                                        type="number"
                                        min={1999}
                                        max={new Date().getFullYear()}
                                        value={blsStartYear}
                                        onChange={(event) => setBlsStartYear(Number(event.target.value || new Date().getFullYear() - 5))}
                                        disabled={blsIncremental}
                                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-100 disabled:text-slate-400"
                                        placeholder="Año inicial"
                                    />
                                    <input
                                        type="number"
                                        min={1999}
                                        max={new Date().getFullYear()}
                                        value={blsEndYear}
                                        onChange={(event) => setBlsEndYear(Number(event.target.value || new Date().getFullYear()))}
                                        disabled={blsIncremental}
                                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-100 disabled:text-slate-400"
                                        placeholder="Año final"
                                    />
                                    <input
                                        type="number"
                                        min={20}
                                        max={1200}
                                        value={blsMaxCodes}
                                        onChange={(event) => setBlsMaxCodes(Number(event.target.value || 120))}
                                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:ring-2 focus:ring-indigo-100"
                                        placeholder="Máximo de códigos SOC"
                                    />
                                    <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                                        <input
                                            type="checkbox"
                                            checked={blsIncludePopular}
                                            onChange={(event) => setBlsIncludePopular(event.target.checked)}
                                            className="w-4 h-4 rounded"
                                        />
                                        Incluir series populares OE
                                    </label>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                                        Códigos SOC adicionales (opcional, uno por línea)
                                    </label>
                                    <textarea
                                        ref={blsSocCodesRef}
                                        rows={4}
                                        value={blsCodesText}
                                        onChange={(event) => setBlsCodesText(event.target.value)}
                                        placeholder={'15-1252\n15-1211\n11-3012'}
                                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:ring-2 focus:ring-indigo-100 resize-y"
                                    />
                                </div>

                                <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                                    <input
                                        type="checkbox"
                                        checked={blsDeactivateMissing}
                                        onChange={(event) => setBlsDeactivateMissing(event.target.checked)}
                                        className="w-4 h-4 rounded"
                                    />
                                    Desactivar ocupaciones BLS no incluidas en esta sincronización
                                </label>

                                <div className="flex justify-end gap-2">
                                    <button
                                        onClick={handleSyncBlsOccupations}
                                        disabled={isBlsSyncPending}
                                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 transition-colors disabled:opacity-60"
                                    >
                                        {isBlsSyncPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
                                        Sincronizar ocupaciones desde BLS API
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                                Solo el rol ADMIN puede ejecutar sincronización de ocupaciones en BLS. Este panel está en modo consulta.
                            </div>
                        )}
                    </section>

                    <section className="bg-white border border-slate-200 rounded-2xl p-4 md:p-6 shadow-sm space-y-4">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Filtros de ocupaciones</p>
                            <button
                                onClick={handleResetOccupationFilters}
                                className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors"
                            >
                                Limpiar filtros
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                            <div className="md:col-span-2 relative">
                                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                                <input
                                    value={occupationSearch}
                                    onChange={(event) => setOccupationSearch(event.target.value)}
                                    placeholder="Buscar ocupación, código o habilidad relacionada..."
                                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm outline-none focus:ring-2 focus:ring-indigo-100"
                                />
                            </div>

                            <select
                                value={occupationSourceFilter}
                                onChange={(event) => setOccupationSourceFilter(event.target.value)}
                                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm outline-none focus:ring-2 focus:ring-indigo-100"
                            >
                                <option value="ALL">Todas las fuentes</option>
                                {occupationSources.map((source) => (
                                    <option key={source} value={source}>{formatOccupationSourceLabel(source)}</option>
                                ))}
                            </select>

                            <select
                                value={occupationGeographyFilter}
                                onChange={(event) => setOccupationGeographyFilter(event.target.value)}
                                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm outline-none focus:ring-2 focus:ring-indigo-100"
                            >
                                <option value="ALL">Todas las geografías</option>
                                {occupationGeographies.map((geography) => (
                                    <option key={geography} value={geography}>{geography}</option>
                                ))}
                            </select>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <select
                                value={occupationYearFilter}
                                onChange={(event) => setOccupationYearFilter(event.target.value)}
                                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm outline-none focus:ring-2 focus:ring-indigo-100"
                            >
                                <option value="ALL">Todos los años</option>
                                {occupationYears.map((year) => (
                                    <option key={year} value={String(year)}>{year}</option>
                                ))}
                            </select>

                            <div className="md:col-span-2 text-xs text-slate-500 flex items-center">
                                Mostrando {filteredOccupations.length} de {occupationTotal} ocupaciones registradas.
                            </div>
                        </div>
                    </section>

                    <section className="bg-white border border-slate-200 rounded-2xl p-4 md:p-6">
                        <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
                            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                                <Globe2 className="w-4 h-4 text-indigo-600" />
                                Mapa analítico de ocupaciones por geografía e industria (2035 o último año)
                            </h3>
                            <span className="text-xs text-slate-500">
                                Geografías: {occupationGeoIndustryMap.geographies.length} · Industrias: {occupationGeoIndustryMap.industries.length}
                            </span>
                        </div>

                        {occupationGeoIndustryMap.rows.length === 0 || occupationGeoIndustryMap.industries.length === 0 ? (
                            <p className="text-sm text-slate-500">No hay datos suficientes para construir el mapa geográfico-industrial.</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[920px] text-xs">
                                    <thead className="bg-slate-50 text-slate-600">
                                        <tr>
                                            <th className="text-left px-3 py-2.5 font-bold">Geografía</th>
                                            {occupationGeoIndustryMap.industries.map((industry) => (
                                                <th key={industry} className="text-right px-3 py-2.5 font-bold">{industry}</th>
                                            ))}
                                            <th className="text-right px-3 py-2.5 font-bold">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {occupationGeoIndustryMap.rows.map((row) => (
                                            <tr key={row.geography} className="border-t border-slate-100">
                                                <td className="px-3 py-2.5 font-semibold text-slate-800">{row.geography}</td>
                                                {row.values.map((value) => {
                                                    const intensity = occupationGeoIndustryMap.maxValue > 0
                                                        ? Math.max(0.08, value.value / occupationGeoIndustryMap.maxValue)
                                                        : 0;
                                                    return (
                                                        <td
                                                            key={`${row.geography}-${value.industry}`}
                                                            className="px-3 py-2.5 text-right font-medium text-slate-700"
                                                            style={{ backgroundColor: `rgba(79, 70, 229, ${intensity})` }}
                                                        >
                                                            {value.value > 0 ? formatCompactThousands(value.value) : '—'}
                                                        </td>
                                                    );
                                                })}
                                                <td className="px-3 py-2.5 text-right font-bold text-slate-900">{formatCompactThousands(row.total)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </section>

                    <section className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                        <article className="xl:col-span-2 bg-white border border-slate-200 rounded-2xl p-4 md:p-5">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                                    <TrendingUp className="w-4 h-4 text-indigo-600" />
                                    Tendencia agregada de empleo (miles)
                                </h3>
                                <span className="text-xs text-slate-500">Suma de ocupaciones filtradas</span>
                            </div>
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={yearlyTrendData}>
                                        <defs>
                                            <linearGradient id="colorEmpleo" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.35} />
                                                <stop offset="95%" stopColor="#4F46E5" stopOpacity={0.02} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                                        <XAxis dataKey="year" tick={{ fill: '#64748B', fontSize: 12 }} />
                                        <YAxis tickFormatter={formatCompactThousands} tick={{ fill: '#64748B', fontSize: 12 }} />
                                        <Tooltip
                                            formatter={(value) => [formatEmploymentThousands(toNumeric(value)), 'Empleo']}
                                            labelFormatter={(label) => `Año ${label}`}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="employmentCount"
                                            stroke="#4F46E5"
                                            fillOpacity={1}
                                            fill="url(#colorEmpleo)"
                                            strokeWidth={2}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </article>

                        <article className="bg-white border border-slate-200 rounded-2xl p-4 md:p-5">
                            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2 mb-3">
                                <PieChart className="w-4 h-4 text-indigo-600" />
                                Distribución por fuente
                            </h3>
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <RechartsPieChart>
                                        <Pie
                                            data={sourceDistributionData}
                                            dataKey="total"
                                            nameKey="source"
                                            innerRadius={60}
                                            outerRadius={90}
                                            paddingAngle={2}
                                        >
                                            {sourceDistributionData.map((entry, index) => (
                                                <Cell key={entry.source} fill={CHART_PALETTE[index % CHART_PALETTE.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(value) => [toNumeric(value), 'Ocupaciones']} />
                                        <Legend />
                                    </RechartsPieChart>
                                </ResponsiveContainer>
                            </div>
                        </article>
                    </section>

                    <section className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                        <article className="bg-white border border-slate-200 rounded-2xl p-4 md:p-5">
                            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2 mb-3">
                                <BarChart3 className="w-4 h-4 text-indigo-600" />
                                Top ocupaciones por empleo más reciente
                            </h3>
                            <div className="h-72">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={topOccupationsChartData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                                        <XAxis dataKey="occupationShort" tick={{ fill: '#64748B', fontSize: 11 }} />
                                        <YAxis tickFormatter={formatCompactThousands} tick={{ fill: '#64748B', fontSize: 11 }} />
                                        <Tooltip
                                            formatter={(value) => [formatEmploymentThousands(toNumeric(value)), 'Empleo']}
                                            labelFormatter={(label) => `Ocupación: ${label}`}
                                        />
                                        <Bar dataKey="employmentCount" fill="#0EA5E9" radius={[6, 6, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </article>

                        <article className="bg-white border border-slate-200 rounded-2xl p-4 md:p-5">
                            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2 mb-3">
                                <Database className="w-4 h-4 text-indigo-600" />
                                Ocupaciones por geografía
                            </h3>
                            <div className="h-72">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={geographyDistributionData.map((item, index) => ({ ...item, color: CHART_PALETTE[index % CHART_PALETTE.length] }))}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                                        <XAxis dataKey="geography" tick={{ fill: '#64748B', fontSize: 11 }} />
                                        <YAxis tick={{ fill: '#64748B', fontSize: 11 }} />
                                        <Tooltip formatter={(value) => [toNumeric(value), 'Ocupaciones']} />
                                        <Legend />
                                        <Line type="monotone" dataKey="total" stroke="#14B8A6" strokeWidth={3} dot={{ r: 4 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </article>
                    </section>

                    <section className="bg-white border border-slate-200 rounded-2xl p-4 md:p-6">
                        <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
                            <h3 className="text-sm font-black text-slate-900">
                                Tabla analítica de ocupaciones (ordenada por empleo más reciente)
                            </h3>
                            <span className="text-xs text-slate-500">
                                Filas: {Math.min(occupationLatestTable.length, 80)} de {occupationLatestTable.length}
                            </span>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[980px] text-sm">
                                <thead className="bg-slate-50 text-slate-600">
                                    <tr>
                                        <th className="text-left px-3 py-2.5 font-bold">Ocupación</th>
                                        <th className="text-left px-3 py-2.5 font-bold">Código SOC</th>
                                        <th className="text-left px-3 py-2.5 font-bold">Fuente</th>
                                        <th className="text-left px-3 py-2.5 font-bold">Geografía</th>
                                        <th className="text-right px-3 py-2.5 font-bold">Año</th>
                                        <th className="text-right px-3 py-2.5 font-bold">Empleo (miles)</th>
                                        <th className="text-right px-3 py-2.5 font-bold">Variación</th>
                                        <th className="text-left px-3 py-2.5 font-bold">Habilidades</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {occupationLatestTable.slice(0, 80).map((item) => (
                                        <tr key={item.occupation.id} className="border-t border-slate-100 hover:bg-slate-50/70">
                                            <td className="px-3 py-2.5">
                                                <p className="font-semibold text-slate-800">{item.occupation.occupationTitle}</p>
                                                <p className="text-xs text-slate-500">{formatOccupationTypeLabel(item.occupation.occupationType)}</p>
                                            </td>
                                            <td className="px-3 py-2.5 text-slate-700">{item.occupation.occupationCode || 'N/D'}</td>
                                            <td className="px-3 py-2.5 text-slate-700">{formatOccupationSourceLabel(item.occupation.dataSource)}</td>
                                            <td className="px-3 py-2.5 text-slate-700">{item.occupation.geography}</td>
                                            <td className="px-3 py-2.5 text-right text-slate-700">{item.latest?.year || 'N/D'}</td>
                                            <td className="px-3 py-2.5 text-right font-semibold text-slate-800">
                                                {item.latest ? formatEmploymentThousands(item.latest.employmentCount) : 'N/D'}
                                            </td>
                                            <td className="px-3 py-2.5 text-right">
                                                {item.variationAbsolute === null ? (
                                                    <span className="text-slate-400">N/D</span>
                                                ) : (
                                                    <span className={item.variationAbsolute >= 0 ? 'text-emerald-700 font-semibold' : 'text-rose-700 font-semibold'}>
                                                        {item.variationAbsolute >= 0 ? '+' : ''}{formatEmploymentThousands(item.variationAbsolute)}
                                                        {' · '}
                                                        {item.variationPercent === null
                                                            ? 'N/D'
                                                            : `${item.variationPercent >= 0 ? '+' : ''}${item.variationPercent.toFixed(1)}%`}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-3 py-2.5">
                                                {item.occupation.skills.length === 0 ? (
                                                    <span className="text-slate-400">Sin vínculo</span>
                                                ) : (
                                                    <div className="flex flex-wrap gap-1">
                                                        {item.occupation.skills.slice(0, 3).map((skill) => (
                                                            <span key={skill.id} className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full bg-fuchsia-100 text-fuchsia-700">
                                                                {skill.name}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>

                    {occupationTotal > occupations.length && (
                        <p className="text-xs text-slate-500">
                            Se muestran las 1000 ocupaciones más recientes para mantener rendimiento. Total en base de datos: {occupationTotal}.
                        </p>
                    )}

                    {filteredOccupations.length === 0 ? (
                        <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center">
                            <p className="text-slate-500">No hay ocupaciones para los filtros seleccionados.</p>
                        </div>
                    ) : (
                        <section className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                            {filteredOccupations.map((occupation) => {
                                const sortedForecasts = [...occupation.forecasts].sort((a, b) => b.year - a.year);
                                const latest = sortedForecasts[0];

                                return (
                                    <article key={occupation.id} className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 space-y-4">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <div className="flex flex-wrap items-center gap-2 mb-2">
                                                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full bg-slate-100 text-slate-700">
                                                        {formatOccupationSourceLabel(occupation.dataSource)}
                                                    </span>
                                                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full bg-indigo-100 text-indigo-700">
                                                        {occupation.geography}
                                                    </span>
                                                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full bg-emerald-100 text-emerald-700">
                                                        {occupation.qualificationLevel}
                                                    </span>
                                                </div>
                                                <h3 className="text-lg font-black text-slate-900">{occupation.occupationTitle}</h3>
                                                <p className="text-xs text-slate-500 mt-1">
                                                    Tipo: {formatOccupationTypeLabel(occupation.occupationType)}
                                                    {occupation.occupationCode ? ` · Código ocupación: ${occupation.occupationCode}` : ''}
                                                    {occupation.industryCode ? ` · Industria: ${occupation.industryCode}` : ''}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                                            <div className="rounded-lg bg-slate-50 border border-slate-200 px-3 py-2">
                                                <p className="text-slate-500">Empleo último año</p>
                                                <p className="font-bold text-slate-800">
                                                    {latest ? formatEmploymentThousands(latest.employmentCount) : 'N/D'}
                                                </p>
                                            </div>
                                            <div className="rounded-lg bg-slate-50 border border-slate-200 px-3 py-2">
                                                <p className="text-slate-500">Actualizado</p>
                                                <p className="font-bold text-slate-800">{new Date(occupation.updatedAt).toLocaleDateString('es-ES')}</p>
                                            </div>
                                        </div>

                                        <div>
                                            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Habilidades relacionadas</p>
                                            {occupation.skills.length > 0 ? (
                                                <div className="flex flex-wrap gap-1.5">
                                                    {occupation.skills.map((skill) => (
                                                        <span key={`${occupation.id}-${skill.id}`} className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full bg-fuchsia-100 text-fuchsia-700">
                                                            {skill.name}
                                                        </span>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-xs text-slate-400">Sin relación automática detectada en este registro.</p>
                                            )}
                                        </div>

                                        <div>
                                            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Proyección por año</p>
                                            <div className="space-y-2">
                                                {sortedForecasts.map((forecast) => (
                                                    <div key={`${occupation.id}-${forecast.year}`} className="grid grid-cols-4 gap-2 text-xs rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                                                        <span className="font-bold text-slate-700">{forecast.year}</span>
                                                        <span className="text-slate-700">{formatEmploymentThousands(forecast.employmentCount)}</span>
                                                        <span className="text-slate-500">% Ind: {formatOptionalPercent(forecast.percentOfIndustry)}</span>
                                                        <span className="text-slate-500">% Ocup: {formatOptionalPercent(forecast.percentOfOccupation)}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </article>
                                );
                            })}
                        </section>
                    )}
                </div>
            ))}

            {currentRole === 'STUDENT' && (
                <p className="text-xs text-slate-400">
                    Las habilidades y ocupaciones se conectan automáticamente con nuevos proyectos, retos y problemas definidos por tus profesores.
                </p>
            )}

            {(canManageSkills || canUploadOccupations) && (
                <p className="text-xs text-slate-400">
                    Asociaciones activas: {totalAssociations}. Habilidades activas: {activeCount}/{skills.length}.
                </p>
            )}
        </div>
    );
}
