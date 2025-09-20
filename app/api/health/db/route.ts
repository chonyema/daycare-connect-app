import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

export async function GET() {
  try {
    const startTime = Date.now();

    // Test basic connection
    await prisma.$queryRaw`SELECT 1 as test`;

    const connectionTime = Date.now() - startTime;

    // Test actual table access
    const userCount = await prisma.user.count();
    const daycareCount = await prisma.daycare.count();

    const totalTime = Date.now() - startTime;

    return NextResponse.json({
      status: 'healthy',
      database: 'connected',
      connectionTime: `${connectionTime}ms`,
      totalTime: `${totalTime}ms`,
      stats: {
        users: userCount,
        daycares: daycareCount
      },
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Database health check failed:', error);

    return NextResponse.json({
      status: 'unhealthy',
      database: 'disconnected',
      error: error.message,
      code: error.code,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}