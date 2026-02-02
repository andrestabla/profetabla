'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface ProjectStatusPieProps {
    data: Array<{
        status: string;
        count: number;
    }>;
}

const STATUS_COLORS: Record<string, string> = {
    OPEN: '#3B82F6',
    IN_PROGRESS: '#F59E0B',
    COMPLETED: '#10B981',
    ARCHIVED: '#6B7280',
    CANCELLED: '#EF4444'
};

const STATUS_LABELS: Record<string, string> = {
    OPEN: 'Abierto',
    IN_PROGRESS: 'En Progreso',
    COMPLETED: 'Completado',
    ARCHIVED: 'Archivado',
    CANCELLED: 'Cancelado'
};

export function ProjectStatusPie({ data }: ProjectStatusPieProps) {
    const chartData = data.map(item => ({
        name: STATUS_LABELS[item.status] || item.status,
        value: item.count,
        color: STATUS_COLORS[item.status] || '#64748B'
    }));

    return (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-6">Distribución de Proyectos</h3>
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
