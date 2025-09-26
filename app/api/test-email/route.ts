import { NextRequest, NextResponse } from "next/server"
import { emailService } from "../../utils/email"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function GET(request: NextRequest) {
  try {
    console.log("=== EMAIL TEST ===")

    // Check environment variables
    const emailConfig = {
      SMTP_HOST: process.env.SMTP_HOST,
      SMTP_PORT: process.env.SMTP_PORT,
      SMTP_USER: process.env.SMTP_USER,
      hasPassword: \!\!process.env.SMTP_PASS,
      passwordLength: process.env.SMTP_PASS?.length || 0
    }

    console.log("Email config:", emailConfig)

    return NextResponse.json({
      status: "success",
      message: "Email configuration check",
      emailConfig,
      timestamp: new Date().toISOString()
    })

  } catch (error: any) {
    console.error("=== EMAIL TEST FAILED ===")
    console.error("Error:", error.message)

    return NextResponse.json({
      status: "error",
      message: "Email test failed",
      error: error.message
    }, { status: 500 })
  }
}
