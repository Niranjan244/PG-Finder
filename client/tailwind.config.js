/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        theme: {
          bg: 'var(--color-bg)',
          surface: 'var(--color-surface)',
          'surface-hover': 'var(--color-surface-hover)',
          'surface-subtle': 'var(--color-surface-subtle)',
          border: 'var(--color-border)',
          'border-subtle': 'var(--color-border-subtle)',
          primary: 'var(--color-text-primary)',
          secondary: 'var(--color-text-secondary)',
          muted: 'var(--color-text-muted)',
          brand: 'var(--color-brand)',
          'brand-hover': 'var(--color-brand-hover)',
          'brand-subtle': 'var(--color-brand-subtle)',
          'brand-text': 'var(--color-brand-text)',
          success: 'var(--color-success)',
          'success-subtle': 'var(--color-success-subtle)',
          'success-text': 'var(--color-success-text)',
          warning: 'var(--color-warning)',
          'warning-subtle': 'var(--color-warning-subtle)',
          'warning-text': 'var(--color-warning-text)',
          error: 'var(--color-error)',
          'error-subtle': 'var(--color-error-subtle)',
          'error-text': 'var(--color-error-text)',
        },
        brand: {
          50: '#f0f7ff',
          100: '#e0effe',
          200: '#bae0fd',
          300: '#7cc7fb',
          400: '#38a8f8',
          500: '#0e8ce9',
          600: '#026fc7',
          700: '#0358a1',
          800: '#074b85',
          900: '#0c3f6e',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
