import type { CSSProperties } from 'react';
import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import {
  BellRing,
  CalendarClock,
  CheckCheck,
  ExternalLink,
  FileCheck2,
  GaugeCircle,
  Radar,
  Sparkles,
  Workflow
} from 'lucide-react';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import styles from './landing.module.css';
import { LandingAudience } from './LandingAudience';
import { LandingDemoMetrics } from './LandingDemoMetrics';

const coreFeatures = [
  {
    title: 'Gestión pedagógica por etapas',
    description: 'Diseña proyectos, retos y problemas con estructura curricular, propósito y criterios de evaluación.',
    icon: Workflow
  },
  {
    title: 'Seguimiento académico accionable',
    description: 'Visualiza avance, alertas de entrega, estado del equipo y próximas mentorías en un mismo flujo.',
    icon: GaugeCircle
  },
  {
    title: 'Evaluación con trazabilidad',
    description: 'Integra rúbricas, retroalimentación y resultados para sostener decisiones pedagógicas con evidencia.',
    icon: FileCheck2
  },
  {
    title: 'Mentorías y acompañamiento',
    description: 'Agenda, reserva y documenta sesiones de mentoría vinculadas al avance real del proyecto.',
    icon: CalendarClock
  },
  {
    title: 'Reconocimientos verificables',
    description: 'Configura insignias y certificados con criterios de logro y validación pública.',
    icon: Sparkles
  },
  {
    title: 'Historial institucional en tiempo real',
    description: 'Monitorea eventos clave de plataforma para gestión, auditoría y mejora continua.',
    icon: Radar
  }
];

const pedagogicalDifferentials = [
  'Aprendizaje Basado en Proyectos (ABP) y Aprendizaje Basado en Retos (ABR) en un mismo ecosistema.',
  'Conexión explícita entre actividades, evidencias, evaluación y reconocimiento.',
  'Vinculación de habilidades del siglo XXI por industria al diseño de experiencias.',
  'Integración de recursos sugeridos para fortalecer autonomía y transferencia.'
];

const technicalDifferentials = [
  'Arquitectura moderna para crecimiento institucional.',
  'Gestión segura de datos y relaciones académicas.',
  'Soporte para carga de archivos, contenidos y trazabilidad de actividad.',
  'Despliegue continuo y operación orientada a disponibilidad.'
];

const pedagogyReferences = [
  {
    org: 'World Economic Forum',
    doc: 'Future of Jobs Report',
    url: 'https://www.weforum.org/reports/'
  },
  {
    org: 'UNESCO',
    doc: 'Futures of Education',
    url: 'https://www.unesco.org/en/futures-education'
  },
  {
    org: 'OECD',
    doc: 'Education at a Glance',
    url: 'https://www.oecd.org/en/publications/education-at-a-glance_b858e7fe-en.html'
  },
  {
    org: 'ISTE',
    doc: 'ISTE Standards',
    url: 'https://iste.org/standards'
  }
];

const techLogos = [
  { name: 'Next.js', src: 'https://cdn.simpleicons.org/nextdotjs/0f172a' },
  { name: 'TypeScript', src: 'https://cdn.simpleicons.org/typescript/0f172a' },
  { name: 'PostgreSQL', src: 'https://cdn.simpleicons.org/postgresql/0f172a' },
  { name: 'Prisma', src: 'https://cdn.simpleicons.org/prisma/0f172a' },
  { name: 'Cloudflare', src: 'https://cdn.simpleicons.org/cloudflare/0f172a' },
  { name: 'Vercel', src: 'https://cdn.simpleicons.org/vercel/0f172a' }
];

export default async function Home() {
  const session = await getServerSession(authOptions);
  if (session) redirect('/dashboard');

  const config = await prisma.platformConfig.findUnique({
    where: { id: 'global-config' },
    select: {
      institutionName: true,
      logoUrl: true,
      primaryColor: true,
      secondaryColor: true,
      accentColor: true
    }
  });

  const institution = config?.institutionName || 'Profe Tabla';
  const logoUrl = config?.logoUrl || '';
  const landingVars = {
    '--landing-secondary': config?.secondaryColor || '#475569',
    '--landing-accent': config?.accentColor || '#F59E0B'
  } as CSSProperties;

  return (
    <main className="min-h-screen bg-[#f3f6fb] text-slate-900 font-sans" style={landingVars}>
      <div className="max-w-7xl mx-auto px-5 md:px-10 py-6 md:py-8">
        <nav className="sticky top-3 z-50 rounded-[calc(var(--radius)+0.8rem)] border border-slate-200/85 bg-white/92 backdrop-blur-md px-4 md:px-6 py-3 shadow-[0_20px_42px_-34px_rgba(15,23,42,0.7)]">
          <div className="flex items-center justify-between gap-4">
            <div className="inline-flex items-center gap-3 min-w-0">
              {logoUrl ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={logoUrl} alt={institution} className="w-9 h-9 rounded-lg object-contain border border-slate-200 bg-white p-1" />
                </>
              ) : (
                <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: 'rgb(var(--primary))' }} />
              )}
              <p className="text-base md:text-lg font-black truncate">{institution}</p>
            </div>

            <div className="hidden md:flex items-center gap-7 text-sm font-semibold text-slate-600">
              <a href="#funcionalidades" className="hover:opacity-80 transition-opacity">Funcionalidades</a>
              <a href="#diferenciales" className="hover:opacity-80 transition-opacity">Diferenciales</a>
              <a href="#referencias" className="hover:opacity-80 transition-opacity">Referencias</a>
            </div>

            <div className="inline-flex items-center gap-2">
              <Link href="/login" className="px-3 py-2 text-sm font-semibold text-slate-700 hover:text-slate-900 transition-colors">
                Ingresar
              </Link>
              <Link
                href="/register"
                className="px-4 py-2 rounded-[calc(var(--radius)+0.3rem)] text-sm font-bold text-white transition-opacity hover:opacity-90"
                style={{ backgroundColor: 'rgb(var(--primary))' }}
              >
                Crear cuenta
              </Link>
            </div>
          </div>
        </nav>

        <section className={`${styles.heroBackdrop} mt-8 rounded-[calc(var(--radius)+1.5rem)] border border-slate-200 bg-gradient-to-br from-white via-[#f7fbff] to-[#f7fbf9] p-6 md:p-10`}>
          <div className={styles.gridPulse} />
          <div className="relative z-10 grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-7 items-start">
            <div>
              <p className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-black uppercase tracking-[0.18em]" style={{ backgroundColor: 'rgba(var(--primary), 0.14)', color: 'rgb(var(--primary))' }}>
                <BellRing className="w-3.5 h-3.5" />
                Plataforma pedagógica y tecnológica
              </p>

              <h1 className="mt-4 text-4xl md:text-6xl leading-[1.04] font-black text-slate-900 max-w-4xl">
                Diseña experiencias de aprendizaje con enfoque pedagógico, gestión operativa y resultados verificables.
              </h1>

              <p className="mt-5 text-slate-600 text-base md:text-lg max-w-3xl leading-relaxed">
                {institution} integra ABP, ABR, seguimiento de entregas, mentorías, analítica académica y reconocimientos
                en un entorno único para estudiantes, docentes y administradores.
              </p>

              <div className="mt-7 flex flex-wrap items-center gap-3">
                <Link
                  href="/register"
                  className="px-6 py-3 rounded-[calc(var(--radius)+0.35rem)] text-white font-bold hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: 'rgb(var(--primary))' }}
                >
                  Empezar ahora
                </Link>
                <a href="#funcionalidades" className="px-6 py-3 rounded-[calc(var(--radius)+0.35rem)] bg-white border border-slate-200 text-slate-800 font-semibold hover:border-slate-300 transition-colors">
                  Ver funcionalidades
                </a>
              </div>
            </div>

            <div className={`${styles.revealCard} ${styles.delay2}`}>
              <LandingDemoMetrics />
            </div>
          </div>
        </section>

        <section className="mt-8 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-[1.2fr_1fr] gap-4">
          <figure className="rounded-[calc(var(--radius)+1rem)] overflow-hidden border border-slate-200 bg-white shadow-[0_26px_70px_-50px_rgba(15,23,42,0.5)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=1600&q=80"
              alt="Estudiantes trabajando colaborativamente en un entorno de aprendizaje."
              className="w-full h-[240px] md:h-[280px] object-cover"
              loading="lazy"
            />
            <figcaption className="px-4 py-3 text-xs text-slate-600 bg-white">
              Contexto real de aprendizaje colaborativo.
            </figcaption>
          </figure>

          <figure className="rounded-[calc(var(--radius)+1rem)] overflow-hidden border border-slate-200 bg-white shadow-[0_26px_70px_-50px_rgba(15,23,42,0.5)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=1600&q=80"
              alt="Sesión de mentoría académica en aula con enfoque práctico."
              className="w-full h-[240px] md:h-[280px] object-cover"
              loading="lazy"
            />
            <figcaption className="px-4 py-3 text-xs text-slate-600 bg-white">
              Referencia visual de mentoría y acompañamiento en aula.
            </figcaption>
          </figure>
        </section>

        <section id="funcionalidades" className="mt-14">
          <div className="mb-8">
            <p className="text-xs font-black uppercase tracking-[0.28em] mb-2" style={{ color: 'rgb(var(--primary))' }}>
              Funcionalidades estratégicas
            </p>
            <h2 className="text-3xl md:text-4xl font-black text-slate-900">
              Todo el ciclo académico en una sola plataforma
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {coreFeatures.map((feature, index) => {
              const Icon = feature.icon;
              const delayClass = index % 3 === 0 ? styles.delay1 : index % 3 === 1 ? styles.delay2 : styles.delay3;
              return (
                <article key={feature.title} className={`${styles.revealCard} ${delayClass} rounded-[calc(var(--radius)+0.9rem)] border border-slate-200 bg-white p-5 shadow-[0_18px_40px_-35px_rgba(15,23,42,0.65)]`}>
                  <Icon className="w-7 h-7 mb-4" style={{ color: 'rgb(var(--primary))' }} />
                  <h3 className="text-xl font-black text-slate-900 mb-2">{feature.title}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{feature.description}</p>
                </article>
              );
            })}
          </div>
        </section>

        <section id="diferenciales" className="mt-14 grid grid-cols-1 xl:grid-cols-[1.1fr_1fr] gap-4">
          <article className="rounded-[calc(var(--radius)+1.2rem)] border border-slate-200 bg-white p-6 md:p-8">
            <p className="text-xs font-black uppercase tracking-[0.28em] mb-2" style={{ color: 'rgb(var(--primary))' }}>
              Diferenciales pedagógicos
            </p>
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-6">
              Diseño pedagógico con operación académica medible
            </h2>
            <ul className="space-y-3">
              {pedagogicalDifferentials.map((item, idx) => (
                <li key={item} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 inline-flex items-start gap-3">
                  <span className="mt-0.5 text-xs font-black px-2 py-1 rounded-full text-white" style={{ backgroundColor: 'rgb(var(--primary))' }}>
                    {idx + 1}
                  </span>
                  <span className="text-sm text-slate-700">{item}</span>
                </li>
              ))}
            </ul>
          </article>

          <div className="space-y-4">
            <article className="rounded-[calc(var(--radius)+1.2rem)] border border-slate-200 p-6 md:p-8 text-white" style={{ background: `linear-gradient(145deg, ${config?.secondaryColor || '#334155'} 0%, #0f172a 100%)` }}>
              <p className="text-xs font-black uppercase tracking-[0.24em] text-slate-200 mb-2">Diferenciales tecnológicos</p>
              <h3 className="text-2xl md:text-3xl font-black mb-4">Arquitectura robusta para programas exigentes</h3>
              <ul className="space-y-2.5">
                {technicalDifferentials.map((item) => (
                  <li key={item} className="text-sm text-slate-100 inline-flex items-start gap-2">
                    <CheckCheck className="w-4 h-4 mt-0.5 shrink-0" style={{ color: config?.accentColor || '#F59E0B' }} />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </article>

            <article className="rounded-[calc(var(--radius)+1.2rem)] border border-slate-200 bg-white p-6 md:p-8">
              <p className="text-xs font-black uppercase tracking-[0.24em] mb-2" style={{ color: 'rgb(var(--primary))' }}>Cadena de valor</p>
              <ol className="space-y-2.5 text-sm text-slate-700">
                <li className="inline-flex gap-2"><span className="font-black">1.</span> Diseño de experiencias con enfoque en resultados.</li>
                <li className="inline-flex gap-2"><span className="font-black">2.</span> Seguimiento operativo de equipos, tareas y mentorías.</li>
                <li className="inline-flex gap-2"><span className="font-black">3.</span> Evaluación, reconocimiento y toma de decisiones institucionales.</li>
              </ol>
            </article>
          </div>
        </section>

        <div className="mt-14">
          <LandingAudience />
        </div>

        <section id="referencias" className="mt-14 rounded-[calc(var(--radius)+1.2rem)] border border-slate-200 bg-white p-6 md:p-8">
          <div className="grid grid-cols-1 xl:grid-cols-[1.3fr_1fr] gap-7">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.28em] mb-2" style={{ color: 'rgb(var(--primary))' }}>
                Referencias visuales y conceptuales
              </p>
              <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-6">
                Marco de inspiración para habilidades y tendencias educativas
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {pedagogyReferences.map((reference) => {
                  const domain = new URL(reference.url).hostname;
                  return (
                    <a
                      key={reference.org}
                      href={reference.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 hover:bg-slate-100 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="inline-flex items-center gap-2">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={`https://www.google.com/s2/favicons?sz=64&domain_url=${domain}`}
                            alt={`Ícono de ${reference.org}`}
                            className="w-5 h-5 rounded-sm"
                          />
                          <p className="text-sm font-bold text-slate-900">{reference.org}</p>
                        </div>
                        <ExternalLink className="w-4 h-4 text-slate-400" />
                      </div>
                      <p className="text-xs text-slate-600 mt-2">{reference.doc}</p>
                    </a>
                  );
                })}
              </div>
            </div>

            <aside className="rounded-xl border border-slate-200 bg-slate-50 p-4 md:p-5">
              <p className="text-xs font-black uppercase tracking-[0.2em] mb-3" style={{ color: 'rgb(var(--primary))' }}>
                Tecnologías de referencia
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {techLogos.map((tech) => (
                  <div key={tech.name} className="rounded-lg border border-slate-200 bg-white px-3 py-3 flex items-center justify-center gap-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={tech.src} alt={`Logo de ${tech.name}`} className="w-4.5 h-4.5" />
                    <span className="text-xs font-semibold text-slate-700">{tech.name}</span>
                  </div>
                ))}
              </div>

              <div className="mt-5 rounded-lg border border-slate-200 bg-white px-4 py-3">
                <p className="text-xs font-semibold text-slate-500 mb-1">Nota</p>
                <p className="text-xs text-slate-600 leading-relaxed">
                  La página principal usa referencias públicas y datos simulados para presentación comercial.
                  Los datos reales solo se muestran dentro del entorno autenticado.
                </p>
              </div>
            </aside>
          </div>
        </section>

        <section className="mt-14 mb-10 rounded-[calc(var(--radius)+1.2rem)] border border-slate-200 px-6 md:px-9 py-8 md:py-11 text-white" style={{ background: `linear-gradient(135deg, rgb(var(--primary)) 0%, ${config?.secondaryColor || '#334155'} 100%)` }}>
          <p className="text-xs font-black uppercase tracking-[0.28em] text-white/85 mb-2">
            Implementación institucional
          </p>
          <h2 className="text-3xl md:text-5xl font-black max-w-4xl leading-[1.05]">
            Convierte tu estrategia pedagógica en una operación digital medible y coherente.
          </h2>
          <p className="mt-4 text-white/90 max-w-3xl leading-relaxed">
            {institution} puede integrar diseño curricular, ejecución, evaluación y reconocimiento en un ecosistema único.
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/register" className="px-6 py-3 rounded-[calc(var(--radius)+0.3rem)] bg-white text-slate-900 font-bold hover:bg-slate-100 transition-colors">
              Crear cuenta
            </Link>
            <Link href="/login" className="px-6 py-3 rounded-[calc(var(--radius)+0.3rem)] border border-white/35 text-white font-semibold hover:bg-white/10 transition-colors">
              Ingresar
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
