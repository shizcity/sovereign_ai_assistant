import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { 
  Sparkles, 
  Brain, 
  Mic, 
  TrendingUp, 
  Users, 
  Zap,
  Shield,
  Layers,
  MessageSquare,
  ArrowRight,
  Check,
  Menu,
  X,
  Wand2
} from "lucide-react";
import { toast } from "sonner";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { GlowLogo } from "@/components/GlowLogo";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function Landing() {
  const [email, setEmail] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [particles, setParticles] = useState<Array<{ x: number; y: number; delay: number }>>([]);
  
  // Hero animation hooks (on mount, no scroll needed)
  const heroStatusRef = useScrollAnimation({ threshold: 0.1 });
  const heroHeadlineRef = useScrollAnimation({ threshold: 0.1 });
  const heroTaglineRef = useScrollAnimation({ threshold: 0.1 });
  const heroCtasRef = useScrollAnimation({ threshold: 0.1 });
  const heroTerminalRef = useScrollAnimation({ threshold: 0.1 });
  
  // Scroll animation hooks
  const statsRef = useScrollAnimation();
  const featuresHeaderRef = useScrollAnimation();
  const featureCard1Ref = useScrollAnimation({ threshold: 0.2 });
  const featureCard2Ref = useScrollAnimation({ threshold: 0.2 });
  const featureCard3Ref = useScrollAnimation({ threshold: 0.2 });
  const featureCard4Ref = useScrollAnimation({ threshold: 0.2 });
  const featureCard5Ref = useScrollAnimation({ threshold: 0.2 });
  const featureCard6Ref = useScrollAnimation({ threshold: 0.2 });
  const sentinelsHeaderRef = useScrollAnimation();
  const sentinelCard1Ref = useScrollAnimation({ threshold: 0.2 });
  const sentinelCard2Ref = useScrollAnimation({ threshold: 0.2 });
  const sentinelCard3Ref = useScrollAnimation({ threshold: 0.2 });
  const sentinelCard4Ref = useScrollAnimation({ threshold: 0.2 });
  const sentinelCard5Ref = useScrollAnimation({ threshold: 0.2 });
  const sentinelCard6Ref = useScrollAnimation({ threshold: 0.2 });
  const pricingHeaderRef = useScrollAnimation();
  const pricingCard1Ref = useScrollAnimation({ threshold: 0.2 });
  const pricingCard2Ref = useScrollAnimation({ threshold: 0.2 });
  const pricingCard3Ref = useScrollAnimation({ threshold: 0.2 });
  const testimonialsHeaderRef = useScrollAnimation();
  const testimonial1Ref = useScrollAnimation({ threshold: 0.2 });
  const testimonial2Ref = useScrollAnimation({ threshold: 0.2 });
  const testimonial3Ref = useScrollAnimation({ threshold: 0.2 });
  const faqHeaderRef = useScrollAnimation();
  const faqAccordionRef = useScrollAnimation({ threshold: 0.1 });
  const ctaRef = useScrollAnimation();

  useEffect(() => {
    document.title = "Glow - Your AI. Your Identity. Your Sovereignty.";
    
    // Generate random particles for background effect (reduced for performance)
    const newParticles = Array.from({ length: 30 }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 5,
    }));
    setParticles(newParticles);
  }, []);

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      toast.success("Thanks for your interest! We'll be in touch soon.");
      setEmail("");
    }
  };

  const features = [
    {
      icon: Users,
      title: "Multi-Sentinel Conversations",
      description: "Engage multiple AI personalities in a single conversation. Get diverse perspectives on complex problems.",
      ref: featureCard1Ref,
      delay: "delay-0"
    },
    {
      icon: Mic,
      title: "Voice-First Mode",
      description: "Speak naturally with your Sentinels. Advanced speech-to-text and text-to-speech for seamless interaction.",
      ref: featureCard2Ref,
      delay: "delay-100"
    },
    {
      icon: TrendingUp,
      title: "Analytics Dashboard",
      description: "Track your conversations, usage patterns, and insights. Understand how you interact with AI.",
      ref: featureCard3Ref,
      delay: "delay-200"
    },
    {
      icon: Layers,
      title: "Conversation Templates",
      description: "Pre-built workflows for common tasks. Brainstorming, decision-making, creative writing, and more.",
      ref: featureCard4Ref,
      delay: "delay-300"
    },
    {
      icon: Shield,
      title: "Data Sovereignty",
      description: "Your conversations belong to you. Export, delete, or manage your data at any time.",
      ref: featureCard5Ref,
      delay: "delay-400"
    },
    {
      icon: Zap,
      title: "Real-Time Streaming",
      description: "Watch responses appear in real-time. No waiting, no delays. Instant AI interaction.",
      ref: featureCard6Ref,
      delay: "delay-500"
    },
  ];

  const sentinels = [
    { name: "Vixen's Den", emoji: "🦊", color: "#FF6B6B", specialty: "Practical Strategy", ref: sentinelCard1Ref, delay: "delay-0" },
    { name: "Mischief.EXE", emoji: "🎭", color: "#4ECDC4", specialty: "Creative Chaos", ref: sentinelCard2Ref, delay: "delay-100" },
    { name: "Lunaris.Vault", emoji: "🌙", color: "#95E1D3", specialty: "Deep Analysis", ref: sentinelCard3Ref, delay: "delay-200" },
    { name: "Aetheris.Flow", emoji: "🌊", color: "#38A3A5", specialty: "Adaptive Thinking", ref: sentinelCard4Ref, delay: "delay-300" },
    { name: "Rift.EXE", emoji: "⚡", color: "#FF8C42", specialty: "Disruption", ref: sentinelCard5Ref, delay: "delay-400" },
    { name: "Nyx", emoji: "🌑", color: "#9B59B6", specialty: "Shadow Work", ref: sentinelCard6Ref, delay: "delay-500" },
  ];

  return (
    <div className="min-h-screen bg-background text-white overflow-hidden relative">
      {/* JSON-LD Structured Data */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          "name": "Glow",
          "applicationCategory": "BusinessApplication",
          "description": "Multi-Sentinel AI platform featuring 6 unique AI personalities for multi-perspective intelligence and deeper insights.",
          "url": "https://sovereignai-gercufgq.manus.space/",
          "operatingSystem": "Web",
          "offers": {
            "@type": "AggregateOffer",
            "priceCurrency": "USD",
            "lowPrice": "0",
            "highPrice": "20",
            "offerCount": "2"
          },
          "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": "4.8",
            "ratingCount": "127"
          },
          "creator": {
            "@type": "Organization",
            "name": "Glow"
          }
        })
      }} />
      {/* Mesh Gradient Background */}
      <div className="fixed inset-0 mesh-gradient-bg pointer-events-none" />
      {/* Particle Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {particles.map((particle, i) => (
          <div
            key={i}
            className="absolute w-0.5 h-0.5 bg-cyan-400/20 rounded-full animate-pulse"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              animationDelay: `${particle.delay}s`,
            }}
          />
        ))}
      </div>

      {/* Navigation */}
      <nav className="relative z-50 border-b border-white/8 backdrop-blur-2xl" style={{ background: 'oklch(0.065 0.012 270 / 0.85)' }}>
        <div className="container max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <GlowLogo size="md" showWordmark showTagline={false} />
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-gray-400 hover:text-white transition-colors">Features</a>
            <a href="#sentinels" className="text-gray-400 hover:text-white transition-colors">Sentinels</a>
            <a href="#pricing" className="text-gray-400 hover:text-white transition-colors">Pricing</a>
          </div>
          
          {/* Desktop CTA Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <ThemeToggle variant="icon" />
            <a href="/chat">
              <Button variant="ghost" className="text-gray-400 hover:text-white">
                Sign In
              </Button>
            </a>
            <a href="/chat">
              <Button className="bg-cyan-500 hover:bg-cyan-600 text-black font-semibold">
                Initialize
              </Button>
            </a>
          </div>
          
          {/* Mobile Hamburger Button */}
          <button
            className="md:hidden text-white p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
        
        {/* Mobile Menu Overlay */}
        {mobileMenuOpen && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 md:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
            
            {/* Mobile Menu */}
            <div className="fixed top-[73px] right-0 w-64 h-[calc(100vh-73px)] bg-black/95 backdrop-blur-xl border-l border-white/10 z-50 md:hidden animate-in slide-in-from-right duration-300">
              <div className="flex flex-col p-6 gap-6">
                {/* Navigation Links */}
                <a 
                  href="#features" 
                  className="text-gray-400 hover:text-cyan-400 transition-colors text-lg"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Features
                </a>
                <a 
                  href="#sentinels" 
                  className="text-gray-400 hover:text-cyan-400 transition-colors text-lg"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Sentinels
                </a>
                <a 
                  href="#pricing" 
                  className="text-gray-400 hover:text-cyan-400 transition-colors text-lg"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Pricing
                </a>
                
                <div className="border-t border-white/10 pt-6 flex flex-col gap-3">
                  <a href="/chat">
                    <Button 
                      variant="ghost" 
                      className="w-full text-gray-400 hover:text-white"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Sign In
                    </Button>
                  </a>
                  <a href="/chat">
                    <Button 
                      className="w-full bg-cyan-500 hover:bg-cyan-600 text-black font-semibold"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Initialize
                    </Button>
                  </a>
                </div>
              </div>
            </div>
          </>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 pt-20 pb-32 px-6 overflow-hidden">
        {/* Layered gradient orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 -left-1/4 w-[500px] h-[500px] bg-cyan-500/12 rounded-full blur-[100px] animate-pulse" style={{ animationDuration: '5s' }} />
          <div className="absolute bottom-1/4 -right-1/4 w-[500px] h-[500px] bg-indigo-500/12 rounded-full blur-[100px] animate-pulse" style={{ animationDuration: '7s', animationDelay: '1.5s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-violet-500/8 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: '9s', animationDelay: '3s' }} />
        </div>

        <div className="container max-w-7xl mx-auto relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Content */}
            <div className="space-y-8">
              {/* Status Badge */}
              <div 
                ref={heroStatusRef.ref}
                className={`inline-flex items-center gap-3 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/30 backdrop-blur-sm transition-all duration-700 ${
                  heroStatusRef.isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'
                }`}
              >
                <div className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
                </div>
                <span className="text-cyan-300 font-mono text-sm font-semibold tracking-wider">
                  6 SENTINELS ONLINE
                </span>
              </div>

              {/* Headline */}
              <div 
                ref={heroHeadlineRef.ref}
                className={`space-y-6 transition-all duration-700 delay-200 ${
                  heroHeadlineRef.isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'
                }`}
              >
                <h1 className="text-6xl sm:text-7xl lg:text-8xl font-black leading-[0.88] tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  <span className="bg-gradient-to-r from-white via-cyan-100 to-indigo-200 bg-clip-text text-transparent">
                    Your AI
                  </span>
                  <br />
                  <span className="bg-gradient-to-r from-cyan-300 via-white to-white bg-clip-text text-transparent">
                    Your Rules
                  </span>
                </h1>
                
                <p className="text-xl sm:text-2xl text-gray-300 leading-relaxed max-w-xl">
                  Command a <span className="text-cyan-400 font-semibold">team of specialized AI Sentinels</span> that think differently, debate perspectives, and deliver insights no single AI can match.
                </p>
              </div>

              {/* CTAs */}
              <div 
                ref={heroCtasRef.ref}
                className={`flex flex-wrap items-center gap-4 transition-all duration-700 delay-400 ${
                  heroCtasRef.isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'
                }`}
              >
                <a href="/chat">
                  <Button size="lg" className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold px-10 py-7 text-lg shadow-lg shadow-cyan-500/50 transition-all hover:shadow-xl hover:shadow-cyan-500/60 hover:scale-105">
                    Launch Glow
                    <Sparkles className="ml-2 w-5 h-5" />
                  </Button>
                </a>
                <a href="#sentinels">
                  <Button size="lg" variant="outline" className="border-2 border-white/30 hover:bg-white/10 hover:border-white/50 px-10 py-7 text-lg font-semibold transition-all hover:scale-105">
                    Meet the Sentinels
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </a>
              </div>

              {/* Social Proof */}
              <div 
                ref={heroTaglineRef.ref}
                className={`flex items-center gap-6 pt-4 transition-all duration-700 delay-600 ${
                  heroTaglineRef.isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'
                }`}
              >
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-purple-600 border-2 border-gray-900" />
                  ))}
                </div>
                <p className="text-sm text-gray-400">
                  <span className="text-white font-semibold">1,000+</span> conversations powered by multi-Sentinel intelligence
                </p>
              </div>
            </div>

            {/* Right: Visual */}
            <div 
              ref={heroTerminalRef.ref}
              className={`relative transition-all duration-700 delay-300 ${
                heroTerminalRef.isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'
              }`}
            >
              {/* Floating Sentinel Cards */}
              <div className="relative h-[500px] lg:h-[600px]">
                {/* Card 1 - Front */}
                <Card className="absolute top-0 left-1/2 -translate-x-1/2 w-80 bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border-cyan-500/30 backdrop-blur-xl p-6 shadow-2xl shadow-cyan-500/20 hover:scale-105 transition-transform duration-300 animate-float">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center">
                      <Brain className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white">Sage</h3>
                      <p className="text-xs text-cyan-300">Strategic Thinker</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-300 leading-relaxed">
                    "Let me analyze this from multiple angles before we proceed..."
                  </p>
                </Card>

                {/* Card 2 - Left */}
                <Card className="absolute top-32 left-0 w-72 bg-gradient-to-br from-purple-500/20 to-pink-600/20 border-purple-500/30 backdrop-blur-xl p-6 shadow-2xl shadow-purple-500/20 hover:scale-105 transition-transform duration-300 animate-float" style={{ animationDelay: '1s' }}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center">
                      <Sparkles className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white">Nova</h3>
                      <p className="text-xs text-purple-300">Creative Innovator</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-300 leading-relaxed">
                    "What if we approached this completely differently?"
                  </p>
                </Card>

                {/* Card 3 - Right */}
                <Card className="absolute top-32 right-0 w-72 bg-gradient-to-br from-blue-500/20 to-indigo-600/20 border-blue-500/30 backdrop-blur-xl p-6 shadow-2xl shadow-blue-500/20 hover:scale-105 transition-transform duration-300 animate-float" style={{ animationDelay: '2s' }}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                      <Zap className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white">Bolt</h3>
                      <p className="text-xs text-blue-300">Rapid Executor</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-300 leading-relaxed">
                    "Here's the fastest path to your goal. Let's move."
                  </p>
                </Card>

                {/* Card 4 - Creator highlight (bottom center) */}
                <Card className="absolute bottom-0 left-1/2 -translate-x-1/2 w-72 bg-gradient-to-br from-amber-500/20 to-orange-600/20 border-amber-500/40 backdrop-blur-xl p-5 shadow-2xl shadow-amber-500/20 hover:scale-105 transition-transform duration-300 animate-float" style={{ animationDelay: '1.5s' }}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                      <Wand2 className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-white">Your Sentinel</h3>
                        <span className="text-[10px] font-bold bg-gradient-to-r from-amber-500 to-orange-500 text-black px-1.5 py-0.5 rounded-full">CREATOR</span>
                      </div>
                      <p className="text-xs text-amber-300">Custom AI Persona</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-300 leading-relaxed">
                    "Design me from scratch — my personality, expertise, and voice are all yours to define."
                  </p>
                  <a href="/my-sentinels" className="mt-3 flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 transition-colors font-medium">
                    <Sparkles className="w-3 h-3" />
                    Build your own Sentinel
                  </a>
                </Card>

                {/* Connecting Lines */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-30">
                  <line x1="50%" y1="15%" x2="20%" y2="40%" stroke="url(#gradient1)" strokeWidth="2" strokeDasharray="5,5" className="animate-pulse" />
                  <line x1="50%" y1="15%" x2="80%" y2="40%" stroke="url(#gradient2)" strokeWidth="2" strokeDasharray="5,5" className="animate-pulse" style={{ animationDelay: '0.5s' }} />
                  <line x1="20%" y1="60%" x2="50%" y2="82%" stroke="url(#gradient3)" strokeWidth="2" strokeDasharray="5,5" className="animate-pulse" style={{ animationDelay: '1s' }} />
                  <line x1="80%" y1="60%" x2="50%" y2="82%" stroke="url(#gradient4)" strokeWidth="2" strokeDasharray="5,5" className="animate-pulse" style={{ animationDelay: '1.5s' }} />
                  <defs>
                    <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#06b6d4" />
                      <stop offset="100%" stopColor="#a855f7" />
                    </linearGradient>
                    <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#06b6d4" />
                      <stop offset="100%" stopColor="#3b82f6" />
                    </linearGradient>
                    <linearGradient id="gradient3" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#a855f7" />
                      <stop offset="100%" stopColor="#f59e0b" />
                    </linearGradient>
                    <linearGradient id="gradient4" x1="100%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#3b82f6" />
                      <stop offset="100%" stopColor="#f59e0b" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section 
        ref={statsRef.ref}
        className={`relative z-10 py-20 px-6 border-y border-white/10 transition-all duration-700 ${
          statsRef.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
        style={{ background: 'oklch(0.07 0.015 270 / 0.6)' }}
      >
        <div className="container max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { value: '6', label: 'Unique Sentinels', sub: 'Built-in AI personalities' },
              { value: '∞', label: 'Conversations', sub: 'No hard limits on Pro' },
              { value: '3', label: 'Tiers Available', sub: 'Free, Pro & Creator' },
              { value: '24/7', label: 'System Uptime', sub: 'Always available' },
            ].map((stat, i) => (
              <div key={i} className="relative group text-center p-6 rounded-2xl border border-white/8 bg-white/3 hover:border-cyan-500/30 hover:bg-cyan-500/5 transition-all duration-300">
                <div className="text-5xl font-black mb-2 bg-gradient-to-br from-cyan-300 to-indigo-400 bg-clip-text text-transparent">{stat.value}</div>
                <div className="text-white font-semibold text-sm mb-1">{stat.label}</div>
                <div className="text-gray-500 text-xs">{stat.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative z-10 py-32 px-6">
        <div className="container max-w-6xl mx-auto">
          <div 
            ref={featuresHeaderRef.ref}
            className={`text-center mb-16 transition-all duration-700 ${
              featuresHeaderRef.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            }`}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 text-xs font-semibold uppercase tracking-widest mb-6">
              <Zap className="w-3 h-3" /> Platform Capabilities
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">Built for Deep Thinking</h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Every feature is designed to help you think more clearly, explore more broadly, and decide more confidently.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <Card
                  key={idx}
                  ref={feature.ref.ref}
                  className={`group relative bg-black/40 border-white/8 backdrop-blur-xl p-8 hover:border-cyan-500/40 hover:-translate-y-1 hover:shadow-xl hover:shadow-cyan-500/10 transition-all duration-500 overflow-hidden ${
                    feature.ref.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                  } ${feature.delay}`}
                >
                  {/* subtle top gradient line on hover */}
                  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-500/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="relative w-14 h-14 mb-6">
                    <div className="absolute inset-0 rounded-xl bg-cyan-500/15 group-hover:bg-cyan-500/25 transition-colors duration-300" />
                    <div className="absolute inset-0 rounded-xl ring-1 ring-cyan-500/20 group-hover:ring-cyan-500/50 transition-all duration-300" />
                    <div className="relative w-full h-full flex items-center justify-center">
                      <Icon className="w-6 h-6 text-cyan-400 group-hover:text-cyan-300 transition-colors duration-300" />
                    </div>
                  </div>
                  <h3 className="text-xl font-bold mb-3 group-hover:text-cyan-100 transition-colors duration-300">{feature.title}</h3>
                  <p className="text-gray-400 leading-relaxed text-sm">
                    {feature.description}
                  </p>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Sentinels Showcase */}
      <section id="sentinels" className="relative z-10 py-32 px-6 border-t border-white/10" style={{ background: 'oklch(0.07 0.015 270 / 0.4)' }}>
        <div className="container max-w-6xl mx-auto">
          <div 
            ref={sentinelsHeaderRef.ref}
            className={`text-center mb-16 transition-all duration-700 ${
              sentinelsHeaderRef.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            }`}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-purple-500/30 bg-purple-500/10 text-purple-300 text-xs font-semibold uppercase tracking-widest mb-6">
              <Sparkles className="w-3 h-3" /> The Council
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">Meet Your Sentinels</h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Six specialized AI personalities. Each thinks differently. Together, they think better.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {sentinels.map((sentinel, idx) => (
              <Card
                key={idx}
                ref={sentinel.ref.ref}
                className={`group relative bg-black/40 border-white/8 backdrop-blur-xl overflow-hidden hover:-translate-y-1 hover:shadow-xl transition-all duration-500 ${
                  sentinel.ref.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                } ${sentinel.delay}`}
                style={{ '--sentinel-color': sentinel.color } as React.CSSProperties}
              >
                {/* Color accent top bar */}
                <div className="h-1 w-full" style={{ background: `linear-gradient(90deg, ${sentinel.color}80, ${sentinel.color}20)` }} />
                <div className="p-6 flex items-start gap-4">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0 shadow-lg"
                    style={{ background: `${sentinel.color}20`, boxShadow: `0 4px 20px ${sentinel.color}20` }}
                  >
                    {sentinel.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-white">{sentinel.name}</h3>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        idx < 3
                          ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                          : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }`}>{idx < 3 ? 'FREE' : 'PRO'}</span>
                    </div>
                    <p className="text-xs text-gray-400 mb-3">{sentinel.specialty}</p>
                    <div className="h-px w-full" style={{ background: `${sentinel.color}20` }} />
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <div className="text-center mt-12">
            <a href="/sentinels">
              <Button variant="outline" className="border-cyan-500/30 hover:bg-cyan-500/10 hover:border-cyan-500/50 transition-all">
                Explore All Sentinels
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="relative z-10 py-32 px-6 border-t border-white/10">
        <div className="container max-w-6xl mx-auto">
          <div 
            ref={testimonialsHeaderRef.ref}
            className={`text-center mb-16 transition-all duration-700 ${
              testimonialsHeaderRef.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            }`}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-xs font-semibold uppercase tracking-widest mb-6">
              <MessageSquare className="w-3 h-3" /> User Stories
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">Trusted by Innovators</h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              See what people are saying about their Glow experience.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                name: 'Marcus Chen', role: 'Product Manager',
                gradient: 'from-cyan-500 to-blue-500', emoji: '👨‍💼',
                quote: "Glow's multi-Sentinel approach completely changed how I brainstorm. Getting different perspectives from specialized AI personalities helps me see blind spots I'd normally miss.",
                ref: testimonial1Ref, delay: 'delay-0'
              },
              {
                name: 'Sarah Williams', role: 'Creative Director',
                gradient: 'from-purple-500 to-pink-500', emoji: '👩‍🎨',
                quote: "Voice-First Mode is a game changer. I can brainstorm ideas while walking my dog. The natural conversation flow with multiple Sentinels feels like having a creative team in my pocket.",
                ref: testimonial2Ref, delay: 'delay-100'
              },
              {
                name: 'Alex Rodriguez', role: 'Software Engineer',
                gradient: 'from-orange-500 to-red-500', emoji: '👨‍💻',
                quote: "The analytics dashboard shows me exactly how I'm using each Sentinel. It's fascinating to see patterns in my thinking. Glow isn't just a tool—it's a mirror for my creative process.",
                ref: testimonial3Ref, delay: 'delay-200'
              },
            ].map((t, i) => (
              <Card
                key={i}
                ref={t.ref.ref}
                className={`group relative bg-black/40 border-white/8 backdrop-blur-xl p-8 hover:border-white/20 hover:-translate-y-1 transition-all duration-500 overflow-hidden ${t.delay} ${
                  t.ref.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                }`}
              >
                {/* Large decorative quote mark */}
                <div className="absolute top-4 right-6 text-7xl font-serif text-white/5 leading-none select-none">&ldquo;</div>
                {/* Star rating */}
                <div className="flex gap-0.5 mb-5">
                  {[...Array(5)].map((_, s) => (
                    <svg key={s} className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-gray-300 leading-relaxed mb-6 text-sm relative z-10">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${t.gradient} flex items-center justify-center text-lg flex-shrink-0`}>
                    {t.emoji}
                  </div>
                  <div>
                    <div className="font-semibold text-sm text-white">{t.name}</div>
                    <div className="text-xs text-gray-500">{t.role}</div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="relative z-10 py-32 px-6 border-t border-white/10" style={{ background: 'oklch(0.065 0.015 270 / 0.5)' }}>
        <div className="container max-w-6xl mx-auto">
          <div 
            ref={pricingHeaderRef.ref}
            className={`text-center mb-16 transition-all duration-700 ${
              pricingHeaderRef.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            }`}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 text-xs font-semibold uppercase tracking-widest mb-6">
              <TrendingUp className="w-3 h-3" /> Pricing
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">Choose Your Path</h2>
            <p className="text-xl text-gray-400">
              Start free. Upgrade when you need more power.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {/* Free Plan */}
            <Card 
              ref={pricingCard1Ref.ref}
              className={`bg-black/50 border-white/10 backdrop-blur-xl p-8 hover:scale-105 hover:border-white/30 transition-all duration-700 delay-0 ${
                pricingCard1Ref.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
              }`}
            >
              <div className="mb-6">
                <h3 className="text-2xl font-bold mb-2">Free</h3>
                <div className="text-4xl font-bold mb-4">
                  $0<span className="text-lg text-gray-400">/month</span>
                </div>
                <p className="text-gray-400">Perfect for getting started</p>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-cyan-400" />
                  <span>50 messages per month</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-cyan-400" />
                  <span>3 Sentinels included</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-cyan-400" />
                  <span>Conversation history</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-cyan-400" />
                  <span>Basic templates</span>
                </li>
              </ul>
              <a href="/chat">
                <Button variant="outline" className="w-full border-white/20 hover:bg-white/5">
                  Get Started
                </Button>
              </a>
            </Card>

            {/* Pro Plan */}
            <Card 
              ref={pricingCard2Ref.ref}
              className={`bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border-cyan-500/50 backdrop-blur-xl p-6 sm:p-8 relative hover:scale-105 hover:shadow-[0_0_30px_rgba(6,182,212,0.3)] transition-all duration-700 delay-100 ${
                pricingCard2Ref.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
              }`}
            >
              <div className="absolute top-4 right-4">
                <span className="bg-cyan-500 text-black text-xs font-bold px-3 py-1 rounded-full">
                  POPULAR
                </span>
              </div>
              <div className="mb-6">
                <h3 className="text-2xl font-bold mb-2">Pro</h3>
                <div className="text-4xl font-bold mb-4">
                  $19<span className="text-lg text-gray-400">/month</span>
                </div>
                <p className="text-gray-400">For power users</p>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-cyan-400" />
                  <span className="font-semibold">Unlimited messages</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-cyan-400" />
                  <span className="font-semibold">All 6 Sentinels</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-cyan-400" />
                  <span className="font-semibold">Multi-Sentinel conversations</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-cyan-400" />
                  <span className="font-semibold">Voice-First Mode</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-cyan-400" />
                  <span>Analytics Dashboard</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-cyan-400" />
                  <span>Priority support</span>
                </li>
              </ul>
              <a href="/chat">
                <Button className="w-full bg-cyan-500 hover:bg-cyan-600 text-black font-semibold">
                  Upgrade to Pro
                </Button>
              </a>
            </Card>

            {/* Creator Plan */}
            <Card
              ref={pricingCard3Ref.ref}
              className={`bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/40 backdrop-blur-xl p-6 sm:p-8 relative hover:scale-105 hover:shadow-[0_0_30px_rgba(245,158,11,0.25)] transition-all duration-700 delay-200 ${
                pricingCard3Ref.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
              }`}
            >
              <div className="absolute top-4 right-4">
                <span className="bg-gradient-to-r from-amber-500 to-orange-500 text-black text-xs font-bold px-3 py-1 rounded-full">
                  CREATOR
                </span>
              </div>
              <div className="mb-6">
                <h3 className="text-2xl font-bold mb-2">Creator</h3>
                <div className="text-4xl font-bold mb-4">
                  $29<span className="text-lg text-gray-400">/month</span>
                </div>
                <p className="text-gray-400">Build your own AI Sentinels</p>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-amber-400" />
                  <span className="font-semibold text-amber-200">Create up to 5 custom Sentinels</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-amber-400" />
                  <span className="font-semibold text-amber-200">Full personality &amp; prompt control</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-amber-400" />
                  <span>Everything in Pro</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-amber-400" />
                  <span>Unlimited messages</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-amber-400" />
                  <span>Voice-First Mode</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-amber-400" />
                  <span>Priority support</span>
                </li>
              </ul>
              <a href="/my-sentinels">
                <Button className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-black font-semibold">
                  Become a Creator
                </Button>
              </a>
            </Card>
          </div>

          {/* Feature Comparison Table */}
          <div className="mt-16 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-4 pr-8 text-gray-400 font-medium w-1/3">Feature</th>
                  <th className="text-center py-4 px-4 text-gray-300 font-semibold">Free</th>
                  <th className="text-center py-4 px-4 text-cyan-300 font-semibold">Pro</th>
                  <th className="text-center py-4 px-4 text-amber-300 font-semibold">Creator</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {[
                  ['Monthly messages', '50', 'Unlimited', 'Unlimited'],
                  ['Sentinels included', '3', '6', '6'],
                  ['Custom Sentinels', '—', '—', 'Up to 5'],
                  ['Multi-Sentinel conversations', '—', '✓', '✓'],
                  ['Voice transcription', '—', '✓', '✓'],
                  ['Text-to-speech', '—', '✓', '✓'],
                  ['Conversation templates', '—', '✓', '✓'],
                  ['Memory retention', '30 days', 'Unlimited', 'Unlimited'],
                  ['Priority support', '—', '✓', '✓'],
                ].map(([feature, free, pro, creator], i) => (
                  <tr key={i} className="hover:bg-white/2 transition-colors">
                    <td className="py-3.5 pr-8 text-gray-300">{feature}</td>
                    <td className="py-3.5 px-4 text-center text-gray-400">{free}</td>
                    <td className="py-3.5 px-4 text-center text-cyan-300">{pro}</td>
                    <td className="py-3.5 px-4 text-center text-amber-300">{creator}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="relative z-10 py-32 px-6 border-t border-white/10">
        <div className="container max-w-4xl mx-auto">
          <div 
            ref={faqHeaderRef.ref}
            className={`text-center mb-16 transition-all duration-700 ${
              faqHeaderRef.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            }`}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/15 bg-white/5 text-gray-300 text-xs font-semibold uppercase tracking-widest mb-6">
              <Brain className="w-3 h-3" /> FAQ
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">Frequently Asked Questions</h2>
            <p className="text-xl text-gray-400">
              Everything you need to know about Glow.
            </p>
          </div>

          <div 
            ref={faqAccordionRef.ref}
            className={`transition-all duration-700 delay-200 ${
              faqAccordionRef.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            }`}
          >
            <Accordion type="single" collapsible className="space-y-3">
              <AccordionItem value="item-1" className="bg-black/40 border-white/8 backdrop-blur-xl rounded-xl px-6 data-[state=open]:border-cyan-500/30 data-[state=open]:bg-cyan-500/5 transition-colors">
                <AccordionTrigger className="text-base font-semibold hover:text-cyan-400 transition-colors py-5">
                  What are Sentinels and how do they work?
                </AccordionTrigger>
                <AccordionContent className="text-gray-300 leading-relaxed">
                  Sentinels are specialized AI personalities, each with unique expertise and perspectives. Think of them as a council of advisors—Vixen's Den for practical strategy, Mischief.EXE for creative chaos, Lunaris.Vault for deep analysis, and more. You can chat with them individually or engage multiple Sentinels in the same conversation for diverse viewpoints.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-2" className="bg-black/40 border-white/8 backdrop-blur-xl rounded-xl px-6 data-[state=open]:border-cyan-500/30 data-[state=open]:bg-cyan-500/5 transition-colors">
                <AccordionTrigger className="text-base font-semibold hover:text-cyan-400 transition-colors py-5">
                  What's the difference between Free and Pro?
                </AccordionTrigger>
                <AccordionContent className="text-gray-300 leading-relaxed">
                  Free gives you 50 messages per month with access to 3 Sentinels. Pro ($19/month) unlocks unlimited messages, all 6 Sentinels, Multi-Sentinel conversations, Voice-First Mode, and an Analytics Dashboard. Creator ($29/month) includes everything in Pro plus the ability to build up to 5 fully custom AI Sentinels with your own personality, expertise, and system prompt.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-3" className="bg-black/40 border-white/8 backdrop-blur-xl rounded-xl px-6 data-[state=open]:border-cyan-500/30 data-[state=open]:bg-cyan-500/5 transition-colors">
                <AccordionTrigger className="text-base font-semibold hover:text-cyan-400 transition-colors py-5">
                  How does Multi-Sentinel conversation work?
                </AccordionTrigger>
                <AccordionContent className="text-gray-300 leading-relaxed">
                  With Pro, you can add multiple Sentinels to a single conversation thread. They'll respond in round-robin fashion, each offering their unique perspective on your question. It's like having a brainstorming session with experts from different fields—perfect for complex problems that benefit from diverse thinking.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-4" className="bg-black/40 border-white/8 backdrop-blur-xl rounded-xl px-6 data-[state=open]:border-cyan-500/30 data-[state=open]:bg-cyan-500/5 transition-colors">
                <AccordionTrigger className="text-base font-semibold hover:text-cyan-400 transition-colors py-5">
                  Is my data private and secure?
                </AccordionTrigger>
                <AccordionContent className="text-gray-300 leading-relaxed">
                  Yes. Your conversations are encrypted in transit and at rest. We don't sell your data to third parties. Sentinels use your conversation history to provide context within your account, but this data is isolated to you. You can delete your conversations anytime from your dashboard.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-5" className="bg-black/40 border-white/8 backdrop-blur-xl rounded-xl px-6 data-[state=open]:border-cyan-500/30 data-[state=open]:bg-cyan-500/5 transition-colors">
                <AccordionTrigger className="text-base font-semibold hover:text-cyan-400 transition-colors py-5">
                  Can I cancel my Pro subscription anytime?
                </AccordionTrigger>
                <AccordionContent className="text-gray-300 leading-relaxed">
                  Absolutely. You can cancel your Pro subscription at any time from your account settings. You'll retain Pro features until the end of your current billing period, then automatically switch to the Free plan. No hidden fees or cancellation charges.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-6" className="bg-black/40 border-white/8 backdrop-blur-xl rounded-xl px-6 data-[state=open]:border-cyan-500/30 data-[state=open]:bg-cyan-500/5 transition-colors">
                <AccordionTrigger className="text-base font-semibold hover:text-cyan-400 transition-colors py-5">
                  What is Voice-First Mode?
                </AccordionTrigger>
                <AccordionContent className="text-gray-300 leading-relaxed">
                  Voice-First Mode lets you speak naturally to Sentinels instead of typing. Perfect for brainstorming on the go, driving, or when you think faster than you type. Sentinels respond with text, but you can keep the conversation flowing entirely by voice. Available exclusively for Pro users.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-7" className="bg-black/40 border-white/8 backdrop-blur-xl rounded-xl px-6 data-[state=open]:border-cyan-500/30 data-[state=open]:bg-cyan-500/5 transition-colors">
                <AccordionTrigger className="text-base font-semibold hover:text-cyan-400 transition-colors py-5">
                  Do Sentinels remember past conversations?
                </AccordionTrigger>
                <AccordionContent className="text-gray-300 leading-relaxed">
                  Yes, within the same conversation thread. Each conversation maintains its own context, so Sentinels can reference earlier messages. However, conversations are isolated from each other for privacy. If you want to continue a previous discussion, you can reference it manually or start a new conversation.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-8" className="bg-black/40 border-white/8 backdrop-blur-xl rounded-xl px-6 data-[state=open]:border-cyan-500/30 data-[state=open]:bg-cyan-500/5 transition-colors">
                <AccordionTrigger className="text-base font-semibold hover:text-cyan-400 transition-colors py-5">
                  How do I get started?
                </AccordionTrigger>
                <AccordionContent className="text-gray-300 leading-relaxed">
                  Click "Start Chatting" or "Initialize" in the navigation to create your account. You'll go through a quick onboarding tutorial that introduces you to the Sentinels and shows you how to start your first conversation. No credit card required for the Free plan.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      </section>

      {/* Email Capture CTA */}
      <section className="relative z-10 py-40 px-6 border-t border-white/10 overflow-hidden">
        {/* Radial glow behind headline */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[600px] h-[400px] rounded-full" style={{ background: 'radial-gradient(ellipse, oklch(0.55 0.18 200 / 0.12) 0%, transparent 70%)' }} />
        </div>
        <div 
          ref={ctaRef.ref}
          className={`container max-w-4xl mx-auto text-center relative z-10 transition-all duration-700 ${
            ctaRef.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 text-xs font-semibold uppercase tracking-widest mb-8">
            <Sparkles className="w-3 h-3" /> Get Started Free
          </div>
          <h2 className="text-5xl sm:text-6xl font-black mb-6 leading-tight">Ready to illuminate<br />your thinking?</h2>
          <p className="text-xl text-gray-400 mb-4 max-w-xl mx-auto">
            Join thousands experiencing multi-perspective AI conversations.
          </p>
          <p className="text-sm text-gray-500 mb-12">No credit card required. Start free today.</p>

          <form onSubmit={handleEmailSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto mb-8">
            <Input
              type="email"
              placeholder="enter_your_email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-black/60 border-white/15 text-white placeholder:text-gray-600 font-mono flex-1 focus:border-cyan-500/50"
              required
            />
            <Button type="submit" className="bg-cyan-500 hover:bg-cyan-400 text-black font-bold px-6 shadow-lg shadow-cyan-500/20 transition-all">
              Initialize
            </Button>
          </form>

          <div className="flex items-center justify-center gap-6 text-xs text-gray-600">
            <span className="flex items-center gap-1.5"><Shield className="w-3 h-3" /> AES-256 Encrypted</span>
            <span className="w-px h-3 bg-white/10" />
            <span className="flex items-center gap-1.5"><Layers className="w-3 h-3" /> Data Sovereignty</span>
            <span className="w-px h-3 bg-white/10" />
            <span className="flex items-center gap-1.5"><Zap className="w-3 h-3" /> Cancel Anytime</span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10 pt-16 pb-10 px-6" style={{ background: 'oklch(0.055 0.01 270)' }}>
        {/* Gradient top divider */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />
        <div className="container max-w-6xl mx-auto">
          {/* Top row: brand + nav columns */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
            {/* Brand column */}
            <div className="col-span-2 md:col-span-2">
              <div className="mb-4">
                <GlowLogo size="md" showWordmark showTagline={false} />
              </div>
              <p className="text-sm text-gray-500 leading-relaxed max-w-xs mb-6">
                Your AI. Your Identity. Your Sovereignty.<br />
                Multi-perspective intelligence for the modern mind.
              </p>
              {/* Social links */}
              <div className="flex items-center gap-3">
                {[
                  { label: 'Twitter / X', path: 'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z' },
                  { label: 'GitHub', path: 'M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z' },
                  { label: 'Discord', path: 'M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.002.022.015.043.031.053a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z' },
                ].map((social) => (
                  <a key={social.label} href="#" aria-label={social.label}
                    className="w-8 h-8 rounded-lg border border-white/10 bg-white/5 flex items-center justify-center text-gray-500 hover:text-white hover:border-white/20 hover:bg-white/10 transition-all">
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                      <path d={social.path} />
                    </svg>
                  </a>
                ))}
              </div>
            </div>

            {/* Nav columns */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4">Product</h4>
              <ul className="space-y-2.5 text-sm text-gray-400">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="/sentinels" className="hover:text-white transition-colors">Sentinels</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="/my-sentinels" className="hover:text-white transition-colors">Creator</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4">Company</h4>
              <ul className="space-y-2.5 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4">Legal</h4>
              <ul className="space-y-2.5 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Privacy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Security</a></li>
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="border-t border-white/8 pt-8 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-gray-600">
              © 2026 Glow. All rights reserved.
            </p>
            <p className="text-xs text-gray-700 italic">
              Your AI. Your Identity. Your Sovereignty.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
