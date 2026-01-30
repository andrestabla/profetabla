import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const config = await prisma.platformConfig.findUnique({ where: { id: 'global-config' } });

  const fallbackFavicon = 'https://img.icons8.com/fluency/48/education.png';
  const favicon = config?.faviconUrl || fallbackFavicon;

  return {
    title: config?.institutionName ? `${config.institutionName} | Gestión Educativa` : "Profe Tabla | Gestión de Proyectos Educativos",
    description: "Plataforma integral para educación basada en proyectos. Kanban, Entregas y Mentorías.",
    metadataBase: new URL('https://profetabla.com'),
    icons: {
      icon: [
        { url: favicon, sizes: 'any' }
      ],
      shortcut: [favicon],
      apple: [favicon],
    }
  };
}

export const dynamic = 'force-dynamic'; // Ensure config is fetched fresh

import { prisma } from "@/lib/prisma";
import { hexToRgb } from "@/lib/design-utils";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // 1. Fetch Config
  const config = await prisma.platformConfig.findUnique({ where: { id: 'global-config' } });

  // 2. Prepare Variables
  const primaryRgb = hexToRgb(config?.primaryColor || "#2563EB");
  const font = config?.fontFamily || 'Inter';
  const radius = config?.borderRadius || '0.5rem';
  const fallbackFavicon = 'https://img.icons8.com/fluency/48/education.png';
  const favicon = config?.faviconUrl || fallbackFavicon;

  // 3. Construct Style
  const dynamicStyles = `
    :root {
      --primary: ${primaryRgb};
      --radius: ${radius};
      --font-main: '${font}', sans-serif;
      --loading-url: url('${config?.loadingUrl || 'https://profetabla.s3.us-east-1.amazonaws.com/coaching.gif'}');
    }
    ${config?.customCss || ''}
  `;

  return (
    <html lang="es">
      <head>
        <link rel="icon" href={favicon} sizes="any" />
        <link rel="apple-touch-icon" href={favicon} />
        <link href={`https://fonts.googleapis.com/css2?family=${font.replace(' ', '+')}:wght@400;500;700&display=swap`} rel="stylesheet" />
        <style dangerouslySetInnerHTML={{ __html: dynamicStyles }} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
