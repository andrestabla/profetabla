'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface UserGrowthChartProps {
    data: Array<{
        month: string;
        students: number;
        professors: number;
    }>;
}

export function UserGrowthChart({ data }: UserGrowthChartProps) {
    return (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-6">Crecimiento de Usuarios</h3>
            <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                    <XAxis
                        dataKey="month"
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
                    />
                    <Legend />
                    <Line
                        type="monotone"
                        dataKey="students"
                        stroke="#3B82F6"
                        strokeWidth={3}
                        name="Estudiantes"
                        dot={{ fill: '#3B82F6', r: 4 }}
                        activeDot={{ r: 6 }}
                    />
                    <Line
                        type="monotone"
                        dataKey="professors"
                        stroke="#10B981"
                        strokeWidth={3}
                        name="Profesores"
                        dot={{ fill: '#10B981', r: 4 }}
                        activeDot={{ r: 6 }}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}
