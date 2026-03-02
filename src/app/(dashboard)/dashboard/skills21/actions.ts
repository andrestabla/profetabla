'use server';

import { getServerSession } from 'next-auth';
import { revalidatePath } from 'next/cache';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logActivity } from '@/lib/activity';

type CreateSkillPayload = {
    name: string;
    industry: string;
    category?: string;
    description: string;
    trendSummary?: string;
    examplesText?: string;
    sourcesText?: string;
    tagsText?: string;
};

function parseList(text?: string) {
    return (text || '')
        .split('\n')
        .map((item) => item.trim())
        .filter(Boolean);
}

function parseSources(text?: string) {
    const lines = parseList(text);
    const sources: Array<{ title: string; url: string }> = [];

    for (const line of lines) {
        const [left, right] = line.includes('|')
            ? line.split('|', 2)
            : [line, line];

        const title = left.trim();
        const url = right.trim();

        try {
            const parsed = new URL(url);
            sources.push({
                title: title || parsed.hostname,
                url: parsed.toString(),
            });
        } catch {
            // Ignore invalid lines instead of breaking skill creation.
        }
    }

    return sources;
}

export async function createTwentyFirstSkillAction(payload: CreateSkillPayload) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !['TEACHER', 'ADMIN'].includes(session.user.role)) {
            return { success: false, error: 'No autorizado' };
        }

        const name = payload.name?.trim();
        const industry = payload.industry?.trim();
        const description = payload.description?.trim();

        if (!name || !industry || !description) {
            return { success: false, error: 'Nombre, industria y descripción son obligatorios.' };
        }

        const category = payload.category?.trim() || null;
        const trendSummary = payload.trendSummary?.trim() || null;
        const examples = parseList(payload.examplesText);
        const tags = parseList(payload.tagsText).map((tag) => tag.toLowerCase());
        const sources = parseSources(payload.sourcesText);

        const created = await prisma.twentyFirstSkill.create({
            data: {
                name,
                industry,
                category,
                description,
                trendSummary,
                examples,
                tags,
                sources: sources.length > 0 ? sources : undefined,
            },
        });

        await logActivity(
            session.user.id,
            'CREATE_21C_SKILL',
            `Creó la habilidad "${created.name}" para industria "${created.industry}"`,
            'INFO',
            {
                skillId: created.id,
                industry: created.industry,
                category: created.category,
            }
        );

        revalidatePath('/dashboard/skills21');
        revalidatePath('/dashboard/professor/projects/new');
        revalidatePath('/dashboard/professor/challenges/new');
        revalidatePath('/dashboard/professor/problems/new');
        return { success: true, skillId: created.id };
    } catch (error) {
        console.error('[createTwentyFirstSkillAction] error:', error);
        return { success: false, error: 'No se pudo crear la habilidad.' };
    }
}

export async function toggleTwentyFirstSkillStatusAction(skillId: string, nextState: boolean) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !['TEACHER', 'ADMIN'].includes(session.user.role)) {
            return { success: false, error: 'No autorizado' };
        }

        const updated = await prisma.twentyFirstSkill.update({
            where: { id: skillId },
            data: { isActive: nextState },
            select: { id: true, name: true, isActive: true }
        });

        await logActivity(
            session.user.id,
            'UPDATE_21C_SKILL_STATUS',
            `${updated.isActive ? 'Activó' : 'Desactivó'} la habilidad "${updated.name}"`,
            'INFO',
            { skillId: updated.id, isActive: updated.isActive }
        );

        revalidatePath('/dashboard/skills21');
        revalidatePath('/dashboard/professor/projects/new');
        revalidatePath('/dashboard/professor/challenges/new');
        revalidatePath('/dashboard/professor/problems/new');
        return { success: true };
    } catch (error) {
        console.error('[toggleTwentyFirstSkillStatusAction] error:', error);
        return { success: false, error: 'No se pudo actualizar el estado.' };
    }
}

