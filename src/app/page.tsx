import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { BellRing, Blocks, BrainCircuit, CalendarClock, CheckSquare, Database, FileCheck2, GaugeCircle, Layers, Radar, Shield, Sparkles, Workflow } from 'lucide-react';
import { Manrope, Space_Grotesk } from 'next/font/google';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import styles from './landing.module.css';
import { LandingAudience } from './LandingAudience';

const headingFont = Space_Grotesk({
  subsets: ['latin'],
  weight: ['500', '700']
});

const bodyFont = Manrope({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700']
});

const pedagogicalPillars = [
  {
    title: 'ABP y ABR con estructura real',
    description: 'El diseno de proyectos, retos y problemas no es solo operativo: incorpora intencionalidad pedagogica desde la formulacion hasta la evaluacion.'
  },
  {
    title: 'Evaluacion por evidencia',
    description: 'Entregas, rubricas, retroalimentacion y calificacion conectadas para convertir el seguimiento en mejora continua.'
  },
  {
    title: 'Mentoria como acompanamiento',
    description: 'La agenda de mentorias y acuerdos queda integrada al avance del estudiante y del equipo.'
  },
  {
    title: 'Aprendizaje situado por industria',
    description: 'Habilidades del Siglo XXI, recursos y retos alineados con contextos reales de aplicacion.'
  }
];

const technologyPillars = [
  {
    title: 'Arquitectura integral de aprendizaje',
    detail: 'Next.js + Prisma + Neon para operaciones academicas robustas con datos consistentes.'
  },
  {
    title: 'Carga de evidencias y contenidos',
    detail: 'Integracion de almacenamiento para archivos y recursos con trazabilidad por usuario y actividad.'
  },
  {
    title: 'Reconocimientos verificables',
    detail: 'Insignias y certificados con identificadores unicos y validacion publica.'
  },
  {
    title: 'Observabilidad institucional',
    detail: 'Registro de actividad en tiempo real para analitica, auditoria y toma de decisiones.'
  }
];

const featureCards = [
  {
    title: 'Dashboard orientado a accion',
    description: 'Proyectos activos, avance, proximas tareas, mentorias y comunicaciones en una sola vista.',
    icon: GaugeCircle
  },
  {
    title: 'Diseno pedagogico asistido',
    description: 'Creacion de proyectos/reto/problema con asistentes, objetivos y metodologia estructurada.',
    icon: BrainCircuit
  },
  {
    title: 'Entregas y evaluacion conectadas',
    description: 'Tareas, rubricas, calificaciones y evidencias con seguimiento por estudiante y por equipo.',
    icon: FileCheck2
  },
  {
    title: 'Mentorias y calendario operativo',
    description: 'Slots, reservas, acuerdos y sesiones articuladas al avance del proyecto.',
    icon: CalendarClock
  },
  {
    title: 'Reconocimientos con validez',
    description: 'Certificados e insignias configurables por condiciones de logro y verificacion.',
    icon: Sparkles
  },
  {
    title: 'Actividad y analitica en tiempo real',
    description: 'Desde login hasta carga de archivos: cada accion queda trazable para gestion academica.',
    icon: Radar
  }
];

function formatNumber(value: number) {
  return new Intl.NumberFormat('es-CO').format(value);
}

export default async function Home() {
  const session = await getServerSession(authOptions);
  if (session) redirect('/dashboard');

  const [projectCount, userCount, learningCount, recognitionCount] = await Promise.all([
    prisma.project.count(),
    prisma.user.count(),
    prisma.learningObject.count(),
    prisma.recognitionAward.count()
  ]);

  const metrics = [
    { label: 'Proyectos y retos gestionados', value: formatNumber(projectCount), icon: Layers },
    { label: 'Usuarios en la plataforma', value: formatNumber(userCount), icon: Workflow },
    { label: 'Recursos de aprendizaje', value: formatNumber(learningCount), icon: Blocks },
    { label: 'Reconocimientos emitidos', value: formatNumber(recognitionCount), icon: CheckSquare }
  ];

  return (
    <main className={`${bodyFont.className} min-h-screen bg-[#f5f9fb] text-slate-900`}>
      <div className="max-w-7xl mx-auto px-6 md:px-10 py-6 md:py-8">
        <nav className="sticky top-3 z-40 rounded-2xl border border-slate-200/80 bg-white/85 backdrop-blur-md px-4 md:px-6 py-3 shadow-[0_15px_45px_-35px_rgba(15,23,42,0.8)]">
          <div className="flex items-center justify-between gap-4">
            <div className="inline-flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-600" />
              <p className={`${headingFont.className} text-base md:text-lg font-bold`}>ProfeTabla</p>
            </div>
            <div className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
              <a href="#funcionalidades" className="hover:text-teal-700 transition-colors">Funcionalidades</a>
              <a href="#diferenciales" className="hover:text-teal-700 transition-colors">Diferenciales</a>
              <a href="#tecnologia" className="hover:text-teal-700 transition-colors">Tecnologia</a>
            </div>
            <div className="inline-flex items-center gap-2">
              <Link href="/login" className="px-3 py-2 text-sm font-semibold text-slate-700 hover:text-teal-700 transition-colors">
                Ingresar
              </Link>
              <Link href="/register" className="px-4 py-2 rounded-xl text-sm font-bold bg-teal-700 text-white hover:bg-teal-800 transition-colors">
                Crear cuenta
              </Link>
            </div>
          </div>
        </nav>

        <section className={`${styles.heroBackdrop} mt-8 rounded-[2rem] border border-slate-200 bg-gradient-to-br from-white via-[#f3fbff] to-[#ecf8f5] p-7 md:p-12`}>
          <div className={styles.gridPulse} />
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8 items-start">
            <div>
              <p className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-100 text-teal-800 text-xs font-bold uppercase tracking-[0.18em]">
                <BellRing className="w-3.5 h-3.5" />
                Ecosistema pedagogico y tecnologico
              </p>
              <h1 className={`${headingFont.className} mt-4 text-4xl md:text-6xl leading-[1.02] font-bold text-slate-900 max-w-4xl`}>
                Gestiona aprendizaje por proyectos con trazabilidad completa de avance y resultados.
              </h1>
              <p className="mt-5 text-slate-600 text-base md:text-lg max-w-3xl">
                ProfeTabla integra planeacion ABP/ABR, entregas, mentorias, analitica y reconocimientos verificables.
                Todo en un flujo unico para estudiantes, docentes y administradores.
              </p>
              <div className="mt-7 flex flex-wrap items-center gap-3">
                <Link href="/register" className="px-6 py-3 rounded-xl bg-[#0f766e] text-white font-bold hover:bg-[#115e59] transition-colors">
                  Empezar ahora
                </Link>
                <a href="#funcionalidades" className="px-6 py-3 rounded-xl bg-white border border-slate-200 text-slate-800 font-semibold hover:border-teal-700 hover:text-teal-700 transition-colors">
                  Explorar funcionalidades
                </a>
              </div>
            </div>

            <div className={`${styles.revealCard} ${styles.delay1} rounded-3xl border border-slate-200 bg-white/95 p-5 shadow-[0_28px_70px_-40px_rgba(15,23,42,0.5)]`}>
              <p className="text-xs font-black uppercase tracking-[0.24em] text-teal-700 mb-4">Impacto visible</p>
              <div className="space-y-3">
                {metrics.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.label} className="rounded-xl border border-slate-200 p-3 bg-slate-50/70">
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-slate-600">{item.label}</p>
                        <Icon className="w-4 h-4 text-teal-700" />
                      </div>
                      <p className={`${headingFont.className} text-2xl font-bold text-slate-900 mt-1`}>{item.value}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        <section id="funcionalidades" className="mt-14">
          <div className="mb-8">
            <p className="text-xs font-black uppercase tracking-[0.28em] text-teal-700 mb-2">Funcionalidades clave</p>
            <h2 className={`${headingFont.className} text-3xl md:text-4xl font-bold text-slate-900`}>Todo el ciclo del aprendizaje en una sola plataforma</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {featureCards.map((card, index) => {
              const Icon = card.icon;
              const delayClass = index % 4 === 0 ? styles.delay1 : index % 4 === 1 ? styles.delay2 : index % 4 === 2 ? styles.delay3 : styles.delay4;
              return (
                <article key={card.title} className={`${styles.revealCard} ${delayClass} rounded-2xl border border-slate-200 bg-white p-5 hover:-translate-y-1 hover:border-teal-200 hover:shadow-[0_20px_45px_-35px_rgba(15,23,42,0.7)] transition-all`}>
                  <Icon className="w-8 h-8 text-teal-700 mb-4" />
                  <h3 className={`${headingFont.className} text-xl font-bold text-slate-900 mb-2`}>{card.title}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{card.description}</p>
                </article>
              );
            })}
          </div>
        </section>

        <section id="diferenciales" className="mt-14 grid grid-cols-1 xl:grid-cols-[1.2fr_1fr] gap-5">
          <article className="rounded-[2rem] border border-slate-200 bg-white p-6 md:p-8">
            <p className="text-xs font-black uppercase tracking-[0.28em] text-amber-700 mb-2">Diferenciales pedagogicos</p>
            <h2 className={`${headingFont.className} text-3xl md:text-4xl font-bold text-slate-900 mb-6`}>
              No solo administra tareas: orquesta procesos de aprendizaje
            </h2>
            <div className="space-y-3">
              {pedagogicalPillars.map((pillar, idx) => (
                <div key={pillar.title} className="rounded-xl border border-amber-100 bg-amber-50/60 p-4">
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-700 mb-1">Pilar {idx + 1}</p>
                  <h3 className="font-bold text-slate-900">{pillar.title}</h3>
                  <p className="text-sm text-slate-600 mt-1">{pillar.description}</p>
                </div>
              ))}
            </div>
          </article>

          <div className="space-y-5">
            <article className="rounded-[2rem] border border-slate-200 bg-gradient-to-br from-slate-900 to-slate-700 text-white p-6 md:p-8">
              <p className="text-xs font-black uppercase tracking-[0.25em] text-cyan-200 mb-3">Flujo de valor</p>
              <h3 className={`${headingFont.className} text-2xl font-bold mb-3`}>De la planeacion al reconocimiento</h3>
              <ol className="space-y-2 text-sm text-slate-100">
                <li>1. Disena experiencias ABP/ABR con objetivos y evidencias.</li>
                <li>2. Acompana entregas, equipos y mentorias en tiempo real.</li>
                <li>3. Evalua con datos y emite insignias/certificados verificables.</li>
              </ol>
            </article>

            <article className="rounded-[2rem] border border-slate-200 bg-white p-6 md:p-8">
              <p className="text-xs font-black uppercase tracking-[0.25em] text-teal-700 mb-3">Seguridad y control</p>
              <div className="space-y-2.5 text-sm text-slate-600">
                <p className="inline-flex items-center gap-2"><Shield className="w-4 h-4 text-teal-700" /> Roles y permisos diferenciados.</p>
                <p className="inline-flex items-center gap-2"><Database className="w-4 h-4 text-teal-700" /> Integridad de datos y relaciones auditables.</p>
                <p className="inline-flex items-center gap-2"><Radar className="w-4 h-4 text-teal-700" /> Historial de acciones para seguimiento institucional.</p>
              </div>
            </article>
          </div>
        </section>

        <section id="tecnologia" className="mt-14">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 md:p-10">
            <p className="text-xs font-black uppercase tracking-[0.28em] text-teal-700 mb-2">Diferenciales tecnologicos</p>
            <h2 className={`${headingFont.className} text-3xl md:text-4xl font-bold text-slate-900 mb-8`}>
              Plataforma lista para escalar programas academicos con datos vivos
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {technologyPillars.map((item, index) => (
                <article key={item.title} className={`${styles.revealCard} ${index % 2 === 0 ? styles.delay1 : styles.delay2} rounded-2xl border border-slate-200 p-5 bg-slate-50`}>
                  <h3 className={`${headingFont.className} text-xl font-bold text-slate-900 mb-2`}>{item.title}</h3>
                  <p className="text-sm text-slate-600">{item.detail}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <div className="mt-14">
          <LandingAudience />
        </div>

        <section className="mt-14 mb-10 rounded-[2rem] border border-slate-200 bg-gradient-to-r from-teal-700 via-teal-600 to-cyan-600 p-8 md:p-12 text-white">
          <p className="text-xs font-black uppercase tracking-[0.28em] text-cyan-100 mb-2">Listo para implementar</p>
          <h2 className={`${headingFont.className} text-3xl md:text-5xl font-bold max-w-4xl`}>
            Lleva tu modelo pedagogico a una operacion digital medible y accionable.
          </h2>
          <p className="mt-4 text-cyan-50 max-w-3xl">
            ProfeTabla conecta pedagogia, tecnologia y analitica para que el aprendizaje basado en proyectos tenga impacto comprobable.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/register" className="px-6 py-3 rounded-xl bg-white text-teal-800 font-bold hover:bg-cyan-50 transition-colors">
              Crear cuenta ahora
            </Link>
            <Link href="/login" className="px-6 py-3 rounded-xl border border-white/40 text-white font-semibold hover:bg-white/10 transition-colors">
              Ya tengo acceso
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
