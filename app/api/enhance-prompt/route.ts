import { type NextRequest, NextResponse } from "next/server"
import { enhancePrompt } from "@/lib/gemini"

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json()

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ error: "Prompt is required and must be a string" }, { status: 400 })
    }

    const enhancedPrompt = await enhancePrompt(prompt)

    return NextResponse.json({
      originalPrompt: prompt,
      enhancedPrompt,
    })
  } catch (error) {
    console.error("Error in enhance-prompt API:", error)
    return NextResponse.json({ error: "Failed to enhance prompt" }, { status: 500 })
  }
}
