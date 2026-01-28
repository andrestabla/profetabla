'use server';

import { GoogleGenerativeAI } from "@google/generative-ai";
import { prisma } from '@/lib/prisma';
import { revalidatePath } from "next/cache";

export type AITask = {
    title: string;
    description: string;
    priority: 'HIGH' | 'MEDIUM' | 'LOW';
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
            ACT AS: Senior Project Manager & Agile Coach.
            
            CONTEXT:
            Project Title: "${project.title}"
            Description: "${project.description || 'N/A'}"
            Objectives: "${project.objectives || 'N/A'}"
            Methodology: "${project.methodology || 'N/A'}"
            Deliverables: "${project.deliverables || 'N/A'}"

            TASK:
            Break down this project into 5 to 8 concrete, actionable, and essential tasks for the initial phase.
            These tasks will be added to a Kanban board in the "TODO" column.
            
            OUTPUT FORMAT (JSON ONLY, NO MARKDOWN):
            [
                {
                    "title": "Short, action-oriented title (max 50 chars)",
                    "description": "Clear instruction of what needs to be done.",
                    "priority": "HIGH" | "MEDIUM" | "LOW"
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

        let aiTasks: AITask[] = [];
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
        await prisma.task.createMany({
            data: aiTasks.map(t => ({
                title: t.title,
                description: t.description,
                priority: t.priority,
                status: 'TODO',
                projectId: projectId,
                createdAt: new Date(),
                updatedAt: new Date()
            }))
        });

        revalidatePath(`/dashboard/professor/projects/${projectId}/kanban`);
        return { success: true, count: aiTasks.length };

    } catch (error) {
        console.error("Error generating tasks:", error);
        return { success: false, error: "Error interno del servidor" };
    }
}
