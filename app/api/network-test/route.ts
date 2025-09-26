import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  const results: any = {
    environment: {
      nodeEnv: process.env.NODE_ENV,
      platform: process.platform,
      runtime: 'nodejs'
    },
    tests: []
  }

  try {
    console.log('=== NETWORK DIAGNOSTICS ===')

    // Test 1: DNS Resolution
    try {
      console.log('Testing DNS resolution...')
      const { stdout: digOutput } = await execAsync('dig db.nbrnulspgunxsrjcccnl.supabase.co +short')
      results.tests.push({
        test: 'DNS Resolution (dig)',
        command: 'dig db.nbrnulspgunxsrjcccnl.supabase.co +short',
        success: true,
        output: digOutput.trim(),
        note: 'DNS resolution successful'
      })
      console.log('✓ DNS resolution successful:', digOutput.trim())
    } catch (digError: any) {
      results.tests.push({
        test: 'DNS Resolution (dig)',
        command: 'dig db.nbrnulspgunxsrjcccnl.supabase.co +short',
        success: false,
        error: digError.message,
        note: 'DNS resolution failed - dig command not available'
      })
      console.log('✗ DNS resolution failed:', digError.message)

      // Fallback: Try nslookup
      try {
        const { stdout: nslookupOutput } = await execAsync('nslookup db.nbrnulspgunxsrjcccnl.supabase.co')
        results.tests.push({
          test: 'DNS Resolution (nslookup)',
          command: 'nslookup db.nbrnulspgunxsrjcccnl.supabase.co',
          success: true,
          output: nslookupOutput.trim(),
          note: 'DNS resolution via nslookup successful'
        })
      } catch (nslookupError: any) {
        results.tests.push({
          test: 'DNS Resolution (nslookup)',
          command: 'nslookup db.nbrnulspgunxsrjcccnl.supabase.co',
          success: false,
          error: nslookupError.message,
          note: 'DNS resolution via nslookup failed'
        })
      }
    }

    // Test 2: Port Connectivity
    try {
      console.log('Testing port connectivity...')
      const { stdout: ncOutput } = await execAsync('nc -vz db.nbrnulspgunxsrjcccnl.supabase.co 5432', { timeout: 10000 })
      results.tests.push({
        test: 'Port Connectivity (nc)',
        command: 'nc -vz db.nbrnulspgunxsrjcccnl.supabase.co 5432',
        success: true,
        output: ncOutput.trim(),
        note: 'Port 5432 is reachable'
      })
      console.log('✓ Port connectivity successful:', ncOutput.trim())
    } catch (ncError: any) {
      results.tests.push({
        test: 'Port Connectivity (nc)',
        command: 'nc -vz db.nbrnulspgunxsrjcccnl.supabase.co 5432',
        success: false,
        error: ncError.message,
        note: 'Port 5432 is not reachable or nc command failed'
      })
      console.log('✗ Port connectivity failed:', ncError.message)

      // Fallback: Try telnet
      try {
        const { stdout: telnetOutput } = await execAsync('echo quit | telnet db.nbrnulspgunxsrjcccnl.supabase.co 5432', { timeout: 10000 })
        results.tests.push({
          test: 'Port Connectivity (telnet)',
          command: 'telnet db.nbrnulspgunxsrjcccnl.supabase.co 5432',
          success: true,
          output: telnetOutput.trim(),
          note: 'Port connectivity via telnet successful'
        })
      } catch (telnetError: any) {
        results.tests.push({
          test: 'Port Connectivity (telnet)',
          command: 'telnet db.nbrnulspgunxsrjcccnl.supabase.co 5432',
          success: false,
          error: telnetError.message,
          note: 'Port connectivity via telnet failed'
        })
      }
    }

    // Test 3: Node.js Socket Connection
    try {
      console.log('Testing Node.js socket connection...')
      const net = require('net')

      const socketTest = await new Promise<string>((resolve, reject) => {
        const socket = new net.Socket()
        const timeout = setTimeout(() => {
          socket.destroy()
          reject(new Error('Socket connection timeout'))
        }, 10000)

        socket.connect(5432, 'db.nbrnulspgunxsrjcccnl.supabase.co', () => {
          clearTimeout(timeout)
          socket.destroy()
          resolve('Socket connection successful')
        })

        socket.on('error', (error: any) => {
          clearTimeout(timeout)
          reject(error)
        })
      })

      results.tests.push({
        test: 'Node.js Socket Connection',
        command: 'net.Socket.connect(5432, hostname)',
        success: true,
        output: socketTest,
        note: 'Raw socket connection successful'
      })
      console.log('✓ Socket connection successful')
    } catch (socketError: any) {
      results.tests.push({
        test: 'Node.js Socket Connection',
        command: 'net.Socket.connect(5432, hostname)',
        success: false,
        error: socketError.message,
        note: 'Raw socket connection failed'
      })
      console.log('✗ Socket connection failed:', socketError.message)
    }

    console.log('=== DIAGNOSTICS COMPLETE ===')

    return NextResponse.json({
      status: 'diagnostics_complete',
      message: 'Network diagnostics completed',
      summary: {
        totalTests: results.tests.length,
        successfulTests: results.tests.filter((t: any) => t.success).length,
        failedTests: results.tests.filter((t: any) => !t.success).length
      },
      ...results
    })

  } catch (error: any) {
    console.error('=== DIAGNOSTICS FAILED ===', error)
    return NextResponse.json({
      status: 'error',
      message: 'Network diagnostics failed',
      error: error.message,
      ...results
    }, { status: 500 })
  }
}