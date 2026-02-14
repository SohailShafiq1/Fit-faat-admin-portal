import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  base: '/',           // 🔥 important for Netlify
  plugins: [react()],
});
