"use client";
import React, { useRef, useMemo, useEffect, useState, useCallback } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, useTexture } from "@react-three/drei";
import * as THREE from "three";

// Ensure THREE is properly configured for r160+
if (typeof THREE.ColorManagement !== 'undefined') {
  THREE.ColorManagement.enabled = true;
}

// Card data type
interface TarotCard {
  id: string;
  name: string;
  nameVi: string;
  img: string;
  arcana: string;
  suit: string | null;
  meaning: string;
}

// Spiral arm parameters (galaxy arms)
const SPIRAL_ARMS = 4;
const ARM_COLORS = ['#b8849f', '#d4a843', '#dbb5cc', '#3a2045'];

// Card component that rolls out along spiral arm
function GalaxyCardMesh({ 
  card, 
  armIndex,
  distance,
  angle,
  rollProgress,
  index,
  hovered,
  setHovered,
  flipped
}: {
  card: TarotCard;
  armIndex: number;
  distance: number;
  angle: number;
  rollProgress: number;
  index: number;
  hovered: number | null;
  setHovered: (index: number | null) => void;
  flipped: boolean;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const texture = useTexture(flipped ? card.img : "/images/cards/m00.webp");

  // Animate card rolling out along spiral arm
  useFrame((state, delta) => {
    if (meshRef.current) {
      // Spiral position: distance increases as card rolls out
      const spiralDistance = distance * rollProgress;
      
      // Spiral angle: angle + rotation based on arm index
      const spiralAngle = angle + state.clock.elapsedTime * 0.05 * (armIndex + 1);
      
      // Calculate spiral coordinates (Archimedean spiral)
      const x = Math.cos(spiralAngle) * spiralDistance;
      const z = Math.sin(spiralAngle) * spiralDistance;
      
      // Gentle floating on Y axis
      const floatOffset = Math.sin(state.clock.elapsedTime * 0.5 + index * 0.3) * 0.02;
      
      meshRef.current.position.set(x, floatOffset, z);
      
      // Card faces slightly upward and toward center
      const lookAtX = Math.cos(spiralAngle) * (spiralDistance * 0.5);
      const lookAtZ = Math.sin(spiralAngle) * (spiralDistance * 0.5);
      meshRef.current.lookAt(lookAtX, 0.5, lookAtZ);
      
      // Hover scale effect
      meshRef.current.scale.set(
        hovered === index ? 1.15 : 1,
        hovered === index ? 1.15 : 1,
        1
      );
    }
  });

  return (
    <mesh
      ref={meshRef}
      onPointerOver={() => setHovered(index)}
      onPointerOut={() => setHovered(null)}
      onClick={(e) => {
        e.stopPropagation();
      }}
    >
      <planeGeometry args={[0.6, 1, 16, 16]} />
      <meshStandardMaterial
        map={texture}
        side={THREE.DoubleSide}
        roughness={0.3}
        metalness={0.1}
      />
    </mesh>
  );
}

// Spiral Galaxy Arms - the colored arms that cards roll along
function GalaxyArms() {
  const armRefs = useRef<THREE.Group[]>([]);
  
  useFrame((state, delta) => {
    armRefs.current.forEach((arm, i) => {
      if (arm) {
        // Rotate arms slowly in opposite directions
        const direction = i % 2 === 0 ? 1 : -1;
        arm.rotation.z += delta * 0.01 * direction;
      }
    });
  });

  return (
    <group>
      {Array.from({ length: SPIRAL_ARMS }).map((_, armIndex) => {
        // Create spiral curve for each arm
        const points: THREE.Vector3[] = [];
        const segments = 100;
        const maxRadius = 5;
        const armColor = ARM_COLORS[armIndex % ARM_COLORS.length];
        
        for (let i = 0; i <= segments; i++) {
          const t = i / segments;
          const radius = t * maxRadius;
          const angle = armIndex * (Math.PI / 2) + t * Math.PI * 2 * (armIndex % 2 === 0 ? 1 : -1);
          const x = Math.cos(angle) * radius;
          const z = Math.sin(angle) * radius;
          points.push(new THREE.Vector3(x, 0, z));
        }
        
        return (
          <group key={armIndex} ref={(el) => (armRefs.current[armIndex] = el!)}>
            {/* Spiral line */}
            <line>
              <bufferGeometry attach="geometry">
                <bufferAttribute
                  attach="attributes-position"
                  array={new Float32Array(points.flatMap(p => [p.x, p.y, p.z]))}
                  count={points.length}
                  itemSize={3}
                />
              </bufferGeometry>
              <lineBasicMaterial color={armColor} transparent opacity={0.3} />
            </line>
            
            {/* Glow effect along arm */}
            {Array.from({ length: 10 }).map((_, i) => {
              const t = (i + 1) / 11;
              const radius = t * maxRadius;
              const angle = armIndex * (Math.PI / 2) + t * Math.PI * 2 * (armIndex % 2 === 0 ? 1 : -1);
              const x = Math.cos(angle) * radius;
              const z = Math.sin(angle) * radius;
              return (
                <pointLight
                  key={i}
                  position={[x, 0, z]}
                  color={armColor}
                  intensity={0.1 + t * 0.3}
                  distance={t * maxRadius * 2}
                />
              );
            })}
          </group>
        );
      })}
    </group>
  );
}

// Scroll-based rig that controls galaxy rotation
function GalaxyRig({ children, scrollVelocity }: { children: React.ReactNode; scrollVelocity: number }) {
  const groupRef = useRef<THREE.Group>(null);
  
  useFrame((state, delta) => {
    if (groupRef.current) {
      // Rotate galaxy based on scroll velocity
      groupRef.current.rotation.y += delta * scrollVelocity * 0.002;
      
      // Add subtle automatic rotation
      groupRef.current.rotation.y += delta * 0.05;
    }
  });

  return <group ref={groupRef}>{children}</group>;
}

// Tooltip component for card info
function CardTooltip({ card, position }: { card: TarotCard; position: { x: number; y: number } }) {
  return (
    <div
      style={{
        position: 'absolute',
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: 'translate(-50%, -100%)',
        background: 'rgba(26, 16, 40, 0.95)',
        backdropFilter: 'blur(8px)',
        border: '1px solid rgba(212, 168, 67, 0.3)',
        borderRadius: '12px',
        padding: '12px 16px',
        minWidth: '200px',
        fontFamily: '"Playfair Display", serif',
        fontSize: '14px',
        color: '#d4a843',
        zIndex: 100,
        pointerEvents: 'none',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
      }}
    >
      <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>{card.name}</div>
      <div style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '12px', color: '#dbb5cc' }}>
        {card.meaning}
      </div>
      <div style={{ fontSize: '10px', color: '#b8849f', marginTop: '4px' }}>
        {card.arcana} Arcana {card.suit && `• ${card.suit}`}
      </div>
    </div>
  );
}

// Main 3D Tarot Cards Component - Galaxy/Spiral Arms Layout
interface TarotCards3DProps {
  count?: number;
  cardData?: TarotCard[];
}

export default function TarotCards3D({ count = 6, cardData }: TarotCards3DProps) {
  const [hovered, setHovered] = useState<number | null>(null);
  const [cards, setCards] = useState<TarotCard[]>([]);
  const [scrollY, setScrollY] = useState(0);
  const [scrollVelocity, setScrollVelocity] = useState(0);
  const [flippedCards, setFlippedCards] = useState<boolean[]>([]);
  const [tooltip, setTooltip] = useState<{ card: TarotCard; x: number; y: number } | null>(null);
  const [rollProgress, setRollProgress] = useState(0); // 0 = at center, 1 = fully rolled out
  const [lastScrollY, setLastScrollY] = useState(0);
  const [lastTime, setLastTime] = useState(0);

  // Track scroll position and velocity
  useEffect(() => {
    let lastY = 0;
    let lastT = Date.now();
    
    const handleScroll = () => {
      const now = Date.now();
      const currentY = window.scrollY;
      
      // Calculate velocity
      const deltaY = currentY - lastY;
      const deltaT = now - lastT;
      const velocity = deltaT > 0 ? deltaY / deltaT : 0;
      
      setScrollY(currentY);
      setScrollVelocity(velocity);
      setLastScrollY(currentY);
      setLastTime(now);
      
      lastY = currentY;
      lastT = now;
      
      // Calculate roll progress (0-1) based on scroll
      const maxScroll = 500;
      const progress = Math.min(currentY / maxScroll, 1);
      setRollProgress(progress);
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initialize
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Initialize flipped cards state
  useEffect(() => {
    if (cards.length > 0) {
      setFlippedCards(cards.map(() => Math.random() > 0.5));
    }
  }, [cards.length]);

  // Load card data
  useEffect(() => {
    if (cardData && cardData.length > 0) {
      setCards(cardData.slice(0, count));
    } else {
      fetch("/data/tarot-cards.json")
        .then((r) => r.json())
        .then((data: TarotCard[]) => {
          const shuffled = [...data].sort(() => Math.random() - 0.5);
          setCards(shuffled.slice(0, count));
        })
        .catch(() => {
          const fallback: TarotCard[] = [];
          for (let i = 0; i < 22; i++) {
            const id = `m${i.toString().padStart(2, "0")}`;
            fallback.push({
              id,
              name: `Major ${i}`,
              nameVi: `Major ${i}`,
              img: `/images/cards/${id}.webp`,
              arcana: "Major",
              suit: null,
              meaning: "",
            });
          }
          setCards(fallback.slice(0, count));
        });
    }
  }, [count, cardData]);

  // Handle card interactions
  const handleCardClick = useCallback((index: number) => {
    // Flip card on click
    setFlippedCards(prev => {
      const newFlipped = [...prev];
      newFlipped[index] = !newFlipped[index];
      return newFlipped;
    });
  }, []);

  // Track mouse position for tooltip
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Show tooltip when hovering over card
  useEffect(() => {
    if (hovered !== null && cards[hovered]) {
      setTooltip({ card: cards[hovered], x: mousePos.x, y: mousePos.y });
    } else {
      setTooltip(null);
    }
  }, [hovered, mousePos, cards]);

  if (cards.length === 0) return null;

  return (
    <>
      <Canvas
        camera={{
          position: [0, 0, 10],
          fov: 60,
          near: 0.1,
          far: 1000,
        }}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          zIndex: 0,
        }}
        gl={{
          antialias: true,
          alpha: true,
        }}
      >
        {/* Lighting */}
        <ambientLight intensity={0.4} />
        <directionalLight
          position={[10, 10, 5]}
          intensity={1}
          castShadow
        />
        <directionalLight
          position={[-10, -10, -5]}
          intensity={0.5}
        />
        <pointLight position={[0, 0, 0]} intensity={0.5} color="#d4a843" />

        {/* Galaxy spiral arms */}
        <GalaxyArms />

        {/* Galaxy rig with cards rolling out along spiral arms */}
        <GalaxyRig scrollVelocity={scrollVelocity}>
          {cards.map((card, i) => {
            // Assign each card to a spiral arm
            const armIndex = i % SPIRAL_ARMS;
            const cardsPerArm = Math.ceil(count / SPIRAL_ARMS);
            const positionInArm = Math.floor(i / SPIRAL_ARMS);
            
            // Spiral parameters for this card
            const maxDistance = 4;
            const distance = 1 + (positionInArm / cardsPerArm) * maxDistance;
            const angleOffset = armIndex * (Math.PI / 2);
            const angle = angleOffset + positionInArm * 0.2;
            
            return (
              <GalaxyCardMesh
                key={card.id}
                card={card}
                armIndex={armIndex}
                distance={distance}
                angle={angle}
                rollProgress={rollProgress}
                index={i}
                hovered={hovered}
                setHovered={setHovered}
                flipped={flippedCards[i]}
              />
            );
          })}
        </GalaxyRig>

        {/* Environment */}
        <Environment preset="city" />
      </Canvas>
      
      {/* Tooltip overlay */}
      {tooltip && (
        <CardTooltip card={tooltip.card} position={{ x: tooltip.x, y: tooltip.y }} />
      )}
    </>
  );
}
