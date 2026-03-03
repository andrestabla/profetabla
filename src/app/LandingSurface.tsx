'use client';

import type { CSSProperties } from 'react';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { ComponentType } from 'react';
import {
  Search,
  Sparkles,
  ArrowUpRight,
  Command,
  ChevronRight,
  Users,
  LayoutDashboard,
  GraduationCap,
  BookOpen,
  Clock,
  FileCheck,
  BarChart3
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
  tone: 'teal' | 'coral' | 'amber' | 'indigo';
  size: 'small' | 'wide' | 'tall';
};

const HERO_VIDEO = 'https://videos.pexels.com/video-files/3195394/3195394-hd_1920_1080_25fps.mp4';

const bentoCards: BentoCard[] = [
  {
    title: 'Diseño Curricular Pro',
    description: 'Crea proyectos y retos con enfoque pedagógico de alta calidad desde el inicio.',
    eyebrow: 'Diseño',
    icon: GraduationCap,
    tone: 'teal',
    size: 'wide'
  },
  {
    title: 'Gestión de Hitos',
    description: 'Monitorea progreso y fechas clave por cada equipo en tiempo real.',
    eyebrow: 'Operación',
    icon: Clock,
    tone: 'amber',
    size: 'small'
  },
  {
    title: 'Recursos Conectados',
    description: 'Agenda mentorías y enlaza cada sesión con evidencias de aprendizaje reales.',
    eyebrow: 'Recursos',
    icon: BookOpen,
    tone: 'indigo',
    size: 'small'
  },
  {
    title: 'Evaluación de Calidad',
    description: 'Integra rúbricas y retroalimentación con trazabilidad institucional completa.',
    eyebrow: 'Calidad',
    icon: FileCheck,
    tone: 'coral',
    size: 'tall'
  },
  {
    title: 'Habilidades del Siglo XXI',
    description: 'Conecta cada experiencia con competencias globales para el éxito profesional.',
    eyebrow: 'Futuro',
    icon: Sparkles,
    tone: 'teal',
    size: 'wide'
  },
  {
    title: 'Analítica en Vivo',
    description: 'Observabilidad completa sobre el desempeño de cohorte y docentes.',
    eyebrow: 'Datos',
    icon: BarChart3,
    tone: 'amber',
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
  if (size === 'wide') return styles.cardWide;
  if (size === 'tall') return styles.cardTall;
  return '';
}

function cardToneClass(tone: BentoCard['tone']) {
  if (tone === 'teal') return styles.toneTeal;
  if (tone === 'coral') return styles.toneCoral;
  if (tone === 'amber') return styles.toneAmber;
  if (tone === 'indigo') return styles.toneIndigo;
  return styles.toneTeal;
}

const HERO_IMAGE = 'file:///Users/andrestabla/.gemini/antigravity/brain/629cc9bf-f5cd-4a00-aa98-2384f9c88fa5/edublink_hero_mockup_1772503568045.png';

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
      setNavCompact(currentScroll > 50);

      if (currentScroll > lastScroll + 10 && currentScroll > 200) {
        setNavHidden(true);
      } else if (currentScroll < lastScroll - 10) {
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

    const revealElements = Array.from(root.querySelectorAll<HTMLElement>('[data-reveal]'));
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.15 }
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
            <a href="#funcionalidades">Módulos</a>
            <a href="#diferenciales">Ventajas</a>
            <a href="#referencias">Recursos</a>
          </nav>

          <div className={styles.navActions}>
            <button type="button" className={styles.commandTrigger} onClick={() => setCommandOpen(true)}>
              <Search className="w-4 h-4" />
              <span>Buscar...</span>
              <kbd>⌘K</kbd>
            </button>
            <Link href="/register" className={styles.navPrimaryCta}>Empezar ahora</Link>
          </div>
        </div>
      </header>

      <section className={styles.hero} id="inicio">
        <div className={styles.heroContent} data-reveal>
          <div className={styles.heroEyebrow}>
            <Sparkles className="w-4 h-4" />
            <span>Arquitectura Pedagógica de Vanguardia</span>
          </div>
          <h1>
            Diseña el futuro del <span>aprendizaje estruturado</span>
          </h1>
          <p>
            La plataforma definitiva para instituciones que buscan integrar planeación ABP,
            trazabilidad académica y gobernanza en una experiencia profesional.
          </p>

          <div className={styles.heroCtaRow}>
            <Link href="/register" className={styles.heroPrimaryCta}>Empezar implementación</Link>
            <a href="#funcionalidades" className={styles.heroSecondaryCta}>Ver módulos</a>
          </div>
        </div>

        <div className={styles.heroImageContainer} data-reveal>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={HERO_IMAGE} alt="Estudiante Profe Tabla" className={styles.heroMainImage} />

          <div className={`${styles.floatingBadge} top-10 -left-10`}>
            <div className={styles.badgeIcon}>
              <Users className="w-6 h-6" />
            </div>
            <div className={styles.badgeText}>
              <h4>+2k</h4>
              <p>Usuarios activos</p>
            </div>
          </div>

          <div className={`${styles.floatingBadge} bottom-20 -right-5`}>
            <div className={styles.badgeIcon} style={{ background: 'rgba(26, 182, 157, 0.1)', color: '#1AB69D' }}>
              <LayoutDashboard className="w-6 h-6" />
            </div>
            <div className={styles.badgeText}>
              <h4>Pilas ABP</h4>
              <p>Metodología Activa</p>
            </div>
          </div>
        </div>
      </section>

      <section id="funcionalidades" className={styles.sectionBlock}>
        <header className={styles.sectionHeader} data-reveal>
          <p>Potencial Tecnológico</p>
          <h2>Herramientas clave para la transformación digital educativa</h2>
        </header>

        <div className={styles.bentoGrid}>
          {bentoCards.map((card) => {
            const Icon = card.icon;
            return (
              <article
                key={card.title}
                data-reveal
                className={[
                  styles.bentoCard,
                  cardSizeClass(card.size),
                  cardToneClass(card.tone)
                ].join(' ')}
              >
                <Icon className={styles.bentoIcon} />
                <h3>{card.title}</h3>
                <p>{card.description}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section id="diferenciales" className={styles.sectionBlock}>
        <header className={styles.sectionHeader} data-reveal>
          <p>Ventajas competitivas</p>
          <h2>Por qué las instituciones de alto desempeño escalan con nosotros</h2>
        </header>

        <div className={styles.dualColumn}>
          <article className={styles.glassCard} data-reveal>
            <h3>Metodología Activa Ejecutable</h3>
            <p>
              A diferencia de las plataformas tradicionales, Profe Tabla convierte la planeación
              pedagógica en un flujo operativo. Habilitamos la creación de proyectos bajo marcos
              de ABP y retos reales, conectando objetivos educativos con el trabajo diario del estudiante.
            </p>
          </article>

          <article className={styles.glassCard} data-reveal>
            <h3>Soberanía de Datos Pedagógicos</h3>
            <p>
              Recupera el control sobre lo que sucede en el aula. Nuestra arquitectura permite
              una trazabilidad granular del progreso académico, permitiendo intervenciones
              tempranas basadas en analítica real en lugar de reportes manuales subjetivos.
            </p>
          </article>
        </div>
      </section>

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

      <section id="referencias" className={styles.sectionBlock}>
        <header className={styles.sectionHeader} data-reveal>
          <p>Base Científica</p>
          <h2>Respaldado por marcos internacionales</h2>
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
        <article>
          <h2>Convierte tu visión pedagógica en una operación escalable.</h2>
          <Link href="/register" className={styles.finalPrimary}>Comenzar ahora</Link>
        </article>
      </section>

      {commandOpen && (
        <div className={styles.commandOverlay} onClick={() => setCommandOpen(false)}>
          <div className={styles.commandPanel} onClick={(event) => event.stopPropagation()}>
            <div className={styles.commandInputWrap}>
              <Search className="w-4 h-4 opacity-50" />
              <input
                ref={inputRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="¿Qué necesitas buscar?"
              />
            </div>

            <div className={styles.commandResults}>
              {filteredActions.length === 0 ? (
                <p className={styles.commandEmpty}>No hay coincidencias.</p>
              ) : (
                filteredActions.map((action) => (
                  <a key={action.title} href={action.href} onClick={() => setCommandOpen(false)} className={styles.commandItem}>
                    <div>
                      <h4>{action.title}</h4>
                      <p>{action.description}</p>
                    </div>
                    <Command className="w-4 h-4 opacity-40" />
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
