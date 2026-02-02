'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface StudentProgressChartProps {
    data: Array<{
        studentName: string;
        progress: number;
        completedAssignments: number;
        totalAssignments: number;
    }>;
}

export function StudentProgressChart({ data }: StudentProgressChartProps) {
    // Sort by progress and take top 10
    const topStudents = [...data]
        .sort((a, b) => b.progress - a.progress)
        .slice(0, 10);

    const getBarColor = (progress: number) => {
        if (progress >= 80) return '#10B981'; // Green
        if (progress >= 60) return '#F59E0B'; // Yellow
        return '#EF4444'; // Red
    };

    return (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-6">Progreso de Estudiantes (Top 10)</h3>
            <ResponsiveContainer width="100%" height={400}>
                <BarChart data={topStudents} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                    <XAxis
                        type="number"
                        domain={[0, 100]}
                        stroke="#64748B"
                        style={{ fontSize: '12px' }}
                    />
                    <YAxis
                        type="category"
                        dataKey="studentName"
                        width={150}
                        stroke="#64748B"
                        style={{ fontSize: '12px' }}
                    />
                    <Tooltip
                    />
                    <Bar
                        dataKey="progress"
                        radius={[0, 8, 8, 0]}
                        name="Progreso"
                    >
                        {topStudents.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={getBarColor(entry.progress)} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
