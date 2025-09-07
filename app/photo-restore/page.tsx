"use client"

import { useState, useRef, useCallback } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { 
  Camera, 
  Upload, 
  Download, 
  RefreshCw, 
  Sparkles, 
  Palette,
  Wand2,
  ArrowLeft,
  Zap
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"

type RestorationType = 'restore' | 'colorize' | 'enhance'

const restorationTypes = [
  {
    value: 'restore' as RestorationType,
    label: 'Restore Damage',
    description: 'Remove scratches, stains, and repair damaged areas',
    icon: RefreshCw,
    color: 'from-blue-500 to-cyan-500'
  },
  {
    value: 'colorize' as RestorationType,
    label: 'Add Color',
    description: 'Colorize black and white photographs',
    icon: Palette,
    color: 'from-purple-500 to-pink-500'
  },
  {
    value: 'enhance' as RestorationType,
    label: 'Enhance Quality',
    description: 'Improve clarity, sharpness, and overall quality',
    icon: Sparkles,
    color: 'from-yellow-500 to-orange-500'
  }
]

export default function PhotoRestorePage() {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [restoredImage, setRestoredImage] = useState<string | null>(null)
  const [prompt, setPrompt] = useState("")
  const [restorationType, setRestorationType] = useState<RestorationType>('restore')
  const [isLoading, setIsLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        setError("Image file is too large. Please choose an image under 10MB.")
        return
      }

      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        setUploadedImage(result)
        setRestoredImage(null)
        setError(null)
      }
      reader.readAsDataURL(file)
    }
  }, [])

  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    const file = event.dataTransfer.files?.[0]
    
    if (file && file.type.startsWith('image/')) {
      if (file.size > 10 * 1024 * 1024) {
        setError("Image file is too large. Please choose an image under 10MB.")
        return
      }

      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        setUploadedImage(result)
        setRestoredImage(null)
        setError(null)
      }
      reader.readAsDataURL(file)
    }
  }, [])

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
  }, [])

  const restorePhoto = async () => {
    if (!uploadedImage) {
      setError("Please upload an image first")
      return
    }

    setIsLoading(true)
    setProgress(0)
    setError(null)

    // Simulate progress
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) return prev
        return prev + Math.random() * 15
      })
    }, 500)

    try {
      const response = await fetch("/api/photo-restore", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: prompt || undefined,
          imageData: uploadedImage,
          restorationType
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error("API Error Details:", errorData)
        const errorMessage = errorData.details 
          ? `${errorData.error}: ${errorData.details}` 
          : errorData.error || `HTTP error! status: ${response.status}`
        throw new Error(errorMessage)
      }

      const data = await response.json()
      setProgress(100)
      setRestoredImage(data.imageUrl)
    } catch (error) {
      console.error("Error restoring photo:", error)
      setError(error instanceof Error ? error.message : "Failed to restore photo")
    } finally {
      clearInterval(progressInterval)
      setIsLoading(false)
      setProgress(0)
    }
  }

  const downloadImage = () => {
    if (!restoredImage) return

    const link = document.createElement('a')
    link.href = restoredImage
    link.download = `restored-photo-${Date.now()}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const startNewRestoration = () => {
    setUploadedImage(null)
    setRestoredImage(null)
    setPrompt("")
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const selectedRestorationType = restorationTypes.find(type => type.value === restorationType)

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-card to-muted">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 glass border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center space-x-2 no-underline">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center animate-glow">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <span className="font-heading font-black text-2xl bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                NanoGram
              </span>
            </Link>

            <Link href="/">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <div className="pt-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h1 className="font-heading font-black text-4xl md:text-6xl mb-4">
            <span className="bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
              Photo Restoration
            </span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Bring your old memories back to life with AI-powered restoration, colorization, and enhancement
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Controls Panel */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card className="glass border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Camera className="w-5 h-5" />
                  Photo Upload & Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Image Upload */}
                <div>
                  <Label htmlFor="image-upload" className="text-sm font-medium mb-2 block">
                    Upload Photo
                  </Label>
                  <div
                    className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {uploadedImage ? (
                      <div className="space-y-2">
                        <div className="w-20 h-20 mx-auto relative rounded-lg overflow-hidden">
                          <Image
                            src={uploadedImage}
                            alt="Uploaded photo"
                            fill
                            className="object-cover"
                          />
                        </div>
                        <p className="text-sm text-muted-foreground">Click to change photo</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Upload className="w-12 h-12 mx-auto text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                          Drag and drop your photo here, or click to browse
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Supports PNG, JPG, WebP (max 10MB)
                        </p>
                      </div>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="image-upload"
                    />
                  </div>
                </div>

                {/* Restoration Type */}
                <div>
                  <Label className="text-sm font-medium mb-3 block">
                    Restoration Type
                  </Label>
                  <Select value={restorationType} onValueChange={(value: RestorationType) => setRestorationType(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {restorationTypes.map((type) => {
                        const Icon = type.icon
                        return (
                          <SelectItem key={type.value} value={type.value}>
                            <div className="flex items-center gap-2">
                              <Icon className="w-4 h-4" />
                              <span>{type.label}</span>
                            </div>
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                  {selectedRestorationType && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {selectedRestorationType.description}
                    </p>
                  )}
                </div>

                {/* Custom Instructions */}
                <div>
                  <Label htmlFor="prompt" className="text-sm font-medium mb-2 block">
                    Custom Instructions (Optional)
                  </Label>
                  <Textarea
                    id="prompt"
                    placeholder="Describe specific restoration needs or preferences..."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="min-h-[80px] resize-none"
                  />
                </div>

                {/* Restore Button */}
                <Button
                  onClick={restorePhoto}
                  disabled={!uploadedImage || isLoading}
                  className="w-full h-12 text-base"
                  size="lg"
                >
                  {isLoading ? (
                    <>
                      <Wand2 className="w-5 h-5 mr-2 animate-spin" />
                      Restoring Photo...
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-5 h-5 mr-2" />
                      Restore Photo
                    </>
                  )}
                </Button>

                {/* Progress Bar */}
                {isLoading && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Processing...</span>
                      <span>{Math.round(progress)}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>
                )}

                {/* Error Message */}
                {error && (
                  <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                    <p className="text-sm text-destructive">{error}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Preview Panel */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="glass border-border/50 h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  Photo Preview
                </CardTitle>
              </CardHeader>
              <CardContent>
                {restoredImage ? (
                  <div className="space-y-4">
                    <div className="relative aspect-square w-full rounded-lg overflow-hidden border border-border/50">
                      <Image
                        src={restoredImage}
                        alt="Restored photo"
                        fill
                        className="object-contain"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={downloadImage}
                        className="flex-1"
                        variant="outline"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                      <Button
                        onClick={startNewRestoration}
                        className="flex-1"
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Start New
                      </Button>
                    </div>
                  </div>
                ) : uploadedImage ? (
                  <div className="space-y-4">
                    <div className="relative aspect-square w-full rounded-lg overflow-hidden border border-border/50">
                      <Image
                        src={uploadedImage}
                        alt="Original photo"
                        fill
                        className="object-contain"
                      />
                    </div>
                    <p className="text-center text-sm text-muted-foreground">
                      Original photo - click "Restore Photo" to begin
                    </p>
                  </div>
                ) : (
                  <div className="aspect-square w-full rounded-lg border-2 border-dashed border-border flex items-center justify-center">
                    <div className="text-center space-y-2">
                      <Camera className="w-12 h-12 mx-auto text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        Upload a photo to see the preview
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Restoration Type Info Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12"
        >
          {restorationTypes.map((type, index) => {
            const Icon = type.icon
            return (
              <Card
                key={type.value}
                className={`glass border-border/50 cursor-pointer transition-all duration-300 hover:scale-105 ${
                  restorationType === type.value ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => setRestorationType(type.value)}
              >
                <CardContent className="p-6 text-center">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${type.color} flex items-center justify-center mx-auto mb-4`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{type.label}</h3>
                  <p className="text-sm text-muted-foreground">{type.description}</p>
                </CardContent>
              </Card>
            )
          })}
        </motion.div>
      </div>
    </div>
  )
}