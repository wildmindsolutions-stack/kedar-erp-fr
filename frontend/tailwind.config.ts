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
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        kedar: {
          navy: '#0B2447',
          'navy-light': '#12325f',
          'navy-dark': '#061a33',
          gold: '#D4AF37',
          'gold-light': '#E8C96A',
          'gold-dark': '#B8942E',
          cream: '#FAF7F0',
          wheat: '#E8D5A3',
        },
      },
      boxShadow: {
        gold: '0 4px 20px rgba(212, 175, 55, 0.25)',
      },
    },
  },
  plugins: [],
};
export default config;
