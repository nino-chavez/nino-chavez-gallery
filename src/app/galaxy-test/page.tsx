'use client';

/**
 * Test page for EmotionGalaxy3D component
 * This page can be accessed at /galaxy-test to verify the 3D visualization works
 */

import { EmotionGalaxy3D } from '@/components/galaxy';

export default function GalaxyTestPage() {
  return (
    <main className="min-h-screen bg-gray-950">
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold text-gray-100 mb-4">
          Emotion Galaxy 3D Test
        </h1>
        <p className="text-gray-400 mb-8">
          Testing the 3D visualization infrastructure. You should see a rotating wireframe cube and camera controls.
        </p>

        <div className="w-full h-[600px] rounded-lg overflow-hidden border border-gray-800">
          <EmotionGalaxy3D />
        </div>

        <div className="mt-8 p-4 bg-gray-900 rounded-lg border border-gray-800">
          <h2 className="text-xl font-semibold text-gray-100 mb-2">
            Expected Behavior:
          </h2>
          <ul className="text-gray-400 space-y-1 list-disc list-inside">
            <li>A 3D wireframe cube should be visible in the center</li>
            <li>You should be able to drag to rotate the view</li>
            <li>Scroll to zoom in/out should work</li>
            <li>Right-click + drag to pan should work</li>
            <li>If WebGL is not supported, you'll see a warning message</li>
          </ul>
        </div>
      </div>
    </main>
  );
}
