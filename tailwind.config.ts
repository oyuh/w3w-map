import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        mono: ['"JetBrains Mono"', '"Fira Code"', '"SF Mono"', 'Consolas', 'monospace'],
      },
      colors: {
        brutal: {
          accent: '#ff0000',
          bg: '#0a0a0a',
          panel: '#111111',
          surface: '#1a1a1a',
          text: '#cccccc',
          muted: '#777777',
          dim: '#444444',
          border: '#2a2a2a',
          highlight: '#333333',
        },
      },
    },
  },
  plugins: [],
};
export default config;
