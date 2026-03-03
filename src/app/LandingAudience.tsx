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
      'Vista de proyectos activos, entregas próximas y mentorías en calendario.',
      'Kanban individual o grupal para organizar tareas y evidencias.',
      'Reconocimientos visibles: insignias y certificados verificables.',
      'Recursos sugeridos según el contexto de tu proyecto.'
    ]
  },
  TEACHER: {
    title: 'Docente / Mentor',
    subtitle: 'Diseño pedagógico con seguimiento operativo en tiempo real',
    value: 'Planeas, acompañas y evalúas con enfoque ABP/ABR en una sola plataforma.',
    bullets: [
      'Creación guiada de proyectos, retos y problemas con IA.',
      'Asignación de Objetos de Aprendizaje y Habilidades del Siglo XXI.',
      'Evaluación con rúbricas, retroalimentación y control de entregas.',
      'Mentorías planificadas y gestión de solicitudes de estudiantes.'
    ]
  },
  ADMIN: {
    title: 'Administrador',
    subtitle: 'Gobierno académico, analítica y control institucional',
    value: 'Visibilidad completa para tomar decisiones basadas en datos.',
    bullets: [
      'Analítica de uso, avance y desempeño por usuarios y proyectos.',
      'Historial de actividad detallado en tiempo real por cada usuario.',
      'Gestión de roles, permisos, configuración visual e integraciones.',
      'Trazabilidad de acciones críticas para auditoría y mejora continua.'
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
          <p className="text-xs font-black uppercase tracking-[0.28em] mb-2" style={{ color: 'rgb(var(--primary))' }}>
            Experiencia por perfil
          </p>
          <h2 className="text-3xl md:text-4xl font-black text-slate-900">Mismo ecosistema, vistas y decisiones distintas</h2>
        </div>
        <UserSquare2 className="hidden md:block w-11 h-11" style={{ color: 'rgb(var(--primary))' }} />
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
                className={`w-full text-left px-4 py-3 rounded-xl mb-2 last:mb-0 transition-all inline-flex items-center gap-2 ${activeTab ? 'text-white shadow-lg' : 'text-slate-600 hover:bg-slate-200/70'
                  }`}
                style={activeTab ? { backgroundColor: 'rgb(var(--primary))', boxShadow: '0 16px 34px -24px rgba(var(--primary), 0.85)' } : undefined}
              >
                <Icon className="w-4 h-4" />
                <span className="font-semibold text-sm">{tab.label}</span>
              </button>
            );
          })}
        </div>

        <article className="rounded-2xl border p-6 md:p-8 transition-all" style={{ borderColor: 'rgba(var(--primary), 0.18)', background: 'linear-gradient(145deg, rgba(var(--primary), 0.08) 0%, #ffffff 48%, rgba(15, 23, 42, 0.03) 100%)' }}>
          <p className="text-xs font-black uppercase tracking-[0.24em]" style={{ color: 'rgb(var(--primary))' }}>{data.title}</p>
          <h3 className="text-2xl font-black text-slate-900 mt-2">{data.subtitle}</h3>
          <p className="text-slate-700 mt-3">{data.value}</p>

          <ul className="mt-6 space-y-2.5">
            {data.bullets.map((bullet) => (
              <li key={bullet} className="text-sm text-slate-700 inline-flex items-start gap-2">
                <ArrowRight className="w-4 h-4 mt-0.5 shrink-0" style={{ color: 'rgb(var(--primary))' }} />
                <span>{bullet}</span>
              </li>
            ))}
          </ul>
        </article>
      </div>
    </section>
  );
}
