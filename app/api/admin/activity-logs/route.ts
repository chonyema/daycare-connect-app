import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { requireSuperAdmin } from '@/app/lib/rbac/authorization';

// GET - Get activity logs with filtering
export async function GET(request: NextRequest) {
  const authCheck = await requireSuperAdmin(request);

  if (!authCheck.authorized) {
    return NextResponse.json(
      { error: authCheck.error },
      { status: 401 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const entity = searchParams.get('entity');
    const action = searchParams.get('action');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    const whereClause: any = {};

    if (userId) whereClause.userId = userId;
    if (entity) whereClause.entity = entity;
    if (action) whereClause.action = action;

    const [logs, total] = await Promise.all([
      prisma.activityLog.findMany({
        where: whereClause,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.activityLog.count({ where: whereClause }),
    ]);

    return NextResponse.json({
      success: true,
      logs,
      total,
      limit,
      offset,
    });
  } catch (error: any) {
    console.error('Get activity logs error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch activity logs', details: error.message },
      { status: 500 }
    );
  }
}
