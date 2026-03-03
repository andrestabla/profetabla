import { Suspense } from 'react';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { LandingSurface } from './LandingSurface';
import { LandingSkeleton } from './LandingSkeleton';

async function LandingData() {
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
      primaryColor={config?.primaryColor || '#2563EB'}
      secondaryColor={config?.secondaryColor || '#475569'}
      accentColor={config?.accentColor || '#F59E0B'}
    />
  );
}

export default async function Home() {
  const session = await getServerSession(authOptions);
  if (session) {
    redirect('/dashboard');
  }

  return (
    <Suspense fallback={<LandingSkeleton />}>
      <LandingData />
    </Suspense>
  );
}
