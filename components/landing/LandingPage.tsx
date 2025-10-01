'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Trophy,
  Brain,
  Zap,
  Users,
  TrendingUp,
  Shield,
  ChevronRight,
  Star,
  ArrowRight,
  CheckCircle,
  Sparkles,
  Activity,
  Target,
  Clock,
  Smartphone,
  Globe,
  BarChart3,
  MessageSquare,
  Lock,
  RefreshCw,
  Award,
  Flame
} from 'lucide-react';
import { cn } from '@/lib/utils';

const features = [
  {
    icon: Brain,
    title: 'AI-Powered Insights',
    description: 'Get personalized recommendations backed by machine learning algorithms analyzing millions of data points.',
    color: 'text-purple-500',
  },
  {
    icon: Users,
    title: 'Multi-Team Management',
    description: 'Manage all your teams from ESPN, Yahoo, Sleeper, and more in one unified dashboard.',
    color: 'text-blue-500',
  },
  {
    icon: Zap,
    title: 'Real-Time Updates',
    description: 'Live scores, instant injury alerts, and breaking news delivered in milliseconds.',
    color: 'text-yellow-500',
  },
  {
    icon: Target,
    title: 'Lineup Optimizer',
    description: 'AI analyzes matchups, weather, and trends to suggest your optimal lineup every week.',
    color: 'text-green-500',
  },
  {
    icon: Activity,
    title: 'Live Game Center',
    description: 'Track all your games simultaneously with play-by-play updates and win probability.',
    color: 'text-red-500',
  },
  {
    icon: Shield,
    title: 'Platform Integration',
    description: 'Set lineups and make trades directly from our app across all your fantasy platforms.',
    color: 'text-indigo-500',
  },
];

const testimonials = [
  {
    name: 'Mike Chen',
    role: '3x League Champion',
    content: 'This platform helped me win 3 out of 4 leagues last season. The AI insights are game-changing.',
    rating: 5,
  },
  {
    name: 'Sarah Johnson',
    role: 'Dynasty League Manager',
    content: 'Managing 6 teams across different platforms was a nightmare. Now it takes me 5 minutes.',
    rating: 5,
  },
  {
    name: 'Alex Rivera',
    role: 'Fantasy Enthusiast',
    content: 'The injury alerts alone saved my season. I knew about McCaffrey being out 30 minutes before ESPN updated.',
    rating: 5,
  },
];

const platforms = [
  { name: 'ESPN', logo: '🏈' },
  { name: 'Yahoo', logo: '🟣' },
  { name: 'Sleeper', logo: '😴' },
  { name: 'NFL', logo: '🏆' },
  { name: 'CBS', logo: '📺' },
  { name: 'DraftKings', logo: '👑' },
];

export function LandingPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleGetStarted = async () => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    router.push('/signup');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center space-x-2">
            <Trophy className="h-6 w-6 text-primary" />
            <span className="font-bold text-xl gradient-text">FantasyAI Pro</span>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="ghost" onClick={() => router.push('/')}>
              Login
            </Button>
            <Button className="btn-glow" onClick={handleGetStarted}>
              Get Started
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 lg:py-32">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-background" />
        <div className="container relative">
          <div className="mx-auto max-w-4xl text-center animate-slide-up">
            <Badge className="mb-4 px-4 py-1" variant="outline">
              <Sparkles className="mr-1 h-3 w-3" />
              Trusted by 50,000+ fantasy managers
            </Badge>
            
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
              <span className="gradient-text">Win Every League.</span>
              <br />
              Manage Every Team.
              <br />
              <span className="text-muted-foreground">One Platform.</span>
            </h1>
            
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl">
              The only fantasy football platform you'll ever need. Manage all your teams across ESPN, Yahoo, Sleeper, and more with AI-powered insights that give you an unfair advantage.
            </p>
            
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <div className="flex-1 max-w-sm">
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 text-lg"
                />
              </div>
              <Button 
                size="lg" 
                className="btn-glow h-12 px-8 text-lg"
                onClick={handleGetStarted}
                disabled={isLoading}
              >
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
            
            <p className="mt-4 text-sm text-muted-foreground">
              100% Free Forever • Community Driven • No Hidden Fees
            </p>
          </div>
        </div>
      </section>

      {/* Platform Logos */}
      <section className="border-y py-12">
        <div className="container">
          <p className="text-center text-sm text-muted-foreground mb-6">
            WORKS SEAMLESSLY WITH ALL MAJOR PLATFORMS
          </p>
          <div className="flex flex-wrap justify-center items-center gap-8">
            {platforms.map((platform) => (
              <div key={platform.name} className="flex items-center space-x-2">
                <span className="text-3xl">{platform.logo}</span>
                <span className="font-medium text-lg">{platform.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Problem/Solution */}
      <section className="py-20">
        <div className="container">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-24 items-center">
            <div className="animate-slide-up">
              <Badge className="mb-4" variant="destructive">
                The Problem
              </Badge>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-6">
                Juggling multiple fantasy apps is killing your win rate
              </h2>
              <ul className="space-y-4">
                <li className="flex items-start space-x-3">
                  <div className="mt-1">
                    <div className="h-2 w-2 rounded-full bg-red-500" />
                  </div>
                  <span className="text-muted-foreground">
                    Switching between 5 different apps to manage your teams
                  </span>
                </li>
                <li className="flex items-start space-x-3">
                  <div className="mt-1">
                    <div className="h-2 w-2 rounded-full bg-red-500" />
                  </div>
                  <span className="text-muted-foreground">
                    Missing crucial injury updates because they're scattered
                  </span>
                </li>
                <li className="flex items-start space-x-3">
                  <div className="mt-1">
                    <div className="h-2 w-2 rounded-full bg-red-500" />
                  </div>
                  <span className="text-muted-foreground">
                    Making lineup decisions based on gut feeling instead of data
                  </span>
                </li>
                <li className="flex items-start space-x-3">
                  <div className="mt-1">
                    <div className="h-2 w-2 rounded-full bg-red-500" />
                  </div>
                  <span className="text-muted-foreground">
                    Forgetting to set lineups across all your leagues
                  </span>
                </li>
              </ul>
            </div>
            
            <div className="animate-slide-up">
              <Badge className="mb-4 bg-green-500">
                The Solution
              </Badge>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-6">
                One dashboard to dominate them all
              </h2>
              <ul className="space-y-4">
                <li className="flex items-start space-x-3">
                  <CheckCircle className="mt-1 h-5 w-5 text-green-500 flex-shrink-0" />
                  <span className="text-muted-foreground">
                    <strong className="text-foreground">Unified Dashboard:</strong> See all your teams, all your leagues, one screen
                  </span>
                </li>
                <li className="flex items-start space-x-3">
                  <CheckCircle className="mt-1 h-5 w-5 text-green-500 flex-shrink-0" />
                  <span className="text-muted-foreground">
                    <strong className="text-foreground">AI Analysis:</strong> Get personalized insights for every player, every matchup
                  </span>
                </li>
                <li className="flex items-start space-x-3">
                  <CheckCircle className="mt-1 h-5 w-5 text-green-500 flex-shrink-0" />
                  <span className="text-muted-foreground">
                    <strong className="text-foreground">Real-Time Everything:</strong> Injury alerts, score updates, news breaks - instantly
                  </span>
                </li>
                <li className="flex items-start space-x-3">
                  <CheckCircle className="mt-1 h-5 w-5 text-green-500 flex-shrink-0" />
                  <span className="text-muted-foreground">
                    <strong className="text-foreground">Direct Management:</strong> Set lineups and make moves without switching apps
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-muted/50">
        <div className="container">
          <div className="text-center mb-12 animate-slide-up">
            <Badge className="mb-4" variant="outline">
              Features
            </Badge>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
              Everything you need to win championships
            </h2>
            <p className="mx-auto max-w-2xl text-muted-foreground">
              Built by fantasy football obsessives, powered by artificial intelligence
            </p>
          </div>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <Card 
                  key={idx} 
                  className="card-hover border-border/50 animate-slide-up"
                  style={{ animationDelay: `${idx * 100}ms` }}
                >
                  <CardHeader>
                    <div className="flex items-center space-x-3">
                      <div className={cn('p-2 rounded-lg bg-primary/10', feature.color)}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <CardTitle className="text-xl">{feature.title}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20">
        <div className="container">
          <div className="text-center mb-12">
            <Badge className="mb-4" variant="outline">
              Testimonials
            </Badge>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
              Join thousands of winning managers
            </h2>
          </div>
          
          <div className="grid gap-6 md:grid-cols-3">
            {testimonials.map((testimonial, idx) => (
              <Card key={idx} className="card-hover">
                <CardHeader>
                  <div className="flex items-center space-x-1 mb-2">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                    ))}
                  </div>
                  <CardDescription className="text-base">
                    "{testimonial.content}"
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div>
                    <div className="font-semibold">{testimonial.name}</div>
                    <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary/5">
        <div className="container">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-6">
              Ready to dominate your leagues?
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              Start your free trial today and see why serious fantasy managers choose FantasyAI Pro
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="btn-glow text-lg px-8" onClick={handleGetStarted}>
                Start Free Trial
                <Flame className="ml-2 h-5 w-5" />
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-8">
                <MessageSquare className="mr-2 h-5 w-5" />
                Talk to an Expert
              </Button>
            </div>
            <div className="mt-8 flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>14-day free trial</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Always free</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Cancel anytime</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12">
        <div className="container">
          <div className="grid gap-8 lg:grid-cols-4">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Trophy className="h-6 w-6 text-primary" />
                <span className="font-bold text-xl">FantasyAI Pro</span>
              </div>
              <p className="text-sm text-muted-foreground">
                The ultimate fantasy football command center for serious managers.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-3">Product</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary">Features</a></li>
                <li><a href="#" className="hover:text-primary">Community</a></li>
                <li><a href="#" className="hover:text-primary">API</a></li>
                <li><a href="#" className="hover:text-primary">Roadmap</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-3">Resources</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary">Blog</a></li>
                <li><a href="#" className="hover:text-primary">Help Center</a></li>
                <li><a href="#" className="hover:text-primary">Community</a></li>
                <li><a href="#" className="hover:text-primary">Status</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-3">Company</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary">About</a></li>
                <li><a href="#" className="hover:text-primary">Careers</a></li>
                <li><a href="#" className="hover:text-primary">Privacy</a></li>
                <li><a href="#" className="hover:text-primary">Terms</a></li>
              </ul>
            </div>
          </div>
          
          <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
            <p>© 2024 FantasyAI Pro. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}