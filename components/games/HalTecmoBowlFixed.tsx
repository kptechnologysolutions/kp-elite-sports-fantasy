'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Play, Pause, Trophy, Zap, Volume2, VolumeX,
  Info, Gamepad2, Target, X
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Game constants
const FIELD_WIDTH = 800;
const FIELD_HEIGHT = 400;
const YARD_WIDTH = FIELD_WIDTH / 100;
const PLAYER_SIZE = 20;

// Team configuration
const TEAMS = {
  home: {
    name: 'HAL BOMBERS',
    color: '#3B82F6',
    secondary: '#FFFFFF',
    emoji: '⚡'
  },
  away: {
    name: 'CPU RAIDERS',
    color: '#EF4444',
    secondary: '#FEF3C7',
    emoji: '🔥'
  }
};

// Simplified play types
const PLAYS = [
  { id: 'run', name: 'RUN', icon: '🏃', description: 'Power run' },
  { id: 'pass', name: 'PASS', icon: '🏈', description: 'Quick pass' },
  { id: 'bomb', name: 'BOMB', icon: '💣', description: 'Long pass' }
];

export function HalTecmoBowlFixed() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const gameLoopRef = useRef<number>();
  
  const [gameState, setGameState] = useState({
    status: 'menu', // menu, playing, touchdown, gameover
    quarter: 1,
    timeRemaining: 60,
    homeScore: 0,
    awayScore: 0,
    ballX: 200,
    ballY: 200,
    ballVX: 0,
    ballVY: 0
  });
  
  const [selectedPlay, setSelectedPlay] = useState<string | null>(null);
  const [showTutorial, setShowTutorial] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);

  // Start new game
  const startGame = () => {
    setGameState({
      status: 'playing',
      quarter: 1,
      timeRemaining: 60,
      homeScore: 0,
      awayScore: 0,
      ballX: 200,
      ballY: 200,
      ballVX: 0,
      ballVY: 0
    });
    animationRef.current = 0;
  };

  // Handle play selection
  const selectPlay = (playId: string) => {
    setSelectedPlay(playId);
    // Give ball velocity based on play
    if (playId === 'run') {
      setGameState(prev => ({ ...prev, ballVX: 3, ballVY: 0 }));
    } else if (playId === 'pass') {
      setGameState(prev => ({ ...prev, ballVX: 5, ballVY: -2 }));
    } else if (playId === 'bomb') {
      setGameState(prev => ({ ...prev, ballVX: 8, ballVY: -4 }));
    }
  };

  // Handle keyboard controls
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (gameState.status !== 'playing') return;
      
      const speed = 5;
      switch (e.key) {
        case 'ArrowUp':
          setGameState(prev => ({ ...prev, ballY: Math.max(20, prev.ballY - speed) }));
          break;
        case 'ArrowDown':
          setGameState(prev => ({ ...prev, ballY: Math.min(FIELD_HEIGHT - 20, prev.ballY + speed) }));
          break;
        case 'ArrowLeft':
          setGameState(prev => ({ ...prev, ballX: Math.max(20, prev.ballX - speed) }));
          break;
        case 'ArrowRight':
          setGameState(prev => ({ 
            ...prev, 
            ballX: Math.min(FIELD_WIDTH - 20, prev.ballX + speed)
          }));
          // Check for touchdown
          if (gameState.ballX > 720) {
            setGameState(prev => ({ 
              ...prev, 
              status: 'touchdown',
              homeScore: prev.homeScore + 7
            }));
          }
          break;
        case ' ':
          // Turbo boost
          setGameState(prev => ({ ...prev, ballVX: prev.ballVX * 1.5 }));
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [gameState.status, gameState.ballX]);

  // Draw game
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, FIELD_WIDTH, FIELD_HEIGHT);
    
    // Draw animated field background (retro style)
    const gradient = ctx.createLinearGradient(0, 0, 0, FIELD_HEIGHT);
    gradient.addColorStop(0, '#0F4C2C');
    gradient.addColorStop(0.5, '#166534');
    gradient.addColorStop(1, '#0F4C2C');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, FIELD_WIDTH, FIELD_HEIGHT);
    
    // Draw animated grid pattern
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    for (let i = 0; i < FIELD_WIDTH; i += 40) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, FIELD_HEIGHT);
      ctx.stroke();
    }
    for (let i = 0; i < FIELD_HEIGHT; i += 40) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(FIELD_WIDTH, i);
      ctx.stroke();
    }
    
    // Draw yard lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.lineWidth = 3;
    for (let i = 0; i <= 100; i += 10) {
      const x = i * YARD_WIDTH;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, FIELD_HEIGHT);
      ctx.stroke();
      
      // Yard numbers (pixelated style)
      if (i > 0 && i < 100 && i % 10 === 0) {
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 24px monospace';
        ctx.textAlign = 'center';
        const yardNumber = i <= 50 ? i : 100 - i;
        ctx.fillText(yardNumber.toString(), x, 35);
        ctx.fillText(yardNumber.toString(), x, FIELD_HEIGHT - 15);
      }
    }
    
    // Draw end zones with pixel pattern
    ctx.fillStyle = TEAMS.away.color;
    ctx.globalAlpha = 0.8;
    ctx.fillRect(0, 0, 80, FIELD_HEIGHT);
    ctx.fillStyle = TEAMS.home.color;
    ctx.fillRect(720, 0, 80, FIELD_HEIGHT);
    ctx.globalAlpha = 1;
    
    // Draw end zone text (8-bit style)
    ctx.save();
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 32px monospace';
    ctx.textAlign = 'center';
    ctx.translate(40, FIELD_HEIGHT / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('CPU', 0, 0);
    ctx.restore();
    
    ctx.save();
    ctx.translate(760, FIELD_HEIGHT / 2);
    ctx.rotate(Math.PI / 2);
    ctx.fillText('HAL', 0, 0);
    ctx.restore();
    
    // Draw the ball with trail effect
    if (gameState.status === 'playing') {
      // Trail effect
      for (let i = 5; i > 0; i--) {
        ctx.fillStyle = `rgba(255, 255, 0, ${0.1 * i})`;
        ctx.beginPath();
        ctx.arc(
          gameState.ballX - (gameState.ballVX * i * 2), 
          gameState.ballY - (gameState.ballVY * i * 2), 
          PLAYER_SIZE / 2 + i, 
          0, 
          Math.PI * 2
        );
        ctx.fill();
      }
      
      // Ball shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.ellipse(gameState.ballX, gameState.ballY + 5, PLAYER_SIZE / 2, 5, 0, 0, Math.PI * 2);
      ctx.fill();
      
      // The ball (football shape)
      ctx.fillStyle = '#8B4513';
      ctx.beginPath();
      ctx.ellipse(gameState.ballX, gameState.ballY, PLAYER_SIZE / 2, PLAYER_SIZE / 3, 0, 0, Math.PI * 2);
      ctx.fill();
      
      // Ball stripe
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(gameState.ballX - PLAYER_SIZE / 3, gameState.ballY);
      ctx.lineTo(gameState.ballX + PLAYER_SIZE / 3, gameState.ballY);
      ctx.stroke();
      
      // Star effect around ball
      const time = animationRef.current * 0.05;
      ctx.strokeStyle = '#FFD700';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(gameState.ballX, gameState.ballY, PLAYER_SIZE + Math.sin(time) * 5, 0, Math.PI * 2);
      ctx.stroke();
    }
    
    // Draw scoreboard background effect
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, FIELD_WIDTH, 50);
    ctx.fillRect(0, FIELD_HEIGHT - 50, FIELD_WIDTH, 50);
    
  }, [gameState]);

  // Game loop
  useEffect(() => {
    let frameCount = 0;
    
    const gameLoop = () => {
      frameCount++;
      animationRef.current = frameCount;
      
      if (gameState.status === 'playing') {
        // Update timer every 60 frames (1 second at 60fps)
        if (frameCount % 60 === 0) {
          setGameState(prev => {
            const newTime = prev.timeRemaining - 1;
            if (newTime <= 0) {
              return { ...prev, status: 'gameover', timeRemaining: 0 };
            }
            return { ...prev, timeRemaining: newTime };
          });
        }
        
        // Update ball physics
        setGameState(prev => {
          let newX = prev.ballX + prev.ballVX;
          let newY = prev.ballY + prev.ballVY;
          
          // Boundaries
          if (newY < 20 || newY > FIELD_HEIGHT - 20) {
            newY = prev.ballY;
            return { ...prev, ballVY: -prev.ballVY * 0.8 };
          }
          
          // Friction
          const newVX = prev.ballVX * 0.98;
          const newVY = prev.ballVY * 0.98;
          
          // Check for touchdown
          if (newX > 720) {
            return { 
              ...prev, 
              status: 'touchdown',
              homeScore: prev.homeScore + 7,
              ballX: newX,
              ballY: newY
            };
          }
          
          return { 
            ...prev, 
            ballX: newX,
            ballY: newY,
            ballVX: newVX,
            ballVY: newVY
          };
        });
      }
      
      draw();
      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };
    
    if (gameState.status !== 'menu') {
      gameLoop();
    }
    
    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [gameState.status, draw]);

  // Draw menu
  useEffect(() => {
    if (gameState.status === 'menu') {
      draw();
    }
  }, [gameState.status, draw]);

  return (
    <div className="relative">
      {/* Retro TV Frame Effect */}
      <div className="absolute inset-0 pointer-events-none z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/20" />
        <div className="absolute inset-0 bg-gradient-to-t from-transparent via-transparent to-black/20" />
      </div>
      
      {/* Game Container */}
      <Card className="bg-black border-4 border-gray-700 overflow-hidden shadow-2xl">
        <CardHeader className="bg-gradient-to-r from-blue-600 via-purple-600 to-red-600 p-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-bold text-white flex items-center gap-2" 
                       style={{ fontFamily: 'monospace', textShadow: '2px 2px 0px rgba(0,0,0,0.5)' }}>
              <Gamepad2 className="w-6 h-6" />
              🏈 HALTECMO BOWL 🏈
            </CardTitle>
            
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="text-white hover:bg-white/20"
              >
                {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowTutorial(!showTutorial)}
                className="text-white hover:bg-white/20"
              >
                <Info className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-0 relative">
          {/* Game Status Bar */}
          {gameState.status !== 'menu' && (
            <div className="absolute top-0 left-0 right-0 z-20 bg-black/80 px-4 py-2">
              <div className="flex justify-between items-center text-white">
                <div className="flex items-center gap-4">
                  <span className="font-bold" style={{ fontFamily: 'monospace' }}>
                    {TEAMS.home.emoji} {gameState.homeScore}
                  </span>
                  <Badge className="bg-green-500">Q{gameState.quarter}</Badge>
                  <span style={{ fontFamily: 'monospace' }}>
                    {Math.floor(gameState.timeRemaining / 60)}:{(gameState.timeRemaining % 60).toString().padStart(2, '0')}
                  </span>
                  <span className="font-bold" style={{ fontFamily: 'monospace' }}>
                    {TEAMS.away.emoji} {gameState.awayScore}
                  </span>
                </div>
              </div>
            </div>
          )}
          
          {/* Canvas */}
          <div className="relative bg-black">
            <canvas
              ref={canvasRef}
              width={FIELD_WIDTH}
              height={FIELD_HEIGHT}
              className="w-full h-auto block"
              style={{ 
                imageRendering: 'pixelated',
                filter: 'contrast(1.1) saturate(1.2)'
              }}
            />
            
            {/* Game Overlays */}
            {gameState.status === 'menu' && (
              <div className="absolute inset-0 bg-black/90 flex items-center justify-center">
                <div className="text-center space-y-6 p-8">
                  <div className="space-y-2">
                    <h1 className="text-5xl font-bold text-yellow-400 animate-pulse" 
                        style={{ fontFamily: 'monospace', textShadow: '3px 3px 0px #000' }}>
                      HALTECMO BOWL
                    </h1>
                    <p className="text-green-400 text-xl" style={{ fontFamily: 'monospace' }}>
                      RETRO FOOTBALL ACTION
                    </p>
                  </div>
                  
                  <div className="space-y-3">
                    <Button
                      size="lg"
                      onClick={startGame}
                      className="w-64 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-bold"
                      style={{ fontFamily: 'monospace' }}
                    >
                      <Play className="mr-2 w-5 h-5" />
                      PRESS START
                    </Button>
                    
                    <div className="text-gray-400 text-sm space-y-1" style={{ fontFamily: 'monospace' }}>
                      <p>USE ARROW KEYS TO MOVE</p>
                      <p>SPACE FOR TURBO BOOST</p>
                      <p>REACH THE END ZONE!</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {gameState.status === 'touchdown' && (
              <div className="absolute inset-0 bg-black/90 flex items-center justify-center">
                <div className="text-center">
                  <Trophy className="w-24 h-24 text-yellow-500 mx-auto mb-4 animate-bounce" />
                  <h2 className="text-6xl font-bold text-yellow-400 mb-4" 
                      style={{ fontFamily: 'monospace', textShadow: '3px 3px 0px #000' }}>
                    TOUCHDOWN!
                  </h2>
                  <Button 
                    onClick={() => {
                      setGameState(prev => ({ 
                        ...prev, 
                        status: 'playing',
                        ballX: 200,
                        ballY: 200,
                        ballVX: 0,
                        ballVY: 0
                      }));
                    }}
                    className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold"
                    style={{ fontFamily: 'monospace' }}
                  >
                    CONTINUE
                  </Button>
                </div>
              </div>
            )}
            
            {gameState.status === 'gameover' && (
              <div className="absolute inset-0 bg-black/95 flex items-center justify-center">
                <div className="text-center">
                  <h2 className="text-6xl font-bold text-red-500 mb-4" 
                      style={{ fontFamily: 'monospace', textShadow: '3px 3px 0px #000' }}>
                    GAME OVER
                  </h2>
                  <p className="text-3xl text-white mb-6" style={{ fontFamily: 'monospace' }}>
                    FINAL: {gameState.homeScore} - {gameState.awayScore}
                  </p>
                  <Button 
                    onClick={startGame}
                    size="lg"
                    className="bg-gradient-to-r from-green-500 to-blue-500"
                    style={{ fontFamily: 'monospace' }}
                  >
                    PLAY AGAIN
                  </Button>
                </div>
              </div>
            )}
          </div>
          
          {/* Play Selection (simplified) */}
          {gameState.status === 'playing' && (
            <div className="absolute bottom-0 left-0 right-0 z-20 bg-black/90 p-3">
              <div className="flex justify-center gap-3">
                {PLAYS.map((play) => (
                  <Button
                    key={play.id}
                    variant={selectedPlay === play.id ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => selectPlay(play.id)}
                    className="flex items-center gap-2"
                    style={{ fontFamily: 'monospace' }}
                  >
                    <span className="text-xl">{play.icon}</span>
                    {play.name}
                  </Button>
                ))}
              </div>
            </div>
          )}
          
          {/* Tutorial */}
          {showTutorial && (
            <div className="absolute top-16 left-4 z-20 bg-black/90 p-4 rounded-lg max-w-xs">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-bold text-white" style={{ fontFamily: 'monospace' }}>CONTROLS:</h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowTutorial(false)}
                  className="text-white hover:bg-white/20 -mt-2 -mr-2"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
              <div className="text-sm space-y-1 text-gray-300" style={{ fontFamily: 'monospace' }}>
                <p>↑↓←→ = MOVE</p>
                <p>SPACE = TURBO</p>
                <p>1-3 = SELECT PLAY</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* CRT Effect Overlay */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0" style={{
          background: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.15), rgba(0,0,0,0.15) 1px, transparent 1px, transparent 2px)',
          animation: 'scanlines 8s linear infinite'
        }} />
      </div>
      
      <style jsx>{`
        @keyframes scanlines {
          0% { transform: translateY(0); }
          100% { transform: translateY(10px); }
        }
      `}</style>
    </div>
  );
}