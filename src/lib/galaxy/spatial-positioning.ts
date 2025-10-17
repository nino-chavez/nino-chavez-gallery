/**
 * Spatial Positioning Algorithm for Emotion Galaxy 3D
 *
 * Positions photos in 3D space based on their emotion and intensity score.
 * Photos cluster around their corresponding emotion orb, with higher intensity
 * photos positioned closer to the orb center.
 *
 * Distribution Strategy:
 * - Distance from orb center = (10 - emotional_impact) * 50 units
 * - Higher impact photos (e.g., 9/10) are closer to orb center
 * - Lower impact photos (e.g., 3/10) are farther from orb center
 * - Random angular distribution (θ, φ) prevents overlap
 * - Small random offset for organic appearance
 */

import { Vector3 } from 'three';

type EmotionType = 'triumph' | 'focus' | 'intensity' | 'determination' | 'excitement' | 'serenity';

/**
 * Photo metadata required for spatial positioning
 */
export interface PhotoSpatialData {
  id: string;
  emotion: EmotionType;
  emotional_impact: number; // 0-10 scale
  image_url: string;
  title?: string;
}

/**
 * 3D position result with additional metadata
 */
export interface PhotoPosition {
  id: string;
  position: Vector3;
  emotion: EmotionType;
  distance: number; // Distance from orb center
  photoData: PhotoSpatialData;
}

/**
 * Orb positions in 3D space (from EmotionGalaxy3D.tsx)
 * These match the octahedron vertex positions at 300-unit radius
 */
export const EMOTION_ORB_POSITIONS: Record<EmotionType, Vector3> = {
  triumph: new Vector3(0, 300, 0),        // Top
  focus: new Vector3(300, 0, 0),          // Right
  intensity: new Vector3(0, 0, 300),      // Front
  determination: new Vector3(-300, 0, 0), // Left
  excitement: new Vector3(0, 0, -300),    // Back
  serenity: new Vector3(0, -300, 0),      // Bottom
};

/**
 * Convert spherical coordinates to Cartesian coordinates
 *
 * @param radius - Distance from origin
 * @param theta - Polar angle (0 to PI)
 * @param phi - Azimuthal angle (0 to 2*PI)
 * @returns Vector3 in Cartesian coordinates
 */
function sphericalToCartesian(radius: number, theta: number, phi: number): Vector3 {
  const x = radius * Math.sin(theta) * Math.cos(phi);
  const y = radius * Math.cos(theta);
  const z = radius * Math.sin(theta) * Math.sin(phi);
  return new Vector3(x, y, z);
}

/**
 * Generate random spherical angles for even distribution
 * Uses golden ratio spiral for better distribution
 *
 * @param index - Photo index in cluster
 * @param total - Total photos in cluster
 * @returns [theta, phi] angles in radians
 */
function generateSphericalAngles(index: number, total: number): [number, number] {
  // Golden ratio for spiral distribution
  const goldenRatio = (1 + Math.sqrt(5)) / 2;
  const goldenAngle = 2 * Math.PI / (goldenRatio * goldenRatio);

  // Calculate theta (polar angle) using Fibonacci lattice
  const theta = Math.acos(1 - 2 * (index + 0.5) / total);

  // Calculate phi (azimuthal angle) using golden angle
  const phi = (index * goldenAngle) % (2 * Math.PI);

  return [theta, phi];
}

/**
 * Calculate photo position based on emotion and intensity
 *
 * Formula:
 * - distance = (10 - emotional_impact) * 50
 * - position = orb_position + spherical_offset(distance, theta, phi)
 * - Small random jitter to prevent exact overlaps
 *
 * @param photo - Photo metadata with emotion and impact score
 * @param index - Photo index within its emotion cluster (for distribution)
 * @param totalInCluster - Total photos in this emotion cluster
 * @returns PhotoPosition with 3D coordinates
 */
export function calculatePhotoPosition(
  photo: PhotoSpatialData,
  index: number = 0,
  totalInCluster: number = 1
): PhotoPosition {
  // Get emotion orb position
  const orbPosition = EMOTION_ORB_POSITIONS[photo.emotion];

  // Calculate distance from orb center based on emotional impact
  // Higher impact (e.g., 9/10) = closer to center (50 units)
  // Lower impact (e.g., 3/10) = farther from center (350 units)
  const baseDistance = (10 - photo.emotional_impact) * 50;

  // Add small random variation to distance (±10 units)
  const distance = baseDistance + (Math.random() - 0.5) * 20;

  // Generate spherical angles for even distribution
  const [theta, phi] = generateSphericalAngles(index, totalInCluster);

  // Convert to Cartesian offset
  const offset = sphericalToCartesian(distance, theta, phi);

  // Add small random jitter (±5 units) to prevent exact overlaps
  const jitter = new Vector3(
    (Math.random() - 0.5) * 10,
    (Math.random() - 0.5) * 10,
    (Math.random() - 0.5) * 10
  );

  // Calculate final position
  const position = orbPosition.clone().add(offset).add(jitter);

  return {
    id: photo.id,
    position,
    emotion: photo.emotion,
    distance: baseDistance,
    photoData: photo,
  };
}

/**
 * Position multiple photos around their emotion orbs
 * Ensures even distribution and prevents overlapping
 *
 * @param photos - Array of photos to position
 * @returns Array of photo positions with 3D coordinates
 */
export function positionPhotosInGalaxy(photos: PhotoSpatialData[]): PhotoPosition[] {
  // Group photos by emotion for proper distribution
  const photosByEmotion = photos.reduce((acc, photo) => {
    if (!acc[photo.emotion]) {
      acc[photo.emotion] = [];
    }
    acc[photo.emotion].push(photo);
    return acc;
  }, {} as Record<EmotionType, PhotoSpatialData[]>);

  // Calculate positions for each emotion cluster
  const positions: PhotoPosition[] = [];

  Object.entries(photosByEmotion).forEach(([emotion, emotionPhotos]) => {
    const totalInCluster = emotionPhotos.length;

    // Sort by emotional_impact (highest first) for better visual hierarchy
    const sortedPhotos = [...emotionPhotos].sort(
      (a, b) => b.emotional_impact - a.emotional_impact
    );

    // Position each photo in the cluster
    sortedPhotos.forEach((photo, index) => {
      const photoPosition = calculatePhotoPosition(photo, index, totalInCluster);
      positions.push(photoPosition);
    });
  });

  return positions;
}

/**
 * Check if two positions are too close (potential overlap)
 * Used for collision detection
 *
 * @param pos1 - First position
 * @param pos2 - Second position
 * @param minDistance - Minimum allowed distance (default: 25 units)
 * @returns true if positions overlap
 */
export function checkPositionOverlap(
  pos1: Vector3,
  pos2: Vector3,
  minDistance: number = 25
): boolean {
  return pos1.distanceTo(pos2) < minDistance;
}

/**
 * Get photos within a certain distance from a point
 * Used for proximity-based interactions (e.g., magnetic drift)
 *
 * @param positions - All photo positions
 * @param targetPoint - Point to measure distance from
 * @param maxDistance - Maximum distance to include (default: 100 units)
 * @returns Array of photo positions within range
 */
export function getPhotosNearPoint(
  positions: PhotoPosition[],
  targetPoint: Vector3,
  maxDistance: number = 100
): PhotoPosition[] {
  return positions.filter(
    (photoPos) => photoPos.position.distanceTo(targetPoint) <= maxDistance
  );
}
