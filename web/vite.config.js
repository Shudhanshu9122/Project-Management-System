import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Fail loudly instead of silently hopping to another port, because the
    // backend's CORS allow-list names this origin.
    strictPort: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
});
