import { Suspense } from 'react';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { hexToRgb } from '@/lib/design-utils';
import { LandingSurface } from '@/app/LandingSurface';
import { LandingSkeleton } from '@/app/LandingSkeleton';
import { authOptions } from '@/lib/auth';

function toRgbComma(hex?: string | null, fallback = '26, 182, 157') {
  if (!hex) return fallback;
  try {
    return hexToRgb(hex).replace(/\s+/g, ', ');
  } catch {
    return fallback;
  }
}

async function HomeLabData() {
  const session = await getServerSession(authOptions);

  const config = await prisma.platformConfig.findUnique({
    where: { id: 'global-config' },
    select: {
      institutionName: true,
      logoUrl: true,
      primaryColor: true,
      secondaryColor: true,
      accentColor: true,
      landingHeroEyebrow: true,
      landingHeroTitleStart: true,
      landingHeroTitleHighlight: true,
      landingHeroTitleEnd: true,
      landingHeroDescription: true,
      landingPrimaryCtaLabel: true,
      landingSecondaryCtaLabel: true,
      landingHeroImageMainUrl: true,
      landingHeroImageSecondaryUrl: true
    }
  });

  return (
    <LandingSurface
      isAdmin={session?.user?.role === 'ADMIN'}
      institutionName={config?.institutionName || 'Profe Tabla'}
      logoUrl={config?.logoUrl || ''}
      primaryColor={toRgbComma(config?.primaryColor, '26, 182, 157')}
      secondaryColor={toRgbComma(config?.secondaryColor, '71, 85, 105')}
      accentColor={toRgbComma(config?.accentColor, '238, 74, 98')}
      editableContent={{
        heroEyebrow: config?.landingHeroEyebrow || 'DESARROLLADA PARA INSTITUCIONES EDUCATIVAS',
        heroTitleStart: config?.landingHeroTitleStart || 'Plataforma integral para',
        heroTitleHighlight: config?.landingHeroTitleHighlight || 'aprendizaje por proyectos',
        heroTitleEnd: config?.landingHeroTitleEnd || 'con trazabilidad completa.',
        heroDescription: config?.landingHeroDescription || 'ProfeTabla conecta diseño pedagógico, entregas, mentorías, analítica y reconocimientos en una operación académica coherente, medible y escalable.',
        primaryCtaLabel: config?.landingPrimaryCtaLabel || 'Explorar implementación',
        secondaryCtaLabel: config?.landingSecondaryCtaLabel || 'Ver programas',
        heroImageMainUrl: config?.landingHeroImageMainUrl || '',
        heroImageSecondaryUrl: config?.landingHeroImageSecondaryUrl || ''
      }}
    />
  );
}

export default function HomeLabPage() {
  return (
    <Suspense fallback={<LandingSkeleton />}>
      <HomeLabData />
    </Suspense>
  );
}
