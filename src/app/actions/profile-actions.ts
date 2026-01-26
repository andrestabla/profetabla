'use server';

import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

// 1. Actualizar Perfil Básico (Bio, Edad, Intereses)
export async function updateBasicProfileAction(formData: FormData) {
    const session = await getServerSession(authOptions);
    if (!session) return;

    const bio = formData.get('bio') as string;
    const age = formData.get('age') ? parseInt(formData.get('age') as string) : null;
    const interestsString = formData.get('interests') as string; // "React, Java, Futbol"

    // Convertir string de intereses a Array limpio
    const interests = interestsString ? interestsString.split(',').map(s => s.trim()).filter(s => s !== "") : [];

    await prisma.user.update({
        where: { id: session.user.id },
        data: { bio, age, interests }
    });

    revalidatePath('/dashboard/profile');
}

// 2. Agregar Experiencia Laboral
export async function addExperienceAction(formData: FormData) {
    const session = await getServerSession(authOptions);
    if (!session) return;

    await prisma.workExperience.create({
        data: {
            userId: session.user.id,
            position: formData.get('position') as string,
            company: formData.get('company') as string,
            startDate: new Date(formData.get('startDate') as string),
            // Si endDate viene vacío, asumimos que es el trabajo actual (null)
            endDate: formData.get('endDate') ? new Date(formData.get('endDate') as string) : null,
            description: formData.get('description') as string,
        }
    });

    revalidatePath('/dashboard/profile');
}

// 3. Agregar Estudio
export async function addEducationAction(formData: FormData) {
    const session = await getServerSession(authOptions);
    if (!session) return;

    await prisma.education.create({
        data: {
            userId: session.user.id,
            institution: formData.get('institution') as string,
            degree: formData.get('degree') as string,
            fieldOfStudy: formData.get('fieldOfStudy') as string,
            startDate: new Date(formData.get('startDate') as string),
            endDate: formData.get('endDate') ? new Date(formData.get('endDate') as string) : null,
        }
    });

    revalidatePath('/dashboard/profile');
}

// 4. Agregar Idioma
export async function addLanguageAction(formData: FormData) {
    const session = await getServerSession(authOptions);
    if (!session) return;

    await prisma.language.create({
        data: {
            userId: session.user.id,
            name: formData.get('name') as string,
            level: formData.get('level') as string,
        }
    });

    revalidatePath('/dashboard/profile');
}
