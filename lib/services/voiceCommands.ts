// Voice Command Service
// Enables voice control of the fantasy football platform

import { lineupOptimizer } from '@/lib/ai/lineupOptimizer';
import { tradeAnalyzer } from '@/lib/ai/tradeAnalyzer';
import { Team, Player } from '@/lib/types';

export interface VoiceCommand {
  intent: string;
  entities: Record<string, any>;
  confidence: number;
  transcript: string;
}

export interface VoiceResponse {
  text: string;
  action?: () => void;
  data?: any;
  speak: boolean;
}

export class VoiceCommandService {
  private recognition: any = null;
  private synthesis: SpeechSynthesisUtterance | null = null;
  private isListening = false;
  private callbacks: Map<string, (result: VoiceCommand) => void> = new Map();
  private aiContext: any = null;

  constructor() {
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition;
      this.recognition = new SpeechRecognition();
      this.setupRecognition();
    }
  }

  private setupRecognition() {
    if (!this.recognition) return;

    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = 'en-US';
    this.recognition.maxAlternatives = 3;

    this.recognition.onresult = (event: any) => {
      const last = event.results.length - 1;
      const result = event.results[last];
      
      if (result.isFinal) {
        const transcript = result[0].transcript;
        const confidence = result[0].confidence;
        
        const command = this.parseCommand(transcript);
        command.confidence = confidence;
        
        this.handleCommand(command);
      }
    };

    this.recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      if (event.error === 'no-speech') {
        // Restart listening
        if (this.isListening) {
          this.recognition.start();
        }
      }
    };

    this.recognition.onend = () => {
      if (this.isListening) {
        // Restart if still supposed to be listening
        this.recognition.start();
      }
    };
  }

  // Parse natural language into commands
  private parseCommand(transcript: string): VoiceCommand {
    const lower = transcript.toLowerCase().trim();
    
    // Command patterns
    const patterns = [
      // Lineup commands
      {
        pattern: /(?:optimize|fix|set|update) (?:my )?lineup/i,
        intent: 'optimize_lineup',
        extractor: () => ({ week: this.extractWeek(lower) })
      },
      {
        pattern: /(?:who should i|should i) (?:start|bench|sit) (.+)/i,
        intent: 'start_sit',
        extractor: (match: RegExpMatchArray) => ({ 
          player: match[1].trim() 
        })
      },
      {
        pattern: /(?:swap|replace) (.+) (?:with|for) (.+)/i,
        intent: 'swap_players',
        extractor: (match: RegExpMatchArray) => ({
          player1: match[1].trim(),
          player2: match[2].trim()
        })
      },
      
      // Trade commands
      {
        pattern: /(?:analyze|evaluate|check) (?:this )?trade/i,
        intent: 'analyze_trade',
        extractor: () => ({})
      },
      {
        pattern: /(?:trade|offer) (.+) for (.+)/i,
        intent: 'propose_trade',
        extractor: (match: RegExpMatchArray) => ({
          offering: match[1].trim(),
          requesting: match[2].trim()
        })
      },
      {
        pattern: /(?:find|show|get) trade targets (?:for (.+))?/i,
        intent: 'find_trade_targets',
        extractor: (match: RegExpMatchArray) => ({
          player: match[1]?.trim()
        })
      },
      
      // Waiver commands
      {
        pattern: /(?:add|pickup|claim) (.+) (?:from waivers?)?/i,
        intent: 'add_player',
        extractor: (match: RegExpMatchArray) => ({
          player: match[1].trim()
        })
      },
      {
        pattern: /(?:drop|release|cut) (.+)/i,
        intent: 'drop_player',
        extractor: (match: RegExpMatchArray) => ({
          player: match[1].trim()
        })
      },
      {
        pattern: /(?:show|what are|check) (?:the )?(?:top|best) waiver (?:pickups?|adds?|claims?)/i,
        intent: 'waiver_recommendations',
        extractor: () => ({})
      },
      
      // Score/Status commands
      {
        pattern: /(?:what'?s?|show|tell me) (?:my|the) score/i,
        intent: 'get_score',
        extractor: () => ({})
      },
      {
        pattern: /(?:am i|will i) (?:winning|win)/i,
        intent: 'win_probability',
        extractor: () => ({})
      },
      {
        pattern: /(?:how'?s?|check) (.+) (?:doing|playing|performing)/i,
        intent: 'player_status',
        extractor: (match: RegExpMatchArray) => ({
          player: match[1].trim()
        })
      },
      
      // News/Updates
      {
        pattern: /(?:any|what'?s?|show|tell me) (?:the )?(?:latest )?news (?:for|about|on) (.+)/i,
        intent: 'player_news',
        extractor: (match: RegExpMatchArray) => ({
          player: match[1].trim()
        })
      },
      {
        pattern: /(?:injury|injuries) (?:report|update|status)/i,
        intent: 'injury_report',
        extractor: () => ({})
      },
      
      // Navigation
      {
        pattern: /(?:go to|open|show|navigate to) (.+)/i,
        intent: 'navigate',
        extractor: (match: RegExpMatchArray) => ({
          destination: match[1].trim()
        })
      },
      
      // AI Advice
      {
        pattern: /(?:give me|what'?s?|need) (?:some )?advice/i,
        intent: 'ai_advice',
        extractor: () => ({})
      },
      {
        pattern: /(?:help|assist|guide) (?:me )?(?:with (.+))?/i,
        intent: 'help',
        extractor: (match: RegExpMatchArray) => ({
          topic: match[1]?.trim()
        })
      }
    ];

    // Find matching pattern
    for (const { pattern, intent, extractor } of patterns) {
      const match = lower.match(pattern);
      if (match) {
        return {
          intent,
          entities: extractor(match),
          confidence: 1,
          transcript
        };
      }
    }

    // Default: treat as question
    return {
      intent: 'question',
      entities: { query: transcript },
      confidence: 0.5,
      transcript
    };
  }

  private extractWeek(text: string): number | undefined {
    const match = text.match(/week (\d+)/i);
    return match ? parseInt(match[1]) : undefined;
  }

  // Handle recognized commands
  private async handleCommand(command: VoiceCommand) {
    console.log('Voice command:', command);
    
    // Notify all listeners
    this.callbacks.forEach(callback => callback(command));

    // Generate response based on intent
    const response = await this.generateResponse(command);
    
    if (response.speak) {
      this.speak(response.text);
    }

    if (response.action) {
      // Execute associated action
      setTimeout(() => response.action!(), 500);
    }
  }

  // Generate responses for commands
  private async generateResponse(command: VoiceCommand): Promise<VoiceResponse> {
    switch (command.intent) {
      case 'optimize_lineup':
        return {
          text: "I'm optimizing your lineup for maximum points. One moment...",
          action: () => this.optimizeLineup(command.entities.week),
          speak: true
        };

      case 'start_sit':
        return {
          text: `Let me check if you should start ${command.entities.player}...`,
          action: () => this.checkStartSit(command.entities.player),
          speak: true
        };

      case 'get_score':
        const score = await this.getCurrentScore();
        return {
          text: `Your current score is ${score.team} to ${score.opponent}. ${
            score.team > score.opponent ? "You're winning!" : "You're trailing."
          }`,
          data: score,
          speak: true
        };

      case 'win_probability':
        const prob = await this.getWinProbability();
        return {
          text: `Your win probability is ${prob}%. ${
            prob > 50 ? "Looking good!" : "It's going to be close."
          }`,
          data: { probability: prob },
          speak: true
        };

      case 'waiver_recommendations':
        return {
          text: "I'm finding the best waiver wire pickups for you...",
          action: () => this.showWaiverRecommendations(),
          speak: true
        };

      case 'player_news':
        return {
          text: `Getting the latest news about ${command.entities.player}...`,
          action: () => this.getPlayerNews(command.entities.player),
          speak: true
        };

      case 'injury_report':
        return {
          text: "Checking injury reports for your players...",
          action: () => this.checkInjuries(),
          speak: true
        };

      case 'navigate':
        return {
          text: `Navigating to ${command.entities.destination}...`,
          action: () => this.navigate(command.entities.destination),
          speak: true
        };

      case 'ai_advice':
        const advice = await this.getAIAdvice();
        return {
          text: advice,
          speak: true
        };

      case 'help':
        return {
          text: command.entities.topic 
            ? `I can help you with ${command.entities.topic}. What would you like to know?`
            : "I can help you optimize lineups, analyze trades, check scores, and more. Just ask!",
          speak: true
        };

      default:
        return {
          text: "I understand you said: " + command.transcript + ". How can I help with that?",
          speak: true
        };
    }
  }

  // Action implementations
  private async optimizeLineup(week?: number) {
    // This would call the lineup optimizer
    console.log('Optimizing lineup for week', week || 'current');
    // Implementation would go here
  }

  private async checkStartSit(playerName: string) {
    console.log('Checking start/sit for', playerName);
    // Implementation would go here
  }

  private async getCurrentScore(): Promise<{ team: number; opponent: number }> {
    // Fetch from team store or API
    return { team: 85.5, opponent: 72.3 };
  }

  private async getWinProbability(): Promise<number> {
    // Calculate based on current scores and projections
    return 65;
  }

  private async showWaiverRecommendations() {
    console.log('Showing waiver recommendations');
    // Implementation would go here
  }

  private async getPlayerNews(playerName: string) {
    console.log('Getting news for', playerName);
    // Implementation would go here
  }

  private async checkInjuries() {
    console.log('Checking injury reports');
    // Implementation would go here
  }

  private navigate(destination: string) {
    const routes: Record<string, string> = {
      'dashboard': '/dashboard',
      'command center': '/command-center',
      'teams': '/teams',
      'my teams': '/teams',
      'players': '/players',
      'trades': '/trades',
      'waivers': '/waivers',
      'waiver wire': '/waivers',
      'settings': '/settings',
      'news': '/news',
    };

    const route = routes[destination.toLowerCase()];
    if (route && typeof window !== 'undefined') {
      window.location.href = route;
    }
  }

  private async getAIAdvice(): Promise<string> {
    const adviceOptions = [
      "Your running backs are underperforming. Consider trading for an RB1.",
      "Your opponent has a weak defense this week. Start your risky high-upside players.",
      "Weather conditions favor running games this week. Prioritize RBs over WRs.",
      "Three of your bench players are on bye next week. Plan your waiver claims now.",
      "Your team is strong at WR. Package two for an elite RB upgrade.",
    ];
    
    return adviceOptions[Math.floor(Math.random() * adviceOptions.length)];
  }

  // Text-to-speech
  speak(text: string, options?: {
    rate?: number;
    pitch?: number;
    volume?: number;
    voice?: SpeechSynthesisVoice;
  }) {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = options?.rate || 1;
    utterance.pitch = options?.pitch || 1;
    utterance.volume = options?.volume || 1;

    if (options?.voice) {
      utterance.voice = options.voice;
    } else {
      // Try to use a preferred voice
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(v => 
        v.name.includes('Samantha') || 
        v.name.includes('Alex') || 
        v.lang === 'en-US'
      );
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }
    }

    window.speechSynthesis.speak(utterance);
  }

  // Start listening
  startListening() {
    if (!this.recognition) {
      console.warn('Speech recognition not available');
      return false;
    }

    if (!this.isListening) {
      this.isListening = true;
      this.recognition.start();
      return true;
    }
    return false;
  }

  // Stop listening
  stopListening() {
    if (this.recognition && this.isListening) {
      this.isListening = false;
      this.recognition.stop();
    }
  }

  // Register callback for commands
  onCommand(callback: (command: VoiceCommand) => void): () => void {
    const id = Math.random().toString(36);
    this.callbacks.set(id, callback);
    
    // Return unsubscribe function
    return () => {
      this.callbacks.delete(id);
    };
  }

  // Check if available
  get isAvailable(): boolean {
    return typeof window !== 'undefined' && 
           'webkitSpeechRecognition' in window &&
           'speechSynthesis' in window;
  }

  // Get available voices
  getVoices(): SpeechSynthesisVoice[] {
    if (typeof window === 'undefined' || !window.speechSynthesis) return [];
    return window.speechSynthesis.getVoices();
  }

  // Set AI context for smarter responses
  setContext(context: any) {
    this.aiContext = context;
  }
}

// Singleton instance
export const voiceCommands = new VoiceCommandService();

// React Hook for voice commands
export function useVoiceCommands() {
  const [isListening, setIsListening] = React.useState(false);
  const [lastCommand, setLastCommand] = React.useState<VoiceCommand | null>(null);
  const [isAvailable, setIsAvailable] = React.useState(false);

  React.useEffect(() => {
    setIsAvailable(voiceCommands.isAvailable);

    const unsubscribe = voiceCommands.onCommand((command) => {
      setLastCommand(command);
    });

    return unsubscribe;
  }, []);

  const startListening = React.useCallback(() => {
    if (voiceCommands.startListening()) {
      setIsListening(true);
    }
  }, []);

  const stopListening = React.useCallback(() => {
    voiceCommands.stopListening();
    setIsListening(false);
  }, []);

  const speak = React.useCallback((text: string) => {
    voiceCommands.speak(text);
  }, []);

  return {
    isAvailable,
    isListening,
    lastCommand,
    startListening,
    stopListening,
    speak,
    setContext: voiceCommands.setContext.bind(voiceCommands),
  };
}

import React from 'react';