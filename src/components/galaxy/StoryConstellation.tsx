'use client';

/**
 * StoryConstellation - 3D line connecting photos in a story sequence
 *
 * Features:
 * - THREE.Line connects photos in chronological order
 * - Line color matches story's emotion theme from EMOTION_PALETTE
 * - Hover interaction highlights path and shows story title tooltip
 * - Click interaction triggers camera to follow story path
 * - Smooth opacity transitions for hover states
 */

import React, { useMemo, useRef, useState } from 'react';
import { Line as ThreeLine, Vector3 as ThreeVector3, Color, BufferGeometry } from 'three';
import { ThreeEvent, useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { EMOTION_PALETTE } from '@/lib/motion-tokens';
import { StoryConstellation as StoryConstellationType } from '@/lib/galaxy/story-data';

interface StoryConstellationProps {
  /** Story constellation data with photo positions */
  constellation: StoryConstellationType;
  /** Callback when constellation is clicked (triggers camera path following) */
  onClick?: (constellation: StoryConstellationType) => void;
  /** Whether this constellation is currently being followed by camera */
  isActive?: boolean;
}

/**
 * StoryConstellation Component
 *
 * Renders a THREE.Line that connects photos in a story sequence.
 * Line follows chronological order of photos (position_in_story).
 * Color is determined by story's emotion_theme using EMOTION_PALETTE.
 *
 * @param constellation - Story constellation data with 3D photo positions
 * @param onClick - Optional callback when constellation is clicked
 * @param isActive - Whether this constellation is currently being followed
 */
export function StoryConstellation({
  constellation,
  onClick,
  isActive = false,
}: StoryConstellationProps) {
  const lineRef = useRef<ThreeLine>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [hoverPosition, setHoverPosition] = useState<[number, number, number]>([0, 0, 0]);

  const { story, photoPositions } = constellation;

  // Get emotion color from palette
  const emotionColor = EMOTION_PALETTE[story.emotion_theme].primary;
  const threeColor = useMemo(() => new Color(emotionColor), [emotionColor]);

  /**
   * Create line geometry from photo positions
   * Points are sorted by position_in_story to ensure correct order
   */
  const lineGeometry = useMemo(() => {
    const points = photoPositions.map((pos) => new ThreeVector3(pos.position.x, pos.position.y, pos.position.z));
    const geometry = new BufferGeometry().setFromPoints(points);
    return geometry;
  }, [photoPositions]);

  /**
   * Calculate opacity based on hover and active states
   */
  const opacity = useMemo(() => {
    if (isActive) return 1.0;
    if (isHovered) return 0.9;
    return 0.6;
  }, [isHovered, isActive]);

  /**
   * Calculate line width based on state
   * Note: linewidth > 1 not supported in most WebGL implementations
   * For thicker lines, consider using THREE.TubeGeometry instead
   */
  const lineWidth = isActive ? 3 : isHovered ? 2 : 1;

  /**
   * Animate active constellation with pulsing glow effect
   */
  useFrame((state) => {
    if (lineRef.current && isActive) {
      // Subtle pulse animation for active constellation
      const pulseFactor = 0.8 + Math.sin(state.clock.elapsedTime * 2) * 0.2;
      const material = lineRef.current.material;
      if (Array.isArray(material)) {
        material.forEach((mat: any) => {
          if (mat.opacity !== undefined) mat.opacity = pulseFactor;
        });
      } else if ((material as any).opacity !== undefined) {
        (material as any).opacity = pulseFactor;
      }
    }
  });

  /**
   * Handle constellation click - trigger camera path following
   */
  const handleClick = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();

    if (onClick) {
      onClick(constellation);
    }
  };

  /**
   * Handle pointer enter - show hover state and tooltip
   */
  const handlePointerOver = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    setIsHovered(true);

    // Store hover position for tooltip placement
    if (event.point) {
      setHoverPosition([event.point.x, event.point.y, event.point.z]);
    }

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

  return (
    <group>
      {/* Main constellation line */}
      <primitive
        ref={lineRef}
        object={new ThreeLine(lineGeometry, undefined)}
        onClick={handleClick}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      >
        <lineBasicMaterial
          color={threeColor}
          transparent
          opacity={opacity}
          linewidth={lineWidth}
          toneMapped={false}
        />
      </primitive>

      {/* Glow effect line (slightly thicker, lower opacity) */}
      {(isHovered || isActive) && (
        <primitive object={new ThreeLine(lineGeometry, undefined)}>
          <lineBasicMaterial
            color={threeColor}
            transparent
            opacity={opacity * 0.3}
            linewidth={lineWidth * 2}
            toneMapped={false}
          />
        </primitive>
      )}

      {/* Tooltip on hover */}
      {isHovered && (
        <Html position={hoverPosition} center distanceFactor={10}>
          <div
            className="pointer-events-none bg-black/80 backdrop-blur-sm rounded-lg px-3 py-2 text-sm text-white shadow-lg"
            style={{
              borderLeft: `3px solid ${emotionColor}`,
              maxWidth: '200px',
            }}
          >
            <p className="font-semibold mb-1">{story.title}</p>
            <p className="text-xs text-gray-300">{story.photos.length} photos</p>
            <p className="text-xs text-gray-400 mt-1">Click to follow story</p>
          </div>
        </Html>
      )}

      {/* Connection nodes at each photo position (visual indicator) */}
      {(isHovered || isActive) &&
        photoPositions.map((pos, index) => (
          <mesh key={`${constellation.story.id}-node-${index}`} position={[pos.position.x, pos.position.y, pos.position.z]}>
            <sphereGeometry args={[3, 16, 16]} />
            <meshBasicMaterial
              color={threeColor}
              transparent
              opacity={opacity}
              toneMapped={false}
            />
          </mesh>
        ))}
    </group>
  );
}

export default StoryConstellation;
