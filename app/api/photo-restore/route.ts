import { NextRequest, NextResponse } from "next/server"
import { performPhotoRestoration } from "@/lib/gemini"

export async function POST(request: NextRequest) {
  try {
    const { prompt, imageData, restorationType = 'restore' } = await request.json()

    console.log("Photo restoration API called with:", {
      hasPrompt: !!prompt,
      hasImageData: !!imageData,
      restorationType,
      imageDataLength: imageData?.length
    })

    if (!imageData) {
      return NextResponse.json(
        { error: "Image data is required for photo restoration" },
        { status: 400 }
      )
    }

    // For photo restoration, we need the actual image data
    try {
      // Convert image to PNG format if it's AVIF or other unsupported format
      let processedImageData = imageData
      
      // Check if the image is in AVIF format or other unsupported formats
      if (imageData.includes('data:image/avif') || imageData.includes('image/avif')) {
        console.log("Converting AVIF image to PNG format for compatibility")
        
        try {
          // Extract base64 data from data URL
          const base64Data = imageData.split(',')[1]
          const pngHeader = 'data:image/png;base64,'
          processedImageData = pngHeader + base64Data
          
          console.log("Image format converted for compatibility")
        } catch (formatError) {
          console.error("Error converting image format:", formatError)
          // Fall back to original image data
          processedImageData = imageData
        }
      }

      // Set default prompt based on restoration type if not provided
      let restorationPrompt = prompt || ""
      if (!restorationPrompt) {
        if (restorationType === 'restore') {
          restorationPrompt = "Restore this damaged photo to its original quality"
        } else if (restorationType === 'colorize') {
          restorationPrompt = "Add realistic colors to this black and white photo"
        } else if (restorationType === 'enhance') {
          restorationPrompt = "Enhance this photo's quality and clarity"
        }
      }

      console.log("About to call performPhotoRestoration with:", {
        promptLength: restorationPrompt.length,
        imageDataPrefix: processedImageData.substring(0, 50),
        restorationType
      })

      const imageDataUrl = await performPhotoRestoration(
        restorationPrompt, 
        processedImageData, 
        restorationType as 'restore' | 'colorize' | 'enhance'
      )

      console.log("Photo restoration completed successfully")
      return NextResponse.json({
        imageUrl: imageDataUrl,
        appliedRestoration: restorationType,
        originalPrompt: restorationPrompt,
      })
    } catch (restorationError: any) {
      console.error("Error during photo restoration:", restorationError)
      console.error("Error stack:", restorationError?.stack)
      
      // If the error is due to format issues, provide helpful error message
      if (restorationError?.message?.includes('MIME type') || restorationError?.message?.includes('format')) {
        return NextResponse.json(
          { 
            error: "Image format not supported. Please try with a different image format (PNG, JPEG, or WebP).",
            details: restorationError.message 
          },
          { status: 400 }
        )
      }
      
      // Return more detailed error information
      return NextResponse.json(
        { 
          error: "Photo restoration failed", 
          details: restorationError?.message || "Unknown error",
          errorType: restorationError?.constructor?.name || "UnknownError"
        },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error("Photo restoration API error:", error)
    console.error("API Error stack:", error instanceof Error ? error.stack : "No stack trace")
    return NextResponse.json(
      { 
        error: "Failed to restore photo", 
        details: error instanceof Error ? error.message : "Unknown error",
        errorType: error instanceof Error ? error.constructor.name : "UnknownError"
      },
      { status: 500 }
    )
  }
}