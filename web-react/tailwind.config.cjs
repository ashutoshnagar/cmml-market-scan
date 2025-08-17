/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Piramal Finance theme colors
        primary: {
          DEFAULT: '#1E4A73', // Piramal corporate blue
          hover: '#0B2F5C',   // Darker blue for hover
          light: '#DBEAFE',   // Light blue for backgrounds
        },
        text: {
          primary: '#111827',   // Dark text
          secondary: '#6B7280', // Muted text
        },
        border: '#E5E7EB',      // Light borders
        background: '#FFFFFF',  // Clean white
        surface: '#F9FAFB',     // Subtle gray
        success: '#10B981',     // Green for completed
        warning: '#F59E0B',     // Orange for processing
        error: '#EF4444',       // Red for errors
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
