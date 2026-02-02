'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface ResourceTypeDistributionProps {
    data: Array<{
        type: string;
        count: number;
    }>;
}

const TYPE_COLORS: Record<string, string> = {
    VIDEO: '#3B82F6',
    PDF: '#EF4444',
    ARTICLE: '#10B981',
    LINK: '#F59E0B',
    DOCUMENT: '#8B5CF6',
    OTHER: '#6B7280'
};

export function ResourceTypeDistribution({ data }: ResourceTypeDistributionProps) {
    const chartData = data.map(item => ({
        name: item.type,
        value: item.count,
        color: TYPE_COLORS[item.type] || TYPE_COLORS.OTHER
    }));

    return (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-6">Tipos de Recursos</h3>
            <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                    <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${percent ? (percent * 100).toFixed(0) : 0}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                    >
                        {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
}
