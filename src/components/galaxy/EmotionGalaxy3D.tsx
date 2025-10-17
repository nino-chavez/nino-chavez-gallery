'use client';

/**
 * EmotionGalaxy3D - 3D visualization component for displaying photos in an emotion galaxy
 * Photos cluster around emotion orbs in 3D space
 *
 * Features:
 * - WebGL-based 3D rendering using Three.js
 * - 6 emotion orbs positioned in spherical formation
 * - 100-500 photo particles with LOD optimization
 * - Magnetic drift physics on photo interaction
 * - Camera flight animations to orbs and photos (GSAP)
 * - Story constellations connecting photos in narrative sequences
 * - Keyboard navigation (arrow keys + Enter)
 * - Photo detail overlay on click
 * - OrbitControls for camera navigation
 * - Graceful fallback to 2D grid if WebGL unsupported
 * - Performance optimized for 500+ photos (60fps target)
 */

import React, { Suspense, useRef, useState, useCallback, useEffect, useMemo } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { Vector3 } from 'three';
import { useWebGLSupport } from '@/hooks/useWebGLSupport';
import { EmotionOrb } from './EmotionOrb';
import { StoryConstellation } from './StoryConstellation';
import { ViewToggle, ViewMode } from './ViewToggle';
import { PhotoParticleSystem, Photo as ParticlePhoto } from '@/components/gallery/PhotoParticleSystem';
import { PhotoDetailOverlay, PhotoDetailData } from '@/components/gallery/PhotoDetailOverlay';
import { IsometricGrid } from '@/components/gallery/IsometricGrid';
import { PortfolioGrid } from '@/components/portfolio/PortfolioGrid';
import type { Photo } from '@/types/photo';
import { CameraFlightController } from '@/lib/galaxy/camera-flights';
import { positionPhotosInGalaxy } from '@/lib/galaxy/spatial-positioning';
import {
  getStoryConstellations,
  type StoryConstellation as StoryConstellationType,
} from '@/lib/galaxy/story-data';
// OrbitControls type from drei (uses any for flexibility)

interface EmotionGalaxy3DProps {
  /** Array of photos to display in the galaxy */
  photos?: Photo[];
  /** Callback when photo is clicked (optional) */
  onPhotoClick?: (photoId: string) => void;
  /** Fallback component if WebGL not supported */
  fallbackComponent?: React.ReactNode;
  /** Enable magnetic drift effect (default: true, disabled on mobile) */
  enableMagneticDrift?: boolean;
  /** Maximum number of active particles (default: 500) */
  maxActiveParticles?: number;
  /** Enable story constellations (default: true) */
  enableStoryConstellations?: boolean;
}

// Emotion types in order for sphere positioning and keyboard navigation
const EMOTIONS = ['triumph', 'focus', 'intensity', 'determination', 'excitement', 'serenity'] as const;
type EmotionType = typeof EMOTIONS[number];

/**
 * Calculate spherical positions for 6 orbs evenly distributed in 3D space
 * Uses spherical coordinates (θ, φ) converted to Cartesian (x, y, z)
 *
 * Distribution strategy:
 * - Place orbs at vertices of an octahedron for even spacing
 * - Radius of 300 units from origin
 * - Ensures good visibility from default camera position at z: 500
 */
function calculateOrbPositions(radius: number = 300): Array<[number, number, number]> {
  // Octahedron vertices provide nice even distribution for 6 points
  // Top, bottom, and 4 around the equator
  return [
    [0, radius, 0],           // Top (triumph)
    [radius, 0, 0],           // Right (focus)
    [0, 0, radius],           // Front (intensity)
    [-radius, 0, 0],          // Left (determination)
    [0, 0, -radius],          // Back (excitement)
    [0, -radius, 0],          // Bottom (serenity)
  ];
}

/**
 * Scene component - Contains the 3D scene contents
 * Separated for better Suspense handling
 */
function Scene({
  photos,
  onPhotoParticleClick,
  onOrbClick,
  onConstellationClick,
  enableMagneticDrift,
  maxActiveParticles,
  selectedEmotionIndex,
  storyConstellations,
  activeConstellationId,
}: {
  photos: ParticlePhoto[];
  onPhotoParticleClick: (photoId: string, position: Vector3) => void;
  onOrbClick: (emotion: EmotionType, position: Vector3) => void;
  onConstellationClick: (constellation: StoryConstellationType) => void;
  enableMagneticDrift: boolean;
  maxActiveParticles: number;
  selectedEmotionIndex: number | null;
  storyConstellations: StoryConstellationType[];
  activeConstellationId: string | null;
}) {
  const controlsRef = useRef<any | null>(null);
  const flightControllerRef = useRef<CameraFlightController | null>(null);
  const { camera } = useThree();

  // Calculate orb positions
  const orbPositions = calculateOrbPositions(300);

  /**
   * Initialize camera flight controller
   */
  useEffect(() => {
    if (camera && !flightControllerRef.current) {
      flightControllerRef.current = new CameraFlightController(
        camera,
        controlsRef.current || undefined
      );
    }

    // Update controls reference when available
    if (controlsRef.current && flightControllerRef.current) {
      flightControllerRef.current.setControls(controlsRef.current);
    }
  }, [camera]);

  /**
   * Handle orb click - trigger camera flight to orb
   */
  const handleOrbClick = useCallback((emotion: EmotionType) => {
    const emotionIndex = EMOTIONS.indexOf(emotion);
    const orbPosition = new Vector3(...orbPositions[emotionIndex]);

    // Trigger camera flight animation
    if (flightControllerRef.current) {
      flightControllerRef.current.flyToEmotion(orbPosition);
    }

    // Notify parent component
    onOrbClick(emotion, orbPosition);
  }, [orbPositions, onOrbClick]);

  /**
   * Handle constellation click - trigger camera to follow story path
   */
  const handleConstellationClick = useCallback((constellation: StoryConstellationType) => {
    if (flightControllerRef.current) {
      // Extract photo positions from constellation
      const photoPositions = constellation.photoPositions.map((pos) => pos.position);

      // Follow story path
      flightControllerRef.current.followStoryPath(
        photoPositions,
        2000, // Pause 2 seconds at each photo
        (index) => {
          console.log(`Story: Reached photo ${index + 1} of ${photoPositions.length}`);
        },
        () => {
          console.log(`Story complete: ${constellation.story.title}`);
        }
      );
    }

    // Notify parent component
    onConstellationClick(constellation);
  }, [onConstellationClick]);

  return (
    <>
      {/* Camera setup - positioned at z: 500 as per requirements */}
      <PerspectiveCamera
        makeDefault
        position={[0, 0, 500]}
        fov={75}
        near={0.1}
        far={2000}
      />

      {/* OrbitControls for camera navigation */}
      <OrbitControls
        ref={controlsRef}
        enableDamping
        dampingFactor={0.05}
        minDistance={100}
        maxDistance={1000}
        enablePan
        enableZoom
        enableRotate
        zoomSpeed={0.8}
        rotateSpeed={0.5}
        maxPolarAngle={Math.PI}
        minPolarAngle={0}
      />

      {/* Lighting - reduced ambient to let emotion orbs be primary light sources */}
      <ambientLight intensity={0.3} />
      <directionalLight position={[10, 10, 5]} intensity={0.5} />

      {/* Emotion Orbs - 6 orbs positioned in spherical formation */}
      {EMOTIONS.map((emotion, index) => (
        <EmotionOrb
          key={emotion}
          emotion={emotion}
          position={orbPositions[index]}
          onClick={handleOrbClick}
          radius={100}
          selected={selectedEmotionIndex === index}
        />
      ))}

      {/* Photo Particle System - 100-500 photos clustered around orbs */}
      {photos.length > 0 && (
        <PhotoParticleSystem
          photos={photos}
          onPhotoClick={onPhotoParticleClick}
          enableMagneticDrift={enableMagneticDrift}
          maxActiveParticles={maxActiveParticles}
        />
      )}

      {/* Story Constellations - connecting photos in narrative sequences */}
      {storyConstellations.map((constellation) => (
        <StoryConstellation
          key={constellation.story.id}
          constellation={constellation}
          onClick={handleConstellationClick}
          isActive={activeConstellationId === constellation.story.id}
        />
      ))}
    </>
  );
}

/**
 * Loading fallback component
 */
function LoadingFallback() {
  return (
    <div className="w-full h-full flex items-center justify-center bg-gray-950">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-accent-primary border-t-transparent" />
        <p className="mt-4 text-gray-400">Loading 3D Galaxy...</p>
      </div>
    </div>
  );
}

/**
 * WebGL unsupported warning component
 */
function WebGLUnsupportedWarning() {
  return (
    <div className="w-full h-full flex items-center justify-center bg-gray-950 p-8">
      <div className="max-w-md text-center">
        <svg
          className="w-16 h-16 mx-auto mb-4 text-yellow-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
        <h3 className="text-xl font-semibold text-gray-100 mb-2">
          3D View Not Supported
        </h3>
        <p className="text-gray-400 mb-4">
          Your browser doesn't support WebGL, which is required for the 3D emotion galaxy visualization.
        </p>
        <p className="text-sm text-gray-500">
          Please try using a modern browser like Chrome, Firefox, or Safari.
        </p>
      </div>
    </div>
  );
}

/**
 * Main EmotionGalaxy3D component
 * Handles WebGL detection, photo rendering, detail overlay, and camera animations
 */
export function EmotionGalaxy3D({
  photos = [],
  onPhotoClick,
  fallbackComponent,
  enableMagneticDrift = true,
  maxActiveParticles = 500,
  enableStoryConstellations = true,
}: EmotionGalaxy3DProps) {
  const webglSupport = useWebGLSupport();

  // View mode state with localStorage persistence
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('galaxy-view-mode');
      return (saved as ViewMode) || '3d';
    }
    return '3d';
  });

  const [selectedPhoto, setSelectedPhoto] = useState<PhotoDetailData | null>(null);
  const [selectedEmotionIndex, setSelectedEmotionIndex] = useState<number | null>(null);
  const [storyConstellations, setStoryConstellations] = useState<StoryConstellationType[]>([]);
  const [activeConstellationId, setActiveConstellationId] = useState<string | null>(null);
  const cameraFlightControllerRef = useRef<CameraFlightController | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  // Save view mode to localStorage when it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('galaxy-view-mode', viewMode);
    }
  }, [viewMode]);

  // Calculate orb positions (needed for keyboard navigation)
  const orbPositions = calculateOrbPositions(300);

  /**
   * Compute photo positions in 3D space using spatial-positioning algorithm
   * Creates a map of photoId -> Vector3 position for story constellation lookups
   */
  const photoPositionMap = useMemo(() => {
    if (photos.length === 0) return new Map<string, Vector3>();

    // Convert photos to spatial data format
    const photoData = photos.map((photo) => ({
      id: photo.id,
      emotion: photo.metadata?.emotion || 'focus',
      emotional_impact: photo.metadata?.emotional_impact || 5,
      image_url: photo.image_url,
      title: photo.title,
    }));

    // Calculate positions for all photos
    const photoPositions = positionPhotosInGalaxy(photoData);

    // Create map of photoId -> Vector3
    const map = new Map<string, Vector3>();
    photoPositions.forEach((photoPos) => {
      map.set(photoPos.id, photoPos.position);
    });

    return map;
  }, [photos]);

  /**
   * Fetch and set up story constellations
   */
  useEffect(() => {
    if (!enableStoryConstellations || photos.length === 0 || photoPositionMap.size === 0) return;

    // Fetch story constellations
    getStoryConstellations(photoPositionMap, true)
      .then((constellations) => {
        setStoryConstellations(constellations);
        console.log(`Loaded ${constellations.length} story constellations`);
      })
      .catch((error) => {
        console.error('Failed to load story constellations:', error);
      });
  }, [photos, photoPositionMap, enableStoryConstellations]);

  /**
   * Handle photo click in 3D scene
   * Opens detail overlay and triggers camera zoom animation
   */
  const handlePhotoParticleClick = useCallback(
    (photoId: string, position: Vector3) => {
      // Find photo data
      const photo = photos.find((p) => p.id === photoId);
      if (!photo) return;

      // Trigger camera flight to photo
      if (cameraFlightControllerRef.current) {
        cameraFlightControllerRef.current.flyToPhoto(position, () => {
          // Open detail overlay after camera reaches photo
          const photoDetail: PhotoDetailData = {
            id: photo.id,
            image_url: photo.image_url,
            title: photo.title,
            emotion: photo.metadata?.emotion || 'focus',
            emotional_impact: photo.metadata?.emotional_impact || 5,
            position: position,
          };
          setSelectedPhoto(photoDetail);
        });
      } else {
        // Fallback: show overlay immediately if controller not ready
        const photoDetail: PhotoDetailData = {
          id: photo.id,
          image_url: photo.image_url,
          title: photo.title,
          emotion: photo.metadata?.emotion || 'focus',
          emotional_impact: photo.metadata?.emotional_impact || 5,
          position: position,
        };
        setSelectedPhoto(photoDetail);
      }

      // Call optional callback
      if (onPhotoClick) {
        onPhotoClick(photoId);
      }
    },
    [photos, onPhotoClick]
  );

  /**
   * Handle orb click - trigger camera flight and update selection
   */
  const handleOrbClick = useCallback((emotion: EmotionType, position: Vector3) => {
    const emotionIndex = EMOTIONS.indexOf(emotion);
    setSelectedEmotionIndex(emotionIndex);
  }, []);

  /**
   * Handle constellation click - trigger camera to follow story path
   */
  const handleConstellationClick = useCallback((constellation: StoryConstellationType) => {
    setActiveConstellationId(constellation.story.id);

    // Clear active constellation after story completes
    setTimeout(() => {
      setActiveConstellationId(null);
    }, constellation.photoPositions.length * 3000); // Approximate duration
  }, []);

  /**
   * Close photo detail overlay and reset camera
   */
  const handleCloseDetail = useCallback(() => {
    setSelectedPhoto(null);

    // Return camera to default view
    if (cameraFlightControllerRef.current) {
      cameraFlightControllerRef.current.resetCamera();
    }
  }, []);

  /**
   * Reset camera view (button or Escape key)
   */
  const handleResetView = useCallback(() => {
    if (cameraFlightControllerRef.current) {
      cameraFlightControllerRef.current.resetCamera();
    }
    setSelectedEmotionIndex(null);
    setSelectedPhoto(null);
    setActiveConstellationId(null);
  }, []);

  /**
   * Keyboard navigation for orbs and story path control
   * Arrow keys: cycle through emotions
   * Enter: fly to selected emotion
   * Escape: reset camera view / cancel story path
   * Spacebar: pause/resume story path (future enhancement)
   */
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ignore keyboard input when detail overlay is open (handled by overlay)
      if (selectedPhoto) return;

      switch (event.key) {
        case 'ArrowRight':
        case 'ArrowDown':
          event.preventDefault();
          setSelectedEmotionIndex((prev) => {
            const next = prev === null ? 0 : (prev + 1) % EMOTIONS.length;
            return next;
          });
          break;

        case 'ArrowLeft':
        case 'ArrowUp':
          event.preventDefault();
          setSelectedEmotionIndex((prev) => {
            const next = prev === null ? EMOTIONS.length - 1 : (prev - 1 + EMOTIONS.length) % EMOTIONS.length;
            return next;
          });
          break;

        case 'Enter':
          event.preventDefault();
          if (selectedEmotionIndex !== null) {
            const emotion = EMOTIONS[selectedEmotionIndex];
            const orbPosition = new Vector3(...orbPositions[selectedEmotionIndex]);

            // Trigger camera flight to selected orb
            if (cameraFlightControllerRef.current) {
              cameraFlightControllerRef.current.flyToEmotion(orbPosition);
            }
          }
          break;

        case 'Escape':
          event.preventDefault();
          handleResetView();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedEmotionIndex, selectedPhoto, orbPositions, handleResetView]);

  /**
   * Store camera flight controller reference when canvas loads
   */
  const handleCanvasCreated = useCallback(({ camera, gl }: any) => {
    // Camera flight controller will be created in Scene component
    // This is just for reference storage at parent level
  }, []);

  // Convert full Photo type to simplified ParticlePhoto for 3D scene
  const particlePhotos: ParticlePhoto[] = useMemo(() => {
    return photos.map(photo => ({
      id: photo.id,
      image_url: photo.image_url,
      title: photo.title,
      emotion: photo.metadata?.emotion || 'focus',
      emotional_impact: photo.metadata?.emotional_impact || 5,
    }));
  }, [photos]);

  // Detect mobile for disabling magnetic drift
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const magneticDriftEnabled = enableMagneticDrift && !isMobile;

  // Show loading state while checking WebGL support
  if (webglSupport === null) {
    return <LoadingFallback />;
  }

  // Show fallback if WebGL not supported and trying to use 3D mode
  if (!webglSupport && viewMode === '3d') {
    return (
      <div className="relative w-full h-full">
        {fallbackComponent ? <>{fallbackComponent}</> : <WebGLUnsupportedWarning />}
        {/* View toggle still accessible to switch to 2D/2.5D */}
        <ViewToggle
          currentMode={viewMode}
          onModeChange={setViewMode}
          className="absolute top-4 left-1/2 -translate-x-1/2"
        />
      </div>
    );
  }

  // Render 2D Grid view
  if (viewMode === '2d') {
    return (
      <div className="relative w-full h-full min-h-[600px] bg-gray-950">
        <PortfolioGrid
          photos={photos}
        />
        <ViewToggle
          currentMode={viewMode}
          onModeChange={setViewMode}
          className="absolute top-4 left-1/2 -translate-x-1/2 z-50"
        />
      </div>
    );
  }

  // Render 2.5D Isometric view
  if (viewMode === '2.5d') {
    return (
      <div className="relative w-full h-full min-h-[600px] bg-gray-950">
        <IsometricGrid
          photos={photos.map(p => ({
            id: p.id,
            smugmug_uri: p.image_url,
            title: p.title || '',
            emotion: p.metadata?.emotion || 'focus',
          }))}
          onPhotoClick={(id) => {
            const photo = photos.find(p => p.id === id);
            if (photo) {
              setSelectedPhoto({
                id: photo.id,
                image_url: photo.image_url,
                title: photo.title,
                emotion: photo.metadata?.emotion || 'focus',
                emotional_impact: photo.metadata?.emotional_impact || 5,
                position: new Vector3(0, 0, 0),
              });
            }
            onPhotoClick?.(id);
          }}
        />
        <ViewToggle
          currentMode={viewMode}
          onModeChange={setViewMode}
          className="absolute top-4 left-1/2 -translate-x-1/2 z-50"
        />
        <PhotoDetailOverlay photo={selectedPhoto} onClose={() => setSelectedPhoto(null)} />
      </div>
    );
  }

  // Render 3D scene (default)
  return (
    <div ref={canvasRef} className="relative w-full h-full min-h-[600px] bg-gray-950">
      <Canvas
        dpr={[1, 2]} // Device pixel ratio - optimize for retina displays
        performance={{ min: 0.5 }} // Performance degradation threshold
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: 'high-performance',
        }}
        className="w-full h-full"
        onCreated={handleCanvasCreated}
      >
        <Suspense fallback={null}>
          <Scene
            photos={particlePhotos}
            onPhotoParticleClick={handlePhotoParticleClick}
            onOrbClick={handleOrbClick}
            onConstellationClick={handleConstellationClick}
            enableMagneticDrift={magneticDriftEnabled}
            maxActiveParticles={maxActiveParticles}
            selectedEmotionIndex={selectedEmotionIndex}
            storyConstellations={storyConstellations}
            activeConstellationId={activeConstellationId}
          />
        </Suspense>
      </Canvas>

      {/* View Toggle - positioned at top center */}
      <ViewToggle
        currentMode={viewMode}
        onModeChange={setViewMode}
        className="absolute top-4 left-1/2 -translate-x-1/2 z-40"
      />

      {/* Reset View button */}
      <button
        onClick={handleResetView}
        className="absolute top-4 right-4 px-4 py-2 bg-gray-800/80 hover:bg-gray-700 backdrop-blur-sm rounded-lg text-sm text-gray-300 transition-colors flex items-center gap-2"
        aria-label="Reset camera view"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
        </svg>
        Reset View
      </button>

      {/* Instructions overlay */}
      <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-sm rounded-lg px-4 py-2 text-sm text-gray-300 pointer-events-none">
        <p className="font-medium mb-1">Controls:</p>
        <ul className="space-y-0.5 text-xs">
          <li>• Drag to rotate</li>
          <li>• Scroll to zoom</li>
          <li>• Right-click + drag to pan</li>
          <li>• Click orbs or photos to explore</li>
          <li>• Click story lines to follow narratives</li>
          <li>• Arrow keys + Enter for keyboard navigation</li>
          <li>• Escape to reset view</li>
        </ul>
      </div>

      {/* Stats overlay (shows photo count and story count) */}
      {photos.length > 0 && (
        <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-sm rounded-lg px-3 py-1.5 text-xs text-gray-400 pointer-events-none">
          <p>{photos.length} photos in galaxy</p>
          {storyConstellations.length > 0 && (
            <p className="mt-1">{storyConstellations.length} story constellations</p>
          )}
        </div>
      )}

      {/* Selected emotion indicator (keyboard navigation) */}
      {selectedEmotionIndex !== null && !selectedPhoto && (
        <div className="absolute top-16 left-4 bg-black/60 backdrop-blur-sm rounded-lg px-3 py-1.5 text-xs text-gray-300 pointer-events-none">
          Selected: <span className="font-semibold capitalize">{EMOTIONS[selectedEmotionIndex]}</span>
          <span className="ml-2 text-gray-500">(Press Enter to fly)</span>
        </div>
      )}

      {/* Active story indicator */}
      {activeConstellationId && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-sm rounded-lg px-4 py-2 text-sm text-white shadow-lg pointer-events-none">
          <p className="font-semibold">Following Story</p>
          <p className="text-xs text-gray-400 mt-1">Press Escape to cancel</p>
        </div>
      )}

      {/* Photo detail overlay (2D over 3D scene) */}
      <PhotoDetailOverlay photo={selectedPhoto} onClose={handleCloseDetail} />
    </div>
  );
}

export default EmotionGalaxy3D;
