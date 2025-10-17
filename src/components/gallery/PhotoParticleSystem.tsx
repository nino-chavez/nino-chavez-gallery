'use client';

/**
 * PhotoParticleSystem - Manager for rendering 100-500 photo particles efficiently
 *
 * Performance Optimizations:
 * - LOD (Level of Detail) system based on distance from camera
 * - Frustum culling (built into Three.js) excludes off-screen photos
 * - Distance-based rendering: Only render photos within view distance
 * - Lazy loading with Suspense for photo textures
 * - useMemo and useCallback for expensive calculations
 * - Render budget: limit active particles per frame
 *
 * LOD Levels:
 * - < 200 units: High detail (full opacity, magnetic drift enabled)
 * - 200-400 units: Medium detail (reduced opacity, magnetic drift enabled)
 * - 400-600 units: Low detail (low opacity, no magnetic drift)
 * - > 600 units: Culled (not rendered)
 */

import React, { useMemo, useState, useCallback } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Vector3 } from 'three';
import { PhotoParticle } from './PhotoParticle';
import { positionPhotosInGalaxy, PhotoSpatialData, PhotoPosition } from '@/lib/galaxy/spatial-positioning';

export interface Photo {
  id: string;
  image_url: string;
  emotion: 'triumph' | 'focus' | 'intensity' | 'determination' | 'excitement' | 'serenity';
  emotional_impact: number; // 0-10 scale
  title?: string;
  aspectRatio?: number; // width/height
}

export interface PhotoParticleSystemProps {
  /** Array of photos to display in the galaxy */
  photos: Photo[];
  /** Callback when photo is clicked */
  onPhotoClick?: (photoId: string, position: Vector3) => void;
  /** Maximum number of photos to render per frame (performance budget) */
  maxActiveParticles?: number;
  /** Maximum render distance (photos beyond this are culled) */
  maxRenderDistance?: number;
  /** Enable magnetic drift effect (can be disabled for performance) */
  enableMagneticDrift?: boolean;
}

/**
 * LOD configuration
 */
const LOD_CONFIG = {
  HIGH: {
    maxDistance: 200,
    enableMagneticDrift: true,
    opacity: 1.0,
  },
  MEDIUM: {
    maxDistance: 400,
    enableMagneticDrift: true,
    opacity: 0.8,
  },
  LOW: {
    maxDistance: 600,
    enableMagneticDrift: false,
    opacity: 0.5,
  },
};

/**
 * PhotoParticleSystem Component
 *
 * Manages rendering of 100-500+ photo particles with performance optimizations.
 * Implements LOD, frustum culling, and render budgeting for 60fps on desktop.
 */
export function PhotoParticleSystem({
  photos,
  onPhotoClick,
  maxActiveParticles = 500,
  maxRenderDistance = LOD_CONFIG.LOW.maxDistance,
  enableMagneticDrift = true,
}: PhotoParticleSystemProps) {
  const { camera } = useThree();
  const [visiblePhotoIds, setVisiblePhotoIds] = useState<Set<string>>(new Set());

  /**
   * Convert photos to spatial data for positioning algorithm
   */
  const photoSpatialData: PhotoSpatialData[] = useMemo(() => {
    return photos.map((photo) => ({
      id: photo.id,
      emotion: photo.emotion,
      emotional_impact: photo.emotional_impact,
      image_url: photo.image_url,
      title: photo.title,
    }));
  }, [photos]);

  /**
   * Calculate 3D positions for all photos using spatial positioning algorithm
   * This is expensive, so we memoize it
   */
  const photoPositions: PhotoPosition[] = useMemo(() => {
    return positionPhotosInGalaxy(photoSpatialData);
  }, [photoSpatialData]);

  /**
   * Create lookup map for photo metadata by ID
   */
  const photoMetadataMap = useMemo(() => {
    const map = new Map<string, Photo>();
    photos.forEach((photo) => {
      map.set(photo.id, photo);
    });
    return map;
  }, [photos]);

  /**
   * Animation loop - update visible photos based on camera position
   * Implements LOD and distance culling
   */
  useFrame(() => {
    const cameraPos = camera.position;
    const newVisibleIds = new Set<string>();
    let particleCount = 0;

    // Sort photos by distance from camera (closest first)
    const sortedByDistance = [...photoPositions].sort((a, b) => {
      const distA = a.position.distanceTo(cameraPos);
      const distB = b.position.distanceTo(cameraPos);
      return distA - distB;
    });

    // Select photos to render based on distance and budget
    for (const photoPos of sortedByDistance) {
      const distance = photoPos.position.distanceTo(cameraPos);

      // Cull photos beyond max render distance
      if (distance > maxRenderDistance) {
        continue;
      }

      // Stop adding photos if we've hit the render budget
      if (particleCount >= maxActiveParticles) {
        break;
      }

      newVisibleIds.add(photoPos.id);
      particleCount++;
    }

    // Update visible photos state (only if changed to avoid re-renders)
    if (newVisibleIds.size !== visiblePhotoIds.size ||
        ![...newVisibleIds].every(id => visiblePhotoIds.has(id))) {
      setVisiblePhotoIds(newVisibleIds);
    }
  });

  /**
   * Handle photo click with callback
   */
  const handlePhotoClick = useCallback(
    (photoId: string, position: Vector3) => {
      if (onPhotoClick) {
        onPhotoClick(photoId, position);
      }
    },
    [onPhotoClick]
  );

  /**
   * Determine LOD level for a photo based on distance from camera
   */
  const getLODLevel = useCallback((position: Vector3): keyof typeof LOD_CONFIG => {
    const distance = position.distanceTo(camera.position);

    if (distance < LOD_CONFIG.HIGH.maxDistance) return 'HIGH';
    if (distance < LOD_CONFIG.MEDIUM.maxDistance) return 'MEDIUM';
    return 'LOW';
  }, [camera]);

  /**
   * Render visible photos with LOD-based settings
   */
  const renderPhotoParticles = useMemo(() => {
    return photoPositions
      .filter((photoPos) => visiblePhotoIds.has(photoPos.id))
      .map((photoPos) => {
        const photo = photoMetadataMap.get(photoPos.id);
        if (!photo) return null;

        const lodLevel = getLODLevel(photoPos.position);
        const lodConfig = LOD_CONFIG[lodLevel];
        const distance = photoPos.position.distanceTo(camera.position);

        return (
          <PhotoParticle
            key={photoPos.id}
            id={photoPos.id}
            position={photoPos.position}
            imageUrl={photo.image_url}
            aspectRatio={photo.aspectRatio || 1}
            onClick={handlePhotoClick}
            enableMagneticDrift={enableMagneticDrift && lodConfig.enableMagneticDrift}
            distanceFromCamera={distance}
          />
        );
      });
  }, [
    photoPositions,
    visiblePhotoIds,
    photoMetadataMap,
    getLODLevel,
    handlePhotoClick,
    enableMagneticDrift,
    camera,
  ]);

  return <>{renderPhotoParticles}</>;
}

export default PhotoParticleSystem;
