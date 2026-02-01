import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkData() {
    console.log('🔍 Checking database integrity...');

    const userCount = await prisma.user.count();
    const projectCount = await prisma.project.count();
    const config = await prisma.platformConfig.findUnique({ where: { id: 'global-config' } });

    console.log('---------------------------------');
    console.log(`👤 Users found: ${userCount}`);
    console.log(`📁 Projects found: ${projectCount}`);
    console.log(`⚙️ Global Config: ${config ? '✅ FOUND' : '❌ MISSING (App will use defaults)'}`);

    if (config) {
        console.log(`   Institution: ${config.institutionName}`);
        console.log(`   AI Provider: ${config.aiProvider}`);
    }
    console.log('---------------------------------');

    if (userCount > 1 && projectCount > 0) {
        console.log('✨ Data looks RESTORED! You can now verify the mentorship features.');
    } else {
        console.log('⚠️ Data still appears to be empty. Please follow the Recovery Guide.');
    }
}

checkData()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
