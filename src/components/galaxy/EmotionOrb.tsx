'use client';

/**
 * EmotionOrb - 3D sphere mesh representing an emotion in the galaxy
 *
 * Features:
 * - SphereGeometry with 100-unit radius
 * - Emotion-colored material using EMOTION_PALETTE
 * - PointLight glow emanating from orb
 * - Click interaction with raycasting
 * - Hover state with cursor change
 * - Visual selection indicator for keyboard navigation
 */

import React, { useRef, useState } from 'react';
import { Mesh, Color } from 'three';
import { ThreeEvent, useFrame } from '@react-three/fiber';
import { EMOTION_PALETTE } from '@/lib/motion-tokens';

type EmotionType = 'triumph' | 'focus' | 'intensity' | 'determination' | 'excitement' | 'serenity';

interface EmotionOrbProps {
  /** Emotion type determining color and identity */
  emotion: EmotionType;
  /** Position in 3D space [x, y, z] */
  position: [number, number, number];
  /** Callback when orb is clicked */
  onClick?: (emotion: EmotionType) => void;
  /** Optional custom radius (default: 100) */
  radius?: number;
  /** Visual indicator for keyboard selection (default: false) */
  selected?: boolean;
}

/**
 * EmotionOrb Component
 *
 * Renders a 3D sphere with emotion-specific coloring and lighting.
 * Uses MeshStandardMaterial for realistic lighting interaction.
 *
 * @param emotion - The emotion type for color theming
 * @param position - The [x, y, z] coordinates in 3D space
 * @param onClick - Optional callback when orb is clicked
 * @param radius - Optional custom radius (default: 100 units)
 * @param selected - Visual indicator for keyboard selection
 */
export function EmotionOrb({
  emotion,
  position,
  onClick,
  radius = 100,
  selected = false,
}: EmotionOrbProps) {
  const meshRef = useRef<Mesh>(null);
  const [isHovered, setIsHovered] = useState(false);

  // Get emotion color from palette
  const emotionColor = EMOTION_PALETTE[emotion].primary;

  // Convert hex color to Three.js Color for light
  const lightColor = new Color(emotionColor);

  /**
   * Animate selected orb with pulsing scale
   */
  useFrame((state) => {
    if (meshRef.current && selected) {
      // Pulse animation: subtle scale variation
      const scale = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.05;
      meshRef.current.scale.setScalar(scale);
    } else if (meshRef.current) {
      // Reset scale when not selected
      meshRef.current.scale.setScalar(1);
    }
  });

  /**
   * Handle orb click - trigger camera flight to orb
   */
  const handleClick = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();

    if (onClick) {
      onClick(emotion);
    }
  };

  /**
   * Handle pointer enter - show hover state
   */
  const handlePointerOver = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    setIsHovered(true);
    // Change cursor to pointer
    if (document.body.style) {
      document.body.style.cursor = 'pointer';
    }
  };

  /**
   * Handle pointer leave - hide hover state
   */
  const handlePointerOut = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    setIsHovered(false);
    // Reset cursor
    if (document.body.style) {
      document.body.style.cursor = 'auto';
    }
  };

  // Calculate emissive intensity based on state
  const emissiveIntensity = selected ? 0.6 : isHovered ? 0.4 : 0.2;
  const lightIntensity = selected ? 2.5 : isHovered ? 2.0 : 1.5;

  return (
    <group position={position}>
      {/* Main emotion orb mesh */}
      <mesh
        ref={meshRef}
        onClick={handleClick}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      >
        {/* SphereGeometry: radius, widthSegments, heightSegments */}
        {/* 32 segments for smooth appearance */}
        <sphereGeometry args={[radius, 32, 32]} />

        {/* MeshStandardMaterial for realistic PBR lighting */}
        <meshStandardMaterial
          color={emotionColor}
          emissive={emotionColor}
          emissiveIntensity={emissiveIntensity}
          metalness={0.3}
          roughness={0.4}
          toneMapped={false}
        />
      </mesh>

      {/* PointLight glow - emotion-colored light emanating from orb */}
      <pointLight
        color={lightColor}
        intensity={lightIntensity}
        distance={300}
        decay={2}
        position={[0, 0, 0]}
      />

      {/* Selection indicator ring (visible when selected via keyboard) */}
      {selected && (
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          {/* Torus geometry creates a ring around the orb */}
          <torusGeometry args={[radius * 1.3, 3, 16, 32]} />
          <meshStandardMaterial
            color={emotionColor}
            emissive={emotionColor}
            emissiveIntensity={0.8}
            transparent
            opacity={0.6}
          />
        </mesh>
      )}
    </group>
  );
}

export default EmotionOrb;
