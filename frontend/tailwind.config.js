// tailwind.config.js
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'primary-purple': '#9b4dff',
        'primary-purple-light': '#F9F5FF',
        'text-dark': '#101828',
        'text-light': '#475467',
        'white': '#FFFFFF',
        'black': '#000000',
        'border-light': '#EAECF0',
        'grey-dark': '#344054',
        'background-light': '#ffffff',
        
        'background-dark': '#000000',
        'dark-primary-purple-light': '#2a2140',
        'dark-text-dark': '#F9FAFB',
        'dark-text-light': '#9CA3AF',
        'dark-white': '#0c0c0f',
        'dark-border-light': '#374151',
        'dark-grey-dark': '#E5E7EB',

        'bg-primary': '#121212',
        'bg-panel': '#1E1E1E',
        'text-primary': '#EAEAEA',
        'text-secondary': '#a0a0a0',
        'border-color': '#333333',
        'accent-text': '#FFFFFF',
        'btn-primary': '#FFFFFF',
        'btn-text': '#121212',
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'sans-serif'],
      },
      keyframes: {
        'toast-fadein': {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'toast-fadeout': {
          '0%': { transform: 'translateY(0)', opacity: '1' },
          '100%': { transform: 'translateY(100%)', opacity: '0' },
        },
        "accordion-down": {
          from: { height: 0 },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: 0 },
        },
        "float": {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        }
      },
      animation: {
        'toast-fadein': 'toast-fadein 0.3s ease-out forwards',
        'toast-fadeout': 'toast-fadeout 0.4s ease-in forwards',
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "float": "float 10s ease-in-out infinite",
        "float-slow": "float 12s ease-in-out infinite",
        "float-fast": "float 8s ease-in-out infinite",
      },
    },
  },
  plugins: [],
}
