// Debug script to check users in database
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugUsers() {
  try {
    console.log('🔍 Checking users in database...\n');

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        userType: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    console.log(`Found ${users.length} users:`);
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.userType} - ${user.name} (${user.email})`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Created: ${user.createdAt}`);
      console.log('');
    });

    // Check for any daycares and their owners
    const daycares = await prisma.daycare.findMany({
      select: {
        id: true,
        name: true,
        ownerId: true,
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            userType: true
          }
        }
      }
    });

    console.log(`Found ${daycares.length} daycares:`);
    daycares.forEach((daycare, index) => {
      console.log(`${index + 1}. ${daycare.name}`);
      console.log(`   Daycare ID: ${daycare.id}`);
      console.log(`   Owner ID: ${daycare.ownerId}`);
      console.log(`   Owner: ${daycare.owner.name} (${daycare.owner.userType})`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugUsers();