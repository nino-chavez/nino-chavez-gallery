/**
 * Camera Flight Animations for Emotion Galaxy 3D
 *
 * Provides smooth camera movement animations using GSAP for the 3D galaxy visualization.
 * Handles:
 * - Flying to emotion orbs (focus on specific emotion cluster)
 * - Flying to individual photos (detail view)
 * - Returning to default view (reset camera)
 * - Following story paths (visiting photos in sequence)
 * - Interruptible animations (new flight cancels previous)
 *
 * Technical Details:
 * - Uses GSAP for smooth animations with power2.inOut easing
 * - Updates camera lookAt during flight for smooth transitions
 * - Integrates with OrbitControls (disables during flight, re-enables after)
 * - Animation duration: 1.5s for orbs, 1s for photos
 * - Default camera position: (0, 0, 500)
 */

import gsap from 'gsap';
import { Camera, Vector3 } from 'three';

/**
 * Configuration for camera flight animations
 */
export const CAMERA_FLIGHT_CONFIG = {
  /** Duration for emotion orb flights (seconds) */
  orbFlightDuration: 1.5,
  /** Duration for photo flights (seconds) */
  photoFlightDuration: 1.0,
  /** Duration for reset flights (seconds) */
  resetFlightDuration: 1.5,
  /** Duration for story path flights (seconds per photo) */
  storyPathFlightDuration: 1.0,
  /** Pause duration at each photo in story path (milliseconds) */
  storyPathPauseDuration: 2000,
  /** GSAP easing function */
  easing: 'power2.inOut',
  /** Default camera position (initial view) */
  defaultPosition: new Vector3(0, 0, 500),
  /** Default lookAt target (origin) */
  defaultLookAt: new Vector3(0, 0, 0),
  /** Distance from orb when flying to emotion (units) */
  orbViewDistance: 150,
  /** Distance from photo when flying to detail view (units) */
  photoViewDistance: 50,
};

/**
 * CameraFlightController - Manages camera animations and OrbitControls state
 *
 * Provides methods to:
 * - Fly camera to target positions smoothly
 * - Update lookAt during flight for smooth transitions
 * - Handle OrbitControls enable/disable
 * - Interrupt ongoing animations
 * - Follow story paths with sequential photo visits
 */
export class CameraFlightController {
  private camera: Camera;
  private controls: any | null;
  private currentAnimation: gsap.core.Tween | null = null;
  private lookAtTarget: Vector3 = CAMERA_FLIGHT_CONFIG.defaultLookAt.clone();
  private storyPathActive: boolean = false;
  private storyPathCancelled: boolean = false;

  constructor(camera: Camera, controls?: any) {
    this.camera = camera;
    this.controls = controls || null;
  }

  /**
   * Set OrbitControls reference (can be set after construction)
   */
  setControls(controls: any | null) {
    this.controls = controls;
  }

  /**
   * Core camera flight animation
   * Moves camera to target position and looks at specified point
   *
   * @param targetPosition - Position to move camera to
   * @param lookAt - Point for camera to look at during and after flight
   * @param duration - Animation duration in seconds
   * @param onComplete - Optional callback when animation completes
   */
  private flyToPosition(
    targetPosition: Vector3,
    lookAt: Vector3,
    duration: number,
    onComplete?: () => void
  ): void {
    // Kill any existing animation to allow interruption
    if (this.currentAnimation) {
      this.currentAnimation.kill();
      this.currentAnimation = null;
    }

    // Disable OrbitControls during flight
    if (this.controls) {
      this.controls.enabled = false;
    }

    // Store lookAt target for onUpdate
    this.lookAtTarget = lookAt.clone();

    // Animate camera position with smooth interpolation
    this.currentAnimation = gsap.to(this.camera.position, {
      x: targetPosition.x,
      y: targetPosition.y,
      z: targetPosition.z,
      duration: duration,
      ease: CAMERA_FLIGHT_CONFIG.easing,
      onUpdate: () => {
        // Update camera lookAt during animation for smooth transition
        this.camera.lookAt(this.lookAtTarget);

        // Update controls target if available
        if (this.controls) {
          this.controls.target.copy(this.lookAtTarget);
          this.controls.update();
        }
      },
      onComplete: () => {
        // Re-enable OrbitControls after flight completes
        if (this.controls) {
          this.controls.enabled = true;
          this.controls.target.copy(this.lookAtTarget);
          this.controls.update();
        }

        this.currentAnimation = null;

        // Call optional completion callback
        if (onComplete) {
          onComplete();
        }
      },
    });
  }

  /**
   * Fly to emotion orb
   * Positions camera 150 units in front of orb, looking at orb center
   *
   * @param orbPosition - Position of the emotion orb in 3D space
   * @param onComplete - Optional callback when animation completes
   *
   * Usage:
   * ```ts
   * controller.flyToEmotion(new Vector3(0, 300, 0)); // Fly to top orb
   * ```
   */
  flyToEmotion(orbPosition: Vector3, onComplete?: () => void): void {
    // Calculate camera position: offset from orb along the direction from origin to orb
    const direction = orbPosition.clone().normalize();
    const offset = direction.multiplyScalar(CAMERA_FLIGHT_CONFIG.orbViewDistance);
    const targetPosition = orbPosition.clone().add(offset);

    // Look at orb center
    const lookAt = orbPosition.clone();

    this.flyToPosition(
      targetPosition,
      lookAt,
      CAMERA_FLIGHT_CONFIG.orbFlightDuration,
      onComplete
    );
  }

  /**
   * Fly to photo for detail view
   * Positions camera 50 units in front of photo, looking at photo center
   *
   * @param photoPosition - Position of the photo in 3D space
   * @param onComplete - Optional callback when animation completes
   *
   * Usage:
   * ```ts
   * controller.flyToPhoto(new Vector3(100, 50, 200));
   * ```
   */
  flyToPhoto(photoPosition: Vector3, onComplete?: () => void): void {
    // Calculate camera position: move closer to photo along camera's forward direction
    const cameraDirection = new Vector3();
    this.camera.getWorldDirection(cameraDirection);

    // Position camera along the line from photo to current camera direction
    const photoToCamera = this.camera.position.clone().sub(photoPosition).normalize();
    const offset = photoToCamera.multiplyScalar(CAMERA_FLIGHT_CONFIG.photoViewDistance);
    const targetPosition = photoPosition.clone().add(offset);

    // Look at photo center
    const lookAt = photoPosition.clone();

    this.flyToPosition(
      targetPosition,
      lookAt,
      CAMERA_FLIGHT_CONFIG.photoFlightDuration,
      onComplete
    );
  }

  /**
   * Reset camera to default view
   * Returns to initial position (0, 0, 500) looking at origin (0, 0, 0)
   *
   * @param onComplete - Optional callback when animation completes
   *
   * Usage:
   * ```ts
   * controller.resetCamera(); // Return to default view
   * ```
   */
  resetCamera(onComplete?: () => void): void {
    // Cancel any active story path
    this.cancelStoryPath();

    this.flyToPosition(
      CAMERA_FLIGHT_CONFIG.defaultPosition.clone(),
      CAMERA_FLIGHT_CONFIG.defaultLookAt.clone(),
      CAMERA_FLIGHT_CONFIG.resetFlightDuration,
      onComplete
    );
  }

  /**
   * Follow story path - visit each photo in sequence
   * Camera flies to each photo position and pauses for viewing
   *
   * @param photoPositions - Array of photo positions in story order
   * @param pauseDuration - Duration to pause at each photo (milliseconds, default: 2000)
   * @param onPhotoReached - Optional callback when each photo is reached
   * @param onComplete - Optional callback when entire path is complete
   *
   * Usage:
   * ```ts
   * controller.followStoryPath(
   *   [pos1, pos2, pos3],
   *   2000,
   *   (index) => console.log(`Reached photo ${index}`),
   *   () => console.log('Story complete')
   * );
   * ```
   *
   * Keyboard Controls:
   * - Spacebar: Pause/resume story path
   * - Escape: Cancel story path and reset camera
   */
  async followStoryPath(
    photoPositions: Vector3[],
    pauseDuration: number = CAMERA_FLIGHT_CONFIG.storyPathPauseDuration,
    onPhotoReached?: (index: number) => void,
    onComplete?: () => void
  ): Promise<void> {
    if (photoPositions.length === 0) return;

    // Set story path as active
    this.storyPathActive = true;
    this.storyPathCancelled = false;

    // Visit each photo in sequence
    for (let i = 0; i < photoPositions.length; i++) {
      // Check if story path was cancelled
      if (this.storyPathCancelled) {
        this.storyPathActive = false;
        return;
      }

      const position = photoPositions[i];

      // Calculate camera target position (50 units away from photo)
      const photoToCamera = this.camera.position.clone().sub(position).normalize();
      const offset = photoToCamera.multiplyScalar(CAMERA_FLIGHT_CONFIG.photoViewDistance);
      const cameraTarget = position.clone().add(offset);

      // Fly to photo
      await new Promise<void>((resolve) => {
        this.flyToPosition(
          cameraTarget,
          position,
          CAMERA_FLIGHT_CONFIG.storyPathFlightDuration,
          () => {
            // Callback when photo is reached
            if (onPhotoReached) {
              onPhotoReached(i);
            }
            resolve();
          }
        );
      });

      // Check again after flight completes
      if (this.storyPathCancelled) {
        this.storyPathActive = false;
        return;
      }

      // Pause at photo (unless it's the last photo)
      if (i < photoPositions.length - 1) {
        await new Promise<void>((resolve) => setTimeout(resolve, pauseDuration));
      }
    }

    // Story path complete
    this.storyPathActive = false;

    if (onComplete) {
      onComplete();
    }
  }

  /**
   * Cancel active story path
   * Stops the sequential photo visiting
   */
  cancelStoryPath(): void {
    if (this.storyPathActive) {
      this.storyPathCancelled = true;
      this.storyPathActive = false;
    }
  }

  /**
   * Check if camera is following a story path
   */
  isFollowingStoryPath(): boolean {
    return this.storyPathActive;
  }

  /**
   * Stop any ongoing camera animation immediately
   * Re-enables OrbitControls if they were disabled
   */
  stopAnimation(): void {
    if (this.currentAnimation) {
      this.currentAnimation.kill();
      this.currentAnimation = null;
    }

    // Cancel any active story path
    this.cancelStoryPath();

    // Re-enable controls
    if (this.controls) {
      this.controls.enabled = true;
    }
  }

  /**
   * Check if camera is currently animating
   */
  isAnimating(): boolean {
    return this.currentAnimation !== null && this.currentAnimation.isActive();
  }

  /**
   * Get current lookAt target
   */
  getLookAtTarget(): Vector3 {
    return this.lookAtTarget.clone();
  }
}

/**
 * Helper function to create a CameraFlightController instance
 *
 * @param camera - Three.js camera instance
 * @param controls - Optional OrbitControls instance
 * @returns CameraFlightController instance
 *
 * Usage:
 * ```ts
 * const controller = createCameraFlightController(camera, controls);
 * controller.flyToEmotion(orbPosition);
 * ```
 */
export function createCameraFlightController(
  camera: Camera,
  controls?: any
): CameraFlightController {
  return new CameraFlightController(camera, controls);
}
