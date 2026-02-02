'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface GradeDistributionProps {
    data: Array<{
        range: string;
        count: number;
    }>;
}

export function GradeDistribution({ data }: GradeDistributionProps) {
    return (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-6">Distribución de Calificaciones</h3>
            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                    <XAxis
                        dataKey="range"
                        stroke="#64748B"
                        style={{ fontSize: '12px' }}
                    />
                    <YAxis
                        stroke="#64748B"
                        style={{ fontSize: '12px' }}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: '#FFF',
                            border: '1px solid #E2E8F0',
                            borderRadius: '8px'
                        }}
                        cursor={{ fill: 'rgba(139, 92, 246, 0.1)' }}
                    />
                    <Bar
                        dataKey="count"
                        fill="#8B5CF6"
                        radius={[8, 8, 0, 0]}
                        name="Cantidad"
                    />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
