import { Suspense } from 'react';
import { prisma } from '@/lib/prisma';
import { hexToRgb } from '@/lib/design-utils';
import { LandingSurface } from '@/app/LandingSurface';
import { LandingSkeleton } from '@/app/LandingSkeleton';

function toRgbComma(hex?: string | null, fallback = '26, 182, 157') {
  if (!hex) return fallback;
  try {
    return hexToRgb(hex).replace(/\s+/g, ', ');
  } catch {
    return fallback;
  }
}

async function HomeLabData() {
  const config = await prisma.platformConfig.findUnique({
    where: { id: 'global-config' },
    select: {
      institutionName: true,
      logoUrl: true,
      primaryColor: true,
      secondaryColor: true,
      accentColor: true
    }
  });

  return (
    <LandingSurface
      institutionName={config?.institutionName || 'Profe Tabla'}
      logoUrl={config?.logoUrl || ''}
      primaryColor={toRgbComma(config?.primaryColor, '26, 182, 157')}
      secondaryColor={toRgbComma(config?.secondaryColor, '71, 85, 105')}
      accentColor={toRgbComma(config?.accentColor, '238, 74, 98')}
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
