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
  X
} from "lucide-react";
import { toast } from "sonner";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

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
    <div className="min-h-screen bg-black text-white overflow-hidden relative">
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
      {/* Particle Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {particles.map((particle, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-cyan-500/30 rounded-full animate-pulse"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              animationDelay: `${particle.delay}s`,
            }}
          />
        ))}
      </div>

      {/* Navigation */}
      <nav className="relative z-50 border-b border-white/10 backdrop-blur-xl bg-black/50">
        <div className="container max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-cyan-400" />
            <span className="text-xl font-bold">Glow</span>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-gray-400 hover:text-white transition-colors">Features</a>
            <a href="#sentinels" className="text-gray-400 hover:text-white transition-colors">Sentinels</a>
            <a href="#pricing" className="text-gray-400 hover:text-white transition-colors">Pricing</a>
          </div>
          
          {/* Desktop CTA Buttons */}
          <div className="hidden md:flex items-center gap-4">
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

      {/* Hero Section - Spectacular Redesign */}
      <section className="relative z-10 pt-20 pb-32 px-6 overflow-hidden">
        {/* Animated gradient orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 -left-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }} />
          <div className="absolute bottom-1/4 -right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s', animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '8s', animationDelay: '2s' }} />
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
                <h1 className="text-6xl sm:text-7xl lg:text-8xl font-black leading-[0.9] tracking-tight">
                  <span className="bg-gradient-to-r from-white via-cyan-200 to-purple-200 bg-clip-text text-transparent">
                    Your AI
                  </span>
                  <br />
                  <span className="text-white">
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

                {/* Connecting Lines */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-30">
                  <line x1="50%" y1="15%" x2="20%" y2="40%" stroke="url(#gradient1)" strokeWidth="2" strokeDasharray="5,5" className="animate-pulse" />
                  <line x1="50%" y1="15%" x2="80%" y2="40%" stroke="url(#gradient2)" strokeWidth="2" strokeDasharray="5,5" className="animate-pulse" style={{ animationDelay: '0.5s' }} />
                  <defs>
                    <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#06b6d4" />
                      <stop offset="100%" stopColor="#a855f7" />
                    </linearGradient>
                    <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#06b6d4" />
                      <stop offset="100%" stopColor="#3b82f6" />
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
      >
        <div className="container max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-cyan-400 mb-2">6</div>
              <div className="text-gray-400 text-sm uppercase tracking-wider">Unique Sentinels</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-cyan-400 mb-2">∞</div>
              <div className="text-gray-400 text-sm uppercase tracking-wider">Conversations</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-cyan-400 mb-2">3</div>
              <div className="text-gray-400 text-sm uppercase tracking-wider">Pro Features</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-cyan-400 mb-2">24/7</div>
              <div className="text-gray-400 text-sm uppercase tracking-wider">System Uptime</div>
            </div>
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
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">Core Architecture</h2>
            <p className="text-xl text-gray-400">
              Advanced capabilities for multi-perspective intelligence.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <Card
                  key={idx}
                  ref={feature.ref.ref}
                  className={`bg-black/50 border-cyan-500/20 backdrop-blur-xl p-8 hover:border-cyan-500/50 transition-all duration-700 ${
                    feature.ref.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                  } ${feature.delay}`}
                >
                  <div className="w-12 h-12 bg-cyan-500/20 rounded-lg flex items-center justify-center mb-6">
                    <Icon className="w-6 h-6 text-cyan-400" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4">{feature.title}</h3>
                  <p className="text-gray-400 leading-relaxed">
                    {feature.description}
                  </p>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Sentinels Showcase */}
      <section id="sentinels" className="relative z-10 py-32 px-6 border-t border-white/10">
        <div className="container max-w-6xl mx-auto">
          <div 
            ref={sentinelsHeaderRef.ref}
            className={`text-center mb-16 transition-all duration-700 ${
              sentinelsHeaderRef.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            }`}
          >            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">Meet Your Sentinels</h2>
            <p className="text-xl text-gray-400">
              Six specialized AI personalities, each with unique expertise and perspective.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {sentinels.map((sentinel, idx) => (
              <Card
                key={idx}
                ref={sentinel.ref.ref}
                className={`bg-black/50 border-white/10 backdrop-blur-xl p-6 hover:border-cyan-500/50 transition-all duration-700 text-center ${
                  sentinel.ref.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                } ${sentinel.delay}`}
              >
                <div
                  className="text-5xl mb-4 w-20 h-20 rounded-full flex items-center justify-center mx-auto"
                  style={{ background: `${sentinel.color}20` }}
                >
                  {sentinel.emoji}
                </div>
                <h3 className="font-bold mb-2 text-sm">{sentinel.name}</h3>
                <p className="text-xs text-gray-400">{sentinel.specialty}</p>
              </Card>
            ))}
          </div>

          <div className="text-center mt-12">
            <a href="/sentinels">
              <Button variant="outline" className="border-cyan-500/30 hover:bg-cyan-500/10">
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
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">Trusted by Innovators</h2>
            <p className="text-xl text-gray-400">
              See what people are saying about their Glow experience.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Testimonial 1 */}
            <Card 
              ref={testimonial1Ref.ref}
              className={`bg-black/50 border-white/10 backdrop-blur-xl p-8 transition-all duration-700 delay-0 ${
                testimonial1Ref.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
              }`}
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-2xl">
                  👨‍💼
                </div>
                <div>
                  <div className="font-bold">Marcus Chen</div>
                  <div className="text-sm text-gray-400">Product Manager</div>
                </div>
              </div>
              <p className="text-gray-300 leading-relaxed">
                "Glow's multi-Sentinel approach completely changed how I brainstorm. Getting different perspectives from specialized AI personalities helps me see blind spots I'd normally miss."
              </p>
            </Card>

            {/* Testimonial 2 */}
            <Card 
              ref={testimonial2Ref.ref}
              className={`bg-black/50 border-white/10 backdrop-blur-xl p-8 transition-all duration-700 delay-100 ${
                testimonial2Ref.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
              }`}
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-2xl">
                  👩‍🎨
                </div>
                <div>
                  <div className="font-bold">Sarah Williams</div>
                  <div className="text-sm text-gray-400">Creative Director</div>
                </div>
              </div>
              <p className="text-gray-300 leading-relaxed">
                "Voice-First Mode is a game changer. I can brainstorm ideas while walking my dog. The natural conversation flow with multiple Sentinels feels like having a creative team in my pocket."
              </p>
            </Card>

            {/* Testimonial 3 */}
            <Card 
              ref={testimonial3Ref.ref}
              className={`bg-black/50 border-white/10 backdrop-blur-xl p-8 transition-all duration-700 delay-200 ${
                testimonial3Ref.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
              }`}
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-2xl">
                  👨‍💻
                </div>
                <div>
                  <div className="font-bold">Alex Rodriguez</div>
                  <div className="text-sm text-gray-400">Software Engineer</div>
                </div>
              </div>
              <p className="text-gray-300 leading-relaxed">
                "The analytics dashboard shows me exactly how I'm using each Sentinel. It's fascinating to see patterns in my thinking. Glow isn't just a tool—it's a mirror for my creative process."
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="relative z-10 py-32 px-6 border-t border-white/10">
        <div className="container max-w-6xl mx-auto">
          <div 
            ref={pricingHeaderRef.ref}
            className={`text-center mb-16 transition-all duration-700 ${
              pricingHeaderRef.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            }`}
          >
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
            <Accordion type="single" collapsible className="space-y-4">
              <AccordionItem value="item-1" className="bg-black/50 border-white/10 backdrop-blur-xl rounded-lg px-6">
                <AccordionTrigger className="text-lg font-semibold hover:text-cyan-400 transition-colors">
                  What are Sentinels and how do they work?
                </AccordionTrigger>
                <AccordionContent className="text-gray-300 leading-relaxed">
                  Sentinels are specialized AI personalities, each with unique expertise and perspectives. Think of them as a council of advisors—Vixen's Den for practical strategy, Mischief.EXE for creative chaos, Lunaris.Vault for deep analysis, and more. You can chat with them individually or engage multiple Sentinels in the same conversation for diverse viewpoints.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-2" className="bg-black/50 border-white/10 backdrop-blur-xl rounded-lg px-6">
                <AccordionTrigger className="text-lg font-semibold hover:text-cyan-400 transition-colors">
                  What's the difference between Free and Pro?
                </AccordionTrigger>
                <AccordionContent className="text-gray-300 leading-relaxed">
                  Free gives you 50 messages per month with access to 3 Sentinels. Pro ($19/month) unlocks unlimited messages, all 6 Sentinels, Multi-Sentinel conversations, Voice-First Mode, and an Analytics Dashboard. Creator ($29/month) includes everything in Pro plus the ability to build up to 5 fully custom AI Sentinels with your own personality, expertise, and system prompt.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-3" className="bg-black/50 border-white/10 backdrop-blur-xl rounded-lg px-6">
                <AccordionTrigger className="text-lg font-semibold hover:text-cyan-400 transition-colors">
                  How does Multi-Sentinel conversation work?
                </AccordionTrigger>
                <AccordionContent className="text-gray-300 leading-relaxed">
                  With Pro, you can add multiple Sentinels to a single conversation thread. They'll respond in round-robin fashion, each offering their unique perspective on your question. It's like having a brainstorming session with experts from different fields—perfect for complex problems that benefit from diverse thinking.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-4" className="bg-black/50 border-white/10 backdrop-blur-xl rounded-lg px-6">
                <AccordionTrigger className="text-lg font-semibold hover:text-cyan-400 transition-colors">
                  Is my data private and secure?
                </AccordionTrigger>
                <AccordionContent className="text-gray-300 leading-relaxed">
                  Yes. Your conversations are encrypted in transit and at rest. We don't sell your data to third parties. Sentinels use your conversation history to provide context within your account, but this data is isolated to you. You can delete your conversations anytime from your dashboard.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-5" className="bg-black/50 border-white/10 backdrop-blur-xl rounded-lg px-6">
                <AccordionTrigger className="text-lg font-semibold hover:text-cyan-400 transition-colors">
                  Can I cancel my Pro subscription anytime?
                </AccordionTrigger>
                <AccordionContent className="text-gray-300 leading-relaxed">
                  Absolutely. You can cancel your Pro subscription at any time from your account settings. You'll retain Pro features until the end of your current billing period, then automatically switch to the Free plan. No hidden fees or cancellation charges.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-6" className="bg-black/50 border-white/10 backdrop-blur-xl rounded-lg px-6">
                <AccordionTrigger className="text-lg font-semibold hover:text-cyan-400 transition-colors">
                  What is Voice-First Mode?
                </AccordionTrigger>
                <AccordionContent className="text-gray-300 leading-relaxed">
                  Voice-First Mode lets you speak naturally to Sentinels instead of typing. Perfect for brainstorming on the go, driving, or when you think faster than you type. Sentinels respond with text, but you can keep the conversation flowing entirely by voice. Available exclusively for Pro users.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-7" className="bg-black/50 border-white/10 backdrop-blur-xl rounded-lg px-6">
                <AccordionTrigger className="text-lg font-semibold hover:text-cyan-400 transition-colors">
                  Do Sentinels remember past conversations?
                </AccordionTrigger>
                <AccordionContent className="text-gray-300 leading-relaxed">
                  Yes, within the same conversation thread. Each conversation maintains its own context, so Sentinels can reference earlier messages. However, conversations are isolated from each other for privacy. If you want to continue a previous discussion, you can reference it manually or start a new conversation.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-8" className="bg-black/50 border-white/10 backdrop-blur-xl rounded-lg px-6">
                <AccordionTrigger className="text-lg font-semibold hover:text-cyan-400 transition-colors">
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
      <section className="relative z-10 py-32 px-6 border-t border-white/10">
        <div 
          ref={ctaRef.ref}
          className={`container max-w-4xl mx-auto text-center transition-all duration-700 ${
            ctaRef.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}
        >
          <h2 className="text-5xl font-bold mb-6">Ready to illuminate your thinking?</h2>
          <p className="text-xl text-gray-400 mb-12">
            Join thousands experiencing multi-perspective AI conversations.
            <br />
            No credit card required. Start free today.
          </p>

          <form onSubmit={handleEmailSubmit} className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto mb-8">
            <Input
              type="email"
              placeholder="enter_your_email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-black/50 border-white/20 text-white placeholder:text-gray-500 font-mono"
              required
            />
            <Button type="submit" className="bg-cyan-500 hover:bg-cyan-600 text-black font-semibold">
              Initialize
            </Button>
          </form>

          <p className="text-sm text-gray-500">
            Encryption standard: AES-256 • Data sovereignty guaranteed
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10 py-12 px-6">
        <div className="container max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="font-bold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="/sentinels" className="hover:text-white transition-colors">Sentinels</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Resources</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Support</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Privacy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Security</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-cyan-400" />
              <span className="font-bold">Glow</span>
            </div>
            <p className="text-sm text-gray-400">
              © 2026 Glow. Your AI. Your Identity. Your Sovereignty.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
