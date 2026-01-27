'use client';

import { Cpu, Mail, Cloud, Globe, Lock } from 'lucide-react';
import { updatePlatformConfigAction } from '@/app/api/admin/actions';
import { useState } from 'react';
import { IntegrationGuide } from './IntegrationGuide';

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
                <IntegrationGuide type="GEMINI" />
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

            {/* 2. Asistente SSO Google */}
            <div className="space-y-4">
                <h3 className="font-bold text-slate-800 flex items-center gap-2 border-b pb-2">
                    <Lock className="w-5 h-5 text-red-600" /> SSO con Google (Autenticación)
                </h3>
                <IntegrationGuide type="GOOGLE_SSO" />
                <p className="text-xs text-slate-500">
                    Configura el acceso para que usuarios (profesores y estudiantes) puedan iniciar sesión con su cuenta institucional de Google.
                </p>
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Google Client ID</label>
                    <input type="text" name="googleClientId" defaultValue={config?.googleClientId || ''} className="w-full px-3 py-2 border rounded-lg" placeholder="...apps.googleusercontent.com" />
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Google Client Secret</label>
                    <input type="password" name="googleClientSecret" defaultValue={config?.googleClientSecret || ''} className="w-full px-3 py-2 border rounded-lg" placeholder="..." />
                </div>
            </div>

            {/* 3. Integración Google Drive */}
            <div className="space-y-4">
                <h3 className="font-bold text-slate-800 flex items-center gap-2 border-b pb-2">
                    <Cloud className="w-5 h-5 text-blue-500" /> Google Drive (Recursos)
                </h3>
                <IntegrationGuide type="GOOGLE_DRIVE" />
                <p className="text-xs text-slate-500">
                    Habilita la integración para enlazar documentos y carpetas de Drive directamente en los proyectos y OAs.
                </p>
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Drive Client ID</label>
                    <input type="text" name="googleDriveClientId" defaultValue={config?.googleDriveClientId || ''} className="w-full px-3 py-2 border rounded-lg" placeholder="...apps.googleusercontent.com" />
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Drive Client Secret</label>
                    <input type="password" name="googleDriveClientSecret" defaultValue={config?.googleDriveClientSecret || ''} className="w-full px-3 py-2 border rounded-lg" placeholder="..." />
                </div>
            </div>

            {/* 4. Asistente Correo Saliente */}
            <div className="space-y-4">
                <h3 className="font-bold text-slate-800 flex items-center gap-2 border-b pb-2">
                    <Mail className="w-5 h-5 text-indigo-600" /> Correo Saliente (SMTP)
                </h3>
                <IntegrationGuide type="SMTP" />
                <p className="text-xs text-slate-500">
                    Configura el servidor para el envío de notificaciones automáticas, invitaciones y nuevas contraseñas.
                </p>
                <div className="grid grid-cols-2 gap-4">
                    <input placeholder="Host (smtp.gmail.com)" name="smtpHost" defaultValue={config?.smtpHost || ''} className="px-3 py-2 border rounded-lg" />
                    <input placeholder="Puerto (587)" name="smtpPort" defaultValue={config?.smtpPort || '587'} className="px-3 py-2 border rounded-lg" />
                </div>
                <input placeholder="Usuario SMTP" name="smtpUser" defaultValue={config?.smtpUser || ''} className="w-full px-3 py-2 border rounded-lg" />
                <input type="password" placeholder="Contraseña SMTP" name="smtpPassword" className="w-full px-3 py-2 border rounded-lg" />
            </div>

            <div className="md:col-span-2 pt-4 border-t">
                <button type="submit" disabled={isSaving} className="bg-slate-900 text-white font-bold py-3 px-8 rounded-xl shadow-lg hover:bg-slate-800 w-full md:w-auto disabled:opacity-50 flex items-center justify-center gap-2 mx-auto">
                    {isSaving ? (
                        <>
                            <Globe className="w-4 h-4 animate-spin" /> Guardando...
                        </>
                    ) : (
                        'Guardar Configuración del Sistema'
                    )}
                </button>
            </div>
        </form>
    );
}
