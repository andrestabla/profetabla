'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { listProjectFiles, uploadFileToDrive } from '@/lib/google-drive';
import { Readable } from 'stream';
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function addResourceToProjectAction(formData: FormData) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !['TEACHER', 'ADMIN'].includes(session.user.role)) return { success: false, error: 'No autorizado' };

        const projectId = formData.get('projectId') as string;
        const driveTitle = formData.get('driveTitle') as string;
        const title = driveTitle || (formData.get('title') as string);
        const type = formData.get('type') as string;
        const url = formData.get('url') as string;
        const presentation = formData.get('presentation') as string;
        const utility = formData.get('utility') as string;

        console.log('--- addResourceToProjectAction ---');
        console.log('Project:', projectId, 'Title:', title, 'Type:', type, 'URL:', url);

        if (!projectId || !title || !url) {
            return { success: false, error: `Faltan datos requeridos: ${!projectId ? 'ProjectID ' : ''}${!title ? 'Title ' : ''}${!url ? 'URL' : ''}` };
        }

        const category = await prisma.resourceCategory.findFirst();
        const categoryId = category?.id || (await prisma.resourceCategory.create({ data: { name: 'General' } })).id;

        await prisma.resource.create({
            data: {
                title,
                type,
                url,
                projectId,
                presentation,
                utility,
                categoryId: categoryId
            }
        });

        revalidatePath(`/dashboard/professor/projects/${projectId}`);
        return { success: true };
    } catch (e: unknown) {
        const error = e as Error;
        console.error('Error en addResourceToProjectAction:', error);
        return { success: false, error: error.message || 'Error desconocido al crear recurso' };
    }
}


export async function updateProjectResourceAction(formData: FormData) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !['TEACHER', 'ADMIN'].includes(session.user.role)) return { success: false, error: 'No autorizado' };

        const resourceId = formData.get('resourceId') as string;
        const projectId = formData.get('projectId') as string;
        const driveTitle = formData.get('driveTitle') as string;
        const title = driveTitle || (formData.get('title') as string);
        const type = formData.get('type') as string;
        const url = formData.get('url') as string;
        const presentation = formData.get('presentation') as string;
        const utility = formData.get('utility') as string;

        if (!resourceId || !projectId || !title || !url) {
            return { success: false, error: 'Faltan datos requeridos para actualizar' };
        }

        await prisma.resource.update({
            where: { id: resourceId },
            data: {
                title,
                type,
                url,
                presentation,
                utility,
            }
        });

        revalidatePath(`/dashboard/professor/projects/${projectId}`);
        return { success: true };
    } catch (e: unknown) {
        const error = e as Error;
        console.error('Error en updateProjectResourceAction:', error);
        return { success: false, error: error.message || 'Error desconocido al actualizar recurso' };
    }
}

export async function getProjectDriveFilesAction(folderId: string) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) throw new Error('No autorizado');

        const files = await listProjectFiles(folderId);
        return files || [];
    } catch (e: unknown) {
        console.error('Error en getProjectDriveFilesAction:', e);
        throw e;
    }
}

export async function uploadProjectFileToDriveAction(formData: FormData) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !['TEACHER', 'ADMIN'].includes(session.user.role)) return { success: false, error: 'No autorizado' };

        const projectId = formData.get('projectId') as string;
        const file = formData.get('file') as File;
        const presentation = formData.get('presentation') as string;
        const utility = formData.get('utility') as string;

        if (!file || !projectId) {
            return { success: false, error: 'Faltan datos requeridos (archivo o projectId)' };
        }

        const project = await prisma.project.findUnique({
            where: { id: projectId },
            select: { googleDriveFolderId: true }
        });

        if (!project?.googleDriveFolderId) {
            return { success: false, error: 'El proyecto no tiene una carpeta de Drive vinculada' };
        }

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const stream = Readable.from(buffer);

        console.log(`Subiendo archivo "${file.name}" a Drive...`);

        const uploadedFile = await uploadFileToDrive(
            project.googleDriveFolderId,
            file.name,
            file.type,
            stream
        );

        if (!uploadedFile || !uploadedFile.webViewLink) {
            return { success: false, error: 'Error al obtener el enlace del archivo subido de Drive' };
        }

        const firstCategory = await prisma.resourceCategory.findFirst();
        const categoryId = firstCategory?.id || (await prisma.resourceCategory.create({ data: { name: 'General' } })).id;

        await prisma.resource.create({
            data: {
                title: file.name,
                type: 'DRIVE',
                url: uploadedFile.webViewLink,
                projectId,
                presentation,
                utility,
                categoryId: categoryId
            }
        });

        revalidatePath(`/dashboard/professor/projects/${projectId}`);
        return { success: true, file: uploadedFile };
    } catch (e: unknown) {
        const error = e as Error;
        console.error('Error en uploadProjectFileToDriveAction:', error);
        return { success: false, error: error.message || 'Error desconocido al subir archivo' };
    }
}

import OpenAI from 'openai';

// YouTube Data API integration
async function fetchYouTubeMetadata(url: string, apiKey?: string) {
    try {
        // Extract video ID from URL
        const videoIdMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/);
        if (!videoIdMatch) return null;


        const videoId = videoIdMatch[1];

        if (!apiKey) {
            console.log('[YouTube API] No API key provided, skipping YouTube fetch');
            return null;
        }

        const response = await fetch(
            `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${apiKey}`
        );

        if (!response.ok) {
            console.error('[YouTube API] Failed to fetch:', response.statusText);
            return null;
        }

        const data = await response.json();

        if (!data.items || data.items.length === 0) {
            console.log('[YouTube API] Video not found');
            return null;
        }

        const video = data.items[0].snippet;

        return {
            title: video.title,
            presentation: video.description.substring(0, 250) || `Video educativo de YouTube sobre ${video.title}`,
            utility: `Recurso audiovisual que explica conceptos clave sobre ${video.title.toLowerCase()}`
        };
    } catch (error) {
        console.error('[YouTube API] Error:', error);
        return null;
    }
}

// OpenAI extraction function
async function extractWithOpenAI(apiKey: string, model: string, url: string, type: string) {
    const openai = new OpenAI({ apiKey });

    const prompt = `Actúa como un asistente pedagógico experto.
Analiza el siguiente recurso educativo y genera metadatos útiles para un estudiante universitario.

Tipo de Recurso: ${type}
URL/Identificador: ${url}

Genera un JSON con esta estructura EXACTA (sin markdown, solo JSON puro):
{
  "title": "Nombre claro y profesional del recurso (máx 100 caracteres)",
  "presentation": "Descripción concisa de qué es y qué contiene (máx 250 caracteres)",
  "utility": "Para qué le sirve al estudiante en su proyecto (máx 250 caracteres)"
}

IMPORTANTE: Responde SOLO con el JSON, sin bloques de código markdown.`;

    const completion = await openai.chat.completions.create({
        model,
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        temperature: 0.7,
        max_tokens: 500,
    });

    const content = completion.choices[0].message.content;
    if (!content) throw new Error('No content returned from OpenAI');

    return JSON.parse(content);
}

// Helper function for URL-based metadata extraction (fallback when AI fails)
function extractMetadataFromUrl(url: string, type: string) {
    try {
        if (type === 'VIDEO') {
            // YouTube URL parsing
            const videoId = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/)?.[1];
            const vimeoId = url.match(/vimeo\.com\/(\d+)/)?.[1];

            if (videoId) {
                return {
                    title: `Video de YouTube`,
                    presentation: `Video educativo disponible en YouTube (ID: ${videoId})`,
                    utility: `Recurso audiovisual para complementar el aprendizaje del proyecto`
                };
            }

            if (vimeoId) {
                return {
                    title: `Video de Vimeo`,
                    presentation: `Video educativo disponible en Vimeo`,
                    utility: `Recurso audiovisual para complementar el aprendizaje del proyecto`
                };
            }
        }

        if (type === 'ARTICLE') {
            const urlObj = new URL(url);
            const domain = urlObj.hostname.replace('www.', '');
            const pathParts = urlObj.pathname.split('/').filter(p => p);
            const lastPart = pathParts[pathParts.length - 1] || '';
            const title = lastPart.replace(/-/g, ' ').replace(/_/g, ' ').replace(/\.\w+$/, '');

            return {
                title: title ? title.charAt(0).toUpperCase() + title.slice(1) : `Artículo de ${domain}`,
                presentation: `Artículo publicado en ${domain}`,
                utility: `Lectura complementaria para profundizar en los conceptos del proyecto`
            };
        }

        if (type === 'DRIVE') {
            // For Drive, url is actually the filename
            const cleanName = url.replace(/\.\w+$/, ''); // Remove extension
            return {
                title: cleanName,
                presentation: `Documento almacenado en Google Drive`,
                utility: `Material de referencia para el desarrollo del proyecto`
            };
        }

        if (type === 'EMBED') {
            // Try to extract title from HTML
            const titleMatch = url.match(/title="([^"]+)"/i);
            const srcMatch = url.match(/src="([^"]+)"/i);

            let title = 'Contenido Embebido';
            if (titleMatch?.[1]) {
                title = titleMatch[1];
            } else if (srcMatch?.[1]) {
                try {
                    const srcUrl = new URL(srcMatch[1]);
                    title = `Contenido de ${srcUrl.hostname.replace('www.', '')}`;
                } catch {
                    // Invalid URL, keep default
                }
            }

            return {
                title,
                presentation: `Contenido interactivo embebido en la página`,
                utility: `Recurso multimedia para enriquecer la experiencia de aprendizaje`
            };
        }

        return null;
    } catch (error) {
        console.error('[URL Extraction] Error parsing URL:', error);
        return null;
    }
}

export async function extractResourceMetadataAction(url: string, type: string) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return { success: false, error: 'No autorizado' };

        const config = await prisma.platformConfig.findUnique({ where: { id: 'global-config' } });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const safeConfig = config as any;
        const aiProvider = safeConfig?.aiProvider || 'GEMINI';

        // For YouTube videos, try to fetch real metadata first
        if (type === 'VIDEO' && url.includes('youtube.com') || url.includes('youtu.be')) {
            const youtubeApiKey = safeConfig?.youtubeApiKey || process.env.YOUTUBE_API_KEY || process.env.GOOGLE_API_KEY;
            const youtubeData = await fetchYouTubeMetadata(url, youtubeApiKey);
            if (youtubeData) {
                console.log('[AI Extraction] Using YouTube API data');
                return { success: true, data: youtubeData };
            }
        }

        // Try OpenAI if configured as provider
        if (aiProvider === 'OPENAI' && safeConfig?.openaiApiKey) {
            try {
                console.log('[AI Extraction] Using OpenAI');
                const data = await extractWithOpenAI(
                    safeConfig.openaiApiKey,
                    safeConfig.openaiModel || 'gpt-4o-mini',
                    url,
                    type
                );
                console.log('[AI Extraction] OpenAI success');
                return { success: true, data };
            } catch (error) {
                console.error('[AI Extraction] OpenAI failed:', error);
                // Fall through to Gemini or URL fallback
            }
        }

        // Try Gemini (existing logic)
        const geminiApiKey = config?.geminiApiKey || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

        if (geminiApiKey) {
            const genAI = new GoogleGenerativeAI(geminiApiKey);

            // Use fallback model list like ai-generator.ts
            const candidateModels = [
                config?.geminiModel,
                "gemini-1.5-flash-002",
                "gemini-1.5-flash-8b",
                "gemini-1.5-pro-002",
                "gemini-2.0-flash-exp",
                "gemini-1.5-flash",
                "gemini-1.5-pro",
                "gemini-pro"
            ];

            const uniqueModels = Array.from(new Set(candidateModels.filter((m): m is string => typeof m === 'string' && m.length > 0)));

            const prompt = `
            Actúa como un asistente pedagógico experto.
            Tu tarea es analizar el siguiente recurso educativo y generar metadatos útiles para un estudiante.

            Tipo de Recurso: ${type}
            Identificador (URL, Título o Código): ${url}

            INSTRUCCIONES:
            1. Si es una URL de YouTube, analiza la estructura de la URL y el contexto para sugerir un título profesional.
            2. Si es una URL de artículo, usa el dominio y el slug para inferir el contenido.
            3. Si es un archivo de Drive (basado en título) o un Embed code, analiza el texto proporcionado.
            4. Genera un título profesional, una presentación descriptiva y una utilidad pedagógica clara.

            Responde ÚNICAMENTE con un JSON válido con esta estructura:
            {
              "title": "Nombre claro y profesional del recurso (Ej: 'Introducción a React Hooks')",
              "presentation": "Descripción concisa: qué es, quién lo crea y qué temas principales aborda. (Máx 250 caracteres)",
              "utility": "Directo al grano: para qué le sirve al estudiante en su proyecto. (Ej: 'Útil para implementar la autenticación...'). (Máx 250 caracteres)"
            }
        `;

            // Try each model until one works
            for (const modelName of uniqueModels) {
                try {
                    console.log(`[AI Extraction] Trying model: ${modelName}`);
                    const model = genAI.getGenerativeModel({ model: modelName });
                    const result = await model.generateContent(prompt);
                    const text = result.response.text();

                    console.log(`[AI Extraction] Success with ${modelName}`);

                    // Robust JSON cleanup
                    const jsonString = text.replace(/```json/g, '').replace(/```/g, '').trim();

                    let data;
                    try {
                        data = JSON.parse(jsonString);
                    } catch (parseError) {
                        console.error(`[AI Extraction] JSON parse error with ${modelName}:`, text);
                        continue; // Try next model
                    }

                    return { success: true, data };
                } catch (modelError: unknown) {
                    const error = modelError as Error;
                    console.error(`[AI Extraction] Failed with ${modelName}:`, error?.message || 'Unknown error');
                    // Continue to next model
                }
            }
        }

        // If all Gemini models failed, try URL-based extraction as fallback
        console.log('[AI Extraction] All AI models failed, attempting URL-based extraction');
        const fallbackData = extractMetadataFromUrl(url, type);

        if (fallbackData) {
            console.log('[AI Extraction] Successfully extracted metadata from URL');
            return { success: true, data: fallbackData };
        }

        return { success: false, error: 'No se pudo generar metadatos con ningún modelo disponible' };
    } catch (e: unknown) {
        const error = e as Error;
        console.error('Error en extractResourceMetadataAction:', error);
        // Devolver el mensaje real del error para depuración
        return { success: false, error: error.message || 'Error desconocido al procesar con IA' };
    }
}
