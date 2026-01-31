
import { prisma } from '@/lib/prisma';

async function main() {
    const email = 'digitalmaturity360@gmail.com';
    console.log(`🔍 Checking application status for ${email}...`);

    const user = await prisma.user.findUnique({
        where: { email }
    });

    if (!user) {
        console.log("❌ User not found");
        return;
    }

    const apps = await prisma.projectApplication.findMany({
        where: { studentId: user.id },
        include: { project: true }
    });

    console.log(`Found ${apps.length} applications:`);
    apps.forEach(app => {
        console.log(`- Project: ${app.project.title}`);
        console.log(`  Status: ${app.status}`);
        console.log(`  Updated At: ${app.updatedAt.toISOString()}`); // Important: Check if this matches the user's test time
    });
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
