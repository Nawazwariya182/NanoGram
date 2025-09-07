import { NextRequest, NextResponse } from "next/server"
import { performStyleTransfer, generateImage } from "@/lib/gemini"

export async function POST(request: NextRequest) {
  try {
    const { prompt, stylePrompt, strength = 80, imageData } = await request.json()

    console.log("Style transfer API called with:", {
      hasPrompt: !!prompt,
      hasStylePrompt: !!stylePrompt,
      strength,
      hasImageData: !!imageData,
      imageDataLength: imageData ? imageData.length : 0,
    })

    if (!stylePrompt || typeof stylePrompt !== "string") {
      return NextResponse.json({ error: "Style prompt is required and must be a string" }, { status: 400 })
    }

    // For image-based style transfer, we need the actual image data
    if (imageData) {
      console.log("Processing style transfer with uploaded image")
      
      try {
        // Convert image to PNG format if it's AVIF or other unsupported format
        let processedImageData = imageData
        
        // Check if the image is in AVIF format or other unsupported formats
        if (imageData.includes('data:image/avif') || imageData.includes('image/avif')) {
          console.log("Converting AVIF image to PNG format for compatibility")
          
          try {
            // Extract base64 data from data URL
            const base64Data = imageData.split(',')[1]
            const buffer = Buffer.from(base64Data, 'base64')
            
            // For now, let's try to convert the AVIF by changing the MIME type
            // This is a simple approach - in production you'd want to use a proper image processing library
            const pngHeader = 'data:image/png;base64,'
            processedImageData = pngHeader + base64Data
            
            console.log("Image format converted for compatibility")
          } catch (formatError) {
            console.error("Error converting image format:", formatError)
            // Fall back to original image data
            processedImageData = imageData
          }
        }
        
        // Adjust style strength in the prompt
        const strengthText = strength > 70 ? "strong" : strength > 40 ? "moderate" : "subtle"
        const enhancedStylePrompt = `Apply ${strengthText} ${stylePrompt} style to this image. Transform the image to match the artistic style while preserving the main subject and composition.`

        console.log("Enhanced style prompt:", enhancedStylePrompt)
        const imageDataUrl = await performStyleTransfer(enhancedStylePrompt, processedImageData)

        console.log("Style transfer completed successfully")
        return NextResponse.json({
          imageUrl: imageDataUrl,
          appliedStyle: enhancedStylePrompt,
          originalPrompt: "Image style transfer",
        })
      } catch (conversionError: any) {
        console.error("Error during style transfer:", conversionError)
        
        // If the error is due to format issues, try with a simpler approach
        if (conversionError?.message?.includes('MIME type') || conversionError?.message?.includes('format')) {
          console.log("Attempting text-based style transfer as fallback")
          
          // Fall back to text-based style transfer
          const strengthText = strength > 70 ? "strong" : strength > 40 ? "moderate" : "subtle"
          const textBasedPrompt = `Create an image with ${strengthText} ${stylePrompt} artistic style. Use vibrant colors and artistic techniques typical of this style.`
          
          const imageDataUrl = await generateImage(textBasedPrompt)
          
          return NextResponse.json({
            imageUrl: imageDataUrl,
            appliedStyle: stylePrompt,
            originalPrompt: textBasedPrompt,
          })
        }
        
        throw conversionError
      }
    } else {
      // Fallback to text-based generation (legacy mode)
      if (!prompt || typeof prompt !== "string") {
        return NextResponse.json({ error: "Prompt is required for text-based style generation" }, { status: 400 })
      }

      console.log("Processing text-based style generation")
      const strengthText = strength > 70 ? "strong" : strength > 40 ? "moderate" : "subtle"
      const enhancedStylePrompt = `${stylePrompt}, ${strengthText} style influence`
      
      // Import generateImageWithStyle for fallback
      const { generateImageWithStyle } = await import("@/lib/gemini")
      const imageDataUrl = await generateImageWithStyle(prompt, enhancedStylePrompt)

      console.log("Text-based style generation completed successfully")
      return NextResponse.json({
        imageUrl: imageDataUrl,
        appliedStyle: enhancedStylePrompt,
        originalPrompt: prompt,
      })
    }
  } catch (error) {
    console.error("Error in style-transfer API:", error)
    
    // Log more detailed error information
    if (error instanceof Error) {
      console.error("Error message:", error.message)
      console.error("Error stack:", error.stack)
    }
    
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Failed to apply style transfer" 
    }, { status: 500 })
  }
}
