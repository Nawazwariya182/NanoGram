import type { FeatureType } from "@/lib/gemini"

interface ApiResponse<T> {
  data?: T
  error?: string
}

class ApiClient {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(endpoint, {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || "API request failed")
    }

    return data
  }

  async enhancePrompt(prompt: string): Promise<{ originalPrompt: string; enhancedPrompt: string }> {
    return this.request("/api/enhance-prompt", {
      method: "POST",
      body: JSON.stringify({ prompt }),
    })
  }

  async generateImage(
    prompt: string,
    enhancePrompt = true,
    feature: FeatureType = 'text-to-image'
  ): Promise<{ imageUrl: string; prompt: string; originalPrompt: string; feature: string }> {
    return this.request("/api/generate-image", {
      method: "POST",
      body: JSON.stringify({ prompt, enhancePrompt, feature }),
    })
  }

  async applyStyleTransfer(
    prompt: string,
    stylePrompt: string,
    strength = 80,
    imageData?: string,
  ): Promise<{ imageUrl: string; appliedStyle: string; originalPrompt: string }> {
    return this.request("/api/style-transfer", {
      method: "POST",
      body: JSON.stringify({ prompt, stylePrompt, strength, imageData }),
    })
  }

  async editImage(
    originalPrompt: string,
    editInstructions: string,
    originalImageData?: string,
    editedImageData?: string,
    maskData?: string,
  ): Promise<{ imageUrl: string; editedPrompt: string; originalPrompt: string; editInstructions: string }> {
    return this.request("/api/edit-image", {
      method: "POST",
      body: JSON.stringify({ originalPrompt, editInstructions, originalImageData, editedImageData, maskData }),
    })
  }
}

export const apiClient = new ApiClient()
