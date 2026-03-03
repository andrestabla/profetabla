'use client';

import type { CSSProperties } from 'react';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { ComponentType } from 'react';
import {
  ArrowUpRight,
  BellRing,
  BookMarked,
  BrainCircuit,
  CalendarClock,
  Command,
  FileCheck2,
  GaugeCircle,
  GraduationCap,
  Layers3,
  Radar,
  Search,
  Sparkles,
  Workflow
} from 'lucide-react';
import styles from './landing.module.css';
import { LandingDemoMetrics } from './LandingDemoMetrics';
import { LandingAudience } from './LandingAudience';

type LandingSurfaceProps = {
  institutionName: string;
  logoUrl: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
};

type CommandAction = {
  title: string;
  description: string;
  href: string;
  keywords: string[];
};

type BentoCard = {
  title: string;
  description: string;
  eyebrow: string;
  icon: ComponentType<{ className?: string; style?: CSSProperties }>;
  tone: 'neutral' | 'accent' | 'dark';
  size: 'small' | 'wide' | 'tall';
};

const HERO_VIDEO = 'https://videos.pexels.com/video-files/3195394/3195394-hd_1920_1080_25fps.mp4';

const bentoCards: BentoCard[] = [
  {
    title: 'Planificación curricular asistida',
    description: 'Construye proyectos, retos y problemas con enfoque pedagógico y resultados esperados desde el primer momento.',
    eyebrow: 'Diseño instruccional',
    icon: BrainCircuit,
    tone: 'accent',
    size: 'wide'
  },
  {
    title: 'Panel de avance continuo',
    description: 'Monitorea progreso, bloqueos y próximos hitos por estudiante o equipo con visualización accionable.',
    eyebrow: 'Gestión operativa',
    icon: GaugeCircle,
    tone: 'neutral',
    size: 'small'
  },
  {
    title: 'Mentorías conectadas al resultado',
    description: 'Agenda sesiones, registra acuerdos y enlaza cada mentoría con evidencias de aprendizaje.',
    eyebrow: 'Acompañamiento',
    icon: CalendarClock,
    tone: 'neutral',
    size: 'small'
  },
  {
    title: 'Evaluación con evidencia verificable',
    description: 'Integra rúbricas, retroalimentación y trazabilidad para elevar la calidad pedagógica.',
    eyebrow: 'Evaluación',
    icon: FileCheck2,
    tone: 'dark',
    size: 'tall'
  },
  {
    title: 'Habilidades del siglo XXI',
    description: 'Conecta cada experiencia con tendencias por industria y fortalece transferencias reales al entorno profesional.',
    eyebrow: 'Pertinencia',
    icon: Sparkles,
    tone: 'neutral',
    size: 'wide'
  },
  {
    title: 'Observabilidad institucional',
    description: 'Registra actividad en tiempo real para gestión, auditoría y mejora continua.',
    eyebrow: 'Gobernanza',
    icon: Radar,
    tone: 'accent',
    size: 'small'
  }
];

const semanticActions: CommandAction[] = [
  {
    title: 'Ver funcionalidades clave',
    description: 'Explora el bento de capacidades pedagógicas y tecnológicas.',
    href: '#funcionalidades',
    keywords: ['funcionalidades', 'módulos', 'capacidades', 'herramientas', 'bento']
  },
  {
    title: 'Ir a diferenciales',
    description: 'Consulta ventajas pedagógicas y operativas de la plataforma.',
    href: '#diferenciales',
    keywords: ['diferenciales', 'ventajas', 'valor', 'propuesta', 'pedagógico']
  },
  {
    title: 'Abrir referencias',
    description: 'Revisa marcos y fuentes externas de referencia.',
    href: '#referencias',
    keywords: ['referencias', 'unesco', 'oecd', 'wef', 'marco', 'fuentes']
  },
  {
    title: 'Conocer rutas por perfil',
    description: 'Visualiza experiencia para estudiantes, docentes y administradores.',
    href: '#perfiles',
    keywords: ['perfil', 'estudiantes', 'docentes', 'administradores', 'rutas']
  },
  {
    title: 'Crear cuenta institucional',
    description: 'Comienza la implementación en tu institución.',
    href: '/register',
    keywords: ['registro', 'crear cuenta', 'implementar', 'institución']
  },
  {
    title: 'Ingresar a la plataforma',
    description: 'Accede con tu usuario para continuar tu operación académica.',
    href: '/login',
    keywords: ['ingresar', 'login', 'acceso', 'sesión']
  }
];

const socialProof = [
  { quote: '“Pasamos de seguimiento reactivo a decisiones pedagógicas semanales basadas en evidencia.”', author: 'Coordinación Académica, Educación Media' },
  { quote: '“La adopción docente fue alta porque el flujo respeta la lógica del aula y no al revés.”', author: 'Dirección de Innovación Educativa' },
  { quote: '“La visibilidad por estudiante y equipo nos permitió reducir retrasos de entregas en pocas semanas.”', author: 'Líder de Programa STEAM' },
  { quote: '“La trazabilidad de actividad simplificó auditorías y mejoró la calidad de acompañamiento.”', author: 'Equipo de Aseguramiento Institucional' }
];

const references = [
  { name: 'UNESCO', detail: 'Futures of Education', href: 'https://www.unesco.org/en/futures-education' },
  { name: 'OECD', detail: 'Education at a Glance', href: 'https://www.oecd.org/en/publications/education-at-a-glance_b858e7fe-en.html' },
  { name: 'World Economic Forum', detail: 'Future of Jobs Report', href: 'https://www.weforum.org/reports/' },
  { name: 'ISTE', detail: 'ISTE Standards', href: 'https://iste.org/standards' }
];

function normalize(text: string) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '');
}

function cardSizeClass(size: BentoCard['size']) {
  if (size === 'wide') return styles.bentoWide;
  if (size === 'tall') return styles.bentoTall;
  return styles.bentoSmall;
}

function cardToneClass(tone: BentoCard['tone']) {
  if (tone === 'accent') return styles.bentoAccent;
  if (tone === 'dark') return styles.bentoDark;
  return styles.bentoNeutral;
}

export function LandingSurface({
  institutionName,
  logoUrl,
  primaryColor,
  secondaryColor,
  accentColor
}: LandingSurfaceProps) {
  const shellRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [navHidden, setNavHidden] = useState(false);
  const [navCompact, setNavCompact] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [scrollOffset, setScrollOffset] = useState(0);

  const filteredActions = useMemo(() => {
    const normalizedQuery = normalize(query.trim());
    if (!normalizedQuery) return semanticActions;

    const terms = normalizedQuery.split(/\s+/).filter(Boolean);

    return semanticActions.filter((action) => {
      const blob = normalize(`${action.title} ${action.description} ${action.keywords.join(' ')}`);
      return terms.every((term) => blob.includes(term));
    });
  }, [query]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const shortcutPressed = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k';
      if (shortcutPressed) {
        event.preventDefault();
        setCommandOpen((prev) => !prev);
        return;
      }

      if (event.key === 'Escape') {
        setCommandOpen(false);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    if (!commandOpen) return;
    setTimeout(() => inputRef.current?.focus(), 20);
  }, [commandOpen]);

  useEffect(() => {
    let lastScroll = window.scrollY;

    const onScroll = () => {
      const currentScroll = window.scrollY;
      setNavCompact(currentScroll > 18);
      setScrollOffset(Math.min(currentScroll * 0.2, 78));

      if (currentScroll > lastScroll + 8 && currentScroll > 120) {
        setNavHidden(true);
      } else if (currentScroll < lastScroll - 8) {
        setNavHidden(false);
      }

      lastScroll = currentScroll;
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const root = shellRef.current;
    if (!root) return;

    const cards = Array.from(root.querySelectorAll<HTMLElement>('[data-tilt]'));
    const cleanupFns: Array<() => void> = [];

    cards.forEach((card) => {
      const onMove = (event: MouseEvent) => {
        const rect = card.getBoundingClientRect();
        const offsetX = (event.clientX - rect.left) / rect.width - 0.5;
        const offsetY = (event.clientY - rect.top) / rect.height - 0.5;
        card.style.transform = `perspective(1000px) rotateX(${offsetY * -4}deg) rotateY(${offsetX * 6}deg) translateY(-3px)`;
      };

      const onLeave = () => {
        card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px)';
      };

      card.addEventListener('mousemove', onMove);
      card.addEventListener('mouseleave', onLeave);
      cleanupFns.push(() => {
        card.removeEventListener('mousemove', onMove);
        card.removeEventListener('mouseleave', onLeave);
      });
    });

    return () => cleanupFns.forEach((fn) => fn());
  }, []);

  useEffect(() => {
    const root = shellRef.current;
    if (!root) return;

    const revealElements = Array.from(root.querySelectorAll<HTMLElement>('[data-reveal]'));
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add(styles.visible);
          }
        });
      },
      { threshold: 0.22 }
    );

    revealElements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);

  const shellStyles = {
    '--landing-primary-hex': primaryColor,
    '--landing-secondary': secondaryColor,
    '--landing-accent': accentColor
  } as CSSProperties;

  const duplicatedProof = [...socialProof, ...socialProof, ...socialProof];

  return (
    <main ref={shellRef} className={styles.pageShell} style={shellStyles}>
      <div className={styles.backgroundLayer} />

      <header className={`${styles.stickyNav} ${navCompact ? styles.navCompact : ''} ${navHidden ? styles.navHidden : ''}`}>
        <div className={styles.navInner}>
          <div className={styles.brandBlock}>
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt={institutionName} className={styles.brandLogo} />
            ) : (
              <span className={styles.brandDot} />
            )}
            <span className={styles.brandName}>{institutionName}</span>
          </div>

          <nav className={styles.navLinks}>
            <a href="#funcionalidades">Funcionalidades</a>
            <a href="#diferenciales">Diferenciales</a>
            <a href="#referencias">Referencias</a>
          </nav>

          <div className={styles.navActions}>
            <button type="button" className={styles.commandTrigger} onClick={() => setCommandOpen(true)}>
              <Search className="w-4 h-4" />
              <span>Buscar</span>
              <kbd>⌘K</kbd>
            </button>
            <Link href="/login" className={styles.navTextCta}>Ingresar</Link>
            <Link href="/register" className={styles.navPrimaryCta}>Crear cuenta</Link>
          </div>
        </div>
      </header>

      <section className={styles.hero} id="inicio">
        <video
          className={styles.heroVideo}
          style={{ transform: `translate3d(0, ${scrollOffset * -1}px, 0)` }}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
        >
          <source src={HERO_VIDEO} type="video/mp4" />
        </video>
        <div className={styles.heroOverlay} />

        <div className={styles.heroContent}>
          <article className={styles.heroStatement} data-tilt data-reveal>
            <p className={styles.heroEyebrow}>
              <BellRing className="w-3.5 h-3.5" />
              Plataforma pedagógica y tecnológica
            </p>
            <h1>
              Diseña aprendizaje con
              <span> estructura pedagógica </span>
              y operación institucional en tiempo real.
            </h1>
            <p>
              Integras planeación ABP/ABR, seguimiento de entregas, mentorías, evaluación y reconocimientos
              en una sola experiencia coherente para estudiantes, docentes y administradores.
            </p>

            <button type="button" className={styles.heroSearchBar} onClick={() => setCommandOpen(true)}>
              <Search className="w-4 h-4" />
              <span>Busca módulos, rutas, herramientas o secciones...</span>
              <kbd>⌘K</kbd>
            </button>

            <div className={styles.heroCtaRow}>
              <Link href="/register" className={styles.heroPrimaryCta}>Empezar ahora</Link>
              <a href="#funcionalidades" className={styles.heroSecondaryCta}>Explorar funcionalidades</a>
            </div>
          </article>

          <div className={styles.heroAside}>
            <div data-reveal className={styles.heroAsideCard}>
              <LandingDemoMetrics />
            </div>
            <article className={styles.storyCard} data-tilt data-reveal>
              <p className={styles.storyEyebrow}>Data storytelling</p>
              <h3>Indicadores de avance por cohorte (demo)</h3>
              <svg viewBox="0 0 320 120" className={styles.storyChart} role="img" aria-label="Curva de avance mensual de ejemplo">
                <defs>
                  <linearGradient id="line-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="rgb(var(--primary))" />
                    <stop offset="100%" stopColor="var(--landing-accent)" />
                  </linearGradient>
                </defs>
                <path d="M10 94 C45 74, 70 84, 104 58 C128 44, 152 64, 180 46 C214 26, 240 30, 270 16 C294 8, 308 15, 312 11" />
              </svg>
              <div className={styles.storyLegend}>
                <span><Workflow className="w-4 h-4" /> +42% avance sostenido</span>
                <span><BookMarked className="w-4 h-4" /> +3.1x uso de recursos</span>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section id="funcionalidades" className={styles.sectionBlock}>
        <header className={styles.sectionHeader}>
          <p>Funcionalidades clave</p>
          <h2>Composición tipo bento para una visión integral</h2>
        </header>

        <div className={styles.bentoGrid}>
          {bentoCards.map((card) => {
            const Icon = card.icon;
            return (
              <article
                key={card.title}
                data-tilt
                data-reveal
                className={[
                  styles.bentoCard,
                  cardSizeClass(card.size),
                  cardToneClass(card.tone)
                ].join(' ')}
              >
                <p className={styles.bentoEyebrow}>{card.eyebrow}</p>
                <h3>{card.title}</h3>
                <p>{card.description}</p>
                <Icon className={styles.bentoIcon} />
              </article>
            );
          })}
        </div>
      </section>

      <section id="diferenciales" className={styles.sectionBlock}>
        <header className={styles.sectionHeader}>
          <p>Diferenciales</p>
          <h2>Experiencia de producto orientada a adopción y autoridad</h2>
        </header>

        <div className={styles.dualColumn}>
          <article className={styles.glassCard} data-reveal data-tilt>
            <p className={styles.glassEyebrow}>Ventaja pedagógica</p>
            <h3>Modelo de aprendizaje ejecutable, no solo descriptivo</h3>
            <ul>
              <li><GraduationCap className="w-4 h-4" /> Diseño pedagógico y operativo en el mismo flujo.</li>
              <li><Layers3 className="w-4 h-4" /> Habilidades del siglo XXI vinculadas a cada experiencia.</li>
              <li><FileCheck2 className="w-4 h-4" /> Evaluación con evidencia y retroalimentación contextual.</li>
            </ul>
          </article>

          <article className={styles.glassCard} data-reveal data-tilt>
            <p className={styles.glassEyebrow}>Ventaja tecnológica</p>
            <h3>Trazabilidad, rendimiento y gobernanza institucional</h3>
            <ul>
              <li><Radar className="w-4 h-4" /> Historial de actividad en tiempo real por usuario.</li>
              <li><CalendarClock className="w-4 h-4" /> Coordinación entre entregas, mentorías y resultados.</li>
              <li><Sparkles className="w-4 h-4" /> Reconocimientos verificables y configurables.</li>
            </ul>
          </article>
        </div>
      </section>

      <section className={styles.sectionBlock}>
        <header className={styles.sectionHeader}>
          <p>Social proof dinámico</p>
          <h2>Carrusel continuo de testimonios institucionales</h2>
        </header>

        <div className={styles.marqueeShell} data-reveal>
          <div className={styles.marqueeTrack}>
            {duplicatedProof.map((item, index) => (
              <article key={`${item.author}-${index}`} className={styles.testimonialCard}>
                <p>{item.quote}</p>
                <span>{item.author}</span>
              </article>
            ))}
          </div>
        </div>
      </section>

      <div className={styles.sectionBlock}>
        <LandingAudience />
      </div>

      <section id="referencias" className={styles.sectionBlock}>
        <header className={styles.sectionHeader}>
          <p>Referencias</p>
          <h2>Fuentes y marcos que respaldan la propuesta</h2>
        </header>

        <div className={styles.referenceGrid}>
          {references.map((item) => (
            <a key={item.name} href={item.href} target="_blank" rel="noopener noreferrer" className={styles.referenceCard}>
              <div>
                <h3>{item.name}</h3>
                <p>{item.detail}</p>
              </div>
              <ArrowUpRight className="w-4 h-4" />
            </a>
          ))}
        </div>
      </section>

      <section className={styles.finalCta} data-reveal>
        <div>
          <p>Implementación institucional</p>
          <h2>Convierte tu estrategia pedagógica en una operación medible y escalable.</h2>
          <span>La vista pública usa métricas demostrativas para proteger datos reales.</span>
        </div>
        <div className={styles.finalActions}>
          <Link href="/register" className={styles.finalPrimary}>Crear cuenta</Link>
          <Link href="/login" className={styles.finalSecondary}>Ingresar</Link>
        </div>
      </section>

      {commandOpen && (
        <div className={styles.commandOverlay} onClick={() => setCommandOpen(false)}>
          <div className={styles.commandPanel} onClick={(event) => event.stopPropagation()}>
            <div className={styles.commandInputWrap}>
              <Search className="w-4 h-4 text-slate-400" />
              <input
                ref={inputRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar por intención: evaluación, mentorías, recursos, perfiles..."
              />
            </div>

            <div className={styles.commandResults}>
              {filteredActions.length === 0 ? (
                <p className={styles.commandEmpty}>No hay coincidencias para esa búsqueda.</p>
              ) : (
                filteredActions.map((action) => (
                  <a key={action.title} href={action.href} onClick={() => setCommandOpen(false)} className={styles.commandItem}>
                    <div>
                      <h4>{action.title}</h4>
                      <p>{action.description}</p>
                    </div>
                    <Command className="w-4 h-4 text-slate-400" />
                  </a>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
