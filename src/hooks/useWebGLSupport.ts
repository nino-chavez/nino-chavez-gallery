/**
 * Hook to detect WebGL support in the browser
 * Returns true if WebGL is available, false otherwise
 */

import { useEffect, useState } from 'react';

export function useWebGLSupport(): boolean | null {
  const [isSupported, setIsSupported] = useState<boolean | null>(null);

  useEffect(() => {
    try {
      // Create a canvas element to test WebGL support
      const canvas = document.createElement('canvas');

      // Try to get WebGL context (try both webgl2 and webgl)
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');

      if (gl && gl instanceof WebGLRenderingContext || gl instanceof WebGL2RenderingContext) {
        setIsSupported(true);
      } else {
        setIsSupported(false);
      }

      // Clean up
      const loseContext = gl?.getExtension('WEBGL_lose_context');
      if (loseContext) {
        loseContext.loseContext();
      }
    } catch (error) {
      console.warn('WebGL detection failed:', error);
      setIsSupported(false);
    }
  }, []);

  return isSupported;
}
