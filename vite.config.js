import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // Relative asset paths let the same build work at / and at /loop/.
  base: './',
  plugins: [react()],
});
