import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Vite development server on port 5173.
// In production, Vercel serves the generated "dist" folder.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: false,
  },
});
