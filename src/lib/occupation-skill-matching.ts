export type SkillForMatching = {
    id: string;
    name: string;
    industry: string;
    category: string | null;
    tags?: string[];
};

export type OccupationForMatching = {
    id: string;
    occupationTitle: string;
    occupationType: string;
    geography?: string;
    qualificationLevel?: string;
    skills?: Array<{ id: string }>;
};

const MATCH_STOPWORDS = new Set([
    'and', 'for', 'the', 'with', 'from', 'that', 'this', 'into', 'de', 'del', 'las', 'los', 'con',
    'por', 'para', 'una', 'uno', 'unos', 'unas', 'segun', 'according', 'occupations', 'occupation',
    'summary', 'total', 'level', 'role', 'roles', 'worker', 'workers', 'line', 'item', 'all', 'other',
    'apply', 'assist', 'advise', 'assess', 'analyse', 'analyze', 'perform', 'provide', 'support', 'handle',
    'manage', 'maintain', 'prepare', 'collect', 'plan', 'using', 'use', 'based', 'related',
    'through', 'across', 'among', 'within', 'without'
]);

const ACTION_PREFIXES = new Set([
    'advise',
    'apply',
    'assist',
    'assess',
    'analyse',
    'analyze',
    'collect',
    'classify',
    'compose',
    'carry',
    'comprehend',
    'calibrate',
    'adapt',
    'address',
    'advertise',
    'arrange',
    'assemble',
    'clean'
]);

// Very generic concepts that should not match as single-token skills.
const BLOCKED_SINGLE_TOKEN = new Set([
    'communication',
    'management',
    'planning',
    'analysis',
    'operations',
    'services',
    'technology',
    'engineering',
    'software',
    'business',
    'marketing',
    'sales',
    'administration',
    'support',
    'supervisor',
    'supervisors',
    'community'
]);

// Domain tokens that are too broad by themselves; they only help when combined
// with other, more specific tokens.
const LOW_SIGNAL_TOKENS = new Set([
    'social',
    'physical',
    'service',
    'services',
    'community',
    'industry',
    'industrial',
    'engineering',
    'information',
    'system',
    'systems',
    'production',
    'process',
    'project',
    'public',
    'health',
    'safety',
    'records',
    'administrative',
    'quality',
    'design',
    'development',
    'technical',
    'technology',
    'electrical',
    'electronic',
    'electronics',
    'commercial',
    'protective',
    'installation',
    'maintenance',
    'repair',
    'equipment'
]);

function normalizeForMatching(text: string | null | undefined): string {
    return (text || '')
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

export function tokenizeForMatching(text: string | null | undefined): string[] {
    return normalizeForMatching(text)
        .split(' ')
        .map((token) => token.trim())
        .filter((token) => token.length >= 3 && !MATCH_STOPWORDS.has(token));
}

function tokenWeight(token: string): number {
    if (token.length >= 10) return 2;
    if (token.length >= 8) return 1.75;
    if (token.length >= 7) return 1.5;
    return 1;
}

function scoreSkillMatch(occupation: OccupationForMatching, skill: SkillForMatching): number {
    const occupationText = normalizeForMatching(occupation.occupationTitle);
    const skillName = normalizeForMatching(skill.name);
    const skillIndustry = normalizeForMatching(skill.industry);
    const skillCategory = normalizeForMatching(skill.category || '');

    const occupationTokens = new Set(tokenizeForMatching(occupationText));
    const skillNameTokens = tokenizeForMatching(skillName);
    const significantSkillTokens = skillNameTokens.filter((token) => !LOW_SIGNAL_TOKENS.has(token));

    if (skillNameTokens.length === 0) {
        return 0;
    }

    const overlapTokens = skillNameTokens.filter((token) => occupationTokens.has(token));
    const overlapSignificant = significantSkillTokens.filter((token) => occupationTokens.has(token));
    const phraseMatch = skillName.length >= 6 && occupationText.includes(skillName);
    const skillFirstToken = skillName.split(' ')[0] || '';
    const isActionSkill = ACTION_PREFIXES.has(skillFirstToken);
    const exceptTokenMatches = Array.from(
        occupationText.matchAll(/\bexcept\s+([a-z0-9]+)/g),
        (match) => match[1]
    );

    if (skillNameTokens.length === 1) {
        const onlyToken = skillNameTokens[0];
        if (BLOCKED_SINGLE_TOKEN.has(onlyToken)) {
            return 0;
        }
        if (onlyToken.length < 9) {
            return 0;
        }
        if (!occupationTokens.has(onlyToken)) {
            return 0;
        }
        if (!phraseMatch) {
            return 0;
        }
    }

    if (exceptTokenMatches.some((token) => skillNameTokens.includes(token))) {
        return 0;
    }

    if (!phraseMatch && significantSkillTokens.length === 0) {
        return 0;
    }

    if (!phraseMatch && overlapSignificant.length === 0) {
        return 0;
    }

    if (!phraseMatch && significantSkillTokens.length === 1) {
        const token = significantSkillTokens[0];
        if (token.length < 8) {
            return 0;
        }
    }

    if (!phraseMatch && significantSkillTokens.length === 2 && overlapSignificant.length < 2) {
        return 0;
    }

    if (!phraseMatch && significantSkillTokens.length >= 3 && overlapSignificant.length < 2) {
        return 0;
    }

    if (!phraseMatch && isActionSkill && overlapTokens.length < 2) {
        return 0;
    }

    const significantCoverage = significantSkillTokens.length === 0
        ? 0
        : overlapSignificant.length / significantSkillTokens.length;
    if (!phraseMatch && significantSkillTokens.length >= 4 && significantCoverage < 0.45) {
        return 0;
    }

    let score = 0;
    if (phraseMatch) score += 4;

    for (const token of overlapSignificant) {
        score += tokenWeight(token);
    }

    score += significantCoverage * 2;
    if (overlapSignificant.length >= 2) score += 1;
    if (overlapTokens.length >= 3) score += 0.5;

    if (skillIndustry && skillIndustry !== 'esco' && occupationText.includes(skillIndustry) && overlapSignificant.length > 0) {
        score += 1;
    }

    if (skillCategory && skillCategory !== 'eu skills' && occupationText.includes(skillCategory) && overlapSignificant.length > 0) {
        score += 1;
    }

    return score;
}

function buildSkillConceptKey(skill: SkillForMatching): string {
    const nameTokens = tokenizeForMatching(skill.name);
    const significant = nameTokens.filter((token) => !LOW_SIGNAL_TOKENS.has(token));
    const keyTokens = (significant.length > 0 ? significant : nameTokens).slice(0, 2);
    return keyTokens.join(':');
}

export function suggestSkillIdsForOccupation(
    occupation: OccupationForMatching,
    skills: SkillForMatching[],
    options?: {
        minScore?: number;
        maxResults?: number;
    }
): string[] {
    const minScore = options?.minScore ?? 3;
    const maxResults = options?.maxResults ?? 5;

    const scored = skills
        .map((skill) => ({
            id: skill.id,
            score: scoreSkillMatch(occupation, skill),
            conceptKey: buildSkillConceptKey(skill)
        }))
        .filter((item) => item.score >= minScore)
        .sort((a, b) => b.score - a.score)
        .slice(0, maxResults * 4);

    const selected: string[] = [];
    const usedConcepts = new Set<string>();

    for (const item of scored) {
        const conceptKey = item.conceptKey || item.id;
        if (usedConcepts.has(conceptKey)) {
            continue;
        }

        usedConcepts.add(conceptKey);
        selected.push(item.id);
        if (selected.length >= maxResults) {
            break;
        }
    }

    return selected;
}
