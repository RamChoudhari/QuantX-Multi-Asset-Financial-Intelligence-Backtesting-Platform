import React, { useRef, useState, useEffect, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html, Float } from '@react-three/drei';
import * as THREE from 'three';
import { Sparkles, Maximize2, RotateCcw, ShieldCheck, Activity } from 'lucide-react';
import { BackendMarketData } from '../lib/api/marketApi';

interface MarketUniverse3DProps {
  selectedAsset: string;
  onSelectAsset: (assetId: string) => void;
  marketDataMap?: Record<string, BackendMarketData | null>;
}

// Check if WebGL is supported in browser
function isWebGLAvailable(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return Boolean(
      window.WebGLRenderingContext &&
        (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
    );
  } catch {
    return false;
  }
}

interface AssetNodeConfig {
  id: 'GOLD' | 'BTC' | 'NVDA';
  symbol: string;
  name: string;
  color: string;
  glowColor: string;
  orbitRadius: number;
  orbitSpeed: number;
  baseSize: number;
  startAngle: number;
  yOffset: number;
}

const ASSET_CONFIGS: AssetNodeConfig[] = [
  {
    id: 'BTC',
    symbol: 'BTC-USD',
    name: 'Bitcoin',
    color: '#f97316',
    glowColor: '#ea580c',
    orbitRadius: 7.2,
    orbitSpeed: 0.18,
    baseSize: 0.95,
    startAngle: 0.2,
    yOffset: 0.4,
  },
  {
    id: 'GOLD',
    symbol: 'GC=F',
    name: 'Gold Spot',
    color: '#eab308',
    glowColor: '#ca8a04',
    orbitRadius: 4.8,
    orbitSpeed: 0.12,
    baseSize: 0.8,
    startAngle: 2.3,
    yOffset: -0.2,
  },
  {
    id: 'NVDA',
    symbol: 'NVDA',
    name: 'NVIDIA Corp',
    color: '#06b6d4',
    glowColor: '#0891b2',
    orbitRadius: 9.8,
    orbitSpeed: 0.15,
    baseSize: 0.9,
    startAngle: 4.2,
    yOffset: 0.1,
  },
];

// Single 3D Asset Node Component
const AssetNodeMesh: React.FC<{
  config: AssetNodeConfig;
  isSelected: boolean;
  onSelect: (id: string) => void;
  marketData?: BackendMarketData | null;
  reducedMotion: boolean;
}> = ({ config, isSelected, onSelect, marketData, reducedMotion }) => {
  const meshRef = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  // Derive dynamic radius & size from real metrics if present
  const sizeMultiplier = useMemo(() => {
    if (!marketData) return 1.0;
    // Scale slightly by volatility within safe range [0.85, 1.25]
    const vol = marketData.annualized_volatility || 0.25;
    return Math.max(0.85, Math.min(1.25, 0.8 + vol * 0.8));
  }, [marketData]);

  const priceStr = marketData?.latest_price
    ? `$${marketData.latest_price.toLocaleString()}`
    : config.id === 'BTC'
    ? '$81,200'
    : config.id === 'GOLD'
    ? '$4,420'
    : '$138.50';

  const returnPct = marketData?.period_return_pct ?? (config.id === 'BTC' ? 18.4 : config.id === 'NVDA' ? 24.1 : 6.8);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = reducedMotion ? 0 : clock.getElapsedTime() * config.orbitSpeed;
    const angle = config.startAngle + t;
    const x = Math.cos(angle) * config.orbitRadius;
    const z = Math.sin(angle) * config.orbitRadius;
    const y = config.yOffset + Math.sin(t * 1.5) * 0.25;

    meshRef.current.position.set(x, y, z);

    // Pulse selection ring
    if (ringRef.current && isSelected) {
      const pulse = 1 + Math.sin(clock.getElapsedTime() * 4) * 0.08;
      ringRef.current.scale.set(pulse, pulse, pulse);
    }
  });

  const nodeScale = (config.baseSize * sizeMultiplier * (hovered ? 1.15 : 1.0)).toFixed(3);

  return (
    <group ref={meshRef}>
      {/* Interactive Core Sphere */}
      <mesh
        onClick={e => {
          e.stopPropagation();
          onSelect(config.id);
        }}
        onPointerOver={e => {
          e.stopPropagation();
          setHovered(true);
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          setHovered(false);
          document.body.style.cursor = 'auto';
        }}
      >
        <sphereGeometry args={[Number(nodeScale), 32, 32]} />
        <meshStandardMaterial
          color={config.color}
          emissive={config.glowColor}
          emissiveIntensity={isSelected ? 1.2 : hovered ? 0.8 : 0.4}
          roughness={0.2}
          metalness={0.8}
        />
      </mesh>

      {/* Outer Selection / Hover Ring */}
      <mesh
        ref={ringRef}
        rotation={[Math.PI / 2, 0, 0]}
        visible={isSelected || hovered}
      >
        <ringGeometry args={[Number(nodeScale) * 1.2, Number(nodeScale) * 1.35, 32]} />
        <meshBasicMaterial
          color={isSelected ? '#38bdf8' : config.color}
          side={THREE.DoubleSide}
          transparent
          opacity={isSelected ? 0.9 : 0.5}
        />
      </mesh>

      {/* Floating 3D HTML Overlay */}
      <Html
        position={[0, Number(nodeScale) + 0.6, 0]}
        center
        distanceFactor={14}
        style={{
          transition: 'all 0.2s',
          pointerEvents: 'none',
        }}
      >
        <div
          onClick={e => {
            e.stopPropagation();
            onSelect(config.id);
          }}
          className={`pointer-events-auto cursor-pointer select-none rounded-xl px-2.5 py-1.5 backdrop-blur-md transition-all duration-200 border whitespace-nowrap shadow-xl ${
            isSelected
              ? 'bg-slate-900/90 border-cyan-400 text-white ring-2 ring-cyan-500/30 shadow-cyan-500/20'
              : hovered
              ? 'bg-slate-900/80 border-slate-600 text-slate-200'
              : 'bg-slate-950/70 border-slate-800/80 text-slate-300'
          }`}
        >
          <div className="flex items-center gap-2">
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: config.color }}
            />
            <span className="font-bold text-xs tracking-wide">{config.name}</span>
            <span className="text-[10px] font-mono text-slate-400">{config.symbol}</span>
          </div>
          <div className="flex items-center justify-between gap-3 mt-0.5 text-[11px] font-mono">
            <span className="font-semibold text-white">{priceStr}</span>
            <span
              className={`text-[10px] font-semibold ${
                returnPct >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {returnPct >= 0 ? '+' : ''}
              {returnPct.toFixed(1)}%
            </span>
          </div>
        </div>
      </Html>
    </group>
  );
};

// Orbital Track Ring
const OrbitRing: React.FC<{ radius: number; color: string; opacity?: number }> = ({
  radius,
  color,
  opacity = 0.18,
}) => {
  return (
    <mesh rotation={[Math.PI / 2, 0, 0]}>
      <ringGeometry args={[radius - 0.02, radius + 0.02, 64]} />
      <meshBasicMaterial color={color} transparent opacity={opacity} side={THREE.DoubleSide} />
    </mesh>
  );
};

// Background Particle Field
const DataParticles: React.FC<{ count?: number }> = ({ count = 180 }) => {
  const particlesRef = useRef<THREE.Points>(null);

  const [positions] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const radius = 3 + Math.random() * 12;
      const theta = Math.random() * Math.PI * 2;
      const phi = (Math.random() - 0.5) * Math.PI * 0.6;

      pos[i * 3] = Math.cos(theta) * Math.cos(phi) * radius;
      pos[i * 3 + 1] = Math.sin(phi) * radius * 0.8;
      pos[i * 3 + 2] = Math.sin(theta) * Math.cos(phi) * radius;
    }
    return [pos];
  }, [count]);

  useFrame(({ clock }) => {
    if (particlesRef.current) {
      particlesRef.current.rotation.y = clock.getElapsedTime() * 0.02;
    }
  });

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.06}
        color="#38bdf8"
        transparent
        opacity={0.35}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};

// Central QUANTEXA Orb Core
const CentralQuantexaCore: React.FC<{ reducedMotion: boolean }> = ({ reducedMotion }) => {
  const innerRef = useRef<THREE.Mesh>(null);
  const wireRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (!reducedMotion) {
      if (innerRef.current) {
        innerRef.current.rotation.y = t * 0.3;
        innerRef.current.rotation.x = t * 0.15;
      }
      if (wireRef.current) {
        wireRef.current.rotation.y = -t * 0.2;
        wireRef.current.rotation.z = t * 0.1;
      }
    }
  });

  return (
    <group position={[0, 0, 0]}>
      {/* Inner Glowing Crystal Core */}
      <mesh ref={innerRef}>
        <icosahedronGeometry args={[1.35, 2]} />
        <meshStandardMaterial
          color="#06b6d4"
          emissive="#0891b2"
          emissiveIntensity={0.8}
          roughness={0.1}
          metalness={0.9}
          wireframe={false}
        />
      </mesh>

      {/* Outer Wireframe Energy Cage */}
      <mesh ref={wireRef}>
        <icosahedronGeometry args={[1.75, 1]} />
        <meshBasicMaterial
          color="#38bdf8"
          wireframe
          transparent
          opacity={0.3}
        />
      </mesh>

      {/* Central Core Label */}
      <Html position={[0, -2.2, 0]} center distanceFactor={14}>
        <div className="px-2.5 py-1 rounded-full bg-slate-950/80 border border-cyan-500/30 backdrop-blur-sm text-[10px] font-mono tracking-widest text-cyan-400 font-bold uppercase shadow-lg shadow-cyan-950/50 select-none">
          QUANTEXA CORE
        </div>
      </Html>
    </group>
  );
};

// 2D Elegant Fallback for environments without WebGL
const Fallback2DView: React.FC<{
  selectedAsset: string;
  onSelectAsset: (id: string) => void;
  marketDataMap?: Record<string, BackendMarketData | null>;
}> = ({ selectedAsset, onSelectAsset, marketDataMap }) => {
  return (
    <div className="relative w-full h-[480px] bg-gradient-to-b from-slate-950 via-[#0a0f1d] to-slate-950 rounded-2xl border border-slate-800 p-6 flex flex-col items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.08)_0%,transparent_70%)] pointer-events-none" />

      {/* SVG Orbital representation */}
      <div className="relative w-72 h-72 rounded-full border border-slate-800 flex items-center justify-center">
        <div className="absolute w-52 h-52 rounded-full border border-slate-700/60" />
        <div className="absolute w-36 h-36 rounded-full border border-cyan-500/20" />

        {/* Central Core */}
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-cyan-500/30 text-xs font-bold font-mono text-slate-950">
          CORE
        </div>

        {/* 3 Nodes placed along orbits */}
        {ASSET_CONFIGS.map((cfg, idx) => {
          const angles = [0, 2.1, 4.2];
          const dist = [110, 80, 130][idx];
          const x = Math.cos(angles[idx]) * dist;
          const y = Math.sin(angles[idx]) * dist;
          const isSelected = selectedAsset === cfg.id;
          const data = marketDataMap?.[cfg.id];

          return (
            <button
              key={cfg.id}
              onClick={() => onSelectAsset(cfg.id)}
              style={{ transform: `translate(${x}px, ${y}px)` }}
              className={`absolute p-2 rounded-xl text-left border transition-all duration-200 backdrop-blur-md shadow-xl ${
                isSelected
                  ? 'bg-slate-900 border-cyan-400 ring-2 ring-cyan-500/30 text-white scale-110'
                  : 'bg-slate-950/80 border-slate-700 text-slate-300 hover:border-slate-500'
              }`}
            >
              <div className="flex items-center gap-1.5 text-xs font-bold">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cfg.color }} />
                <span>{cfg.name}</span>
              </div>
              <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                {data?.latest_price ? `$${data.latest_price.toLocaleString()}` : cfg.symbol}
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-6 text-center text-xs text-slate-400">
        <span className="text-cyan-400 font-semibold">2D Fallback Mode Active</span> • WebGL hardware acceleration unavailable. Click any asset above to focus analysis.
      </div>
    </div>
  );
};

export const MarketUniverse3D: React.FC<MarketUniverse3DProps> = ({
  selectedAsset,
  onSelectAsset,
  marketDataMap,
}) => {
  const [hasWebGL, setHasWebGL] = useState<boolean>(true);
  const [reducedMotion, setReducedMotion] = useState<boolean>(false);
  const controlsRef = useRef<any>(null);

  useEffect(() => {
    setHasWebGL(isWebGLAvailable());
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mql.matches);

    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  const handleResetCamera = () => {
    if (controlsRef.current) {
      controlsRef.current.reset();
    }
  };

  if (!hasWebGL) {
    return (
      <Fallback2DView
        selectedAsset={selectedAsset}
        onSelectAsset={onSelectAsset}
        marketDataMap={marketDataMap}
      />
    );
  }

  return (
    <div className="relative w-full h-[520px] rounded-2xl bg-gradient-to-b from-[#070b16] via-[#090e1d] to-[#060a14] border border-slate-800 shadow-2xl overflow-hidden group">
      {/* Background ambient lighting overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.06)_0%,transparent_75%)] pointer-events-none" />

      {/* Top Bar Controls & Legend */}
      <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto">
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-950/80 border border-cyan-500/30 backdrop-blur-md text-xs font-semibold text-cyan-300 shadow-lg">
            <Activity className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span>3D MARKET UNIVERSE</span>
          </span>
          <span className="hidden sm:inline-block text-[11px] text-slate-400 bg-slate-950/70 border border-slate-800/80 px-2.5 py-1 rounded-lg backdrop-blur-sm">
            Drag to rotate • Scroll to zoom • Click nodes
          </span>
        </div>

        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            onClick={handleResetCamera}
            title="Reset View Position"
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900/80 hover:bg-slate-850 border border-slate-700/80 text-xs text-slate-300 hover:text-white transition-all backdrop-blur-md shadow-sm"
          >
            <RotateCcw className="w-3 h-3" />
            <span className="hidden md:inline">Reset Camera</span>
          </button>
        </div>
      </div>

      {/* Main 3D Canvas */}
      <Canvas
        camera={{ position: [0, 8, 18], fov: 45 }}
        gl={{ antialias: true, alpha: true }}
        dpr={[1, 1.75]} // Optimized DPR for laptop performance
      >
        <ambientLight intensity={0.4} />
        <pointLight position={[0, 0, 0]} intensity={2.5} color="#38bdf8" distance={25} />
        <pointLight position={[15, 10, 15]} intensity={0.8} color="#ffffff" />
        <directionalLight position={[-10, 10, -5]} intensity={0.5} color="#06b6d4" />

        {/* Orbit Controls */}
        <OrbitControls
          ref={controlsRef}
          enablePan={false}
          minDistance={7}
          maxDistance={25}
          maxPolarAngle={Math.PI / 2 + 0.1}
          autoRotate={!reducedMotion}
          autoRotateSpeed={0.35}
          dampingFactor={0.06}
        />

        {/* Central Orb & Orbit Rings */}
        <CentralQuantexaCore reducedMotion={reducedMotion} />
        <OrbitRing radius={4.8} color="#eab308" opacity={0.2} />
        <OrbitRing radius={7.2} color="#f97316" opacity={0.2} />
        <OrbitRing radius={9.8} color="#06b6d4" opacity={0.2} />

        {/* Subtle ground grid */}
        <gridHelper
          args={[26, 26, '#1e293b', '#0f172a']}
          position={[0, -2.8, 0]}
        />

        {/* Floating Data Particles */}
        <DataParticles count={180} />

        {/* 3 Interactive Asset Nodes */}
        {ASSET_CONFIGS.map(cfg => (
          <AssetNodeMesh
            key={cfg.id}
            config={cfg}
            isSelected={selectedAsset === cfg.id}
            onSelect={onSelectAsset}
            marketData={marketDataMap?.[cfg.id]}
            reducedMotion={reducedMotion}
          />
        ))}
      </Canvas>

      {/* Bottom Technical Disclaimer & Active Asset Chip */}
      <div className="absolute bottom-3 left-4 right-4 z-10 flex flex-col sm:flex-row items-center justify-between gap-2 pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto">
          {ASSET_CONFIGS.map(cfg => {
            const active = selectedAsset === cfg.id;
            return (
              <button
                key={cfg.id}
                onClick={() => onSelectAsset(cfg.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono transition-all backdrop-blur-md border ${
                  active
                    ? 'bg-slate-900 border-cyan-400 text-white shadow-md shadow-cyan-900/30 ring-1 ring-cyan-500/40'
                    : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cfg.color }} />
                <span>{cfg.name}</span>
              </button>
            );
          })}
        </div>

        <div className="text-[11px] text-slate-500 bg-slate-950/80 border border-slate-800/80 px-2.5 py-1 rounded-md backdrop-blur-sm pointer-events-auto flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>3D orbital velocities are interactive UI dynamics. Quantitative metrics are computed in Python.</span>
        </div>
      </div>
    </div>
  );
};
