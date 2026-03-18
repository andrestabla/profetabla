export type Skills21OccupationsFilters = {
    search?: string | null;
    source?: string | null;
    geography?: string | null;
    year?: string | null;
};

export type Skills21OccupationChartLabel = {
    occupationShort: string;
    employmentCount: number;
};

export type Skills21OccupationDistribution = {
    label: string;
    total: number;
};

export type Skills21OccupationRow = {
    id: string;
    occupationTitle: string;
    occupationCode: string | null;
    geography: string;
    industryCode: string;
    dataSource: string;
    occupationType: string;
    qualificationLevel: string;
    skillCount: number;
    searchTokens: string;
    latestEmployment: number;
    latestYear: number | null;
    previousEmployment: number | null;
    cagr: number | null;
};

export type Skills21OccupationLatestTableItem = {
    occupation: Omit<Skills21OccupationRow, 'searchTokens'>;
    latest: { year: number; employmentCount: number } | null;
    previous: { year: number; employmentCount: number } | null;
    variationAbsolute: number | null;
    variationPercent: number | null;
};

export type Skills21OccupationsInsightsResult = {
    meta: {
        availableYears: number[];
        availableGeographies: string[];
        availableSources: string[];
        usedPythonSnapshot: boolean;
        compilerMessage: string;
        generatedAt: string;
    };
    data: {
        filteredCount: number;
        yearlyTrendData: Array<{ year: number; employmentCount: number }>;
        topOccupationsChartData: Skills21OccupationChartLabel[];
        sourceDistributionData: Skills21OccupationDistribution[];
        geographyDistributionData: Skills21OccupationDistribution[];
        latestTableItems: Skills21OccupationLatestTableItem[];
        geoIndustryMap: {
            geographies: string[];
            industries: string[];
            rows: Array<{ geography: string; values: Array<{ industry: string; value: number }>; total: number }>;
            maxValue: number;
        };
        quadrantItems: Array<{
            occupation: string;
            geography: string;
            year: number;
            replacement: number;
            openings: number;
            ratio: number;
        }>;
    };
};
