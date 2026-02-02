'use server';

import { GoogleGenerativeAI } from "@google/generative-ai";
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function getSupportResponse(message: string, history: { role: 'user' | 'model', parts: string }[]) {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        return { success: false, error: "Debes iniciar sesión para usar el soporte." };
    }

    const userId = session.user.id;

    // Fetch User Context
    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
            projectsAsStudent: {
                where: { status: { in: ['OPEN', 'IN_PROGRESS'] } },
                select: { title: true, type: true, description: true }
            },
            assignedTasks: {
                where: { status: { not: 'DONE' } },
                select: { title: true, status: true, dueDate: true }
            },
            mentorships: {
                where: { status: 'CONFIRMED' },
                include: {
                    slot: { select: { startTime: true } }
                },
                take: 3
            }
        }
    });

    const config = await prisma.platformConfig.findUnique({ where: { id: 'global-config' } });
    const apiKey = config?.geminiApiKey || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

    if (!apiKey) {
        console.error("AI Support Chatbot: No API Key found.");
        return { success: false, error: "Configuración de IA no disponible (API Key faltante)." };
    }

    // Force gemini-2.0-flash as per user environment requirements
    const modelName = "gemini-2.0-flash";

    console.log(`AI Support Chatbot: Using model ${modelName}. API Key starts with: ${apiKey.substring(0, 5)}...`);

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction: `
            Actúa como el asistente oficial de Profe Tabla. Tu objetivo es ayudar al usuario a navegar la plataforma y progresar en sus proyectos.
            
            METODOLOGÍA PROFE TABLA:
            - Proyectos: Simulaciones industriales de largo plazo.
            - Retos: Validación de habilidades técnicas específicas.
            - Problemas: Situaciones abiertas para pensamiento crítico.
            - En Profe Tabla, "haces un proyecto para aprender", no aprendes para hacer un proyecto.
            
            CONTEXTO DEL USUARIO ACTUAL:
            - Nombre: ${user?.name || 'Usuario'}
            - Proyectos Activos: ${(user?.projectsAsStudent || []).map(p => `${p.title} (${p.type})`).join(', ') || 'Ninguno'}
            - Tareas Pendientes: ${(user?.assignedTasks || []).map(t => `${t.title} (${t.status})`).join(', ') || 'Ninguna'}
            - Próximas Mentorías: ${(user?.mentorships || []).map(m => m.slot.startTime.toLocaleString()).join(', ') || 'Ninguna'}
            
            REGLAS DE RESPUESTA:
            - Sé profesional pero amable.
            - Responde en Español.
            - Si te preguntan sobre el Kanban, recuérdales que es su brújula para el avance.
            - Si preguntan sobre mentorías, recuerda la "Regla de Oro": No son clases magistrales, son para desbloquear progreso técnico real.
            - Usa Markdown para dar formato si es necesario (negritas, listas).
            - Mantén las respuestas concisas y directas.
        `
    });

    try {
        const sanitizedHistory = (history || []).map(h => ({
            role: h.role === 'user' ? 'user' : 'model',
            parts: [{ text: h.parts || '' }]
        }));

        // Gemini requires the first message in history to be 'user'
        while (sanitizedHistory.length > 0 && sanitizedHistory[0].role !== 'user') {
            sanitizedHistory.shift();
        }

        const chat = model.startChat({
            history: sanitizedHistory,
            generationConfig: {
                maxOutputTokens: 1000,
                temperature: 0.7,
            }
        });

        const result = await chat.sendMessage(message);
        const responseText = result.response.text();

        return { success: true, response: responseText };
    } catch (e: unknown) {
        console.error("Gemini Support Error:", e);

        let errorMessage = "Error desconocido";
        let diagnosticInfo = "";

        if (e instanceof Error) {
            errorMessage = e.message;
            if (errorMessage.includes("fetch")) {
                diagnosticInfo = " Error de conexión con Google API. Verifica tu API Key o cuotas.";
            }
        }

        // Safe check for blockReason in response if it exists
        const errorResponse = e as { response?: { promptFeedback?: { blockReason?: string } } };
        if (errorResponse.response?.promptFeedback?.blockReason) {
            diagnosticInfo = ` Bloqueado por seguridad: ${errorResponse.response.promptFeedback.blockReason}`;
        }

        return { success: false, error: `Error en la IA: ${errorMessage.substring(0, 100)}${diagnosticInfo}` };
    }
}
