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

export const metadata: Metadata = {
  title: "Profe Tabla | Gestión de Proyectos Educativos",
  description: "Plataforma integral para educación basada en proyectos. Kanban, Entregas y Mentorías.",
  metadataBase: new URL('https://profetabla.com'),
};

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

  // 3. Construct Style
  const dynamicStyles = `
    :root {
      --primary: ${primaryRgb};
      --radius: ${radius};
      --font-main: '${font}', sans-serif;
    }
    ${config?.customCss || ''}
  `;

  return (
    <html lang="es">
      <head>
        <link href={`https://fonts.googleapis.com/css2?family=${font.replace(' ', '+')}:wght@400;500;700&display=swap`} rel="stylesheet" />
        {config?.faviconUrl && <link rel="icon" href={config.faviconUrl} />}
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
