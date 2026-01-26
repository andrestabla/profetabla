'use server';

import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function createLearningObjectAction(formData: FormData) {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'TEACHER') {
        throw new Error('Unauthorized');
    }

    const projectId = formData.get('projectId') as string;
    const title = formData.get('title') as string;
    const subject = formData.get('subject') as string;
    const competency = formData.get('competency') as string;

    // Extract items from FormData. 
    // Since we have a dynamic list of items, we expect inputs named item[index][field]
    // Or we can parse a JSON string if we hidden input it.
    // For simplicity here, let's assume valid JSON passed in a hidden field 'itemsJson'
    const itemsJson = formData.get('itemsJson') as string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const items = JSON.parse(itemsJson) as any[];

    await prisma.$transaction(async (tx) => {
        // 1. Create the OA Container
        const lo = await tx.learningObject.create({
            data: {
                title,
                subject,
                competency,
                keywords: [], // Can implement tags input later
                authorId: session.user.id,
                // Connect to the project immediately
                projects: {
                    connect: { id: projectId }
                }
            }
        });

        // 2. Create the Items
        if (items && items.length > 0) {
            await tx.resourceItem.createMany({
                data: items.map((item, index) => ({
                    title: item.title,
                    type: item.type,
                    url: item.url,
                    order: index,
                    learningObjectId: lo.id
                }))
            });
        }
    });

    redirect(`/dashboard/professor/projects/${projectId}`);
}
