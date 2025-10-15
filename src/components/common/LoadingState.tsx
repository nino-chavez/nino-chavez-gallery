'use client';

import { motion } from 'framer-motion';

interface LoadingStateProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function LoadingState({ message = 'Loading...', size = 'md' }: LoadingStateProps) {
  const sizeClasses = {
    sm: 'text-3xl',
    md: 'text-6xl',
    lg: 'text-8xl',
  };

  return (
    <div className="flex flex-col items-center justify-center py-20">
      <motion.div
        className={`${sizeClasses[size]} mb-4`}
        animate={{ rotate: 360 }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'linear',
        }}
      >
        ⏳
      </motion.div>
      <p className="text-gray-600">{message}</p>
    </div>
  );
}

export function SkeletonGrid({ count = 12 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="skeleton-card">
          <div className="relative overflow-hidden rounded-lg bg-gray-200 aspect-[4/3]">
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
        </div>
      ))}
    </div>
  );
}

export function LoadingBar({ progress }: { progress: number }) {
  return (
    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
      <motion.div
        className="h-full bg-black"
        initial={{ width: 0 }}
        animate={{ width: `${progress}%` }}
        transition={{ duration: 0.3 }}
      />
    </div>
  );
}