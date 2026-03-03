'use client';

import { useEffect, useMemo, useState } from 'react';
import { Award, BookMarked, Layers3, UsersRound } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

type DemoMetric = {
  label: string;
  value: number;
  suffix?: string;
  icon: LucideIcon;
};

const METRICS: DemoMetric[] = [
  { label: 'Proyectos activos', value: 184, suffix: '+', icon: Layers3 },
  { label: 'Estudiantes en ruta', value: 4680, suffix: '+', icon: UsersRound },
  { label: 'Recursos recomendados', value: 920, suffix: '+', icon: BookMarked },
  { label: 'Reconocimientos emitidos', value: 1260, suffix: '+', icon: Award }
];

function formatCompact(value: number) {
  return new Intl.NumberFormat('es-CO', { notation: 'compact' }).format(value);
}

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

export function LandingDemoMetrics() {
  const [animatedValues, setAnimatedValues] = useState<number[]>(() => METRICS.map(() => 0));

  useEffect(() => {
    let frameId = 0;
    const startTime = performance.now();
    const duration = 1500;

    const animate = (timestamp: number) => {
      const elapsed = timestamp - startTime;
      const globalProgress = Math.min(elapsed / duration, 1);

      const nextValues = METRICS.map((metric, index) => {
        const stagger = index * 0.08;
        const localProgress = Math.max(0, Math.min(1, (globalProgress - stagger) / (1 - stagger)));
        return Math.floor(metric.value * easeOutCubic(localProgress));
      });

      setAnimatedValues(nextValues);

      if (globalProgress < 1) {
        frameId = requestAnimationFrame(animate);
      }
    };

    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, []);

  const renderedValues = useMemo(
    () => METRICS.map((metric, i) => `${formatCompact(animatedValues[i] || 0)}${metric.suffix || ''}`),
    [animatedValues]
  );

  return (
    <aside className="rounded-[1.4rem] border border-slate-200 bg-white/95 p-5 md:p-6 shadow-[0_28px_80px_-46px_rgba(15,23,42,0.65)]">
      <p className="text-[11px] font-black uppercase tracking-[0.22em] mb-3" style={{ color: 'rgb(var(--primary))' }}>
        Impacto visible
      </p>
      <div className="space-y-2.5">
        {METRICS.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <article key={metric.label} className="rounded-xl border border-slate-200 px-3.5 py-3 bg-slate-50/80">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm text-slate-600">{metric.label}</p>
                <Icon className="w-4 h-4" style={{ color: 'rgb(var(--primary))' }} />
              </div>
              <p className="text-2xl font-black tracking-tight text-slate-900 mt-1">{renderedValues[index]}</p>
            </article>
          );
        })}
      </div>
      <p className="text-[11px] text-slate-500 mt-3">Cifras de demostración para la vista pública.</p>
    </aside>
  );
}
