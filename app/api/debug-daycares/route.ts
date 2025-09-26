import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    console.log('=== DAYCARE DEBUG ===')

    // Get all daycares from database
    const daycares = await prisma.daycare.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            userType: true
          }
        }
      }
    })

    console.log(`Found ${daycares.length} daycares in database`)

    // Get user count
    const userCount = await prisma.user.count()
    const providerCount = await prisma.user.count({
      where: { userType: 'PROVIDER' }
    })

    console.log(`Found ${userCount} total users, ${providerCount} providers`)

    return NextResponse.json({
      status: 'success',
      message: 'Daycare data retrieved',
      summary: {
        totalDaycares: daycares.length,
        totalUsers: userCount,
        totalProviders: providerCount
      },
      daycares: daycares.map(daycare => ({
        id: daycare.id,
        name: daycare.name,
        type: daycare.type,
        address: daycare.address,
        city: daycare.city,
        province: daycare.province,
        capacity: daycare.capacity,
        currentOccupancy: daycare.currentOccupancy,
        dailyRate: daycare.dailyRate,
        verified: daycare.verified,
        active: daycare.active,
        createdAt: daycare.createdAt,
        owner: daycare.owner,
        ownerId: daycare.ownerId
      }))
    })

  } catch (error: any) {
    console.error('=== DAYCARE DEBUG FAILED ===')
    console.error('Error:', error.message)

    return NextResponse.json({
      status: 'error',
      message: 'Failed to retrieve daycare data',
      error: error.message,
      code: error.code
    }, { status: 500 })
  }
}