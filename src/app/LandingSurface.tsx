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
  X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import styles from './landing.module.css';
import { LandingAudience } from './LandingAudience';
import {
  DEFAULT_HOME_LAB_CONTENT,
  type HomeLabContent,
  sanitizeHexColor,
  sanitizeHomeLabContent,
} from '@/lib/home-lab-content';

interface LandingSurfaceProps {
  institutionName: string;
  logoUrl: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  isAdmin?: boolean;
  editableContent: HomeLabContent;
}

type CommandAction = {
  title: string;
  description: string;
  href: string;
  keywords: string[];
};

const semanticActions: CommandAction[] = [
  {
    title: 'Ver categorías',
    description: 'Explorar categorías estratégicas de aprendizaje.',
    href: '#categorias',
    keywords: ['categorías', 'rutas', 'habilidades', 'industria'],
  },
  {
    title: 'Ver programas',
    description: 'Revisar catálogo de programas demostrativos.',
    href: '#programas',
    keywords: ['programas', 'cursos', 'tarjetas', 'catálogo'],
  },
  {
    title: 'Ver diferenciales',
    description: 'Conocer la propuesta pedagógica y tecnológica.',
    href: '#diferenciales',
    keywords: ['diferenciales', 'pedagógico', 'tecnológico'],
  },
  {
    title: 'Comparar perfiles',
    description: 'Ver experiencia por estudiantes, docentes y administración.',
    href: '#perfiles',
    keywords: ['perfiles', 'estudiantes', 'docentes', 'administradores'],
  },
  {
    title: 'Consultar referencias',
    description: 'Abrir fuentes externas para lineamientos y tendencias.',
    href: '#referencias',
    keywords: ['unesco', 'oecd', 'wef', 'iste', 'referencias'],
  },
  {
    title: 'Ingresar',
    description: 'Acceder al entorno institucional.',
    href: '/login',
    keywords: ['login', 'ingresar', 'acceso'],
  },
  {
    title: 'Crear cuenta',
    description: 'Iniciar proceso de implementación institucional.',
    href: '/register',
    keywords: ['registro', 'cuenta', 'implementación'],
  },
];

const categoryIconMap: Record<string, LucideIcon> = {
  innovacion: Sparkles,
  tecnologia: Layers3,
  liderazgo: ShieldCheck,
  analitica: LibraryBig,
  habilidades: GraduationCap,
  mentorias: CalendarClock,
};

const benefitIcons: LucideIcon[] = [Layers3, Users, ShieldCheck, Sparkles, GraduationCap];

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function hexToRgbComma(hex: string, fallback: string) {
  const clean = sanitizeHexColor(hex, '');
  if (!clean) return fallback;
  const normalized = clean.replace('#', '');
  if (normalized.length !== 6) return fallback;

  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);

  if ([r, g, b].some((item) => Number.isNaN(item))) return fallback;
  return `${r}, ${g}, ${b}`;
}

export function LandingSurface({
  institutionName,
  logoUrl,
  primaryColor,
  secondaryColor,
  accentColor,
  isAdmin = false,
  editableContent,
}: LandingSurfaceProps) {
  const shellRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const lastScrollY = useRef(0);

  const [navCompact, setNavCompact] = useState(false);
  const [navHidden, setNavHidden] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  const [editEnabled, setEditEnabled] = useState(false);
  const [editorSaving, setEditorSaving] = useState(false);
  const [editorMessage, setEditorMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [themePrimaryColor, setThemePrimaryColor] = useState(primaryColor || '#1AB69D');
  const [themeSecondaryColor, setThemeSecondaryColor] = useState(secondaryColor || '#475569');
  const [themeAccentColor, setThemeAccentColor] = useState(accentColor || '#EE4A62');

  const [content, setContent] = useState<HomeLabContent>(sanitizeHomeLabContent(editableContent));
  const [rawJson, setRawJson] = useState('');

  const [metricValues, setMetricValues] = useState<number[]>(() => content.metrics.map(() => 0));

  useEffect(() => {
    setContent(sanitizeHomeLabContent(editableContent));
  }, [editableContent]);

  useEffect(() => {
    setThemePrimaryColor(primaryColor || '#1AB69D');
    setThemeSecondaryColor(secondaryColor || '#475569');
    setThemeAccentColor(accentColor || '#EE4A62');
  }, [primaryColor, secondaryColor, accentColor]);

  useEffect(() => {
    if (activeCategory !== 'all' && !content.categories.some((item) => item.id === activeCategory)) {
      setActiveCategory('all');
    }
  }, [activeCategory, content.categories]);

  const filteredPrograms = useMemo(() => {
    if (activeCategory === 'all') return content.programs;
    return content.programs.filter((program) => program.categoryId === activeCategory);
  }, [activeCategory, content.programs]);

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
    const duration = 1200;

    const animate = (timestamp: number) => {
      const progress = Math.min((timestamp - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setMetricValues(content.metrics.map((item) => Math.floor(item.value * eased)));

      if (progress < 1) frameId = requestAnimationFrame(animate);
    };

    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, [content.metrics]);

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
      { threshold: 0.15 },
    );

    revealItems.forEach((item) => observer.observe(item));
    return () => observer.disconnect();
  }, []);

  const updateContent = (updater: (prev: HomeLabContent) => HomeLabContent) => {
    setEditorMessage(null);
    setContent((prev) => sanitizeHomeLabContent(updater(prev)));
  };

  const updateNavField = (field: keyof HomeLabContent['nav'], value: string) => {
    updateContent((prev) => ({ ...prev, nav: { ...prev.nav, [field]: value } }));
  };

  const updateHeroField = (field: keyof HomeLabContent['hero'], value: string) => {
    updateContent((prev) => ({ ...prev, hero: { ...prev.hero, [field]: value } }));
  };

  const updateSectionsField = (field: keyof HomeLabContent['sections'], value: string) => {
    updateContent((prev) => ({ ...prev, sections: { ...prev.sections, [field]: value } }));
  };

  const updateDifferentialsField = (field: keyof HomeLabContent['differentials'], value: string | string[]) => {
    updateContent((prev) => ({ ...prev, differentials: { ...prev.differentials, [field]: value } }));
  };

  const updateFinalCtaField = (field: keyof HomeLabContent['finalCta'], value: string) => {
    updateContent((prev) => ({ ...prev, finalCta: { ...prev.finalCta, [field]: value } }));
  };

  const applyJsonContent = () => {
    try {
      const parsed = JSON.parse(rawJson) as unknown;
      const normalized = sanitizeHomeLabContent(parsed);
      setContent(normalized);
      setEditorMessage({ type: 'success', text: 'JSON aplicado correctamente.' });
    } catch {
      setEditorMessage({ type: 'error', text: 'El JSON no es válido.' });
    }
  };

  const toggleEdition = () => {
    setEditEnabled((prev) => {
      const next = !prev;
      if (next) {
        setRawJson(JSON.stringify(content, null, 2));
      }
      return next;
    });
    setEditorMessage(null);
  };

  const saveEditableContent = async () => {
    try {
      setEditorSaving(true);
      setEditorMessage(null);

      const cleanPrimary = sanitizeHexColor(themePrimaryColor, '#1AB69D');
      const cleanSecondary = sanitizeHexColor(themeSecondaryColor, '#475569');
      const cleanAccent = sanitizeHexColor(themeAccentColor, '#EE4A62');

      const response = await fetch('/api/home-lab/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          homeLabContent: content,
          primaryColor: cleanPrimary,
          secondaryColor: cleanSecondary,
          accentColor: cleanAccent,
        }),
      });

      const result = (await response.json()) as { success?: boolean; message?: string };
      if (!response.ok || !result.success) {
        throw new Error(result.message || 'No fue posible guardar los cambios.');
      }

      setThemePrimaryColor(cleanPrimary);
      setThemeSecondaryColor(cleanSecondary);
      setThemeAccentColor(cleanAccent);
      setEditorMessage({ type: 'success', text: 'Cambios guardados correctamente.' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al guardar.';
      setEditorMessage({ type: 'error', text: message });
    } finally {
      setEditorSaving(false);
    }
  };

  const cssVars = {
    '--primary-rgb': hexToRgbComma(themePrimaryColor, '26, 182, 157'),
    '--secondary-rgb': hexToRgbComma(themeSecondaryColor, '71, 85, 105'),
    '--accent-rgb': hexToRgbComma(themeAccentColor, '238, 74, 98'),
    '--primary': hexToRgbComma(themePrimaryColor, '26, 182, 157').replace(/,\s*/g, ' '),
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
            <a href="#categorias">{content.nav.categoriesLabel}</a>
            <a href="#programas">{content.nav.programsLabel}</a>
            <a href="#diferenciales">{content.nav.differentialsLabel}</a>
            <a href="#referencias">{content.nav.referencesLabel}</a>
          </nav>

          <div className={styles.navActions}>
            <button className={styles.commandTrigger} onClick={() => setCommandOpen(true)}>
              <Search size={15} />
              <span>{content.nav.searchLabel}</span>
              <kbd>⌘K</kbd>
            </button>
            <Link href="/login" className={styles.navTextCta}>{content.nav.loginLabel}</Link>
            <Link href="/register" className={styles.navPrimaryCta}>{content.nav.registerLabel}</Link>
          </div>
        </div>
      </header>

      <main className={styles.landingMain}>
        <section className={`${styles.heroSection} ${styles.bandDark}`}>
          <div className={styles.sectionInner}>
            <div className={styles.heroGrid}>
              <article className={styles.heroCopy} data-reveal>
                <p className={styles.heroEyebrow}>{content.hero.eyebrow}</p>
                <h1>
                  {content.hero.titleStart}
                  <span> {content.hero.titleHighlight}</span>
                  {' '}{content.hero.titleEnd}
                </h1>
                <p>{content.hero.description}</p>

                <div className={styles.heroActions}>
                  <Link href="/register" className={styles.heroPrimary}>{content.hero.primaryCtaLabel}</Link>
                  <a href="#programas" className={styles.heroSecondary}>{content.hero.secondaryCtaLabel}</a>
                </div>

                <button className={styles.heroSearch} onClick={() => setCommandOpen(true)}>
                  <Search size={16} />
                  <span>{content.hero.searchPlaceholder}</span>
                  <kbd>⌘K</kbd>
                </button>

                <div className={styles.heroMetricRow}>
                  {content.metrics.map((item, index) => (
                    <article key={`${item.label}-${index}`} className={styles.heroMetricCard}>
                      <strong>{new Intl.NumberFormat('es-CO').format(metricValues[index] || 0)}{item.suffix || ''}</strong>
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
                  <img src={content.hero.imageMainUrl} alt="Estudiante desarrollando actividad de aprendizaje" className={styles.heroImageMain} />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={content.hero.imageSecondaryUrl} alt="Estudiante en sesión de trabajo colaborativo" className={styles.heroImageSecondary} />
                </div>

                <article className={styles.heroBadge}>
                  <div className={styles.heroBadgeIcon}>
                    <CheckCircle2 size={16} />
                  </div>
                  <div>
                    <strong>{content.hero.badgeTitle}</strong>
                    <span>{content.hero.badgeSubtitle}</span>
                  </div>
                </article>
              </aside>
            </div>
          </div>
        </section>

        <section className={`${styles.benefitsBar} ${styles.bandNavy}`} data-reveal>
          <div className={styles.sectionInner}>
            <div className={styles.benefitsGrid}>
              {content.benefits.map((item, index) => {
                const Icon = benefitIcons[index] || Sparkles;
                return (
                  <article key={`${item.title}-${index}`} className={styles.benefitItem}>
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
          </div>
        </section>

        <section id="categorias" className={`${styles.sectionBlock} ${styles.bandLight}`}>
          <div className={styles.sectionInner}>
            <header className={styles.sectionHeader} data-reveal>
              <p>{content.sections.categoriesEyebrow}</p>
              <h2>{content.sections.categoriesTitle}</h2>
            </header>

            <div className={styles.categoryGrid}>
              {content.categories.map((item) => {
                const Icon = categoryIconMap[item.id] || Layers3;
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
          </div>
        </section>

        <section id="programas" className={`${styles.sectionBlock} ${styles.bandWhite}`}>
          <div className={styles.sectionInner}>
            <header className={styles.sectionHeader} data-reveal>
              <p>{content.sections.programsEyebrow}</p>
              <h2>{content.sections.programsTitle}</h2>
            </header>

            <div className={styles.filterBar} data-reveal>
              <button
                className={`${styles.filterChip} ${activeCategory === 'all' ? styles.filterChipActive : ''}`}
                onClick={() => setActiveCategory('all')}
              >
                Todas
              </button>
              {content.categories.map((item) => (
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
              {filteredPrograms.map((program, index) => (
                <article key={`${program.title}-${index}`} className={styles.courseCard} data-reveal>
                  <div className={styles.courseMedia}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={program.imageUrl} alt={program.title} loading="lazy" />
                  </div>

                  <div className={styles.courseBody}>
                    <div className={styles.courseTagRow}>
                      <span className={styles.courseTag}>{content.categories.find((item) => item.id === program.categoryId)?.title || 'Ruta'}</span>
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
          </div>
        </section>

        <section id="diferenciales" className={`${styles.sectionBlock} ${styles.bandDark}`}>
          <div className={styles.sectionInner}>
            <div className={styles.premiumSplit} data-reveal>
              <article className={styles.premiumMedia}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={content.differentials.imageUrl}
                  alt="Equipo académico planificando aprendizaje"
                  className={styles.premiumMediaImage}
                />
              </article>

              <article className={styles.premiumCopy}>
                <p>{content.sections.differentialsEyebrow}</p>
                <h2>{content.sections.differentialsTitle}</h2>
                <ul>
                  {content.differentials.bullets.map((bullet, index) => (
                    <li key={`${bullet}-${index}`}><CheckCircle2 size={16} />{bullet}</li>
                  ))}
                </ul>
              </article>
            </div>
          </div>
        </section>

        <section className={`${styles.sectionBlock} ${styles.bandSlate}`}>
          <div className={styles.sectionInner}>
            <LandingAudience />
          </div>
        </section>

        <section id="referencias" className={`${styles.sectionBlock} ${styles.bandLight}`}>
          <div className={styles.sectionInner}>
            <header className={styles.sectionHeader} data-reveal>
              <p>{content.sections.referencesEyebrow}</p>
              <h2>{content.sections.referencesTitle}</h2>
            </header>

            <div className={styles.referenceGrid}>
              {content.references.map((item, index) => (
                <a key={`${item.name}-${index}`} href={item.href} target="_blank" rel="noopener noreferrer" className={styles.referenceCard} data-reveal>
                  <div className={styles.referenceInfo}>
                    <span className={styles.referenceMark} style={{ backgroundImage: `url(${item.visualUrl})` }} />
                    <h3>{item.name}</h3>
                    <p>{item.detail}</p>
                  </div>
                  <ArrowUpRight size={16} />
                </a>
              ))}
            </div>
          </div>
        </section>

        <section className={`${styles.sectionBlock} ${styles.finalBand}`}>
          <div className={styles.sectionInner}>
            <div className={styles.finalCta} data-reveal>
              <div>
                <p>{content.finalCta.eyebrow}</p>
                <h2>{content.finalCta.title}</h2>
                <span>{content.finalCta.description}</span>
              </div>
              <div className={styles.finalActions}>
                <Link href="/register" className={styles.finalPrimary}>{content.finalCta.primaryLabel}</Link>
                <Link href="/login" className={styles.finalSecondary}>{content.finalCta.secondaryLabel}</Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {isAdmin && (
        <>
          <button
            type="button"
            className={styles.adminEditFab}
            onClick={toggleEdition}
            aria-label={editEnabled ? 'Desactivar edición del home' : 'Activar edición del home'}
          >
            <Pencil size={16} />
            <span>{editEnabled ? 'Desactivar edición' : 'Activar edición'}</span>
          </button>

          <aside className={`${styles.adminEditor} ${editEnabled ? styles.adminEditorOpen : ''}`}>
            <header className={styles.adminEditorHeader}>
              <h3>Modo edición activado</h3>
              <button type="button" onClick={() => setEditEnabled(false)}>Cerrar</button>
            </header>

            {editorMessage && (
              <p className={editorMessage.type === 'success' ? styles.editorOk : styles.editorError}>
                {editorMessage.type === 'success' ? <Check size={14} /> : <X size={14} />}
                <span>{editorMessage.text}</span>
              </p>
            )}

            <div className={styles.adminEditorFields}>
              <label>
                <span>Color primario</span>
                <input type="color" value={sanitizeHexColor(themePrimaryColor, '#1AB69D')} onChange={(event) => setThemePrimaryColor(event.target.value)} />
              </label>
              <label>
                <span>Color secundario</span>
                <input type="color" value={sanitizeHexColor(themeSecondaryColor, '#475569')} onChange={(event) => setThemeSecondaryColor(event.target.value)} />
              </label>
              <label>
                <span>Color acento</span>
                <input type="color" value={sanitizeHexColor(themeAccentColor, '#EE4A62')} onChange={(event) => setThemeAccentColor(event.target.value)} />
              </label>

              <label>
                <span>Menú: Categorías</span>
                <input value={content.nav.categoriesLabel} onChange={(event) => updateNavField('categoriesLabel', event.target.value)} />
              </label>
              <label>
                <span>Menú: Programas</span>
                <input value={content.nav.programsLabel} onChange={(event) => updateNavField('programsLabel', event.target.value)} />
              </label>
              <label>
                <span>Menú: Diferenciales</span>
                <input value={content.nav.differentialsLabel} onChange={(event) => updateNavField('differentialsLabel', event.target.value)} />
              </label>
              <label>
                <span>Menú: Referencias</span>
                <input value={content.nav.referencesLabel} onChange={(event) => updateNavField('referencesLabel', event.target.value)} />
              </label>

              <label>
                <span>Hero - Eyebrow</span>
                <input value={content.hero.eyebrow} onChange={(event) => updateHeroField('eyebrow', event.target.value)} />
              </label>
              <label>
                <span>Hero - Título inicio</span>
                <input value={content.hero.titleStart} onChange={(event) => updateHeroField('titleStart', event.target.value)} />
              </label>
              <label>
                <span>Hero - Título resaltado</span>
                <input value={content.hero.titleHighlight} onChange={(event) => updateHeroField('titleHighlight', event.target.value)} />
              </label>
              <label>
                <span>Hero - Título final</span>
                <input value={content.hero.titleEnd} onChange={(event) => updateHeroField('titleEnd', event.target.value)} />
              </label>
              <label>
                <span>Hero - Descripción</span>
                <textarea rows={3} value={content.hero.description} onChange={(event) => updateHeroField('description', event.target.value)} />
              </label>
              <label>
                <span>Hero - CTA principal</span>
                <input value={content.hero.primaryCtaLabel} onChange={(event) => updateHeroField('primaryCtaLabel', event.target.value)} />
              </label>
              <label>
                <span>Hero - CTA secundario</span>
                <input value={content.hero.secondaryCtaLabel} onChange={(event) => updateHeroField('secondaryCtaLabel', event.target.value)} />
              </label>
              <label>
                <span>Hero - Buscador placeholder</span>
                <input value={content.hero.searchPlaceholder} onChange={(event) => updateHeroField('searchPlaceholder', event.target.value)} />
              </label>
              <label>
                <span>Hero - Badge título</span>
                <input value={content.hero.badgeTitle} onChange={(event) => updateHeroField('badgeTitle', event.target.value)} />
              </label>
              <label>
                <span>Hero - Badge descripción</span>
                <input value={content.hero.badgeSubtitle} onChange={(event) => updateHeroField('badgeSubtitle', event.target.value)} />
              </label>
              <label>
                <span>Hero - URL imagen principal</span>
                <input value={content.hero.imageMainUrl} onChange={(event) => updateHeroField('imageMainUrl', event.target.value)} placeholder="https://..." />
              </label>
              <label>
                <span>Hero - URL imagen secundaria</span>
                <input value={content.hero.imageSecondaryUrl} onChange={(event) => updateHeroField('imageSecondaryUrl', event.target.value)} placeholder="https://..." />
              </label>

              <label>
                <span>Categorías - Eyebrow</span>
                <input value={content.sections.categoriesEyebrow} onChange={(event) => updateSectionsField('categoriesEyebrow', event.target.value)} />
              </label>
              <label>
                <span>Categorías - Título</span>
                <input value={content.sections.categoriesTitle} onChange={(event) => updateSectionsField('categoriesTitle', event.target.value)} />
              </label>
              <label>
                <span>Programas - Eyebrow</span>
                <input value={content.sections.programsEyebrow} onChange={(event) => updateSectionsField('programsEyebrow', event.target.value)} />
              </label>
              <label>
                <span>Programas - Título</span>
                <input value={content.sections.programsTitle} onChange={(event) => updateSectionsField('programsTitle', event.target.value)} />
              </label>
              <label>
                <span>Diferenciales - Eyebrow</span>
                <input value={content.sections.differentialsEyebrow} onChange={(event) => updateSectionsField('differentialsEyebrow', event.target.value)} />
              </label>
              <label>
                <span>Diferenciales - Título</span>
                <input value={content.sections.differentialsTitle} onChange={(event) => updateSectionsField('differentialsTitle', event.target.value)} />
              </label>
              <label>
                <span>Diferenciales - URL imagen</span>
                <input value={content.differentials.imageUrl} onChange={(event) => updateDifferentialsField('imageUrl', event.target.value)} placeholder="https://..." />
              </label>
              <label>
                <span>Diferenciales - bullets (una línea por bullet)</span>
                <textarea
                  rows={5}
                  value={content.differentials.bullets.join('\n')}
                  onChange={(event) => updateDifferentialsField('bullets', event.target.value.split('\n').map((line) => line.trim()).filter(Boolean))}
                />
              </label>

              <label>
                <span>Referencias - Eyebrow</span>
                <input value={content.sections.referencesEyebrow} onChange={(event) => updateSectionsField('referencesEyebrow', event.target.value)} />
              </label>
              <label>
                <span>Referencias - Título</span>
                <input value={content.sections.referencesTitle} onChange={(event) => updateSectionsField('referencesTitle', event.target.value)} />
              </label>

              <label>
                <span>CTA final - Eyebrow</span>
                <input value={content.finalCta.eyebrow} onChange={(event) => updateFinalCtaField('eyebrow', event.target.value)} />
              </label>
              <label>
                <span>CTA final - Título</span>
                <textarea rows={3} value={content.finalCta.title} onChange={(event) => updateFinalCtaField('title', event.target.value)} />
              </label>
              <label>
                <span>CTA final - Descripción</span>
                <textarea rows={3} value={content.finalCta.description} onChange={(event) => updateFinalCtaField('description', event.target.value)} />
              </label>
              <label>
                <span>CTA final - Botón principal</span>
                <input value={content.finalCta.primaryLabel} onChange={(event) => updateFinalCtaField('primaryLabel', event.target.value)} />
              </label>
              <label>
                <span>CTA final - Botón secundario</span>
                <input value={content.finalCta.secondaryLabel} onChange={(event) => updateFinalCtaField('secondaryLabel', event.target.value)} />
              </label>

              <label>
                <span>Contenido completo (JSON avanzado)</span>
                <textarea
                  rows={10}
                  value={rawJson}
                  onChange={(event) => setRawJson(event.target.value)}
                  placeholder={JSON.stringify(DEFAULT_HOME_LAB_CONTENT, null, 2)}
                />
              </label>
              <button type="button" className={styles.adminEditorSave} onClick={applyJsonContent}>
                <Check size={16} />
                <span>Aplicar JSON</span>
              </button>
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
