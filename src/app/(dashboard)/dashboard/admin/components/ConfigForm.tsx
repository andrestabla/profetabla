'use client';

import { Cpu, Mail, Cloud, Globe, Lock, CheckCircle, XCircle } from 'lucide-react';
import { updatePlatformConfigAction, sendTestEmailAction } from '@/app/api/admin/actions';
import { useState } from 'react';
import { IntegrationGuide } from './IntegrationGuide';

const StatusBadge = ({ isConfigured }: { isConfigured: boolean }) => (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${isConfigured ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
        {isConfigured ? <><CheckCircle className="w-3 h-3" /> ACTIVO</> : <><XCircle className="w-3 h-3" /> NO CONFIGURADO</>}
    </span>
);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function ConfigForm({ config }: { config: any }) {
    const [isSaving, setIsSaving] = useState(false);
    const [testEmail, setTestEmail] = useState('');
    const [testStatus, setTestStatus] = useState<'IDLE' | 'SENDING' | 'SUCCESS' | 'ERROR'>('IDLE');
    const [testMessage, setTestMessage] = useState('');

    // Controlled state for SMTP fields to allow testing unsaved credentials
    const [smtpHost, setSmtpHost] = useState(config?.smtpHost || '');
    const [smtpPort, setSmtpPort] = useState(config?.smtpPort || '587');
    const [smtpUser, setSmtpUser] = useState(config?.smtpUser || '');
    const [smtpPassword, setSmtpPassword] = useState('');
    const [smtpSenderName, setSmtpSenderName] = useState(config?.smtpSenderName || config?.institutionName || '');
    const [smtpFrom, setSmtpFrom] = useState(config?.smtpFrom || '');

    const handleTestEmail = async () => {
        if (!testEmail) return;
        setTestStatus('SENDING');
        setTestMessage('');

        const credentials = {
            smtpHost,
            smtpPort: parseInt(smtpPort),
            smtpUser,
            smtpPassword, // This might be empty if user didn't retype it, but helpful if they did
            smtpSenderName,
            smtpFrom
        };

        // If no password provided in input, and we have one in config, we don't pass it here
        // The backend knows to fallback to DB if credentials are partial? No, partial overrides are tricky.
        // Actually, if we pass credentials, we should pass ALL of them. 
        // If the user hasn't typed a password, we can't send it (security).
        // BUT, if the user sees "********", they expect it to work.
        // Simplified Logic: If user provides password, send it. If not, backend will use DB password? 
        // Wait, my backend logic uses `credentials` OR `db`. It doesn't merge.
        // For testing "unsaved" changes, the user MUST type the password if they want to test WITH that password.
        // If they leave it empty (placeholder), they might be testing existing config + new host?
        // Let's assume for "Test Connection", if they want to test a NEW config, they must type the password.
        // If they are testing existing config, they can leave it empty IF I merge in backend. 
        // Current backend: uses `credentials` object entirely if present.
        // Client side fix: If smtpPassword is empty, don't send it in credentials? 
        // But then backend safeConfig = credentials will lack password.

        // BETTER APPROACH: 
        // If password is empty, we assume the user intends to keep the current one.
        // BUT we can't get the current password to send it.
        // So we should only send `credentials` if `smtpPassword` is provided OR if we warn user "Enter password to test".

        // Actually, let's try to send what we have. If backend sees missing password in `credentials`, it fails.
        // So testing "new host" without retyping "password" will fail. This is acceptable security-wise.
        // I will add a tooltip or hint: "Ingresa la contraseña para probar la conexión".

        try {
            const result = await sendTestEmailAction(testEmail, credentials);
            if (result.success) {
                setTestStatus('SUCCESS');
                setTestMessage(result.message);
            } else {
                setTestStatus('ERROR');
                setTestMessage(result.message);
            }
            setTimeout(() => {
                setTestStatus('IDLE');
                setTestMessage('');
            }, 5000);
        } catch {
            setTestStatus('ERROR');
            setTestMessage('Error inesperado al conectar con el servidor.');
            setTimeout(() => {
                setTestStatus('IDLE');
                setTestMessage('');
            }, 5000);
        }
    };

    return (
        <form action={async (fd) => {
            setIsSaving(true);
            try {
                const result = await updatePlatformConfigAction(fd);
                if (result?.message) {
                    alert(result.message);
                }
            } catch {
                alert("Error crítico al guardar configuración.");
            } finally {
                setIsSaving(false);
            }
        }} className="grid grid-cols-1 md:grid-cols-2 gap-8">

            {/* 1. Integración GEMINI AI */}
            <div className="space-y-4">
                <div className="flex items-center justify-between border-b pb-2">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                        <Cpu className="w-5 h-5 text-purple-600" /> Inteligencia Artificial (Gemini)
                    </h3>
                    <StatusBadge isConfigured={!!config?.geminiApiKey} />
                </div>
                <IntegrationGuide type="GEMINI" />
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">API Key (Google AI Studio)</label>
                    <input type="password" name="geminiApiKey" defaultValue={config?.geminiApiKey || ''} className="w-full px-3 py-2 border rounded-lg" placeholder="sk-..." />
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Modelo</label>
                    <select name="geminiModel" defaultValue={config?.geminiModel || 'gemini-1.5-flash'} className="w-full px-3 py-2 border rounded-lg">
                        <optgroup label="Modelos Avanzados (Recomendados)">
                            <option value="gemini-2.0-flash">Gemini 2.0 Flash (Rápido y Potente)</option>
                            <option value="gemini-2.5-flash">Gemini 2.5 Flash (Última Generación)</option>
                            <option value="gemini-2.5-pro">Gemini 2.5 Pro (Máximo Razonamiento)</option>
                        </optgroup>
                        <optgroup label="Modelos Estándar">
                            <option value="gemini-1.5-flash">Gemini 1.5 Flash (Estándar)</option>
                            <option value="gemini-1.5-pro">Gemini 1.5 Pro (Legacy)</option>
                        </optgroup>
                    </select>
                </div>

                {/* Advanced AI Behavior */}
                <div className="pt-2 border-t border-dashed">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Instrucciones del Sistema (System Prompt)</label>
                    <textarea
                        name="aiInstructions"
                        defaultValue={config?.aiInstructions || 'Actúa como un experto Diseñador Instruccional...'}
                        className="w-full px-3 py-2 border rounded-lg text-sm h-24"
                        placeholder="Define la personalidad y el rol de la IA..."
                    />
                    <p className="text-[10px] text-slate-400 mt-1">Define el &quot;Rol&quot; base de la IA para todos los proyectos.</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Tono de Respuesta</label>
                        <select name="aiTone" defaultValue={config?.aiTone || 'ACADEMIC'} className="w-full px-3 py-2 border rounded-lg">
                            <option value="ACADEMIC">Académico / Formal</option>
                            <option value="CREATIVE">Creativo / Innovador</option>
                            <option value="PROFESSIONAL">Corporativo / Profesional</option>
                            <option value="SIMPLE">Sencillo / Explicativo</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Acceso a Web (Grounding)</label>
                        <div className="flex items-center h-10">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" name="aiSearchEnabled" defaultChecked={config?.aiSearchEnabled} className="w-4 h-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500" />
                                <span className="text-sm text-slate-700">Habilitar Búsqueda</span>
                            </label>
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. Asistente SSO Google */}
            <div className="space-y-4">
                <div className="flex items-center justify-between border-b pb-2">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                        <Lock className="w-5 h-5 text-red-600" /> SSO con Google (Autenticación)
                    </h3>
                    <StatusBadge isConfigured={!!config?.googleClientId && !!config?.googleClientSecret} />
                </div>
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
                <div className="flex items-center justify-between border-b pb-2">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                        <Cloud className="w-5 h-5 text-blue-500" /> Google Drive (Recursos)
                    </h3>
                    <StatusBadge isConfigured={!!config?.googleDriveClientId} />
                </div>
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
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Service Account (JSON)</label>
                    <textarea
                        name="googleDriveServiceAccountJson"
                        defaultValue={config?.googleDriveServiceAccountJson || ''}
                        className="w-full px-3 py-2 border rounded-lg h-24 font-mono text-xs"
                        placeholder='{ "type": "service_account", ... }'
                    />
                    <p className="text-[10px] text-slate-400 mt-1">
                        Pega aquí el contenido completo del archivo JSON de credenciales de la cuenta de servicio.
                    </p>
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Carpeta Maestra (ID o URL)</label>
                    <input type="text" name="googleDriveFolderId" defaultValue={config?.googleDriveFolderId || ''} className="w-full px-3 py-2 border rounded-lg" placeholder="ID de la carpeta aprobada para repositorios" />
                    <p className="text-[10px] text-slate-400 mt-1">Opcional: Restringe el acceso o define la raíz para nuevos proyectos.</p>
                </div>
            </div>

            {/* 4. Asistente Correo Saliente */}
            <div className="space-y-4">
                <div className="flex items-center justify-between border-b pb-2">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                        <Mail className="w-5 h-5 text-indigo-600" /> Correo Saliente (SMTP)
                    </h3>
                    <StatusBadge isConfigured={!!config?.smtpHost && !!config?.smtpUser} />
                </div>
                <IntegrationGuide type="SMTP" />
                <p className="text-xs text-slate-500">
                    Configura el servidor para el envío de notificaciones automáticas, invitaciones y nuevas contraseñas.
                </p>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Host SMTP</label>
                        <input
                            placeholder="smtp.gmail.com"
                            name="smtpHost"
                            value={smtpHost}
                            onChange={(e) => setSmtpHost(e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Puerto</label>
                        <input
                            placeholder="587"
                            name="smtpPort"
                            value={smtpPort}
                            onChange={(e) => setSmtpPort(e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nombre Remitente</label>
                        <input
                            placeholder="Ej: Profe Tabla"
                            name="smtpSenderName"
                            value={smtpSenderName}
                            onChange={(e) => setSmtpSenderName(e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email Remitente</label>
                        <input
                            placeholder="noreply@..."
                            name="smtpFrom"
                            value={smtpFrom}
                            onChange={(e) => setSmtpFrom(e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg"
                        />
                    </div>
                </div>

                <input
                    placeholder="Usuario SMTP (Email completo)"
                    name="smtpUser"
                    value={smtpUser}
                    onChange={(e) => setSmtpUser(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                />
                <div>
                    <input
                        type="password"
                        placeholder="Contraseña SMTP (App Password)"
                        name="smtpPassword"
                        value={smtpPassword}
                        onChange={(e) => setSmtpPassword(e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg"
                    />
                    <p className="text-[10px] text-slate-400 mt-1 ml-1">
                        * Ingrese la contraseña para probar la conexión con nuevos datos.
                    </p>
                </div>

                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 mt-2">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Prueba de Conexión</label>
                    <div className="flex gap-2">
                        <input
                            value={testEmail}
                            onChange={(e) => setTestEmail(e.target.value)}
                            placeholder="Email para prueba..."
                            className="flex-1 px-3 py-1 text-sm border rounded"
                        />
                        <button
                            type="button"
                            onClick={handleTestEmail}
                            disabled={testStatus === 'SENDING' || !testEmail}
                            className={`px-3 py-1 text-xs font-bold rounded transition-colors ${testStatus === 'SUCCESS' ? 'bg-green-600 text-white' :
                                testStatus === 'ERROR' ? 'bg-red-600 text-white' :
                                    'bg-slate-200 text-slate-700 hover:bg-slate-300'
                                }`}
                        >
                            {testStatus === 'SENDING' ? 'Enviando...' :
                                testStatus === 'SUCCESS' ? 'Enviado!' :
                                    testStatus === 'ERROR' ? 'Error' : 'Probar'}
                        </button>
                    </div>
                    {testMessage && (
                        <p className={`text-[10px] mt-2 font-medium ${testStatus === 'ERROR' ? 'text-red-600' : 'text-green-600'}`}>
                            {testMessage}
                        </p>
                    )}
                </div>
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
