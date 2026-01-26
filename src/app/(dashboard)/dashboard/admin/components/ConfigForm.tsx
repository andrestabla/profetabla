'use client';

import { Cpu, Database, Palette, Mail } from 'lucide-react';
import { updatePlatformConfigAction } from '@/app/api/admin/actions';
import { useState } from 'react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function ConfigForm({ config }: { config: any }) {
    const [isSaving, setIsSaving] = useState(false);

    return (
        <form action={async (fd) => { setIsSaving(true); await updatePlatformConfigAction(fd); setIsSaving(false); }} className="grid grid-cols-1 md:grid-cols-2 gap-8">

            {/* 1. Integración GEMINI AI */}
            <div className="space-y-4">
                <h3 className="font-bold text-slate-800 flex items-center gap-2 border-b pb-2">
                    <Cpu className="w-5 h-5 text-purple-600" /> Inteligencia Artificial (Gemini)
                </h3>
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">API Key (Google AI Studio)</label>
                    <input type="password" name="geminiApiKey" defaultValue={config?.geminiApiKey || ''} className="w-full px-3 py-2 border rounded-lg" placeholder="sk-..." />
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Modelo</label>
                    <select name="geminiModel" defaultValue={config?.geminiModel || 'gemini-pro'} className="w-full px-3 py-2 border rounded-lg">
                        <option value="gemini-pro">Gemini Pro (Recomendado)</option>
                        <option value="gemini-ultra">Gemini Ultra</option>
                    </select>
                </div>
            </div>

            {/* 2. Conexión REPOSITORIOS (GitHub/GitLab) */}
            <div className="space-y-4">
                <h3 className="font-bold text-slate-800 flex items-center gap-2 border-b pb-2">
                    <Database className="w-5 h-5 text-slate-900" /> Repositorios de Código
                </h3>
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">GitHub Personal Access Token</label>
                    <input type="password" name="githubToken" defaultValue={config?.githubToken || ''} className="w-full px-3 py-2 border rounded-lg" placeholder="ghp_..." />
                    <p className="text-xs text-slate-400 mt-1">Necesario para clonar plantillas privadas o leer repos de estudiantes.</p>
                </div>
            </div>

            {/* 3. Configuración SMTP (Correo) */}
            <div className="space-y-4">
                <h3 className="font-bold text-slate-800 flex items-center gap-2 border-b pb-2">
                    <Mail className="w-5 h-5 text-blue-600" /> Servidor de Correo
                </h3>
                <div className="grid grid-cols-2 gap-4">
                    <input placeholder="Host (smtp.gmail.com)" name="smtpHost" defaultValue={config?.smtpHost || ''} className="px-3 py-2 border rounded-lg" />
                    <input placeholder="Puerto (587)" name="smtpPort" defaultValue={config?.smtpPort || '587'} className="px-3 py-2 border rounded-lg" />
                </div>
                <input placeholder="Usuario SMTP" name="smtpUser" defaultValue={config?.smtpUser || ''} className="w-full px-3 py-2 border rounded-lg" />
                <input type="password" placeholder="Contraseña SMTP" name="smtpPassword" className="w-full px-3 py-2 border rounded-lg" />
            </div>

            {/* 4. Look & Feel */}
            <div className="space-y-4">
                <h3 className="font-bold text-slate-800 flex items-center gap-2 border-b pb-2">
                    <Palette className="w-5 h-5 text-emerald-600" /> Personalización
                </h3>
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nombre Institución</label>
                    <input name="institutionName" defaultValue={config?.institutionName || 'Profe Tabla'} className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Color Primario</label>
                    <div className="flex gap-2">
                        <input type="color" name="primaryColor" defaultValue={config?.primaryColor || '#2563EB'} className="h-10 w-20" />
                        <input type="text" name="primaryColorText" defaultValue={config?.primaryColor || '#2563EB'} className="flex-1 px-3 py-2 border rounded-lg" />
                    </div>
                </div>
            </div>

            <div className="md:col-span-2 pt-4 border-t">
                <button type="submit" disabled={isSaving} className="bg-slate-900 text-white font-bold py-3 px-8 rounded-xl shadow-lg hover:bg-slate-800 w-full md:w-auto disabled:opacity-50">
                    {isSaving ? 'Guardando...' : 'Guardar Configuración del Sistema'}
                </button>
            </div>
        </form>
    );
}
