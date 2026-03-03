import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { revalidatePath } from 'next/cache';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logActivity } from '@/lib/activity';
import { sanitizeHexColor, sanitizeHomeLabContent } from '@/lib/home-lab-content';

type LandingContentPayload = {
  homeLabContent?: unknown;
  primaryColor?: unknown;
  secondaryColor?: unknown;
  accentColor?: unknown;
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

  const existing = await prisma.platformConfig.findUnique({
    where: { id: 'global-config' },
    select: { primaryColor: true, secondaryColor: true, accentColor: true }
  });

  const payloadFromLegacyHero = {
    hero: {
      eyebrow: cleanString(body.heroEyebrow, 120) || undefined,
      titleStart: cleanString(body.heroTitleStart, 150) || undefined,
      titleHighlight: cleanString(body.heroTitleHighlight, 120) || undefined,
      titleEnd: cleanString(body.heroTitleEnd, 150) || undefined,
      description: cleanString(body.heroDescription, 500) || undefined,
      primaryCtaLabel: cleanString(body.primaryCtaLabel, 60) || undefined,
      secondaryCtaLabel: cleanString(body.secondaryCtaLabel, 60) || undefined,
      imageMainUrl: cleanString(body.heroImageMainUrl, 500) || undefined,
      imageSecondaryUrl: cleanString(body.heroImageSecondaryUrl, 500) || undefined,
    }
  };

  const normalizedContent = sanitizeHomeLabContent(body.homeLabContent ?? payloadFromLegacyHero);
  const primaryColor = sanitizeHexColor(body.primaryColor, existing?.primaryColor || '#2563EB');
  const secondaryColor = sanitizeHexColor(body.secondaryColor, existing?.secondaryColor || '#475569');
  const accentColor = sanitizeHexColor(body.accentColor, existing?.accentColor || '#F59E0B');

  const data = {
    primaryColor,
    secondaryColor,
    accentColor,
    homeLabContentJson: normalizedContent,
    landingHeroEyebrow: normalizedContent.hero.eyebrow,
    landingHeroTitleStart: normalizedContent.hero.titleStart,
    landingHeroTitleHighlight: normalizedContent.hero.titleHighlight,
    landingHeroTitleEnd: normalizedContent.hero.titleEnd,
    landingHeroDescription: normalizedContent.hero.description,
    landingPrimaryCtaLabel: normalizedContent.hero.primaryCtaLabel,
    landingSecondaryCtaLabel: normalizedContent.hero.secondaryCtaLabel,
    landingHeroImageMainUrl: normalizedContent.hero.imageMainUrl,
    landingHeroImageSecondaryUrl: normalizedContent.hero.imageSecondaryUrl,
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
    {
      updatedFields: Object.keys(data).filter((key) => data[key as keyof typeof data] !== null),
      colors: { primaryColor, secondaryColor, accentColor }
    }
  );

  revalidatePath('/home-lab');

  return NextResponse.json({ success: true, message: 'Contenido actualizado.' });
}
