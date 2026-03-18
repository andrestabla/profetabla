import 'server-only';

import { spawn } from 'child_process';
import { mkdtemp, readFile, rm, writeFile } from 'fs/promises';
import { LRUCache } from 'lru-cache';
import os from 'os';
import path from 'path';
import { prisma } from '@/lib/prisma';
import type {
    Skills21SkillRow,
    Skills21SkillsFilters,
    Skills21SkillsInsightsResult
} from './skills21-skills-insights-types';

type SnapshotSkill = {
    id: string;
    name: string;
    industry: string;
    category: string | null;
    description: string;
    trendSummary: string | null;
    tags: string[];
    isActive: boolean;
    sourceProvider: string;
    projectCount: number;
};

type SkillsSnapshot = {
    availableIndustries: string[];
    availableCategories: string[];
    skills: Skills21SkillRow[];
    usedPythonSnapshot: boolean;
    compilerMessage: string;
    generatedAt: string;
    treemapData?: Array<{ name: string; children: Array<{ name: string; value: number }> }>;
};

const SNAPSHOT_CACHE_KEY = 'skills21-skills-snapshot:v1';
const snapshotCache = new LRUCache<string, Promise<SkillsSnapshot>>({
    max: 1,
    ttl: 15 * 60 * 1000
});

async function loadSnapshotSkills(): Promise<SnapshotSkill[]> {
    const skills = await prisma.twentyFirstSkill.findMany({
        select: {
            id: true,
            name: true,
            industry: true,
            category: true,
            description: true,
            trendSummary: true,
            tags: true,
            isActive: true,
            sourceProvider: true,
            _count: { select: { projects: true } }
        }
    });

    return skills.map((s) => ({
        id: s.id,
        name: s.name,
        industry: s.industry,
        category: s.category,
        description: s.description,
        trendSummary: s.trendSummary,
        tags: Array.isArray(s.tags) ? s.tags : [],
        isActive: s.isActive,
        sourceProvider: s.sourceProvider,
        projectCount: s._count.projects
    }));
}

function compileSnapshotFallback(skills: SnapshotSkill[]): SkillsSnapshot {
    const rows: Skills21SkillRow[] = [];
    const industries = new Set<string>();
    const categories = new Set<string>();

    for (const sk of skills) {
        if (!sk.id || !sk.name) continue;
        
        if (sk.isActive) {
            industries.add(sk.industry || 'Sin industria');
            if (sk.category) categories.add(sk.category);
        }

        const tags = sk.tags.join(' ');
        const searchTokens = `${sk.name} ${sk.industry || ''} ${sk.category || ''} ${sk.description} ${sk.trendSummary || ''} ${tags}`.toLowerCase();

        let cluster = 'Otras Tecnologías';
        const n = sk.name.toLowerCase();
        if (n.includes('inteligencia artificial') || n.includes('machine learning') || n.includes(' ia ') || n.includes('ai ')) cluster = 'IA y ML';
        else if (n.includes('datos') || n.includes('data') || n.includes('sql') || n.includes('analytics')) cluster = 'Datos y Analítica';
        else if (n.includes('desarrollo') || n.includes('software') || n.includes('web')) cluster = 'Desarrollo de Software';

        rows.push({
            id: sk.id,
            name: sk.name,
            industry: sk.industry || 'Sin industria',
            category: sk.category,
            isActive: sk.isActive,
            sourceProvider: sk.sourceProvider,
            projectCount: sk.projectCount,
            searchTokens,
            cluster
        });
    }

    return {
        availableIndustries: Array.from(industries).sort((a, b) => a.localeCompare(b)),
        availableCategories: Array.from(categories).sort((a, b) => a.localeCompare(b)),
        skills: rows,
        treemapData: [],
        usedPythonSnapshot: false,
        compilerMessage: 'Fallback TypeScript aplicado.',
        generatedAt: new Date().toISOString()
    };
}

async function runPythonSnapshotCompiler(skills: SnapshotSkill[]): Promise<{ ok: boolean; snapshot?: SkillsSnapshot; error?: string; output: string }> {
    const tempDir = await mkdtemp(path.join(os.tmpdir(), 'skills21-sk-'));
    const inputFilePath = path.join(tempDir, 'sk-input.json');
    const outputFilePath = path.join(tempDir, 'sk-output.json');
    const scriptPath = path.join(process.cwd(), 'scripts', 'skills21', 'build_skills_insights.py');
    const pythonBins = [process.env.PYTHON_BIN, 'python3', 'python'].filter(Boolean) as string[];
    const errors: string[] = [];

    try {
        await writeFile(inputFilePath, JSON.stringify({ skills }), 'utf8');

        for (const bin of pythonBins) {
            const result = await new Promise<{ code: number | null; stdout: string; stderr: string }>((resolve) => {
                const child = spawn(
                    bin,
                    [scriptPath, '--input-file', inputFilePath, '--output-file', outputFilePath],
                    { stdio: ['ignore', 'pipe', 'pipe'] }
                );

                let stdout = '';
                let stderr = '';

                child.stdout.on('data', (chunk) => { stdout += chunk.toString(); });
                child.stderr.on('data', (chunk) => { stderr += chunk.toString(); });
                child.on('close', (code) => resolve({ code, stdout, stderr }));
                child.on('error', (error) => { resolve({ code: 1, stdout, stderr: `${stderr}\n${String(error)}` }); });
            });

            if (result.code === 0) {
                const compiledContent = await readFile(outputFilePath, 'utf8');
                const parsed = JSON.parse(compiledContent) as Omit<SkillsSnapshot, 'usedPythonSnapshot' | 'compilerMessage' | 'generatedAt'>;
                return {
                    ok: true,
                    output: result.stdout.trim(),
                    snapshot: {
                        availableIndustries: Array.isArray(parsed.availableIndustries) ? parsed.availableIndustries : [],
                        availableCategories: Array.isArray(parsed.availableCategories) ? parsed.availableCategories : [],
                        skills: Array.isArray(parsed.skills) ? parsed.skills : [],
                        treemapData: Array.isArray(parsed.treemapData) ? parsed.treemapData : [],
                        usedPythonSnapshot: true,
                        compilerMessage: result.stdout.trim(),
                        generatedAt: new Date().toISOString()
                    }
                };
            }
            errors.push(`bin=${bin} stderr=${result.stderr.trim()}`.trim());
        }

        return {
            ok: false,
            output: '',
            error: errors.length > 0 ? errors.join(' | ') : 'No se pudo ejecutar compilador Python de Habilidades.'
        };
    } finally {
        await rm(tempDir, { recursive: true, force: true });
    }
}

async function buildSkillsSnapshot(): Promise<SkillsSnapshot> {
    const skills = await loadSnapshotSkills();
    const pythonResult = await runPythonSnapshotCompiler(skills);

    if (pythonResult.ok && pythonResult.snapshot) {
        return pythonResult.snapshot;
    }

    const fallback = compileSnapshotFallback(skills);
    return {
        ...fallback,
        compilerMessage: `Fallback TypeScript aplicado. Motivo: ${pythonResult.error || 'desconocido'}`
    };
}

async function getSkillsSnapshot(): Promise<SkillsSnapshot> {
    const cached = snapshotCache.get(SNAPSHOT_CACHE_KEY);
    if (cached) return cached;

    const snapshotPromise = buildSkillsSnapshot().catch((error) => {
        snapshotCache.delete(SNAPSHOT_CACHE_KEY);
        throw error;
    });
    snapshotCache.set(SNAPSHOT_CACHE_KEY, snapshotPromise);
    return snapshotPromise;
}

export function resetSkills21SkillsInsightsCache() {
    snapshotCache.clear();
}

export async function getSkills21SkillsInsights(filters: Skills21SkillsFilters = {}): Promise<Skills21SkillsInsightsResult> {
    const snapshot = await getSkillsSnapshot();
    const term = (filters.search || '').trim().toLowerCase();
    const industry = filters.industry === 'ALL' || !filters.industry ? null : filters.industry;
    const category = filters.category === 'ALL' || !filters.category ? null : filters.category;
    const showInactive = !!filters.showInactive;

    let filteredSkills = snapshot.skills;

    if (term || industry || category || !showInactive) {
        filteredSkills = snapshot.skills.filter((row) => {
            if (!showInactive && !row.isActive) return false;
            if (industry && row.industry !== industry) return false;
            if (category && row.category !== category) return false;
            if (term && !row.searchTokens.includes(term)) return false;
            return true;
        });
    }

    const byIndustry = new Map<string, number>();
    const bySource = new Map<string, number>();

    for (const row of filteredSkills) {
        byIndustry.set(row.industry, (byIndustry.get(row.industry) || 0) + 1);
        
        const sp = row.sourceProvider;
        const s = sp === 'ESCO' ? 'ESCO' : sp === 'MIND_ONTOLOGY' ? 'MIND' : sp === 'MANUAL' ? 'MANUAL' : sp;
        bySource.set(s, (bySource.get(s) || 0) + 1);
    }

    return {
        meta: {
            availableIndustries: snapshot.availableIndustries,
            availableCategories: snapshot.availableCategories,
            usedPythonSnapshot: snapshot.usedPythonSnapshot,
            compilerMessage: snapshot.compilerMessage,
            generatedAt: snapshot.generatedAt
        },
        data: {
            filteredCount: filteredSkills.length,
            skillsList: filteredSkills.map(({ searchTokens, ...rest }) => rest), // Omit searchTokens
            industryDistribution: Array.from(byIndustry.entries())
                .map(([label, total]) => ({ label, total }))
                .sort((a, b) => b.total - a.total)
                .slice(0, 12),
            sourceDistribution: Array.from(bySource.entries())
                .map(([label, total]) => ({ label, total })),
            treemapData: snapshot.treemapData || []
        }
    };
}
