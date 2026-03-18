export type Skills21HomeInsightsFilters = {
    demandYear?: string | null;
    demandIndustry?: string | null;
    demandGeography?: string | null;
    skillsYear?: string | null;
    skillsIndustry?: string | null;
    skillsGeography?: string | null;
    skillsOccupationId?: string | null;
};

export type Skills21HomeDemandRow = {
    id: string;
    occupationTitle: string;
    occupationCode: string | null;
    geography: string;
    industry: string;
    employmentCount: number;
    skillCount: number;
};

export type Skills21HomeOccupationOption = {
    id: string;
    label: string;
};

export type Skills21HomeSkillDemandRow = {
    id: string;
    name: string;
    industry: string;
    category: string | null;
    demand: number;
    occupationCount: number;
};

export type Skills21HomeInsightsResult = {
    meta: {
        latestOccupationYear: number | null;
        occupationYears: number[];
        occupationIndustries: string[];
        occupationGeographies: string[];
        usedPythonSnapshot: boolean;
        compilerMessage: string;
        generatedAt: string;
    };
    demand: {
        selectedYear: number | null;
        rowCount: number;
        topOccupations: Skills21HomeDemandRow[];
        lowestSupply: Skills21HomeDemandRow[];
        chartData: Array<{
            occupationShort: string;
            employmentCount: number;
        }>;
    };
    skills: {
        selectedYear: number | null;
        scopeOccupationCount: number;
        occupationOptions: Skills21HomeOccupationOption[];
        topSkills: Skills21HomeSkillDemandRow[];
        chartData: Array<{
            skillShort: string;
            demand: number;
        }>;
    };
};
