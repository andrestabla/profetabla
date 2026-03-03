export type HomeLabMetric = {
  label: string;
  value: number;
  suffix?: string;
};

export type HomeLabBenefit = {
  title: string;
  description: string;
};

export type HomeLabCategory = {
  id: string;
  title: string;
  description: string;
  routes: number;
};

export type HomeLabProgram = {
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

export type HomeLabReference = {
  name: string;
  detail: string;
  href: string;
  visualUrl: string;
};

export type HomeLabContent = {
  nav: {
    categoriesLabel: string;
    programsLabel: string;
    differentialsLabel: string;
    referencesLabel: string;
    searchLabel: string;
    loginLabel: string;
    registerLabel: string;
  };
  hero: {
    eyebrow: string;
    titleStart: string;
    titleHighlight: string;
    titleEnd: string;
    description: string;
    primaryCtaLabel: string;
    secondaryCtaLabel: string;
    searchPlaceholder: string;
    imageMainUrl: string;
    imageSecondaryUrl: string;
    badgeTitle: string;
    badgeSubtitle: string;
  };
  metrics: HomeLabMetric[];
  benefits: HomeLabBenefit[];
  sections: {
    categoriesEyebrow: string;
    categoriesTitle: string;
    programsEyebrow: string;
    programsTitle: string;
    differentialsEyebrow: string;
    differentialsTitle: string;
    referencesEyebrow: string;
    referencesTitle: string;
  };
  categories: HomeLabCategory[];
  programs: HomeLabProgram[];
  differentials: {
    imageUrl: string;
    bullets: string[];
  };
  references: HomeLabReference[];
  finalCta: {
    eyebrow: string;
    title: string;
    description: string;
    primaryLabel: string;
    secondaryLabel: string;
  };
};

export const DEFAULT_HOME_LAB_CONTENT: HomeLabContent = {
  nav: {
    categoriesLabel: 'Categorías',
    programsLabel: 'Programas',
    differentialsLabel: 'Diferenciales',
    referencesLabel: 'Referencias',
    searchLabel: 'Buscar',
    loginLabel: 'Ingresar',
    registerLabel: 'Crear cuenta',
  },
  hero: {
    eyebrow: 'DESARROLLADA PARA INSTITUCIONES EDUCATIVAS',
    titleStart: 'Plataforma integral para',
    titleHighlight: 'aprendizaje por proyectos',
    titleEnd: 'con trazabilidad completa.',
    description: 'ProfeTabla conecta diseño pedagógico, entregas, mentorías, analítica y reconocimientos en una operación académica coherente, medible y escalable.',
    primaryCtaLabel: 'Explorar implementación',
    secondaryCtaLabel: 'Ver programas',
    searchPlaceholder: 'Busca por mentorías, evaluación, habilidades o rutas formativas...',
    imageMainUrl: 'https://images.pexels.com/photos/6238118/pexels-photo-6238118.jpeg?auto=compress&cs=tinysrgb&w=1280',
    imageSecondaryUrl: 'https://images.pexels.com/photos/5212345/pexels-photo-5212345.jpeg?auto=compress&cs=tinysrgb&w=960',
    badgeTitle: 'Implementación guiada',
    badgeSubtitle: 'Arquitectura pedagógica + operación digital',
  },
  metrics: [
    { label: 'Proyectos activos', value: 248, suffix: '+' },
    { label: 'Estudiantes en seguimiento', value: 5840, suffix: '+' },
    { label: 'Mentorías mensuales', value: 730, suffix: '+' },
  ],
  benefits: [
    {
      title: 'Operación pedagógica conectada',
      description: 'Planeación, tareas, mentorías y evaluación en un mismo flujo.',
    },
    {
      title: 'Seguimiento por estudiante y equipo',
      description: 'Visibilidad de avance para intervenir con precisión y a tiempo.',
    },
    {
      title: 'Reconocimientos verificables',
      description: 'Insignias y certificados vinculados a evidencias reales.',
    },
  ],
  sections: {
    categoriesEyebrow: 'Categorías destacadas',
    categoriesTitle: 'Rutas de formación por enfoque y necesidad institucional',
    programsEyebrow: 'Programas recomendados',
    programsTitle: 'Catálogo demostrativo con estética editorial y lectura rápida',
    differentialsEyebrow: 'Valor institucional',
    differentialsTitle: 'Una experiencia premium para gestión pedagógica y tecnológica',
    referencesEyebrow: 'Referencias externas',
    referencesTitle: 'Fuentes reales para orientar tendencias y marcos de implementación',
  },
  categories: [
    { id: 'innovacion', title: 'Innovación educativa', description: 'Metodologías activas y diseño didáctico aplicable.', routes: 26 },
    { id: 'tecnologia', title: 'Tecnología aplicada', description: 'Herramientas para resolver retos formativos reales.', routes: 34 },
    { id: 'liderazgo', title: 'Liderazgo académico', description: 'Gestión de equipos docentes y mejora institucional.', routes: 19 },
    { id: 'analitica', title: 'Analítica y evaluación', description: 'Lectura de evidencias para decisiones de calidad.', routes: 22 },
    { id: 'habilidades', title: 'Habilidades del siglo XXI', description: 'Competencias alineadas con tendencias por industria.', routes: 29 },
    { id: 'mentorias', title: 'Mentorías estratégicas', description: 'Acompañamiento estructurado por calendario y metas.', routes: 16 },
  ],
  programs: [
    {
      title: 'Diseño de proyectos ABP con evaluación por evidencias',
      categoryId: 'innovacion',
      level: 'Intermedio',
      duration: '10 semanas',
      students: 236,
      rating: 4.9,
      priceLabel: 'Demostrativo',
      author: 'Equipo pedagógico',
      imageUrl: 'https://images.pexels.com/photos/5427673/pexels-photo-5427673.jpeg?auto=compress&cs=tinysrgb&w=900',
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
      imageUrl: 'https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg?auto=compress&cs=tinysrgb&w=900',
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
      imageUrl: 'https://images.pexels.com/photos/8199678/pexels-photo-8199678.jpeg?auto=compress&cs=tinysrgb&w=900',
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
      imageUrl: 'https://images.pexels.com/photos/7947663/pexels-photo-7947663.jpeg?auto=compress&cs=tinysrgb&w=900',
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
      imageUrl: 'https://images.pexels.com/photos/5717411/pexels-photo-5717411.jpeg?auto=compress&cs=tinysrgb&w=900',
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
      imageUrl: 'https://images.pexels.com/photos/4145190/pexels-photo-4145190.jpeg?auto=compress&cs=tinysrgb&w=900',
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
      imageUrl: 'https://images.pexels.com/photos/4143794/pexels-photo-4143794.jpeg?auto=compress&cs=tinysrgb&w=900',
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
      imageUrl: 'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=900',
    },
  ],
  differentials: {
    imageUrl: 'https://images.pexels.com/photos/4145190/pexels-photo-4145190.jpeg?auto=compress&cs=tinysrgb&w=1200',
    bullets: [
      'Diseño pedagógico ejecutable con foco en resultados.',
      'Dashboard operativo para estudiantes, docentes y administración.',
      'Historial de actividad completo y gobernanza en tiempo real.',
      'Reconocimientos verificables vinculados a evidencias.',
    ],
  },
  references: [
    {
      name: 'UNESCO',
      detail: 'Futures of Education',
      href: 'https://www.unesco.org/en/futures-education',
      visualUrl: 'https://www.google.com/s2/favicons?sz=128&domain_url=unesco.org',
    },
    {
      name: 'OECD',
      detail: 'Education at a Glance',
      href: 'https://www.oecd.org/en/publications/education-at-a-glance_b858e7fe-en.html',
      visualUrl: 'https://www.google.com/s2/favicons?sz=128&domain_url=oecd.org',
    },
    {
      name: 'World Economic Forum',
      detail: 'Future of Jobs Report',
      href: 'https://www.weforum.org/reports/',
      visualUrl: 'https://www.google.com/s2/favicons?sz=128&domain_url=weforum.org',
    },
    {
      name: 'ISTE',
      detail: 'ISTE Standards',
      href: 'https://iste.org/standards',
      visualUrl: 'https://www.google.com/s2/favicons?sz=128&domain_url=iste.org',
    },
  ],
  finalCta: {
    eyebrow: 'Implementación institucional',
    title: 'Convierte tu estrategia pedagógica en una operación medible y escalable.',
    description: 'Esta vista de laboratorio utiliza información demostrativa para proteger datos reales.',
    primaryLabel: 'Solicitar implementación',
    secondaryLabel: 'Ingresar',
  },
};

const HEX_COLOR_PATTERN = /^#([0-9a-fA-F]{6})$/;

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

function asString(value: unknown, fallback: string, maxLength = 500) {
  if (typeof value !== 'string') return fallback;
  const trimmed = value.trim();
  if (!trimmed) return fallback;
  return trimmed.slice(0, maxLength);
}

function asNumber(value: unknown, fallback: number, min = 0, max = 100000) {
  const parsed = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, Math.round(parsed)));
}

function asDecimal(value: unknown, fallback: number, min = 0, max = 5) {
  const parsed = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, Number(parsed.toFixed(1))));
}

function asStringArray(value: unknown, fallback: string[], maxItems = fallback.length, maxLength = 240) {
  if (!Array.isArray(value) || value.length === 0) return fallback;
  return value.slice(0, maxItems).map((item, index) => asString(item, fallback[index] || '', maxLength));
}

function asCategoryId(value: unknown, fallback: string) {
  if (typeof value !== 'string') return fallback;
  const normalized = value.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
  return normalized || fallback;
}

export function sanitizeHexColor(value: unknown, fallback: string) {
  if (typeof value !== 'string') return fallback;
  const color = value.trim();
  if (!HEX_COLOR_PATTERN.test(color)) return fallback;
  return color.toUpperCase();
}

export function sanitizeHomeLabContent(input: unknown): HomeLabContent {
  const raw = asRecord(input);

  const navRaw = asRecord(raw.nav);
  const heroRaw = asRecord(raw.hero);
  const sectionsRaw = asRecord(raw.sections);
  const diffRaw = asRecord(raw.differentials);
  const finalRaw = asRecord(raw.finalCta);

  const metricsDefault = DEFAULT_HOME_LAB_CONTENT.metrics;
  const metricsRaw = Array.isArray(raw.metrics) ? raw.metrics : [];
  const metrics = metricsRaw.length
    ? metricsRaw.slice(0, 6).map((item, index) => {
      const itemRaw = asRecord(item);
      const fallback = metricsDefault[index] || metricsDefault[0];
      return {
        label: asString(itemRaw.label, fallback.label, 90),
        value: asNumber(itemRaw.value, fallback.value, 0, 999999),
        suffix: asString(itemRaw.suffix, fallback.suffix || '', 5),
      };
    })
    : metricsDefault;

  const benefitsDefault = DEFAULT_HOME_LAB_CONTENT.benefits;
  const benefitsRaw = Array.isArray(raw.benefits) ? raw.benefits : [];
  const benefits = benefitsRaw.length
    ? benefitsRaw.slice(0, 8).map((item, index) => {
      const itemRaw = asRecord(item);
      const fallback = benefitsDefault[index] || benefitsDefault[0];
      return {
        title: asString(itemRaw.title, fallback.title, 120),
        description: asString(itemRaw.description, fallback.description, 280),
      };
    })
    : benefitsDefault;

  const categoriesDefault = DEFAULT_HOME_LAB_CONTENT.categories;
  const categoriesRaw = Array.isArray(raw.categories) ? raw.categories : [];
  const categories = categoriesRaw.length
    ? categoriesRaw.slice(0, 20).map((item, index) => {
      const itemRaw = asRecord(item);
      const fallback = categoriesDefault[index] || categoriesDefault[categoriesDefault.length - 1];
      return {
        id: asCategoryId(itemRaw.id, fallback.id),
        title: asString(itemRaw.title, fallback.title, 100),
        description: asString(itemRaw.description, fallback.description, 280),
        routes: asNumber(itemRaw.routes, fallback.routes, 0, 10000),
      };
    })
    : categoriesDefault;

  const programsDefault = DEFAULT_HOME_LAB_CONTENT.programs;
  const programsRaw = Array.isArray(raw.programs) ? raw.programs : [];
  const programs = programsRaw.length
    ? programsRaw.slice(0, 50).map((item, index) => {
      const itemRaw = asRecord(item);
      const fallback = programsDefault[index] || programsDefault[0];
      return {
        title: asString(itemRaw.title, fallback.title, 160),
        categoryId: asCategoryId(itemRaw.categoryId, fallback.categoryId),
        level: asString(itemRaw.level, fallback.level, 60),
        duration: asString(itemRaw.duration, fallback.duration, 60),
        students: asNumber(itemRaw.students, fallback.students, 0, 1000000),
        rating: asDecimal(itemRaw.rating, fallback.rating, 0, 5),
        priceLabel: asString(itemRaw.priceLabel, fallback.priceLabel, 60),
        imageUrl: asString(itemRaw.imageUrl, fallback.imageUrl, 500),
        author: asString(itemRaw.author, fallback.author, 90),
      };
    })
    : programsDefault;

  const refsDefault = DEFAULT_HOME_LAB_CONTENT.references;
  const refsRaw = Array.isArray(raw.references) ? raw.references : [];
  const references = refsRaw.length
    ? refsRaw.slice(0, 20).map((item, index) => {
      const itemRaw = asRecord(item);
      const fallback = refsDefault[index] || refsDefault[0];
      return {
        name: asString(itemRaw.name, fallback.name, 70),
        detail: asString(itemRaw.detail, fallback.detail, 120),
        href: asString(itemRaw.href, fallback.href, 500),
        visualUrl: asString(itemRaw.visualUrl, fallback.visualUrl, 500),
      };
    })
    : refsDefault;

  return {
    nav: {
      categoriesLabel: asString(navRaw.categoriesLabel, DEFAULT_HOME_LAB_CONTENT.nav.categoriesLabel, 30),
      programsLabel: asString(navRaw.programsLabel, DEFAULT_HOME_LAB_CONTENT.nav.programsLabel, 30),
      differentialsLabel: asString(navRaw.differentialsLabel, DEFAULT_HOME_LAB_CONTENT.nav.differentialsLabel, 30),
      referencesLabel: asString(navRaw.referencesLabel, DEFAULT_HOME_LAB_CONTENT.nav.referencesLabel, 30),
      searchLabel: asString(navRaw.searchLabel, DEFAULT_HOME_LAB_CONTENT.nav.searchLabel, 30),
      loginLabel: asString(navRaw.loginLabel, DEFAULT_HOME_LAB_CONTENT.nav.loginLabel, 30),
      registerLabel: asString(navRaw.registerLabel, DEFAULT_HOME_LAB_CONTENT.nav.registerLabel, 30),
    },
    hero: {
      eyebrow: asString(heroRaw.eyebrow, DEFAULT_HOME_LAB_CONTENT.hero.eyebrow, 140),
      titleStart: asString(heroRaw.titleStart, DEFAULT_HOME_LAB_CONTENT.hero.titleStart, 200),
      titleHighlight: asString(heroRaw.titleHighlight, DEFAULT_HOME_LAB_CONTENT.hero.titleHighlight, 140),
      titleEnd: asString(heroRaw.titleEnd, DEFAULT_HOME_LAB_CONTENT.hero.titleEnd, 200),
      description: asString(heroRaw.description, DEFAULT_HOME_LAB_CONTENT.hero.description, 520),
      primaryCtaLabel: asString(heroRaw.primaryCtaLabel, DEFAULT_HOME_LAB_CONTENT.hero.primaryCtaLabel, 80),
      secondaryCtaLabel: asString(heroRaw.secondaryCtaLabel, DEFAULT_HOME_LAB_CONTENT.hero.secondaryCtaLabel, 80),
      searchPlaceholder: asString(heroRaw.searchPlaceholder, DEFAULT_HOME_LAB_CONTENT.hero.searchPlaceholder, 200),
      imageMainUrl: asString(heroRaw.imageMainUrl, DEFAULT_HOME_LAB_CONTENT.hero.imageMainUrl, 500),
      imageSecondaryUrl: asString(heroRaw.imageSecondaryUrl, DEFAULT_HOME_LAB_CONTENT.hero.imageSecondaryUrl, 500),
      badgeTitle: asString(heroRaw.badgeTitle, DEFAULT_HOME_LAB_CONTENT.hero.badgeTitle, 90),
      badgeSubtitle: asString(heroRaw.badgeSubtitle, DEFAULT_HOME_LAB_CONTENT.hero.badgeSubtitle, 200),
    },
    metrics,
    benefits,
    sections: {
      categoriesEyebrow: asString(sectionsRaw.categoriesEyebrow, DEFAULT_HOME_LAB_CONTENT.sections.categoriesEyebrow, 70),
      categoriesTitle: asString(sectionsRaw.categoriesTitle, DEFAULT_HOME_LAB_CONTENT.sections.categoriesTitle, 220),
      programsEyebrow: asString(sectionsRaw.programsEyebrow, DEFAULT_HOME_LAB_CONTENT.sections.programsEyebrow, 70),
      programsTitle: asString(sectionsRaw.programsTitle, DEFAULT_HOME_LAB_CONTENT.sections.programsTitle, 220),
      differentialsEyebrow: asString(sectionsRaw.differentialsEyebrow, DEFAULT_HOME_LAB_CONTENT.sections.differentialsEyebrow, 70),
      differentialsTitle: asString(sectionsRaw.differentialsTitle, DEFAULT_HOME_LAB_CONTENT.sections.differentialsTitle, 220),
      referencesEyebrow: asString(sectionsRaw.referencesEyebrow, DEFAULT_HOME_LAB_CONTENT.sections.referencesEyebrow, 70),
      referencesTitle: asString(sectionsRaw.referencesTitle, DEFAULT_HOME_LAB_CONTENT.sections.referencesTitle, 220),
    },
    categories,
    programs,
    differentials: {
      imageUrl: asString(diffRaw.imageUrl, DEFAULT_HOME_LAB_CONTENT.differentials.imageUrl, 500),
      bullets: asStringArray(diffRaw.bullets, DEFAULT_HOME_LAB_CONTENT.differentials.bullets, 10, 240),
    },
    references,
    finalCta: {
      eyebrow: asString(finalRaw.eyebrow, DEFAULT_HOME_LAB_CONTENT.finalCta.eyebrow, 90),
      title: asString(finalRaw.title, DEFAULT_HOME_LAB_CONTENT.finalCta.title, 280),
      description: asString(finalRaw.description, DEFAULT_HOME_LAB_CONTENT.finalCta.description, 340),
      primaryLabel: asString(finalRaw.primaryLabel, DEFAULT_HOME_LAB_CONTENT.finalCta.primaryLabel, 80),
      secondaryLabel: asString(finalRaw.secondaryLabel, DEFAULT_HOME_LAB_CONTENT.finalCta.secondaryLabel, 80),
    },
  };
}
