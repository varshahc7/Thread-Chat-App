const c = (v) => `rgb(var(--${v}) / <alpha-value>)`
/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: { sans: ['"Manrope Variable"', 'ui-sans-serif', 'system-ui', 'sans-serif'] },
      colors: {
        bg: c('bg'), surface: c('surface'), raised: c('raised'), line: c('line'), ink: c('ink'), muted: c('muted'),
        accent: c('accent'), 'accent-fg': c('accent-fg'), out: c('out'), 'out-fg': c('out-fg'), inb: c('inb'),
      },
      keyframes: {
        pop: { '0%': { opacity: 0, transform: 'translateY(6px) scale(.98)' }, '100%': { opacity: 1, transform: 'none' } },
        fade: { from: { opacity: 0 }, to: { opacity: 1 } },
        slideIn: { from: { opacity: 0, transform: 'translateX(24px)' }, to: { opacity: 1, transform: 'none' } },
        dot: { '0%,80%,100%': { transform: 'translateY(0)', opacity: 0.4 }, '40%': { transform: 'translateY(-3px)', opacity: 1 } },
        shimmer: { '100%': { transform: 'translateX(100%)' } },
      },
      animation: {
        pop: 'pop .18s ease-out', fade: 'fade .15s ease-out', slideIn: 'slideIn .2s ease-out',
        dot: 'dot 1.1s infinite ease-in-out',
      },
    },
  },
  plugins: [],
}
