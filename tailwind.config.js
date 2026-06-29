/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        accent: { DEFAULT: '#4F46E5', hover: '#4338CA', active: '#3730A3', subtle: '#EEF2FF' },
        success: { DEFAULT: '#10B981', subtle: '#ECFDF5' },
        warning: { DEFAULT: '#F59E0B', subtle: '#FFFBEB' },
        danger:  { DEFAULT: '#EF4444', subtle: '#FEF2F2' },
        border:  { DEFAULT: '#E2E8F0', strong: '#CBD5E1' },
        surface: { DEFAULT: '#F8FAFC' },
        ink:     { DEFAULT: '#0F172A', muted: '#64748B', subtle: '#94A3B8' },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      borderRadius: { card: '12px', input: '8px', badge: '20px' },
      boxShadow: {
        xs:     '0 1px 2px 0 rgba(15,23,42,0.04)',
        sm:     '0 1px 3px 0 rgba(15,23,42,0.06)',
        md:     '0 4px 12px -2px rgba(15,23,42,0.08)',
        lg:     '0 12px 32px -8px rgba(15,23,42,0.12)',
        accent: '0 8px 24px -6px rgba(79,70,229,0.35)',
        focus:  '0 0 0 3px rgba(79,70,229,0.18)',
      },
    },
  },
  plugins: [],
};
