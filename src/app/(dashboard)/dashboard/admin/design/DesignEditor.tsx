'use client';

import { useState } from 'react';
import { Save, Loader2, Layout, Type, Palette as PaletteIcon, Check, RefreshCw } from 'lucide-react';
import { updateSystemConfigAction } from '@/app/(dashboard)/dashboard/admin/actions'; // Reuse or creating new? Let's check existing actions.
// Actually let's create a specific one for design to correspond to the new fields
// But user said "updateSystemConfigAction to handle design fields".
// I will check that file next. For now, assuming it handles it or I'll update it.
// I'll create a dedicated Client Component.

export function DesignEditor({ config }: { config: any }) {
    const [isSaving, setIsSaving] = useState(false);

    // Local state for preview (optional, but good for UX)
    const [primaryColor, setPrimaryColor] = useState(config?.primaryColor || '#2563EB');
    const [radius, setRadius] = useState(config?.borderRadius || '0.5rem');
    const [font, setFont] = useState(config?.fontFamily || 'Inter');

    const presets = [
        { name: 'Corporativo', primary: '#1e293b', radius: '0.2rem', font: 'Inter' },
        { name: 'Energético', primary: '#f97316', radius: '1rem', font: 'Poppins' },
        { name: 'Tech', primary: '#0ea5e9', radius: '0px', font: 'Roboto' },
    ];

    const applyPreset = (p: any) => {
        setPrimaryColor(p.primary);
        setRadius(p.radius);
        setFont(p.font);
    };

    return (
        <form action={async (formData) => {
            setIsSaving(true);
            await updateSystemConfigAction(formData); // We need to ensure this action handles the new fields
            setIsSaving(false);
        }} className="space-y-8">

            {/* 1. Presets */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <RefreshCw className="w-5 h-5 text-purple-600" /> Presets Rápidos
                </h3>
                <div className="flex gap-4">
                    {presets.map(p => (
                        <button
                            key={p.name}
                            type="button"
                            onClick={() => applyPreset(p)}
                            className="flex-1 p-4 border rounded-xl hover:bg-slate-50 transition-colors text-left group"
                        >
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: p.primary }}></div>
                                <span className="font-bold text-slate-700">{p.name}</span>
                            </div>
                            <p className="text-xs text-slate-500">{p.font}, {p.radius}</p>
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* 2. Colores */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <PaletteIcon className="w-5 h-5 text-blue-600" /> Colores
                    </h3>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Color Primario</label>
                        <div className="flex items-center gap-4">
                            <input
                                type="color"
                                name="primaryColor"
                                value={primaryColor}
                                onChange={(e) => setPrimaryColor(e.target.value)}
                                className="w-12 h-12 rounded-lg cursor-pointer border-0 p-0 overflow-hidden"
                            />
                            <div className="flex-1">
                                <input
                                    type="text"
                                    value={primaryColor}
                                    onChange={(e) => setPrimaryColor(e.target.value)}
                                    className="w-full px-4 py-2 border rounded-lg font-mono uppercase"
                                />
                                <p className="text-xs text-slate-400 mt-1">Genera automáticamente paletas hover/focus.</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Secundario</label>
                            <input type="color" name="secondaryColor" defaultValue={config?.secondaryColor} className="w-full h-10 rounded cursor-pointer" />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Acento</label>
                            <input type="color" name="accentColor" defaultValue={config?.accentColor} className="w-full h-10 rounded cursor-pointer" />
                        </div>
                    </div>
                </div>

                {/* 3. Tipografía y Forma */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <Type className="w-5 h-5 text-emerald-600" /> Tipografía y Forma
                    </h3>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Fuente Principal (Google Fonts)</label>
                        <select
                            name="fontFamily"
                            value={font}
                            onChange={(e) => setFont(e.target.value)}
                            className="w-full px-4 py-2 border rounded-lg"
                        >
                            <option value="Inter">Inter (Estándar)</option>
                            <option value="Roboto">Roboto (Android style)</option>
                            <option value="Poppins">Poppins (Geométrica)</option>
                            <option value="Lato">Lato (Humanista)</option>
                            <option value="Merriweather">Merriweather (Serif)</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Radio de Borde (Border Radius)</label>
                        <div className="flex items-center gap-4">
                            <input
                                type="range"
                                min="0" max="24"
                                value={radius === '0px' ? 0 : parseInt(radius.replace('rem', '')) * 16} // Aprox conversion for slider
                                onChange={(e) => {
                                    const val = e.target.value === '0' ? '0px' : (parseInt(e.target.value) / 16) + 'rem';
                                    setRadius(val);
                                }}
                                className="flex-1"
                            />
                            <span className="text-xs font-mono bg-slate-100 px-2 py-1 rounded">{radius}</span>
                            <input type="hidden" name="borderRadius" value={radius} />
                        </div>
                    </div>

                    {/* Preview de Botón */}
                    <div className="p-4 bg-slate-50 rounded-xl flex items-center justify-center gap-4">
                        <button type="button" style={{
                            backgroundColor: primaryColor,
                            borderRadius: radius,
                            fontFamily: font
                        }} className="text-white px-6 py-2 shadow-lg transition-all">
                            Botón Frontend
                        </button>
                        <div style={{ borderRadius: radius, border: `2px solid ${primaryColor}`, fontFamily: font }} className="px-6 py-2 text-slate-700 font-bold">
                            Outline
                        </div>
                    </div>
                </div>
            </div>

            {/* 4. Login Customization */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <Layout className="w-5 h-5 text-pink-600" /> Login & Branding
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Layout del Login</label>
                        <select name="loginLayout" defaultValue={config?.loginLayout} className="w-full px-4 py-2 border rounded-lg">
                            <option value="SPLIT">Split (Imagen Izq / Form Der)</option>
                            <option value="CENTERED">Centrado (Fondo Plano)</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Mensaje de Bienvenida</label>
                        <input name="loginMessage" defaultValue={config?.loginMessage || ''} placeholder="Ej: Bienvenido al Campus..." className="w-full px-4 py-2 border rounded-lg" />
                    </div>
                    <div className="col-span-2">
                        <label className="block text-sm font-bold text-slate-700 mb-2">CSS Personalizado (Avanzado)</label>
                        <textarea name="customCss" defaultValue={config?.customCss || ''} rows={4} className="w-full px-4 py-2 border rounded-lg font-mono text-xs bg-slate-900 text-green-400" placeholder=".sidebar { background: red !important; }" />
                    </div>
                </div>
            </div>

            <div className="flex justify-end pt-4">
                <button
                    type="submit"
                    disabled={isSaving}
                    className="bg-slate-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-black transition-all flex items-center gap-2 disabled:opacity-70"
                >
                    {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                    Guardar Diseño
                </button>
            </div>
        </form>
    );
}
