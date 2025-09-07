"use client"

import { useState, useEffect } from "react"
import { motion, useScroll, useTransform } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Sparkles,
  Wand2,
  Palette,
  Megaphone,
  Brush,
  Camera,
  Layout,
  Moon,
  Sun,
  ArrowRight,
  Zap,
  Stars,
} from "lucide-react"
import Link from "next/link"

const features = [
  {
    id: "guided-prompt",
    title: "Guided Prompts",
    description: "Answer simple questions to generate perfect images. Perfect for beginners.",
    icon: Sparkles,
    gradient: "from-orange-500 to-red-500",
    href: "/guided-prompt",
  },
  {
    id: "text-to-image",
    title: "Text to Image",
    description: "Transform your ideas into stunning visuals with natural language.",
    icon: Wand2,
    gradient: "from-purple-500 to-pink-500",
    href: "/text-to-image",
  },
  {
    id: "canvas-editor",
    title: "Canvas Editor",
    description: "Professional image editing with AI-powered brush tools and layers.",
    icon: Brush,
    gradient: "from-blue-500 to-cyan-500",
    href: "/canvas-editor",
  },
  {
    id: "style-transfer",
    title: "Style Transfer",
    description: "Apply artistic styles to your photos with AI magic.",
    icon: Palette,
    gradient: "from-yellow-500 to-orange-500",
    href: "/style-transfer",
  },
  {
    id: "photo-restore",
    title: "Photo Restoration",
    description: "Restore old photos and add color to black and white images.",
    icon: Camera,
    gradient: "from-indigo-500 to-purple-500",
    href: "/photo-restore",
  },
  {
    id: "templates",
    title: "Template Library",
    description: "Choose from hundreds of pre-made templates and customize them.",
    icon: Layout,
    gradient: "from-pink-500 to-rose-500",
    href: "/templates",
  },
]

export default function HomePage() {
  const [isDark, setIsDark] = useState(false)
  const { scrollY } = useScroll()
  const y1 = useTransform(scrollY, [0, 300], [0, -50])
  const y2 = useTransform(scrollY, [0, 300], [0, -100])

  useEffect(() => {
    const isDarkMode = document.documentElement.classList.contains("dark")
    setIsDark(isDarkMode)
  }, [])

  const toggleTheme = () => {
    document.documentElement.classList.toggle("dark")
    setIsDark(!isDark)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-card to-muted">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 glass border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <motion.div
              className="flex items-center space-x-2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center animate-glow">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <span className="font-heading font-black text-2xl bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                NanoGram
              </span>
            </motion.div>

            <motion.button
              onClick={toggleTheme}
              className="p-2 rounded-lg glass hover:bg-primary/10 transition-all duration-300"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </motion.button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            style={{ y: y1 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="font-heading font-black text-6xl md:text-8xl lg:text-9xl mb-6 text-balance">
              <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent ">
                AI Image
              </span>
              <br />
              <span className="text-foreground p-3">Generation</span>
            </h1>

            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-12 text-pretty leading-relaxed">
              Transform your ideas into stunning visuals with our professional AI-powered image generation and editing
              suite. From beginners to professionals, create without limits.
            </p>
            <motion.div
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <Link href="/text-to-image" className="no-underline">
                <Button
                  size="lg"
                  className="text-lg px-8 py-6 bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 transform hover:scale-105 transition-all duration-300 animate-glow"
                >
                  Start Creating
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link href="/templates" className="no-underline">
                <Button
                  variant="outline"
                  size="lg"
                  className="text-lg px-8 py-6 glass border-primary/20 hover:bg-primary/5 transform hover:scale-105 transition-all duration-300 bg-transparent"
                >
                  View Templates
                  <Stars className="ml-2 w-5 h-5" />
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            style={{ y: y2 }}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-center mb-16"
          >
            <h2 className="font-heading font-black text-4xl md:text-6xl mb-6 text-balance">
              Choose Your
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                {" "}
                Creative Path
              </span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-pretty">
              Seven powerful tools designed for every skill level and creative need
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <motion.div
                  key={feature.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ y: -10 }}
                  className="group cursor-pointer"
                >
                  <Card className="h-full glass border-border/50 hover:border-primary/30 transition-all duration-500 overflow-hidden">
                    <CardContent className="p-8">
                      <div
                        className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 animate-float`}
                      >
                        <Icon className="w-8 h-8 text-white" />
                      </div>

                      <h3 className="font-heading font-bold text-2xl mb-4 group-hover:text-primary transition-colors duration-300">
                        {feature.title}
                      </h3>

                      <p className="text-muted-foreground leading-relaxed mb-6">{feature.description}</p>
                      <Link href={feature.href} className="no-underline">
                        <Button
                          variant="ghost"
                          className="w-full justify-between group-hover:bg-primary/10 group-hover:text-primary transition-all duration-300"
                        >
                          Get Started
                          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-border/50">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-6 h-6 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-heading font-black text-xl bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              NanoGram
            </span>
          </div>
          <p className="text-muted-foreground">Professional AI image generation for everyone</p>
        </div>
      </footer>
    </div>
  )
}
