// Test database connection
const { PrismaClient } = require('@prisma/client');

async function testConnection() {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: "postgresql://postgres.uyjzthqbnmsessyebaoz:B8hJZnfA7sR%26tn%2F@aws-1-us-east-1.pooler.supabase.com:5432/postgres"
      }
    }
  });

  try {
    console.log('🔍 Testing database connection...');

    // Test basic connection
    await prisma.$connect();
    console.log('✅ Connected to database successfully!');

    // Test table existence
    const userCount = await prisma.user.count();
    console.log(`👥 Users table exists. Count: ${userCount}`);

    const daycareCount = await prisma.daycare.count();
    console.log(`🏢 Daycares table exists. Count: ${daycareCount}`);

    // Try to fetch some daycares
    const daycares = await prisma.daycare.findMany({
      take: 3,
      select: { id: true, name: true, city: true }
    });

    console.log('📋 Sample daycares:');
    daycares.forEach((daycare, index) => {
      console.log(`  ${index + 1}. ${daycare.name} (${daycare.city})`);
    });

    if (daycares.length === 0) {
      console.log('⚠️  No daycares found in database - database is empty');
    }

  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();