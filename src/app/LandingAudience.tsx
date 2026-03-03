'use client';

import { useState } from 'react';
import { ArrowRight, GraduationCap, ShieldCheck, Sparkles, UserSquare2 } from 'lucide-react';

type AudienceKey = 'STUDENT' | 'TEACHER' | 'ADMIN';

const audienceMap: Record<AudienceKey, {
  title: string;
  subtitle: string;
  value: string;
  bullets: string[];
}> = {
  STUDENT: {
    title: 'Estudiante',
    subtitle: 'Ruta clara de avance y evidencia de logros',
    value: 'Aprendes haciendo, con trazabilidad total de tu progreso.',
    bullets: [
      'Vista de proyectos activos, entregas proximas y mentorias en calendario.',
      'Kanban individual o grupal para organizar tareas y evidencias.',
      'Reconocimientos visibles: insignias y certificados verificables.',
      'Recursos sugeridos segun contexto de tu proyecto.'
    ]
  },
  TEACHER: {
    title: 'Docente / Mentor',
    subtitle: 'Diseno pedagogico con seguimiento operativo en tiempo real',
    value: 'Planeas, acompanas y evalua con enfoque ABP/ABR en una sola plataforma.',
    bullets: [
      'Creacion guiada de proyectos, retos y problemas con IA.',
      'Asignacion de Objetos de Aprendizaje y Habilidades del Siglo XXI.',
      'Evaluacion con rubricas, retroalimentacion y control de entregas.',
      'Mentorias planificadas y gestion de solicitudes de estudiantes.'
    ]
  },
  ADMIN: {
    title: 'Administrador',
    subtitle: 'Gobierno academico, analitica y control institucional',
    value: 'Visibilidad completa para tomar decisiones basadas en datos.',
    bullets: [
      'Analitica de uso, avance y desempeno por usuarios y proyectos.',
      'Historial de actividad detallado en tiempo real por cada usuario.',
      'Gestion de roles, permisos, configuracion visual e integraciones.',
      'Trazabilidad de acciones criticas para auditoria y mejora continua.'
    ]
  }
};

export function LandingAudience() {
  const [active, setActive] = useState<AudienceKey>('STUDENT');
  const data = audienceMap[active];

  const tabs: Array<{ key: AudienceKey; label: string; icon: typeof GraduationCap }> = [
    { key: 'STUDENT', label: 'Estudiantes', icon: GraduationCap },
    { key: 'TEACHER', label: 'Docentes', icon: Sparkles },
    { key: 'ADMIN', label: 'Administradores', icon: ShieldCheck }
  ];

  return (
    <section id="perfiles" className="rounded-[2rem] border border-slate-200 bg-white/85 backdrop-blur-sm p-6 md:p-10 shadow-[0_24px_80px_-40px_rgba(15,23,42,0.42)]">
      <div className="flex items-center justify-between gap-4 mb-8">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.28em] text-teal-700 mb-2">Experiencia por perfil</p>
          <h2 className="text-3xl md:text-4xl font-black text-slate-900">Mismo ecosistema, vistas y decisiones distintas</h2>
        </div>
        <UserSquare2 className="hidden md:block w-11 h-11 text-teal-700" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-5">
        <div className="rounded-2xl border border-slate-200 p-2 bg-slate-50">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const activeTab = tab.key === active;
            return (
              <button
                key={tab.key}
                onClick={() => setActive(tab.key)}
                className={`w-full text-left px-4 py-3 rounded-xl mb-2 last:mb-0 transition-all inline-flex items-center gap-2 ${activeTab ? 'bg-teal-700 text-white shadow-lg shadow-teal-700/20' : 'text-slate-600 hover:bg-slate-200/70'
                  }`}
              >
                <Icon className="w-4 h-4" />
                <span className="font-semibold text-sm">{tab.label}</span>
              </button>
            );
          })}
        </div>

        <article className="rounded-2xl border border-teal-100 bg-gradient-to-br from-teal-50 via-white to-cyan-50 p-6 md:p-8 transition-all">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-teal-700">{data.title}</p>
          <h3 className="text-2xl font-black text-slate-900 mt-2">{data.subtitle}</h3>
          <p className="text-slate-700 mt-3">{data.value}</p>

          <ul className="mt-6 space-y-2.5">
            {data.bullets.map((bullet) => (
              <li key={bullet} className="text-sm text-slate-700 inline-flex items-start gap-2">
                <ArrowRight className="w-4 h-4 mt-0.5 text-teal-700 shrink-0" />
                <span>{bullet}</span>
              </li>
            ))}
          </ul>
        </article>
      </div>
    </section>
  );
}
