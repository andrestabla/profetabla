import { Suspense } from 'react';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { LandingSurface } from '@/app/LandingSurface';
import { LandingSkeleton } from '@/app/LandingSkeleton';
import { authOptions } from '@/lib/auth';
import { DEFAULT_HOME_LAB_CONTENT, sanitizeHomeLabContent } from '@/lib/home-lab-content';

type HomeLandingProps = {
  forceEditMode?: boolean;
};

async function HomeLandingData({ forceEditMode = false }: HomeLandingProps) {
  const session = await getServerSession(authOptions);

  const config = await prisma.platformConfig.findUnique({
    where: { id: 'global-config' },
    select: {
      institutionName: true,
      logoUrl: true,
      primaryColor: true,
      secondaryColor: true,
      accentColor: true,
      homeLabContentJson: true,
      landingHeroEyebrow: true,
      landingHeroTitleStart: true,
      landingHeroTitleHighlight: true,
      landingHeroTitleEnd: true,
      landingHeroDescription: true,
      landingPrimaryCtaLabel: true,
      landingSecondaryCtaLabel: true,
      landingHeroImageMainUrl: true,
      landingHeroImageSecondaryUrl: true,
    },
  });

  const jsonContent = config?.homeLabContentJson;
  const jsonContentObject = jsonContent && typeof jsonContent === 'object' ? (jsonContent as Record<string, unknown>) : {};
  const jsonHero = jsonContentObject.hero && typeof jsonContentObject.hero === 'object'
    ? (jsonContentObject.hero as Record<string, unknown>)
    : {};

  const legacyMergedContent = sanitizeHomeLabContent({
    ...jsonContentObject,
    hero: {
      ...jsonHero,
      eyebrow: config?.landingHeroEyebrow || undefined,
      titleStart: config?.landingHeroTitleStart || undefined,
      titleHighlight: config?.landingHeroTitleHighlight || undefined,
      titleEnd: config?.landingHeroTitleEnd || undefined,
      description: config?.landingHeroDescription || undefined,
      primaryCtaLabel: config?.landingPrimaryCtaLabel || undefined,
      secondaryCtaLabel: config?.landingSecondaryCtaLabel || undefined,
      imageMainUrl: config?.landingHeroImageMainUrl || undefined,
      imageSecondaryUrl: config?.landingHeroImageSecondaryUrl || undefined,
    },
  });

  return (
    <LandingSurface
      isAdmin={session?.user?.role === 'ADMIN'}
      institutionName={config?.institutionName || 'Profe Tabla'}
      logoUrl={config?.logoUrl || ''}
      primaryColor={config?.primaryColor || '#1AB69D'}
      secondaryColor={config?.secondaryColor || '#475569'}
      accentColor={config?.accentColor || '#EE4A62'}
      editableContent={legacyMergedContent || DEFAULT_HOME_LAB_CONTENT}
      defaultEditMode={forceEditMode}
    />
  );
}

export function HomeLanding({ forceEditMode = false }: HomeLandingProps) {
  return (
    <Suspense fallback={<LandingSkeleton />}>
      <HomeLandingData forceEditMode={forceEditMode} />
    </Suspense>
  );
}
