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
          DEFAULT: '#4F46E5', // Primary accent (indigo-600) - WCAG AA compliant
          primary: '#4F46E5',
          secondary: '#4338CA', // Darker shade for hovers (indigo-700)
          hover: '#4338CA',
          subtle: 'rgba(79, 70, 229, 0.1)',
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
  plugins: [
    // Task 1.2.2: Screen reader only utility for accessible hidden content
    function({ addUtilities }: { addUtilities: Function }) {
      addUtilities({
        '.sr-only': {
          position: 'absolute',
          width: '1px',
          height: '1px',
          padding: '0',
          margin: '-1px',
          overflow: 'hidden',
          clip: 'rect(0, 0, 0, 0)',
          whiteSpace: 'nowrap',
          borderWidth: '0',
        },
        '.sr-only-focusable:focus': {
          position: 'static',
          width: 'auto',
          height: 'auto',
          padding: 'inherit',
          margin: 'inherit',
          overflow: 'visible',
          clip: 'auto',
          whiteSpace: 'normal',
        },
      });
    },
  ],
};
export default config;
