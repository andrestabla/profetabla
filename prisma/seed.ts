import { PrismaClient, Role, TaskStatus } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Create Admin
  const admin = await prisma.user.upsert({
    where: { email: 'admin@profetabla.com' },
    update: {},
    create: {
      email: 'admin@profetabla.com',
      password: 'admin',
      name: 'Admin User',
      role: Role.ADMIN,
    },
  })

  // Create Teacher
  const teacher = await prisma.user.upsert({
    where: { email: 'profe@profetabla.com' },
    update: {},
    create: {
      email: 'profe@profetabla.com',
      password: 'profe',
      name: 'Profesor Ejemplo',
      role: Role.TEACHER,
    },
  })

  // Create Student
  const student = await prisma.user.upsert({
    where: { email: 'estudiante@profetabla.com' },
    update: {},
    create: {
      email: 'estudiante@profetabla.com',
      password: 'student',
      name: 'Estudiante Demo',
      role: Role.STUDENT,
    },
  })

  // Create Project for Student
  const project = await prisma.project.create({
    data: {
      title: 'Sistema de Gestión Escolar',
      description: 'Proyecto final de curso para gestionar notas.',
      teachers: { connect: { id: teacher.id } },
      students: { connect: { id: student.id } },
      status: 'IN_PROGRESS',
      tasks: {
        create: [
          { title: 'Investigar requisitos', status: TaskStatus.DONE },
          { title: 'Diseñar base de datos', status: TaskStatus.IN_PROGRESS },
          { title: 'Implementar API', status: TaskStatus.TODO },
        ],
      },
    },
  })

  console.log({ admin, teacher, student, project })
  console.log('Seeding finished.')
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
