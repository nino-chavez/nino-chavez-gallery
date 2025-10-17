'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { useMemo } from 'react';

export interface IsometricGridProps {
  photos: Array<{
    id: string;
    smugmug_uri: string;
    title: string;
    emotion?: string;
  }>;
  onPhotoClick?: (photoId: string) => void;
  className?: string;
}

/**
 * IsometricGrid component displays photos in a 2.5D isometric perspective
 *
 * Features:
 * - Isometric perspective using CSS transforms
 * - Photos positioned in isometric grid pattern
 * - Maintains proper spacing and depth perception
 * - Performance equivalent to 2D grid
 * - Hover effects with pseudo-3D lift
 *
 * Uses CSS transforms:
 * - rotateX(60deg) for isometric angle
 * - rotateZ(45deg) for diamond grid pattern
 * - translateZ for depth layering
 *
 * @example
 * ```tsx
 * <IsometricGrid
 *   photos={photos}
 *   onPhotoClick={(id) => handlePhotoClick(id)}
 * />
 * ```
 */
export function IsometricGrid({ photos, onPhotoClick, className = '' }: IsometricGridProps) {
  // Calculate isometric positions for photos
  const photosWithPositions = useMemo(() => {
    const gridSize = Math.ceil(Math.sqrt(photos.length));
    const spacing = 220; // px between photos

    return photos.map((photo, index) => {
      const row = Math.floor(index / gridSize);
      const col = index % gridSize;

      // Isometric projection
      // x' = (x - y) * cos(30°)
      // y' = (x + y) * sin(30°) - z
      const isoX = (col - row) * spacing * 0.866; // cos(30°) ≈ 0.866
      const isoY = (col + row) * spacing * 0.5;    // sin(30°) = 0.5

      return {
        ...photo,
        position: {
          x: isoX,
          y: isoY,
          z: -(row * 10), // Depth layering
        },
        gridPosition: { row, col },
      };
    });
  }, [photos]);

  return (
    <div className={`relative w-full h-screen overflow-hidden ${className}`}>
      {/* Isometric container with perspective */}
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{
          perspective: '2000px',
          perspectiveOrigin: '50% 50%',
        }}
      >
        <div
          className="relative"
          style={{
            transform: 'rotateX(60deg) rotateZ(45deg)',
            transformStyle: 'preserve-3d',
          }}
        >
          {photosWithPositions.map((photo, index) => (
            <motion.div
              key={photo.id}
              className="absolute cursor-pointer group"
              style={{
                left: `calc(50% + ${photo.position.x}px)`,
                top: `calc(50% + ${photo.position.y}px)`,
                transform: `translateZ(${photo.position.z}px)`,
                transformStyle: 'preserve-3d',
              }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                delay: index * 0.02,
                duration: 0.3,
                ease: 'easeOut',
              }}
              whileHover={{
                translateZ: 50,
                scale: 1.1,
                transition: { duration: 0.2 },
              }}
              onClick={() => onPhotoClick?.(photo.id)}
            >
              {/* Photo card */}
              <div
                className="relative w-48 h-48 bg-gray-800 rounded-lg overflow-hidden shadow-xl"
                style={{
                  // Counter-rotate to face camera
                  transform: 'rotateZ(-45deg) rotateX(-60deg)',
                  transformStyle: 'preserve-3d',
                }}
              >
                {/* Photo image */}
                <Image
                  src={photo.smugmug_uri}
                  alt={photo.title || 'Photo'}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 192px, 192px"
                />

                {/* Hover overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <p className="text-white text-sm font-medium truncate">
                      {photo.title}
                    </p>
                    {photo.emotion && (
                      <p className="text-gray-300 text-xs capitalize">
                        {photo.emotion}
                      </p>
                    )}
                  </div>
                </div>

                {/* Grid position indicator (dev helper) */}
                {process.env.NODE_ENV === 'development' && (
                  <div className="absolute top-1 left-1 text-xs text-white bg-black/50 px-1 rounded">
                    {photo.gridPosition.row},{photo.gridPosition.col}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Instructions overlay */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-center">
        <div className="bg-gray-900/80 backdrop-blur-sm px-4 py-2 rounded-lg">
          <p className="text-gray-300 text-sm">
            Click photos to view details • Hover for preview
          </p>
        </div>
      </div>
    </div>
  );
}
