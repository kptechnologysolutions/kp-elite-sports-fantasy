'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Trophy, Brain, Zap, Users, TrendingUp, Shield, Star, 
  ArrowRight, CheckCircle, Activity, Target, Clock, Smartphone,
  Globe, BarChart3, Lock, RefreshCw, Award, Flame, History,
  Wifi, Command, PlayCircle, DollarSign, ChevronRight, Gamepad2,
  Newspaper, LineChart, UserCheck, FileText, Calculator, Mail
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { TeamImport } from '@/components/teams/TeamImport';

const features = [
  {
    icon: Globe,
    title: 'Multi-Platform Support',
    description: 'Connect all your leagues from ESPN, Yahoo, Sleeper, NFL.com, and CBS Sports in one place',
    color: 'text-blue-500'
  },
  {
    icon: Brain,
    title: 'AI-Powered Insights',
    description: 'Get personalized recommendations for lineups, trades, and waiver wire pickups',
    color: 'text-purple-500'
  },
  {
    icon: RefreshCw,
    title: 'Real-Time Updates',
    description: 'Live scoring, injury updates, and breaking news delivered instantly',
    color: 'text-green-500'
  },
  {
    icon: History,
    title: 'League History Tracking',
    description: 'Track your league\'s history, records, and achievements across seasons',
    color: 'text-yellow-500'
  },
  {
    icon: Trophy,
    title: 'Championship Tools',
    description: 'Advanced analytics and projections to help you win your league',
    color: 'text-orange-500'
  },
  {
    icon: Gamepad2,
    title: 'Interactive Games',
    description: 'Play fantasy football mini-games and compete with friends',
    color: 'text-pink-500'
  }
];

const stats = [
  { label: 'Active Users', value: '10,000+', icon: Users },
  { label: 'Leagues Tracked', value: '25,000+', icon: Trophy },
  { label: 'Win Rate Improvement', value: '+23%', icon: TrendingUp },
  { label: 'Uptime', value: '99.9%', icon: Activity }
];

const platforms = [
  { name: 'ESPN', logo: '🏈' },
  { name: 'Yahoo', logo: '🟣' },
  { name: 'Sleeper', logo: '😴' },
  { name: 'NFL.com', logo: '🏆' },
  { name: 'CBS Sports', logo: '📺' }
];

export function HalGridLandingV2() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [showImport, setShowImport] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');

  const handleGetStarted = () => {
    setShowImport(true);
    setTimeout(() => {
      document.getElementById('import-section')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleWaitlist = () => {
    if (email) {
      alert(`Thanks! We'll notify ${email} when premium features launch.`);
      setEmail('');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-black text-white">
      {/* Navigation Header */}
      <header className="fixed top-0 w-full z-50 bg-gray-950/80 backdrop-blur-xl border-b border-gray-800">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xl">H</span>
                </div>
                <span className="text-xl font-bold">HalGrid</span>
              </div>
              
              <nav className="hidden md:flex items-center gap-6">
                <a href="#features" className="text-gray-300 hover:text-white transition">Features</a>
                <a href="#how-it-works" className="text-gray-300 hover:text-white transition">How It Works</a>
                <a href="#pricing" className="text-gray-300 hover:text-white transition">Pricing</a>
                <a href="#demo" className="text-gray-300 hover:text-white transition">Demo</a>
              </nav>
            </div>
            
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost"
                onClick={() => router.push('/hub')}
                className="hidden sm:flex"
              >
                Sign In
              </Button>
              <Button 
                onClick={handleGetStarted}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
              >
                Get Started Free
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <Badge className="mb-6 px-4 py-2 bg-gradient-to-r from-green-600/20 to-blue-600/20 border-green-500/50">
              <Flame className="w-4 h-4 mr-2 text-orange-500" />
              100% Free During Beta • Created by Fantasy Football Enthusiasts
            </Badge>
            
            <h1 className="text-5xl md:text-7xl font-bold mb-6">
              Win Your Fantasy League
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500">
                With AI-Powered Intelligence
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
              Manage all your fantasy teams, get expert AI insights, and dominate your leagues 
              with the most advanced fantasy football platform ever built.
            </p>

            {/* Platform Badges */}
            <div className="flex flex-wrap justify-center gap-4 mb-8">
              {platforms.map((platform) => (
                <div key={platform.name} className="flex items-center gap-2 px-4 py-2 bg-gray-800/50 rounded-full">
                  <span className="text-2xl">{platform.logo}</span>
                  <span className="text-sm font-medium">{platform.name}</span>
                </div>
              ))}
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                onClick={handleGetStarted}
                className="px-8 py-6 text-lg bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
              >
                Import Your Teams Now
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })}
                className="px-8 py-6 text-lg border-gray-700 hover:bg-gray-800"
              >
                <PlayCircle className="mr-2 w-5 h-5" />
                See Live Demo
              </Button>
            </div>
          </motion.div>

          {/* Stats Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-6"
          >
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="text-center">
                  <Icon className="w-8 h-8 mx-auto mb-2 text-blue-500" />
                  <div className="text-3xl font-bold mb-1">{stat.value}</div>
                  <div className="text-sm text-gray-400">{stat.label}</div>
                </div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* Interactive Demo Section */}
      <section id="demo" className="py-20 px-4 bg-gradient-to-b from-gray-900/50 to-transparent">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Your Complete Fantasy Command Center
            </h2>
            <p className="text-lg text-gray-400">
              Everything you need to manage and win your leagues
            </p>
          </div>

          <Card className="bg-gray-900/50 border-gray-800 backdrop-blur-xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 border-b border-gray-800">
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  {['dashboard', 'teams', 'insights', 'history'].map((tab) => (
                    <Button
                      key={tab}
                      variant={activeTab === tab ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setActiveTab(tab)}
                      className={cn(
                        "capitalize",
                        activeTab === tab && "bg-blue-600 hover:bg-blue-700"
                      )}
                    >
                      {tab}
                    </Button>
                  ))}
                </div>
                <Badge className="bg-green-500/20 text-green-400">
                  <Wifi className="w-3 h-3 mr-1 animate-pulse" />
                  LIVE
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent className="p-6">
              {activeTab === 'dashboard' && (
                <div className="grid md:grid-cols-3 gap-6">
                  <Card className="bg-gray-800/50 border-gray-700">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Trophy className="w-5 h-5 text-yellow-500" />
                        League Standings
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Your Team</span>
                          <Badge>1st</Badge>
                        </div>
                        <div className="text-2xl font-bold">8-2</div>
                        <div className="text-xs text-gray-400">142.5 PPG</div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gray-800/50 border-gray-700">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Brain className="w-5 h-5 text-purple-500" />
                        AI Recommendation
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-yellow-400 mb-2">📈 Trade Alert</p>
                      <p className="text-xs">Package RB2 + WR3 for elite WR1. League has undervalued receivers.</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-gray-800/50 border-gray-700">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Activity className="w-5 h-5 text-green-500" />
                        Live Score
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold mb-2">124.5 - 98.3</div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div className="bg-green-500 h-2 rounded-full" style={{ width: '75%' }} />
                      </div>
                      <p className="text-xs text-gray-400 mt-2">Win Prob: 75%</p>
                    </CardContent>
                  </Card>
                </div>
              )}

              {activeTab === 'teams' && (
                <div className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    {['ESPN Dynasty League', 'Yahoo Competitive', 'Sleeper Keeper League'].map((league, i) => (
                      <Card key={i} className="bg-gray-800/50 border-gray-700">
                        <CardHeader>
                          <CardTitle className="text-lg">{league}</CardTitle>
                          <CardDescription>12 Teams • PPR • $100 Buy-in</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="text-sm font-medium">Current Rank</p>
                              <p className="text-2xl font-bold">#{i + 1}</p>
                            </div>
                            <Button size="sm" variant="outline">
                              Manage Team
                              <ChevronRight className="w-4 h-4 ml-1" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'insights' && (
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Zap className="w-5 h-5 text-yellow-500" />
                      Waiver Wire Targets
                    </h3>
                    <div className="space-y-2">
                      {['Jaylen Warren - RB', 'Sam LaPorta - TE', 'Jaxon Smith-Njigba - WR'].map((player) => (
                        <div key={player} className="p-3 bg-gray-800/50 rounded-lg flex justify-between items-center">
                          <span className="text-sm">{player}</span>
                          <Badge className="bg-green-500/20 text-green-400">+12% Proj</Badge>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-semibold flex items-center gap-2">
                      <LineChart className="w-5 h-5 text-blue-500" />
                      Trade Analysis
                    </h3>
                    <Card className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 border-blue-500/30">
                      <CardContent className="pt-4">
                        <p className="text-sm mb-2">Proposed Trade Value:</p>
                        <div className="text-3xl font-bold text-green-400">+15.3</div>
                        <p className="text-xs text-gray-400 mt-1">Expected weekly point increase</p>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}

              {activeTab === 'history' && (
                <div className="space-y-6">
                  <div className="grid md:grid-cols-3 gap-4">
                    <Card className="bg-gray-800/50 border-gray-700">
                      <CardContent className="pt-6">
                        <Trophy className="w-8 h-8 text-yellow-500 mb-2" />
                        <p className="text-2xl font-bold">3</p>
                        <p className="text-sm text-gray-400">Championships</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-gray-800/50 border-gray-700">
                      <CardContent className="pt-6">
                        <Award className="w-8 h-8 text-blue-500 mb-2" />
                        <p className="text-2xl font-bold">67%</p>
                        <p className="text-sm text-gray-400">Win Rate</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-gray-800/50 border-gray-700">
                      <CardContent className="pt-6">
                        <Target className="w-8 h-8 text-purple-500 mb-2" />
                        <p className="text-2xl font-bold">1,247</p>
                        <p className="text-sm text-gray-400">Total Transactions</p>
                      </CardContent>
                    </Card>
                  </div>
                  
                  <div className="p-4 bg-gray-800/50 rounded-lg">
                    <h4 className="font-medium mb-3">Season Records</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">2023 Season</span>
                        <span>11-3 • Champion 🏆</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">2022 Season</span>
                        <span>9-5 • 3rd Place</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">2021 Season</span>
                        <span>10-4 • Runner-up</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Everything You Need to Dominate
            </h2>
            <p className="text-lg text-gray-400">
              Professional tools that give you the competitive edge
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  viewport={{ once: true }}
                >
                  <Card className="h-full bg-gray-900/50 border-gray-800 hover:border-gray-700 transition-colors">
                    <CardHeader>
                      <Icon className={cn("w-10 h-10 mb-3", feature.color)} />
                      <CardTitle className="text-xl">{feature.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-400">{feature.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-4 bg-gradient-to-b from-gray-900/50 to-transparent">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Get Started in 3 Simple Steps
            </h2>
            <p className="text-lg text-gray-400">
              From signup to championship in minutes
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <span className="text-2xl font-bold">1</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Connect Your Leagues</h3>
              <p className="text-gray-400">Import all your fantasy teams from any platform instantly</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center">
                <span className="text-2xl font-bold">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Get AI Insights</h3>
              <p className="text-gray-400">Receive personalized recommendations based on your league settings</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-pink-500 to-orange-600 rounded-full flex items-center justify-center">
                <span className="text-2xl font-bold">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Dominate Your League</h3>
              <p className="text-gray-400">Make data-driven decisions and watch your win rate soar</p>
            </div>
          </div>
        </div>
      </section>

      {/* Import Section */}
      {showImport && (
        <section id="import-section" className="py-20 px-4">
          <div className="container mx-auto max-w-4xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Card className="bg-gray-900/50 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-2xl text-center">
                    Import Your Fantasy Teams
                  </CardTitle>
                  <CardDescription className="text-center">
                    Connect your leagues and start winning today
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <TeamImport />
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </section>
      )}

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Simple, Transparent Pricing
            </h2>
            <Badge className="px-4 py-2 bg-green-500/20 text-green-400">
              100% Free During Beta
            </Badge>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <Card className="bg-gray-900/50 border-gray-800">
              <CardHeader>
                <CardTitle>Free</CardTitle>
                <CardDescription>Perfect for casual players</CardDescription>
                <div className="text-3xl font-bold mt-4">$0</div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Up to 3 teams</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Basic AI insights</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Live scoring</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-b from-blue-900/30 to-purple-900/30 border-blue-500/50">
              <CardHeader>
                <Badge className="mb-2 bg-blue-500/20 text-blue-400">Most Popular</Badge>
                <CardTitle>Pro</CardTitle>
                <CardDescription>For serious competitors</CardDescription>
                <div className="text-3xl font-bold mt-4">
                  $4.99<span className="text-sm font-normal text-gray-400">/month</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Unlimited teams</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Advanced AI analysis</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Trade analyzer</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>League history tracking</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-gray-900/50 border-gray-800">
              <CardHeader>
                <CardTitle>Dynasty</CardTitle>
                <CardDescription>For league commissioners</CardDescription>
                <div className="text-3xl font-bold mt-4">
                  $9.99<span className="text-sm font-normal text-gray-400">/month</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Everything in Pro</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Commissioner tools</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Custom reports</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Priority support</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>

          <div className="text-center mt-12">
            <div className="max-w-md mx-auto">
              <p className="text-sm text-gray-400 mb-4">
                Join the waitlist for premium features
              </p>
              <div className="flex gap-2">
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-gray-900/50 border-gray-700"
                />
                <Button onClick={handleWaitlist}>
                  Join Waitlist
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-gray-800">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold">H</span>
                </div>
                <span className="font-bold">HalGrid</span>
              </div>
              <p className="text-sm text-gray-400">
                The ultimate fantasy football command center
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#features" className="hover:text-white transition">Features</a></li>
                <li><a href="#pricing" className="hover:text-white transition">Pricing</a></li>
                <li><a href="#demo" className="hover:text-white transition">Demo</a></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition">Documentation</a></li>
                <li><a href="#" className="hover:text-white transition">API</a></li>
                <li><a href="#" className="hover:text-white transition">Contact</a></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition">Privacy</a></li>
                <li><a href="#" className="hover:text-white transition">Terms</a></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-gray-800 flex items-center justify-between">
            <p className="text-sm text-gray-400">
              © 2024 HalGrid. Created with passion by Hal.
            </p>
            <div className="flex items-center gap-4">
              <Badge className="bg-green-500/20 text-green-400">
                <Activity className="w-3 h-3 mr-1" />
                All systems operational
              </Badge>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}