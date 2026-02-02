'use client';

import { useState } from 'react';
import { Calendar } from 'lucide-react';
import { subDays, subMonths, subYears, format } from 'date-fns';

interface DateRangeFilterProps {
    onFilterChange: (startDate: Date | null, endDate: Date | null) => void;
}

type PresetValue = '7d' | '30d' | '3m' | '6m' | '1y' | 'all' | 'custom';

export function DateRangeFilter({ onFilterChange }: DateRangeFilterProps) {
    const [preset, setPreset] = useState<PresetValue>('30d');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const handlePresetChange = (value: PresetValue) => {
        setPreset(value);
        const now = new Date();

        if (value === 'custom') {
            // Don't apply filter yet, wait for custom dates
            return;
        }

        if (value === 'all') {
            onFilterChange(null, null);
            return;
        }

        let start: Date;
        switch (value) {
            case '7d':
                start = subDays(now, 7);
                break;
            case '30d':
                start = subDays(now, 30);
                break;
            case '3m':
                start = subMonths(now, 3);
                break;
            case '6m':
                start = subMonths(now, 6);
                break;
            case '1y':
                start = subYears(now, 1);
                break;
            default:
                start = subDays(now, 30);
        }

        onFilterChange(start, now);
    };

    const handleCustomApply = () => {
        if (startDate && endDate) {
            onFilterChange(new Date(startDate), new Date(endDate));
        }
    };

    const handleReset = () => {
        setPreset('30d');
        setStartDate('');
        setEndDate('');
        handlePresetChange('30d');
    };

    return (
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 mb-6">
            <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-slate-600" />
                    <span className="text-sm font-semibold text-slate-700">Rango de Fechas:</span>
                </div>

                <select
                    value={preset}
                    onChange={(e) => handlePresetChange(e.target.value as PresetValue)}
                    className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 bg-white hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                >
                    <option value="7d">Últimos 7 días</option>
                    <option value="30d">Últimos 30 días</option>
                    <option value="3m">Últimos 3 meses</option>
                    <option value="6m">Últimos 6 meses</option>
                    <option value="1y">Último año</option>
                    <option value="all">Todo el tiempo</option>
                    <option value="custom">Personalizado...</option>
                </select>

                {preset === 'custom' && (
                    <>
                        <div className="flex items-center gap-2">
                            <label className="text-sm text-slate-600">Desde:</label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                max={format(new Date(), 'yyyy-MM-dd')}
                                className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <label className="text-sm text-slate-600">Hasta:</label>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                max={format(new Date(), 'yyyy-MM-dd')}
                                min={startDate}
                                className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                        <button
                            onClick={handleCustomApply}
                            disabled={!startDate || !endDate}
                            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
                        >
                            Aplicar
                        </button>
                    </>
                )}

                {preset !== '30d' && (
                    <button
                        onClick={handleReset}
                        className="px-4 py-2 bg-slate-100 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-200 transition-colors"
                    >
                        Resetear
                    </button>
                )}
            </div>
        </div>
    );
}
