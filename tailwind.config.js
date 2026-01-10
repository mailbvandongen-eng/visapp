/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Archaeological colors
        'gps-blue': '#4285f4',
        'rce-blue': '#0078d4',
        'amk': {
          light: '#c4b5fd',
          medium: '#8b5cf6',
          dark: '#6d28d9',
          darker: '#4c1d95',
        },
        'archis-purple': '#7c3aed',
        'permission-green': '#22c55e',
        'roman-red': '#dc2626',
        gray: {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
        }
      },
      fontSize: {
        'xxs': '10px',
        'xs': '11px',
        'sm': '12px',
        'base': '13px',
        'lg': '14px',
      },
      boxShadow: {
        'control': 'var(--shadow-control)',
        'panel': 'var(--shadow-panel)',
        'gps-active': '0 0 0 4px var(--color-gps-active)',
      },
      zIndex: {
        'control': '1000',
      }
    },
  },
  plugins: [],
  corePlugins: {
    preflight: false, // KRITIEK - voorkomt conflicts met OpenLayers CSS
  },
}
