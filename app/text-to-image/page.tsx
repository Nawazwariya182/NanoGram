"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { apiClient } from "@/lib/api-client"
import {
  ArrowLeft,
  Wand2,
  Sparkles,
  Download,
  RefreshCw,
  Edit3,
  Eye,
  Loader2,
  ImageIcon,
  Settings,
  Zap,
  Copy,
  Check,
} from "lucide-react"
import Link from "next/link"

interface GeneratedImage {
  id: string
  url: string
  prompt: string
  enhancedPrompt: string
  timestamp: Date
}

export default function TextToImagePage() {
  const [prompt, setPrompt] = useState("")
  const [editPrompt, setEditPrompt] = useState("")
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [showEnhancedPrompt, setShowEnhancedPrompt] = useState(false)
  const [enhancedPrompt, setEnhancedPrompt] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [isEnhancing, setIsEnhancing] = useState(false)
  const [currentImage, setCurrentImage] = useState<GeneratedImage | null>(null)
  const [previousImage, setPreviousImage] = useState<GeneratedImage | null>(null)
  const [showComparison, setShowComparison] = useState(false)
  const [comparisonSlider, setComparisonSlider] = useState([50])
  const [imageHistory, setImageHistory] = useState<GeneratedImage[]>([])
  const [copied, setCopied] = useState(false)

  // Advanced settings
  const [aspectRatio, setAspectRatio] = useState("1:1")
  const [style, setStyle] = useState("photorealistic")
  const [quality, setQuality] = useState("high")

  const aspectRatios = [
    { value: "1:1", label: "Square (1:1)" },
    { value: "16:9", label: "Landscape (16:9)" },
    { value: "9:16", label: "Portrait (9:16)" },
    { value: "4:3", label: "Standard (4:3)" },
    { value: "3:2", label: "Photo (3:2)" },
  ]

  const styles = [
    { value: "photorealistic", label: "Photorealistic" },
    { value: "artistic", label: "Artistic" },
    { value: "digital-art", label: "Digital Art" },
    { value: "oil-painting", label: "Oil Painting" },
    { value: "watercolor", label: "Watercolor" },
    { value: "sketch", label: "Sketch" },
    { value: "anime", label: "Anime/Manga" },
    { value: "cinematic", label: "Cinematic" },
  ]

    const enhancePrompt = async (originalPrompt: string): Promise<string> => {
    setIsEnhancing(true)
    
    try {
      // Call the actual API to enhance the prompt
      const response = await apiClient.enhancePrompt(originalPrompt)
      const enhanced = response.enhancedPrompt
      
      setEnhancedPrompt(enhanced)
      setIsEnhancing(false)
      return enhanced
    } catch (error) {
      console.error("Error enhancing prompt:", error)
      // Fallback enhancement
      const styleText = styles.find((s) => s.value === style)?.label || "photorealistic"
      const enhanced = `${styleText} ${originalPrompt}, high quality, detailed, professional photography, ${quality} resolution, ${aspectRatio} aspect ratio, cinematic lighting, sharp focus`
      
      setEnhancedPrompt(enhanced)
      setIsEnhancing(false)
      return enhanced
    }
  }

  const generateImage = async (isEdit = false) => {
    const promptToUse = isEdit ? editPrompt : prompt
    if (!promptToUse.trim()) return

    setIsGenerating(true)

    try {
      const enhanced = await enhancePrompt(promptToUse)

      // Call the actual API to generate the image with text-to-image feature
      const response = await apiClient.generateImage(enhanced, true, 'text-to-image')

      const newImage: GeneratedImage = {
        id: Date.now().toString(),
        url: response.imageUrl,
        prompt: promptToUse,
        enhancedPrompt: enhanced,
        timestamp: new Date(),
      }

      if (isEdit && currentImage) {
        setPreviousImage(currentImage)
        setShowComparison(true)
      }

      setCurrentImage(newImage)
      setImageHistory((prev) => [newImage, ...prev.slice(0, 9)]) // Keep last 10 images
    } catch (error) {
      console.error("Error generating image:", error)
      // Fallback to placeholder if API fails
      const newImage: GeneratedImage = {
        id: Date.now().toString(),
        url: `/placeholder.svg?height=512&width=512&text=${encodeURIComponent("Error generating image")}`,
        prompt: promptToUse,
        enhancedPrompt: "",
        timestamp: new Date(),
      }
      setCurrentImage(newImage)
    } finally {
      setIsGenerating(false)
      setEditPrompt("")
    }
  }

  const copyPrompt = async (text: string) => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const downloadImage = () => {
    if (currentImage) {
      // In a real app, this would trigger actual download
      console.log("Downloading image:", currentImage.url)
    }
  }

  const resetEditor = () => {
    setPrompt("")
    setEditPrompt("")
    setCurrentImage(null)
    setPreviousImage(null)
    setShowComparison(false)
    setEnhancedPrompt("")
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
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Text to Image
            </span>{" "}
            Editor
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Transform your ideas into stunning visuals with natural language prompts and AI-powered editing
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Input Panel */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="glass border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wand2 className="w-5 h-5" />
                  Create Image
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="prompt" className="text-sm font-medium mb-2 block">
                    Describe your image
                  </Label>
                  <Textarea
                    id="prompt"
                    placeholder="A majestic mountain landscape at sunset with golden light reflecting on a crystal clear lake..."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="min-h-[120px] resize-none"
                  />
                </div>

                <Button
                  onClick={() => generateImage(false)}
                  disabled={!prompt.trim() || isGenerating || isEnhancing}
                  className="w-full bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90"
                  size="lg"
                >
                  {isGenerating || isEnhancing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {isEnhancing ? "Enhancing..." : "Generating..."}
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate Image
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Edit Panel */}
            {currentImage && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <Card className="glass border-border/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Edit3 className="w-5 h-5" />
                      Edit Image
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="edit-prompt" className="text-sm font-medium mb-2 block">
                        What would you like to change?
                      </Label>
                      <Textarea
                        id="edit-prompt"
                        placeholder="Make the sky more dramatic, add birds flying, change to winter scene..."
                        value={editPrompt}
                        onChange={(e) => setEditPrompt(e.target.value)}
                        className="min-h-[100px] resize-none"
                      />
                    </div>

                    <Button
                      onClick={() => generateImage(true)}
                      disabled={!editPrompt.trim() || isGenerating || isEnhancing}
                      variant="outline"
                      className="w-full"
                      size="lg"
                    >
                      {isGenerating || isEnhancing ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Editing...
                        </>
                      ) : (
                        <>
                          <Edit3 className="w-4 h-4 mr-2" />
                          Apply Edit
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Advanced Settings */}
            <Card className="glass border-border/50">
              <CardHeader>
                <CardTitle
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                >
                  <div className="flex items-center gap-2">
                    <Settings className="w-5 h-5" />
                    Advanced Settings
                  </div>
                  <motion.div animate={{ rotate: showAdvanced ? 180 : 0 }} transition={{ duration: 0.2 }}>
                    <ArrowLeft className="w-4 h-4 rotate-90" />
                  </motion.div>
                </CardTitle>
              </CardHeader>
              <AnimatePresence>
                {showAdvanced && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <CardContent className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium mb-2 block">Aspect Ratio</Label>
                        <div className="grid grid-cols-2 gap-2">
                          {aspectRatios.map((ratio) => (
                            <Button
                              key={ratio.value}
                              variant={aspectRatio === ratio.value ? "default" : "outline"}
                              size="sm"
                              onClick={() => setAspectRatio(ratio.value)}
                              className="text-xs"
                            >
                              {ratio.label}
                            </Button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm font-medium mb-2 block">Style</Label>
                        <div className="grid grid-cols-2 gap-2">
                          {styles.slice(0, 6).map((styleOption) => (
                            <Button
                              key={styleOption.value}
                              variant={style === styleOption.value ? "default" : "outline"}
                              size="sm"
                              onClick={() => setStyle(styleOption.value)}
                              className="text-xs"
                            >
                              {styleOption.label}
                            </Button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm font-medium mb-2 block">Quality</Label>
                        <div className="grid grid-cols-3 gap-2">
                          {["standard", "high", "ultra"].map((q) => (
                            <Button
                              key={q}
                              variant={quality === q ? "default" : "outline"}
                              size="sm"
                              onClick={() => setQuality(q)}
                              className="text-xs capitalize"
                            >
                              {q}
                            </Button>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Switch
                          id="show-enhanced"
                          checked={showEnhancedPrompt}
                          onCheckedChange={setShowEnhancedPrompt}
                        />
                        <Label htmlFor="show-enhanced" className="text-sm">
                          Show enhanced prompt
                        </Label>
                      </div>
                    </CardContent>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          </div>

          {/* Image Display */}
          <div className="lg:col-span-2">
            <Card className="glass border-border/50 h-fit">
              <CardContent className="p-6">
                {!currentImage ? (
                  <div className="aspect-square bg-muted/20 rounded-xl flex flex-col items-center justify-center text-center p-8">
                    <ImageIcon className="w-16 h-16 text-muted-foreground mb-4" />
                    <h3 className="font-heading font-bold text-xl mb-2">No image generated yet</h3>
                    <p className="text-muted-foreground">Enter a prompt and click "Generate Image" to get started</p>
                  </div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="space-y-6"
                  >
                    {/* Image Display with Comparison */}
                    <div className="relative">
                      {showComparison && previousImage ? (
                        <div className="relative aspect-square rounded-xl overflow-hidden">
                          <div className="absolute inset-0 flex">
                            <div className="relative overflow-hidden" style={{ width: `${comparisonSlider[0]}%` }}>
                              <img
                                src={previousImage.url || "/placeholder.svg"}
                                alt="Previous version"
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute bottom-4 left-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm">
                                Before
                              </div>
                            </div>
                            <div
                              className="relative overflow-hidden"
                              style={{ width: `${100 - comparisonSlider[0]}%` }}
                            >
                              <img
                                src={currentImage.url || "/placeholder.svg"}
                                alt="Current version"
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute bottom-4 right-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm">
                                After
                              </div>
                            </div>
                          </div>

                          {/* Slider Handle */}
                          <div
                            className="absolute top-0 bottom-0 w-1 bg-white shadow-lg cursor-col-resize"
                            style={{ left: `${comparisonSlider[0]}%` }}
                          >
                            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center">
                              <div className="w-4 h-4 bg-primary rounded-full"></div>
                            </div>
                          </div>

                          {/* Slider Control */}
                          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                            <Slider
                              value={comparisonSlider}
                              onValueChange={setComparisonSlider}
                              max={100}
                              step={1}
                              className="w-32"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="aspect-square rounded-xl overflow-hidden">
                          <img
                            src={currentImage.url || "/placeholder.svg"}
                            alt="Generated image"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                    </div>

                    {/* Image Actions */}
                    <div className="flex flex-wrap gap-3">
                      <Button onClick={downloadImage} className="flex-1 min-w-[120px]">
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </Button>

                      {showComparison && (
                        <Button
                          variant="outline"
                          onClick={() => setShowComparison(false)}
                          className="flex-1 min-w-[120px]"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Hide Comparison
                        </Button>
                      )}

                      <Button variant="outline" onClick={resetEditor} className="flex-1 min-w-[120px] bg-transparent">
                        <RefreshCw className="w-4 h-4 mr-2" />
                        New Image
                      </Button>
                    </div>

                    {/* Prompt Display */}
                    <div className="space-y-3">
                      <div className="bg-muted/50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <Label className="text-sm font-medium">Original Prompt</Label>
                          <Button variant="ghost" size="sm" onClick={() => copyPrompt(currentImage.prompt)}>
                            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                          </Button>
                        </div>
                        <p className="text-sm">{currentImage.prompt}</p>
                      </div>

                      {showEnhancedPrompt && enhancedPrompt && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          className="bg-primary/5 border border-primary/20 rounded-lg p-4"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <Label className="text-sm font-medium flex items-center gap-2">
                              <Zap className="w-4 h-4" />
                              Enhanced Prompt
                            </Label>
                            <Button variant="ghost" size="sm" onClick={() => copyPrompt(enhancedPrompt)}>
                              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                            </Button>
                          </div>
                          <p className="text-sm">{enhancedPrompt}</p>
                        </motion.div>
                      )}
                    </div>
                  </motion.div>
                )}
              </CardContent>
            </Card>

            {/* Image History */}
            {imageHistory.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-6">
                <Card className="glass border-border/50">
                  <CardHeader>
                    <CardTitle className="text-lg">Recent Images</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-4 md:grid-cols-6 gap-3">
                      {imageHistory.map((image) => (
                        <motion.div
                          key={image.id}
                          whileHover={{ scale: 1.05 }}
                          className="aspect-square rounded-lg overflow-hidden cursor-pointer border-2 border-transparent hover:border-primary/50 transition-colors"
                          onClick={() => setCurrentImage(image)}
                        >
                          <img
                            src={image.url || "/placeholder.svg"}
                            alt="Previous generation"
                            className="w-full h-full object-cover"
                          />
                        </motion.div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
