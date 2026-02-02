'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface SubmissionTimelineProps {
    data: Array<{
        week: string;
        count: number;
    }>;
}

export function SubmissionTimeline({ data }: SubmissionTimelineProps) {
    return (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-6">Timeline de Entregas</h3>
            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                    <XAxis
                        dataKey="week"
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
                        cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }}
                    />
                    <Bar
                        dataKey="count"
                        fill="#3B82F6"
                        radius={[8, 8, 0, 0]}
                        name="Entregas"
                    />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
