/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./screens/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        primary: '#090F43',      // Dark blue
        accent: '#FF3131',       // Bright red
        success: '#4CAF50',      // Green
        background: '#FFFFFF',   // White
        cardLight: '#F5F5F5',    // Light gray
        textPrimary: '#000000',  // Black
        textSecondary: '#666666', // Gray
        backgroundDark: '#000000',
        cardDark: '#1A1A1A',
      },
    },
  },
  plugins: [],
};
