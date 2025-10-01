'use client';

import { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Text, Box, OrbitControls, PerspectiveCamera, Environment, Float } from '@react-three/drei';
import * as THREE from 'three';
import { Player } from '@/lib/types';

interface PlayerCard3DProps {
  player: Player;
  isStarter?: boolean;
}

function Card3D({ player, isStarter }: { player: Player; isStarter?: boolean }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const [clicked, setClicked] = useState(false);

  useFrame((state) => {
    if (!meshRef.current) return;
    
    // Gentle rotation
    meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
    
    // Scale on hover
    const scale = hovered ? 1.1 : 1;
    meshRef.current.scale.lerp(new THREE.Vector3(scale, scale, scale), 0.1);
  });

  const positionColors: Record<string, string> = {
    QB: '#ef4444',
    RB: '#22c55e',
    WR: '#3b82f6',
    TE: '#f97316',
    K: '#a855f7',
    DST: '#6b7280',
    DEF: '#6b7280',
  };

  const color = positionColors[player.position] || '#6b7280';
  const fantasyPoints = player.stats?.fantasyPoints || 0;
  const projectedPoints = player.stats?.projectedPoints || 0;
  const performance = projectedPoints > 0 ? (fantasyPoints / projectedPoints) * 100 : 0;

  return (
    <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.3}>
      <group
        ref={meshRef}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        onClick={() => setClicked(!clicked)}
      >
        {/* Card Base */}
        <Box args={[3, 4, 0.2]} castShadow receiveShadow>
          <meshStandardMaterial
            color={hovered ? '#1f2937' : '#111827'}
            metalness={0.3}
            roughness={0.4}
          />
        </Box>

        {/* Position Badge */}
        <Box args={[0.8, 0.4, 0.3]} position={[-0.8, 1.5, 0.15]} castShadow>
          <meshStandardMaterial color={color} metalness={0.5} roughness={0.2} />
        </Box>
        
        <Text
          position={[-0.8, 1.5, 0.31]}
          fontSize={0.2}
          color="white"
          anchorX="center"
          anchorY="middle"
          font="/fonts/bold.woff"
        >
          {player.position}
        </Text>

        {/* Player Name */}
        <Text
          position={[0, 0.8, 0.11]}
          fontSize={0.25}
          color="white"
          anchorX="center"
          anchorY="middle"
          font="/fonts/bold.woff"
          maxWidth={2.5}
        >
          {player.name}
        </Text>

        {/* Team */}
        <Text
          position={[0, 0.4, 0.11]}
          fontSize={0.18}
          color="#9ca3af"
          anchorX="center"
          anchorY="middle"
        >
          {player.team} #{player.jerseyNumber || ''}
        </Text>

        {/* Fantasy Points */}
        <Text
          position={[0, -0.2, 0.11]}
          fontSize={0.5}
          color={performance >= 100 ? '#22c55e' : performance >= 75 ? '#eab308' : '#ef4444'}
          anchorX="center"
          anchorY="middle"
          font="/fonts/bold.woff"
        >
          {fantasyPoints.toFixed(1)}
        </Text>

        <Text
          position={[0, -0.6, 0.11]}
          fontSize={0.15}
          color="#6b7280"
          anchorX="center"
          anchorY="middle"
        >
          POINTS
        </Text>

        {/* Performance Bar */}
        <Box args={[2, 0.1, 0.05]} position={[0, -1, 0.12]}>
          <meshStandardMaterial color="#1f2937" />
        </Box>
        
        <Box 
          args={[(performance / 100) * 2, 0.1, 0.06]} 
          position={[-1 + (performance / 100), -1, 0.13]}
        >
          <meshStandardMaterial 
            color={performance >= 100 ? '#22c55e' : performance >= 75 ? '#eab308' : '#ef4444'} 
            emissive={performance >= 100 ? '#22c55e' : performance >= 75 ? '#eab308' : '#ef4444'}
            emissiveIntensity={0.2}
          />
        </Box>

        {/* Projected vs Actual */}
        <Text
          position={[0, -1.3, 0.11]}
          fontSize={0.12}
          color="#9ca3af"
          anchorX="center"
          anchorY="middle"
        >
          Proj: {projectedPoints.toFixed(1)} | {performance >= 100 ? '+' : ''}{(fantasyPoints - projectedPoints).toFixed(1)}
        </Text>

        {/* Starter Badge */}
        {isStarter && (
          <group position={[0.9, 1.5, 0.15]}>
            <Box args={[0.4, 0.4, 0.2]} castShadow>
              <meshStandardMaterial 
                color="#fbbf24" 
                metalness={0.8} 
                roughness={0.1}
                emissive="#fbbf24"
                emissiveIntensity={0.3}
              />
            </Box>
            <Text
              position={[0, 0, 0.11]}
              fontSize={0.2}
              color="#111827"
              anchorX="center"
              anchorY="middle"
              font="/fonts/bold.woff"
            >
              S
            </Text>
          </group>
        )}

        {/* Injury Status */}
        {player.injuryStatus && (
          <group position={[0, -1.7, 0.15]}>
            <Box args={[1.5, 0.3, 0.1]} castShadow>
              <meshStandardMaterial 
                color="#dc2626" 
                opacity={0.8}
                transparent
              />
            </Box>
            <Text
              position={[0, 0, 0.06]}
              fontSize={0.12}
              color="white"
              anchorX="center"
              anchorY="middle"
            >
              {player.injuryStatus.type}
            </Text>
          </group>
        )}
      </group>
    </Float>
  );
}

export function PlayerCard3D({ player, isStarter = false }: PlayerCard3DProps) {
  return (
    <div className="h-[400px] w-full cursor-grab active:cursor-grabbing">
      <Canvas shadows camera={{ position: [0, 0, 5], fov: 50 }}>
        <PerspectiveCamera makeDefault position={[0, 0, 5]} />
        <OrbitControls
          enablePan={false}
          enableZoom={false}
          minPolarAngle={Math.PI / 3}
          maxPolarAngle={Math.PI / 1.5}
        />
        
        {/* Lighting */}
        <ambientLight intensity={0.5} />
        <spotLight
          position={[10, 10, 10]}
          angle={0.15}
          penumbra={1}
          intensity={1}
          castShadow
          shadow-mapSize={2048}
        />
        <pointLight position={[-10, -10, -10]} intensity={0.5} />
        
        {/* Environment for reflections */}
        <Environment preset="city" />
        
        {/* The 3D Card */}
        <Card3D player={player} isStarter={isStarter} />
      </Canvas>
    </div>
  );
}