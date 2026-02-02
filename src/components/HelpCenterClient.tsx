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
                        Una plataforma educativa de vanguardia diseñada para cerrar la brecha entre el aprendizaje académico y la práctica profesional mediante proyectos reales, mentoría experta e inteligencia artificial.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                            <Target className="w-6 h-6 text-blue-600" />
                        </div>
                        <h3 className="font-bold text-slate-800 mb-2">PBL Real</h3>
                        <p className="text-sm text-slate-500">Aprendizaje Basado en Proyectos con alineación directa a la industria.</p>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                        <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mb-4">
                            <Zap className="w-6 h-6 text-indigo-600" />
                        </div>
                        <h3 className="font-bold text-slate-800 mb-2">IA Asistida</h3>
                        <p className="text-sm text-slate-500">Generación de contenido profesional y análisis automatizado con Google Gemini.</p>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                        <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center mb-4">
                            <Users className="w-6 h-6 text-amber-600" />
                        </div>
                        <h3 className="font-bold text-slate-800 mb-2">Mentoría 1:1</h3>
                        <p className="text-sm text-slate-500">Sesiones directas con especialistas para guiar tu crecimiento.</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <h3 className="text-xl font-bold text-slate-800">Nuestra Metodología</h3>
                    <div className="space-y-3">
                        <div className="flex gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                            <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                            <div>
                                <p className="font-bold text-slate-800">Aprendizaje Experiencial</p>
                                <p className="text-sm text-slate-500">No solo teoría. Los estudiantes resuelven problemas reales del mundo laboral.</p>
                            </div>
                        </div>
                        <div className="flex gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                            <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                            <div>
                                <p className="font-bold text-slate-800">Feedback Continuo</p>
                                <p className="text-sm text-slate-500">Evaluación mediante rúbricas claras y sesiones de mentoría agendadas.</p>
                            </div>
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
                <h2 className="text-2xl font-bold text-slate-800">Recursos y Objetos de Aprendizaje</h2>
                <p className="text-slate-600">
                    Este es el corazón de la transferencia de conocimiento. Aquí encontrarás todo el material necesario para tu proyecto.
                </p>
                <div className="space-y-4">
                    <div className="p-5 border border-slate-200 rounded-2xl">
                        <h4 className="font-bold text-slate-800 mb-2">Tipos de Recursos</h4>
                        <ul className="list-disc list-inside text-sm text-slate-500 space-y-1">
                            <li>Videos integrados de YouTube.</li>
                            <li>Documentos PDF y enlaces externos.</li>
                            <li>Objetos de Aprendizaje (OA) estructurados con presentaciones y utilidades.</li>
                        </ul>
                    </div>
                    <div className="bg-blue-50 p-5 rounded-2xl border border-blue-100">
                        <h4 className="font-bold text-blue-800 mb-2">Interacción</h4>
                        <p className="text-sm text-blue-700">
                            Puedes marcar recursos como completados o favoritos. El sistema rastreará tu progreso para darte insights sobre tu camino de aprendizaje.
                        </p>
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
                <h2 className="text-2xl font-bold text-slate-800">Agendamiento y Asesorías</h2>
                <p className="text-slate-600">
                    Profe Tabla integra Google Calendar y Meet para facilitar el contacto directo con expertos.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200">
                        <h4 className="font-bold text-slate-800 mb-2">Como Estudiante</h4>
                        <p className="text-xs text-slate-500 mb-3">Tu cuota de mentorías depende de las tareas asignadas en tu proyecto activo.</p>
                        <ol className="list-decimal list-inside text-xs text-slate-500 space-y-2">
                            <li>Explora slots disponibles.</li>
                            <li>Reserva y recibe enlace de Meet.</li>
                            <li>Acude puntual a tu asesoría.</li>
                        </ol>
                    </div>
                    <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200">
                        <h4 className="font-bold text-slate-800 mb-2">Como Profesor/Admin</h4>
                        <p className="text-xs text-slate-500 mb-3">Tienes dos modalidades para gestionar el tiempo:</p>
                        <ul className="list-disc list-inside text-xs text-slate-500 space-y-2">
                            <li><strong>Office Hours</strong>: Publica disponibilidad general.</li>
                            <li><strong>Sesión Directa</strong>: Agenda a un grupo específico.</li>
                        </ul>
                    </div>
                </div>
                <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-amber-600 mt-1" />
                    <div>
                        <p className="text-xs font-bold text-amber-800">Tip de Configuración</p>
                        <p className="text-[10px] text-amber-700">Comparte tu calendario con el correo de la cuenta de servicio de la plataforma para sincronización automática en móviles.</p>
                    </div>
                </div>
            </div>
        )
    },
    {
        id: 'proyectos',
        title: 'Gestión de Proyectos',
        icon: Layers,
        content: (
            <div className="space-y-6">
                <h2 className="text-2xl font-bold text-slate-800">Kanban, Retos y Equipos</h2>
                <p className="text-slate-600">
                    La plataforma utiliza una metodología ágil para la gestión de entregas y colaboración.
                </p>
                <div className="space-y-4">
                    <div className="p-4 border-l-4 border-blue-500 bg-slate-50 rounded-r-xl">
                        <h4 className="font-bold text-slate-800 text-sm">Mercado (Market)</h4>
                        <p className="text-xs text-slate-500 mt-1">Donde los estudiantes encuentran y aplican a Proyectos, Retos o Problemas del mundo real.</p>
                    </div>
                    <div className="p-4 border-l-4 border-blue-500 bg-slate-50 rounded-r-xl">
                        <h4 className="font-bold text-slate-800 text-sm">Tablero Kanban</h4>
                        <p className="text-xs text-slate-500 mt-1">Organiza el trabajo en To-Do, In Progress y Done. Permite subir archivos y recibir feedback por rúbricas.</p>
                    </div>
                    <div className="p-4 border-l-4 border-blue-500 bg-slate-50 rounded-r-xl">
                        <h4 className="font-bold text-slate-800 text-sm">Gestión de Equipos</h4>
                        <p className="text-xs text-slate-500 mt-1">Permite el trabajo colaborativo donde varios estudiantes comparten una misma nota y progreso.</p>
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
                <h2 className="text-2xl font-bold text-slate-800">Visualización de Datos</h2>
                <p className="text-slate-600">
                    Tomamos decisiones basadas en evidencia. Los paneles de analítica ofrecen una vista 360° del rendimiento.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-5 bg-white border border-slate-200 rounded-2xl">
                        <h4 className="font-bold text-slate-800 mb-2">Para Profesores</h4>
                        <p className="text-xs text-slate-500 leading-relaxed">
                            Monitoreo de estudiantes en riesgo, distribución de notas, compromiso con recursos de aprendizaje y uso de mentorías.
                        </p>
                    </div>
                    <div className="p-5 bg-white border border-slate-200 rounded-2xl">
                        <h4 className="font-bold text-slate-800 mb-2">Para Administradores</h4>
                        <p className="text-xs text-slate-500 leading-relaxed">
                            Salud general de la plataforma: crecimiento de usuarios, estados de proyectos globales, y flujo de entregas mensual.
                        </p>
                    </div>
                </div>
            </div>
        )
    },
    {
        id: 'admin',
        title: 'Administración y Diseño',
        icon: Settings,
        content: (
            <div className="space-y-6">
                <h2 className="text-2xl font-bold text-slate-800">Personalización Pro</h2>
                <p className="text-slate-600">
                    Exclusivo para administradores: controla cada detalle de la experiencia de marca y operacional.
                </p>
                <div className="space-y-3">
                    <div className="flex gap-4 p-4 bg-slate-900 text-slate-300 rounded-2xl">
                        <Settings className="w-5 h-5 text-blue-400 shrink-0" />
                        <div>
                            <p className="font-bold text-white text-sm">Branding Dinámico</p>
                            <p className="text-xs">Cambia colores, tipografías, logotipos y layouts de login en tiempo real sin tocar código.</p>
                        </div>
                    </div>
                    <div className="flex gap-4 p-4 bg-slate-900 text-slate-300 rounded-2xl">
                        <Zap className="w-5 h-5 text-amber-400 shrink-0" />
                        <div>
                            <p className="font-bold text-white text-sm">Integraciones AI & Cloud</p>
                            <p className="text-xs">Configura API keys de Google Gemini/OpenAI, Cloudflare R2 para almacenamiento y SMTP para correos.</p>
                        </div>
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
