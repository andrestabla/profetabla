'use server';

import { GoogleGenerativeAI } from "@google/generative-ai";
import { prisma } from '@/lib/prisma';
import { revalidatePath } from "next/cache";

export type AITask = {
    title: string;
    description: string;
    priority: 'HIGH' | 'MEDIUM' | 'LOW';
    deliverable: string;
    evaluationCriteria: string;
};

export async function generateTasksFromProject(projectId: string): Promise<{ success: boolean; count?: number; error?: string }> {
    try {
        // 1. Fetch Project Context
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            select: {
                title: true,
                description: true,
                objectives: true,
                methodology: true,
                deliverables: true
            }
        });

        if (!project) return { success: false, error: "Proyecto no encontrado" };

        // 2. Initial Config (API Key & Model)
        const config = await prisma.platformConfig.findUnique({ where: { id: 'global-config' } });
        const apiKey = config?.geminiApiKey || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

        if (!apiKey) {
            return { success: false, error: "API Key de IA no configurada" };
        }

        const genAI = new GoogleGenerativeAI(apiKey);

        // 3. Construct Prompt
        const prompt = `
            ROL: Senior Project Manager & Agile Coach (Español).
            
            CONTEXTO DEL PROYECTO:
            Título: "${project.title}"
            Descripción: "${project.description || 'N/A'}"
            Objetivos: "${project.objectives || 'N/A'}"
            Metodología: "${project.methodology || 'N/A'}"
            Entregables Generales: "${project.deliverables || 'N/A'}"

            TAREA:
            Desglosa este proyecto en 5 a 8 tareas esenciales, accionables y concretas para la fase inicial.
            Estas tareas irán al tablero Kanban en "Por Hacer". TODA LA SALIDA DEBE SER EN ESPAÑOL.
            
            FORMATO DE SALIDA (JSON ÚNICAMENTE):
            [
                {
                    "title": "Título corto y orientado a la acción (máx 50 caracteres)",
                    "description": "Instrucción clara de qué hacer.",
                    "priority": "HIGH" | "MEDIUM" | "LOW",
                    "deliverable": "El producto tangible de esta tarea (ej: Documento PDF, Diagrama)",
                    "allowedFileTypes": ["PDF", "URL", "DOC", "PPTX", "XLS"], // Array de strings. Elegir 1 o más según el entregable.
                    "rubric": [
                        { "criterion": "Criterio 1", "maxPoints": 10 },
                        { "criterion": "Criterio 2", "maxPoints": 10 }
                    ]
                }
            ]
        `;

        // 4. Model Selection & Execution (Fallback Logic)
        const configModel = config?.geminiModel === 'gemini-pro' ? 'gemini-1.5-flash' : (config?.geminiModel || 'gemini-1.5-flash');
        const candidateModels = [
            configModel,
            "gemini-2.0-flash",
            "gemini-1.5-flash",
            "gemini-1.5-pro",
            "gemini-1.0-pro"
        ];
        const uniqueModels = Array.from(new Set(candidateModels));

        /* eslint-disable @typescript-eslint/no-explicit-any */
        let aiTasks: any[] = [];
        let successInfo = false;

        for (const modelName of uniqueModels) {
            if (successInfo) break;
            if (!modelName) continue;

            try {
                const model = genAI.getGenerativeModel({ model: modelName });
                const result = await model.generateContent(prompt);
                const response = await result.response;
                const text = response.text();

                // Clean JSON
                const jsonString = text.replace(/```json/g, '').replace(/```/g, '').trim();
                const firstBracket = jsonString.indexOf('[');
                const lastBracket = jsonString.lastIndexOf(']');

                if (firstBracket !== -1 && lastBracket !== -1) {
                    const cleanJson = jsonString.substring(firstBracket, lastBracket + 1);
                    aiTasks = JSON.parse(cleanJson);
                    successInfo = true;
                }
            } catch (e) {
                console.warn(`Failed with model ${modelName}`, e);
            }
        }

        if (!successInfo || aiTasks.length === 0) {
            return { success: false, error: "No se pudieron generar tareas. Intenta de nuevo." };
        }

        // 5. Save Tasks to DB
        // 5. Save Tasks to DB (Iterative to allow nested Assignment creation)
        await Promise.all(aiTasks.map(t =>
            prisma.task.create({
                data: {
                    title: t.title,
                    description: t.description,
                    priority: t.priority,
                    deliverable: t.deliverable || null,
                    evaluationCriteria: t.rubric ? t.rubric.map((r: any) => `- ${r.criterion}`).join('\n') : null,
                    rubric: t.rubric || undefined,
                    allowedFileTypes: t.allowedFileTypes || [],
                    status: 'TODO',
                    projectId: projectId,
                    isMandatory: true,
                    // If deliverable exists, create assignment
                    ...(t.deliverable ? {
                        assignment: {
                            create: {
                                title: `Entrega: ${t.title}`,
                                description: `Entrega generada por IA para: ${t.title}`,
                                projectId: projectId,
                                evaluationCriteria: t.rubric ? t.rubric.map((r: any) => `- ${r.criterion}`).join('\n') : null,
                                rubricItems: t.rubric ? {
                                    create: t.rubric.map((r: any, idx: number) => ({
                                        criterion: r.criterion,
                                        maxPoints: r.maxPoints || 10,
                                        order: idx
                                    }))
                                } : undefined
                            }
                        }
                    } : {})
                }
            })
        ));

        revalidatePath(`/dashboard/professor/projects/${projectId}/kanban`);
        return { success: true, count: aiTasks.length };

    } catch (error) {
        console.error("Error generating tasks:", error);
        return { success: false, error: "Error interno del servidor" };
    }
}
