import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding mentorship data...');

    // 1. Get or Create a Teacher
    let teacher = await prisma.user.findFirst({ where: { role: 'TEACHER' } });
    if (!teacher) {
        teacher = await prisma.user.create({
            data: {
                name: 'Profesor de Prueba',
                email: 'profesor@test.com',
                role: 'TEACHER',
                isActive: true,
                password: 'dummy-password'
            }
        });
    }

    // 2. Create a Student
    let student = await prisma.user.findFirst({ where: { role: 'STUDENT' } });
    if (!student) {
        student = await prisma.user.create({
            data: {
                name: 'Estudiante de Prueba',
                email: 'estudiante@test.com',
                role: 'STUDENT',
                isActive: true,
                password: 'dummy-password'
            }
        });
    }

    // 3. Create a Project
    const project = await prisma.project.create({
        data: {
            title: 'Proyecto de Prueba Mentoría',
            description: 'Un proyecto para probar las nuevas funciones de mentoría.',
            status: 'IN_PROGRESS',
            type: 'PROJECT',
            teachers: { connect: { id: teacher.id } },
            students: { connect: { id: student.id } }
        }
    });

    // 4. Create some tasks for the project (need at least 3 for booking)
    await prisma.task.createMany({
        data: [
            { title: 'Tarea 1', status: 'TODO', priority: 'MEDIUM', projectId: project.id },
            { title: 'Tarea 2', status: 'IN_PROGRESS', priority: 'HIGH', projectId: project.id },
            { title: 'Tarea 3', status: 'DONE', priority: 'LOW', projectId: project.id },
        ]
    });

    // 5. Create some mentorship slots
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);

    const afterTomorrow = new Date(now);
    afterTomorrow.setDate(now.getDate() + 2);
    afterTomorrow.setHours(14, 0, 0, 0);

    await prisma.mentorshipSlot.createMany({
        data: [
            {
                teacherId: teacher.id,
                startTime: tomorrow,
                endTime: new Date(tomorrow.getTime() + 60 * 60 * 1000),
                isBooked: false,
                meetingUrl: 'https://meet.google.com/test-slot-1'
            },
            {
                teacherId: teacher.id,
                startTime: afterTomorrow,
                endTime: new Date(afterTomorrow.getTime() + 60 * 60 * 1000),
                isBooked: false,
                meetingUrl: 'https://meet.google.com/test-slot-2'
            }
        ]
    });

    console.log('✅ Seeding complete.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
