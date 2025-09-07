"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { apiClient } from "@/lib/api-client"
import {
  ArrowLeft,
  Layout,
  User,
  Briefcase,
  Palette,
  Camera,
  Gamepad2,
  Heart,
  Star,
  Download,
  Wand2,
  Loader2,
  Search,
  Filter,
} from "lucide-react"
import Link from "next/link"

interface Template {
  id: string
  name: string
  category: string
  description: string
  prompt: string
  customFields: Array<{
    id: string
    label: string
    placeholder: string
    type: "text" | "textarea" | "select"
    options?: string[]
    required: boolean
  }>
  example: string
  tags: string[]
  difficulty: "beginner" | "intermediate" | "advanced"
  icon: any
}

const templates: Template[] = [
  {
    id: "linkedin-headshot",
    name: "LinkedIn Professional Headshot",
    category: "Professional",
    description: "Create a polished professional headshot perfect for LinkedIn and business profiles",
    prompt:
      "Professional headshot portrait of {person}, business attire, clean background, professional lighting, confident expression, high quality photography",
    customFields: [
      {
        id: "person",
        label: "Person Description",
        placeholder: "young professional woman, mid-30s businessman",
        type: "text",
        required: true,
      },
      {
        id: "attire",
        label: "Clothing Style",
        placeholder: "navy blue suit, white shirt",
        type: "text",
        required: false,
      },
      {
        id: "background",
        label: "Background",
        placeholder: "office, neutral gray, outdoor",
        type: "select",
        options: ["Office Setting", "Neutral Gray", "Outdoor Professional", "Studio White"],
        required: false,
      },
    ],
    example: "/placeholder.svg?height=300&width=300&text=LinkedIn+Headshot",
    tags: ["professional", "business", "portrait", "linkedin"],
    difficulty: "beginner",
    icon: User,
  },
  {
    id: "fantasy-poster",
    name: "Fantasy Movie Poster",
    category: "Entertainment",
    description: "Epic fantasy movie poster with dramatic lighting and mystical elements",
    prompt:
      "Epic fantasy movie poster, {title}, {character} as the hero, {setting}, dramatic lighting, mystical atmosphere, cinematic composition, movie poster style",
    customFields: [
      { id: "title", label: "Movie Title", placeholder: "The Dragon's Quest", type: "text", required: true },
      {
        id: "character",
        label: "Main Character",
        placeholder: "brave knight, mystical wizard",
        type: "text",
        required: true,
      },
      {
        id: "setting",
        label: "Setting",
        placeholder: "ancient castle, magical forest",
        type: "textarea",
        required: false,
      },
    ],
    example: "/placeholder.svg?height=400&width=300&text=Fantasy+Poster",
    tags: ["fantasy", "poster", "cinematic", "dramatic"],
    difficulty: "intermediate",
    icon: Star,
  },
  {
    id: "product-ad",
    name: "Product Advertisement",
    category: "Marketing",
    description: "Professional product advertisement with compelling visuals and clean design",
    prompt:
      "Professional product advertisement for {product}, {style} photography, {background}, clean composition, commercial quality, marketing material",
    customFields: [
      {
        id: "product",
        label: "Product Name",
        placeholder: "smartphone, coffee mug, sneakers",
        type: "text",
        required: true,
      },
      {
        id: "style",
        label: "Photography Style",
        placeholder: "minimalist, lifestyle, luxury",
        type: "select",
        options: ["Minimalist", "Lifestyle", "Luxury", "Modern", "Vintage"],
        required: true,
      },
      {
        id: "background",
        label: "Background Setting",
        placeholder: "white studio, natural environment",
        type: "text",
        required: false,
      },
    ],
    example: "/placeholder.svg?height=300&width=400&text=Product+Ad",
    tags: ["product", "advertisement", "commercial", "marketing"],
    difficulty: "beginner",
    icon: Briefcase,
  },
  {
    id: "logo-design",
    name: "Modern Logo Design",
    category: "Branding",
    description: "Clean, modern logo design perfect for startups and businesses",
    prompt:
      "Modern logo design for {company}, {industry} business, {style} style, clean typography, professional branding, vector art style",
    customFields: [
      { id: "company", label: "Company Name", placeholder: "TechStart, GreenLeaf Co.", type: "text", required: true },
      { id: "industry", label: "Industry", placeholder: "technology, healthcare, food", type: "text", required: true },
      {
        id: "style",
        label: "Design Style",
        placeholder: "minimalist, geometric, organic",
        type: "select",
        options: ["Minimalist", "Geometric", "Organic", "Tech", "Classic"],
        required: true,
      },
    ],
    example: "/placeholder.svg?height=200&width=200&text=Logo",
    tags: ["logo", "branding", "business", "design"],
    difficulty: "intermediate",
    icon: Palette,
  },
  {
    id: "storybook-illustration",
    name: "Children's Storybook",
    category: "Illustration",
    description: "Whimsical children's book illustration with vibrant colors and friendly characters",
    prompt:
      "Children's storybook illustration, {scene}, {characters}, whimsical art style, bright colors, friendly atmosphere, book illustration",
    customFields: [
      {
        id: "scene",
        label: "Scene Description",
        placeholder: "magical forest, cozy bedroom, playground",
        type: "textarea",
        required: true,
      },
      {
        id: "characters",
        label: "Characters",
        placeholder: "friendly dragon, curious child, talking animals",
        type: "text",
        required: true,
      },
      {
        id: "mood",
        label: "Mood",
        placeholder: "happy, adventurous, peaceful",
        type: "select",
        options: ["Happy", "Adventurous", "Peaceful", "Exciting", "Cozy"],
        required: false,
      },
    ],
    example: "/placeholder.svg?height=300&width=400&text=Storybook",
    tags: ["children", "illustration", "storybook", "whimsical"],
    difficulty: "beginner",
    icon: Heart,
  },
  {
    id: "game-character",
    name: "Video Game Character",
    category: "Gaming",
    description: "Epic video game character design with detailed armor and weapons",
    prompt:
      "Video game character design, {character_type}, {style} art style, detailed armor and weapons, epic pose, game art quality",
    customFields: [
      {
        id: "character_type",
        label: "Character Type",
        placeholder: "warrior, mage, archer",
        type: "select",
        options: ["Warrior", "Mage", "Archer", "Rogue", "Paladin"],
        required: true,
      },
      {
        id: "style",
        label: "Art Style",
        placeholder: "realistic, anime, cartoon",
        type: "select",
        options: ["Realistic", "Anime", "Cartoon", "Dark Fantasy", "Sci-Fi"],
        required: true,
      },
      {
        id: "equipment",
        label: "Equipment",
        placeholder: "sword and shield, magic staff",
        type: "text",
        required: false,
      },
    ],
    example: "/placeholder.svg?height=400&width=300&text=Game+Character",
    tags: ["gaming", "character", "fantasy", "design"],
    difficulty: "advanced",
    icon: Gamepad2,
  },
  {
    id: "portrait-photography",
    name: "Portrait Photography",
    category: "Photography",
    description: "Professional portrait photography with artistic lighting and composition",
    prompt:
      "Professional portrait photography, {subject}, {lighting} lighting, {mood} mood, high quality photography, artistic composition",
    customFields: [
      {
        id: "subject",
        label: "Subject",
        placeholder: "elegant woman, rugged man, child",
        type: "text",
        required: true,
      },
      {
        id: "lighting",
        label: "Lighting Style",
        placeholder: "natural, dramatic, soft",
        type: "select",
        options: ["Natural", "Dramatic", "Soft", "Golden Hour", "Studio"],
        required: true,
      },
      { id: "mood", label: "Mood", placeholder: "serious, joyful, contemplative", type: "text", required: false },
    ],
    example: "/placeholder.svg?height=400&width=300&text=Portrait",
    tags: ["portrait", "photography", "professional", "artistic"],
    difficulty: "intermediate",
    icon: Camera,
  },
]

const categories = [
  "All",
  "Professional",
  "Entertainment",
  "Marketing",
  "Branding",
  "Illustration",
  "Gaming",
  "Photography",
]

export default function TemplatesPage() {
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)
  const [customValues, setCustomValues] = useState<Record<string, string>>({})
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedImage, setGeneratedImage] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null)

  const filteredTemplates = templates.filter((template) => {
    const matchesSearch =
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesCategory = selectedCategory === "All" || template.category === selectedCategory
    const matchesDifficulty = !selectedDifficulty || template.difficulty === selectedDifficulty

    return matchesSearch && matchesCategory && matchesDifficulty
  })

  const handleCustomValueChange = (fieldId: string, value: string) => {
    setCustomValues((prev) => ({ ...prev, [fieldId]: value }))
  }

  const generateFromTemplate = async () => {
    if (!selectedTemplate) return

    setIsGenerating(true)

    try {
      const finalPrompt = buildPrompt()
      
      // Call the actual API to generate the image with templates feature
      const response = await apiClient.generateImage(finalPrompt, true, 'templates')
      
      setGeneratedImage(response.imageUrl)
    } catch (error) {
      console.error("Error generating image from template:", error)
      // Fallback to placeholder if API fails
      setGeneratedImage(`/placeholder.svg?height=512&width=512&text=${encodeURIComponent("Error generating image")}`)
    } finally {
      setIsGenerating(false)
    }
  }

  const buildPrompt = () => {
    if (!selectedTemplate) return ""

    let prompt = selectedTemplate.prompt
    selectedTemplate.customFields.forEach((field) => {
      const value = customValues[field.id] || field.placeholder
      prompt = prompt.replace(`{${field.id}}`, value)
    })
    return prompt
  }

  const resetTemplate = () => {
    setSelectedTemplate(null)
    setCustomValues({})
    setGeneratedImage(null)
  }

  if (selectedTemplate) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-card to-muted">
        <div className="p-4">
          <div className="max-w-4xl mx-auto">
            <Button variant="ghost" onClick={resetTemplate} className="mb-4 hover:bg-primary/10 hover:text-black">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Templates
            </Button>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 pb-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
            <h1 className="font-heading font-black text-3xl md:text-5xl mb-4">{selectedTemplate.name}</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">{selectedTemplate.description}</p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Customization Panel */}
            <Card className="glass border-border/50">
              <CardHeader>
                <CardTitle>Customize Your {selectedTemplate.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {selectedTemplate.customFields.map((field) => (
                  <div key={field.id}>
                    <Label htmlFor={field.id} className="text-sm font-medium mb-2 block">
                      {field.label} {field.required && <span className="text-destructive">*</span>}
                    </Label>

                    {field.type === "text" && (
                      <Input
                        id={field.id}
                        placeholder={field.placeholder}
                        value={customValues[field.id] || ""}
                        onChange={(e) => handleCustomValueChange(field.id, e.target.value)}
                      />
                    )}

                    {field.type === "textarea" && (
                      <Textarea
                        id={field.id}
                        placeholder={field.placeholder}
                        value={customValues[field.id] || ""}
                        onChange={(e) => handleCustomValueChange(field.id, e.target.value)}
                        className="min-h-[80px]"
                      />
                    )}

                    {field.type === "select" && field.options && (
                      <div className="grid grid-cols-2 gap-2">
                        {field.options.map((option) => (
                          <Button
                            key={option}
                            variant={customValues[field.id] === option ? "default" : "outline"}
                            size="sm"
                            onClick={() => handleCustomValueChange(field.id, option)}
                            className="text-xs"
                          >
                            {option}
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                {/* Generated Prompt Preview */}
                <div className="bg-muted/50 rounded-lg p-4">
                  <Label className="text-sm font-medium mb-2 block">Generated Prompt</Label>
                  <p className="text-sm text-muted-foreground">{buildPrompt()}</p>
                </div>

                <Button
                  onClick={generateFromTemplate}
                  disabled={isGenerating}
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
                      Generate Image
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Result Display */}
            <Card className="glass border-border/50">
              <CardHeader>
                <CardTitle>Result</CardTitle>
              </CardHeader>
              <CardContent>
                {isGenerating ? (
                  <div className="aspect-square bg-muted/20 rounded-xl flex flex-col items-center justify-center text-center p-8">
                    <div className="w-20 h-20 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center mb-6 animate-pulse">
                      <Layout className="w-10 h-10 text-white" />
                    </div>
                    <h3 className="font-heading font-bold text-xl mb-2">Creating Your {selectedTemplate.name}...</h3>
                    <p className="text-muted-foreground">Our AI is bringing your template to life</p>
                  </div>
                ) : generatedImage ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="space-y-4"
                  >
                    <div className="aspect-square rounded-xl overflow-hidden">
                      <img
                        src={generatedImage || "/placeholder.svg"}
                        alt="Generated from template"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <Button className="w-full">
                      <Download className="w-4 h-4 mr-2" />
                      Download Image
                    </Button>
                  </motion.div>
                ) : (
                  <div className="aspect-square bg-muted/20 rounded-xl flex flex-col items-center justify-center text-center p-8">
                    <Layout className="w-16 h-16 text-muted-foreground mb-4" />
                    <h3 className="font-heading font-bold text-xl mb-2">Preview</h3>
                    <p className="text-muted-foreground">Customize the fields and generate your image</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-card to-muted">
      {/* Navigation */}
      <div className="p-4">
        <div className="max-w-7xl mx-auto">
          <Link href="/">
            <Button variant="ghost" className="mb-4 hover:bg-primary/10">
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
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Template</span>{" "}
            Library
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Choose from hundreds of pre-made templates and customize them to create professional images instantly
          </p>
        </motion.div>

        {/* Filters */}
        <Card className="glass border-border/50 mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search templates..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Category Filter */}
              <div className="flex gap-2 flex-wrap">
                {categories.map((category) => (
                  <Button
                    key={category}
                    variant={selectedCategory === category ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(category)}
                  >
                    {category}
                  </Button>
                ))}
              </div>

              {/* Difficulty Filter */}
              <div className="flex gap-2">
                {["beginner", "intermediate", "advanced"].map((difficulty) => (
                  <Button
                    key={difficulty}
                    variant={selectedDifficulty === difficulty ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedDifficulty(selectedDifficulty === difficulty ? null : difficulty)}
                    className="capitalize"
                  >
                    {difficulty}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Templates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template, index) => {
            const Icon = template.icon
            return (
              <motion.div
                key={template.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -5 }}
                onClick={() => setSelectedTemplate(template)}
                className="cursor-pointer group"
              >
                <Card className="h-full glass border-border/50 hover:border-primary/30 transition-all duration-300 overflow-hidden">
                  <div className="aspect-video bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center">
                    <Icon className="w-12 h-12 text-primary group-hover:scale-110 transition-transform duration-300" />
                  </div>

                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-heading font-bold text-lg group-hover:text-primary transition-colors duration-300">
                        {template.name}
                      </h3>
                      <Badge
                        variant={
                          template.difficulty === "beginner"
                            ? "default"
                            : template.difficulty === "intermediate"
                              ? "secondary"
                              : "destructive"
                        }
                      >
                        {template.difficulty}
                      </Badge>
                    </div>

                    <p className="text-muted-foreground text-sm mb-4 leading-relaxed">{template.description}</p>

                    <div className="flex flex-wrap gap-1 mb-4">
                      {template.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>

                    <Button
                      variant="ghost"
                      className="w-full justify-between group-hover:bg-primary/10 group-hover:text-primary transition-all duration-300"
                    >
                      Use Template
                      <ArrowLeft className="w-4 h-4 rotate-180 group-hover:translate-x-1 transition-transform duration-300" />
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>

        {filteredTemplates.length === 0 && (
          <div className="text-center py-12">
            <Filter className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-heading font-bold text-xl mb-2">No templates found</h3>
            <p className="text-muted-foreground">Try adjusting your search or filter criteria</p>
          </div>
        )}
      </div>
    </div>
  )
}
