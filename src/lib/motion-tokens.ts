/**
 * Unified motion design tokens
 * Used across all animated components for consistency
 */

export const MOTION = {
  spring: {
    gentle: { type: 'spring' as const, stiffness: 120, damping: 14 },
    responsive: { type: 'spring' as const, stiffness: 300, damping: 30 },
    snappy: { type: 'spring' as const, stiffness: 400, damping: 25 },
  },

  duration: {
    instant: 0.1,
    fast: 0.2,
    base: 0.3,
    slow: 0.5,
    slower: 0.8,
  },

  ease: {
    easeOut: [0.16, 1, 0.3, 1] as const,
    easeInOut: [0.87, 0, 0.13, 1] as const,
    anticipate: [0.68, -0.55, 0.27, 1.55] as const,
  },
};

export const EMOTION_PALETTE = {
  triumph: {
    primary: '#FFD700',
    gradient: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
    glow: '0 0 40px rgba(255, 215, 0, 0.4)',
  },
  focus: {
    primary: '#4169E1',
    gradient: 'linear-gradient(135deg, #4169E1 0%, #1E90FF 100%)',
    glow: '0 0 40px rgba(65, 105, 225, 0.4)',
  },
  intensity: {
    primary: '#FF4500',
    gradient: 'linear-gradient(135deg, #FF4500 0%, #DC143C 100%)',
    glow: '0 0 40px rgba(255, 69, 0, 0.4)',
  },
  determination: {
    primary: '#DC143C',
    gradient: 'linear-gradient(135deg, #DC143C 0%, #8B0000 100%)',
    glow: '0 0 40px rgba(220, 20, 60, 0.4)',
  },
  excitement: {
    primary: '#FF69B4',
    gradient: 'linear-gradient(135deg, #FF69B4 0%, #FF1493 100%)',
    glow: '0 0 40px rgba(255, 105, 180, 0.4)',
  },
  serenity: {
    primary: '#87CEEB',
    gradient: 'linear-gradient(135deg, #87CEEB 0%, #4682B4 100%)',
    glow: '0 0 40px rgba(135, 206, 235, 0.4)',
  },
};

export const EMOTION_ICONS = {
  triumph: '🏆',
  focus: '🎯',
  intensity: '🔥',
  determination: '💪',
  excitement: '⚡',
  serenity: '🧘',
};

export const PLAY_TYPE_ICONS = {
  attack: '⚡',
  block: '🛡️',
  dig: '🤿',
  set: '🎯',
  serve: '🎾',
  pass: '🤲',
  celebration: '🎉',
  timeout: '⏸️',
};