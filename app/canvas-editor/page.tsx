"use client"

import type React from "react"

import { useState, useEffect, useCallback, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import {
  ArrowLeft,
  Upload,
  Brush,
  Eraser,
  Square,
  Circle,
  Type,
  Layers,
  Undo,
  Redo,
  Download,
  RefreshCw,
  Wand2,
  ZoomIn,
  ZoomOut,
  Loader2,
  Eye,
  EyeOff,
  Move,
  MousePointer,
} from "lucide-react"
import Link from "next/link"
import { apiClient } from "@/lib/api-client"

interface Layer {
  id: string
  name: string
  visible: boolean
  opacity: number
  type: "image" | "mask" | "text" | "shape"
}

interface CanvasState {
  tool: "brush" | "eraser" | "select" | "move" | "text" | "rectangle" | "circle"
  brushSize: number
  color: string
  zoom: number
  layers: Layer[]
  activeLayer: string
}

interface CanvasHistory {
  canvas: ImageData
  mask: ImageData
}

export default function CanvasEditorPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const maskCanvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [canvasState, setCanvasState] = useState<CanvasState>({
    tool: "brush",
    brushSize: 20,
    color: "#3b82f6",
    zoom: 100,
    layers: [
      { id: "background", name: "Background", visible: true, opacity: 100, type: "image" },
      { id: "mask", name: "Edit Mask", visible: true, opacity: 25, type: "mask" },
    ],
    activeLayer: "mask",
  })

  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [editPrompt, setEditPrompt] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [showMask, setShowMask] = useState(true)
  const [showLayers, setShowLayers] = useState(false)
  const [showTools, setShowTools] = useState(true)
  const [generatedResult, setGeneratedResult] = useState<string | null>(null)
  const [showComparison, setShowComparison] = useState(false)
  const [undoStack, setUndoStack] = useState<CanvasHistory[]>([])
  const [redoStack, setRedoStack] = useState<CanvasHistory[]>([])

  const tools = [
    { id: "brush", icon: Brush, label: "Brush" },
    { id: "eraser", icon: Eraser, label: "Eraser" },
  ]

  const brushSizes = [5, 10, 20, 40, 80]
  const zoomLevels = [25, 50, 75, 100, 125, 150, 200]

  useEffect(() => {
    const canvas = canvasRef.current
    const maskCanvas = maskCanvasRef.current
    if (!canvas || !maskCanvas) return

    const ctx = canvas.getContext("2d")
    const maskCtx = maskCanvas.getContext("2d")
    if (!ctx || !maskCtx) return

    // Set canvas size
    canvas.width = 800
    canvas.height = 600
    maskCanvas.width = 800
    maskCanvas.height = 600

    // Initialize with white background
    ctx.fillStyle = "#ffffff"
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Initialize mask canvas with transparent background
    maskCtx.clearRect(0, 0, maskCanvas.width, maskCanvas.height)

    // Set default drawing properties
    ctx.lineCap = "round"
    ctx.lineJoin = "round"
    maskCtx.lineCap = "round"
    maskCtx.lineJoin = "round"

    // Save initial state after a short delay
    setTimeout(() => {
      saveToUndoStack()
    }, 100)
  }, [])

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Check file type before processing
    const supportedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/bmp']
    const fileType = file.type.toLowerCase()
    
    if (!supportedTypes.includes(fileType) && !fileType.startsWith('image/')) {
      alert('Please upload a supported image format (PNG, JPEG, GIF, BMP). AVIF and WebP formats will be automatically converted.')
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext("2d")
        if (!ctx) return

        // Calculate scaling to fit canvas
        const scale = Math.min(canvas.width / img.width, canvas.height / img.height)
        const x = (canvas.width - img.width * scale) / 2
        const y = (canvas.height - img.height * scale) / 2

        ctx.clearRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(img, x, y, img.width * scale, img.height * scale)

        // Convert the uploaded image to PNG format for API compatibility
        // Create a temporary canvas to convert the image to PNG
        const tempCanvas = document.createElement('canvas')
        const tempCtx = tempCanvas.getContext('2d')
        if (tempCtx) {
          tempCanvas.width = img.width
          tempCanvas.height = img.height
          tempCtx.drawImage(img, 0, 0)
          // Convert to PNG format and store
          const pngDataUrl = tempCanvas.toDataURL('image/png')
          setUploadedImage(pngDataUrl)
          console.log('Converted uploaded image to PNG format for API compatibility')
          console.log('Original file type:', file.type, '-> Converted to: image/png')
        } else {
          // Fallback to original if conversion fails
          setUploadedImage(e.target?.result as string)
          console.warn('Failed to convert image to PNG, using original format')
        }

        saveToUndoStack()
      }
      img.src = e.target?.result as string
    }
    reader.readAsDataURL(file)
  }

  const saveToUndoStack = () => {
    const canvas = canvasRef.current
    const maskCanvas = maskCanvasRef.current
    if (!canvas || !maskCanvas) return

    const ctx = canvas.getContext("2d")
    const maskCtx = maskCanvas.getContext("2d")
    if (!ctx || !maskCtx) return

    // Save both canvas states
    const canvasImageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const maskImageData = maskCtx.getImageData(0, 0, maskCanvas.width, maskCanvas.height)

    setUndoStack((prev) => [...prev.slice(-9), { canvas: canvasImageData, mask: maskImageData }])
    setRedoStack([]) // Clear redo stack when new action is performed
  }

  const undo = () => {
    if (undoStack.length === 0) return

    const canvas = canvasRef.current
    const maskCanvas = maskCanvasRef.current
    if (!canvas || !maskCanvas) return

    const ctx = canvas.getContext("2d")
    const maskCtx = maskCanvas.getContext("2d")
    if (!ctx || !maskCtx) return

    // Save current state to redo stack
    const currentCanvasState = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const currentMaskState = maskCtx.getImageData(0, 0, maskCanvas.width, maskCanvas.height)

    // Get previous state
    const previousState = undoStack[undoStack.length - 1]

    // Restore previous state
    ctx.putImageData(previousState.canvas, 0, 0)
    maskCtx.putImageData(previousState.mask, 0, 0)

    setRedoStack((prev) => [...prev, { canvas: currentCanvasState, mask: currentMaskState }])
    setUndoStack((prev) => prev.slice(0, -1))
  }

  const redo = () => {
    if (redoStack.length === 0) return

    const canvas = canvasRef.current
    const maskCanvas = maskCanvasRef.current
    if (!canvas || !maskCanvas) return

    const ctx = canvas.getContext("2d")
    const maskCtx = maskCanvas.getContext("2d")
    if (!ctx || !maskCtx) return

    // Save current state to undo stack
    const currentCanvasState = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const currentMaskState = maskCtx.getImageData(0, 0, maskCanvas.width, maskCanvas.height)

    // Get next state
    const nextState = redoStack[redoStack.length - 1]

    // Restore next state
    ctx.putImageData(nextState.canvas, 0, 0)
    maskCtx.putImageData(nextState.mask, 0, 0)

    setUndoStack((prev) => [...prev, { canvas: currentCanvasState, mask: currentMaskState }])
    setRedoStack((prev) => prev.slice(0, -1))
  }

  const getMousePos = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }

    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height

    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    }
  }, [])

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (canvasState.tool !== "brush" && canvasState.tool !== "eraser") return

    setIsDrawing(true)
    const pos = getMousePos(e)

    const canvas = canvasState.activeLayer === "mask" ? maskCanvasRef.current : canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Save state for undo before starting to draw
    saveToUndoStack()

    // Configure drawing properties
    ctx.lineWidth = canvasState.brushSize
    ctx.lineCap = "round"
    ctx.lineJoin = "round"

    if (canvasState.tool === "brush") {
      if (canvasState.activeLayer === "mask") {
        // Use "lighten" composite mode to prevent opacity buildup - only applies if new color is lighter
        ctx.globalCompositeOperation = "lighten"
        ctx.globalAlpha = 1 // Full alpha, but lighten mode prevents buildup
        ctx.strokeStyle = "rgba(59, 130, 246, 0.25)" // Fixed transparency in the color itself
        ctx.fillStyle = "rgba(59, 130, 246, 0.25)"
      } else {
        // For main canvas, use normal mode but with RGBA color for fixed transparency
        ctx.globalCompositeOperation = "source-over"
        ctx.globalAlpha = 1 // Full alpha, transparency handled by color
        // Convert hex color to RGBA with fixed 25% alpha
        const hexColor = canvasState.color
        const r = parseInt(hexColor.slice(1, 3), 16)
        const g = parseInt(hexColor.slice(3, 5), 16)
        const b = parseInt(hexColor.slice(5, 7), 16)
        const rgbaColor = `rgba(${r}, ${g}, ${b}, 0.25)`
        console.log('Using RGBA color for brush:', rgbaColor)
        ctx.strokeStyle = rgbaColor
        ctx.fillStyle = rgbaColor
      }
    } else if (canvasState.tool === "eraser") {
      ctx.globalCompositeOperation = "destination-out"
      ctx.globalAlpha = 1 // Eraser should be at full strength
    }

    ctx.beginPath()
    ctx.arc(pos.x, pos.y, canvasState.brushSize / 2, 0, 2 * Math.PI)
    ctx.fill()
    ctx.beginPath()
    ctx.moveTo(pos.x, pos.y)
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return
    if (canvasState.tool !== "brush" && canvasState.tool !== "eraser") return

    const pos = getMousePos(e)
    const canvas = canvasState.activeLayer === "mask" ? maskCanvasRef.current : canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.lineTo(pos.x, pos.y)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(pos.x, pos.y)
  }

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false)
      // Don't save to undo stack here as it's already saved in startDrawing
    }
  }

  const clearMask = () => {
    const maskCanvas = maskCanvasRef.current
    if (!maskCanvas) return

    const ctx = maskCanvas.getContext("2d")
    if (!ctx) return

    ctx.clearRect(0, 0, maskCanvas.width, maskCanvas.height)
    saveToUndoStack()
  }

  const generateEdit = async () => {
    if (!editPrompt.trim()) return

    const canvas = canvasRef.current
    if (!canvas) {
      console.error("Canvas not available")
      return
    }

    // Check if there's any content on the canvas
    const ctx = canvas.getContext("2d")
    if (!ctx) {
      console.error("Canvas context not available")
      return
    }

    setIsGenerating(true)

    try {
      const maskCanvas = maskCanvasRef.current

      // Convert canvas to base64 image
      const canvasImageData = canvas.toDataURL('image/png')

      // Convert mask canvas to base64 if there's mask data
      let maskImageData = null
      if (maskCanvas) {
        const maskCtx = maskCanvas.getContext('2d')
        if (maskCtx) {
          const imageData = maskCtx.getImageData(0, 0, maskCanvas.width, maskCanvas.height)
          const hasContent = imageData.data.some((value: number, index: number) => index % 4 === 3 && value > 0) // Check alpha channel

          if (hasContent) {
            maskImageData = maskCanvas.toDataURL('image/png')
            console.log("Found mask data for targeted editing")
          }
        }
      }

      // Create a more descriptive prompt for the AI
      const basePrompt = maskImageData
        ? "Edit the masked areas of this image according to the instructions. Focus only on the blue highlighted regions."
        : "Edit this image according to the instructions."

      // Ensure all images are in PNG format for API compatibility
      let processedOriginalImage = uploadedImage
      if (uploadedImage && !uploadedImage.startsWith('data:image/png')) {
        console.log('Converting original image to PNG format for API compatibility')
        // If the original isn't PNG, we'll still send it but log a warning
        console.warn('Original image is not PNG format:', uploadedImage.substring(0, 50))
      }

      console.log("Sending both original and canvas images to AI for editing...")
      console.log("Original image data preview:", processedOriginalImage ? processedOriginalImage.substring(0, 100) : "No original image")
      console.log("Canvas image data preview:", canvasImageData.substring(0, 100))
      console.log("Original image data length:", processedOriginalImage ? processedOriginalImage.length : 0)
      console.log("Canvas image data length:", canvasImageData.length)
      console.log("Has mask data:", !!maskImageData)
      console.log("Edit instructions:", editPrompt)

      // Call the API with both original and edited images
      const response = await apiClient.editImage(
        basePrompt, // Base prompt for context
        editPrompt, // User's edit instructions
        processedOriginalImage || undefined, // Original uploaded image (converted to PNG)
        canvasImageData, // Canvas-edited image with user markings (already PNG)
        maskImageData || undefined // Include mask if available (already PNG)
      )

      console.log("Received edited image from AI")
      setGeneratedResult(response.imageUrl)
      setShowComparison(true)
    } catch (error) {
      console.error("Error generating edit:", error)
      // Show a more helpful error message
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
      alert(`Failed to edit image: ${errorMessage}. Please try again.`)
    } finally {
      setIsGenerating(false)
    }
  }

  const toggleLayerVisibility = (layerId: string) => {
    setCanvasState(prev => ({
      ...prev,
      layers: prev.layers.map(layer =>
        layer.id === layerId
          ? { ...layer, visible: !layer.visible }
          : layer
      )
    }))
  }

  const zoomIn = () => {
    const currentIndex = zoomLevels.indexOf(canvasState.zoom)
    if (currentIndex < zoomLevels.length - 1) {
      setCanvasState(prev => ({ ...prev, zoom: zoomLevels[currentIndex + 1] }))
    }
  }

  const zoomOut = () => {
    const currentIndex = zoomLevels.indexOf(canvasState.zoom)
    if (currentIndex > 0) {
      setCanvasState(prev => ({ ...prev, zoom: zoomLevels[currentIndex - 1] }))
    }
  }

  const downloadCanvas = () => {
    if (generatedResult) {
      // Download the AI-generated result
      const link = document.createElement("a")
      link.download = `ai-edited-image-${Date.now()}.png`
      link.href = generatedResult
      link.click()
    } else {
      // Fallback to canvas if no generated result
      const canvas = canvasRef.current
      if (!canvas) return

      const link = document.createElement("a")
      link.download = "canvas-edit.png"
      link.href = canvas.toDataURL('image/png') // Explicitly specify PNG format
      link.click()
    }
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
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Canvas</span>{" "}
            Editor
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Professional image editing with AI-powered brush tools, layers, and precise masking
          </p>
        </motion.div>

        <div className={`grid gap-6 ${showComparison && generatedResult ? 'grid-cols-1' : 'grid-cols-1 xl:grid-cols-4'}`}>
          {/* Tools Panel - Hidden when showing AI result */}
          {!(showComparison && generatedResult) && (
            <div className="xl:col-span-1 space-y-4">
            {/* Upload */}
            <Card className="glass border-border/50">
              <CardHeader>
                <CardTitle className="text-lg">Upload Image</CardTitle>
              </CardHeader>
              <CardContent>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/gif,image/bmp,image/webp,image/avif"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <Button onClick={() => fileInputRef.current?.click()} variant="outline" className="w-full">
                  <Upload className="w-4 h-4 mr-2" />
                  Choose Image
                </Button>
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  Supports PNG, JPEG, GIF, BMP, WebP, AVIF<br />
                  (Auto-converted to PNG for AI processing)
                </p>
              </CardContent>
            </Card>

            {/* Tools */}
            <Card className="glass border-border/50">
              <CardHeader>
                <CardTitle className="text-lg flex items-center justify-between">
                  Tools
                  <Button variant="ghost" size="sm" onClick={() => setShowTools(!showTools)}>
                    {showTools ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </CardTitle>
              </CardHeader>
              <AnimatePresence>
                {showTools && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                  >
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-2">
                        {tools.map((tool) => {
                          const Icon = tool.icon
                          return (
                            <Button
                              key={tool.id}
                              variant={canvasState.tool === tool.id ? "default" : "outline"}
                              size="sm"
                              onClick={() => setCanvasState((prev) => ({ ...prev, tool: tool.id as any }))}
                              className="flex flex-col gap-1 h-auto py-3"
                            >
                              <Icon className="w-4 h-4" />
                              <span className="text-xs">{tool.label}</span>
                            </Button>
                          )
                        })}
                      </div>

                      {/* Brush Size */}
                      <div>
                        <Label className="text-sm font-medium mb-2 block">Brush Size: {canvasState.brushSize}px</Label>
                        {/* <div className="grid grid-cols-5 gap-1 mb-2">
                          {brushSizes.map((size) => (
                            <Button
                              key={size}
                              variant={canvasState.brushSize === size ? "default" : "outline"}
                              size="sm"
                              onClick={() => setCanvasState((prev) => ({ ...prev, brushSize: size }))}
                              className="text-xs"
                            >
                              {size}
                            </Button>
                          ))}
                        </div> */}
                        <Slider
                          value={[canvasState.brushSize]}
                          onValueChange={([value]) => setCanvasState((prev) => ({ ...prev, brushSize: value }))}
                          max={100}
                          min={1}
                          step={1}
                        />
                      </div>

                      {/* Color Picker */}
                      {/* <div> */}
                      {/* <Label className="text-sm font-medium mb-2 block">Color</Label>
                        <div className="flex gap-2">
                          <input
                            type="color"
                            value={canvasState.color}
                            onChange={(e) => {
                              console.log('Color changed from', canvasState.color, 'to', e.target.value)
                              setCanvasState((prev) => ({ ...prev, color: e.target.value }))
                            }}
                            className="w-12 h-8 rounded border border-border"
                          />
                          <div className="grid grid-cols-4 gap-1 flex-1">
                            {[
                              "#3b82f6",
                              "#ef4444",
                              "#10b981",
                              "#f59e0b",
                              "#8b5cf6",
                              "#ec4899",
                              "#6b7280",
                              "#000000",
                            ].map((color) => (
                              <button
                                key={color}
                                className="w-6 h-6 rounded border border-border"
                                style={{ backgroundColor: color }}
                                onClick={() => setCanvasState((prev) => ({ ...prev, color }))}
                              />
                            ))}
                          </div> */}
                      {/* </div>
                      </div> */}
                    </CardContent>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>

            {/* Edit Instructions */}
            <Card className="glass border-border/50">
              <CardHeader>
                <CardTitle className="text-lg">Edit Instructions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="edit-prompt" className="text-sm font-medium mb-2 block">
                    Describe what to change in the masked area
                  </Label>
                  <Textarea
                    id="edit-prompt"
                    placeholder="Change the sky to sunset colors, add clouds, make it more dramatic..."
                    value={editPrompt}
                    onChange={(e) => setEditPrompt(e.target.value)}
                    className="min-h-[100px] resize-none"
                  />
                </div>

                <Button
                  onClick={generateEdit}
                  disabled={!editPrompt.trim() || isGenerating || (!uploadedImage && !canvasRef.current)}
                  className="w-full bg-gradient-to-r from-primary to-secondary"
                  size="lg"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-4 h-4 mr-2" />
                      Apply AI Edit
                    </>
                  )}
                </Button>

                <Button onClick={clearMask} variant="outline" className="w-full bg-transparent">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Clear Mask
                </Button>
              </CardContent>
            </Card>
          </div>
          )}

          {/* Canvas Area */}
          <div className={showComparison && generatedResult ? 'col-span-1' : 'xl:col-span-3'}>
            <Card className="glass border-border/50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">
                    {showComparison && generatedResult ? "AI Edited Result" : "Canvas"}
                  </CardTitle>

                  {!showComparison && (
                    <div className="flex items-center gap-2">
                      {/* Zoom Controls */}
                      <div className="flex items-center gap-1">
                        <Button variant="outline" size="sm" onClick={zoomOut} disabled={canvasState.zoom <= zoomLevels[0]}>
                          <ZoomOut className="w-4 h-4" />
                        </Button>
                        <span className="text-sm px-2">{canvasState.zoom}%</span>
                        <Button variant="outline" size="sm" onClick={zoomIn} disabled={canvasState.zoom >= zoomLevels[zoomLevels.length - 1]}>
                          <ZoomIn className="w-4 h-4" />
                        </Button>
                      </div>

                      {/* Undo/Redo */}
                      <Button variant="outline" size="sm" onClick={undo} disabled={undoStack.length === 0}>
                        <Undo className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={redo} disabled={redoStack.length === 0}>
                        <Redo className="w-4 h-4" />
                      </Button>

                      <Button variant="outline" size="sm" onClick={downloadCanvas}>
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {showComparison && generatedResult ? (
                  <div className="space-y-4">
                    <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-muted/20">
                      <img
                        src={generatedResult || "/placeholder.svg"}
                        alt="AI Edited Result"
                        className="w-full h-full object-contain"
                      />
                      <div className="absolute bottom-4 right-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm font-medium">
                        AI Edited
                      </div>
                    </div>
                    
                    {/* Download and new edit buttons */}
                    <div className="flex gap-3 justify-center">
                      <Button onClick={downloadCanvas} size="lg" className="bg-gradient-to-r from-primary to-secondary">
                        <Download className="w-4 h-4 mr-2" />
                        Download Result
                      </Button>
                      <Button 
                        variant="outline" 
                        size="lg" 
                        onClick={() => {
                          setShowComparison(false)
                          setGeneratedResult(null)
                        }}
                      >
                        <Wand2 className="w-4 h-4 mr-2" />
                        Start New Edit
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-muted/20">
                    <div
                      className="relative w-full h-full flex items-center justify-center"
                      style={{ transform: `scale(${canvasState.zoom / 100})` }}
                    >
                      <canvas
                        ref={canvasRef}
                        className="absolute cursor-crosshair"
                        style={{
                          maxWidth: '100%',
                          maxHeight: '100%',
                          imageRendering: 'pixelated'
                        }}
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                      />
                      {showMask && (
                        <canvas
                          ref={maskCanvasRef}
                          className="absolute pointer-events-none"
                          style={{
                            maxWidth: '100%',
                            maxHeight: '100%',
                            imageRendering: 'pixelated'
                          }}
                        />
                      )}
                    </div>

                    {!uploadedImage && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8">
                        <Upload className="w-16 h-16 text-muted-foreground mb-4" />
                        <h3 className="font-heading font-bold text-xl mb-2">Upload an image to start editing</h3>
                        <p className="text-muted-foreground">
                          Choose an image file to begin your canvas editing session
                        </p>
                      </div>
                    )}
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