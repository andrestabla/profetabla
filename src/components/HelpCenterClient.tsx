'use client';

import React, { useState } from 'react';
import {
    HelpCircle,
    BookOpen,
    Calendar,
    PieChart,
    Settings,
    Layers,
    Target,
    Zap,
    Users,
    Search,
    ChevronRight,
    Rocket,
    CheckCircle2
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Section {
    id: string;
    title: string;
    icon: React.ElementType;
    content: React.ReactNode;
}

const SECTIONS: Section[] = [
    {
        id: 'inicio',
        title: '¿Qué es Profe Tabla?',
        icon: Rocket,
        content: (
            <div className="space-y-8">
                <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-8 text-white shadow-xl shadow-blue-500/20">
                    <h2 className="text-3xl font-black mb-4">Bienvenidos a Profe Tabla</h2>
                    <p className="text-blue-50 text-lg leading-relaxed max-w-2xl">
                        Una plataforma educativa de vanguardia donde el <strong>corazón</strong> de la experiencia son los <strong>Proyectos, Retos y Problemas</strong>. Todo lo demás—aprendizaje, mentorías y analítica—se deriva de estos núcleos de acción profesional.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                            <Target className="w-6 h-6 text-blue-600" />
                        </div>
                        <h3 className="font-bold text-slate-800 mb-2">Metodología Core</h3>
                        <p className="text-sm text-slate-500">Centrada en la resolución de desafíos reales de la industria.</p>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                        <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mb-4">
                            <Zap className="w-6 h-6 text-indigo-600" />
                        </div>
                        <h3 className="font-bold text-slate-800 mb-2">Diferencial Único</h3>
                        <p className="text-sm text-slate-500">Integración de IA para potenciar la creación de soluciones profesionales.</p>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                        <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center mb-4">
                            <Users className="w-6 h-6 text-amber-600" />
                        </div>
                        <h3 className="font-bold text-slate-800 mb-2">Conexión Humana</h3>
                        <p className="text-sm text-slate-500">Mentoría experta sincronizada con tu avance en el proyecto.</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <h3 className="text-xl font-bold text-slate-800">¿Cómo funciona?</h3>
                    <div className="space-y-3">
                        <div className="flex gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                            <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                            <div>
                                <p className="font-bold text-slate-800">1. Seleccionas tu Núcleo</p>
                                <p className="text-sm text-slate-500">Eliges un Proyecto, Reto o Problema desde el Mercado.</p>
                            </div>
                        </div>
                        <div className="flex gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                            <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                            <div>
                                <p className="font-bold text-slate-800">2. Derivas Acción</p>
                                <p className="text-sm text-slate-500">A partir de allí, se habilitan recursos de aprendizaje y cuotas de mentoría.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    },
    {
        id: 'proyectos',
        title: 'El Corazón: Proyectos, Retos y Problemas',
        icon: Layers,
        content: (
            <div className="space-y-6">
                <h2 className="text-2xl font-bold text-slate-800">El Eje Central del Sistema</h2>
                <p className="text-slate-600 leading-relaxed">
                    En Profe Tabla, no aprendes para hacer un proyecto; <strong>haces un proyecto para aprender</strong>. Existen tres modalidades de &quot;Corazón&quot;:
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl">
                        <h4 className="font-bold text-blue-900 text-sm">Proyectos</h4>
                        <p className="text-[10px] text-blue-700 mt-1">Estructuras completas con entregables de largo plazo y equipos.</p>
                    </div>
                    <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl">
                        <h4 className="font-bold text-indigo-900 text-sm">Retos</h4>
                        <p className="text-[10px] text-indigo-700 mt-1">Desafíos específicos de habilidades técnicas con resolución rápida.</p>
                    </div>
                    <div className="p-4 bg-purple-50 border border-purple-100 rounded-2xl">
                        <h4 className="font-bold text-purple-900 text-sm">Problemas</h4>
                        <p className="text-[10px] text-purple-700 mt-1">Situaciones de la vida real que requieren pensamiento crítico y diseño.</p>
                    </div>
                </div>

                <div className="space-y-4 mt-6">
                    <h3 className="text-lg font-bold text-slate-800">Guía de Uso: Empezando tu camino</h3>
                    <div className="space-y-4">
                        <div className="p-5 border border-slate-100 rounded-2xl bg-white shadow-sm">
                            <h4 className="font-bold text-slate-800 text-sm mb-2 flex items-center gap-2">
                                <span className="w-5 h-5 bg-slate-800 text-white rounded-full flex items-center justify-center text-[10px]">1</span>
                                Inscripción en el Mercado
                            </h4>
                            <p className="text-xs text-slate-500">Visita el &quot;Mercado de Proyectos&quot;, busca el que más te apasione y solicita unirte. Si es con código, ingrésalo en la sección dedicada.</p>
                        </div>
                        <div className="p-5 border border-slate-100 rounded-2xl bg-white shadow-sm">
                            <h4 className="font-bold text-slate-800 text-sm mb-2 flex items-center gap-2">
                                <span className="w-5 h-5 bg-slate-800 text-white rounded-full flex items-center justify-center text-[10px]">2</span>
                                Dominio del Kanban
                            </h4>
                            <p className="text-xs text-slate-500">Una vez activo, tu tablero Kanban mostrará las tareas. Arrastra desde &quot;Por hacer&quot; a &quot;En proceso&quot;. Sube tus archivos finales en la tarea correspondiente para que el mentor los califique.</p>
                        </div>
                    </div>
                </div>
            </div>
        )
    },
    {
        id: 'aprendizaje',
        title: 'Módulo de Aprendizaje',
        icon: BookOpen,
        content: (
            <div className="space-y-6">
                <h2 className="text-2xl font-bold text-slate-800">Conocimiento Aplicado</h2>
                <p className="text-slate-600">
                    Los recursos no son aislados; están curados para ayudarte a resolver tu Proyecto activo.
                </p>
                <div className="space-y-4">
                    <div className="p-5 border border-slate-200 rounded-2xl">
                        <h4 className="font-bold text-slate-800 mb-2">¿Cómo estudiar?</h4>
                        <ul className="list-disc list-inside text-sm text-slate-500 space-y-2">
                            <li><strong>Videos e IA</strong>: Mira el contenido y usa el botón de IA para resumir o extraer ideas clave.</li>
                            <li><strong>OAs (Objetos de Aprendizaje)</strong>: Sigue el flujo de Presentación → Utilidad → Recursos. Es una ruta guiada.</li>
                            <li><strong>Favoritos</strong>: Guarda lo que necesites consultar frecuentemente mientras trabajas en el Kanban.</li>
                        </ul>
                    </div>
                </div>
            </div>
        )
    },
    {
        id: 'mentorias',
        title: 'Módulo de Mentorías',
        icon: Calendar,
        content: (
            <div className="space-y-6">
                <h2 className="text-2xl font-bold text-slate-800">Acompañamiento Estratégico</h2>
                <p className="text-slate-600">
                    Las mentorías se habilitan como un recurso premium derivado de tu compromiso con el proyecto.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200">
                        <h4 className="font-bold text-slate-800 mb-2 underline decoration-blue-500">¿Cómo agendar?</h4>
                        <p className="text-[10px] text-slate-500 mb-3">Tu disponibilidad de sesiones aumenta a medida que tienes tareas asignadas.</p>
                        <ol className="list-decimal list-inside text-[10px] text-slate-500 space-y-2">
                            <li>Elige un docente disponible.</li>
                            <li>Selecciona un slot (espacio de tiempo).</li>
                            <li>Escribe una nota clara sobre el problema que quieres resolver.</li>
                            <li>Revisa tu correo para el enlace de Meet/Calendar.</li>
                        </ol>
                    </div>
                    <div className="p-5 bg-white rounded-2xl border border-slate-200">
                        <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-2">
                            <Zap className="w-4 h-4 text-amber-500" />
                            Regla de Oro
                        </h4>
                        <p className="text-[10px] text-slate-500">
                            No pidas una mentoría &quot;para ver qué hay que hacer&quot;. Úsala cuando en tu Kanban estés bloqueado o necesites feedback sobre un avance real.
                        </p>
                    </div>
                </div>
            </div>
        )
    },
    {
        id: 'analitica',
        title: 'Analítica y Progreso',
        icon: PieChart,
        content: (
            <div className="space-y-6">
                <h2 className="text-2xl font-bold text-slate-800">Tu Desempeño en Datos</h2>
                <p className="text-slate-600">
                    Visualizamos el impacto de tus acciones sobre el &quot;Corazón&quot; del sistema.
                </p>
                <div className="bg-slate-900 rounded-3xl p-6 text-white">
                    <h4 className="font-bold text-blue-400 mb-4">Métricas que importan</h4>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="border border-slate-700 p-3 rounded-xl">
                            <p className="text-[10px] text-slate-400 uppercase font-bold">Riesgo Académico</p>
                            <p className="text-xs mt-1">Alerta temprana si tu Kanban se detiene por mucho tiempo.</p>
                        </div>
                        <div className="border border-slate-700 p-3 rounded-xl">
                            <p className="text-[10px] text-slate-400 uppercase font-bold">Compromiso</p>
                            <p className="text-xs mt-1">¿Cuánto de los recursos sugeridos has consumido realmente?</p>
                        </div>
                    </div>
                </div>
            </div>
        )
    },
    {
        id: 'admin',
        title: 'Administración y Configuración',
        icon: Settings,
        content: (
            <div className="space-y-6">
                <h2 className="text-2xl font-bold text-slate-800">Control Maestro</h2>
                <p className="text-slate-600">
                    Solo para administradores: Configura el motor que hace funcionar todo lo anterior.
                </p>
                <div className="space-y-4">
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <h4 className="font-bold text-slate-800 text-sm">¿Cómo configurar la IA?</h4>
                        <p className="text-xs text-slate-500 mt-1">Ingresa tus API Keys en el Panel de Administración. Esto habilita las funciones de resumen y generación automática de objetos de aprendizaje.</p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <h4 className="font-bold text-slate-800 text-sm">Personalización de Marca</h4>
                        <p className="text-xs text-slate-500 mt-1">Sube el logo de tu institución y ajusta el color primario para que toda la plataforma se sienta propia.</p>
                    </div>
                </div>
            </div>
        )
    }
];

export function HelpCenterClient() {
    const [activeSection, setActiveSection] = useState('inicio');
    const [searchQuery, setSearchQuery] = useState('');

    const filteredSections = SECTIONS.filter(s =>
        s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.id.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const activeData = SECTIONS.find(s => s.id === activeSection) || SECTIONS[0];

    return (
        <div className="min-h-screen bg-slate-50/50">
            <div className="max-w-7xl mx-auto px-4 py-12">
                <header className="mb-12">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-blue-600 rounded-2xl text-white shadow-lg shadow-blue-500/20">
                            <HelpCircle className="w-8 h-8" />
                        </div>
                        <div>
                            <h1 className="text-4xl font-black text-slate-800 tracking-tight">Centro de Ayuda</h1>
                            <p className="text-slate-500 font-medium">Todo lo que necesitas saber sobre Profe Tabla</p>
                        </div>
                    </div>

                    <div className="relative max-w-xl">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Buscar en la documentación..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-2xl py-4 pl-12 pr-4 text-sm font-medium focus:ring-4 focus:ring-blue-500/10 outline-none transition-all shadow-sm"
                        />
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* Navigation Sidebar */}
                    <nav className="lg:col-span-3 space-y-2">
                        {filteredSections.map((section) => (
                            <button
                                key={section.id}
                                onClick={() => setActiveSection(section.id)}
                                className={cn(
                                    "w-full flex items-center justify-between p-4 rounded-2xl transition-all group",
                                    activeSection === section.id
                                        ? "bg-white border-blue-500 border-2 shadow-md shadow-blue-500/5 text-blue-700"
                                        : "bg-transparent border border-transparent text-slate-500 hover:bg-white hover:border-slate-200"
                                )}
                            >
                                <div className="flex items-center gap-3">
                                    <section.icon className={cn("w-5 h-5", activeSection === section.id ? "text-blue-600" : "text-slate-400 group-hover:text-slate-600")} />
                                    <span className="font-bold text-sm tracking-tight">{section.title}</span>
                                </div>
                                <ChevronRight className={cn("w-4 h-4 transition-transform", activeSection === section.id ? "translate-x-0.5" : "text-slate-300 opacity-0 group-hover:opacity-100")} />
                            </button>
                        ))}
                    </nav>

                    {/* Content Area */}
                    <main className="lg:col-span-9 bg-white border border-slate-200 rounded-[2.5rem] shadow-xl shadow-slate-200/50 overflow-hidden">
                        <div className="p-8 md:p-12">
                            {activeData.content}
                        </div>

                        <footer className="bg-slate-50 border-t border-slate-100 p-8 flex flex-col md:flex-row items-center justify-between gap-4">
                            <div className="text-slate-400 text-xs font-bold uppercase tracking-widest">
                                © 2026 Profe Tabla | Advanced Analytics & AI
                            </div>
                            <div className="flex items-center gap-6">
                                <a href="#" className="text-xs font-black text-slate-400 hover:text-blue-600 transition-colors uppercase tracking-wider">Soporte Técnico</a>
                                <a href="#" className="text-xs font-black text-slate-400 hover:text-blue-600 transition-colors uppercase tracking-wider">Términos de Uso</a>
                            </div>
                        </footer>
                    </main>
                </div>
            </div>
        </div>
    );
}
