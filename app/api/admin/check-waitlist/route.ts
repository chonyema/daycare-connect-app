import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

export async function GET() {
  try {
    const entries = await prisma.waitlistEntry.findMany({
      include: {
        parent: {
          select: { name: true, email: true }
        },
        daycare: {
          select: { name: true }
        },
        program: {
          select: { name: true }
        }
      },
      orderBy: {
        joinedAt: 'desc'
      }
    });

    const summary = {
      totalEntries: entries.length,
      entriesWithProgram: entries.filter(e => e.programId !== null).length,
      entriesWithoutProgram: entries.filter(e => e.programId === null).length,
      entriesByStatus: {
        ACTIVE: entries.filter(e => e.status === 'ACTIVE').length,
        PAUSED: entries.filter(e => e.status === 'PAUSED').length,
        ENROLLED: entries.filter(e => e.status === 'ENROLLED').length,
        OFFERED: entries.filter(e => e.status === 'OFFERED').length,
      },
      entries: entries.map(e => ({
        id: e.id,
        childName: e.childName,
        parentName: e.parent?.name,
        daycareName: e.daycare?.name,
        programName: e.program?.name || 'No program',
        status: e.status,
        position: e.position,
        joinedAt: e.joinedAt,
        hasProgramId: !!e.programId
      }))
    };

    return NextResponse.json({
      success: true,
      data: summary
    });
  } catch (error: any) {
    console.error('Check waitlist error:', error);
    return NextResponse.json(
      { error: 'Failed to check waitlist', details: error.message },
      { status: 500 }
    );
  }
}
