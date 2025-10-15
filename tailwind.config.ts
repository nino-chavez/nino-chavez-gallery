import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Accent colors for primary interactive elements
        accent: {
          DEFAULT: '#6366F1', // Primary accent (indigo-500)
          primary: '#6366F1',
          secondary: '#4F46E5', // Darker shade for hovers
          hover: '#4F46E5',
          subtle: 'rgba(99, 102, 241, 0.1)',
        },

        // Emotion palette tokens (from motion-tokens.ts)
        emotion: {
          triumph: {
            DEFAULT: '#FFD700',
            primary: '#FFD700',
            secondary: '#FFA500',
          },
          focus: {
            DEFAULT: '#4169E1',
            primary: '#4169E1',
            secondary: '#1E90FF',
          },
          intensity: {
            DEFAULT: '#FF4500',
            primary: '#FF4500',
            secondary: '#DC143C',
          },
          determination: {
            DEFAULT: '#DC143C',
            primary: '#DC143C',
            secondary: '#8B0000',
          },
          excitement: {
            DEFAULT: '#FF69B4',
            primary: '#FF69B4',
            secondary: '#FF1493',
          },
          serenity: {
            DEFAULT: '#87CEEB',
            primary: '#87CEEB',
            secondary: '#4682B4',
          },
        },
      },
    },
  },
  plugins: [],
};
export default config;
