'use client';

import { useRef, useState, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';
import type { Photo } from '@/types/photo';

interface PhotoParticleProps {
  photo: Photo;
  position: [number, number, number];
  targetPosition: [number, number, number];
  onClick: () => void;
}

function PhotoParticle({ photo, position, targetPosition, onClick }: PhotoParticleProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (!meshRef.current) return;

    // Lerp toward target position (smooth movement)
    meshRef.current.position.lerp(
      new THREE.Vector3(...targetPosition),
      0.1
    );

    // Add slight rotation for visual interest
    meshRef.current.rotation.y += 0.01;
  });

  return (
    <mesh ref={meshRef} position={position} onClick={onClick}>
      <planeGeometry args={[2, 2]} />
      <meshBasicMaterial transparent opacity={0.9}>
        <Html transform>
          <img
            src={photo.image_url}
            alt={photo.title}
            className="w-32 h-32 object-cover rounded-lg shadow-lg cursor-pointer hover:scale-110 transition-transform"
          />
        </Html>
      </meshBasicMaterial>
    </mesh>
  );
}

interface PhotoGravityProps {
  photos: Photo[];
  onPhotoClick: (photo: Photo) => void;
}

export function PhotoGravity({ photos, onPhotoClick }: PhotoGravityProps) {
  const [hoveredPhoto, setHoveredPhoto] = useState<Photo | null>(null);

  // Calculate positions based on play type clustering
  const positions = useMemo(() => {
    if (!hoveredPhoto) {
      // Default: cluster by play type
      return clusterByPlayType(photos);
    } else {
      // Hovering: similar photos move toward center
      return clusterBySimilarity(photos, hoveredPhoto);
    }
  }, [photos, hoveredPhoto]);

  return (
    <div className="w-full h-screen bg-gradient-to-b from-gray-900 to-black">
      <Canvas camera={{ position: [0, 0, 15], fov: 50 }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <pointLight position={[-10, -10, -10]} intensity={0.5} />

        {photos.slice(0, 100).map((photo, i) => ( // Limit to 100 for performance
          <PhotoParticle
            key={photo.id}
            photo={photo}
            position={positions[i].current}
            targetPosition={positions[i].target}
            onClick={() => {
              setHoveredPhoto(photo);
              onPhotoClick(photo);
            }}
          />
        ))}

        <OrbitControls 
          enableDamping 
          dampingFactor={0.05}
          minDistance={5}
          maxDistance={30}
        />
      </Canvas>

      {/* Instructions overlay */}
      <div className="absolute top-8 left-8 text-white bg-black/50 backdrop-blur px-4 py-3 rounded-lg">
        <div className="text-sm space-y-1">
          <div>🖱️ <strong>Drag</strong> to rotate</div>
          <div>🔍 <strong>Scroll</strong> to zoom</div>
          <div>👆 <strong>Click</strong> photo to view</div>
        </div>
      </div>

      {/* Hovered photo info */}
      {hoveredPhoto && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white bg-black/70 backdrop-blur px-6 py-3 rounded-lg">
          <div className="text-center">
            <div className="font-bold mb-1">{hoveredPhoto.title}</div>
            {hoveredPhoto.metadata && (
              <div className="text-sm opacity-80 capitalize">
                {hoveredPhoto.metadata.emotion} • {hoveredPhoto.metadata.play_type}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function clusterByPlayType(photos: Photo[]) {
  const playTypes = ['attack', 'block', 'dig', 'set', 'serve', 'pass', 'celebration'];
  const angleStep = (Math.PI * 2) / playTypes.length;

  return photos.map((photo) => {
    const playTypeIndex = playTypes.indexOf(photo.metadata?.play_type || '');
    const angle = playTypeIndex >= 0 ? playTypeIndex * angleStep : Math.random() * Math.PI * 2;
    const radius = 5 + Math.random() * 2;

    return {
      current: [
        Math.cos(angle) * radius,
        Math.sin(angle) * radius,
        Math.random() * 2 - 1,
      ] as [number, number, number],
      target: [
        Math.cos(angle) * radius,
        Math.sin(angle) * radius,
        Math.random() * 2 - 1,
      ] as [number, number, number],
    };
  });
}

function clusterBySimilarity(photos: Photo[], targetPhoto: Photo) {
  return photos.map((photo) => {
    const similarity = calculateSimilarity(photo, targetPhoto);
    const distance = (1 - similarity) * 10;

    const angle = Math.random() * Math.PI * 2;

    return {
      current: [
        Math.cos(angle) * distance,
        Math.sin(angle) * distance,
        Math.random() * 2 - 1,
      ] as [number, number, number],
      target: [
        Math.cos(angle) * distance,
        Math.sin(angle) * distance,
        Math.random() * 2 - 1,
      ] as [number, number, number],
    };
  });
}

function calculateSimilarity(a: Photo, b: Photo): number {
  let score = 0;

  if (!a.metadata || !b.metadata) return 0;

  if (a.metadata.emotion === b.metadata.emotion) score += 0.3;
  if (a.metadata.play_type === b.metadata.play_type) score += 0.25;
  if (a.metadata.composition === b.metadata.composition) score += 0.15;
  if (a.metadata.action_intensity === b.metadata.action_intensity) score += 0.15;
  if (a.metadata.time_of_day === b.metadata.time_of_day) score += 0.1;
  if (a.metadata.portfolio_worthy === b.metadata.portfolio_worthy) score += 0.05;

  return score;
}