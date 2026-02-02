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
    CheckCircle2,
    Briefcase,
    Trophy,
    AlertCircle
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
            <div className="space-y-10">
                {/* Hero Section */}
                <div className="bg-gradient-to-br from-[#1E293B] via-[#0F172A] to-blue-900 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden ring-1 ring-white/10">
                    <div className="relative z-10">
                        <span className="inline-block px-4 py-1.5 bg-blue-500/20 border border-blue-400/30 rounded-full text-blue-300 text-[10px] font-black uppercase tracking-[0.2em] mb-6">
                            Nuestra Visión
                        </span>
                        <h2 className="text-4xl font-black mb-6 leading-tight">
                            La Revolución del <span className="text-blue-400">Aprendizaje Aplicado</span>
                        </h2>
                        <p className="text-slate-300 text-lg leading-relaxed max-w-3xl font-medium">
                            Profe Tabla no es solo un gestor de cursos; es un <strong>ecosistema de aceleración profesional</strong>. Nuestra filosofía se basa en que el conocimiento solo se consolida cuando se aplica para resolver tensiones reales del mercado laboral.
                        </p>
                    </div>
                    {/* Background decoration */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 blur-[100px] rounded-full -mr-20 -mt-20"></div>
                </div>

                {/* The Core Pillars */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="group bg-white border border-slate-100 rounded-3xl p-8 hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-500 ring-1 ring-slate-100">
                        <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
                            <Target className="w-7 h-7 text-blue-600" />
                        </div>
                        <h3 className="font-black text-slate-800 text-xl mb-3">PBL de Élite</h3>
                        <p className="text-sm text-slate-500 leading-relaxed">
                            No usamos ejercicios de juguete. El <strong>Project Based Learning (PBL)</strong> en Profe Tabla utiliza retos diseñados por expertos de la industria que imitan el flujo de trabajo de empresas reales.
                        </p>
                    </div>
                    <div className="group bg-white border border-slate-100 rounded-3xl p-8 hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-500 ring-1 ring-slate-100">
                        <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
                            <Zap className="w-7 h-7 text-indigo-600" />
                        </div>
                        <h3 className="font-black text-slate-800 text-xl mb-3">Inteligencia Aumentada</h3>
                        <p className="text-sm text-slate-500 leading-relaxed">
                            A diferencia de otras plataformas, aquí la IA (Google Gemini) no hace el trabajo por ti, sino que actúa como un <strong>Copiloto Estratégico</strong> que te ayuda a desglosar problemas complejos y resumir documentación densa.
                        </p>
                    </div>
                    <div className="group bg-white border border-slate-100 rounded-3xl p-8 hover:shadow-xl hover:shadow-amber-500/5 transition-all duration-500 ring-1 ring-slate-100">
                        <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
                            <Users className="w-7 h-7 text-amber-600" />
                        </div>
                        <h3 className="font-black text-slate-800 text-xl mb-3">Docencia Mentorizada</h3>
                        <p className="text-sm text-slate-500 leading-relaxed">
                            Cambiamos el rol del profesor de &quot;expositor&quot; a <strong>Mentor</strong>. El contacto humano ocurre en el momento justo cuando el estudiante enfrenta un bloqueo técnico, optimizando cada minuto de asesoría.
                        </p>
                    </div>
                </div>

                {/* Deep Dive Methodology */}
                <div className="bg-slate-50 border border-slate-200 rounded-[2.5rem] p-8 md:p-12">
                    <div className="flex flex-col md:flex-row gap-12 items-center">
                        <div className="flex-1 space-y-6">
                            <h3 className="text-2xl font-black text-slate-800">¿Por qué este modelo es superior?</h3>
                            <p className="text-slate-600 leading-relaxed">
                                El modelo tradicional de &quot;clase-estudio-examen&quot; tiene una retención del 5-10%. El modelo de Profe Tabla de <strong>Aprendizaje por Acción</strong> eleva la retención al 75-90% al forzar la conexión sináptica entre la teoría y la resolución de problemas.
                            </p>
                            <ul className="space-y-4">
                                {[
                                    { title: "Enfoque en Resultados", desc: "Todo lo que haces suma a tu portafolio profesional." },
                                    { title: "Flexibilidad Dinámica", desc: "Avanzas a tu ritmo, pero con hitos claros definidos en el Kanban." },
                                    { title: "Evaluación por Evidencia", desc: "No hay notas subjetivas; hay rúbricas basadas en la calidad del entregable." }
                                ].map((item, i) => (
                                    <li key={i} className="flex gap-4">
                                        <div className="mt-1 flex-shrink-0 w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                                            <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-800 text-sm">{item.title}</p>
                                            <p className="text-xs text-slate-500">{item.desc}</p>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="w-full md:w-72 bg-white p-6 rounded-[2rem] border border-slate-200 shadow-lg rotate-3 hidden md:block">
                            <div className="space-y-4">
                                <div className="h-4 bg-slate-100 rounded-full w-3/4"></div>
                                <div className="h-4 bg-slate-100 rounded-full w-full"></div>
                                <div className="h-4 bg-slate-100 rounded-full w-1/2"></div>
                                <div className="pt-4 flex justify-between">
                                    <div className="w-10 h-10 bg-blue-100 rounded-xl"></div>
                                    <div className="w-10 h-10 bg-indigo-100 rounded-xl"></div>
                                    <div className="w-10 h-10 bg-amber-100 rounded-xl"></div>
                                </div>
                                <p className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-4">Platform Blueprint</p>
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
            <div className="space-y-8">
                <div className="space-y-4">
                    <h2 className="text-3xl font-black text-slate-800">El Núcleo Generador</h2>
                    <p className="text-slate-600 text-lg leading-relaxed">
                        En Profe Tabla, nada ocurre por azar. Cada interacción del sistema nace de un <strong>desafío real</strong>. Cuando eliges un proyecto, no solo estás eligiendo una tarea; estás activando un flujo de aprendizaje personalizado.
                    </p>
                </div>

                {/* The Three Modalities */}
                <div className="space-y-6">
                    <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <div className="w-2 h-8 bg-blue-600 rounded-full"></div>
                        Las Tres Modalidades de Acción
                    </h3>
                    <div className="grid grid-cols-1 gap-6">
                        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex gap-6 items-start">
                            <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center shrink-0">
                                <Briefcase className="w-6 h-6 text-blue-600" />
                            </div>
                            <div className="space-y-2">
                                <h4 className="font-black text-slate-800 uppercase tracking-wider text-sm">1. Proyectos (Sprints de Largo Plazo)</h4>
                                <p className="text-sm text-slate-500 leading-relaxed">
                                    Son simulaciones de proyectos reales de la industria. Tienen una duración extendida y están compuestos por múltiples tareas en el Kanban. Permiten el trabajo en <strong>Equipos</strong> y generan la mayor cantidad de cuotas de mentoría.
                                </p>
                            </div>
                        </div>
                        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex gap-6 items-start">
                            <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center shrink-0">
                                <Trophy className="w-6 h-6 text-indigo-600" />
                            </div>
                            <div className="space-y-2">
                                <h4 className="font-black text-slate-800 uppercase tracking-wider text-sm">2. Retos (Hard Skills)</h4>
                                <p className="text-sm text-slate-500 leading-relaxed">
                                    Desafíos puntuales diseñados para validar una habilidad técnica específica. Son ideales para <strong>validar competencias</strong> rápidamente. Tienen menos tareas pero son intensivos en profundidad técnica.
                                </p>
                            </div>
                        </div>
                        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex gap-6 items-start">
                            <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center shrink-0">
                                <AlertCircle className="w-6 h-6 text-purple-600" />
                            </div>
                            <div className="space-y-2">
                                <h4 className="font-black text-slate-800 uppercase tracking-wider text-sm">3. Problemas (Soft Skills & Diseño)</h4>
                                <p className="text-sm text-slate-500 leading-relaxed">
                                    Situaciones abiertas donde no hay una sola respuesta correcta. Aquí lo que importa es el <strong>proceso de razonamiento</strong> y la propuesta de solución creativa. Miden tu capacidad de resolución de conflictos.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* The Domino Effect */}
                <div className="bg-blue-900 rounded-[2.5rem] p-8 text-white">
                    <h3 className="text-xl font-bold mb-6">El Efecto Dominó: ¿Qué pasa al elegir uno?</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="flex gap-4 p-4 bg-white/10 rounded-2xl border border-white/10">
                            <BookOpen className="w-5 h-5 text-blue-300 shrink-0" />
                            <div>
                                <p className="font-bold text-sm">Filtro de Aprendizaje</p>
                                <p className="text-[10px] text-blue-100 mt-1">El módulo de Aprendizaje se ajusta para mostrarte solo los recursos relevantes para este desafío.</p>
                            </div>
                        </div>
                        <div className="flex gap-4 p-4 bg-white/10 rounded-2xl border border-white/10">
                            <Calendar className="w-5 h-5 text-blue-300 shrink-0" />
                            <div>
                                <p className="font-bold text-sm">Activación de Mentorías</p>
                                <p className="text-[10px] text-blue-100 mt-1">Se liberan cuotas de atención personalizada según la complejidad del proyecto elegido.</p>
                            </div>
                        </div>
                        <div className="flex gap-4 p-4 bg-white/10 rounded-2xl border border-white/10">
                            <PieChart className="w-5 h-5 text-blue-300 shrink-0" />
                            <div>
                                <p className="font-bold text-sm">Trazabilidad de Analítica</p>
                                <p className="text-[10px] text-blue-100 mt-1">Cada movimiento en el Kanban alimenta tu panel de progreso y permite al mentor ver dónde necesitas ayuda.</p>
                            </div>
                        </div>
                        <div className="flex gap-4 p-4 bg-white/10 rounded-2xl border border-white/10">
                            <Settings className="w-5 h-5 text-blue-300 shrink-0" />
                            <div>
                                <p className="font-bold text-sm">Diferenciación de Rol</p>
                                <p className="text-[10px] text-blue-100 mt-1">Ajusta los permisos de lo que puedes ver y hacer dentro de la plataforma basándose en el proyecto.</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Guide to use */}
                <div className="space-y-4">
                    <h3 className="text-xl font-bold text-slate-800">Guía del Usuario: Navegando el Nucleo</h3>
                    <div className="space-y-4">
                        <div className="flex gap-6 p-6 bg-white border border-slate-100 rounded-3xl group shadow-sm hover:border-blue-200 transition-colors">
                            <div className="w-10 h-10 rounded-full bg-slate-800 text-white flex items-center justify-center font-black shrink-0 text-sm">1</div>
                            <div>
                                <p className="font-black text-slate-800 text-lg mb-1">Exploración y Oferta</p>
                                <p className="text-sm text-slate-500 leading-relaxed">
                                    Entra al &quot;Mercado de Proyectos&quot;. Cada oferta tiene una ficha técnica: duración, nivel de dificultad y tecnologías requeridas. Léela bien antes de aplicar.
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-6 p-6 bg-white border border-slate-100 rounded-3xl group shadow-sm hover:border-blue-200 transition-colors">
                            <div className="w-10 h-10 rounded-full bg-slate-800 text-white flex items-center justify-center font-black shrink-0 text-sm">2</div>
                            <div>
                                <p className="font-black text-slate-800 text-lg mb-1">El Tablero de Control (Kanban)</p>
                                <p className="text-sm text-slate-500 leading-relaxed">
                                    Una vez aceptado, verás tu tablero. El <strong>Kanban</strong> es tu brújula. Divide tu trabajo, no intentes hacer todo a la vez. Cuando termines una tarea, súbela y espera el feedback del mentor.
                                </p>
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
            <div className="space-y-8">
                <div className="space-y-4">
                    <h2 className="text-3xl font-black text-slate-800">Tu Biblioteca Inteligente</h2>
                    <p className="text-slate-600 text-lg leading-relaxed">
                        El aprendizaje en Profe Tabla no es lineal. No te pedimos que veas 100 videos. El sistema <strong>filtra el contenido</strong> basándose en tu proyecto activo para que consumas solo lo que necesitas aplicar hoy.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                        <h4 className="font-black text-slate-800 mb-3 flex items-center gap-2">
                            <Layers className="w-5 h-5 text-blue-600" />
                            Contenido Curado
                        </h4>
                        <p className="text-xs text-slate-500 leading-relaxed">
                            Cada proyecto tiene una &quot;Ruta de Conocimiento&quot;. Son micro-cápsulas de teoría, documentación técnica y ejemplos de código diseñados para resolver las tareas de tu Kanban.
                        </p>
                    </div>
                    <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                        <h4 className="font-black text-slate-800 mb-3 flex items-center gap-2">
                            <Zap className="w-5 h-5 text-amber-500" />
                            IA Support
                        </h4>
                        <p className="text-xs text-slate-500 leading-relaxed">
                            Utiliza nuestra integración con Gemini para resumir artículos largos o explicar fragmentos de código complejos que encuentres en el material de estudio.
                        </p>
                    </div>
                </div>

                <div className="space-y-4">
                    <h3 className="text-xl font-bold text-slate-800">¿Cómo estudiar efectivamente?</h3>
                    <div className="bg-white border-l-4 border-blue-600 p-6 rounded-r-3xl shadow-sm">
                        <p className="text-sm text-slate-600 italic">
                            &quot;No intentes aprenderlo todo antes de empezar. El material está ahí para consultarlo cuando la tarea del Kanban te lo exija. El aprendizaje más profundo ocurre en el momento de la necesidad.&quot;
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
            <div className="space-y-8">
                <div className="space-y-4">
                    <h2 className="text-3xl font-black text-slate-800">Sincronización con Expertos</h2>
                    <p className="text-slate-600 text-lg leading-relaxed">
                        Las mentorías son el recurso más valioso de la plataforma. Son espacios de 15 a 30 minutos donde un experto revisa tu avance y te ayuda a <strong>desbloquear tu progreso</strong>.
                    </p>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-[2.5rem] p-8">
                    <h4 className="font-black text-amber-900 text-xl mb-4 flex items-center gap-3">
                        <Zap className="w-6 h-6 text-amber-600" />
                        La Regla de Oro
                    </h4>
                    <p className="text-sm text-amber-800 leading-relaxed mb-6">
                        Una mentoría <strong>NO es una clase magistral</strong>. No es para que el mentor te explique la teoría desde cero. Es para resolver un punto ciego técnico o recibir feedback sobre una arquitectura que ya empezaste.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-white/60 p-4 rounded-2xl flex gap-3 items-start">
                            <CheckCircle2 className="w-4 h-4 text-green-600 mt-1 shrink-0" />
                            <p className="text-[10px] text-slate-700"><strong>SÍ:</strong> &quot;Tengo este error en mi código que no he podido resolver tras 1 hora de intentos.&quot;</p>
                        </div>
                        <div className="bg-white/60 p-4 rounded-2xl flex gap-3 items-start">
                            <div className="w-4 h-4 bg-red-100 rounded-full flex items-center justify-center mt-1 shrink-0">
                                <span className="text-[10px] text-red-600 font-bold">X</span>
                            </div>
                            <p className="text-[10px] text-slate-700"><strong>NO:</strong> &quot;Se me olvidó cómo se hacía un bucle, ¿me explicas?&quot;</p>
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <h3 className="text-xl font-bold text-slate-800 italic decoration-blue-500 underline">Proceso de Agendamiento</h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {[
                            { step: "1", title: "Estado", desc: "Debes tener tareas activas en tu Kanban." },
                            { step: "2", title: "Reserva", desc: "Elige un slot libre en el calendario del mentor." },
                            { step: "3", title: "Contexto", desc: "Escribe una nota clara con el problema a tratar." },
                            { step: "4", title: "Sesión", desc: "Conéctate puntualmente con tu código listo." }
                        ].map((item, i) => (
                            <div key={i} className="text-center p-4">
                                <span className="text-4xl font-black text-slate-100">{item.step}</span>
                                <h5 className="font-bold text-slate-800 text-xs mt-[-1rem]">{item.title}</h5>
                                <p className="text-[10px] text-slate-500 mt-1">{item.desc}</p>
                            </div>
                        ))}
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
            <div className="space-y-8">
                <div className="space-y-4">
                    <h2 className="text-3xl font-black text-slate-800">Tu Desempeño en Datos</h2>
                    <p className="text-slate-600 text-lg leading-relaxed">
                        Visualizamos el impacto de tus acciones sobre el <strong>&quot;Corazón&quot;</strong> del sistema. No medimos solo notas, medimos progreso real y compromiso técnico.
                    </p>
                </div>

                <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden">
                    <div className="relative z-10">
                        <h4 className="font-bold text-blue-400 mb-6 flex items-center gap-2">
                            <Zap className="w-5 h-5" />
                            Métricas Proactivas
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-white/5 border border-white/10 p-5 rounded-3xl">
                                <p className="text-xs font-black text-blue-300 uppercase tracking-widest mb-2">Índice de Riesgo</p>
                                <p className="text-sm text-slate-300 leading-relaxed">Detectamos si tu Kanban está estancado para que el mentor pueda intervenir antes de que te sientas frustrado.</p>
                            </div>
                            <div className="bg-white/5 border border-white/10 p-5 rounded-3xl">
                                <p className="text-xs font-black text-indigo-300 uppercase tracking-widest mb-2">Engagement Teórico</p>
                                <p className="text-sm text-slate-300 leading-relaxed">Correlacionamos cuánto material de aprendizaje has leído con la calidad de tus entregas técnicas.</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <h3 className="text-xl font-bold text-slate-800">¿Cómo leer tus gráficos?</h3>
                    <p className="text-sm text-slate-500 leading-relaxed font-medium">
                        Busca la sección de <strong>&quot;Analítica&quot;</strong> en tu dashboard. Verás velocímetros de competencia y gráficos de barras que muestran qué tan cerca estás de completar los objetivos del mercado laboral actual.
                    </p>
                </div>
            </div>
        )
    },
    {
        id: 'admin',
        title: 'Administración y Configuración',
        icon: Settings,
        content: (
            <div className="space-y-8">
                <div className="space-y-4">
                    <h2 className="text-3xl font-black text-slate-800">Control Maestro</h2>
                    <p className="text-slate-600 text-lg leading-relaxed">
                        Solo para administradores y docentes: Configura el motor que hace funcionar todo lo anterior y personaliza la experiencia institucional.
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-4">
                    <div className="group p-6 bg-white border border-slate-100 rounded-3xl hover:border-blue-200 transition-all shadow-sm">
                        <div className="flex gap-4 items-center mb-4">
                            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                                <Settings className="w-5 h-5 text-blue-600" />
                            </div>
                            <h4 className="font-black text-slate-800">Gestión de IA y API Keys</h4>
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed">
                            En el panel de configuración, puedes establecer los tokens de Google Gemini. Sin esto, las capacidades de resumen y el &quot;Copiloto Estratégico&quot; no estarán disponibles.
                        </p>
                    </div>
                    <div className="group p-6 bg-white border border-slate-100 rounded-3xl hover:border-indigo-200 transition-all shadow-sm">
                        <div className="flex gap-4 items-center mb-4">
                            <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
                                <Users className="w-5 h-5 text-indigo-600" />
                            </div>
                            <h4 className="font-black text-slate-800">Control de Roles y Equipos</h4>
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed">
                            Administra quién tiene acceso a cada proyecto. Puedes crear <strong>Equos</strong> y asignar mentores específicos a cada grupo de estudiantes.
                        </p>
                    </div>
                </div>

                <div className="p-6 bg-blue-50 rounded-[2rem] border border-blue-100">
                    <p className="text-[10px] text-blue-700 font-bold uppercase tracking-wider mb-2">Tip de Admin</p>
                    <p className="text-xs text-blue-600 leading-relaxed">
                        Toda la plataforma es modular. Puedes habilitar o deshabilitar el módulo de mentorías si la institución prefiere un enfoque 100% autodidacta, aunque no lo recomendamos para PBL.
                    </p>
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
