import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('Seeding resources...');

    // 1. Create Categories
    const catReact = await prisma.resourceCategory.create({
        data: { name: 'React', color: 'bg-blue-100 text-blue-700' }
    });

    const catDesign = await prisma.resourceCategory.create({
        data: { name: 'UI Design', color: 'bg-purple-100 text-purple-700' }
    });

    const catProduct = await prisma.resourceCategory.create({
        data: { name: 'Product Management', color: 'bg-orange-100 text-orange-700' }
    });

    // 2. Create Resources
    await prisma.resource.createMany({
        data: [
            {
                title: 'React Documentation: Components',
                description: 'Official guide on how to think in React.',
                url: 'https://react.dev/learn',
                type: 'ARTICLE',
                categoryId: catReact.id
            },
            {
                title: 'Figma Auto Layout Tutorial',
                description: 'Master Flexbox logic inside Figma.',
                url: 'https://www.youtube.com/watch?v=NrWXRs5e4XL',
                type: 'VIDEO',
                categoryId: catDesign.id
            },
            {
                title: 'How to Write User Stories',
                description: 'Best practices for writing clear HUs.',
                url: 'https://www.atlassian.com/agile/project-management/user-stories',
                type: 'ARTICLE',
                categoryId: catProduct.id
            },
            {
                title: 'Tailwind CSS Cheatsheet',
                description: 'Quick reference for utility classes.',
                url: 'https://nerdcave.com/tailwind-cheat-sheet',
                type: 'FILE',
                categoryId: catReact.id
            }
        ]
    });

    console.log('Resources seeded!');
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
