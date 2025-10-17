'use client';

/**
 * PhotoParticle - 3D photo plane in the Emotion Galaxy
 *
 * Features:
 * - PlaneGeometry (20x20 units base size, aspect ratio preserved)
 * - Photo texture loaded from image URL
 * - MeshBasicMaterial with transparency for rounded corners
 * - Magnetic drift toward cursor (3D adaptation of MagneticFilterOrb physics)
 * - Click interaction for photo detail view
 * - Performance optimized with LOD-aware rendering
 *
 * Physics:
 * - Spring physics adapted from MagneticFilterOrb
 * - Drift effect within 100-unit radius of cursor ray
 * - Gentle spring (stiffness: 150, damping: 20) for natural motion
 * - Disabled on mobile for performance
 */

import React, { useRef, useState, useEffect, useMemo } from 'react';
import { useFrame, useThree, ThreeEvent } from '@react-three/fiber';
import { Mesh, Vector3, Vector2, Raycaster, Plane, TextureLoader, Texture } from 'three';
import { useTexture } from '@react-three/drei';
import { MOTION } from '@/lib/motion-tokens';

export interface PhotoParticleProps {
  /** Unique photo identifier */
  id: string;
  /** Position in 3D space */
  position: Vector3;
  /** Photo image URL */
  imageUrl: string;
  /** Photo aspect ratio (width/height) */
  aspectRatio?: number;
  /** Click handler for photo detail view */
  onClick?: (photoId: string, position: Vector3) => void;
  /** Enable magnetic drift toward cursor (disabled on mobile) */
  enableMagneticDrift?: boolean;
  /** Distance from camera (for LOD) */
  distanceFromCamera?: number;
}

/**
 * Spring physics configuration (adapted from MagneticFilterOrb)
 */
const SPRING_CONFIG = {
  stiffness: 150,
  damping: 20,
};

/**
 * Magnetic drift configuration
 */
const MAGNETIC_CONFIG = {
  radius: 100, // Distance from cursor to activate drift
  strength: 0.15, // Drift strength multiplier (reduced from 2D for subtlety)
};

/**
 * Photo particle size configuration
 */
const PHOTO_SIZE = {
  baseWidth: 20, // Base width in units
  baseHeight: 20, // Base height in units
  minSize: 10, // Minimum size for distant photos
  maxSize: 30, // Maximum size for close photos
};

/**
 * Apply spring physics to smoothly interpolate value toward target
 */
function applySpring(
  current: number,
  target: number,
  velocity: number,
  dt: number
): [number, number] {
  const { stiffness, damping } = SPRING_CONFIG;

  // Spring force: F = -k * x (Hooke's law)
  const springForce = -stiffness * (current - target);

  // Damping force: F = -c * v
  const dampingForce = -damping * velocity;

  // Total acceleration: a = F / m (assuming mass = 1)
  const acceleration = springForce + dampingForce;

  // Update velocity: v = v + a * dt
  const newVelocity = velocity + acceleration * dt;

  // Update position: x = x + v * dt
  const newPosition = current + newVelocity * dt;

  return [newPosition, newVelocity];
}

/**
 * PhotoParticle Component
 *
 * Renders a single photo as a 3D plane with texture.
 * Includes magnetic drift physics and click interactions.
 */
export function PhotoParticle({
  id,
  position,
  imageUrl,
  aspectRatio = 1,
  onClick,
  enableMagneticDrift = true,
  distanceFromCamera = 0,
}: PhotoParticleProps) {
  const meshRef = useRef<Mesh>(null);
  const [isHovered, setIsHovered] = useState(false);
  const { camera, gl } = useThree();

  // Magnetic drift state
  const driftOffset = useRef(new Vector3(0, 0, 0));
  const driftVelocity = useRef(new Vector3(0, 0, 0));
  const targetDriftOffset = useRef(new Vector3(0, 0, 0));

  // Mouse/cursor position in screen space
  const mousePosition = useRef(new Vector2(0, 0));

  // Raycaster for cursor ray intersection
  const raycaster = useMemo(() => new Raycaster(), []);

  // Calculate photo size based on aspect ratio
  const photoWidth = aspectRatio >= 1 ? PHOTO_SIZE.baseWidth : PHOTO_SIZE.baseWidth * aspectRatio;
  const photoHeight = aspectRatio >= 1 ? PHOTO_SIZE.baseHeight / aspectRatio : PHOTO_SIZE.baseHeight;

  // Load photo texture
  // Note: In production, this should use Next.js Image optimization
  // For now, using direct texture loading
  const texture = useTexture(imageUrl, (loadedTexture) => {
    // Texture loaded successfully
    loadedTexture.needsUpdate = true;
  });

  /**
   * Track mouse position for magnetic drift
   */
  useEffect(() => {
    if (!enableMagneticDrift) return;

    const handleMouseMove = (event: MouseEvent) => {
      // Convert to normalized device coordinates (-1 to +1)
      mousePosition.current.set(
        (event.clientX / window.innerWidth) * 2 - 1,
        -(event.clientY / window.innerHeight) * 2 + 1
      );
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [enableMagneticDrift]);

  /**
   * Animation loop - apply magnetic drift physics
   */
  useFrame((state, delta) => {
    if (!meshRef.current || !enableMagneticDrift) return;

    // Update raycaster from camera to cursor
    raycaster.setFromCamera(mousePosition.current, camera);

    // Calculate closest point on cursor ray to photo position
    const ray = raycaster.ray;
    const photoWorldPos = position.clone().add(driftOffset.current);
    const closestPoint = ray.closestPointToPoint(photoWorldPos, new Vector3());

    // Calculate distance from photo to cursor ray
    const distance = photoWorldPos.distanceTo(closestPoint);

    // Apply magnetic drift if within radius
    if (distance < MAGNETIC_CONFIG.radius) {
      // Calculate drift strength (stronger when closer)
      const strength = (MAGNETIC_CONFIG.radius - distance) / MAGNETIC_CONFIG.radius;

      // Calculate drift direction (toward cursor ray intersection point)
      const driftDirection = closestPoint.clone().sub(photoWorldPos).normalize();

      // Set target drift offset (scaled by strength)
      targetDriftOffset.current = driftDirection.multiplyScalar(
        strength * MAGNETIC_CONFIG.strength * 10
      );
    } else {
      // Reset drift when outside magnetic radius
      targetDriftOffset.current.set(0, 0, 0);
    }

    // Apply spring physics to drift offset (smooth interpolation)
    const [newX, newVelX] = applySpring(
      driftOffset.current.x,
      targetDriftOffset.current.x,
      driftVelocity.current.x,
      delta
    );
    const [newY, newVelY] = applySpring(
      driftOffset.current.y,
      targetDriftOffset.current.y,
      driftVelocity.current.y,
      delta
    );
    const [newZ, newVelZ] = applySpring(
      driftOffset.current.z,
      targetDriftOffset.current.z,
      driftVelocity.current.z,
      delta
    );

    driftOffset.current.set(newX, newY, newZ);
    driftVelocity.current.set(newVelX, newVelY, newVelZ);

    // Apply drift to mesh position
    meshRef.current.position.copy(position.clone().add(driftOffset.current));

    // Make photo face camera (billboard effect)
    meshRef.current.lookAt(camera.position);
  });

  /**
   * Handle photo click - trigger detail view
   */
  const handleClick = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();

    if (onClick) {
      onClick(id, position);
    }
  };

  /**
   * Handle pointer hover
   */
  const handlePointerOver = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    setIsHovered(true);
    if (document.body.style) {
      document.body.style.cursor = 'pointer';
    }
  };

  /**
   * Handle pointer leave
   */
  const handlePointerOut = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    setIsHovered(false);
    if (document.body.style) {
      document.body.style.cursor = 'auto';
    }
  };

  // Calculate opacity based on distance for LOD
  const opacity = useMemo(() => {
    if (distanceFromCamera < 200) return 1.0;
    if (distanceFromCamera < 400) return 0.8;
    return 0.5;
  }, [distanceFromCamera]);

  return (
    <mesh
      ref={meshRef}
      position={position}
      onClick={handleClick}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
    >
      {/* PlaneGeometry for photo - size preserves aspect ratio */}
      <planeGeometry args={[photoWidth, photoHeight]} />

      {/* MeshBasicMaterial with photo texture */}
      <meshBasicMaterial
        map={texture}
        transparent
        opacity={isHovered ? 1.0 : opacity}
        depthWrite={true}
        toneMapped={false}
      />
    </mesh>
  );
}

export default PhotoParticle;
