import { type NextRequest, NextResponse } from "next/server"
import { generateImage } from "@/lib/gemini"

export async function POST(request: NextRequest) {
  try {
    console.log("Generate image API called")
    
    const { prompt, enhancePrompt: shouldEnhance, feature = 'text-to-image' } = await request.json()
    console.log("Request data:", { prompt, shouldEnhance, feature })

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ error: "Prompt is required and must be a string" }, { status: 400 })
    }

    let finalPrompt = prompt
    if (shouldEnhance) {
      console.log("Enhancing prompt...")
      const { enhancePrompt } = await import("@/lib/gemini")
      finalPrompt = await enhancePrompt(prompt)
      console.log("Enhanced prompt:", finalPrompt)
    }

    console.log(`Generating image with prompt for feature ${feature}:`, finalPrompt)
    const imageDataUrl = await generateImage(finalPrompt, feature)
    console.log("Image generated successfully")

    return NextResponse.json({
      imageUrl: imageDataUrl,
      prompt: finalPrompt,
      originalPrompt: prompt,
      feature,
    })
  } catch (error) {
    console.error("Error in generate-image API:", error)
    return NextResponse.json({ 
      error: "Failed to generate image", 
      details: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 })
  }
}
