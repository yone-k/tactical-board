module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8'
        },
        red: {
          team: '#ef4444'
        },
        blue: {
          team: '#3b82f6'
        }
      }
    },
  },
  plugins: [],
}