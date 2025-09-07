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
  | 'photo-restore'
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
  'maximum call stack size exceeded',
  '429',
  'QUOTA_EXCEEDED',
  'RATE_LIMIT_EXCEEDED',
  'RESOURCE_EXHAUSTED',
  'API_QUOTA_EXCEEDED'
]

// API Key Manager with automatic rotation on rate limits
class ApiKeyManager {
  private apiKeys: { [key: string]: string } = {}
  private availableKeys: string[] = []
  private rateLimitedKeys: Set<string> = new Set()
  private keyUsageCount: { [key: string]: number } = {}
  private lastResetTime: number = Date.now()
  private circuitBreaker: { [key: string]: number } = {} // Track failed attempts per key
  private featureKeyMap: { [key in FeatureType]: string } = {
    'text-to-image': 'GEMINI_API_KEY_1',
    'canvas-editor': 'GEMINI_API_KEY_2', 
    'style-transfer': 'GEMINI_API_KEY_3',
    'templates': 'GEMINI_API_KEY_4',
    'enhance-prompt': 'GEMINI_API_KEY_5',
    'guided-prompt': 'GEMINI_API_KEY_6',
    'photo-restore': 'GEMINI_API_KEY_7',
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
    this.circuitBreaker[keyName] = (this.circuitBreaker[keyName] || 0) + 1
    console.warn(`🚫 API key ${keyName} has been rate limited and marked as unavailable (failures: ${this.circuitBreaker[keyName]})`)
  }

  private isKeyHealthy(keyName: string): boolean {
    const failures = this.circuitBreaker[keyName] || 0
    return failures < 5 && !this.rateLimitedKeys.has(keyName) // Max 5 failures before circuit break
  }

  private resetRateLimits(): void {
    const resetTime = Date.now()
    if (resetTime - this.lastResetTime > 60 * 60 * 1000) { // Reset every hour
      this.rateLimitedKeys.clear()
      this.circuitBreaker = {} // Reset circuit breaker state
      this.lastResetTime = resetTime
      console.log(`🔄 Rate limits and circuit breakers reset for all API keys`)
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
        // Get a specific key for this attempt
        let keyToUse: string
        
        if (attempt === 0) {
          // First attempt: use preferred key
          const preferredKeyName = this.featureKeyMap[feature] || this.featureKeyMap.default
          if (!this.rateLimitedKeys.has(preferredKeyName) && this.apiKeys[preferredKeyName]) {
            keyToUse = this.apiKeys[preferredKeyName]
            this.keyUsageCount[preferredKeyName] = (this.keyUsageCount[preferredKeyName] || 0) + 1
            console.log(`✅ Using preferred API key ${preferredKeyName} for feature: ${feature}`)  
          } else {
            // Preferred key not available, get alternative
            const altKey = this.getAlternativeKey(triedKeys)
            if (!altKey) throw new Error('No API keys available')
            keyToUse = this.apiKeys[altKey]
            this.keyUsageCount[altKey] = (this.keyUsageCount[altKey] || 0) + 1
            triedKeys.add(altKey)
          }
        } else {
          // Subsequent attempts: get alternative key
          const altKey = this.getAlternativeKey(triedKeys)
          if (!altKey) {
            console.error(`💥 No more API keys available for feature ${feature} after ${attempt} attempts`)
            break
          }
          keyToUse = this.apiKeys[altKey]
          this.keyUsageCount[altKey] = (this.keyUsageCount[altKey] || 0) + 1
          triedKeys.add(altKey)
          console.log(`🔄 Retry ${attempt + 1}: using alternative key for feature: ${feature}`)
        }
        
        const genAI = new GoogleGenAI({ apiKey: keyToUse })
        const result = await operation(genAI)
        
        if (attempt > 0) {
          console.log(`✅ Operation succeeded on attempt ${attempt + 1} for feature: ${feature}`)
        }
        
        return result
      } catch (error: any) {
        lastError = error
        console.error(`❌ Attempt ${attempt + 1} failed for feature ${feature}:`, error?.message || error)
        
        if (this.isRateLimitError(error)) {
          console.log(`🔄 Rate limit detected. Will try next available key if available...`)
          // Mark current key as rate limited if we can identify it
          const currentKey = this.featureKeyMap[feature] || this.featureKeyMap.default
          this.markKeyAsRateLimited(currentKey)
        } else {
          // Non-rate-limit error, don't retry
          console.error(`💥 Non-recoverable error for feature ${feature}:`, error?.message || error)
          break
        }
        
        // Add a small delay between retries to prevent rapid fire requests
        if (attempt < maxRetries - 1) {
          const delay = Math.min(1000 * Math.pow(2, attempt), 5000) // Exponential backoff, max 5s
          console.log(`⏳ Waiting ${delay}ms before retry...`)
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      }
    }
    
    throw lastError || new Error(`Failed after ${maxRetries} attempts for feature: ${feature}`)
  }

  private getAlternativeKey(excludeKeys: Set<string>): string | null {
    const availableKeys = this.availableKeys.filter(keyName => 
      this.isKeyHealthy(keyName) && 
      !excludeKeys.has(keyName) &&
      this.apiKeys[keyName] !== ''
    )
    
    if (availableKeys.length === 0) {
      console.warn('⚠️ No healthy keys available, checking all keys...')
      // Emergency fallback - try any non-excluded key
      const emergencyKeys = this.availableKeys.filter(keyName => 
        !excludeKeys.has(keyName) && this.apiKeys[keyName] !== ''
      )
      if (emergencyKeys.length === 0) {
        return null
      }
      return emergencyKeys[0]
    }
    
    // Sort by usage count (ascending) to get least used key
    availableKeys.sort((a, b) => this.keyUsageCount[a] - this.keyUsageCount[b])
    return availableKeys[0]
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
    if (this.rateLimitedKeys.has(keyName) || this.circuitBreaker[keyName]) {
      this.rateLimitedKeys.delete(keyName)
      delete this.circuitBreaker[keyName]
      console.log(`🔄 Manually reset rate limit and circuit breaker for key: ${keyName}`)
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

// Export additional monitoring functions
export function getApiKeyUsageStats() {
  return apiKeyManager.getUsageStats()
}

export function getApiKeySystemStatus() {
  return apiKeyManager.getSystemStatus()
}

export function resetApiKey(keyName: string) {
  return apiKeyManager.resetKey(keyName)
}

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
          }
        }

        // Add the text instruction
        parts.push({
          text: `Based on these images, create a new image that follows these instructions:

Original concept: ${originalPrompt}
Edit instructions: ${editInstructions}

Please generate a refined version that incorporates the edits shown in the canvas image while maintaining the quality and style of the original image.`,
        })

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
            console.log("Successfully processed dual images with AI refinement")
            const mimeType = part.inlineData.mimeType || "image/png"
            const base64Data = part.inlineData.data
            return `data:${mimeType};base64,${base64Data}`
          }
        }

        throw new Error("No edited image data received from Gemini in dual image mode")
      } else if (originalImageData) {
        // Single image mode
        console.log("Starting single image editing")
        
        const model = "gemini-2.5-flash-image-preview"
        
        const config = {
          responseModalities: ["IMAGE", "TEXT"],
        }

        const originalMatches = originalImageData.match(/^data:([^;]+);base64,(.+)$/)
        if (!originalMatches) {
          console.error("Invalid image data format:", originalImageData.substring(0, 100))
          throw new Error("Invalid image data format. Expected data URL with base64 content.")
        }

        console.log("Valid image data format detected:", originalMatches[1])

        const parts = [
          {
            inlineData: {
              mimeType: originalMatches[1],
              data: originalMatches[2],
            },
          },
          {
            text: `Edit this image based on the following instructions:

Original concept: ${originalPrompt}
Edit instructions: ${editInstructions}

Please generate an edited version of this image.`,
          },
        ]

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
        // Use a different feature to prevent circular calls
        return generateImage(editPrompt, 'default')
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

      if (referenceImageData) {
        const referenceMatches = referenceImageData.match(/^data:([^;]+);base64,(.+)$/)
        if (referenceMatches) {
          console.log("Valid reference image data format detected:", referenceMatches[1])
          parts.push({
            inlineData: {
              mimeType: referenceMatches[1],
              data: referenceMatches[2],
            },
          })
          parts[0] = {
            text: `Apply the artistic style from this reference image to create: ${prompt}`,
          }
        }
      }

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
          console.log("Successfully completed style transfer")
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

// Photo restoration with AI enhancement and colorization
export async function performPhotoRestoration(
  prompt: string, 
  imageData: string,
  restorationType: 'restore' | 'colorize' | 'enhance' = 'restore'
): Promise<string> {
  try {
    console.log(`Starting photo restoration (${restorationType}):`, { 
      prompt: prompt.substring(0, 100),
      imageDataPrefix: imageData.substring(0, 50),
      restorationType 
    })
    
    // For photo restoration, we need to use a different approach
    // First analyze the image, then generate a new one based on the analysis
    return await apiKeyManager.executeWithRetry('photo-restore', async (genAI) => {
      console.log("Step 1: Analyzing the uploaded image")
      
      // First, use text generation to analyze the image
      const analysisModel = "gemini-2.0-flash-exp"
      
      const base64Data = imageData.split(",")[1]
      const mimeType = imageData.match(/data:([^;]+);/)?.[1] || "image/png"

      console.log("Image data parsed for analysis:", { 
        mimeType, 
        base64Length: base64Data?.length,
        hasValidBase64: !!base64Data 
      })

      if (!base64Data) {
        throw new Error("Invalid image data: no base64 content found")
      }

      // Create analysis prompt based on restoration type
      let analysisPrompt = ""
      if (restorationType === 'restore') {
        analysisPrompt = `Analyze this old or damaged photograph in detail. Describe:
1. The main subject(s) and composition
2. Any visible damage (scratches, stains, tears, fading)
3. The time period/era it appears to be from
4. Clothing, objects, and setting
5. Lighting and mood
6. What needs to be restored

Based on your analysis, provide a detailed description for creating a perfectly restored version of this photograph.`
      } else if (restorationType === 'colorize') {
        analysisPrompt = `Analyze this black and white photograph in detail. Describe:
1. The main subject(s) and composition
2. The time period/era it appears to be from
3. Clothing, hairstyles, and objects visible
4. The setting and environment
5. Lighting and mood
6. What realistic colors should be applied

Based on your analysis, provide a detailed description for creating a beautifully colorized version with historically accurate colors.`
      } else {
        analysisPrompt = `Analyze this photograph in detail. Describe:
1. The main subject(s) and composition
2. Current quality issues (blur, noise, poor lighting)
3. The setting and context
4. What enhancements would improve it

Based on your analysis, provide a detailed description for creating an enhanced, professional-quality version.`
      }

      if (prompt) {
        analysisPrompt += `\n\nUser requirements: ${prompt}`
      }

      // Get analysis using vision model
      const analysisContents = [
        {
          role: "user" as const,
          parts: [
            {
              inlineData: {
                mimeType: mimeType,
                data: base64Data,
              },
            },
            {
              text: analysisPrompt,
            }
          ],
        },
      ]

      console.log("Calling Gemini for image analysis...")
      const analysisResponse = await genAI.models.generateContentStream({
        model: analysisModel,
        contents: analysisContents,
      })

      let analysisText = ""
      for await (const chunk of analysisResponse) {
        if (chunk.candidates?.[0]?.content?.parts) {
          for (const part of chunk.candidates[0].content.parts) {
            if (part.text) {
              analysisText += part.text
            }
          }
        }
      }

      console.log("Analysis completed:", analysisText.substring(0, 200) + "...")

      if (!analysisText) {
        throw new Error("Failed to analyze the image")
      }

      // Step 2: Generate restored image based on analysis
      console.log("Step 2: Generating restored image based on analysis")
      
      const generationModel = "gemini-2.5-flash-image-preview"
      
      const config = {
        responseModalities: ["IMAGE", "TEXT"],
      }

      let generationPrompt = ""
      if (restorationType === 'restore') {
        generationPrompt = `Based on this detailed analysis of a damaged photograph, create a fully restored, high-quality version:

${analysisText}

Generate a photograph that:
- Completely removes all damage, scratches, tears, and stains
- Has perfect clarity and sharpness
- Uses natural, historically accurate colors and lighting
- Preserves the exact composition and subjects described
- Looks like a professional photograph from that era in perfect condition
- Maintains authentic period details and styling`
      } else if (restorationType === 'colorize') {
        generationPrompt = `Based on this detailed analysis of a black and white photograph, create a beautifully colorized version:

${analysisText}

Generate a colorized photograph that:
- Adds realistic, historically accurate colors
- Uses natural skin tones appropriate for the time period
- Applies period-correct clothing and object colors
- Maintains the original composition and mood exactly
- Looks natural and authentic, not over-saturated
- Preserves all the details and atmosphere described`
      } else {
        generationPrompt = `Based on this detailed analysis, create an enhanced, professional-quality version of this photograph:

${analysisText}

Generate an enhanced photograph that:
- Has significantly improved clarity and sharpness
- Optimized lighting and contrast
- Reduced noise and improved quality
- Maintains the original composition and subjects exactly
- Looks professional and polished
- Preserves the natural character and mood`
      }

      console.log("Generation prompt created:", generationPrompt.substring(0, 150) + "...")

      const generationContents = [
        {
          role: "user" as const,
          parts: [
            {
              text: generationPrompt,
            }
          ],
        },
      ]

      console.log("Calling Gemini for image generation...")
      const generationResponse = await genAI.models.generateContentStream({
        model: generationModel,
        config,
        contents: generationContents,
      })

      console.log("Processing generation response...")
      let foundImage = false
      
      for await (const chunk of generationResponse) {
        console.log("Processing generation chunk...")
        
        if (!chunk.candidates || !chunk.candidates[0].content || !chunk.candidates[0].content.parts) {
          console.log("Chunk missing expected structure, skipping")
          continue
        }

        for (const part of chunk.candidates[0].content.parts) {
          if (part.inlineData) {
            console.log("Found generated image data!")
            foundImage = true
            const mimeType = part.inlineData.mimeType || "image/png"
            const base64Data = part.inlineData.data
            return `data:${mimeType};base64,${base64Data}`
          } else if (part.text) {
            console.log("Found text in generation response:", part.text.substring(0, 100))
          }
        }
      }

      if (!foundImage) {
        console.error("No image data found in generation response")
      }

      throw new Error("No restored image data received from Gemini generation")
    })
  } catch (error) {
    console.error("Error performing photo restoration:", error)
    console.error("Error details:", {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : "No stack trace",
      name: error instanceof Error ? error.constructor.name : "Unknown type"
    })
    
    if (error instanceof Error) {
      throw new Error(`Failed to perform photo restoration: ${error.message}`)
    }
    throw new Error("Failed to perform photo restoration: Unknown error")
  }
}