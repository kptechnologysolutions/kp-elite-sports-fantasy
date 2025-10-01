'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Play, Trophy, Volume2, VolumeX, Info, Gamepad2, 
  ArrowUp, ArrowDown, ArrowLeft, ArrowRight
} from 'lucide-react';

// Game constants
const FIELD_WIDTH = 900;
const FIELD_HEIGHT = 500;
const YARD_WIDTH = FIELD_WIDTH / 120; // 100 yards + endzones
const PLAYER_SIZE = 24;
const BALL_SIZE = 12;

// Team configuration
const TEAMS = {
  home: {
    name: 'HAL BOMBERS',
    color: '#00FFFF',
    secondary: '#0088FF',
    helmet: '⚡',
    city: 'GRID CITY'
  },
  away: {
    name: 'CPU RAIDERS', 
    color: '#FF00FF',
    secondary: '#FF0088',
    helmet: '🔥',
    city: 'DIGITAL DOME'
  }
};

// Play types - classic Tecmo Bowl style
const PLAYS = [
  { id: 1, name: 'RUN 1', type: 'run', formation: '▶ ◀', speed: 3 },
  { id: 2, name: 'RUN 2', type: 'run', formation: '▲ ▼', speed: 4 },
  { id: 3, name: 'PASS 1', type: 'pass', formation: '◆ ◇', speed: 6 },
  { id: 4, name: 'PASS 2', type: 'pass', formation: '□ ■', speed: 7 }
];

interface GameState {
  status: 'menu' | 'playing' | 'touchdown' | 'paused' | 'gameover';
  quarter: number;
  time: string;
  down: number;
  yardsToGo: number;
  fieldPosition: number;
  homeScore: number;
  awayScore: number;
  possession: 'home' | 'away';
  playerX: number;
  playerY: number;
  ballCarrier: { x: number; y: number; team: string } | null;
  defenders: { x: number; y: number; vx: number; vy: number }[];
  receivers: { x: number; y: number; vx: number; vy: number; isTarget: boolean }[];
  ball: { x: number; y: number; vx: number; vy: number; inAir: boolean; targetX?: number; targetY?: number } | null;
  selectedPlay: number | null;
  lastScore: string;
  animations: { type: string; x: number; y: number; frame: number }[];
}

export function HalTecmoBowlEnhanced() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>(0);
  const keysPressed = useRef<Set<string>>(new Set());
  
  const [gameState, setGameState] = useState<GameState>({
    status: 'menu',
    quarter: 1,
    time: '15:00',
    down: 1,
    yardsToGo: 10,
    fieldPosition: 20,
    homeScore: 0,
    awayScore: 0,
    possession: 'home',
    playerX: 150,
    playerY: FIELD_HEIGHT / 2,
    ballCarrier: null,
    defenders: [],
    receivers: [],
    ball: null,
    selectedPlay: null,
    lastScore: '',
    animations: []
  });
  
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showInstructions, setShowInstructions] = useState(false);
  const [stadiumLights, setStadiumLights] = useState(true);

  // Play 8-bit sound effect
  const playSound = (type: string) => {
    if (!soundEnabled) return;
    
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    switch(type) {
      case 'touchdown':
        oscillator.frequency.value = 523.25; // C5
        oscillator.type = 'square';
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
        break;
      case 'tackle':
        oscillator.frequency.value = 100;
        oscillator.type = 'sawtooth';
        gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.1);
        break;
      case 'select':
        oscillator.frequency.value = 440;
        oscillator.type = 'sine';
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.05);
        break;
    }
  };

  // Initialize defenders and receivers
  const spawnDefenders = () => {
    const defenders = [];
    for (let i = 0; i < 5; i++) {
      defenders.push({
        x: 400 + Math.random() * 200,
        y: 100 + i * 60,
        vx: -1 - Math.random(),
        vy: (Math.random() - 0.5) * 0.5
      });
    }
    setGameState(prev => ({ ...prev, defenders }));
  };

  const spawnReceivers = () => {
    const receivers = [];
    // Create 2 receivers for pass plays
    receivers.push({
      x: 200,
      y: FIELD_HEIGHT / 2 - 50,
      vx: 3,
      vy: -1,
      isTarget: false
    });
    receivers.push({
      x: 200,
      y: FIELD_HEIGHT / 2 + 50,
      vx: 3,
      vy: 1,
      isTarget: false
    });
    setGameState(prev => ({ ...prev, receivers }));
  };

  // Start new game
  const startGame = () => {
    playSound('select');
    spawnDefenders();
    setGameState(prev => ({
      ...prev,
      status: 'playing',
      quarter: 1,
      time: '15:00',
      down: 1,
      yardsToGo: 10,
      fieldPosition: 20,
      homeScore: 0,
      awayScore: 0,
      possession: 'home',
      playerX: 150,
      playerY: FIELD_HEIGHT / 2,
      selectedPlay: null,
      ballCarrier: { x: 150, y: FIELD_HEIGHT / 2, team: 'home' }
    }));
  };

  // Select and execute play
  const selectPlay = (playId: number) => {
    playSound('select');
    setGameState(prev => ({ ...prev, selectedPlay: playId }));
    
    // Auto-execute play after selection
    setTimeout(() => {
      const play = PLAYS.find(p => p.id === playId);
      if (play) {
        if (play.type === 'pass') {
          // For pass plays, spawn receivers
          spawnReceivers();
        }
        setGameState(prev => ({
          ...prev,
          ballCarrier: {
            x: prev.playerX,
            y: prev.playerY,
            team: prev.possession
          }
        }));
      }
    }, 500);
  };

  // Throw the ball to a receiver
  const throwBall = () => {
    if (gameState.status !== 'playing' || !gameState.ballCarrier || gameState.ball?.inAir) return;
    
    // Find closest receiver
    let closestReceiver = null;
    let minDistance = Infinity;
    
    gameState.receivers.forEach(receiver => {
      const dist = Math.sqrt(
        Math.pow(receiver.x - gameState.playerX, 2) + 
        Math.pow(receiver.y - gameState.playerY, 2)
      );
      if (dist < minDistance) {
        minDistance = dist;
        closestReceiver = receiver;
      }
    });
    
    if (closestReceiver) {
      playSound('select');
      // Create ball in air
      setGameState(prev => ({
        ...prev,
        ball: {
          x: prev.playerX,
          y: prev.playerY,
          vx: (closestReceiver.x - prev.playerX) / 20,
          vy: (closestReceiver.y - prev.playerY) / 20,
          inAir: true,
          targetX: closestReceiver.x,
          targetY: closestReceiver.y
        },
        ballCarrier: null // Remove ball from QB
      }));
    }
  };

  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.current.add(e.key);
      
      // Play selection with number keys
      if (gameState.status === 'playing' && !gameState.selectedPlay) {
        const num = parseInt(e.key);
        if (num >= 1 && num <= 4) {
          selectPlay(num);
        }
      }
      
      // Space bar - throw ball if in pass play, otherwise pause
      if (e.key === ' ') {
        e.preventDefault();
        const selectedPlay = gameState.selectedPlay ? PLAYS.find(p => p.id === gameState.selectedPlay) : null;
        
        if (gameState.status === 'playing' && selectedPlay?.type === 'pass' && gameState.ballCarrier && !gameState.ball?.inAir) {
          throwBall();
        } else if (gameState.status === 'playing' && !gameState.ballCarrier) {
          setGameState(prev => ({ ...prev, status: 'paused' }));
        } else if (gameState.status === 'paused') {
          setGameState(prev => ({ ...prev, status: 'playing' }));
        }
      }
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current.delete(e.key);
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameState.status, gameState.selectedPlay]);

  // Game loop
  useEffect(() => {
    if (gameState.status !== 'playing') return;
    
    const gameLoop = () => {
      // Handle player movement
      const speed = 4;
      let { playerX, playerY } = gameState;
      
      if (keysPressed.current.has('ArrowUp')) playerY = Math.max(30, playerY - speed);
      if (keysPressed.current.has('ArrowDown')) playerY = Math.min(FIELD_HEIGHT - 30, playerY + speed);
      if (keysPressed.current.has('ArrowLeft')) playerX = Math.max(30, playerX - speed);
      if (keysPressed.current.has('ArrowRight')) playerX = Math.min(FIELD_WIDTH - 30, playerX + speed);
      
      // Update receivers
      const updatedReceivers = gameState.receivers.map(rec => {
        // Run routes
        let newX = rec.x + rec.vx;
        let newY = rec.y + rec.vy;
        
        // Change direction at certain points for route running
        if (newX > 400) {
          rec.vx = 0;
          rec.vy = rec.y < FIELD_HEIGHT / 2 ? 2 : -2;
        }
        
        return {
          ...rec,
          x: Math.max(0, Math.min(FIELD_WIDTH, newX)),
          y: Math.max(0, Math.min(FIELD_HEIGHT, newY))
        };
      });
      
      // Update ball if in air
      let updatedBall = gameState.ball;
      if (gameState.ball?.inAir) {
        updatedBall = {
          ...gameState.ball,
          x: gameState.ball.x + gameState.ball.vx,
          y: gameState.ball.y + gameState.ball.vy
        };
        
        // Check if ball reached target
        if (gameState.ball.targetX && gameState.ball.targetY) {
          const distToTarget = Math.sqrt(
            Math.pow(updatedBall.x - gameState.ball.targetX, 2) + 
            Math.pow(updatedBall.y - gameState.ball.targetY, 2)
          );
          
          if (distToTarget < 20) {
            // Catch the ball
            const receiver = updatedReceivers.find(r => 
              Math.sqrt(Math.pow(r.x - updatedBall.x, 2) + Math.pow(r.y - updatedBall.y, 2)) < 30
            );
            
            if (receiver) {
              playSound('select');
              playerX = receiver.x;
              playerY = receiver.y;
              setGameState(prev => ({
                ...prev,
                ballCarrier: { x: receiver.x, y: receiver.y, team: prev.possession },
                ball: null,
                receivers: [] // Clear receivers after catch
              }));
            } else {
              // Incomplete pass
              updatedBall = null;
              setGameState(prev => ({
                ...prev,
                ball: null,
                ballCarrier: null,
                down: prev.down + 1,
                receivers: []
              }));
            }
          }
        }
      }
      
      // Update defenders
      const updatedDefenders = gameState.defenders.map(def => {
        let newX = def.x + def.vx;
        let newY = def.y + def.vy;
        
        // Chase the ball carrier
        if (gameState.ballCarrier) {
          const targetX = gameState.ballCarrier.x;
          const targetY = gameState.ballCarrier.y;
          const dx = targetX - def.x;
          const dy = targetY - def.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          if (dist > 0) {
            def.vx = (dx / dist) * 2;
            def.vy = (dy / dist) * 2;
          }
          
          // Check for tackle
          if (dist < PLAYER_SIZE) {
            playSound('tackle');
            setGameState(prev => ({
              ...prev,
              ballCarrier: null,
              selectedPlay: null,
              down: prev.down + 1,
              receivers: [],
              ball: null,
              animations: [...prev.animations, {
                type: 'tackle',
                x: targetX,
                y: targetY,
                frame: 0
              }]
            }));
            spawnDefenders();
          }
        }
        
        return {
          ...def,
          x: Math.max(0, Math.min(FIELD_WIDTH, newX)),
          y: Math.max(0, Math.min(FIELD_HEIGHT, newY))
        };
      });
      
      // Check for touchdown
      if (playerX > FIELD_WIDTH - 100) {
        playSound('touchdown');
        setGameState(prev => ({
          ...prev,
          status: 'touchdown',
          homeScore: prev.possession === 'home' ? prev.homeScore + 7 : prev.homeScore,
          awayScore: prev.possession === 'away' ? prev.awayScore + 7 : prev.awayScore,
          lastScore: `${prev.possession === 'home' ? 'HAL BOMBERS' : 'CPU RAIDERS'} TOUCHDOWN!`,
          animations: [...prev.animations, {
            type: 'touchdown',
            x: FIELD_WIDTH - 50,
            y: FIELD_HEIGHT / 2,
            frame: 0
          }]
        }));
        
        // Auto-restart after touchdown
        setTimeout(() => {
          setGameState(prev => ({
            ...prev,
            status: 'playing',
            playerX: 150,
            playerY: FIELD_HEIGHT / 2,
            selectedPlay: null,
            ballCarrier: null,
            down: 1,
            yardsToGo: 10,
            fieldPosition: 20,
            possession: prev.possession === 'home' ? 'away' : 'home' // Switch possession
          }));
          spawnDefenders();
        }, 3000); // Show celebration for 3 seconds
      }
      
      // Update game state
      setGameState(prev => ({
        ...prev,
        playerX,
        playerY,
        defenders: updatedDefenders,
        receivers: updatedReceivers,
        ball: updatedBall,
        ballCarrier: prev.ballCarrier ? { ...prev.ballCarrier, x: playerX, y: playerY } : null,
        animations: prev.animations
          .map(a => ({ ...a, frame: a.frame + 1 }))
          .filter(a => a.frame < 30)
      }));
      
      animationFrameRef.current = requestAnimationFrame(gameLoop);
    };
    
    animationFrameRef.current = requestAnimationFrame(gameLoop);
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [gameState]);

  // Draw game
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.fillStyle = '#001a00';
    ctx.fillRect(0, 0, FIELD_WIDTH, FIELD_HEIGHT);
    
    // Draw stadium background
    if (stadiumLights) {
      // Stadium lights effect
      const gradient = ctx.createRadialGradient(FIELD_WIDTH/2, -100, 100, FIELD_WIDTH/2, FIELD_HEIGHT, 600);
      gradient.addColorStop(0, 'rgba(255, 255, 200, 0.3)');
      gradient.addColorStop(0.5, 'rgba(255, 255, 150, 0.1)');
      gradient.addColorStop(1, 'transparent');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, FIELD_WIDTH, FIELD_HEIGHT);
    }
    
    // Draw field
    ctx.fillStyle = '#00AA00';
    ctx.fillRect(50, 30, FIELD_WIDTH - 100, FIELD_HEIGHT - 60);
    
    // Draw yard lines
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    for (let i = 0; i <= 10; i++) {
      const x = 100 + (i * 70);
      ctx.beginPath();
      ctx.moveTo(x, 30);
      ctx.lineTo(x, FIELD_HEIGHT - 30);
      ctx.stroke();
      
      // Yard numbers
      if (i > 0 && i < 10) {
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 24px monospace';
        ctx.textAlign = 'center';
        const yardNum = i <= 5 ? i * 10 : (10 - i) * 10;
        ctx.fillText(yardNum.toString(), x, FIELD_HEIGHT / 2);
      }
    }
    
    // Draw endzones
    ctx.fillStyle = TEAMS.home.color + '44';
    ctx.fillRect(50, 30, 50, FIELD_HEIGHT - 60);
    ctx.fillStyle = TEAMS.away.color + '44';
    ctx.fillRect(FIELD_WIDTH - 100, 30, 50, FIELD_HEIGHT - 60);
    
    // Draw endzone text
    ctx.save();
    ctx.translate(75, FIELD_HEIGHT / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 20px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('HAL BOMBERS', 0, 0);
    ctx.restore();
    
    ctx.save();
    ctx.translate(FIELD_WIDTH - 75, FIELD_HEIGHT / 2);
    ctx.rotate(Math.PI / 2);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 20px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('CPU RAIDERS', 0, 0);
    ctx.restore();
    
    // Draw players
    if (gameState.status === 'playing' || gameState.status === 'touchdown') {
      // Draw ball carrier
      if (gameState.ballCarrier) {
        // Player shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.ellipse(gameState.playerX, gameState.playerY + 5, PLAYER_SIZE * 0.8, PLAYER_SIZE * 0.4, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Player body
        ctx.fillStyle = TEAMS.home.color;
        ctx.fillRect(gameState.playerX - PLAYER_SIZE/2, gameState.playerY - PLAYER_SIZE/2, PLAYER_SIZE, PLAYER_SIZE);
        
        // Player number
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 12px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('88', gameState.playerX, gameState.playerY + 3);
        
        // Ball
        ctx.fillStyle = '#8B4513';
        ctx.beginPath();
        ctx.ellipse(gameState.playerX + 10, gameState.playerY, BALL_SIZE * 0.7, BALL_SIZE * 0.5, Math.PI / 4, 0, Math.PI * 2);
        ctx.fill();
      }
      
      // Draw receivers
      gameState.receivers.forEach((rec, idx) => {
        // Receiver shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.ellipse(rec.x, rec.y + 5, PLAYER_SIZE * 0.8, PLAYER_SIZE * 0.4, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Receiver body
        ctx.fillStyle = TEAMS.home.secondary;
        ctx.strokeStyle = TEAMS.home.color;
        ctx.lineWidth = 2;
        ctx.fillRect(rec.x - PLAYER_SIZE/2, rec.y - PLAYER_SIZE/2, PLAYER_SIZE, PLAYER_SIZE);
        ctx.strokeRect(rec.x - PLAYER_SIZE/2, rec.y - PLAYER_SIZE/2, PLAYER_SIZE, PLAYER_SIZE);
        
        // Receiver number
        ctx.fillStyle = TEAMS.home.color;
        ctx.font = 'bold 12px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(idx === 0 ? '80' : '81', rec.x, rec.y + 3);
        
        // Target indicator
        if (rec.isTarget) {
          ctx.strokeStyle = '#FFFF00';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(rec.x, rec.y, PLAYER_SIZE, 0, Math.PI * 2);
          ctx.stroke();
        }
      });
      
      // Draw ball in flight
      if (gameState.ball?.inAir) {
        // Ball shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.beginPath();
        ctx.ellipse(gameState.ball.x, gameState.ball.y + 10, BALL_SIZE * 0.8, BALL_SIZE * 0.4, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Ball
        ctx.fillStyle = '#8B4513';
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.ellipse(gameState.ball.x, gameState.ball.y, BALL_SIZE * 0.7, BALL_SIZE * 0.5, Math.PI / 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        // Ball trail
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(gameState.ball.x - gameState.ball.vx * 3, gameState.ball.y - gameState.ball.vy * 3);
        ctx.lineTo(gameState.ball.x, gameState.ball.y);
        ctx.stroke();
      }
      
      // Draw defenders
      gameState.defenders.forEach(def => {
        // Defender shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.ellipse(def.x, def.y + 5, PLAYER_SIZE * 0.8, PLAYER_SIZE * 0.4, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Defender body
        ctx.fillStyle = TEAMS.away.color;
        ctx.fillRect(def.x - PLAYER_SIZE/2, def.y - PLAYER_SIZE/2, PLAYER_SIZE, PLAYER_SIZE);
        
        // Defender number
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 12px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('99', def.x, def.y + 3);
      });
    }
    
    // Draw animations
    gameState.animations.forEach(anim => {
      if (anim.type === 'tackle') {
        ctx.strokeStyle = '#FFFF00';
        ctx.lineWidth = 3;
        ctx.beginPath();
        const size = anim.frame * 3;
        ctx.arc(anim.x, anim.y, size, 0, Math.PI * 2);
        ctx.stroke();
      } else if (anim.type === 'touchdown') {
        ctx.fillStyle = `rgba(255, 215, 0, ${1 - anim.frame / 30})`;
        ctx.font = `bold ${30 + anim.frame}px monospace`;
        ctx.textAlign = 'center';
        ctx.fillText('TOUCHDOWN!', FIELD_WIDTH / 2, FIELD_HEIGHT / 2);
      }
    });
    
    // Draw CRT scanlines for retro effect
    for (let i = 0; i < FIELD_HEIGHT; i += 4) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.fillRect(0, i, FIELD_WIDTH, 2);
    }
    
  }, [gameState, stadiumLights]);

  return (
    <div className="w-full max-w-7xl mx-auto space-y-4">
      {/* Game Title */}
      <div className="text-center">
        <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 mb-2"
            style={{ fontFamily: 'monospace', textShadow: '2px 2px 0px rgba(0,0,0,0.5)' }}>
          HALTECMO BOWL
        </h1>
        <p className="text-gray-400 text-sm">The 8-Bit Football Classic</p>
      </div>

      {/* Game Display */}
      <Card className="bg-black border-2 border-cyan-500 shadow-[0_0_20px_rgba(0,255,255,0.5)]">
        <CardContent className="p-0">
          {/* Score Display */}
          <div className="bg-gradient-to-r from-blue-900 via-purple-900 to-blue-900 p-4 border-b-2 border-cyan-500">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-cyan-400 text-xs mb-1">HOME</div>
                <div className="text-3xl font-bold text-white" style={{ fontFamily: 'monospace' }}>
                  {gameState.homeScore.toString().padStart(2, '0')}
                </div>
                <div className="text-xs text-gray-400">{TEAMS.home.name}</div>
              </div>
              
              <div className="text-center">
                <div className="text-yellow-400 text-xs mb-1">QTR {gameState.quarter}</div>
                <div className="text-2xl font-bold text-white" style={{ fontFamily: 'monospace' }}>
                  {gameState.time}
                </div>
                <div className="text-xs text-gray-400">
                  {gameState.down}st & {gameState.yardsToGo}
                </div>
              </div>
              
              <div className="text-center">
                <div className="text-purple-400 text-xs mb-1">AWAY</div>
                <div className="text-3xl font-bold text-white" style={{ fontFamily: 'monospace' }}>
                  {gameState.awayScore.toString().padStart(2, '0')}
                </div>
                <div className="text-xs text-gray-400">{TEAMS.away.name}</div>
              </div>
            </div>
          </div>

          {/* Game Canvas */}
          <div className="relative bg-gradient-to-b from-blue-950 to-black p-4">
            <canvas
              ref={canvasRef}
              width={FIELD_WIDTH}
              height={FIELD_HEIGHT}
              className="w-full h-auto border-2 border-gray-800 rounded"
              style={{ 
                imageRendering: 'pixelated',
                maxHeight: '500px',
                boxShadow: 'inset 0 0 50px rgba(0,0,0,0.5)'
              }}
            />
            
            {/* Game Status Overlay */}
            {gameState.status === 'menu' && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/80 rounded">
                <div className="text-center space-y-6">
                  <div className="animate-pulse">
                    <div className="text-6xl mb-4">🏈</div>
                    <h2 className="text-4xl font-bold text-cyan-400 mb-2" style={{ fontFamily: 'monospace' }}>
                      READY TO PLAY?
                    </h2>
                    <p className="text-gray-400 mb-6">Classic 8-bit football action!</p>
                  </div>
                  
                  <Button
                    size="lg"
                    onClick={startGame}
                    className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white px-8 py-6 text-xl"
                    style={{ fontFamily: 'monospace' }}
                  >
                    <Play className="mr-2" />
                    INSERT COIN
                  </Button>
                  
                  <div className="flex justify-center gap-4 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowInstructions(!showInstructions)}
                      className="border-cyan-500 text-cyan-400"
                    >
                      <Info className="mr-1 h-4 w-4" />
                      How to Play
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSoundEnabled(!soundEnabled)}
                      className="border-cyan-500 text-cyan-400"
                    >
                      {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </div>
            )}
            
            {gameState.status === 'touchdown' && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center animate-bounce">
                  <div className="text-8xl mb-4">🎉</div>
                  <div className="text-5xl font-bold text-yellow-400 animate-pulse" style={{ fontFamily: 'monospace' }}>
                    TOUCHDOWN!
                  </div>
                  <div className="text-2xl text-white mt-2">{gameState.lastScore}</div>
                </div>
              </div>
            )}
            
            {gameState.status === 'paused' && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                <div className="text-4xl font-bold text-white animate-pulse" style={{ fontFamily: 'monospace' }}>
                  PAUSED
                </div>
              </div>
            )}
          </div>

          {/* Play Selection */}
          {gameState.status === 'playing' && !gameState.selectedPlay && (
            <div className="bg-gradient-to-r from-gray-900 to-black p-4 border-t-2 border-cyan-500">
              <div className="text-center mb-3">
                <p className="text-cyan-400 text-sm font-bold" style={{ fontFamily: 'monospace' }}>
                  SELECT PLAY (PRESS 1-4)
                </p>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {PLAYS.map((play) => (
                  <Button
                    key={play.id}
                    variant={gameState.selectedPlay === play.id ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => selectPlay(play.id)}
                    className={`border-cyan-500 ${gameState.selectedPlay === play.id ? 'bg-cyan-600' : ''}`}
                  >
                    <div className="text-center">
                      <div className="text-lg">{play.formation}</div>
                      <div className="text-xs">{play.name}</div>
                    </div>
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Instructions */}
          {showInstructions && (
            <div className="bg-gray-900 p-4 border-t border-gray-800">
              <h3 className="text-cyan-400 font-bold mb-2" style={{ fontFamily: 'monospace' }}>
                HOW TO PLAY
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-400 mb-1">Movement:</p>
                  <div className="flex gap-1 mb-2">
                    <Badge variant="outline" className="border-cyan-500">
                      <ArrowUp className="h-3 w-3" />
                    </Badge>
                    <Badge variant="outline" className="border-cyan-500">
                      <ArrowDown className="h-3 w-3" />
                    </Badge>
                    <Badge variant="outline" className="border-cyan-500">
                      <ArrowLeft className="h-3 w-3" />
                    </Badge>
                    <Badge variant="outline" className="border-cyan-500">
                      <ArrowRight className="h-3 w-3" />
                    </Badge>
                  </div>
                </div>
                <div>
                  <p className="text-gray-400 mb-1">Actions:</p>
                  <p className="text-white text-xs">1-4: Select Play</p>
                  <p className="text-white text-xs">SPACE: Throw Pass / Pause</p>
                  <p className="text-white text-xs">Pass plays: Press SPACE to throw!</p>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Avoid defenders and reach the endzone to score a touchdown!
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Game Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-gray-900 border-cyan-500/50">
          <CardContent className="p-3 text-center">
            <div className="text-xs text-gray-400">HIGH SCORE</div>
            <div className="text-xl font-bold text-cyan-400" style={{ fontFamily: 'monospace' }}>
              42
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gray-900 border-purple-500/50">
          <CardContent className="p-3 text-center">
            <div className="text-xs text-gray-400">STADIUM</div>
            <div className="text-xl font-bold text-purple-400" style={{ fontFamily: 'monospace' }}>
              GRID DOME
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gray-900 border-yellow-500/50">
          <CardContent className="p-3 text-center">
            <div className="text-xs text-gray-400">WEATHER</div>
            <div className="text-xl font-bold text-yellow-400" style={{ fontFamily: 'monospace' }}>
              CLEAR
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}