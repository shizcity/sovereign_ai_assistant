import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
  Check
} from "lucide-react";
import { toast } from "sonner";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

export default function Landing() {
  const [email, setEmail] = useState("");
  const [particles, setParticles] = useState<Array<{ x: number; y: number; delay: number }>>([]);
  
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
  const ctaRef = useScrollAnimation();

  useEffect(() => {
    document.title = "Glow - Your AI. Your Identity. Your Sovereignty.";
    
    // Generate random particles for background effect
    const newParticles = Array.from({ length: 50 }, () => ({
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
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-gray-400 hover:text-white transition-colors">Features</a>
            <a href="#sentinels" className="text-gray-400 hover:text-white transition-colors">Sentinels</a>
            <a href="#pricing" className="text-gray-400 hover:text-white transition-colors">Pricing</a>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/chat">
              <Button variant="ghost" className="text-gray-400 hover:text-white">
                Sign In
              </Button>
            </Link>
            <Link href="/chat">
              <Button className="bg-cyan-500 hover:bg-cyan-600 text-black font-semibold">
                Initialize
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 pt-32 pb-20 px-6">
        <div className="container max-w-6xl mx-auto">
          {/* Status Indicator */}
          <div className="flex items-center justify-center gap-2 mb-12 animate-pulse">
            <div className="w-2 h-2 bg-cyan-400 rounded-full" />
            <span className="text-cyan-400 font-mono text-sm tracking-wider">
              SENTINELS_ONLINE
            </span>
          </div>

          {/* Main Headline */}
          <div className="text-center mb-12">
            <h1 className="text-6xl md:text-8xl font-bold mb-6 leading-tight">
              <span className="text-white">Multi-Sentinel</span>
              <br />
              <span className="text-gray-500">AI Platform</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
              Your AI. Your Identity. Your Sovereignty.
              <br />
              Experience conversations with specialized AI personalities.
            </p>
          </div>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link href="/chat">
              <Button size="lg" className="bg-white hover:bg-gray-100 text-black font-semibold px-8 py-6 text-lg">
                Start Chatting
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <a href="#features">
              <Button size="lg" variant="outline" className="border-white/20 hover:bg-white/5 px-8 py-6 text-lg">
                Explore System
              </Button>
            </a>
          </div>

          {/* Terminal-style code snippet */}
          <div className="max-w-2xl mx-auto">
            <Card className="bg-black/50 border-cyan-500/30 backdrop-blur-xl p-6">
              <div className="font-mono text-sm space-y-2">
                <div className="text-gray-500">glow://core/sentinel-v2</div>
                <div className="text-cyan-400">&gt; initializing_sequence</div>
                <div className="text-cyan-400">&gt; sentinels_connected</div>
                <div className="text-cyan-400">&gt; multi_perspective_mode... <span className="text-white">ACTIVE</span></div>
              </div>
            </Card>
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
            <h2 className="text-5xl font-bold mb-4">Core Architecture</h2>
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
          >
            <h2 className="text-5xl font-bold mb-4">Meet the Sentinels</h2>
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
            <Link href="/sentinels">
              <Button variant="outline" className="border-cyan-500/30 hover:bg-cyan-500/10">
                Explore All Sentinels
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
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
            <h2 className="text-5xl font-bold mb-4">Choose Your Plan</h2>
            <p className="text-xl text-gray-400">
              Start free. Upgrade when you need more power.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
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
                  <span>100 messages per month</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-cyan-400" />
                  <span>Access to all 6 Sentinels</span>
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
              <Link href="/chat">
                <Button variant="outline" className="w-full border-white/20 hover:bg-white/5">
                  Get Started
                </Button>
              </Link>
            </Card>

            {/* Pro Plan */}
            <Card 
              ref={pricingCard2Ref.ref}
              className={`bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border-cyan-500/50 backdrop-blur-xl p-8 relative hover:scale-105 hover:shadow-[0_0_30px_rgba(6,182,212,0.3)] transition-all duration-700 delay-100 ${
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
                  $20<span className="text-lg text-gray-400">/month</span>
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
                  <span className="font-semibold">Multi-Sentinel conversations</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-cyan-400" />
                  <span className="font-semibold">Voice-First Mode</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-cyan-400" />
                  <span className="font-semibold">Analytics Dashboard</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-cyan-400" />
                  <span>Priority support</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-cyan-400" />
                  <span>Advanced templates</span>
                </li>
              </ul>
              <Link href="/chat">
                <Button className="w-full bg-cyan-500 hover:bg-cyan-600 text-black font-semibold">
                  Upgrade to Pro
                </Button>
              </Link>
            </Card>
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
                <li><Link href="/sentinels"><a className="hover:text-white transition-colors">Sentinels</a></Link></li>
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
