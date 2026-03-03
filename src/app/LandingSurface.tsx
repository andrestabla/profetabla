"use client";

import { useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  ArrowUpRight,
  CalendarClock,
  Check,
  CheckCircle2,
  Command as CommandIcon,
  GraduationCap,
  Layers3,
  Loader2,
  LibraryBig,
  Pencil,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
  X
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import styles from './landing.module.css';
import { LandingAudience } from './LandingAudience';

interface LandingSurfaceProps {
  institutionName: string;
  logoUrl: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  isAdmin?: boolean;
  editableContent: LandingEditableContent;
}

type LandingEditableContent = {
  heroEyebrow: string;
  heroTitleStart: string;
  heroTitleHighlight: string;
  heroTitleEnd: string;
  heroDescription: string;
  primaryCtaLabel: string;
  secondaryCtaLabel: string;
  heroImageMainUrl: string;
  heroImageSecondaryUrl: string;
}

type HeroMetric = {
  label: string;
  value: number;
  suffix?: string;
};

type Benefit = {
  title: string;
  description: string;
  icon: LucideIcon;
};

type Category = {
  id: string;
  title: string;
  description: string;
  routes: number;
  icon: LucideIcon;
};

type Program = {
  title: string;
  categoryId: string;
  level: string;
  duration: string;
  students: number;
  rating: number;
  priceLabel: string;
  imageUrl: string;
  author: string;
};

type CommandAction = {
  title: string;
  description: string;
  href: string;
  keywords: string[];
};

const HERO_IMAGE_MAIN = 'https://images.pexels.com/photos/6238118/pexels-photo-6238118.jpeg?auto=compress&cs=tinysrgb&w=1280';
const HERO_IMAGE_SECONDARY = 'https://images.pexels.com/photos/5212345/pexels-photo-5212345.jpeg?auto=compress&cs=tinysrgb&w=960';

const heroMetrics: HeroMetric[] = [
  { label: 'Proyectos activos', value: 248, suffix: '+' },
  { label: 'Estudiantes en seguimiento', value: 5840, suffix: '+' },
  { label: 'Mentorías mensuales', value: 730, suffix: '+' }
];

const benefits: Benefit[] = [
  {
    title: 'Operación pedagógica conectada',
    description: 'Planeación, tareas, mentorías y evaluación en un mismo flujo.',
    icon: Layers3
  },
  {
    title: 'Seguimiento por estudiante y equipo',
    description: 'Visibilidad de avance para intervenir con precisión y a tiempo.',
    icon: Users
  },
  {
    title: 'Reconocimientos verificables',
    description: 'Insignias y certificados vinculados a evidencias reales.',
    icon: ShieldCheck
  }
];

const categories: Category[] = [
  {
    id: 'innovacion',
    title: 'Innovación educativa',
    description: 'Metodologías activas y diseño didáctico aplicable.',
    routes: 26,
    icon: Sparkles
  },
  {
    id: 'tecnologia',
    title: 'Tecnología aplicada',
    description: 'Herramientas para resolver retos formativos reales.',
    routes: 34,
    icon: Layers3
  },
  {
    id: 'liderazgo',
    title: 'Liderazgo académico',
    description: 'Gestión de equipos docentes y mejora institucional.',
    routes: 19,
    icon: ShieldCheck
  },
  {
    id: 'analitica',
    title: 'Analítica y evaluación',
    description: 'Lectura de evidencias para decisiones de calidad.',
    routes: 22,
    icon: LibraryBig
  },
  {
    id: 'habilidades',
    title: 'Habilidades del siglo XXI',
    description: 'Competencias alineadas con tendencias por industria.',
    routes: 29,
    icon: GraduationCap
  },
  {
    id: 'mentorias',
    title: 'Mentorías estratégicas',
    description: 'Acompañamiento estructurado por calendario y metas.',
    routes: 16,
    icon: CalendarClock
  }
];

const programs: Program[] = [
  {
    title: 'Diseño de proyectos ABP con evaluación por evidencias',
    categoryId: 'innovacion',
    level: 'Intermedio',
    duration: '10 semanas',
    students: 236,
    rating: 4.9,
    priceLabel: 'Demostrativo',
    author: 'Equipo pedagógico',
    imageUrl: 'https://images.pexels.com/photos/5427673/pexels-photo-5427673.jpeg?auto=compress&cs=tinysrgb&w=900'
  },
  {
    title: 'Laboratorio de herramientas digitales para docentes líderes',
    categoryId: 'tecnologia',
    level: 'Avanzado',
    duration: '8 semanas',
    students: 188,
    rating: 4.8,
    priceLabel: 'Demostrativo',
    author: 'Unidad de innovación',
    imageUrl: 'https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg?auto=compress&cs=tinysrgb&w=900'
  },
  {
    title: 'Mentoría académica para proyectos interdisciplinarios',
    categoryId: 'mentorias',
    level: 'Todos los niveles',
    duration: '6 semanas',
    students: 162,
    rating: 4.7,
    priceLabel: 'Demostrativo',
    author: 'Red de mentores',
    imageUrl: 'https://images.pexels.com/photos/8199678/pexels-photo-8199678.jpeg?auto=compress&cs=tinysrgb&w=900'
  },
  {
    title: 'Analítica educativa para directivos y coordinación',
    categoryId: 'analitica',
    level: 'Intermedio',
    duration: '7 semanas',
    students: 174,
    rating: 4.9,
    priceLabel: 'Demostrativo',
    author: 'Mesa de analítica',
    imageUrl: 'https://images.pexels.com/photos/7947663/pexels-photo-7947663.jpeg?auto=compress&cs=tinysrgb&w=900'
  },
  {
    title: 'Liderazgo pedagógico para transformación institucional',
    categoryId: 'liderazgo',
    level: 'Intermedio',
    duration: '9 semanas',
    students: 201,
    rating: 4.8,
    priceLabel: 'Demostrativo',
    author: 'Dirección académica',
    imageUrl: 'https://images.pexels.com/photos/5717411/pexels-photo-5717411.jpeg?auto=compress&cs=tinysrgb&w=900'
  },
  {
    title: 'Competencias del siglo XXI para entornos de innovación',
    categoryId: 'habilidades',
    level: 'Inicial',
    duration: '5 semanas',
    students: 221,
    rating: 4.6,
    priceLabel: 'Demostrativo',
    author: 'Equipo de habilidades',
    imageUrl: 'https://images.pexels.com/photos/4145190/pexels-photo-4145190.jpeg?auto=compress&cs=tinysrgb&w=900'
  },
  {
    title: 'Diseño de rúbricas y retroalimentación formativa',
    categoryId: 'analitica',
    level: 'Intermedio',
    duration: '6 semanas',
    students: 149,
    rating: 4.8,
    priceLabel: 'Demostrativo',
    author: 'Centro de evaluación',
    imageUrl: 'https://images.pexels.com/photos/4143794/pexels-photo-4143794.jpeg?auto=compress&cs=tinysrgb&w=900'
  },
  {
    title: 'Plan de integración tecnológica para currículo escolar',
    categoryId: 'tecnologia',
    level: 'Avanzado',
    duration: '12 semanas',
    students: 132,
    rating: 4.7,
    priceLabel: 'Demostrativo',
    author: 'Laboratorio digital',
    imageUrl: 'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=900'
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

const semanticActions: CommandAction[] = [
  {
    title: 'Ver categorías',
    description: 'Explorar categorías estratégicas de aprendizaje.',
    href: '#categorias',
    keywords: ['categorías', 'rutas', 'habilidades', 'industria']
  },
  {
    title: 'Ver programas',
    description: 'Revisar catálogo de programas demostrativos.',
    href: '#programas',
    keywords: ['programas', 'cursos', 'tarjetas', 'catálogo']
  },
  {
    title: 'Ver diferenciales',
    description: 'Conocer la propuesta pedagógica y tecnológica.',
    href: '#diferenciales',
    keywords: ['diferenciales', 'pedagógico', 'tecnológico']
  },
  {
    title: 'Comparar perfiles',
    description: 'Ver experiencia por estudiantes, docentes y administración.',
    href: '#perfiles',
    keywords: ['perfiles', 'estudiantes', 'docentes', 'administradores']
  },
  {
    title: 'Consultar referencias',
    description: 'Abrir fuentes externas para lineamientos y tendencias.',
    href: '#referencias',
    keywords: ['unesco', 'oecd', 'wef', 'iste', 'referencias']
  },
  {
    title: 'Ingresar',
    description: 'Acceder al entorno institucional.',
    href: '/login',
    keywords: ['login', 'ingresar', 'acceso']
  },
  {
    title: 'Crear cuenta',
    description: 'Iniciar proceso de implementación institucional.',
    href: '/register',
    keywords: ['registro', 'cuenta', 'implementación']
  }
];

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export function LandingSurface({
  institutionName,
  logoUrl,
  primaryColor,
  secondaryColor,
  accentColor,
  isAdmin = false,
  editableContent
}: LandingSurfaceProps) {
  const shellRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const lastScrollY = useRef(0);

  const [navCompact, setNavCompact] = useState(false);
  const [navHidden, setNavHidden] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [metricValues, setMetricValues] = useState<number[]>(() => heroMetrics.map(() => 0));
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorSaving, setEditorSaving] = useState(false);
  const [editorMessage, setEditorMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [content, setContent] = useState<LandingEditableContent>(editableContent);

  const filteredPrograms = useMemo(() => {
    if (activeCategory === 'all') return programs;
    return programs.filter((program) => program.categoryId === activeCategory);
  }, [activeCategory]);

  const filteredActions = useMemo(() => {
    const normalizedQuery = normalize(query.trim());
    if (!normalizedQuery) return semanticActions;

    const terms = normalizedQuery.split(/\s+/).filter(Boolean);
    return semanticActions.filter((action) => {
      const haystack = normalize(`${action.title} ${action.description} ${action.keywords.join(' ')}`);
      return terms.every((term) => haystack.includes(term));
    });
  }, [query]);

  useEffect(() => {
    setContent(editableContent);
  }, [editableContent]);

  useEffect(() => {
    const onScroll = () => {
      const currentY = window.scrollY;
      setNavCompact(currentY > 10);

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
      setTimeout(() => inputRef.current?.focus(), 24);
    }
  }, [commandOpen]);

  useEffect(() => {
    let frameId = 0;
    const start = performance.now();
    const duration = 1400;

    const animate = (timestamp: number) => {
      const progress = Math.min((timestamp - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setMetricValues(heroMetrics.map((item) => Math.floor(item.value * eased)));

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
      { threshold: 0.15 }
    );

    revealItems.forEach((item) => observer.observe(item));
    return () => observer.disconnect();
  }, []);

  const heroImageMain = content.heroImageMainUrl?.trim() || HERO_IMAGE_MAIN;
  const heroImageSecondary = content.heroImageSecondaryUrl?.trim() || HERO_IMAGE_SECONDARY;

  const updateContentField = (field: keyof LandingEditableContent, value: string) => {
    setEditorMessage(null);
    setContent((prev) => ({ ...prev, [field]: value }));
  };

  const saveEditableContent = async () => {
    try {
      setEditorSaving(true);
      setEditorMessage(null);

      const response = await fetch('/api/home-lab/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(content)
      });

      const result = (await response.json()) as { success?: boolean; message?: string };
      if (!response.ok || !result.success) {
        throw new Error(result.message || 'No fue posible guardar los cambios.');
      }

      setEditorMessage({ type: 'success', text: 'Cambios guardados correctamente.' });
      setEditorOpen(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al guardar.';
      setEditorMessage({ type: 'error', text: message });
    } finally {
      setEditorSaving(false);
    }
  };

  const cssVars = {
    '--primary-rgb': primaryColor,
    '--secondary-rgb': secondaryColor,
    '--accent-rgb': accentColor,
    '--primary': primaryColor.replace(/,\s*/g, ' ')
  } as CSSProperties;

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
            <a href="#categorias">Categorías</a>
            <a href="#programas">Programas</a>
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

      <main>
        <section className={styles.heroSection}>
          <div className={styles.heroGrid}>
            <article className={styles.heroCopy} data-reveal>
              <p className={styles.heroEyebrow}>{content.heroEyebrow}</p>
              <h1>
                {content.heroTitleStart}
                <span> {content.heroTitleHighlight}</span>
                {' '}{content.heroTitleEnd}
              </h1>
              <p>
                {content.heroDescription}
              </p>

              <div className={styles.heroActions}>
                <Link href="/register" className={styles.heroPrimary}>{content.primaryCtaLabel}</Link>
                <a href="#programas" className={styles.heroSecondary}>{content.secondaryCtaLabel}</a>
              </div>

              <button className={styles.heroSearch} onClick={() => setCommandOpen(true)}>
                <Search size={16} />
                <span>Busca por mentorías, evaluación, habilidades o rutas formativas...</span>
                <kbd>⌘K</kbd>
              </button>

              <div className={styles.heroMetricRow}>
                {heroMetrics.map((item, index) => (
                  <article key={item.label} className={styles.heroMetricCard}>
                    <strong>{new Intl.NumberFormat('es-CO').format(metricValues[index])}{item.suffix || ''}</strong>
                    <span>{item.label}</span>
                  </article>
                ))}
              </div>
            </article>

            <aside className={styles.heroVisual} data-reveal>
              <span className={styles.heroCircleOne} />
              <span className={styles.heroCircleTwo} />

              <div className={styles.heroImageStack}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={heroImageMain} alt="Estudiante desarrollando actividad de aprendizaje" className={styles.heroImageMain} />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={heroImageSecondary} alt="Estudiante en sesión de trabajo colaborativo" className={styles.heroImageSecondary} />
              </div>

              <article className={styles.heroBadge}>
                <div className={styles.heroBadgeIcon}>
                  <CheckCircle2 size={16} />
                </div>
                <div>
                  <strong>Implementación guiada</strong>
                  <span>Arquitectura pedagógica + operación digital</span>
                </div>
              </article>
            </aside>
          </div>
        </section>

        <section className={styles.benefitsBar} data-reveal>
          <div className={styles.benefitsGrid}>
            {benefits.map((item) => {
              const Icon = item.icon;
              return (
                <article key={item.title} className={styles.benefitItem}>
                  <span className={styles.benefitIconWrap}>
                    <Icon size={17} />
                  </span>
                  <div>
                    <h3>{item.title}</h3>
                    <p>{item.description}</p>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section id="categorias" className={styles.sectionBlock}>
          <header className={styles.sectionHeader} data-reveal>
            <p>Categorías destacadas</p>
            <h2>Rutas de formación por enfoque y necesidad institucional</h2>
          </header>

          <div className={styles.categoryGrid}>
            {categories.map((item) => {
              const Icon = item.icon;
              return (
                <article key={item.id} className={styles.categoryCard} data-reveal>
                  <Icon className={styles.categoryIcon} />
                  <div className={styles.categoryMeta}>
                    <h3>{item.title}</h3>
                    <p>{item.description}</p>
                    <span>{item.routes} rutas sugeridas</span>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section id="programas" className={styles.sectionBlock}>
          <header className={styles.sectionHeader} data-reveal>
            <p>Programas recomendados</p>
            <h2>Catálogo demostrativo con estética editorial y lectura rápida</h2>
          </header>

          <div className={styles.filterBar} data-reveal>
            <button
              className={`${styles.filterChip} ${activeCategory === 'all' ? styles.filterChipActive : ''}`}
              onClick={() => setActiveCategory('all')}
            >
              Todas
            </button>
            {categories.map((item) => (
              <button
                key={item.id}
                className={`${styles.filterChip} ${activeCategory === item.id ? styles.filterChipActive : ''}`}
                onClick={() => setActiveCategory(item.id)}
              >
                {item.title}
              </button>
            ))}
          </div>

          <div className={styles.courseGrid}>
            {filteredPrograms.map((program) => (
              <article key={program.title} className={styles.courseCard} data-reveal>
                <div className={styles.courseMedia}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={program.imageUrl} alt={program.title} loading="lazy" />
                </div>

                <div className={styles.courseBody}>
                  <div className={styles.courseTagRow}>
                    <span className={styles.courseTag}>{categories.find((item) => item.id === program.categoryId)?.title || 'Ruta'}</span>
                    <span className={styles.coursePrice}>{program.priceLabel}</span>
                  </div>

                  <h3 className={styles.courseTitle}>{program.title}</h3>

                  <div className={styles.courseMetaRow}>
                    <span>
                      <CalendarClock size={14} />
                      {program.duration}
                    </span>
                    <span>
                      <Users size={14} />
                      {program.students}
                    </span>
                    <span>
                      <Star size={14} />
                      {program.rating.toFixed(1)}
                    </span>
                  </div>

                  <p className={styles.courseRating}>{program.author}</p>

                  <a href="#diferenciales" className={styles.courseLink}>
                    Ver enfoque institucional
                    <ArrowRight size={15} />
                  </a>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section id="diferenciales" className={styles.sectionBlock}>
          <div className={styles.premiumSplit} data-reveal>
            <article className={styles.premiumMedia}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://images.pexels.com/photos/4145190/pexels-photo-4145190.jpeg?auto=compress&cs=tinysrgb&w=1200"
                alt="Equipo académico planificando aprendizaje"
                className={styles.premiumMediaImage}
              />
            </article>

            <article className={styles.premiumCopy}>
              <p>Valor institucional</p>
              <h2>Una experiencia premium para gestión pedagógica y tecnológica</h2>
              <ul>
                <li><CheckCircle2 size={16} />Diseño pedagógico ejecutable con foco en resultados.</li>
                <li><CheckCircle2 size={16} />Dashboard operativo para estudiantes, docentes y administración.</li>
                <li><CheckCircle2 size={16} />Historial de actividad completo y gobernanza en tiempo real.</li>
                <li><CheckCircle2 size={16} />Reconocimientos verificables vinculados a evidencias.</li>
              </ul>
            </article>
          </div>
        </section>

        <section className={styles.sectionBlock}>
          <LandingAudience />
        </section>

        <section id="referencias" className={styles.sectionBlock}>
          <header className={styles.sectionHeader} data-reveal>
            <p>Referencias externas</p>
            <h2>Fuentes reales para orientar tendencias y marcos de implementación</h2>
          </header>

          <div className={styles.referenceGrid}>
            {references.map((item) => (
              <a key={item.name} href={item.href} target="_blank" rel="noopener noreferrer" className={styles.referenceCard} data-reveal>
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

        <section className={styles.finalCta} data-reveal>
          <div>
            <p>Implementación institucional</p>
            <h2>Convierte tu estrategia pedagógica en una operación medible y escalable.</h2>
            <span>Esta vista de laboratorio utiliza información demostrativa para proteger datos reales.</span>
          </div>
          <div className={styles.finalActions}>
            <Link href="/register" className={styles.finalPrimary}>Solicitar implementación</Link>
            <Link href="/login" className={styles.finalSecondary}>Ingresar</Link>
          </div>
        </section>
      </main>

      {isAdmin && (
        <>
          <button
            type="button"
            className={styles.adminEditFab}
            onClick={() => setEditorOpen((prev) => !prev)}
            aria-label="Editar contenido del home"
          >
            <Pencil size={16} />
            <span>Editar home</span>
          </button>

          <aside className={`${styles.adminEditor} ${editorOpen ? styles.adminEditorOpen : ''}`}>
            <header className={styles.adminEditorHeader}>
              <h3>Edición rápida del home</h3>
              <button type="button" onClick={() => setEditorOpen(false)}>Cerrar</button>
            </header>

            {editorMessage && (
              <p className={editorMessage.type === 'success' ? styles.editorOk : styles.editorError}>
                {editorMessage.type === 'success' ? <Check size={14} /> : <X size={14} />}
                <span>{editorMessage.text}</span>
              </p>
            )}

            <div className={styles.adminEditorFields}>
              <label>
                <span>Eyebrow</span>
                <input
                  value={content.heroEyebrow}
                  onChange={(event) => updateContentField('heroEyebrow', event.target.value)}
                />
              </label>
              <label>
                <span>Título (inicio)</span>
                <input
                  value={content.heroTitleStart}
                  onChange={(event) => updateContentField('heroTitleStart', event.target.value)}
                />
              </label>
              <label>
                <span>Título resaltado</span>
                <input
                  value={content.heroTitleHighlight}
                  onChange={(event) => updateContentField('heroTitleHighlight', event.target.value)}
                />
              </label>
              <label>
                <span>Título (cierre)</span>
                <input
                  value={content.heroTitleEnd}
                  onChange={(event) => updateContentField('heroTitleEnd', event.target.value)}
                />
              </label>
              <label>
                <span>Descripción principal</span>
                <textarea
                  rows={3}
                  value={content.heroDescription}
                  onChange={(event) => updateContentField('heroDescription', event.target.value)}
                />
              </label>
              <label>
                <span>CTA principal</span>
                <input
                  value={content.primaryCtaLabel}
                  onChange={(event) => updateContentField('primaryCtaLabel', event.target.value)}
                />
              </label>
              <label>
                <span>CTA secundario</span>
                <input
                  value={content.secondaryCtaLabel}
                  onChange={(event) => updateContentField('secondaryCtaLabel', event.target.value)}
                />
              </label>
              <label>
                <span>URL imagen principal</span>
                <input
                  value={content.heroImageMainUrl}
                  onChange={(event) => updateContentField('heroImageMainUrl', event.target.value)}
                  placeholder="https://..."
                />
              </label>
              <label>
                <span>URL imagen secundaria</span>
                <input
                  value={content.heroImageSecondaryUrl}
                  onChange={(event) => updateContentField('heroImageSecondaryUrl', event.target.value)}
                  placeholder="https://..."
                />
              </label>
            </div>

            <button
              type="button"
              className={styles.adminEditorSave}
              onClick={saveEditableContent}
              disabled={editorSaving}
            >
              {editorSaving ? <Loader2 size={16} className={styles.editorSpinner} /> : <Check size={16} />}
              <span>{editorSaving ? 'Guardando...' : 'Guardar cambios'}</span>
            </button>
          </aside>
        </>
      )}

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
                placeholder="Buscar por intención: evaluación, mentorías, habilidades..."
              />
            </div>

            <div className={styles.commandList}>
              {filteredActions.length === 0 ? (
                <p className={styles.commandEmpty}>No se encontraron resultados para esa consulta.</p>
              ) : (
                filteredActions.map((action) => (
                  <a key={action.title} href={action.href} className={styles.commandItem} onClick={() => setCommandOpen(false)}>
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
