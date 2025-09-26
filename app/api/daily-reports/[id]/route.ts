import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { getUserFromRequest } from '../../../utils/auth';

// GET /api/daily-reports/[id] - Get specific daily report
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const reportId = params.id;

    let whereClause: any = { id: reportId };

    if (user.userType === 'PROVIDER') {
      whereClause.providerId = user.id;
    } else if (user.userType === 'PARENT') {
      whereClause.booking = {
        parentId: user.id
      };
    }

    const report = await prisma.dailyReport.findFirst({
      where: whereClause,
      include: {
        activities: {
          orderBy: {
            startTime: 'asc'
          }
        },
        booking: {
          select: {
            id: true,
            childName: true,
            childAge: true,
            parent: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        },
        daycare: {
          select: {
            id: true,
            name: true
          }
        },
        provider: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    if (!report) {
      return NextResponse.json(
        { error: 'Daily report not found or access denied' },
        { status: 404 }
      );
    }

    // Mark as viewed by parent
    if (user.userType === 'PARENT' && !report.parentViewed) {
      await prisma.dailyReport.update({
        where: { id: reportId },
        data: {
          parentViewed: true,
          parentViewedAt: new Date()
        }
      });
    }

    return NextResponse.json({
      success: true,
      report
    });

  } catch (error: any) {
    console.error('Daily report fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch daily report' },
      { status: 500 }
    );
  }
}

// PUT /api/daily-reports/[id] - Update daily report
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || user.userType !== 'PROVIDER') {
      return NextResponse.json({ error: 'Provider access required' }, { status: 403 });
    }

    const reportId = params.id;
    const body = await request.json();
    const {
      overallMood,
      generalNotes,
      activities = []
    } = body;

    // Verify the report belongs to the provider
    const existingReport = await prisma.dailyReport.findFirst({
      where: {
        id: reportId,
        providerId: user.id
      }
    });

    if (!existingReport) {
      return NextResponse.json(
        { error: 'Daily report not found or access denied' },
        { status: 404 }
      );
    }

    // Update report and replace activities
    const updatedReport = await prisma.$transaction(async (tx) => {
      // Delete existing activities
      await tx.dailyReportActivity.deleteMany({
        where: { reportId }
      });

      // Update the report
      const report = await tx.dailyReport.update({
        where: { id: reportId },
        data: {
          overallMood,
          generalNotes,
          updatedAt: new Date()
        }
      });

      // Create new activities
      for (const activity of activities) {
        await tx.dailyReportActivity.create({
          data: {
            reportId,
            activityType: activity.activityType,
            title: activity.title,
            description: activity.description,
            startTime: new Date(activity.startTime),
            endTime: activity.endTime ? new Date(activity.endTime) : undefined,
            duration: activity.duration,
            mealType: activity.mealType,
            foodItems: activity.foodItems ? JSON.stringify(activity.foodItems) : undefined,
            amountEaten: activity.amountEaten,
            napQuality: activity.napQuality,
            photos: activity.photos ? JSON.stringify(activity.photos) : undefined,
            documents: activity.documents ? JSON.stringify(activity.documents) : undefined,
            notes: activity.notes
          }
        });
      }

      return report;
    });

    // Fetch the complete updated report
    const completeReport = await prisma.dailyReport.findUnique({
      where: { id: reportId },
      include: {
        activities: {
          orderBy: {
            startTime: 'asc'
          }
        },
        booking: {
          include: {
            parent: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        },
        daycare: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      report: completeReport
    });

  } catch (error: any) {
    console.error('Daily report update error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update daily report' },
      { status: 500 }
    );
  }
}

// DELETE /api/daily-reports/[id] - Delete daily report
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || user.userType !== 'PROVIDER') {
      return NextResponse.json({ error: 'Provider access required' }, { status: 403 });
    }

    const reportId = params.id;

    // Verify the report belongs to the provider
    const existingReport = await prisma.dailyReport.findFirst({
      where: {
        id: reportId,
        providerId: user.id
      }
    });

    if (!existingReport) {
      return NextResponse.json(
        { error: 'Daily report not found or access denied' },
        { status: 404 }
      );
    }

    // Delete the report (activities will be cascade deleted)
    await prisma.dailyReport.delete({
      where: { id: reportId }
    });

    return NextResponse.json({
      success: true,
      message: 'Daily report deleted successfully'
    });

  } catch (error: any) {
    console.error('Daily report deletion error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete daily report' },
      { status: 500 }
    );
  }
}