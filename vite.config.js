// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          ui: ['tailwindcss'],
        },
      },
    },
  },
  server: {
    port: 3000,
    host: true,
  },
  // You can add additional config here if needed (e.g., define aliases or base path).
  // Since we plan to deploy to Vercel at root, no base path is necessary.
});
// Vite configuration