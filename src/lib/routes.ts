import { ProjectType } from "@prisma/client";

export function getProjectRoute(projectId: string, type: ProjectType | string): string {
    // Normalizar el tipo para evitar errores de case
    const normalizedType = type.toUpperCase();

    let prefix = 'projects';
    if (normalizedType === 'CHALLENGE') {
        prefix = 'challenge';
    } else if (normalizedType === 'PROBLEM') {
        prefix = 'problem';
    }

    return `/dashboard/professor/${prefix}/${projectId}`;
}
