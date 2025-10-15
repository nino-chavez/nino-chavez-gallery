'use client';

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

interface LazyImageProps {
  src: string;
  alt: string;
  quality?: number;
  className?: string;
  priority?: boolean;
}

export function LazyImage({ src, alt, quality = 0, className = '', priority = false }: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (priority) {
      // Load immediately for priority images
      const img = new Image();
      img.src = src;
      img.onload = () => setIsLoaded(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          const img = new Image();
          img.src = src;
          img.onload = () => setIsLoaded(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' } // Load 200px before entering viewport
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [src, priority]);

  return (
    <motion.div
      ref={imgRef}
      className={`relative overflow-hidden ${className}`}
      animate={{
        filter: `brightness(${0.5 + (quality / 10) * 0.5})`,
      }}
    >
      {!isLoaded && (
        <div className="absolute inset-0 bg-gray-200">
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200"
            animate={{
              x: ['0%', '100%'],
            }}
            transition={{
              repeat: Infinity,
              duration: 1.5,
              ease: 'linear',
            }}
          />
        </div>
      )}

      <motion.img
        src={isLoaded ? src : undefined}
        alt={alt}
        className="w-full h-full object-cover"
        initial={{ opacity: 0 }}
        animate={{ opacity: isLoaded ? 1 : 0 }}
        transition={{ duration: 0.3 }}
        loading={priority ? 'eager' : 'lazy'}
      />
    </motion.div>
  );
}