'use client';

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

/**
 * Emotion types based on PhotoMetadata.emotion
 */
export type EmotionType = 'triumph' | 'focus' | 'intensity' | 'determination' | 'excitement' | 'serenity';

/**
 * EmotionContext state interface
 */
interface EmotionContextState {
  activeEmotion: EmotionType | null;
  setActiveEmotion: (emotion: EmotionType | null) => void;
  clearEmotion: () => void;
}

/**
 * EmotionContext for tracking active emotion across navigation
 * Task 2.1.1: Create EmotionContext provider
 *
 * Acceptance criteria:
 * - Context available in all components
 * - Active emotion persists across page navigation
 * - Session storage syncs with context state
 */
const EmotionContext = createContext<EmotionContextState | undefined>(undefined);

const EMOTION_STORAGE_KEY = 'active-emotion';

interface EmotionProviderProps {
  children: ReactNode;
}

/**
 * EmotionProvider component
 * Wraps the app to provide emotion state across all components
 */
export function EmotionProvider({ children }: EmotionProviderProps) {
  const [activeEmotion, setActiveEmotionState] = useState<EmotionType | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  // Task 2.1.1: Restore emotion from session storage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem(EMOTION_STORAGE_KEY);
      if (stored && isValidEmotion(stored)) {
        setActiveEmotionState(stored as EmotionType);
      }
      setIsHydrated(true);
    }
  }, []);

  // Task 2.1.1: Sync emotion changes to session storage
  const setActiveEmotion = (emotion: EmotionType | null) => {
    setActiveEmotionState(emotion);
    if (typeof window !== 'undefined') {
      if (emotion) {
        sessionStorage.setItem(EMOTION_STORAGE_KEY, emotion);
      } else {
        sessionStorage.removeItem(EMOTION_STORAGE_KEY);
      }
    }
  };

  const clearEmotion = () => {
    setActiveEmotion(null);
  };

  const value: EmotionContextState = {
    activeEmotion,
    setActiveEmotion,
    clearEmotion,
  };

  // Prevent hydration mismatch by not rendering children until hydrated
  if (!isHydrated) {
    return null;
  }

  return (
    <EmotionContext.Provider value={value}>
      {children}
    </EmotionContext.Provider>
  );
}

/**
 * Hook to use EmotionContext
 * Throws error if used outside of EmotionProvider
 */
export function useEmotion() {
  const context = useContext(EmotionContext);
  if (context === undefined) {
    throw new Error('useEmotion must be used within EmotionProvider');
  }
  return context;
}

/**
 * Validates if a string is a valid emotion type
 */
function isValidEmotion(value: string): boolean {
  const validEmotions: EmotionType[] = [
    'triumph',
    'focus',
    'intensity',
    'determination',
    'excitement',
    'serenity',
  ];
  return validEmotions.includes(value as EmotionType);
}
