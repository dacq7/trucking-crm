require('dotenv').config()

const bcrypt = require('bcryptjs')

const prisma = require('../src/prisma')

async function main() {
  const name = 'Administrador'
  const email = 'admin@trucking.com'
  const password = 'Admin1234!'

  const existing = await prisma.user.findUnique({
    where: { email },
  })

  if (existing) {
    console.log('Seed: el usuario administrador ya existe, se omite.')
    return
  }

  const passwordHash = await bcrypt.hash(password, 10)

  await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      role: 'ADMIN',
      mustChangePassword: false,
    },
  })

  console.log('Seed: usuario administrador creado.')
}

main()
  .catch((err) => {
    console.error('Seed falló:', err)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

