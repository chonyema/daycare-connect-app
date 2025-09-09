import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Testing database connection...')
  
  // Try creating one simple user
  const user = await prisma.user.create({
    data: {
      email: 'test@example.com',
      name: 'Test User',
      userType: 'PARENT',
    },
  })
  
  console.log('Created user:', user)
  
  // Count users
  const userCount = await prisma.user.count()
  console.log('Total users:', userCount)
}

main()
  .catch((e) => {
    console.error('Error:', e)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })