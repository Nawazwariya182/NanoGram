"use client"

import type React from "react"

import { useState, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { ArrowLeft, Upload, Palette, Download, RefreshCw, Loader2, Eye, EyeOff, Wand2, ImageIcon } from "lucide-react"
import Link from "next/link"
import { apiClient } from "@/lib/api-client"

interface StylePreset {
  id: string
  name: string
  description: string
  example: string
  prompt: string
  gradient: string
}

const stylePresets: StylePreset[] = [
  {
    id: "van-gogh",
    name: "Van Gogh",
    description: "Post-impressionist masterpiece with swirling brushstrokes",
    example: "/placeholder.svg?height=200&width=200&text=Van+Gogh",
    prompt:
      "in the style of Vincent van Gogh, post-impressionist painting, swirling brushstrokes, vibrant colors, expressive texture",
    gradient: "from-yellow-400 to-orange-500",
  },
  {
    id: "anime",
    name: "Anime",
    description: "Japanese animation style with clean lines and vibrant colors",
    example: "/placeholder.svg?height=200&width=200&text=Anime",
    prompt: "anime style, manga art, clean lines, vibrant colors, cel shading, Japanese animation",
    gradient: "from-pink-400 to-purple-500",
  },
  {
    id: "cyberpunk",
    name: "Cyberpunk",
    description: "Futuristic neon-lit dystopian aesthetic",
    example: "/placeholder.svg?height=200&width=200&text=Cyberpunk",
    prompt: "cyberpunk style, neon lights, futuristic, dystopian, high contrast, electric colors, digital art",
    gradient: "from-cyan-400 to-blue-600",
  },
  {
    id: "watercolor",
    name: "Watercolor",
    description: "Soft, flowing watercolor painting technique",
    example: "/placeholder.svg?height=200&width=200&text=Watercolor",
    prompt: "watercolor painting, soft brushstrokes, flowing colors, artistic, traditional medium, paper texture",
    gradient: "from-blue-300 to-green-400",
  },
  {
    id: "oil-painting",
    name: "Oil Painting",
    description: "Classical oil painting with rich textures",
    example: "/placeholder.svg?height=200&width=200&text=Oil+Painting",
    prompt: "oil painting, classical art, rich textures, painterly, traditional technique, canvas texture",
    gradient: "from-amber-400 to-red-500",
  },
  {
    id: "sketch",
    name: "Pencil Sketch",
    description: "Hand-drawn pencil sketch with detailed shading",
    example: "/placeholder.svg?height=200&width=200&text=Sketch",
    prompt: "pencil sketch, hand drawn, detailed shading, graphite, artistic drawing, black and white",
    gradient: "from-gray-400 to-gray-600",
  },
  {
    id: "pop-art",
    name: "Pop Art",
    description: "Bold colors and comic book style like Andy Warhol",
    example: "/placeholder.svg?height=200&width=200&text=Pop+Art",
    prompt: "pop art style, Andy Warhol, bold colors, high contrast, comic book style, screen printing effect",
    gradient: "from-red-400 to-yellow-400",
  },
  {
    id: "impressionist",
    name: "Impressionist",
    description: "Soft brushstrokes capturing light and movement",
    example: "/placeholder.svg?height=200&width=200&text=Impressionist",
    prompt: "impressionist painting, soft brushstrokes, light and shadow, Monet style, plein air, atmospheric",
    gradient: "from-purple-300 to-pink-400",
  },
]

export default function StyleTransferPage() {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [selectedStyle, setSelectedStyle] = useState<StylePreset | null>(null)
  const [customPrompt, setCustomPrompt] = useState("")
  const [useCustomPrompt, setUseCustomPrompt] = useState(false)
  const [styleStrength, setStyleStrength] = useState([80])
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedImage, setGeneratedImage] = useState<string | null>(null)
  const [showComparison, setShowComparison] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      setUploadedImage(e.target?.result as string)
      setGeneratedImage(null)
      setShowComparison(false)
    }
    reader.readAsDataURL(file)
  }

  const generateStyleTransfer = async () => {
    if (!uploadedImage || (!selectedStyle && !customPrompt.trim())) return

    setIsGenerating(true)

    try {
      const stylePrompt = useCustomPrompt ? customPrompt : selectedStyle?.prompt || ""
      
      console.log("Starting style transfer with uploaded image")
      console.log("Style:", selectedStyle?.name || "Custom")
      console.log("Strength:", styleStrength[0])
      console.log("Image data preview:", uploadedImage.substring(0, 100))
      console.log("Image data length:", uploadedImage.length)
      console.log("Style prompt:", stylePrompt)
      
      // Call the actual API to apply style transfer with the uploaded image
      const response = await apiClient.applyStyleTransfer(
        "Apply style to uploaded image", // Generic prompt for context
        stylePrompt, // The style to apply
        styleStrength[0], // Style strength
        uploadedImage // Send the actual uploaded image
      )
      
      console.log("Style transfer completed successfully")
      setGeneratedImage(response.imageUrl)
      setShowComparison(true)
    } catch (error) {
      console.error("Error applying style transfer:", error)
      // Show helpful error message
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
      alert(`Failed to apply style transfer: ${errorMessage}. Please try again.`)
      
      // Fallback to placeholder for UI consistency
      const styleText = useCustomPrompt ? "custom style" : selectedStyle?.name || "styled"
      setGeneratedImage(`/placeholder.svg?height=512&width=512&text=${encodeURIComponent(`Error applying ${styleText}`)}`)
      setShowComparison(true)
    } finally {
      setIsGenerating(false)
    }
  }

  const downloadImage = () => {
    if (!generatedImage) return

    try {
      // Create a temporary link element
      const link = document.createElement("a")
      link.href = generatedImage
      link.download = `styled-image-${selectedStyle?.name || 'custom'}-${Date.now()}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      console.log("Downloaded styled image successfully")
    } catch (error) {
      console.error("Error downloading image:", error)
      alert("Failed to download image. Please try again.")
    }
  }

  const resetTransfer = () => {
    setUploadedImage(null)
    setGeneratedImage(null)
    setSelectedStyle(null)
    setCustomPrompt("")
    setShowComparison(false)
    setUseCustomPrompt(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-card to-muted">
      {/* Navigation */}
      <div className="p-4">
        <div className="max-w-7xl mx-auto">
          <Link href="/">
            <Button variant="ghost" className="mb-4 hover:bg-primary/10 hover:text-black">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 pb-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <h1 className="font-heading font-black text-4xl md:text-6xl mb-4">
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Style</span>{" "}
            Transfer
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Transform your photos with artistic styles from famous painters to modern digital art
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Controls Panel */}
          <div className="lg:col-span-1 space-y-6">
            {/* Upload Image */}
            <Card className="glass border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="w-5 h-5" />
                  Upload Image
                </CardTitle>
              </CardHeader>
              <CardContent>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />

                {uploadedImage ? (
                  <div className="space-y-4">
                    <div className="aspect-square rounded-lg overflow-hidden">
                      <img
                        src={uploadedImage || "/placeholder.svg"}
                        alt="Uploaded image"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <Button onClick={() => fileInputRef.current?.click()} variant="outline" className="w-full">
                      <Upload className="w-4 h-4 mr-2" />
                      Change Image
                    </Button>
                  </div>
                ) : (
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    variant="outline"
                    className="w-full h-32 border-dashed"
                  >
                    <div className="text-center">
                      <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                      <span>Choose an image to style</span>
                    </div>
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Style Selection */}
            <Card className="glass border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="w-5 h-5" />
                  Choose Style
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="custom-style" className="text-sm font-medium">
                    Use custom style prompt
                  </Label>
                  <Button variant="ghost" size="sm" onClick={() => setUseCustomPrompt(!useCustomPrompt)}>
                    {useCustomPrompt ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>

                <AnimatePresence>
                  {useCustomPrompt ? (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                    >
                      <Input
                        placeholder="Describe the artistic style you want..."
                        value={customPrompt}
                        onChange={(e) => setCustomPrompt(e.target.value)}
                        className="w-full"
                      />
                    </motion.div>
                  ) : (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-2 gap-3">
                      {stylePresets.map((style) => (
                        <motion.div
                          key={style.id}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setSelectedStyle(style)}
                          className={`cursor-pointer rounded-lg border-2 transition-all ${
                            selectedStyle?.id === style.id
                              ? "border-primary shadow-lg"
                              : "border-border hover:border-primary/50"
                          }`}
                        >
                          <div className={`p-3 rounded-lg bg-gradient-to-br ${style.gradient} text-white text-center`}>
                            <div className="text-sm font-medium mb-1">{style.name}</div>
                            <div className="text-xs opacity-90">{style.description}</div>
                          </div>
                        </motion.div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Style Strength */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Style Strength: {styleStrength[0]}%</Label>
                  <Slider value={styleStrength} onValueChange={setStyleStrength} max={100} min={10} step={10} />
                </div>

                <Button
                  onClick={generateStyleTransfer}
                  disabled={!uploadedImage || (!selectedStyle && !customPrompt.trim()) || isGenerating}
                  className="w-full bg-gradient-to-r from-primary to-secondary"
                  size="lg"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Applying Style...
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-4 h-4 mr-2" />
                      Apply Style
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Result Display */}
          <div className="lg:col-span-2">
            <Card className="glass border-border/50">
              <CardHeader>
                <CardTitle>Result</CardTitle>
              </CardHeader>
              <CardContent>
                {!uploadedImage ? (
                  <div className="aspect-[4/3] bg-muted/20 rounded-xl flex flex-col items-center justify-center text-center p-8">
                    <ImageIcon className="w-16 h-16 text-muted-foreground mb-4" />
                    <h3 className="font-heading font-bold text-xl mb-2">Upload an image to get started</h3>
                    <p className="text-muted-foreground">Choose a photo and select an artistic style to transform it</p>
                  </div>
                ) : isGenerating ? (
                  <div className="aspect-[4/3] bg-muted/20 rounded-xl flex flex-col items-center justify-center text-center p-8">
                    <div className="w-20 h-20 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center mb-6 animate-pulse">
                      <Palette className="w-10 h-10 text-white" />
                    </div>
                    <h3 className="font-heading font-bold text-xl mb-2">Applying Artistic Style...</h3>
                    <p className="text-muted-foreground mb-4">
                      Our AI is transforming your image with {selectedStyle?.name || "custom"} style
                    </p>
                    <div className="w-full max-w-xs bg-muted rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-primary to-secondary h-2 rounded-full animate-pulse"
                        style={{ width: "60%" }}
                      ></div>
                    </div>
                  </div>
                ) : showComparison && generatedImage ? (
                  <div className="space-y-6">
                    <div className="relative aspect-[4/3] rounded-xl overflow-hidden">
                      <img
                        src={generatedImage || "/placeholder.svg"}
                        alt="Styled result"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute bottom-4 right-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm">
                        {selectedStyle?.name || "Styled"}
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <Button onClick={downloadImage} className="flex-1">
                        <Download className="w-4 h-4 mr-2" />
                        Download Styled Image
                      </Button>
                      <Button variant="outline" onClick={resetTransfer} className="flex-1 bg-transparent">
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Start Over
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="aspect-[4/3] rounded-xl overflow-hidden">
                    <img
                      src={uploadedImage || "/placeholder.svg"}
                      alt="Uploaded image"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
