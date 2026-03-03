"use client";

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  ArrowUpRight,
  BellRing,
  BookMarked,
  BrainCircuit,
  CalendarClock,
  CheckCircle2,
  Command as CommandIcon,
  FileCheck2,
  GaugeCircle,
  Layers3,
  Radar,
  Search,
  Sparkles,
  X
} from "lucide-react";
import styles from './landing.module.css';
import { LandingAudience } from './LandingAudience';

interface LandingSurfaceProps {
  institutionName: string;
  logoUrl: string;
  primaryColor: string;   // "r, g, b"
  secondaryColor: string; // "r, g, b"
  accentColor: string;    // "r, g, b"
}

type Metric = {
  label: string;
  value: number;
  suffix?: string;
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: any;
  tone: 'neutral' | 'accent' | 'dark';
  size: 'small' | 'wide' | 'tall';
};

const HERO_VIDEO_URL = 'https://videos.pexels.com/video-files/3195394/3195394-hd_1920_1080_25fps.mp4';

const demoMetrics: Metric[] = [
  { label: 'Proyectos activos', value: 184, suffix: '+' },
  { label: 'Usuarios en ruta', value: 4680, suffix: '+' },
  { label: 'Recursos recomendados', value: 920, suffix: '+' },
  { label: 'Reconocimientos emitidos', value: 1260, suffix: '+' }
];

const bentoCards: BentoCard[] = [
  {
    title: 'Diseño pedagógico estructurado',
    description: 'Planeación ABP/ABR con objetivos, metodología, entregables y evaluación conectados desde el inicio.',
    eyebrow: 'Planeación',
    icon: BrainCircuit,
    tone: 'accent',
    size: 'wide'
  },
  {
    title: 'Seguimiento operativo diario',
    description: 'Visualiza avance por estudiante y equipo en tiempo real con acciones concretas.',
    eyebrow: 'Gestión',
    icon: GaugeCircle,
    tone: 'neutral',
    size: 'small'
  },
  {
    title: 'Mentorías con trazabilidad',
    description: 'Agenda sesiones, registra acuerdos y vincula cada mentoría al progreso del proyecto.',
    eyebrow: 'Acompañamiento',
    icon: CalendarClock,
    tone: 'neutral',
    size: 'small'
  },
  {
    title: 'Evaluación con evidencia',
    description: 'Rúbricas, retroalimentación y resultados en un flujo verificable, claro y accionable.',
    eyebrow: 'Calidad',
    icon: FileCheck2,
    tone: 'dark',
    size: 'tall'
  },
  {
    title: 'Habilidades del siglo XXI',
    description: 'Asocia competencias por industria para alinear el aprendizaje con la realidad productiva.',
    eyebrow: 'Pertinencia',
    icon: Sparkles,
    tone: 'neutral',
    size: 'wide'
  },
  {
    title: 'Observabilidad institucional',
    description: 'Historial de actividad y señales de uso para mejora continua y gobernanza.',
    eyebrow: 'Analítica',
    icon: Radar,
    tone: 'accent',
    size: 'small'
  }
];

const semanticActions: CommandAction[] = [
  {
    title: 'Ver módulos',
    description: 'Explorar capacidades en la cuadrícula bento.',
    href: '#funcionalidades',
    keywords: ['módulos', 'modulos', 'bento', 'herramientas', 'capacidades']
  },
  {
    title: 'Ir a diferenciales',
    description: 'Revisar propuesta de valor pedagógica y tecnológica.',
    href: '#diferenciales',
    keywords: ['diferenciales', 'ventajas', 'valor', 'pedagógico', 'tecnológico']
  },
  {
    title: 'Consultar referencias',
    description: 'Abrir fuentes externas y marcos de referencia.',
    href: '#referencias',
    keywords: ['referencias', 'unesco', 'oecd', 'wef', 'iste', 'fuentes']
  },
  {
    title: 'Ver experiencia por perfil',
    description: 'Comparar rutas para estudiantes, docentes y administradores.',
    href: '#perfiles',
    keywords: ['perfil', 'estudiantes', 'docentes', 'administradores', 'rutas']
  },
  {
    title: 'Ingresar',
    description: 'Acceder al entorno institucional.',
    href: '/login',
    keywords: ['login', 'ingresar', 'acceso']
  },
  {
    title: 'Crear cuenta',
    description: 'Iniciar implementación en tu institución.',
    href: '/register',
    keywords: ['registro', 'crear', 'cuenta', 'implementación']
  }
];

const socialProof = [
  {
    quote: '“Consolidamos evidencias de aprendizaje sin perder tiempo en tareas administrativas.”',
    author: 'Coordinación Académica'
  },
  {
    quote: '“La visibilidad por proyecto nos ayudó a intervenir a tiempo y elevar el desempeño.”',
    author: 'Dirección de Innovación'
  },
  {
    quote: '“Docentes y estudiantes adoptaron el flujo porque refleja el trabajo real del aula.”',
    author: 'Liderazgo Pedagógico'
  },
  {
    quote: '“Pasamos de reportes dispersos a decisiones semanales basadas en datos consistentes.”',
    author: 'Gestión Institucional'
  }
];

const references = [
  {
    name: 'UNESCO',
    detail: 'Futures of Education',
    href: 'https://www.unesco.org/en/futures-education',
    visualUrl: 'https://www.google.com/s2/favicons?sz=128&domain_url=unesco.org'
  },
  {
    name: 'OECD',
    detail: 'Education at a Glance',
    href: 'https://www.oecd.org/en/publications/education-at-a-glance_b858e7fe-en.html',
    visualUrl: 'https://www.google.com/s2/favicons?sz=128&domain_url=oecd.org'
  },
  {
    name: 'World Economic Forum',
    detail: 'Future of Jobs Report',
    href: 'https://www.weforum.org/reports/',
    visualUrl: 'https://www.google.com/s2/favicons?sz=128&domain_url=weforum.org'
  },
  {
    name: 'ISTE',
    detail: 'ISTE Standards',
    href: 'https://iste.org/standards',
    visualUrl: 'https://www.google.com/s2/favicons?sz=128&domain_url=iste.org'
  }
];

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function cardToneClass(tone: BentoCard['tone']) {
  if (tone === 'accent') return styles.bentoAccent;
  if (tone === 'dark') return styles.bentoDark;
  return styles.bentoNeutral;
}

function cardSizeClass(size: BentoCard['size']) {
  if (size === 'wide') return styles.bentoWide;
  if (size === 'tall') return styles.bentoTall;
  return styles.bentoSmall;
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
  const lastScrollY = useRef(0);

  const [navCompact, setNavCompact] = useState(false);
  const [navHidden, setNavHidden] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [videoShift, setVideoShift] = useState(0);
  const [metricsValues, setMetricsValues] = useState<number[]>(() => demoMetrics.map(() => 0));

  const filteredActions = useMemo(() => {
    const normalizedQuery = normalize(query.trim());
    if (!normalizedQuery) return semanticActions;

    const terms = normalizedQuery.split(/\s+/).filter(Boolean);
    return semanticActions.filter((action) => {
      const haystack = normalize(`${action.title} ${action.description} ${action.keywords.join(' ')}`);
      return terms.every((term) => haystack.includes(term));
    });
  }, [query]);

  const duplicatedTestimonials = useMemo(
    () => [...socialProof, ...socialProof, ...socialProof],
    []
  );

  useEffect(() => {
    const onScroll = () => {
      const currentY = window.scrollY;
      setNavCompact(currentY > 18);
      setVideoShift(Math.min(currentY * 0.16, 86));

      if (currentY > lastScrollY.current + 8 && currentY > 120) {
        setNavHidden(true);
      } else if (currentY < lastScrollY.current - 8) {
        setNavHidden(false);
      }

      lastScrollY.current = currentY;
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const isShortcut = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k';
      if (isShortcut) {
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
    if (commandOpen) {
      setTimeout(() => inputRef.current?.focus(), 25);
    }
  }, [commandOpen]);

  useEffect(() => {
    let frameId = 0;
    const start = performance.now();
    const duration = 1500;

    const animate = (timestamp: number) => {
      const progress = Math.min((timestamp - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);

      setMetricsValues(demoMetrics.map((metric) => Math.floor(metric.value * eased)));

      if (progress < 1) frameId = requestAnimationFrame(animate);
    };

    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, []);

  useEffect(() => {
    const root = shellRef.current;
    if (!root) return;

    const revealItems = Array.from(root.querySelectorAll<HTMLElement>('[data-reveal]'));
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add(styles.isVisible);
          }
        });
      },
      { threshold: 0.18 }
    );

    revealItems.forEach((item) => observer.observe(item));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const root = shellRef.current;
    if (!root) return;

    const cards = Array.from(root.querySelectorAll<HTMLElement>('[data-tilt]'));
    const cleanups: Array<() => void> = [];

    cards.forEach((card) => {
      const onMove = (event: MouseEvent) => {
        const rect = card.getBoundingClientRect();
        const posX = (event.clientX - rect.left) / rect.width - 0.5;
        const posY = (event.clientY - rect.top) / rect.height - 0.5;
        card.style.transform = `perspective(1100px) rotateX(${posY * -5}deg) rotateY(${posX * 6}deg) translateY(-3px)`;
      };
      const onLeave = () => {
        card.style.transform = 'perspective(1100px) rotateX(0deg) rotateY(0deg) translateY(0px)';
      };

      card.addEventListener('mousemove', onMove);
      card.addEventListener('mouseleave', onLeave);
      cleanups.push(() => {
        card.removeEventListener('mousemove', onMove);
        card.removeEventListener('mouseleave', onLeave);
      });
    });

    return () => cleanups.forEach((cleanup) => cleanup());
  }, []);

  const cssVars = {
    '--primary-rgb': primaryColor,
    '--secondary-rgb': secondaryColor,
    '--accent-rgb': accentColor,
    '--primary': primaryColor.replace(/,\s*/g, ' ')
  } as React.CSSProperties;

  return (
    <div ref={shellRef} className={styles.pageShell} style={cssVars}>
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
            <button className={styles.commandTrigger} onClick={() => setCommandOpen(true)}>
              <Search size={15} />
              <span>Buscar</span>
              <kbd>⌘K</kbd>
            </button>
            <Link href="/login" className={styles.navTextCta}>Ingresar</Link>
            <Link href="/register" className={styles.navPrimaryCta}>Crear cuenta</Link>
          </div>
        </div>
      </header>

      <section className={styles.heroSection}>
        <video
          className={styles.heroVideo}
          style={{ transform: `translateY(${videoShift * -1}px)` }}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
        >
          <source src={HERO_VIDEO_URL} type="video/mp4" />
        </video>
        <div className={styles.heroOverlay} />

        <div className={styles.heroGrid}>
          <article className={styles.heroPanel} data-tilt data-reveal>
            <p className={styles.heroEyebrow}>
              <BellRing size={14} />
              Plataforma pedagógica y tecnológica
            </p>
            <h1>
              Arquitectura de aprendizaje
              <span> orientada a resultados </span>
              y trazabilidad total.
            </h1>
            <p>
              Integra diseño ABP/ABR, evaluación con evidencia, mentorías y analítica en un mismo flujo operativo.
            </p>

            <button className={styles.heroSearch} onClick={() => setCommandOpen(true)}>
              <Search size={16} />
              <span>Busca herramientas, módulos y rutas de implementación...</span>
              <kbd>⌘K</kbd>
            </button>

            <div className={styles.heroActions}>
              <Link href="/register" className={styles.heroPrimary}>Empezar ahora</Link>
              <a href="#funcionalidades" className={styles.heroSecondary}>Explorar funcionalidades</a>
            </div>
          </article>

          <aside className={styles.heroSide}>
            <article className={styles.metricsCard} data-reveal>
              <p className={styles.metricsEyebrow}>Narrativa de datos</p>
              <div className={styles.metricsList}>
                {demoMetrics.map((metric, index) => (
                  <div key={metric.label} className={styles.metricItem}>
                    <span>{metric.label}</span>
                    <strong>{new Intl.NumberFormat('es-CO').format(metricsValues[index])}{metric.suffix || ''}</strong>
                  </div>
                ))}
              </div>
              <p className={styles.metricsFootnote}>Cifras de demostración para vista pública.</p>
            </article>

            <article className={styles.graphCard} data-tilt data-reveal>
              <p>Curva de avance (demo)</p>
              <svg viewBox="0 0 320 120" className={styles.graphSvg} role="img" aria-label="Curva de avance de ejemplo">
                <defs>
                  <linearGradient id="hero-gradient-line" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="rgb(var(--primary-rgb))" />
                    <stop offset="100%" stopColor="rgb(var(--accent-rgb))" />
                  </linearGradient>
                </defs>
                <path d="M8 96 C40 80, 70 76, 104 58 C132 42, 158 68, 188 46 C220 24, 252 36, 286 20 C300 14, 311 18, 316 12" />
              </svg>
              <div className={styles.graphLegend}>
                <span><Layers3 size={14} /> +38% eficiencia operativa</span>
                <span><BookMarked size={14} /> +3.1x uso de recursos</span>
              </div>
            </article>
          </aside>
        </div>
      </section>

      <section id="funcionalidades" className={styles.sectionBlock}>
        <header className={styles.sectionHeader}>
          <p>Funcionalidades clave</p>
          <h2>Composición bento para visualizar valor pedagógico y operativo</h2>
        </header>

        <div className={styles.bentoGrid}>
          {bentoCards.map((card) => {
            const Icon = card.icon;
            return (
              <article
                key={card.title}
                data-tilt
                data-reveal
                className={`${styles.bentoCard} ${cardSizeClass(card.size)} ${cardToneClass(card.tone)}`}
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
          <h2>Experiencia de producto diseñada para adopción institucional</h2>
        </header>

        <div className={styles.diffGrid}>
          <article className={styles.glassCard} data-tilt data-reveal>
            <p className={styles.glassEyebrow}>Pedagógico</p>
            <h3>Diseño pedagógico ejecutable</h3>
            <ul>
              <li><CheckCircle2 size={15} /> Planeación ABP/ABR con estructura clara.</li>
              <li><CheckCircle2 size={15} /> Evaluación por evidencia y retroalimentación.</li>
              <li><CheckCircle2 size={15} /> Habilidades del siglo XXI por industria.</li>
            </ul>
          </article>

          <article className={styles.glassCard} data-tilt data-reveal>
            <p className={styles.glassEyebrow}>Tecnológico</p>
            <h3>Gobernanza y observabilidad en tiempo real</h3>
            <ul>
              <li><CheckCircle2 size={15} /> Trazabilidad de actividad por usuario.</li>
              <li><CheckCircle2 size={15} /> Flujo integrado de tareas y mentorías.</li>
              <li><CheckCircle2 size={15} /> Reconocimientos verificables y configurables.</li>
            </ul>
          </article>
        </div>
      </section>

      <section className={styles.sectionBlock}>
        <header className={styles.sectionHeader}>
          <p>Prueba social dinámica</p>
          <h2>Carrusel continuo de señales de confianza institucional</h2>
        </header>

        <div className={styles.marqueeShell} data-reveal>
          <div className={styles.marqueeTrack}>
            {duplicatedTestimonials.map((item, index) => (
              <article key={`${item.author}-${index}`} className={styles.testimonialCard}>
                <p>{item.quote}</p>
                <span>{item.author}</span>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.sectionBlock}>
        <LandingAudience />
      </section>

      <section id="referencias" className={styles.sectionBlock}>
        <header className={styles.sectionHeader}>
          <p>Referencias</p>
          <h2>Fuentes reales que inspiran el enfoque de desarrollo</h2>
        </header>

        <div className={styles.referenceGrid}>
          {references.map((item) => (
            <a key={item.name} href={item.href} target="_blank" rel="noopener noreferrer" className={styles.referenceCard}>
              <div className={styles.referenceInfo}>
                <span className={styles.referenceMark} style={{ backgroundImage: `url(${item.visualUrl})` }} />
                <h3>{item.name}</h3>
                <p>{item.detail}</p>
              </div>
              <ArrowUpRight size={16} />
            </a>
          ))}
        </div>
      </section>

      <section id="contacto" className={styles.finalCta} data-reveal>
        <div>
          <p>Implementación institucional</p>
          <h2>Convierte tu estrategia pedagógica en una operación medible y escalable.</h2>
          <span>La vista de laboratorio local usa métricas demostrativas para proteger datos reales.</span>
        </div>
        <div className={styles.finalActions}>
          <Link href="/register" className={styles.finalPrimary}>Crear cuenta</Link>
          <Link href="/login" className={styles.finalSecondary}>Ingresar</Link>
        </div>
      </section>

      {commandOpen && (
        <div className={styles.commandOverlay} onClick={() => setCommandOpen(false)}>
          <div className={styles.commandPanel} onClick={(event) => event.stopPropagation()}>
            <div className={styles.commandHeader}>
              <div className={styles.commandTitle}>
                <CommandIcon size={15} />
                <span>Búsqueda semántica</span>
              </div>
              <button className={styles.commandClose} onClick={() => setCommandOpen(false)}>
                <X size={16} />
              </button>
            </div>

            <div className={styles.commandSearch}>
              <Search size={15} />
              <input
                ref={inputRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar por intención: evaluación, mentorías, recursos, perfiles..."
              />
            </div>

            <div className={styles.commandList}>
              {filteredActions.length === 0 ? (
                <p className={styles.commandEmpty}>No se encontraron resultados para esta búsqueda.</p>
              ) : (
                filteredActions.map((action) => (
                  <a key={action.title} href={action.href} onClick={() => setCommandOpen(false)} className={styles.commandItem}>
                    <div>
                      <h4>{action.title}</h4>
                      <p>{action.description}</p>
                    </div>
                    <ArrowRight size={15} />
                  </a>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
