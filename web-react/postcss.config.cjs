module.exports = {
  plugins: {
    'tailwindcss/nesting': {},
    tailwindcss: require.resolve('tailwindcss'),
    autoprefixer: {
      // Use standard configuration instead of path-based config
      overrideBrowserslist: [
        '>0.2%',
        'not dead', 
        'not op_mini all',
        'last 2 versions'
      ]
    }
  },
}
