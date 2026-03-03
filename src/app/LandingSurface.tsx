"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users,
  LayoutDashboard,
  GraduationCap,
  BookOpen,
  Clock,
  FileCheck,
  BarChart3,
  Search,
  ArrowRight,
  ChevronRight,
  CheckCircle2,
  Sparkles,
  Command as CommandIcon
} from "lucide-react";
import styles from './landing.module.css';

interface LandingSurfaceProps {
  institutionName?: string;
  logoUrl?: string;
  heroImage?: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
}

const bentoCards = [
  {
    title: "Planeación ABP",
    description: "Diseño de proyectos basado en problemas con estándares internacionales y rúbricas dinámicas.",
    icon: LayoutDashboard,
    tone: 'Teal',
    size: 'wide'
  },
  {
    title: "Métricas en Vivo",
    description: "Analítica pedagógica avanzada para toma de decisiones en tiempo real.",
    icon: BarChart3,
    tone: 'Coral',
    size: 'tall'
  },
  {
    title: "Soberanía de Datos",
    description: "Control total y privado de la información académica de tu institución.",
    icon: FileCheck,
    tone: 'Amber',
    size: 'normal'
  },
  {
    title: "Metodología Activa",
    description: "Fomento de la autonomía del estudiante mediante procesos ejecutables y trazables.",
    icon: GraduationCap,
    tone: 'Indigo',
    size: 'normal'
  }
];

export function LandingSurface({
  institutionName = "Profe Tabla",
  logoUrl = "/logo.png",
  heroImage = "/hero-human.png"
}: LandingSurfaceProps) {
  const [navCompact, setNavCompact] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setNavCompact(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className={styles.pageShell}>
      <div className={styles.backgroundLayer} />

      <header className={`${styles.stickyNav} ${navCompact ? styles.navCompact : ''}`}>
        <div className={styles.navInner}>
          <div className={styles.brandBlock}>
            <img src={logoUrl} alt={institutionName} className={styles.brandLogo} />
            <span className={styles.brandName}>{institutionName}</span>
          </div>

          <nav className={styles.navLinks}>
            <a href="#modulos">Módulos</a>
            <a href="#metodologia">Metodología</a>
            <a href="#analitica">Analítica</a>
            <a href="#contacto">Contacto</a>
          </nav>

          <div className={styles.navActions}>
            <button className={styles.commandTrigger} onClick={() => setCommandOpen(true)}>
              <Search size={18} />
              <span>Buscar recursos...</span>
            </button>
            <Link href="/login" className={styles.navPrimaryCta}>Acceso Institucional</Link>
          </div>
        </div>
      </header>

      <main>
        {/* HERO SECTION - LUXURY TRANSFORMATION */}
        <section className={styles.hero}>
          <div className={styles.heroContent}>
            <div className={styles.heroEyebrow}>
              <Sparkles size={16} />
              <span>Arquitectura Pedagógica de Vanguardia</span>
            </div>
            <h1>
              Impulsa el <span className={styles.heroHighlight}>Aprendizaje</span> con Soberanía Tecnológica
            </h1>
            <p>
              La plataforma definitiva para instituciones líderes que buscan integrar planeación ABP y analítica avanzada en un ecosistema profesional y seguro.
            </p>
            <div className={styles.heroCtaRow}>
              <button className={styles.heroPrimaryCta}>
                Agendar Demo <ArrowRight size={20} />
              </button>
              <button className={styles.heroSecondaryCta}>
                Explorar Módulos
              </button>
            </div>
          </div>

          <div className={styles.heroVisuals}>
            <div className={styles.shape1} />
            <div className={styles.shape2} />
            <div className={styles.heroImageWrap}>
              <img src={heroImage} alt="Professional Education" className={styles.heroMainImage} />
            </div>
          </div>
        </section>

        {/* BENTO GRID - REFINED */}
        <section id="modulos" className={styles.sectionBlock}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionEyebrow}>Potencial Tecnológico</span>
            <h2>Ecosistema de Gestión Curricular Inteligente</h2>
            <p>Componentes modulares diseñados para escalar la calidad educativa sin comprometer la facilidad de uso.</p>
          </div>

          <div className={styles.bentoGrid}>
            {bentoCards.map((card, idx) => {
              const Icon = card.icon;
              return (
                <div
                  key={idx}
                  className={`${styles.bentoCard} ${card.size === 'wide' ? styles.cardWide : card.size === 'tall' ? styles.cardTall : ''} ${styles[`tone${card.tone}`]}`}
                >
                  <div className={styles.bentoIcon}>
                    <Icon size={32} />
                  </div>
                  <h3>{card.title}</h3>
                  <p>{card.description}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* VALUE PROPOSITION - LUXURY LAYOUT */}
        <section id="metodologia" className={styles.sectionBlock}>
          <div className={styles.dualColumn}>
            <div className={styles.glassCard}>
              <span className={styles.sectionEyebrow}>Diferencial</span>
              <h3>Metodología Activa Ejecutable</h3>
              <p>No solo digitalizamos procesos; implementamos un workflow que garantiza la autonomía del estudiante y la trazabilidad total para el docente.</p>
              <ul className="mt-8 space-y-4">
                <li className="flex items-center gap-3 font-semibold">
                  <CheckCircle2 className="text-[#1AB69D]" size={22} />
                  <span>Rúbricas de evaluación autogeneradas</span>
                </li>
                <li className="flex items-center gap-3 font-semibold">
                  <CheckCircle2 className="text-[#1AB69D]" size={22} />
                  <span>Portafolio de evidencias 3D integrado</span>
                </li>
              </ul>
            </div>

            <div className={styles.glassCard}>
              <span className={styles.sectionEyebrow}>Infraestructura</span>
              <h3>Seguridad y Soberanía de Datos</h3>
              <p>En Profe Tabla, su institución es dueña absoluta de sus datos pedagógicos. Sin intermediarios, sin cajas negras de IA genérica.</p>
              <div className="mt-8 p-6 bg-slate-50 rounded-2xl border border-slate-100 italic text-slate-600">
                &quot;La soberanía tecnológica es el primer paso hacia la excelencia académica en la era digital.&quot;
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className={styles.finalCta}>
        <h2>¿Listo para transformar su institución?</h2>
        <button className={styles.finalPrimary}>Comenzar Transformación</button>
      </footer>
    </div>
  );
}
