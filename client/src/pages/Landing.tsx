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
  const sentinelsHeaderRef = useScrollAnimation();
  const pricingHeaderRef = useScrollAnimation();
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

  const sentinels = [
    { name: "Vixen's Den", emoji: "🦊", color: "#FF6B6B", specialty: "Practical Strategy" },
    { name: "Mischief.EXE", emoji: "🎭", color: "#4ECDC4", specialty: "Creative Chaos" },
    { name: "Lunaris.Vault", emoji: "🌙", color: "#95E1D3", specialty: "Deep Analysis" },
    { name: "Aetheris.Flow", emoji: "🌊", color: "#38A3A5", specialty: "Adaptive Thinking" },
    { name: "Rift.EXE", emoji: "⚡", color: "#FF8C42", specialty: "Disruption" },
    { name: "Nyx", emoji: "🌑", color: "#9B59B6", specialty: "Shadow Work" },
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
            {/* Feature 1 */}
            <Card className="bg-black/50 border-cyan-500/20 backdrop-blur-xl p-8 hover:border-cyan-500/50 transition-all">
              <div className="w-12 h-12 bg-cyan-500/20 rounded-lg flex items-center justify-center mb-6">
                <Users className="w-6 h-6 text-cyan-400" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Multi-Sentinel Conversations</h3>
              <p className="text-gray-400 leading-relaxed">
                Engage multiple AI personalities in a single conversation. Get diverse perspectives on complex problems.
              </p>
            </Card>

            {/* Feature 2 */}
            <Card className="bg-black/50 border-cyan-500/20 backdrop-blur-xl p-8 hover:border-cyan-500/50 transition-all">
              <div className="w-12 h-12 bg-cyan-500/20 rounded-lg flex items-center justify-center mb-6">
                <Mic className="w-6 h-6 text-cyan-400" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Voice-First Mode</h3>
              <p className="text-gray-400 leading-relaxed">
                Speak naturally with your Sentinels. Advanced speech-to-text and text-to-speech for seamless interaction.
              </p>
            </Card>

            {/* Feature 3 */}
            <Card className="bg-black/50 border-cyan-500/20 backdrop-blur-xl p-8 hover:border-cyan-500/50 transition-all">
              <div className="w-12 h-12 bg-cyan-500/20 rounded-lg flex items-center justify-center mb-6">
                <TrendingUp className="w-6 h-6 text-cyan-400" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Analytics Dashboard</h3>
              <p className="text-gray-400 leading-relaxed">
                Track your conversations, usage patterns, and insights. Understand how you interact with AI.
              </p>
            </Card>

            {/* Feature 4 */}
            <Card className="bg-black/50 border-cyan-500/20 backdrop-blur-xl p-8 hover:border-cyan-500/50 transition-all">
              <div className="w-12 h-12 bg-cyan-500/20 rounded-lg flex items-center justify-center mb-6">
                <Layers className="w-6 h-6 text-cyan-400" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Conversation Templates</h3>
              <p className="text-gray-400 leading-relaxed">
                Pre-built workflows for common tasks. Brainstorming, decision-making, creative writing, and more.
              </p>
            </Card>

            {/* Feature 5 */}
            <Card className="bg-black/50 border-cyan-500/20 backdrop-blur-xl p-8 hover:border-cyan-500/50 transition-all">
              <div className="w-12 h-12 bg-cyan-500/20 rounded-lg flex items-center justify-center mb-6">
                <Shield className="w-6 h-6 text-cyan-400" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Data Sovereignty</h3>
              <p className="text-gray-400 leading-relaxed">
                Your conversations belong to you. Export, delete, or manage your data at any time.
              </p>
            </Card>

            {/* Feature 6 */}
            <Card className="bg-black/50 border-cyan-500/20 backdrop-blur-xl p-8 hover:border-cyan-500/50 transition-all">
              <div className="w-12 h-12 bg-cyan-500/20 rounded-lg flex items-center justify-center mb-6">
                <Zap className="w-6 h-6 text-cyan-400" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Real-Time Streaming</h3>
              <p className="text-gray-400 leading-relaxed">
                Watch responses appear in real-time. No waiting, no delays. Instant AI interaction.
              </p>
            </Card>
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
                className="bg-black/50 border-white/10 backdrop-blur-xl p-6 hover:border-cyan-500/50 transition-all text-center"
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
            <Card className="bg-black/50 border-white/10 backdrop-blur-xl p-8">
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
            <Card className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border-cyan-500/50 backdrop-blur-xl p-8 relative">
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
