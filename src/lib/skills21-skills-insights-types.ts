export type Skills21SkillsFilters = {
    search?: string | null;
    industry?: string | null;
    category?: string | null;
    showInactive?: boolean;
};

export type Skills21SkillDistribution = {
    label: string;
    total: number;
};

export type Skills21SkillRow = {
    id: string;
    name: string;
    industry: string;
    category: string | null;
    isActive: boolean;
    sourceProvider: string;
    projectCount: number;
    searchTokens: string;
    cluster: string;
};

export type Skills21SkillsInsightsResult = {
    meta: {
        availableIndustries: string[];
        availableCategories: string[];
        usedPythonSnapshot: boolean;
        compilerMessage: string;
        generatedAt: string;
    };
    data: {
        filteredCount: number;
        skillsList: Omit<Skills21SkillRow, 'searchTokens'>[];
        industryDistribution: Skills21SkillDistribution[];
        sourceDistribution: Skills21SkillDistribution[];
        treemapData: Array<{
            name: string;
            children: Array<{ name: string; value: number }>;
        }>;
    };
};
