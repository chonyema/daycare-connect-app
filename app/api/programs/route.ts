import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { getUserFromRequest } from '@/app/utils/auth';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const daycareId = searchParams.get('daycareId');

    if (!daycareId) {
      return NextResponse.json(
        { error: 'daycareId is required' },
        { status: 400 }
      );
    }

    const programs = await prisma.program.findMany({
      where: {
        daycareId,
        isActive: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json({
      success: true,
      programs,
    });
  } catch (error: any) {
    console.error('Programs fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch programs' },
      { status: 500 }
    );
  }
}
