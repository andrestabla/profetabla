'use client';

import { useState } from 'react';
import { HelpCircle, ExternalLink, ChevronDown, ChevronUp, Copy, Check } from 'lucide-react';

type GuideType = 'GEMINI' | 'OPENAI' | 'GOOGLE_SSO' | 'GOOGLE_DRIVE' | 'SMTP';

interface GuideStep {
    text: string;
    code?: string;
    link?: { url: string; label: string };
}

interface GuideContent {
    title: string;
    steps: GuideStep[];
}

const GUIDES: Record<GuideType, GuideContent> = {
    GEMINI: {
        title: 'Configurar Google Gemini AI',
        steps: [
            {
                text: 'Ve a Google AI Studio y crea un nuevo proyecto.',
                link: { url: 'https://aistudio.google.com/app/apikey', label: 'Google AI Studio' }
            },
            {
                text: 'Haz clic en "Get API key" y luego en "Create API key".'
            },
            {
                text: 'Copia la clave generada (empieza por "AIza...") y pégala en el campo de abajo.'
            }
        ]
    },
    OPENAI: {
        title: 'Configurar OpenAI API',
        steps: [
            {
                text: 'Ve a la plataforma de OpenAI y crea una cuenta si no tienes una.',
                link: { url: 'https://platform.openai.com/signup', label: 'OpenAI Platform' }
            },
            {
                text: 'Navega a la sección de API Keys.',
                link: { url: 'https://platform.openai.com/api-keys', label: 'API Keys' }
            },
            {
                text: 'Haz clic en "Create new secret key" y dale un nombre descriptivo (ej: "Profetabla Metadata").'
            },
            {
                text: 'Copia la clave generada (empieza por "sk-proj-...") y pégala en el campo de abajo. ⚠️ Solo se mostrará una vez.'
            },
            {
                text: 'Asegúrate de tener créditos en tu cuenta. Puedes agregar $5-10 USD para empezar (dura mucho tiempo con GPT-4o Mini).'
            }
        ]
    },
    GOOGLE_SSO: {
        title: 'Configurar Google Login (OAuth)',
        steps: [
            {
                text: 'Ve a la Consola de Google Cloud y crea un proyecto.',
                link: { url: 'https://console.cloud.google.com/apis/credentials', label: 'Google Cloud Console' }
            },
            {
                text: 'Configura la "Pantalla de consentimiento de OAuth" (OAuth Consent Screen). Selecciona "Externo" si es para cualquier cuenta de Google, o "Interno" si es solo para tu organización (Google Workspace).'
            },
            {
                text: 'En "Credenciales", crea una nueva credencial de tipo "ID de cliente de OAuth".'
            },
            {
                text: 'Tipo de aplicación: "Aplicación web".'
            },
            {
                text: 'En "Orígenes de JavaScript autorizados", añade tu dominio (ej: https://profetabla.com).'
            },
            {
                text: 'En "URI de redireccionamiento autorizados", añade la siguiente URL exacta:',
                code: 'https://profetabla.com/api/auth/callback/google'
            },
            {
                text: 'Copia el "ID de cliente" y el "Secreto de cliente" y pégalos abajo.'
            }
        ]
    },
    GOOGLE_DRIVE: {
        title: 'Habilitar API de Google Drive',
        steps: [
            {
                text: 'En el mismo proyecto de Google Cloud, ve a "Bibliotecas" (Library).',
                link: { url: 'https://console.cloud.google.com/apis/library', label: 'Biblioteca de APIs' }
            },
            {
                text: 'Busca "Google Drive API" y habilítala.'
            },
            {
                text: 'Nota: Si usas las mismas credenciales que para el Login, asegúrate de que el alcance (scope) incluya Drive si es necesario, o crea credenciales de cuenta de servicio si el acceso es del sistema (no del usuario).'
            },
            {
                text: 'Para este sistema, generalmente reutilizamos el Client ID/Secret del SSO si los usuarios van a acceder a SUS propios archivos, o una Service Account si el sistema gestiona los archivos centralmente. Por ahora, usa las mismas credenciales OAuth del SSO.'
            }
        ]
    },
    SMTP: {
        title: 'Configurar Correo (Gmail SMTP)',
        steps: [
            {
                text: 'Si usas Gmail, debes activar la autenticación de 2 pasos en tu cuenta.'
            },
            {
                text: 'Genera una "Contraseña de aplicación" (App Password).',
                link: { url: 'https://myaccount.google.com/apppasswords', label: 'Contraseñas de aplicación' }
            },
            {
                text: 'Selecciona "Correo" y el dispositivo (ej: "Servidor Web").'
            },
            {
                text: 'Usa "smtp.gmail.com", puerto 587.'
            },
            {
                text: 'Usuario: tu correo completo de Gmail.'
            },
            {
                text: 'Contraseña: la contraseña de 16 caracteres generada (sin espacios).'
            }
        ]
    }
};

export function IntegrationGuide({ type }: { type: GuideType }) {
    const [isOpen, setIsOpen] = useState(false);
    const content = GUIDES[type];
    const [copied, setCopied] = useState<string | null>(null);

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(text);
        setTimeout(() => setCopied(null), 2000);
    };

    return (
        <div className="mb-4">
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors"
            >
                <HelpCircle className="w-4 h-4" />
                {isOpen ? 'Ocultar guía de configuración' : 'Ver guía paso a paso'}
                {isOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>

            {isOpen && (
                <div className="mt-3 p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-600 animate-in fade-in slide-in-from-top-2 duration-200">
                    <h4 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                        {content.title}
                    </h4>
                    <ol className="list-decimal list-inside space-y-3">
                        {content.steps.map((step, idx) => (
                            <li key={idx} className="pl-1">
                                <span>{step.text}</span>
                                {step.link && (
                                    <a
                                        href={step.link.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 text-blue-600 hover:underline ml-1 font-medium"
                                    >
                                        {step.link.label} <ExternalLink className="w-3 h-3" />
                                    </a>
                                )}
                                {step.code && (
                                    <div className="mt-1.5 flex items-center gap-2 bg-slate-200/50 p-2 rounded-lg font-mono text-xs text-slate-800 break-all border border-slate-200">
                                        <span className="flex-1">{step.code}</span>
                                        <button
                                            type="button"
                                            onClick={() => handleCopy(step.code!)}
                                            className="p-1 hover:bg-slate-300 rounded transition-colors text-slate-500"
                                            title="Copiar"
                                        >
                                            {copied === step.code ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3" />}
                                        </button>
                                    </div>
                                )}
                            </li>
                        ))}
                    </ol>
                </div>
            )}
        </div>
    );
}
