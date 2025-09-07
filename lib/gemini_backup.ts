import { GoogleGenAI } from "@google/genai"
import mime from "mime"

// Feature types for API key rotation
export type FeatureType = 
  | 'text-to-image' 
  | 'canvas-editor' 
  | 'style-transfer' 
  | 'templates' 
  | 'enhance-prompt'
  | 'guided-prompt'
  | 'default'

// Rate limit error patterns
const RATE_LIMIT_ERRORS = [
  'quota exceeded',
  'rate limit',
  'daily limit',
  'too many requests',
  'resource exhausted',
  'quota_exceeded',
  'rate_limit_exceeded',
  'daily_limit_exceeded',
  '429',
  'QUOTA_EXCEEDED',
  'RATE_LIMIT_EXCEEDED'
]

// API Key Manager with automatic rotation on rate limits
class ApiKeyManager {
  private apiKeys: { [key: string]: string } = {}
  private availableKeys: string[] = []
  private rateLimitedKeys: Set<string> = new Set()
  private keyUsageCount: { [key: string]: number } = {}
  private lastResetTime: number = Date.now()
  private featureKeyMap: { [key in FeatureType]: string } = {
    'text-to-image': 'GEMINI_API_KEY_1',
    'canvas-editor': 'GEMINI_API_KEY_2', 
    'style-transfer': 'GEMINI_API_KEY_3',
    'templates': 'GEMINI_API_KEY_4',
    'enhance-prompt': 'GEMINI_API_KEY_5',
    'guided-prompt': 'GEMINI_API_KEY_6',
    'default': 'GEMINI_API_KEY'
  }

  constructor() {
    // Load all available API keys
    this.apiKeys = {
      'GEMINI_API_KEY': process.env.GEMINI_API_KEY || '',
      'GEMINI_API_KEY_1': process.env.NEXT_PUBLIC_GOOGLE_GEMINI_API_KEY_1 || '',
      'GEMINI_API_KEY_2': process.env.NEXT_PUBLIC_GOOGLE_GEMINI_API_KEY_2 || '',
      'GEMINI_API_KEY_3': process.env.NEXT_PUBLIC_GOOGLE_GEMINI_API_KEY_3 || '',
      'GEMINI_API_KEY_4': process.env.NEXT_PUBLIC_GOOGLE_GEMINI_API_KEY_4 || '',
      'GEMINI_API_KEY_5': process.env.NEXT_PUBLIC_GOOGLE_GEMINI_API_KEY_5 || '',
      'GEMINI_API_KEY_6': process.env.NEXT_PUBLIC_GOOGLE_GEMINI_API_KEY_6 || '',
      'GEMINI_API_KEY_7': process.env.NEXT_PUBLIC_GOOGLE_GEMINI_API_KEY_7 || '',
      'GEMINI_API_KEY_8': process.env.NEXT_PUBLIC_GOOGLE_GEMINI_API_KEY_8 || '',
      'GEMINI_API_KEY_9': process.env.NEXT_PUBLIC_GOOGLE_GEMINI_API_KEY_9 || '',
    }

    // Filter out empty keys and create available keys list
    this.availableKeys = Object.keys(this.apiKeys).filter(keyName => this.apiKeys[keyName] !== '')
    
    if (this.availableKeys.length === 0) {
      throw new Error("At least one GEMINI_API_KEY environment variable is required")
    }

    // Initialize usage tracking
    this.availableKeys.forEach(keyName => {
      this.keyUsageCount[keyName] = 0
    })

    console.log(`Loaded ${this.availableKeys.length} API keys for feature rotation with automatic fallback`)
    
    // Reset rate limits every hour
    setInterval(() => this.resetRateLimits(), 60 * 60 * 1000)
  }

  private isRateLimitError(error: any): boolean {
    const errorMessage = error?.message?.toLowerCase() || error?.toString()?.toLowerCase() || ''
    return RATE_LIMIT_ERRORS.some(pattern => errorMessage.includes(pattern.toLowerCase()))
  }

  private markKeyAsRateLimited(keyName: string): void {
    this.rateLimitedKeys.add(keyName)
    console.warn(`🚫 API key ${keyName} has been rate limited and marked as unavailable`)
  }

  private resetRateLimits(): void {
    const resetTime = Date.now()
    if (resetTime - this.lastResetTime > 60 * 60 * 1000) { // Reset every hour
      this.rateLimitedKeys.clear()
      this.lastResetTime = resetTime
      console.log(`🔄 Rate limits reset for all API keys`)
    }
  }

  private getNextAvailableKey(): string | null {
    // Find the least used available key that's not rate limited
    const availableKeys = this.availableKeys.filter(keyName => 
      !this.rateLimitedKeys.has(keyName) && this.apiKeys[keyName] !== ''
    )
    
    if (availableKeys.length === 0) {
      console.error('❌ No available API keys! All keys are rate limited.')
      return null
    }
    
    // Sort by usage count (ascending) to get least used key
    availableKeys.sort((a, b) => this.keyUsageCount[a] - this.keyUsageCount[b])
    
    return availableKeys[0]
  }

  getApiKeyForFeature(feature: FeatureType): string {
    // Try preferred key for feature first
    const preferredKeyName = this.featureKeyMap[feature] || this.featureKeyMap.default
    
    if (!this.rateLimitedKeys.has(preferredKeyName) && this.apiKeys[preferredKeyName]) {
      this.keyUsageCount[preferredKeyName] = (this.keyUsageCount[preferredKeyName] || 0) + 1
      console.log(`✅ Using preferred API key ${preferredKeyName} for feature: ${feature}`)
      return this.apiKeys[preferredKeyName]
    }
    
    // Fallback to next available key
    const fallbackKeyName = this.getNextAvailableKey()
    if (!fallbackKeyName) {
      // Emergency fallback - try any key even if rate limited
      const emergencyKey = this.availableKeys[0]
      if (emergencyKey && this.apiKeys[emergencyKey]) {
        console.warn(`⚠️ Emergency fallback: using potentially rate-limited key ${emergencyKey} for feature: ${feature}`)
        return this.apiKeys[emergencyKey]
      }
      throw new Error('No API keys available - all keys are exhausted')
    }
    
    this.keyUsageCount[fallbackKeyName] = (this.keyUsageCount[fallbackKeyName] || 0) + 1
    console.log(`🔄 Fallback: using API key ${fallbackKeyName} for feature: ${feature} (preferred key rate limited)`)
    return this.apiKeys[fallbackKeyName]
  }

  createGenAIInstance(feature: FeatureType): GoogleGenAI {
    const apiKey = this.getApiKeyForFeature(feature)
    return new GoogleGenAI({ apiKey })
  }

  async executeWithRetry<T>(
    feature: FeatureType,
    operation: (genAI: GoogleGenAI) => Promise<T>,
    maxRetries: number = 3
  ): Promise<T> {
    let lastError: any = null
    const triedKeys = new Set<string>()
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const genAI = this.createGenAIInstance(feature)
        const result = await operation(genAI)
        
        if (attempt > 0) {
          console.log(`✅ Operation succeeded on attempt ${attempt + 1} for feature: ${feature}`)
        }
        
        return result
      } catch (error: any) {
        lastError = error
        console.error(`❌ Attempt ${attempt + 1} failed for feature ${feature}:`, error?.message || error)
        
        if (this.isRateLimitError(error)) {
          // Mark current key as rate limited
          const currentKey = this.featureKeyMap[feature] || this.featureKeyMap.default
          this.markKeyAsRateLimited(currentKey)
          triedKeys.add(currentKey)
          
          // Check if we have more keys to try
          const availableKeys = this.availableKeys.filter(key => 
            !this.rateLimitedKeys.has(key) && !triedKeys.has(key)
          )
          
          if (availableKeys.length === 0 && attempt === maxRetries - 1) {
            console.error(`💥 All API keys exhausted for feature ${feature}. No more retries possible.`)
            break
          }
          
          console.log(`🔄 Rate limit detected. Trying next available key... (${availableKeys.length} keys remaining)`)
        } else {
          // Non-rate-limit error, don't retry
          console.error(`💥 Non-recoverable error for feature ${feature}:`, error?.message || error)
          break
        }
      }
    }
    
        throw lastError || new Error(`Failed after ${maxRetries} attempts for feature: ${feature}`)
  }

  // Add method to get usage statistics
  getUsageStats(): { 
    keyName: string; 
    usageCount: number; 
    isRateLimited: boolean; 
    feature: string 
  }[] {
    return this.availableKeys.map(keyName => ({
      keyName,
      usageCount: this.keyUsageCount[keyName] || 0,
      isRateLimited: this.rateLimitedKeys.has(keyName),
      feature: Object.entries(this.featureKeyMap).find(([_, key]) => key === keyName)?.[0] || 'unassigned'
    })).sort((a, b) => b.usageCount - a.usageCount)
  }

  // Add method to manually reset a rate-limited key
  resetKey(keyName: string): boolean {
    if (this.rateLimitedKeys.has(keyName)) {
      this.rateLimitedKeys.delete(keyName)
      console.log(`🔄 Manually reset rate limit for key: ${keyName}`)
      return true
    }
    return false
  }

  // Add method to get system status
  getSystemStatus(): {
    totalKeys: number;
    availableKeys: number;
    rateLimitedKeys: number;
    totalRequests: number;
  } {
    const totalRequests = Object.values(this.keyUsageCount).reduce((sum, count) => sum + count, 0)
    return {
      totalKeys: this.availableKeys.length,
      availableKeys: this.availableKeys.length - this.rateLimitedKeys.size,
      rateLimitedKeys: this.rateLimitedKeys.size,
      totalRequests
    }
  }
}

// Global API key manager instance
const apiKeyManager = new ApiKeyManager()
  }
}

  // Add method to get usage statistics
  getUsageStats(): { 
    keyName: string; 
    usageCount: number; 
    isRateLimited: boolean; 
    feature: string 
  }[] {
    return this.availableKeys.map(keyName => ({
      keyName,
      usageCount: this.keyUsageCount[keyName] || 0,
      isRateLimited: this.rateLimitedKeys.has(keyName),
      feature: Object.entries(this.featureKeyMap).find(([_, key]) => key === keyName)?.[0] || 'unassigned'
    })).sort((a, b) => b.usageCount - a.usageCount)
  }

  // Add method to manually reset a rate-limited key
  resetKey(keyName: string): boolean {
    if (this.rateLimitedKeys.has(keyName)) {
      this.rateLimitedKeys.delete(keyName)
      console.log(`🔄 Manually reset rate limit for key: ${keyName}`)
      return true
    }
    return false
  }

  // Add method to get system status
  getSystemStatus(): {
    totalKeys: number;
    availableKeys: number;
    rateLimitedKeys: number;
    totalRequests: number;
  } {
    const totalRequests = Object.values(this.keyUsageCount).reduce((sum, count) => sum + count, 0)
    return {
      totalKeys: this.availableKeys.length,
      availableKeys: this.availableKeys.length - this.rateLimitedKeys.size,
      rateLimitedKeys: this.rateLimitedKeys.size,
      totalRequests
    }
  }

// Global API key manager instance
const apiKeyManager = new ApiKeyManager()

export async function enhancePrompt(originalPrompt: string): Promise<string> {
  try {
    return await apiKeyManager.executeWithRetry('enhance-prompt', async (genAI) => {
      const model = "gemini-2.5-flash"
      
      const enhancementPrompt = `
You are a professional AI image generation prompt engineer. Your task is to enhance the following user prompt to create better, more detailed, and higher quality images.

Rules:
1. Keep the core intent and subject of the original prompt
2. Add technical photography/art terms for better quality
3. Include lighting, composition, and style details
4. Make it more specific and descriptive
5. Add quality modifiers like "high resolution", "detailed", "professional"
6. Keep it under 200 words
7. Don't change the main subject or concept

Original prompt: "${originalPrompt}"

Enhanced prompt:`

      const contents = [
        {
          role: "user" as const,
          parts: [
            {
              text: enhancementPrompt,
            },
          ],
        },
      ]

      const response = await genAI.models.generateContent({
        model,
        contents,
      })

      return response.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || 
             `${originalPrompt}, high quality, detailed, professional photography, 8K resolution, cinematic lighting, sharp focus`
    })
  } catch (error) {
    console.error("Error enhancing prompt:", error)
    // Fallback enhancement
    return `${originalPrompt}, high quality, detailed, professional photography, 8K resolution, cinematic lighting, sharp focus`
  }
}

export async function generateImage(prompt: string, feature: FeatureType = 'text-to-image'): Promise<string> {
  try {
    console.log(`Starting image generation with prompt for feature ${feature}:`, prompt)
    
    return await apiKeyManager.executeWithRetry(feature, async (genAI) => {
      const model = "gemini-2.5-flash-image-preview"
      
      const config = {
        responseModalities: ["IMAGE", "TEXT"],
      }

      const contents = [
        {
          role: "user" as const,
          parts: [
            {
              text: prompt,
            },
          ],
        },
      ]

      console.log("Calling Gemini API...")
      const response = await genAI.models.generateContentStream({
        model,
        config,
        contents,
      })

      console.log("Processing response chunks...")
      for await (const chunk of response) {
        if (!chunk.candidates || !chunk.candidates[0].content || !chunk.candidates[0].content.parts) {
          continue
        }

        const part = chunk.candidates[0].content.parts[0]
        if (part.inlineData) {
          console.log("Found image data in response")
          // Return base64 data URL for immediate use
          const mimeType = part.inlineData.mimeType || "image/png"
          const base64Data = part.inlineData.data
          return `data:${mimeType};base64,${base64Data}`
        }
      }

      throw new Error("No image data received from Gemini")
    })
  } catch (error) {
    console.error("Error generating image:", error)
    if (error instanceof Error) {
      throw new Error(`Failed to generate image: ${error.message}`)
    }
    throw new Error("Failed to generate image: Unknown error")
  }
}

export async function generateImageWithStyle(prompt: string, stylePrompt: string): Promise<string> {
  const combinedPrompt = `${prompt}, ${stylePrompt}`
  return generateImage(combinedPrompt, 'style-transfer')
}

export async function editImage(
  originalPrompt: string, 
  editInstructions: string, 
  originalImageData?: string, 
  editedImageData?: string, 
  maskData?: string
): Promise<string> {
  try {
    console.log("editImage called with:", {
      originalPrompt,
      editInstructions,
      hasOriginalImageData: !!originalImageData,
      hasEditedImageData: !!editedImageData,
      hasMaskData: !!maskData,
      originalImageDataLength: originalImageData ? originalImageData.length : 0,
      editedImageDataLength: editedImageData ? editedImageData.length : 0,
    })

    return await apiKeyManager.executeWithRetry('canvas-editor', async (genAI) => {
      // Dual image mode - both original and edited images provided
      if (originalImageData && editedImageData) {
        console.log("Starting dual image editing with both original and edited images")
      
      const model = "gemini-2.5-flash-image-preview"
      
      const config = {
        responseModalities: ["IMAGE", "TEXT"],
      }

      const parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = []

      // Add the original image first
      const originalMatches = originalImageData.match(/^data:([^;]+);base64,(.+)$/)
      if (originalMatches) {
        console.log("Valid original image data format detected:", originalMatches[1])
        parts.push({
          inlineData: {
            mimeType: originalMatches[1],
            data: originalMatches[2],
          },
        })
      } else {
        console.error("Invalid original image data format:", originalImageData.substring(0, 100))
        throw new Error("Invalid original image data format. Expected data URL with base64 content.")
      }

      // Add the edited/canvas image
      const editedMatches = editedImageData.match(/^data:([^;]+);base64,(.+)$/)
      if (editedMatches) {
        console.log("Valid edited image data format detected:", editedMatches[1])
        parts.push({
          inlineData: {
            mimeType: editedMatches[1],
            data: editedMatches[2],
          },
        })
      } else {
        console.error("Invalid edited image data format:", editedImageData.substring(0, 100))
        throw new Error("Invalid edited image data format. Expected data URL with base64 content.")
      }

      // Add the mask if available
      if (maskData) {
        const maskMatches = maskData.match(/^data:([^;]+);base64,(.+)$/)
        if (maskMatches) {
          console.log("Valid mask data format detected:", maskMatches[1])
          parts.push({
            inlineData: {
              mimeType: maskMatches[1],
              data: maskMatches[2],
            },
          })
        } else {
          console.warn("Invalid mask data format, skipping mask")
        }
      }

      // Add comprehensive editing instructions for dual image processing
      const instructionText = maskData 
        ? `I have provided you with two images:
           1. The ORIGINAL image (first image)
           2. The EDITED image with user markings (second image) 
           3. A MASK showing the edited areas (third image)
           
           Task: ${editInstructions}
           
           Please analyze the differences between the original and edited images, focusing on the areas highlighted in the mask. Apply the requested edits intelligently, using the user's markings as guidance for where and how to make changes. Maintain the overall quality and style of the original image.`
        : `I have provided you with two images:
           1. The ORIGINAL image (first image)
           2. The EDITED image with user markings (second image)
           
           Task: ${editInstructions}
           
           Please analyze the differences between the original and edited images. The user has made some markings or edits on the second image to indicate what they want changed. Apply the requested edits intelligently, using the user's markings as guidance. Maintain the overall quality and style of the original image.`

      parts.push({
        text: instructionText,
      })

      console.log("Prepared", parts.length, "parts for dual image Gemini API call")

      const contents = [
        {
          role: "user" as const,
          parts,
        },
      ]

      console.log("Calling Gemini API for dual image editing...")
      const response = await genAI.models.generateContentStream({
        model,
        config,
        contents,
      })

      console.log("Processing dual image editing response...")
      for await (const chunk of response) {
        if (!chunk.candidates || !chunk.candidates[0].content || !chunk.candidates[0].content.parts) {
          continue
        }

        const part = chunk.candidates[0].content.parts[0]
        if (part.inlineData) {
          console.log("Successfully edited image with dual image AI processing")
          const mimeType = part.inlineData.mimeType || "image/png"
          const base64Data = part.inlineData.data
          return `data:${mimeType};base64,${base64Data}`
        }
      }

      throw new Error("No edited image data received from Gemini in dual image mode")
    }
    // Single image mode (legacy compatibility) - only edited image provided
    else if (editedImageData) {
      console.log("Starting single image editing with edited image data")
      
      const model = "gemini-2.5-flash-image-preview"
      
      const config = {
        responseModalities: ["IMAGE", "TEXT"],
      }

      const parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = []

      // Add the edited image
      const imageMatches = editedImageData.match(/^data:([^;]+);base64,(.+)$/)
      if (imageMatches) {
        console.log("Valid edited image data format detected:", imageMatches[1])
        parts.push({
          inlineData: {
            mimeType: imageMatches[1],
            data: imageMatches[2],
          },
        })
      } else {
        console.error("Invalid edited image data format:", editedImageData.substring(0, 100))
        throw new Error("Invalid edited image data format. Expected data URL with base64 content.")
      }

      // Add the mask if available
      if (maskData) {
        const maskMatches = maskData.match(/^data:([^;]+);base64,(.+)$/)
        if (maskMatches) {
          console.log("Valid mask data format detected:", maskMatches[1])
          parts.push({
            inlineData: {
              mimeType: maskMatches[1],
              data: maskMatches[2],
            },
          })
        } else {
          console.warn("Invalid mask data format, skipping mask")
        }
      }

      // Add the editing instructions
      const instructionText = maskData 
        ? `Edit this image following these instructions: ${editInstructions}. Focus on the areas shown in the mask (blue highlighted regions). Keep the rest of the image unchanged.`
        : `Edit this image following these instructions: ${editInstructions}. Make the changes naturally while maintaining the overall composition and quality.`

      parts.push({
        text: instructionText,
      })

      console.log("Prepared", parts.length, "parts for single image Gemini API call")

      const contents = [
        {
          role: "user" as const,
          parts,
        },
      ]

      console.log("Calling Gemini API for single image editing...")
      const response = await genAI.models.generateContentStream({
        model,
        config,
        contents,
      })

      console.log("Processing single image editing response...")
      for await (const chunk of response) {
        if (!chunk.candidates || !chunk.candidates[0].content || !chunk.candidates[0].content.parts) {
          continue
        }

        const part = chunk.candidates[0].content.parts[0]
        if (part.inlineData) {
          console.log("Successfully edited image with single image AI processing")
          const mimeType = part.inlineData.mimeType || "image/png"
          const base64Data = part.inlineData.data
          return `data:${mimeType};base64,${base64Data}`
        }
      }

      throw new Error("No edited image data received from Gemini in single image mode")
    } else {
      // Fallback to text-based editing for backward compatibility
      console.log("Using text-based editing fallback")
      const editPrompt = `${originalPrompt}, modified: ${editInstructions}`
      return generateImage(editPrompt)
    }
    })
  } catch (error) {
    console.error("Error editing image:", error)
    if (error instanceof Error) {
      throw new Error(`Failed to edit image: ${error.message}`)
    }
    throw new Error("Failed to edit image: Unknown error")
  }
}

export async function performStyleTransfer(prompt: string, referenceImageData?: string): Promise<string> {
  try {
    console.log("performStyleTransfer called with:", {
      prompt,
      hasReferenceImage: !!referenceImageData,
      referenceImageLength: referenceImageData ? referenceImageData.length : 0,
    })

    return await apiKeyManager.executeWithRetry('style-transfer', async (genAI) => {
      const model = "gemini-2.5-flash-image-preview"
      
      const config = {
        responseModalities: ["IMAGE", "TEXT"],
      }

      const parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = [
        {
          text: prompt,
        },
      ]

    // If reference image is provided, add it to the parts
    if (referenceImageData) {
      // Extract the base64 data and mime type from data URL
      const matches = referenceImageData.match(/^data:([^;]+);base64,(.+)$/)
      if (matches) {
        console.log("Valid reference image data format detected:", matches[1])
        parts.push({
          inlineData: {
            mimeType: matches[1],
            data: matches[2],
          },
        })
      } else {
        console.error("Invalid reference image data format:", referenceImageData.substring(0, 100))
        throw new Error("Invalid reference image data format. Expected data URL with base64 content.")
      }
    } else {
      console.warn("No reference image provided for style transfer")
    }

    console.log("Prepared", parts.length, "parts for Gemini API")

    const contents = [
      {
        role: "user" as const,
        parts,
      },
    ]

    console.log("Calling Gemini API for style transfer...")
    const response = await genAI.models.generateContentStream({
      model,
      config,
      contents,
    })

    console.log("Processing style transfer response...")
    for await (const chunk of response) {
      if (!chunk.candidates || !chunk.candidates[0].content || !chunk.candidates[0].content.parts) {
        continue
      }

      const part = chunk.candidates[0].content.parts[0]
      if (part.inlineData) {
        console.log("Successfully applied style transfer")
        // Return base64 data URL for immediate use
        const mimeType = part.inlineData.mimeType || "image/png"
        const base64Data = part.inlineData.data
        return `data:${mimeType};base64,${base64Data}`
      }
    }

    throw new Error("No styled image data received from Gemini")
    })
  } catch (error) {
    console.error("Error performing style transfer:", error)
    if (error instanceof Error) {
      throw new Error(`Failed to perform style transfer: ${error.message}`)
    }
    throw new Error("Failed to perform style transfer: Unknown error")
  }
}
