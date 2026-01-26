import { PrismaClient, Role } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('Seeding demo users...');

    // 1. Admin
    const admin = await prisma.user.upsert({
        where: { email: 'andrestablarico@gmail.com' },
        update: {},
        create: {
            email: 'andrestablarico@gmail.com',
            name: 'Andrés Tabla (Admin)',
            password: 'admin', // Simple password for demo
            role: 'ADMIN',
            avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Andres'
        },
    });
    console.log('Admin created:', admin.email);

    // 2. Professor
    const teacher = await prisma.user.upsert({
        where: { email: 'profesor@demo.com' },
        update: {},
        create: {
            email: 'profesor@demo.com',
            name: 'Profesor Demo',
            password: 'profe',
            role: 'TEACHER',
            avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Profe'
        },
    });
    console.log('Teacher created:', teacher.email);

    // 3. Student
    const student = await prisma.user.upsert({
        where: { email: 'estudiante@demo.com' },
        update: {},
        create: {
            email: 'estudiante@demo.com',
            name: 'Estudiante Demo',
            password: 'estudiante',
            role: 'STUDENT',
            avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix'
        },
    });
    console.log('Student created:', student.email);
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
