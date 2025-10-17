/**
 * Gallery Components - Export all gallery-related components
 *
 * Components:
 * - PhotoParticle: Single photo as 3D plane with magnetic drift
 * - PhotoParticleSystem: Manager for 100-500 photo particles with LOD
 * - PhotoDetailOverlay: 2D overlay for photo detail view
 */

export { PhotoParticle } from './PhotoParticle';
export type { PhotoParticleProps } from './PhotoParticle';

export { PhotoParticleSystem } from './PhotoParticleSystem';
export type { Photo, PhotoParticleSystemProps } from './PhotoParticleSystem';

export { PhotoDetailOverlay } from './PhotoDetailOverlay';
export type { PhotoDetailData, PhotoDetailOverlayProps } from './PhotoDetailOverlay';
