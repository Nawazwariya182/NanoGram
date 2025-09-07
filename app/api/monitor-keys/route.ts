import { type NextRequest, NextResponse } from "next/server"
import { getApiKeyUsageStats, getApiKeySystemStatus, resetApiKey } from "@/lib/gemini"

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const action = url.searchParams.get('action')

    switch (action) {
      case 'stats':
        const stats = getApiKeyUsageStats()
        return NextResponse.json({ 
          success: true, 
          data: stats,
          timestamp: new Date().toISOString()
        })
      
      case 'status':
        const status = getApiKeySystemStatus()
        return NextResponse.json({ 
          success: true, 
          data: status,
          timestamp: new Date().toISOString()
        })
      
      default:
        // Return both stats and status by default
        const allStats = getApiKeyUsageStats()
        const systemStatus = getApiKeySystemStatus()
        return NextResponse.json({ 
          success: true, 
          data: {
            system: systemStatus,
            keys: allStats
          },
          timestamp: new Date().toISOString()
        })
    }
  } catch (error) {
    console.error("Error in API key monitoring:", error)
    return NextResponse.json({ 
      success: false,
      error: "Failed to get API key statistics",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, keyName } = await request.json()

    if (action === 'reset' && keyName) {
      const success = resetApiKey(keyName)
      return NextResponse.json({ 
        success,
        message: success 
          ? `API key ${keyName} rate limit has been reset` 
          : `API key ${keyName} was not rate limited or doesn't exist`,
        timestamp: new Date().toISOString()
      })
    }

    return NextResponse.json({ 
      success: false,
      error: "Invalid action or missing keyName"
    }, { status: 400 })
  } catch (error) {
    console.error("Error in API key management:", error)
    return NextResponse.json({ 
      success: false,
      error: "Failed to manage API key",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}