'use client';

import { Users, FolderKanban, FileText, TrendingUp } from 'lucide-react';

interface MetricCardProps {
    title: string;
    value: number | string;
    change?: number;
    icon: 'users' | 'projects' | 'submissions' | 'trend';
    trend?: 'up' | 'down';
}

const iconMap = {
    users: Users,
    projects: FolderKanban,
    submissions: FileText,
    trend: TrendingUp
};

const iconColorMap = {
    users: 'bg-blue-100 text-blue-600',
    projects: 'bg-purple-100 text-purple-600',
    submissions: 'bg-green-100 text-green-600',
    trend: 'bg-orange-100 text-orange-600'
};

export function MetricCard({ title, value, change, icon, trend }: MetricCardProps) {
    const Icon = iconMap[icon];
    const colorClass = iconColorMap[icon];

    return (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg ${colorClass}`}>
                    <Icon className="w-6 h-6" />
                </div>
                {change !== undefined && (
                    <span className={`text-sm font-semibold ${trend === 'up' ? 'text-green-600' : 'text-red-600'
                        }`}>
                        {trend === 'up' ? '+' : ''}{change}%
                    </span>
                )}
            </div>
            <h3 className="text-slate-600 text-sm font-medium">{title}</h3>
            <p className="text-3xl font-bold text-slate-900 mt-2">{value}</p>
        </div>
    );
}

interface OverviewCardsProps {
    metrics: Array<{
        title: string;
        value: number | string;
        change?: number;
        icon: 'users' | 'projects' | 'submissions' | 'trend';
        trend?: 'up' | 'down';
    }>;
}

export function OverviewCards({ metrics }: OverviewCardsProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {metrics.map((metric, index) => (
                <MetricCard key={index} {...metric} />
            ))}
        </div>
    );
}
