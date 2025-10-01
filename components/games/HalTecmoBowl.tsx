'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  ChevronUp, ChevronDown, ChevronLeft, ChevronRight, 
  Play, Pause, RotateCcw, Trophy, Zap, Volume2, VolumeX,
  Info, Gamepad2, Target, Timer, Star, Heart, AlertTriangle,
  ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Space
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Game constants
const FIELD_WIDTH = 800;
const FIELD_HEIGHT = 400;
const YARD_WIDTH = FIELD_WIDTH / 100;
const PLAYER_SIZE = 16;
const BALL_SIZE = 8;

// Team configuration
const TEAMS = {
  home: {
    name: 'HAL BOMBERS',
    color: '#3B82F6', // Blue
    secondary: '#FFFFFF',
    emoji: '⚡',
    players: {
      QB: { name: 'H. Wilson', rating: 95 },
      RB: { name: 'H. Henry', rating: 92 },
      WR1: { name: 'H. Hill', rating: 94 },
      WR2: { name: 'H. Jefferson', rating: 93 }
    }
  },
  away: {
    name: 'CPU RAIDERS',
    color: '#EF4444', // Red
    secondary: '#FEF3C7',
    emoji: '🔥',
    players: {
      QB: { name: 'CPU Bot', rating: 85 },
      RB: { name: 'CPU Runner', rating: 82 },
      WR1: { name: 'CPU Catcher', rating: 83 },
      WR2: { name: 'CPU Receiver', rating: 80 }
    }
  }
};

// Play types with descriptions
const PLAYS = [
  { id: 'run-left', name: 'Run Left', type: 'run', description: 'Quick run to the left side', icon: '⬅️' },
  { id: 'run-middle', name: 'Run Middle', type: 'run', description: 'Power run up the middle', icon: '⬆️' },
  { id: 'run-right', name: 'Run Right', type: 'run', description: 'Sweep to the right side', icon: '➡️' },
  { id: 'pass-short', name: 'Short Pass', type: 'pass', description: 'Quick pass to receiver', icon: '📍' },
  { id: 'pass-long', name: 'Long Bomb', type: 'pass', description: 'Deep pass downfield', icon: '🚀' },
  { id: 'play-action', name: 'Play Action', type: 'trick', description: 'Fake run, then pass', icon: '🎭' }
];

interface GameState {
  status: 'menu' | 'playing' | 'paused' | 'touchdown' | 'gameover';
  quarter: number;
  timeRemaining: number;
  down: number;
  yardsToGo: number;
  ballPosition: number;
  possession: 'home' | 'away';
  homeScore: number;
  awayScore: number;
  selectedPlay: string | null;
  difficulty: 'easy' | 'normal' | 'hard';
}

interface Player {
  x: number;
  y: number;
  team: 'home' | 'away';
  role: 'QB' | 'RB' | 'WR' | 'OL' | 'DL' | 'LB' | 'DB';
  hasBall?: boolean;
  number: number;
  speed: number;
  targetX?: number;
  targetY?: number;
}

export function HalTecmoBowl() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameId = useRef<number>();
  
  const [gameState, setGameState] = useState<GameState>({
    status: 'menu',
    quarter: 1,
    timeRemaining: 180, // 3 minutes per quarter
    down: 1,
    yardsToGo: 10,
    ballPosition: 25,
    possession: 'home',
    homeScore: 0,
    awayScore: 0,
    selectedPlay: null,
    difficulty: 'normal'
  });
  
  const [players, setPlayers] = useState<Player[]>([]);
  const [ballCarrier, setBallCarrier] = useState<Player | null>(null);
  const [showTutorial, setShowTutorial] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [animationTime, setAnimationTime] = useState(0);
  const [powerMeter, setPowerMeter] = useState(0);
  const [turboEnabled, setTurboEnabled] = useState(false);
  const [comboCount, setComboCount] = useState(0);

  // Initialize game
  const startNewGame = () => {
    setGameState({
      status: 'playing',
      quarter: 1,
      timeRemaining: 180,
      down: 1,
      yardsToGo: 10,
      ballPosition: 25,
      possession: 'home',
      homeScore: 0,
      awayScore: 0,
      selectedPlay: null,
      difficulty: 'normal'
    });
    setupField();
    setShowTutorial(false);
  };

  // Setup field with players
  const setupField = () => {
    const newPlayers: Player[] = [];
    const yardLine = gameState.ballPosition * YARD_WIDTH;
    
    // Offense (home team)
    newPlayers.push({
      x: yardLine - 30,
      y: FIELD_HEIGHT / 2,
      team: 'home',
      role: 'QB',
      hasBall: true,
      number: 12,
      speed: 3
    });
    
    // Add more realistic formations
    // Offensive line
    for (let i = 0; i < 5; i++) {
      newPlayers.push({
        x: yardLine - 10 + (i - 2) * 15,
        y: FIELD_HEIGHT / 2 - 5,
        team: 'home',
        role: 'OL',
        number: 70 + i,
        speed: 1
      });
    }
    
    // Running back
    newPlayers.push({
      x: yardLine - 40,
      y: FIELD_HEIGHT / 2 + 20,
      team: 'home',
      role: 'RB',
      number: 22,
      speed: 4
    });
    
    // Wide receivers
    newPlayers.push({
      x: yardLine,
      y: FIELD_HEIGHT / 2 - 100,
      team: 'home',
      role: 'WR',
      number: 80,
      speed: 5
    });
    
    newPlayers.push({
      x: yardLine,
      y: FIELD_HEIGHT / 2 + 100,
      team: 'home',
      role: 'WR',
      number: 81,
      speed: 5
    });
    
    // Defense (away team)
    // Defensive line
    for (let i = 0; i < 4; i++) {
      newPlayers.push({
        x: yardLine + 15 + (i - 1.5) * 20,
        y: FIELD_HEIGHT / 2 + (i - 1.5) * 10,
        team: 'away',
        role: 'DL',
        number: 90 + i,
        speed: 2
      });
    }
    
    // Linebackers
    for (let i = 0; i < 3; i++) {
      newPlayers.push({
        x: yardLine + 35,
        y: FIELD_HEIGHT / 2 + (i - 1) * 40,
        team: 'away',
        role: 'LB',
        number: 50 + i,
        speed: 3
      });
    }
    
    // Defensive backs
    for (let i = 0; i < 4; i++) {
      newPlayers.push({
        x: yardLine + 60,
        y: FIELD_HEIGHT / 2 + (i - 1.5) * 60,
        team: 'away',
        role: 'DB',
        number: 20 + i,
        speed: 4
      });
    }
    
    setPlayers(newPlayers);
    const qb = newPlayers.find(p => p.role === 'QB');
    if (qb) setBallCarrier(qb);
  };

  // Handle play selection
  const selectPlay = (playId: string) => {
    setGameState(prev => ({ ...prev, selectedPlay: playId }));
    executePlay(playId);
  };

  // Execute the selected play
  const executePlay = (playId: string) => {
    const play = PLAYS.find(p => p.id === playId);
    if (!play) return;
    
    // Set player routes based on play
    setPlayers(prevPlayers => {
      return prevPlayers.map(player => {
        if (player.team === 'home') {
          switch (play.type) {
            case 'run':
              if (player.role === 'RB') {
                // Running back gets the ball
                return { ...player, hasBall: true, targetX: player.x + 200, targetY: FIELD_HEIGHT / 2 };
              }
              break;
            case 'pass':
              if (player.role === 'WR') {
                // Receivers run routes
                const route = play.id === 'pass-long' ? 300 : 150;
                return { ...player, targetX: player.x + route, targetY: player.y };
              }
              break;
          }
        }
        return player;
      });
    });
    
    if (soundEnabled) playSound('whistle');
  };

  // Handle player movement
  const movePlayer = (direction: 'up' | 'down' | 'left' | 'right') => {
    if (gameState.status !== 'playing' || !ballCarrier) return;
    
    setPlayers(prevPlayers => {
      return prevPlayers.map(player => {
        if (player.hasBall) {
          let newX = player.x;
          let newY = player.y;
          const speed = turboEnabled ? player.speed * 1.5 : player.speed;
          
          switch (direction) {
            case 'up':
              newY = Math.max(20, player.y - speed * 2);
              break;
            case 'down':
              newY = Math.min(FIELD_HEIGHT - 20, player.y + speed * 2);
              break;
            case 'left':
              newX = Math.max(10, player.x - speed * 2);
              break;
            case 'right':
              newX = Math.min(FIELD_WIDTH - 10, player.x + speed * 2);
              
              // Check for touchdown
              if (newX >= 90 * YARD_WIDTH) {
                handleTouchdown();
              }
              break;
          }
          
          setBallCarrier({ ...player, x: newX, y: newY });
          return { ...player, x: newX, y: newY };
        }
        return player;
      });
    });
  };

  // Handle touchdown
  const handleTouchdown = () => {
    setGameState(prev => ({
      ...prev,
      status: 'touchdown',
      homeScore: prev.homeScore + 7
    }));
    setComboCount(prev => prev + 1);
    if (soundEnabled) playSound('touchdown');
  };

  // Use turbo boost
  const useTurbo = () => {
    if (powerMeter >= 50) {
      setTurboEnabled(true);
      setPowerMeter(0);
      setTimeout(() => setTurboEnabled(false), 2000);
    }
  };

  // Draw the game
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, FIELD_WIDTH, FIELD_HEIGHT);
    
    // Draw gradient field
    const gradient = ctx.createLinearGradient(0, 0, 0, FIELD_HEIGHT);
    gradient.addColorStop(0, '#065F46');
    gradient.addColorStop(1, '#047857');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, FIELD_WIDTH, FIELD_HEIGHT);
    
    // Draw yard lines with glow effect
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 2;
    ctx.shadowBlur = 5;
    ctx.shadowColor = 'rgba(255, 255, 255, 0.5)';
    
    for (let i = 0; i <= 100; i += 10) {
      const x = i * YARD_WIDTH;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, FIELD_HEIGHT);
      ctx.stroke();
      
      // Draw yard numbers
      if (i > 0 && i < 100 && i % 10 === 0) {
        ctx.save();
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 20px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.shadowBlur = 10;
        ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
        const yardNumber = i <= 50 ? i : 100 - i;
        ctx.fillText(yardNumber.toString(), x, 30);
        ctx.fillText(yardNumber.toString(), x, FIELD_HEIGHT - 10);
        ctx.restore();
      }
    }
    
    ctx.shadowBlur = 0;
    
    // Draw end zones with team colors
    // Away end zone
    const awayGradient = ctx.createLinearGradient(0, 0, 10 * YARD_WIDTH, 0);
    awayGradient.addColorStop(0, TEAMS.away.color);
    awayGradient.addColorStop(1, `${TEAMS.away.color}99`);
    ctx.fillStyle = awayGradient;
    ctx.fillRect(0, 0, 10 * YARD_WIDTH, FIELD_HEIGHT);
    
    // Home end zone
    const homeGradient = ctx.createLinearGradient(90 * YARD_WIDTH, 0, FIELD_WIDTH, 0);
    homeGradient.addColorStop(0, `${TEAMS.home.color}99`);
    homeGradient.addColorStop(1, TEAMS.home.color);
    ctx.fillStyle = homeGradient;
    ctx.fillRect(90 * YARD_WIDTH, 0, 10 * YARD_WIDTH, FIELD_HEIGHT);
    
    // Draw end zone text
    ctx.save();
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 28px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.shadowBlur = 15;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
    
    // Away team name
    ctx.save();
    ctx.translate(5 * YARD_WIDTH, FIELD_HEIGHT / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(TEAMS.away.name, 0, 0);
    ctx.restore();
    
    // Home team name
    ctx.save();
    ctx.translate(95 * YARD_WIDTH, FIELD_HEIGHT / 2);
    ctx.rotate(Math.PI / 2);
    ctx.fillText(TEAMS.home.name, 0, 0);
    ctx.restore();
    
    ctx.restore();
    
    // Draw players with better graphics
    players.forEach((player, index) => {
      const isHomeTeam = player.team === 'home';
      const teamColor = isHomeTeam ? TEAMS.home.color : TEAMS.away.color;
      const secondaryColor = isHomeTeam ? TEAMS.home.secondary : TEAMS.away.secondary;
      
      // Player shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.beginPath();
      ctx.ellipse(player.x, player.y + PLAYER_SIZE / 2 + 2, PLAYER_SIZE / 2, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      
      // Player body (circle)
      ctx.fillStyle = teamColor;
      ctx.strokeStyle = secondaryColor;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(player.x, player.y, PLAYER_SIZE / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      
      // Player number
      ctx.fillStyle = secondaryColor;
      ctx.font = 'bold 10px "Courier New", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(player.number.toString(), player.x, player.y);
      
      // Ball indicator
      if (player.hasBall) {
        // Pulsing ring effect
        const pulseSize = PLAYER_SIZE + 10 + Math.sin(animationTime * 0.005) * 5;
        ctx.strokeStyle = '#FCD34D';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(player.x, player.y, pulseSize / 2, 0, Math.PI * 2);
        ctx.stroke();
        
        // Draw football
        ctx.fillStyle = '#8B4513';
        ctx.beginPath();
        ctx.ellipse(player.x + PLAYER_SIZE / 2, player.y - PLAYER_SIZE / 2, BALL_SIZE / 2, BALL_SIZE / 3, -Math.PI / 4, 0, Math.PI * 2);
        ctx.fill();
        
        // Star above ball carrier
        ctx.fillStyle = '#FCD34D';
        ctx.font = '16px sans-serif';
        ctx.fillText('⭐', player.x, player.y - PLAYER_SIZE);
      }
      
      // Turbo effect
      if (player.hasBall && turboEnabled) {
        ctx.strokeStyle = '#60A5FA';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.arc(player.x, player.y, PLAYER_SIZE, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    });
    
    // Draw line of scrimmage
    const scrimmageX = gameState.ballPosition * YARD_WIDTH;
    ctx.strokeStyle = '#FCD34D';
    ctx.lineWidth = 3;
    ctx.setLineDash([10, 10]);
    ctx.beginPath();
    ctx.moveTo(scrimmageX, 0);
    ctx.lineTo(scrimmageX, FIELD_HEIGHT);
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Draw first down marker
    const firstDownX = Math.min(100, gameState.ballPosition + gameState.yardsToGo) * YARD_WIDTH;
    ctx.strokeStyle = '#FBBF24';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(firstDownX, 0);
    ctx.lineTo(firstDownX, FIELD_HEIGHT);
    ctx.stroke();
    
  }, [players, gameState, animationTime, turboEnabled]);

  // Animation loop
  useEffect(() => {
    const gameLoop = () => {
      setAnimationTime(prev => prev + 1);
      
      if (gameState.status === 'playing') {
        // Update game timer
        if (animationTime % 60 === 0) { // Every second
          setGameState(prev => {
            const newTime = prev.timeRemaining - 1;
            if (newTime <= 0) {
              if (prev.quarter >= 4) {
                return { ...prev, status: 'gameover', timeRemaining: 0 };
              }
              return { ...prev, quarter: prev.quarter + 1, timeRemaining: 180 };
            }
            return { ...prev, timeRemaining: newTime };
          });
        }
        
        // Build power meter
        setPowerMeter(prev => Math.min(100, prev + 0.5));
        
        // Basic AI movement
        setPlayers(prevPlayers => {
          return prevPlayers.map(player => {
            if (player.team === 'away' && ballCarrier) {
              // Defense chases ball carrier
              const dx = ballCarrier.x - player.x;
              const dy = ballCarrier.y - player.y;
              const distance = Math.sqrt(dx * dx + dy * dy);
              
              if (distance > 10) {
                const moveX = (dx / distance) * player.speed;
                const moveY = (dy / distance) * player.speed;
                
                return {
                  ...player,
                  x: player.x + moveX,
                  y: player.y + moveY
                };
              }
              
              // Check for tackle
              if (distance < PLAYER_SIZE && Math.random() > 0.95) {
                // Tackle!
                handleTackle();
              }
            }
            
            // Move players to their targets
            if (player.targetX !== undefined && player.targetY !== undefined) {
              const dx = player.targetX - player.x;
              const dy = player.targetY - player.y;
              const distance = Math.sqrt(dx * dx + dy * dy);
              
              if (distance > 5) {
                const moveX = (dx / distance) * player.speed;
                const moveY = (dy / distance) * player.speed;
                
                return {
                  ...player,
                  x: player.x + moveX,
                  y: player.y + moveY
                };
              }
            }
            
            return player;
          });
        });
      }
      
      draw();
      animationFrameId.current = requestAnimationFrame(gameLoop);
    };
    
    gameLoop();
    
    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [gameState.status, draw, animationTime, ballCarrier]);

  // Handle tackle
  const handleTackle = () => {
    const yardGained = Math.floor((ballCarrier?.x || 0) / YARD_WIDTH) - gameState.ballPosition;
    
    setGameState(prev => {
      const newDown = yardGained >= prev.yardsToGo ? 1 : prev.down + 1;
      const newYardsToGo = yardGained >= prev.yardsToGo ? 10 : prev.yardsToGo - yardGained;
      const newBallPosition = Math.floor((ballCarrier?.x || 0) / YARD_WIDTH);
      
      if (newDown > 4) {
        // Turnover on downs
        return {
          ...prev,
          possession: prev.possession === 'home' ? 'away' : 'home',
          down: 1,
          yardsToGo: 10,
          ballPosition: 100 - newBallPosition
        };
      }
      
      return {
        ...prev,
        down: newDown,
        yardsToGo: newYardsToGo,
        ballPosition: newBallPosition
      };
    });
    
    setupField(); // Reset formation
  };

  // Handle keyboard controls
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (gameState.status !== 'playing') return;
      
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
          movePlayer('up');
          break;
        case 'ArrowDown':
        case 's':
          movePlayer('down');
          break;
        case 'ArrowLeft':
        case 'a':
          movePlayer('left');
          break;
        case 'ArrowRight':
        case 'd':
          movePlayer('right');
          break;
        case ' ':
          useTurbo();
          break;
        case 'p':
          setGameState(prev => ({
            ...prev,
            status: prev.status === 'playing' ? 'paused' : 'playing'
          }));
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [gameState.status, movePlayer]);

  // Play sound effects
  const playSound = (type: string) => {
    // Placeholder for actual sound implementation
    console.log(`Playing sound: ${type}`);
  };

  // Format time
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-4">
      {/* Game Container */}
      <Card className="bg-gray-900 border-gray-800 overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-blue-900 to-purple-900 border-b border-gray-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <CardTitle className="text-2xl font-bold text-white flex items-center gap-2">
                <Gamepad2 className="w-6 h-6" />
                HALTECMO BOWL
              </CardTitle>
              <Badge variant="outline" className="bg-yellow-500/20 text-yellow-300 border-yellow-500/50">
                RETRO EDITION
              </Badge>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="text-white hover:bg-white/10"
              >
                {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowTutorial(!showTutorial)}
                className="text-white hover:bg-white/10"
              >
                <Info className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          {/* Game Status Bar */}
          {gameState.status !== 'menu' && (
            <div className="bg-gray-800 px-4 py-3 border-b border-gray-700">
              <div className="grid grid-cols-5 gap-4 text-center">
                {/* Home Score */}
                <div>
                  <p className="text-xs text-gray-400 mb-1">{TEAMS.home.emoji} HOME</p>
                  <p className="text-2xl font-bold text-blue-400">{gameState.homeScore}</p>
                </div>
                
                {/* Game Info */}
                <div>
                  <p className="text-xs text-gray-400 mb-1">QUARTER</p>
                  <p className="text-lg font-bold text-white">Q{gameState.quarter}</p>
                </div>
                
                <div>
                  <p className="text-xs text-gray-400 mb-1">TIME</p>
                  <p className="text-lg font-bold text-yellow-400">{formatTime(gameState.timeRemaining)}</p>
                </div>
                
                <div>
                  <p className="text-xs text-gray-400 mb-1">DOWN</p>
                  <p className="text-lg font-bold text-white">{gameState.down} & {gameState.yardsToGo}</p>
                </div>
                
                {/* Away Score */}
                <div>
                  <p className="text-xs text-gray-400 mb-1">AWAY {TEAMS.away.emoji}</p>
                  <p className="text-2xl font-bold text-red-400">{gameState.awayScore}</p>
                </div>
              </div>
              
              {/* Power Meter */}
              <div className="mt-3">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-gray-400">TURBO POWER</span>
                  <span className="text-white font-bold">{Math.floor(powerMeter)}%</span>
                </div>
                <Progress 
                  value={powerMeter} 
                  className="h-2 bg-gray-700"
                />
              </div>
            </div>
          )}
          
          {/* Game Canvas or Menu */}
          {gameState.status === 'menu' ? (
            <div className="bg-gradient-to-b from-gray-800 to-gray-900 p-12 text-center">
              <div className="max-w-md mx-auto space-y-6">
                <div>
                  <h1 className="text-4xl font-bold text-white mb-2" style={{ fontFamily: 'monospace' }}>
                    🏈 HALTECMO BOWL 🏈
                  </h1>
                  <p className="text-gray-400">
                    Classic 8-bit Football Action - Reimagined!
                  </p>
                </div>
                
                <div className="space-y-3">
                  <Button
                    size="lg"
                    onClick={startNewGame}
                    className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600"
                  >
                    <Play className="mr-2 w-5 h-5" />
                    Start New Game
                  </Button>
                  
                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      variant={gameState.difficulty === 'easy' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setGameState(prev => ({ ...prev, difficulty: 'easy' }))}
                    >
                      Easy
                    </Button>
                    <Button
                      variant={gameState.difficulty === 'normal' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setGameState(prev => ({ ...prev, difficulty: 'normal' }))}
                    >
                      Normal
                    </Button>
                    <Button
                      variant={gameState.difficulty === 'hard' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setGameState(prev => ({ ...prev, difficulty: 'hard' }))}
                    >
                      Hard
                    </Button>
                  </div>
                </div>
                
                <div className="bg-gray-800 rounded-lg p-4 text-left space-y-2">
                  <h3 className="font-bold text-white mb-2 flex items-center gap-2">
                    <Gamepad2 className="w-4 h-4" />
                    Quick Controls
                  </h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-300">
                      <kbd className="px-2 py-1 bg-gray-700 rounded text-xs">↑↓←→</kbd>
                      <span>Move</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-300">
                      <kbd className="px-2 py-1 bg-gray-700 rounded text-xs">SPACE</kbd>
                      <span>Turbo</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-300">
                      <kbd className="px-2 py-1 bg-gray-700 rounded text-xs">1-6</kbd>
                      <span>Select Play</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-300">
                      <kbd className="px-2 py-1 bg-gray-700 rounded text-xs">P</kbd>
                      <span>Pause</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Game Field */}
              <div className="relative bg-black">
                <canvas
                  ref={canvasRef}
                  width={FIELD_WIDTH}
                  height={FIELD_HEIGHT}
                  className="w-full h-auto"
                  style={{ imageRendering: 'auto' }}
                />
                
                {/* Game Overlays */}
                {gameState.status === 'paused' && (
                  <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
                    <div className="text-center">
                      <h2 className="text-4xl font-bold text-white mb-4">PAUSED</h2>
                      <Button onClick={() => setGameState(prev => ({ ...prev, status: 'playing' }))}>
                        Resume Game
                      </Button>
                    </div>
                  </div>
                )}
                
                {gameState.status === 'touchdown' && (
                  <div className="absolute inset-0 bg-black/90 flex items-center justify-center">
                    <div className="text-center animate-bounce">
                      <Trophy className="w-20 h-20 text-yellow-500 mx-auto mb-4" />
                      <h2 className="text-5xl font-bold text-yellow-500 mb-2">TOUCHDOWN!</h2>
                      <p className="text-2xl text-white mb-4">{TEAMS.home.name} SCORES!</p>
                      <Button 
                        onClick={() => {
                          setGameState(prev => ({ ...prev, status: 'playing', down: 1, yardsToGo: 10, ballPosition: 25 }));
                          setupField();
                        }}
                        className="bg-yellow-500 hover:bg-yellow-600 text-black"
                      >
                        Continue
                      </Button>
                    </div>
                  </div>
                )}
                
                {gameState.status === 'gameover' && (
                  <div className="absolute inset-0 bg-black/95 flex items-center justify-center">
                    <div className="text-center">
                      <h2 className="text-5xl font-bold text-white mb-4">GAME OVER</h2>
                      <div className="mb-6">
                        <p className="text-3xl text-white mb-2">
                          {gameState.homeScore > gameState.awayScore ? '🏆 YOU WIN! 🏆' : '😔 YOU LOSE'}
                        </p>
                        <p className="text-xl text-gray-400">
                          Final Score: {gameState.homeScore} - {gameState.awayScore}
                        </p>
                      </div>
                      <Button 
                        onClick={startNewGame}
                        size="lg"
                        className="bg-gradient-to-r from-green-500 to-blue-500"
                      >
                        Play Again
                      </Button>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Play Selection */}
              {gameState.status === 'playing' && (
                <div className="bg-gray-800 p-4 border-t border-gray-700">
                  <div className="mb-2">
                    <p className="text-xs text-gray-400 mb-1">SELECT YOUR PLAY:</p>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {PLAYS.map((play, index) => (
                      <Button
                        key={play.id}
                        variant={gameState.selectedPlay === play.id ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => selectPlay(play.id)}
                        className="flex flex-col items-center py-3"
                      >
                        <span className="text-2xl mb-1">{play.icon}</span>
                        <span className="text-xs font-bold">{play.name}</span>
                        <span className="text-xs opacity-75">{index + 1}</span>
                      </Button>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Control Instructions */}
              {gameState.status === 'playing' && showTutorial && (
                <div className="bg-blue-900/20 border-t border-blue-500/30 p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <h4 className="font-bold text-white flex items-center gap-2">
                        <Info className="w-4 h-4" />
                        How to Play:
                      </h4>
                      <ul className="text-sm text-gray-300 space-y-1">
                        <li>• Use arrow keys or WASD to move your player</li>
                        <li>• Press number keys (1-6) or click to select plays</li>
                        <li>• Press SPACE for turbo boost when meter is charged</li>
                        <li>• Score touchdowns by reaching the opposite end zone</li>
                        <li>• Avoid defenders - they will tackle you!</li>
                      </ul>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowTutorial(false)}
                      className="text-gray-400 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
      
      {/* Mobile Controls */}
      <Card className="bg-gray-900 border-gray-800 lg:hidden">
        <CardContent className="p-4">
          <div className="grid grid-cols-3 gap-4">
            {/* D-Pad */}
            <div className="col-span-2">
              <p className="text-xs text-gray-400 mb-2 text-center">MOVE</p>
              <div className="grid grid-cols-3 gap-1 max-w-[150px] mx-auto">
                <div />
                <Button
                  variant="outline"
                  size="icon"
                  onTouchStart={() => movePlayer('up')}
                  className="bg-gray-800 border-gray-700"
                >
                  <ChevronUp className="w-6 h-6" />
                </Button>
                <div />
                <Button
                  variant="outline"
                  size="icon"
                  onTouchStart={() => movePlayer('left')}
                  className="bg-gray-800 border-gray-700"
                >
                  <ChevronLeft className="w-6 h-6" />
                </Button>
                <div className="bg-gray-700 rounded flex items-center justify-center">
                  <Target className="w-4 h-4 text-gray-500" />
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onTouchStart={() => movePlayer('right')}
                  className="bg-gray-800 border-gray-700"
                >
                  <ChevronRight className="w-6 h-6" />
                </Button>
                <div />
                <Button
                  variant="outline"
                  size="icon"
                  onTouchStart={() => movePlayer('down')}
                  className="bg-gray-800 border-gray-700"
                >
                  <ChevronDown className="w-6 h-6" />
                </Button>
                <div />
              </div>
            </div>
            
            {/* Action Buttons */}
            <div>
              <p className="text-xs text-gray-400 mb-2 text-center">ACTIONS</p>
              <div className="space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={useTurbo}
                  disabled={powerMeter < 50}
                  className="w-full bg-gray-800 border-gray-700"
                >
                  <Zap className="w-4 h-4 mr-1" />
                  Turbo
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setGameState(prev => ({
                    ...prev,
                    status: prev.status === 'playing' ? 'paused' : 'playing'
                  }))}
                  className="w-full bg-gray-800 border-gray-700"
                >
                  {gameState.status === 'playing' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}