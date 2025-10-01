'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Navigation } from '@/components/layout/Navigation';
import { 
  Trophy, Brain, Zap, Users, TrendingUp, Shield, ChevronRight, Star, 
  ArrowRight, CheckCircle, Sparkles, Activity, Target, Clock, Smartphone,
  Globe, BarChart3, MessageSquare, Lock, RefreshCw, Award, Flame,
  Wifi, Command, PlayCircle, DollarSign, Mail, Github, Twitter, Newspaper
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { HalTecmoBowlEnhanced } from '@/components/games/HalTecmoBowlEnhanced';

export function HalGridLanding() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [liveScore, setLiveScore] = useState(142.5);
  const [isLoading, setIsLoading] = useState(false);
  const [showGame, setShowGame] = useState(false);

  // Simulate live score updates
  useEffect(() => {
    const interval = setInterval(() => {
      setLiveScore(prev => prev + (Math.random() * 2 - 1));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleGetStarted = () => {
    setIsLoading(true);
    setTimeout(() => {
      router.push('/teams');
    }, 500);
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Navigation */}
      <Navigation />

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="container mx-auto">
          <div className="text-center max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Badge className="mb-4 bg-gradient-to-r from-blue-600 to-purple-600">
                🎉 100% Free During Beta - Created by Hal
              </Badge>
              <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
                Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-600">HalGrid</span>
              </h1>
              <p className="text-xl md:text-2xl text-gray-300 mb-8">
                Your Personal Fantasy Football Command Center
              </p>
              <p className="text-lg text-gray-400 mb-8 max-w-2xl mx-auto">
                Manage all your fantasy teams from ESPN, Yahoo, Sleeper, and more in one place. 
                Get AI-powered insights and real-time updates that give you an unfair advantage.
              </p>
              
              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
                <Button
                  size="lg"
                  onClick={handleGetStarted}
                  disabled={isLoading}
                  className="px-8 py-6 text-lg bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                >
                  {isLoading ? 'Loading...' : 'Get Started Free'}
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })}
                  className="px-8 py-6 text-lg"
                >
                  <PlayCircle className="mr-2 w-5 h-5" />
                  Watch Demo
                </Button>
              </div>

              {/* Trust Indicators */}
              <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-400">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>10,000+ Active Users</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>99.9% Uptime</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>30-Second Live Updates</span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Live Demo Preview */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="mt-16 max-w-6xl mx-auto"
            id="demo"
          >
            <Card className="bg-gray-900 border-gray-800 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-900/50 to-purple-900/50 p-4 border-b border-gray-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex gap-1">
                      <div className="w-3 h-3 rounded-full bg-red-500" />
                      <div className="w-3 h-3 rounded-full bg-yellow-500" />
                      <div className="w-3 h-3 rounded-full bg-green-500" />
                    </div>
                    <span className="text-sm text-gray-400">HalGrid Command Center</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Wifi className="w-4 h-4 text-green-500 animate-pulse" />
                    <span className="text-xs text-green-500">LIVE</span>
                  </div>
                </div>
              </div>
              <CardContent className="p-6">
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-white font-semibold flex items-center gap-2">
                      <Activity className="w-4 h-4 text-blue-500" />
                      Your Teams
                    </h3>
                    <div className="space-y-2">
                      {['Hal\'s Heroes (ESPN)', 'Grid Warriors (Yahoo)', 'The Dynasty (Sleeper)'].map((team, i) => (
                        <div key={i} className="p-3 bg-gray-800 rounded-lg flex justify-between items-center">
                          <span className="text-sm text-white">{team}</span>
                          <Badge variant={i === 0 ? "default" : "secondary"}>
                            {i === 0 ? 'LIVE' : `${3-i}-${i}`}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="text-white font-semibold flex items-center gap-2">
                      <Brain className="w-4 h-4 text-purple-500" />
                      AI Insights
                    </h3>
                    <div className="p-4 bg-gradient-to-r from-purple-900/30 to-blue-900/30 rounded-lg border border-purple-500/30">
                      <p className="text-sm text-white mb-2">🎯 Recommended Action:</p>
                      <p className="text-xs text-gray-300">
                        Start Justin Jefferson over Mike Evans this week. 
                        Weather conditions favor dome game.
                      </p>
                    </div>
                    <div className="p-3 bg-yellow-900/20 rounded-lg border border-yellow-500/30">
                      <p className="text-xs text-yellow-400">
                        ⚠️ Injury Alert: Monitor CMC\'s practice status
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="text-white font-semibold flex items-center gap-2">
                      <Trophy className="w-4 h-4 text-yellow-500" />
                      Live Score
                    </h3>
                    <div className="text-center py-4">
                      <div className="text-4xl font-bold text-white mb-2">
                        {liveScore.toFixed(1)}
                      </div>
                      <div className="text-sm text-gray-400 mb-4">
                        vs. opponent (118.3)
                      </div>
                      <div className="w-full bg-gray-800 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-500"
                          style={{ width: '67%' }}
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-2">Win Probability: 67%</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* What HalGrid Does Section */}
      <section id="features" className="py-20 px-6 bg-gray-950">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-white mb-4">
              What HalGrid Does For You
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Everything you need to dominate fantasy football, powered by Hal\'s expertise and cutting-edge AI
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              {
                icon: Users,
                title: 'Multi-Platform Integration',
                description: 'Connect all your teams from ESPN, Yahoo, Sleeper, NFL, CBS, and DraftKings in one unified dashboard.',
                features: ['Import unlimited teams', 'Cross-platform trades', 'Unified scoring'],
                color: 'from-blue-500 to-cyan-600'
              },
              {
                icon: Wifi,
                title: 'Real-Time Intelligence',
                description: 'Live scores update every 30 seconds. News from 100+ sources including ESPN, NFL, Yahoo & more.',
                features: ['100+ news sources aggregated', '30-second score updates', 'Instant injury alerts'],
                color: 'from-green-500 to-emerald-600'
              },
              {
                icon: Brain,
                title: 'AI-Powered Decisions',
                description: 'GPT-4 analyzes your lineup opportunities and suggests optimal moves.',
                features: ['Lineup optimizer', 'Trade analyzer', 'Waiver predictions'],
                color: 'from-purple-500 to-pink-600'
              },
              {
                icon: Command,
                title: 'Command Center',
                description: 'Voice commands and natural language control for hands-free management.',
                features: ['Voice commands', '3D player cards', 'Custom alerts'],
                color: 'from-orange-500 to-red-600'
              },
              {
                icon: Newspaper,
                title: 'News Aggregation Hub',
                description: 'Never miss critical updates with news from 100+ verified sources in real-time.',
                features: ['ESPN, NFL, Yahoo, CBS', 'Rotoworld & FantasyPros', 'Beat reporters & Reddit'],
                color: 'from-pink-500 to-rose-600'
              },
              {
                icon: BarChart3,
                title: 'Advanced Analytics',
                description: 'Deep performance metrics and predictive modeling for every decision.',
                features: ['Win probability', 'Player projections', 'Trend analysis'],
                color: 'from-indigo-500 to-purple-600'
              },
              {
                icon: Shield,
                title: 'Your Unfair Advantage',
                description: 'Built by Hal to give you the edge over your league mates.',
                features: ['Hal\'s insights', 'Priority updates', '24/7 monitoring'],
                color: 'from-yellow-500 to-orange-600'
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="h-full bg-gray-900 border-gray-800 hover:border-gray-700 transition-all group">
                  <CardHeader>
                    <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${feature.color} p-2.5 mb-4 group-hover:scale-110 transition-transform`}>
                      <feature.icon className="w-full h-full text-white" />
                    </div>
                    <CardTitle className="text-white">{feature.title}</CardTitle>
                    <CardDescription className="text-gray-400">
                      {feature.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {feature.features.map((item, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm text-gray-300">
                          <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-6">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-white mb-4">
              How HalGrid Works
            </h2>
            <p className="text-xl text-gray-400 mb-2">
              Three simple steps to fantasy dominance
            </p>
            <p className="text-lg text-blue-400">
              🎉 Completely free - built for the community
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            {[
              {
                step: '01',
                title: 'Import Your Teams',
                description: 'Connect your accounts from ESPN, Yahoo, Sleeper, and other platforms. HalGrid securely syncs all your teams in seconds.',
                icon: Users
              },
              {
                step: '02',
                title: 'HalGrid Syncs Everything',
                description: 'Real-time updates every 30 seconds on game day. Get scores, injuries, and news before anyone else in your league.',
                icon: RefreshCw
              },
              {
                step: '03',
                title: 'Dominate with AI',
                description: 'Get personalized recommendations from Hal\'s AI. Make trades, set lineups, and win championships with confidence.',
                icon: Trophy
              }
            ].map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.2 }}
                viewport={{ once: true }}
                className="flex gap-6 mb-12 last:mb-0"
              >
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                    <span className="text-2xl font-bold text-white">{step.step}</span>
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-white mb-2 flex items-center gap-3">
                    {step.title}
                    <step.icon className="w-6 h-6 text-blue-500" />
                  </h3>
                  <p className="text-gray-400">{step.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* HalTecmo Bowl Game Section */}
      <section className="py-20 px-6 bg-gray-900">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-white mb-4">
              🎮 Play HalTecmo Bowl While You Wait
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-8">
              Experience the classic 8-bit football action while your fantasy scores update in real-time!
            </p>
            
            {!showGame ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-4xl mx-auto"
              >
                <Card className="bg-gradient-to-r from-blue-900/50 to-purple-900/50 border-purple-500/50">
                  <CardContent className="p-12 text-center">
                    <div className="mb-8">
                      <p className="text-8xl mb-4">🏈</p>
                      <h3 className="text-3xl font-bold text-white mb-4" style={{ fontFamily: 'monospace' }}>
                        HALTECMO BOWL
                      </h3>
                      <p className="text-gray-300 mb-2">
                        A retro 8-bit football game built right into HalGrid!
                      </p>
                      <p className="text-gray-400 text-sm">
                        Classic Tecmo Bowl gameplay meets modern fantasy football
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                      <div className="text-center">
                        <p className="text-2xl mb-1">⬆️⬇️⬅️➡️</p>
                        <p className="text-xs text-gray-400">Move Player</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl mb-1">🎯</p>
                        <p className="text-xs text-gray-400">6 Classic Plays</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl mb-1">🏆</p>
                        <p className="text-xs text-gray-400">Score TDs</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl mb-1">🎵</p>
                        <p className="text-xs text-gray-400">8-Bit Sounds</p>
                      </div>
                    </div>
                    
                    <Button
                      size="lg"
                      onClick={() => setShowGame(true)}
                      className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white px-8 py-6 text-lg"
                    >
                      <span className="mr-2">🎮</span>
                      Play HalTecmo Bowl Now
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-6xl mx-auto"
              >
                <HalTecmoBowlEnhanced />
                <Button
                  variant="outline"
                  onClick={() => setShowGame(false)}
                  className="mt-4"
                >
                  Close Game
                </Button>
              </motion.div>
            )}
          </div>
        </div>
      </section>

      {/* Free During Beta Section */}
      <section id="free-beta" className="py-20 px-6 bg-gray-950">
        <div className="container mx-auto">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl font-bold text-white mb-4">
                🎉 100% Free During Beta
              </h2>
              <p className="text-xl text-gray-300 mb-8">
                Get unlimited access to all features. Always free, built for fantasy football fans.
              </p>
              
              <Card className="bg-gradient-to-b from-blue-900/20 to-purple-900/20 border-blue-500">
                <CardHeader>
                  <CardTitle className="text-2xl text-white">Everything Included - Free</CardTitle>
                  <CardDescription className="text-gray-300">
                    Help us build the best fantasy platform by being an early user
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4 mb-6">
                    {[
                      'Unlimited teams from all platforms',
                      'Real-time sync (30 seconds)',
                      'AI-powered lineup optimizer',
                      'Trade analyzer with ML predictions',
                      'Voice commands',
                      '3D player cards',
                      'Custom notifications',
                      'Priority support from Hal',
                      'Early access to new features',
                      'Help shape the product roadmap'
                    ].map((feature, i) => (
                      <div key={i} className="flex items-center gap-2 text-left">
                        <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                        <span className="text-white">{feature}</span>
                      </div>
                    ))}
                  </div>
                  
                  <Button 
                    size="lg"
                    onClick={handleGetStarted}
                    className="w-full md:w-auto px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                  >
                    Get Started Now
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                  
                  <p className="text-sm text-gray-400 mt-4">
                    * Always free - built by Hal for the fantasy football community
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* About Hal Section */}
      <section id="about" className="py-20 px-6">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-white mb-4">
              Why I Built HalGrid
            </h2>
          </div>

          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-8">
              <div className="space-y-6 text-gray-300">
                <p className="text-lg">
                  Hey, I\'m Hal. I\'ve been playing fantasy football since 2010, and like you, 
                  I was tired of jumping between different apps to manage my teams.
                </p>
                <p>
                  I built HalGrid because managing multiple teams across ESPN, Yahoo, and Sleeper 
                  was chaos. I\'d miss injury updates, forget to set lineups, and lose track of 
                  waiver wire opportunities. There had to be a better way.
                </p>
                <p>
                  So I created HalGrid - a single command center for all your fantasy teams. 
                  It uses the same APIs these platforms provide, adds AI-powered insights from GPT-4, 
                  and gives you real-time updates that keep you ahead of your league.
                </p>
                <div className="bg-blue-900/20 p-6 rounded-lg border border-blue-500/30">
                  <p className="text-white font-medium mb-2">The HalGrid Advantage:</p>
                  <ul className="space-y-2 text-sm">
                    <li>✓ See all your teams in one place</li>
                    <li>✓ Get alerts before ESPN or Yahoo update</li>
                    <li>✓ AI analyzes every decision</li>
                    <li>✓ Built by a fantasy player, for fantasy players</li>
                  </ul>
                </div>
                <p className="text-center text-xl font-medium text-white pt-4">
                  Join me and 10,000+ managers who are dominating their leagues with HalGrid.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-gradient-to-r from-blue-900/20 to-purple-900/20">
        <div className="container mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-4">
            Ready to Dominate Your League?
          </h2>
          <p className="text-xl text-gray-300 mb-4 max-w-2xl mx-auto">
            Join thousands of fantasy managers who are winning with HalGrid
          </p>
          <p className="text-lg text-blue-400 mb-8">
            🎉 100% Free Forever - Community Driven
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              onClick={handleGetStarted}
              className="px-8 py-6 text-lg bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
            >
              Start Free Today
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="px-8 py-6 text-lg"
            >
              <MessageSquare className="mr-2 w-5 h-5" />
              Contact Hal
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-gray-800">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold">H</span>
                </div>
                <span className="text-lg font-bold text-white">HalGrid</span>
              </div>
              <p className="text-sm text-gray-400">
                Your personal fantasy football command center. Created by Hal.
              </p>
            </div>
            
            <div>
              <h3 className="text-white font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#features" className="hover:text-white transition">Features</a></li>
                <li><a href="#free-beta" className="hover:text-white transition">Free Beta</a></li>
                <li><a href="#" className="hover:text-white transition">API Docs</a></li>
                <li><a href="#" className="hover:text-white transition">Changelog</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-white font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#about" className="hover:text-white transition">About Hal</a></li>
                <li><a href="#" className="hover:text-white transition">Blog</a></li>
                <li><a href="#" className="hover:text-white transition">Contact</a></li>
                <li><a href="#" className="hover:text-white transition">Support</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-white font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white transition">Cookie Policy</a></li>
              </ul>
            </div>
          </div>
          
          <Separator className="bg-gray-800 mb-8" />
          
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-gray-400">
              © 2025 HalGrid. All rights reserved. Built with ❤️ by Hal.
            </p>
            <div className="flex gap-4 mt-4 md:mt-0">
              <a href="#" className="text-gray-400 hover:text-white transition">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition">
                <Github className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition">
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}