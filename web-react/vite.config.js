// Simple vite.config.js without TypeScript for Vercel deployment
export default {
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (path) => path,
      },
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    minify: true,
  }
};
