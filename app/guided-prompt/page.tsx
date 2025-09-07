"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { ArrowLeft, ArrowRight, Sparkles, Wand2, Loader2, Download, RefreshCw } from "lucide-react"
import Link from "next/link"
import { apiClient } from "@/lib/api-client"

interface Question {
  id: string
  type: "select" | "input" | "textarea"
  question: string
  options?: string[]
  placeholder?: string
  required: boolean
}

const categories = [
  { id: "portrait", name: "Portrait", description: "People, faces, characters" },
  { id: "landscape", name: "Landscape", description: "Nature, scenery, environments" },
  { id: "product", name: "Product", description: "Objects, items, commercial" },
  { id: "abstract", name: "Abstract", description: "Artistic, conceptual, creative" },
  { id: "architecture", name: "Architecture", description: "Buildings, structures, interiors" },
]

const questionSets: Record<string, Question[]> = {
  portrait: [
    {
      id: "subject",
      type: "input",
      question: "Who or what is the main subject?",
      placeholder: "e.g., young woman, elderly man, fantasy character",
      required: true,
    },
    {
      id: "style",
      type: "select",
      question: "What style do you prefer?",
      options: ["Photorealistic", "Artistic Portrait", "Cartoon/Anime", "Oil Painting", "Digital Art"],
      required: true,
    },
    {
      id: "mood",
      type: "select",
      question: "What mood should it convey?",
      options: ["Happy/Joyful", "Serious/Professional", "Mysterious", "Dramatic", "Peaceful"],
      required: true,
    },
    {
      id: "setting",
      type: "input",
      question: "Where should this be set?",
      placeholder: "e.g., studio background, outdoor garden, urban street",
      required: false,
    },
    {
      id: "details",
      type: "textarea",
      question: "Any specific details or features?",
      placeholder: "e.g., blue eyes, wearing a red dress, holding a book",
      required: false,
    },
  ],
  landscape: [
    {
      id: "location",
      type: "select",
      question: "What type of landscape?",
      options: ["Mountain Range", "Ocean/Beach", "Forest", "Desert", "City Skyline", "Countryside"],
      required: true,
    },
    {
      id: "time",
      type: "select",
      question: "What time of day?",
      options: ["Sunrise", "Morning", "Midday", "Sunset", "Night", "Blue Hour"],
      required: true,
    },
    {
      id: "weather",
      type: "select",
      question: "What weather conditions?",
      options: ["Clear/Sunny", "Cloudy", "Stormy", "Foggy", "Rainy", "Snowy"],
      required: true,
    },
    {
      id: "style",
      type: "select",
      question: "What artistic style?",
      options: ["Photorealistic", "Impressionist", "Fantasy", "Minimalist", "Dramatic"],
      required: true,
    },
    {
      id: "details",
      type: "textarea",
      question: "Additional details or elements?",
      placeholder: "e.g., wildlife, specific colors, architectural elements",
      required: false,
    },
  ],
  product: [
    {
      id: "item",
      type: "input",
      question: "What product are you showcasing?",
      placeholder: "e.g., smartphone, coffee mug, sneakers",
      required: true,
    },
    {
      id: "style",
      type: "select",
      question: "What presentation style?",
      options: ["Clean Studio Shot", "Lifestyle Context", "Dramatic Lighting", "Minimalist", "Luxury"],
      required: true,
    },
    {
      id: "background",
      type: "select",
      question: "What background setting?",
      options: ["White Background", "Natural Environment", "Modern Interior", "Textured Surface", "Gradient"],
      required: true,
    },
    {
      id: "angle",
      type: "select",
      question: "What viewing angle?",
      options: ["Front View", "3/4 Angle", "Side Profile", "Top Down", "Close-up Detail"],
      required: true,
    },
    {
      id: "details",
      type: "textarea",
      question: "Special features or requirements?",
      placeholder: "e.g., specific colors, materials, branding elements",
      required: false,
    },
  ],
  abstract: [
    {
      id: "concept",
      type: "input",
      question: "What concept or emotion?",
      placeholder: "e.g., freedom, energy, transformation, chaos",
      required: true,
    },
    {
      id: "colors",
      type: "select",
      question: "What color palette?",
      options: ["Vibrant/Neon", "Warm Tones", "Cool Tones", "Monochrome", "Pastel", "Dark/Moody"],
      required: true,
    },
    {
      id: "style",
      type: "select",
      question: "What artistic approach?",
      options: ["Geometric Shapes", "Fluid/Organic", "Fractal Patterns", "Minimalist", "Surreal"],
      required: true,
    },
    {
      id: "complexity",
      type: "select",
      question: "How complex should it be?",
      options: ["Very Simple", "Moderately Complex", "Highly Detailed", "Chaotic", "Balanced"],
      required: true,
    },
    {
      id: "inspiration",
      type: "textarea",
      question: "Any specific inspiration or references?",
      placeholder: "e.g., Kandinsky style, digital glitch art, nature patterns",
      required: false,
    },
  ],
  architecture: [
    {
      id: "type",
      type: "select",
      question: "What type of architecture?",
      options: ["Modern Building", "Historic Structure", "Interior Space", "Futuristic Design", "Traditional"],
      required: true,
    },
    {
      id: "style",
      type: "select",
      question: "What architectural style?",
      options: ["Contemporary", "Classical", "Industrial", "Minimalist", "Art Deco", "Brutalist"],
      required: true,
    },
    {
      id: "perspective",
      type: "select",
      question: "What viewing perspective?",
      options: ["Exterior View", "Interior View", "Aerial View", "Street Level", "Detail Shot"],
      required: true,
    },
    {
      id: "lighting",
      type: "select",
      question: "What lighting conditions?",
      options: ["Natural Daylight", "Golden Hour", "Night Illumination", "Dramatic Shadows", "Soft Ambient"],
      required: true,
    },
    {
      id: "details",
      type: "textarea",
      question: "Specific architectural features?",
      placeholder: "e.g., glass facade, wooden beams, marble columns",
      required: false,
    },
  ],
}

export default function GuidedPromptPage() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [currentStep, setCurrentStep] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [showEnhancedPrompt, setShowEnhancedPrompt] = useState(false)
  const [enhancedPrompt, setEnhancedPrompt] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedImage, setGeneratedImage] = useState<string | null>(null)
  const [isEnhancing, setIsEnhancing] = useState(false)

  const currentQuestions = selectedCategory ? questionSets[selectedCategory] : []
  const currentQuestion = currentQuestions[currentStep]
  const isLastStep = currentStep === currentQuestions.length - 1
  const canProceed = !currentQuestion?.required || answers[currentQuestion.id]

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId)
    setCurrentStep(0)
    setAnswers({})
    setGeneratedImage(null)
    setEnhancedPrompt("")
  }

  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }))
  }

  const handleNext = () => {
    if (isLastStep) {
      generateEnhancedPrompt()
    } else {
      setCurrentStep((prev) => prev + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1)
    }
  }

  const generateEnhancedPrompt = async () => {
    setIsEnhancing(true)

    try {
      const category = categories.find((c) => c.id === selectedCategory)
      const prompt = Object.entries(answers)
        .filter(([_, value]) => value.trim())
        .map(([key, value]) => `${key}: ${value}`)
        .join(", ")

      const basePrompt = `Professional ${category?.name.toLowerCase()} photography: ${prompt}`
      
      // Call the actual API to enhance the prompt
      const response = await apiClient.enhancePrompt(basePrompt)
      
      setEnhancedPrompt(response.enhancedPrompt)
    } catch (error) {
      console.error("Error enhancing prompt:", error)
      // Fallback enhancement
      const category = categories.find((c) => c.id === selectedCategory)
      const prompt = Object.entries(answers)
        .filter(([_, value]) => value.trim())
        .map(([key, value]) => `${key}: ${value}`)
        .join(", ")

      const enhanced = `Professional ${category?.name.toLowerCase()} photography: ${prompt}, high quality, detailed, cinematic lighting, 8K resolution`
      setEnhancedPrompt(enhanced)
    } finally {
      setIsEnhancing(false)
    }
  }

  const generateImage = async () => {
    setIsGenerating(true)

    try {
      let finalPrompt = enhancedPrompt
      
      // If no enhanced prompt, build one from answers
      if (!finalPrompt) {
        const category = categories.find((c) => c.id === selectedCategory)
        const prompt = Object.entries(answers)
          .filter(([_, value]) => value.trim())
          .map(([key, value]) => `${key}: ${value}`)
          .join(", ")
        finalPrompt = `Professional ${category?.name.toLowerCase()} photography: ${prompt}, high quality, detailed, cinematic lighting, 8K resolution`
      }
      
      // Call the actual API to generate the image with guided-prompt feature
      const response = await apiClient.generateImage(finalPrompt, true, 'guided-prompt')
      
      setGeneratedImage(response.imageUrl)
    } catch (error) {
      console.error("Error generating image:", error)
      // Fallback to placeholder if API fails
      setGeneratedImage("/placeholder.svg?height=512&width=512&text=Error+generating+image")
    } finally {
      setIsGenerating(false)
    }
  }

  const resetFlow = () => {
    setSelectedCategory(null)
    setCurrentStep(0)
    setAnswers({})
    setGeneratedImage(null)
    setEnhancedPrompt("")
    setShowEnhancedPrompt(false)
  }

  if (!selectedCategory) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-card to-muted p-4">
        <div className="max-w-4xl mx-auto pt-20">
          <Link href="/">
            <Button variant="ghost" className="mb-8 hover:bg-primary/10">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
            <h1 className="font-heading font-black text-4xl md:text-6xl mb-4">
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Guided</span>{" "}
              Creation
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Answer a few simple questions and let our AI create the perfect image for you
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((category, index) => (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -5 }}
                onClick={() => handleCategorySelect(category.id)}
                className="cursor-pointer"
              >
                <Card className="h-full glass border-border/50 hover:border-primary/30 transition-all duration-300">
                  <CardContent className="p-6 text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center mx-auto mb-4 animate-glow">
                      <Sparkles className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="font-heading font-bold text-xl mb-2">{category.name}</h3>
                    <p className="text-muted-foreground text-sm">{category.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (generatedImage) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-card to-muted p-4">
        <div className="max-w-4xl mx-auto pt-20">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
            <h1 className="font-heading font-black text-3xl md:text-5xl mb-8">Your Image is Ready!</h1>

            <div className="bg-card rounded-2xl p-8 mb-8">
              <img
                src={generatedImage || "/placeholder.svg"}
                alt="Generated image"
                className="w-full max-w-lg mx-auto rounded-xl shadow-2xl"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-gradient-to-r from-primary to-secondary">
                <Download className="w-4 h-4 mr-2" />
                Download Image
              </Button>
              <Button variant="outline" size="lg" onClick={resetFlow}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Create Another
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    )
  }

  if (enhancedPrompt && !isGenerating) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-card to-muted p-4">
        <div className="max-w-4xl mx-auto pt-20">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="font-heading font-black text-3xl md:text-5xl mb-8 text-center">Ready to Generate</h1>

            <Card className="glass border-border/50 mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wand2 className="w-5 h-5" />
                  Enhanced Prompt
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-muted/50 rounded-lg p-4 mb-4">
                  <p className="text-sm leading-relaxed">{enhancedPrompt}</p>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Switch id="show-prompt" checked={showEnhancedPrompt} onCheckedChange={setShowEnhancedPrompt} />
                    <Label htmlFor="show-prompt" className="text-sm">
                      Show enhanced prompt during generation
                    </Label>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-4 justify-center">
              <Button variant="outline" onClick={() => setCurrentStep(currentQuestions.length - 1)}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Questions
              </Button>
              <Button size="lg" onClick={generateImage} className="bg-gradient-to-r from-primary to-secondary">
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Image
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    )
  }

  if (isGenerating) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-card to-muted p-4 flex items-center justify-center">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
          <div className="w-32 h-32 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center mx-auto mb-8 animate-pulse">
            <Loader2 className="w-16 h-16 text-white animate-spin" />
          </div>

          <h2 className="font-heading font-bold text-2xl md:text-3xl mb-4">Creating Your Image...</h2>

          <p className="text-muted-foreground mb-8">Our AI is working its magic. This usually takes 30-60 seconds.</p>

          {showEnhancedPrompt && (
            <div className="bg-card/50 rounded-lg p-4 max-w-2xl mx-auto">
              <p className="text-sm text-muted-foreground">Using prompt:</p>
              <p className="text-sm mt-2">{enhancedPrompt}</p>
            </div>
          )}
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-card to-muted p-4">
      <div className="max-w-4xl mx-auto pt-20">
        <div className="flex items-center justify-between mb-8">
          <Button variant="ghost" onClick={resetFlow} className="hover:bg-primary/10">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Change Category
          </Button>

          <div className="text-sm text-muted-foreground">
            Step {currentStep + 1} of {currentQuestions.length}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {isEnhancing ? (
            <motion.div
              key="enhancing"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center py-20"
            >
              <div className="w-20 h-20 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                <Wand2 className="w-10 h-10 text-white" />
              </div>
              <h2 className="font-heading font-bold text-2xl mb-4">Enhancing Your Prompt...</h2>
              <p className="text-muted-foreground">Our AI is optimizing your answers for the best results</p>
            </motion.div>
          ) : (
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card className="glass border-border/50">
                <CardHeader>
                  <CardTitle className="text-2xl font-heading">{currentQuestion?.question}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {currentQuestion?.type === "select" && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {currentQuestion.options?.map((option) => (
                        <Button
                          key={option}
                          variant={answers[currentQuestion.id] === option ? "default" : "outline"}
                          className="h-auto p-4 text-left justify-start"
                          onClick={() => handleAnswerChange(currentQuestion.id, option)}
                        >
                          {option}
                        </Button>
                      ))}
                    </div>
                  )}

                  {currentQuestion?.type === "input" && (
                    <Input
                      placeholder={currentQuestion.placeholder}
                      value={answers[currentQuestion.id] || ""}
                      onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                      className="text-lg p-4"
                    />
                  )}

                  {currentQuestion?.type === "textarea" && (
                    <Textarea
                      placeholder={currentQuestion.placeholder}
                      value={answers[currentQuestion.id] || ""}
                      onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                      className="min-h-[120px] text-lg p-4"
                    />
                  )}

                  <div className="flex justify-between pt-6">
                    <Button variant="outline" onClick={handlePrevious} disabled={currentStep === 0}>
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Previous
                    </Button>

                    <Button
                      onClick={handleNext}
                      disabled={!canProceed}
                      className="bg-gradient-to-r from-primary to-secondary"
                    >
                      {isLastStep ? (
                        <>
                          <Sparkles className="w-4 h-4 mr-2" />
                          Generate
                        </>
                      ) : (
                        <>
                          Next
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
