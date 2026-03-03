import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { revalidatePath } from 'next/cache';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logActivity } from '@/lib/activity';

type LandingContentPayload = {
  heroEyebrow?: unknown;
  heroTitleStart?: unknown;
  heroTitleHighlight?: unknown;
  heroTitleEnd?: unknown;
  heroDescription?: unknown;
  primaryCtaLabel?: unknown;
  secondaryCtaLabel?: unknown;
  heroImageMainUrl?: unknown;
  heroImageSecondaryUrl?: unknown;
};

function cleanString(value: unknown, maxLength: number) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, maxLength);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ success: false, message: 'No autorizado.' }, { status: 403 });
  }

  let body: LandingContentPayload;
  try {
    body = (await req.json()) as LandingContentPayload;
  } catch {
    return NextResponse.json({ success: false, message: 'Payload inválido.' }, { status: 400 });
  }

  const data = {
    landingHeroEyebrow: cleanString(body.heroEyebrow, 120),
    landingHeroTitleStart: cleanString(body.heroTitleStart, 150),
    landingHeroTitleHighlight: cleanString(body.heroTitleHighlight, 120),
    landingHeroTitleEnd: cleanString(body.heroTitleEnd, 150),
    landingHeroDescription: cleanString(body.heroDescription, 500),
    landingPrimaryCtaLabel: cleanString(body.primaryCtaLabel, 60),
    landingSecondaryCtaLabel: cleanString(body.secondaryCtaLabel, 60),
    landingHeroImageMainUrl: cleanString(body.heroImageMainUrl, 500),
    landingHeroImageSecondaryUrl: cleanString(body.heroImageSecondaryUrl, 500)
  };

  await prisma.platformConfig.upsert({
    where: { id: 'global-config' },
    create: {
      id: 'global-config',
      ...data
    },
    update: data
  });

  await logActivity(
    session.user.id,
    'UPDATE_HOME_LAB_CONTENT',
    'Actualizó el contenido editable del home de laboratorio',
    'INFO',
    { updatedFields: Object.keys(data).filter((key) => data[key as keyof typeof data] !== null) }
  );

  revalidatePath('/home-lab');

  return NextResponse.json({ success: true, message: 'Contenido actualizado.' });
}
