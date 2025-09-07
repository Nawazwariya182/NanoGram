import { type NextRequest, NextResponse } from "next/server"
import { editImage } from "@/lib/gemini"

export async function POST(request: NextRequest) {
  try {
    const { originalPrompt, editInstructions, originalImageData, editedImageData, maskData } = await request.json()

    console.log("Edit image API called with:", {
      hasOriginalPrompt: !!originalPrompt,
      hasEditInstructions: !!editInstructions,
      hasOriginalImageData: !!originalImageData,
      hasEditedImageData: !!editedImageData,
      hasMaskData: !!maskData,
      originalImageDataLength: originalImageData ? originalImageData.length : 0,
      editedImageDataLength: editedImageData ? editedImageData.length : 0,
    })

    // Handle both images mode (canvas editing with original reference)
    if (originalImageData && editedImageData) {
      if (!editInstructions || typeof editInstructions !== "string") {
        return NextResponse.json({ error: "Edit instructions are required for image editing" }, { status: 400 })
      }

      console.log("Processing dual image edit with original and edited images")
      const imageDataUrl = await editImage(
        "Dual image editing with original and edited versions", 
        editInstructions, 
        originalImageData, 
        editedImageData, 
        maskData
      )

      console.log("Dual image edit completed successfully")
      return NextResponse.json({
        imageUrl: imageDataUrl,
        editedPrompt: editInstructions,
        originalPrompt: "Dual image editing",
        editInstructions,
      })
    }
    // Handle single image mode (legacy compatibility)
    else if (editedImageData) {
      if (!editInstructions || typeof editInstructions !== "string") {
        return NextResponse.json({ error: "Edit instructions are required for image editing" }, { status: 400 })
      }

      console.log("Processing single canvas image edit with instructions:", editInstructions)
      const imageDataUrl = await editImage("Canvas image edit", editInstructions, editedImageData, undefined, maskData)

      console.log("Single canvas image edit completed successfully")
      return NextResponse.json({
        imageUrl: imageDataUrl,
        editedPrompt: editInstructions,
        originalPrompt: "Canvas image",
        editInstructions,
      })
    }
    // Text-based editing mode (legacy)
    else {
      if (!originalPrompt || typeof originalPrompt !== "string") {
        return NextResponse.json({ error: "Original prompt is required and must be a string" }, { status: 400 })
      }

      if (!editInstructions || typeof editInstructions !== "string") {
        return NextResponse.json({ error: "Edit instructions are required and must be a string" }, { status: 400 })
      }

      console.log("Processing text-based image edit")
      const imageDataUrl = await editImage(originalPrompt, editInstructions)

      console.log("Text-based image edit completed successfully")
      return NextResponse.json({
        imageUrl: imageDataUrl,
        editedPrompt: `${originalPrompt}, modified: ${editInstructions}`,
        originalPrompt,
        editInstructions,
      })
    }
  } catch (error) {
    console.error("Error in edit-image API:", error)
    
    // Log more detailed error information
    if (error instanceof Error) {
      console.error("Error message:", error.message)
      console.error("Error stack:", error.stack)
      
      // Check for specific MIME type errors
      if (error.message.includes("Unsupported MIME type") || error.message.includes("image/avif") || error.message.includes("image/webp")) {
        return NextResponse.json({ 
          error: "Unsupported image format. Please ensure your image is in PNG or JPEG format. AVIF and WebP formats are not supported by the AI service." 
        }, { status: 400 })
      }
    }
    
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Failed to edit image" 
    }, { status: 500 })
  }
}
